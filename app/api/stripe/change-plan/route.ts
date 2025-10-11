/**
 * API Route: Change Plan
 *
 * Processa mudanças de plano (upgrade/downgrade):
 * - Upgrade: sempre imediato com proration automática do Stripe
 *   * Mantém o ciclo de faturamento original
 *   * Credita dias não utilizados do plano anterior
 *   * Cobra apenas pelos dias restantes do novo plano
 * - Downgrade: sempre agendado para o final do período (sem proration)
 *
 * Ref: https://docs.stripe.com/billing/subscriptions/prorations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isUpgrade,
  isDowngrade,
  schedulePlanChange,
  executeImmediateUpgrade,
  getUpgradeProrationPreview,
} from '@/lib/stripe/plan-change.service';
import { PlanType } from '@/db/schema';
import { z } from 'zod';
import Stripe from 'stripe';

// Schema de validação
const ChangePlanSchema = z.object({
  newPlanId: z.enum(['starter', 'basic', 'essentials', 'plus', 'advanced']),
  billingPeriod: z.enum(['monthly', 'annual']),
  // immediate removido - upgrades são sempre imediatos com proration
});

export async function POST(request: NextRequest) {
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

    // 2. Validar body
    const body = await request.json();
    const validationResult = ChangePlanSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { newPlanId, billingPeriod } = validationResult.data;

    // 3. Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, plan, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 });
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Usuário não possui um customer ID do Stripe' }, { status: 400 });
    }

    const currentPlan = profile.plan as keyof typeof PlanType;

    // 4. Verificar se é uma mudança válida
    if (currentPlan === newPlanId) {
      return NextResponse.json({ error: 'Você já está no plano selecionado' }, { status: 400 });
    }

    // 5. Buscar assinatura ativa no Stripe (fonte da verdade)
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

    // 6. Processar baseado no tipo de mudança
    const upgrading = isUpgrade(currentPlan, newPlanId);
    const downgrading = isDowngrade(currentPlan, newPlanId);

    if (!upgrading && !downgrading) {
      return NextResponse.json({ error: 'Mudança de plano inválida' }, { status: 400 });
    }

    // 7. DOWNGRADE: sempre agendado para o final do período
    if (downgrading) {
      const result = await schedulePlanChange({
        subscriptionId: activeSubscription.id,
        newPlanId,
        billingPeriod,
      });

      const updatedSubscription = result.subscription as Stripe.Subscription;
      const newPriceId = result.newPriceId;

      // Atualizar profile com plano pendente
      const sub = updatedSubscription;
      console.log({ sub });

      // Atualizar audit trail (subscriptions table)
      await supabase.from('subscriptions').insert({
        user_id: profile.id,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_subscription_id: activeSubscription.id,
        stripe_price_id: newPriceId,
        plan_id: newPlanId,
        status: 'active',
        event_type: 'downgrade_scheduled',
      });

      return NextResponse.json({
        success: true,
        type: 'downgrade_scheduled',
        message: `Downgrade agendado para ${newPlanId}`,
        effectiveDate: new Date((sub.items.data[0]?.current_period_end || 0) * 1000),
      });
    }

    // 8. UPGRADE: sempre imediato com proration
    if (upgrading) {
      const result = await executeImmediateUpgrade({
        subscriptionId: activeSubscription.id,
        newPlanId,
        billingPeriod,
      });

      const updatedSubscription = result.subscription;
      const newPriceId = result.newPriceId;

      // Atualizar profile imediatamente
      const sub = updatedSubscription as any;
      console.log({ sub });
      await supabase
        .from('profiles')
        .update({
          plan: newPlanId,
          updated_at: new Date(),
        })
        .eq('user_id', user.id);

      // Atualizar audit trail (subscriptions table)
      await supabase.from('subscriptions').insert({
        user_id: profile.id,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_subscription_id: activeSubscription.id,
        stripe_price_id: newPriceId,
        plan_id: newPlanId,
        status: 'active',
        event_type: 'upgrade_immediate',
      });

      return NextResponse.json({
        success: true,
        type: 'upgrade_immediate',
        message: `Upgrade para ${newPlanId} realizado com sucesso! Você foi cobrado proporcionalmente pelo período restante.`,
        effectiveDate: new Date(),
      });
    }

    return NextResponse.json({ error: 'Tipo de mudança não identificado' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao mudar plano:', error);

    // Log do erro
    try {
      const supabase = await createClient();
      await supabase.from('error_logs').insert({
        message: error.message || 'Erro desconhecido ao mudar plano',
        stack: error.stack,
        level: 'error',
        context: {
          endpoint: '/api/stripe/change-plan',
          method: 'POST',
        },
      });
    } catch (logError) {
      console.error('Erro ao logar erro:', logError);
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar mudança de plano',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
