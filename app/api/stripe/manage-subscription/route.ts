/**
 * API Endpoint: Gerenciamento de Assinaturas
 *
 * POST /api/stripe/manage-subscription
 *
 * Permite upgrade, downgrade, cancelamento e reativação de assinaturas.
 *
 * Body:
 * {
 *   action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate',
 *   newPlan?: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced',
 *   billingInterval?: 'monthly' | 'annual', // Intervalo de cobrança (padrão: monthly)
 *   immediate?: boolean // Para downgrade: se true, aplica imediatamente (com proration)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PlanType } from '@/db/schema';
import {
  changePlan,
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  calculateProration,
} from '@/lib/stripe/subscription-management';
import { getSubscriptionData } from '@/lib/stripe/subscription-helper';

type BillingInterval = 'monthly' | 'annual';

// Mapeamento de planos para price IDs do Stripe (Mensal e Anual)
const PLAN_TO_PRICE_ID: Record<keyof typeof PlanType, Record<BillingInterval, string>> = {
  starter: {
    monthly: '', // Plano gratuito não tem price
    annual: '',
  },
  basic: {
    monthly: process.env.STRIPE_PRICE_ID_BASIC_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ID_BASIC_ANNUAL || '',
  },
  essentials: {
    monthly: process.env.STRIPE_PRICE_ID_ESSENTIALS_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ID_ESSENTIALS_ANNUAL || '',
  },
  plus: {
    monthly: process.env.STRIPE_PRICE_ID_PLUS_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ID_PLUS_ANNUAL || '',
  },
  advanced: {
    monthly: process.env.STRIPE_PRICE_ID_ADVANCED_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ID_ADVANCED_ANNUAL || '',
  },
};

type ActionType = 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';

interface RequestBody {
  action: ActionType;
  newPlan?: keyof typeof PlanType;
  billingInterval?: BillingInterval;
  immediate?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Validar body
    const body = (await request.json()) as RequestBody;
    const { action, newPlan, billingInterval = 'monthly', immediate = false } = body;

    if (!action || !['upgrade', 'downgrade', 'cancel', 'reactivate'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    if ((action === 'upgrade' || action === 'downgrade') && !newPlan) {
      return NextResponse.json({ error: 'newPlan é obrigatório para upgrade/downgrade' }, { status: 400 });
    }

    if (billingInterval && !['monthly', 'annual'].includes(billingInterval)) {
      return NextResponse.json({ error: 'billingInterval deve ser "monthly" ou "annual"' }, { status: 400 });
    }

    // 3. Buscar profile do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, plan')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.log({ profileError, profile });
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Usuário não possui um customer ID do Stripe' }, { status: 400 });
    }

    const currentPlan = profile.plan;

    // 4. Buscar assinatura ativa no Stripe (fonte da verdade)
    const { stripe } = await import('@/lib/stripe/stripe.service');

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (!subscriptions.data || subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada no Stripe' }, { status: 404 });
    }

    const activeSubscription = subscriptions.data[0];
    const subscriptionId = activeSubscription.id;

    // 5. Processar ação
    let result;

    switch (action) {
      case 'cancel':
        result = await cancelSubscriptionAtPeriodEnd(subscriptionId);

        // Atualizar banco
        if (result.success) {
          await supabase.from('profiles').update({ plan: 'starter' }).eq('id', user.id);
        }
        break;

      case 'reactivate':
        result = await reactivateSubscription(subscriptionId);

        // Buscar subscription atualizada
        if (result.success) {
          const subData = await getSubscriptionData(subscriptionId);
          if (subData) {
            await supabase.from('profiles').update({ plan: subData.planId }).eq('id', user.id);
          }
        }
        break;

      case 'upgrade':
      case 'downgrade': {
        if (!newPlan) {
          return NextResponse.json({ error: 'newPlan é obrigatório' }, { status: 400 });
        }

        // Obter o price ID correto baseado no plano e intervalo de cobrança
        const priceIdMap = PLAN_TO_PRICE_ID[newPlan];
        const newPriceId = priceIdMap[billingInterval];

        if (!newPriceId && newPlan !== 'starter') {
          return NextResponse.json(
            {
              error: `Price ID não configurado para o plano ${newPlan} com intervalo ${billingInterval}`,
              details: `Verifique a variável STRIPE_PRICE_ID_${newPlan.toUpperCase()}_${billingInterval.toUpperCase()}`,
            },
            { status: 500 }
          );
        }

        // Calcular proration se for upgrade
        let prorationAmount: number | null = null;
        if (action === 'upgrade') {
          prorationAmount = await calculateProration(subscriptionId, newPriceId);
        }

        // Mudar plano
        result = await changePlan(subscriptionId, currentPlan as keyof typeof PlanType, newPlan, newPriceId, immediate);

        // Atualizar banco se mudança foi imediata
        if (result.success && result.effectiveDate && result.effectiveDate <= new Date()) {
          await supabase.from('profiles').update({ plan: newPlan }).eq('id', user.id);
        }

        // Adicionar valor de proration à resposta
        if (prorationAmount !== null) {
          result.prorationAmount = prorationAmount;
        }
        break;
      }
    }

    // 5. Retornar resultado
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        effectiveDate: result.effectiveDate,
        prorationAmount: result.prorationAmount,
        subscription: result.subscription,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erro ao gerenciar subscription:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
