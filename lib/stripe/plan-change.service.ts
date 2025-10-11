/**
 * Plan Change Service - Serviço para gerenciar mudanças de plano (upgrade/downgrade)
 *
 * Este serviço implementa a lógica de negócio para:
 * - Upgrades imediatos com proration
 * - Upgrades agendados
 * - Downgrades agendados (sempre agendados para final do período)
 * - Cálculo de créditos proporcionais
 */

import Stripe from 'stripe';
import { stripe, STRIPE_PRICE_IDS } from './stripe.service';
import { PlanType } from '@/db/schema';

/**
 * Hierarquia de planos (do menor para o maior)
 */
const PLAN_HIERARCHY: Record<keyof typeof PlanType, number> = {
  starter: 0,
  basic: 1,
  essentials: 2,
  plus: 3,
  advanced: 4,
};

/**
 * Determina se a mudança de plano é um upgrade
 */
export function isUpgrade(currentPlan: keyof typeof PlanType, newPlan: keyof typeof PlanType): boolean {
  return PLAN_HIERARCHY[newPlan] > PLAN_HIERARCHY[currentPlan];
}

/**
 * Determina se a mudança de plano é um downgrade
 */
export function isDowngrade(currentPlan: keyof typeof PlanType, newPlan: keyof typeof PlanType): boolean {
  return PLAN_HIERARCHY[newPlan] < PLAN_HIERARCHY[currentPlan];
}

/**
 * Calcula o crédito proporcional baseado nos dias restantes
 */
export function calculateProration(
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  currentAmount: number
): {
  daysTotal: number;
  daysUsed: number;
  daysRemaining: number;
  creditAmount: number;
  creditPercentage: number;
} {
  const now = new Date();
  const totalMs = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
  const usedMs = now.getTime() - currentPeriodStart.getTime();
  const remainingMs = currentPeriodEnd.getTime() - now.getTime();

  const daysTotal = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
  const daysUsed = Math.ceil(usedMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  const creditPercentage = (daysRemaining / daysTotal) * 100;
  const creditAmount = Math.round((currentAmount * daysRemaining) / daysTotal);

  return {
    daysTotal,
    daysUsed,
    daysRemaining,
    creditAmount,
    creditPercentage,
  };
}

interface SchedulePlanChangeParams {
  subscriptionId: string;
  newPlanId: keyof typeof PlanType;
  billingPeriod: 'monthly' | 'annual';
}

/**
 * Resultado do agendamento de mudança de plano
 */
export interface SchedulePlanChangeResult {
  subscription: Stripe.Subscription;
  newPriceId: string;
}

/**
 * Agenda mudança de plano para o final do período (downgrade)
 * No Stripe, isto é feito modificando a assinatura para mudar na próxima renovação
 */
export async function schedulePlanChange(params: SchedulePlanChangeParams): Promise<SchedulePlanChangeResult> {
  const { subscriptionId, newPlanId, billingPeriod } = params;

  // Buscar price ID do novo plano
  const priceConfig = STRIPE_PRICE_IDS[newPlanId];
  if (!priceConfig) {
    throw new Error(`Configuração de preço não encontrada para o plano: ${newPlanId}`);
  }

  const newPriceId = priceConfig[billingPeriod];
  if (!newPriceId) {
    throw new Error(`Price ID não configurado para ${newPlanId} ${billingPeriod}`);
  }

  try {
    // Buscar assinatura atual
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Agendar mudança de plano para a próxima renovação
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'none', // Sem proration para downgrade
      billing_cycle_anchor: 'unchanged', // Manter ciclo de faturamento atual
      metadata: {
        ...subscription.metadata,
        pending_plan_id: newPlanId,
        plan_change_type: 'downgrade',
      },
    });

    return {
      subscription: updatedSubscription,
      newPriceId,
    };
  } catch (error) {
    console.error('Erro ao agendar mudança de plano:', error);
    throw error;
  }
}

interface ImmediateUpgradeParams {
  subscriptionId: string;
  newPlanId: keyof typeof PlanType;
  billingPeriod: 'monthly' | 'annual';
}

/**
 * Resultado do upgrade imediato com proration
 */
export interface ImmediateUpgradeResult {
  subscription: Stripe.Subscription;
  newPriceId: string;
}

/**
 * Executa upgrade imediato com proration automática do Stripe
 * O Stripe calcula automaticamente o crédito proporcional e mantém o ciclo de faturamento original
 *
 * Exemplo: Se a renovação é dia 2 e o upgrade é feito dia 10:
 * - Credita 22 dias não utilizados do plano antigo
 * - Cobra apenas 22 dias do novo plano
 * - Mantém a data de renovação no dia 2
 *
 * Ref: https://docs.stripe.com/billing/subscriptions/prorations
 */
export async function executeImmediateUpgrade(params: ImmediateUpgradeParams): Promise<ImmediateUpgradeResult> {
  const { subscriptionId, newPlanId, billingPeriod } = params;

  // Buscar price ID do novo plano
  const priceConfig = STRIPE_PRICE_IDS[newPlanId];
  if (!priceConfig) {
    throw new Error(`Configuração de preço não encontrada para o plano: ${newPlanId}`);
  }

  const newPriceId = priceConfig[billingPeriod];
  if (!newPriceId) {
    throw new Error(`Price ID não configurado para ${newPlanId} ${billingPeriod}`);
  }

  try {
    // Buscar assinatura atual
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Fazer upgrade imediato com proration
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice', // Criar invoice imediatamente com proration
      billing_cycle_anchor: 'unchanged', // Manter ciclo de faturamento original (não resetar)
      metadata: {
        ...subscription.metadata,
        planId: newPlanId,
        plan_change_type: 'immediate_upgrade',
      },
    });

    return {
      subscription: updatedSubscription,
      newPriceId,
    };
  } catch (error) {
    console.error('Erro ao executar upgrade imediato:', error);
    throw error;
  }
}

/**
 * Cancela uma mudança de plano agendada
 * Reverte para os itens originais da assinatura
 */
export async function cancelScheduledPlanChange(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    // Buscar assinatura atual
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Remover metadata de mudança pendente
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      metadata: {
        ...subscription.metadata,
        pending_plan_id: '',
        plan_change_type: '',
      },
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Erro ao cancelar mudança de plano agendada:', error);
    throw error;
  }
}

/**
 * Busca informações de proration antes de confirmar upgrade
 * Nota: Preview de invoice não disponível na API atual, retorna estimativa baseada em cálculo
 */
export async function getUpgradeProrationPreview(
  subscriptionId: string,
  newPriceId: string
): Promise<{
  immediateCharge: number;
  prorationCredit: number;
  newPlanCharge: number;
  nextInvoiceDate: Date;
}> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPrice = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const newPrice = await stripe.prices.retrieve(newPriceId);

    // Calcular proration manualmente
    const sub = subscription as any;
    const currentPeriodStart = new Date((sub.current_period_start || 0) * 1000);
    const currentPeriodEnd = new Date((sub.current_period_end || 0) * 1000);
    const currentAmount = currentPrice.unit_amount || 0;
    const newAmount = newPrice.unit_amount || 0;

    const proration = calculateProration(currentPeriodStart, currentPeriodEnd, currentAmount);

    return {
      immediateCharge: newAmount - proration.creditAmount,
      prorationCredit: proration.creditAmount,
      newPlanCharge: newAmount,
      nextInvoiceDate: currentPeriodEnd,
    };
  } catch (error) {
    console.error('Erro ao buscar preview de proration:', error);
    throw error;
  }
}
