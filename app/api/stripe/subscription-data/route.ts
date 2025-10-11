/**
 * API Endpoint: Buscar dados da subscription do Stripe
 *
 * GET /api/stripe/subscription-data?subscriptionId=sub_...
 *
 * Retorna os dados completos da subscription a partir do Stripe.
 * A Stripe é a fonte da verdade para dados de assinatura.
 *
 * Security:
 * - Requer autenticação
 * - Valida ownership (subscription pertence ao usuário)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionData } from '@/lib/stripe/subscription-helper';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. Obter subscriptionId dos parâmetros
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId é obrigatório' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 3. Verificar se a subscription pertence ao usuário
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id);

    if (profileError) {
      console.error('[subscription-data] Erro ao buscar profile:', profileError);
      return NextResponse.json(
        { error: 'Erro ao buscar perfil' },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!profiles || profiles.length === 0) {
      console.error('[subscription-data] Perfil não encontrado para usuário:', user.id);
      return NextResponse.json(
        { error: 'Perfil não encontrado. Por favor, complete seu cadastro.' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const profile = profiles[0];

    if (profile.stripe_subscription_id !== subscriptionId) {
      console.error('[subscription-data] Tentativa de acesso a subscription de outro usuário', {
        userId: user.id,
        requestedSubscriptionId: subscriptionId,
        userSubscriptionId: profile.stripe_subscription_id,
      });
      return NextResponse.json(
        { error: 'Acesso negado' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 4. Buscar dados da Stripe
    const subscriptionData = await getSubscriptionData(subscriptionId);

    if (!subscriptionData) {
      return NextResponse.json(
        { error: 'Subscription não encontrada na Stripe' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 5. Retornar dados com headers apropriados
    return NextResponse.json(
      { subscription: subscriptionData },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[subscription-data] Erro ao buscar dados da subscription:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados da subscription' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
