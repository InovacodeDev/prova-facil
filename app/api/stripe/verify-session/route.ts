/**
 * API Route: Verify Checkout Session
 *
 * Verifica o status de uma sessão de checkout do Stripe
 * e atualiza o perfil do usuário com a subscription ID.
 *
 * NOVA ARQUITETURA:
 * - A Stripe é a fonte da verdade para dados de assinatura
 * - O banco armazena apenas: stripe_subscription_id, stripe_customer_id, e plan (cache)
 * - Dados completos (datas, status, etc) são sempre buscados da Stripe via API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionData } from '@/lib/stripe/subscription-helper';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Schema de validação
const VerifySessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID é obrigatório'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validar entrada
    const body = await request.json();
    const validation = VerifySessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 });
    }

    const { sessionId } = validation.data;

    // 2. Autenticar usuário
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 3. Buscar sessão no Stripe
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });
    } catch (stripeError: any) {
      console.error('Erro ao buscar sessão no Stripe:', stripeError);
      return NextResponse.json({ error: 'Sessão de checkout não encontrada' }, { status: 404 });
    }

    // 4. Verificar se a sessão pertence ao usuário autenticado
    if (session.metadata?.userId !== user.id) {
      console.error('Tentativa de verificar sessão de outro usuário', {
        sessionUserId: session.metadata?.userId,
        authenticatedUserId: user.id,
      });
      return NextResponse.json({ error: 'Esta sessão não pertence a você' }, { status: 403 });
    }

    // 5. Verificar status da sessão
    if (session.status !== 'complete') {
      return NextResponse.json({
        success: false,
        status: session.status,
        message: 'Pagamento ainda não foi concluído',
      });
    }

    // 6. Verificar status do pagamento
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        status: session.status,
        paymentStatus: session.payment_status,
        message: 'Pagamento não foi confirmado',
      });
    }

    // 7. Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, plan, user_id, stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil:', profileError);
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // 8. Extrair subscription_id da sessão
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    if (!subscriptionId) {
      console.error('Subscription ID não encontrado na sessão');
      return NextResponse.json({ error: 'Assinatura não encontrada na sessão' }, { status: 404 });
    }

    // 9. Buscar dados completos da subscription da Stripe usando o helper
    const subscriptionData = await getSubscriptionData(subscriptionId);

    if (!subscriptionData) {
      console.error('Erro ao buscar dados da subscription da Stripe');
      return NextResponse.json({ error: 'Erro ao buscar dados da assinatura' }, { status: 500 });
    }

    // 10. Extrair customer_id da sessão
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer não encontrado na sessão' }, { status: 404 });
    }

    // 11. Atualizar perfil com subscription_id e customer_id (fonte da verdade na Stripe)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: subscriptionData.planId, // Cache para queries rápidas
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar perfil do usuário' }, { status: 500 });
    }

    // 12. Criar registro histórico da subscription
    const { error: subscriptionInsertError } = await supabase.from('subscriptions').insert({
      user_id: profile.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscriptionData.priceId,
      status: subscriptionData.status,
      plan_id: subscriptionData.planId,
      event_type: 'created',
    });

    if (subscriptionInsertError) {
      console.error('Erro ao criar registro de subscription:', subscriptionInsertError);
      // Não falhar a operação por erro no histórico
    }

    console.log(`Sessão verificada e perfil atualizado para usuário ${user.id} - plano: ${subscriptionData.planId}`);

    // 13. Retornar sucesso com dados da subscription
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionData.id,
        status: subscriptionData.status,
        planId: subscriptionData.planId,
      },
      message: 'Assinatura ativada com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro ao verificar sessão:', error);

    // Log do erro
    try {
      const supabase = await createClient();
      await supabase.from('error_logs').insert({
        message: error.message || 'Erro ao verificar sessão de checkout',
        stack: error.stack,
        level: 'error',
        context: {
          endpoint: '/api/stripe/verify-session',
          method: 'POST',
        },
      });
    } catch (logError) {
      console.error('Erro ao logar erro:', logError);
    }

    return NextResponse.json({ error: 'Erro interno ao verificar sessão', details: error.message }, { status: 500 });
  }
}
