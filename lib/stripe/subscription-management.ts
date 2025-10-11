/**
 * Stripe Subscription Management
 *
 * Gerenciamento completo de assinaturas seguindo as melhores práticas da Stripe:
 * - Upgrades: imediatos com proration
 * - Downgrades: agendados para final do período (sem proration)
 * - Cancelamentos: mantém acesso até o fim do período pago
 * - Reativações: remove flag de cancelamento
 *
 * Referências:
 * - https://docs.stripe.com/api/subscriptions/update
 * - https://docs.stripe.com/api/subscriptions/cancel
 * - https://docs.stripe.com/billing/subscriptions/upgrade-downgrade
 */

import Stripe from 'stripe';
import { PlanType } from '@/db/schema';
import { SubscriptionData } from './subscription-helper';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

/**
 * Hierarquia de planos para determinar upgrade vs downgrade
 */
const PLAN_HIERARCHY: Record<keyof typeof PlanType, number> = {
  starter: 0,
  basic: 1,
  essentials: 2,
  plus: 3,
  advanced: 4,
};

/**
 * Determina se a mudança é um upgrade ou downgrade
 */
export function isUpgrade(currentPlan: keyof typeof PlanType, newPlan: keyof typeof PlanType): boolean {
  return PLAN_HIERARCHY[newPlan] > PLAN_HIERARCHY[currentPlan];
}

/**
 * Resultado de uma operação de mudança de plano
 */
export interface PlanChangeResult {
  success: boolean;
  subscription: SubscriptionData | null;
  message: string;
  effectiveDate?: Date; // Quando a mudança será efetivada
  prorationAmount?: number; // Valor cobrado/creditado (em centavos)
}

/**
 * UPGRADE: Muda o plano IMEDIATAMENTE com proration
 *
 * Boas práticas:
 * - proration_behavior: 'create_prorations' (cobrar/creditar proporcionalmente)
 * - payment_behavior: 'error_if_incomplete' (falhar se pagamento incompleto)
 * - Atualiza o price_id do item existente
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @param newPriceId - ID do novo price no Stripe
 * @returns Resultado da operação
 */
export async function upgradeSubscriptionNow(subscriptionId: string, newPriceId: string): Promise<PlanChangeResult> {
  try {
    // 1. Buscar subscription atual
    const currentSub = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = currentSub.items.data[0]?.id;

    if (!subscriptionItemId) {
      return {
        success: false,
        subscription: null,
        message: 'Item da subscription não encontrado',
      };
    }

    // 2. Atualizar subscription com proration
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Cobrar proporcional
      payment_behavior: 'error_if_incomplete', // Falhar se pagamento incompleto
      billing_cycle_anchor: 'unchanged', // Manter data de renovação
    });

    // 3. Processar resposta
    const sub = updatedSub as any;
    const priceId = sub.items?.data?.[0]?.price?.id;

    return {
      success: true,
      subscription: {
        id: sub.id,
        status: sub.status as any,
        planId: 'basic', // TODO: mapear priceId para planId
        priceId: priceId || '',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      },
      message: 'Upgrade realizado com sucesso',
      effectiveDate: new Date(), // Imediato
    };
  } catch (error: any) {
    console.error('Erro ao fazer upgrade:', error);
    return {
      success: false,
      subscription: null,
      message: error.message || 'Erro ao processar upgrade',
    };
  }
}

/**
 * DOWNGRADE: Agenda mudança para o final do período (sem proration)
 *
 * Boas práticas:
 * - Usa subscription_schedule para agendar mudança
 * - Sem cobrança adicional (sem proration)
 * - Usuário mantém plano atual até o vencimento
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @param newPriceId - ID do novo price no Stripe
 * @returns Resultado da operação
 */
export async function downgradeSubscriptionAtPeriodEnd(
  subscriptionId: string,
  newPriceId: string
): Promise<PlanChangeResult> {
  try {
    // 1. Buscar subscription atual
    const currentSub = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = currentSub as any;

    // 2. Criar schedule para mudar no próximo período
    await (stripe.subscriptionSchedules as any).create({
      from_subscription: subscriptionId,
      phases: [
        // Fase 1: Período atual (mantém plano atual)
        {
          items: [
            {
              price: sub.items.data[0].price.id,
              quantity: 1,
            },
          ],
          start_date: sub.current_period_start,
          end_date: sub.current_period_end,
        },
        // Fase 2: Próximo período (novo plano)
        {
          items: [
            {
              price: newPriceId,
              quantity: 1,
            },
          ],
          start_date: sub.current_period_end,
        },
      ],
    });

    return {
      success: true,
      subscription: null, // Subscription não muda agora
      message: 'Downgrade agendado para o final do período',
      effectiveDate: new Date(sub.current_period_end * 1000),
      prorationAmount: 0, // Sem cobrança
    };
  } catch (error: any) {
    console.error('Erro ao agendar downgrade:', error);
    return {
      success: false,
      subscription: null,
      message: error.message || 'Erro ao agendar downgrade',
    };
  }
}

/**
 * CANCELAMENTO: Cancela assinatura no final do período
 *
 * Boas práticas:
 * - cancel_at_period_end: true (mantém acesso até o fim)
 * - Não cancela imediatamente (usuário já pagou pelo período)
 * - Permite reativação até o final do período
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @returns Resultado da operação
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<PlanChangeResult> {
  try {
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      proration_behavior: 'none', // Sem reembolso
    });

    const sub = updatedSub as any;

    return {
      success: true,
      subscription: {
        id: sub.id,
        status: sub.status as any,
        planId: 'starter', // Voltará para starter
        priceId: '',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: true,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        trialEnd: null,
      },
      message: 'Assinatura será cancelada no final do período',
      effectiveDate: new Date(sub.current_period_end * 1000),
    };
  } catch (error: any) {
    console.error('Erro ao cancelar subscription:', error);
    return {
      success: false,
      subscription: null,
      message: error.message || 'Erro ao cancelar assinatura',
    };
  }
}

/**
 * CANCELAMENTO IMEDIATO: Cancela assinatura agora
 *
 * ATENÇÃO: Só use em casos específicos (ex: violação de termos)
 * Normalmente, use cancelSubscriptionAtPeriodEnd()
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @returns Resultado da operação
 */
export async function cancelSubscriptionNow(subscriptionId: string): Promise<PlanChangeResult> {
  try {
    const canceledSub = await stripe.subscriptions.cancel(subscriptionId);

    const sub = canceledSub as any;

    return {
      success: true,
      subscription: {
        id: sub.id,
        status: 'canceled',
        planId: 'starter',
        priceId: '',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
        trialEnd: null,
      },
      message: 'Assinatura cancelada imediatamente',
      effectiveDate: new Date(),
    };
  } catch (error: any) {
    console.error('Erro ao cancelar subscription imediatamente:', error);
    return {
      success: false,
      subscription: null,
      message: error.message || 'Erro ao cancelar assinatura',
    };
  }
}

/**
 * REATIVAÇÃO: Remove cancelamento agendado
 *
 * Permite que o usuário reative a assinatura se mudou de ideia
 * antes do final do período.
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @returns Resultado da operação
 */
export async function reactivateSubscription(subscriptionId: string): Promise<PlanChangeResult> {
  try {
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    const sub = updatedSub as any;

    return {
      success: true,
      subscription: {
        id: sub.id,
        status: sub.status as any,
        planId: 'basic', // TODO: mapear
        priceId: sub.items?.data?.[0]?.price?.id || '',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
      },
      message: 'Assinatura reativada com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao reativar subscription:', error);
    return {
      success: false,
      subscription: null,
      message: error.message || 'Erro ao reativar assinatura',
    };
  }
}

/**
 * MUDANÇA DE PLANO INTELIGENTE
 *
 * Decide automaticamente se é upgrade ou downgrade e aplica
 * a estratégia apropriada.
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @param currentPlan - Plano atual
 * @param newPlan - Novo plano desejado
 * @param newPriceId - ID do price no Stripe
 * @param immediate - Se true, força mudança imediata (mesmo para downgrade)
 * @returns Resultado da operação
 */
export async function changePlan(
  subscriptionId: string,
  currentPlan: keyof typeof PlanType,
  newPlan: keyof typeof PlanType,
  newPriceId: string,
  immediate: boolean = false
): Promise<PlanChangeResult> {
  // Cancelamento (downgrade para starter)
  if (newPlan === 'starter') {
    return cancelSubscriptionAtPeriodEnd(subscriptionId);
  }

  // Upgrade: sempre imediato
  if (isUpgrade(currentPlan, newPlan)) {
    return upgradeSubscriptionNow(subscriptionId, newPriceId);
  }

  // Downgrade: agendado para final do período (ou imediato se forçado)
  if (immediate) {
    return upgradeSubscriptionNow(subscriptionId, newPriceId); // Usa mesma função
  } else {
    return downgradeSubscriptionAtPeriodEnd(subscriptionId, newPriceId);
  }
}

/**
 * CÁLCULO DE PRORATION
 *
 * Calcula quanto o usuário pagará/receberá de crédito
 * ao fazer upgrade imediato.
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @param newPriceId - ID do novo price no Stripe
 * @returns Valor em centavos (positivo = cobrança, negativo = crédito)
 */
export async function calculateProration(subscriptionId: string, newPriceId: string): Promise<number | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as any;
    const subscriptionItemId = sub.items?.data?.[0]?.id;

    if (!subscriptionItemId) return null;

    // Simular mudança para calcular proration
    const upcomingInvoice = await (stripe.invoices as any).retrieveUpcoming({
      customer: sub.customer as string,
      subscription: subscriptionId,
      subscription_items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      subscription_proration_behavior: 'create_prorations',
    });

    return upcomingInvoice.amount_due;
  } catch (error) {
    console.error('Erro ao calcular proration:', error);
    return null;
  }
}
