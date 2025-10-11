/**
 * API Route: Get Active Subscription
 *
 * GET /api/stripe/subscription
 *
 * Retorna informações da subscription ativa do usuário autenticado.
 * Busca diretamente do Stripe (fonte única da verdade).
 *
 * Arquitetura:
 * - profiles.stripe_customer_id: único link com Stripe
 * - subscriptions table: apenas audit trail, não consultada aqui
 * - Stripe API: fonte da verdade absoluta
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/stripe.service';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Buscar perfil do usuário (apenas stripe_customer_id e plan)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, plan')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // 3. Se o plano é starter (gratuito), não há subscription
    if (profile.plan === 'starter' || !profile.stripe_customer_id) {
      return NextResponse.json({
        subscription: null,
        message: 'Usuário está no plano gratuito',
      });
    }

    // 4. Buscar subscriptions ativas no Stripe (fonte da verdade)
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 1,
        expand: ['data.items.data.price.product', 'data.customer'],
      });

      // Se não há subscription ativa, retornar null
      if (!subscriptions.data || subscriptions.data.length === 0) {
        // Log de inconsistência: profile tem plano pago mas sem subscription ativa
        await supabase.from('error_logs').insert({
          message: 'Inconsistência: Perfil com plano pago mas sem subscription ativa no Stripe',
          level: 'warn',
          context: {
            endpoint: '/api/stripe/subscription',
            method: 'GET',
            userId: user.id,
            profileId: profile.id,
            plan: profile.plan,
            stripeCustomerId: profile.stripe_customer_id,
          },
        });

        return NextResponse.json({
          subscription: null,
          message: 'Nenhuma subscription ativa encontrada no Stripe',
        });
      }

      const activeSubscription = subscriptions.data[0];

      return NextResponse.json({
        subscription: activeSubscription,
        success: true,
      });
    } catch (stripeError: any) {
      console.error('Erro ao buscar subscription no Stripe:', stripeError);

      // Log do erro
      await supabase.from('error_logs').insert({
        message: stripeError.message || 'Erro ao buscar subscription no Stripe',
        stack: stripeError.stack,
        level: 'error',
        context: {
          endpoint: '/api/stripe/subscription',
          method: 'GET',
          userId: user.id,
          stripeCustomerId: profile.stripe_customer_id,
          errorType: stripeError.type,
          errorCode: stripeError.code,
        },
      });

      return NextResponse.json(
        {
          error: 'Erro ao buscar detalhes da subscription',
          message: stripeError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro geral ao buscar subscription:', error);

    // Log do erro
    try {
      const supabase = await createClient();
      await supabase.from('error_logs').insert({
        message: error.message || 'Erro desconhecido ao buscar subscription',
        stack: error.stack,
        level: 'fatal',
        context: {
          endpoint: '/api/stripe/subscription',
          method: 'GET',
        },
      });
    } catch (logError) {
      console.error('Erro ao logar erro:', logError);
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar requisição',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
