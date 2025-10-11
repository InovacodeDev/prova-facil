/**
 * Stripe Subscription Helper
 *
 * Funções utilitárias para buscar e manipular dados de subscriptions
 * diretamente da Stripe API.
 *
 * A Stripe é a fonte da verdade para dados de assinatura.
 * O banco de dados local armazena apenas:
 * - stripe_subscription_id (referência)
 * - plan (cache para queries rápidas)
 * - stripe_customer_id (referência)
 */

import Stripe from 'stripe';
import { PlanType } from '@/db/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

/**
 * Status da subscription retornado pela Stripe
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

/**
 * Dados processados da subscription para uso na aplicação
 */
export interface SubscriptionData {
  id: string;
  status: SubscriptionStatus;
  planId: keyof typeof PlanType;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEnd: Date | null;
}

/**
 * Mapeia price_id do Stripe para plan_id interno
 */
const PRICE_TO_PLAN_MAP: Record<string, keyof typeof PlanType> = {
  [process.env.STRIPE_PRICE_ID_BASIC_MONTHLY!]: 'basic',
  [process.env.STRIPE_PRICE_ID_BASIC_YEARLY!]: 'basic',
  [process.env.STRIPE_PRICE_ID_ESSENTIALS_MONTHLY!]: 'essentials',
  [process.env.STRIPE_PRICE_ID_ESSENTIALS_YEARLY!]: 'essentials',
  [process.env.STRIPE_PRICE_ID_PLUS_MONTHLY!]: 'plus',
  [process.env.STRIPE_PRICE_ID_PLUS_YEARLY!]: 'plus',
  [process.env.STRIPE_PRICE_ID_ADVANCED_MONTHLY!]: 'advanced',
  [process.env.STRIPE_PRICE_ID_ADVANCED_YEARLY!]: 'advanced',
};

/**
 * Busca os dados completos de uma subscription da Stripe
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @returns Dados processados da subscription ou null se não encontrada
 */
export async function getSubscriptionData(subscriptionId: string): Promise<SubscriptionData | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as any; // Type assertion para acessar propriedades

    // Extrair o price_id (assumindo que há apenas um item)
    const priceId = sub.items?.data?.[0]?.price?.id;
    if (!priceId) {
      console.error('Subscription sem price_id:', subscriptionId);
      return null;
    }

    // Mapear price_id para plan_id
    const planId = PRICE_TO_PLAN_MAP[priceId];
    if (!planId) {
      console.error('Price ID não mapeado:', priceId);
      return null;
    }

    console.log('#####\n', sub, '\n#####');
    return {
      id: sub.id,
      status: sub.status as SubscriptionStatus,
      planId,
      priceId,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    };
  } catch (error) {
    console.error('Erro ao buscar subscription da Stripe:', error);
    return null;
  }
}

/**
 * Verifica se uma subscription está ativa
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @returns true se a subscription está ativa
 */
export async function isSubscriptionActive(subscriptionId: string): Promise<boolean> {
  const data = await getSubscriptionData(subscriptionId);
  return data ? ['active', 'trialing'].includes(data.status) : false;
}

/**
 * Busca todas as subscriptions ativas de um customer
 *
 * @param customerId - ID do customer no Stripe
 * @returns Lista de subscriptions ativas
 */
export async function getActiveSubscriptions(customerId: string): Promise<SubscriptionData[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price'],
    });

    const activeSubscriptions: SubscriptionData[] = [];

    for (const subscription of subscriptions.data) {
      const sub = subscription as any;
      const priceId = sub.items?.data?.[0]?.price?.id;
      if (!priceId) continue;

      const planId = PRICE_TO_PLAN_MAP[priceId];
      if (!planId) continue;

      activeSubscriptions.push({
        id: sub.id,
        status: sub.status as SubscriptionStatus,
        planId,
        priceId,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      });
    }

    return activeSubscriptions;
  } catch (error) {
    console.error('Erro ao buscar subscriptions ativas:', error);
    return [];
  }
}

/**
 * Verifica se um customer tem alguma subscription ativa
 *
 * @param customerId - ID do customer no Stripe
 * @returns Subscription ativa ou null
 */
export async function hasActiveSubscription(customerId: string): Promise<SubscriptionData | null> {
  const activeSubscriptions = await getActiveSubscriptions(customerId);
  return activeSubscriptions.length > 0 ? activeSubscriptions[0] : null;
}

/**
 * Cancela uma subscription imediatamente
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @returns Dados da subscription cancelada ou null
 */
export async function cancelSubscriptionNow(subscriptionId: string): Promise<SubscriptionData | null> {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    const sub = subscription as any;

    const priceId = sub.items?.data?.[0]?.price?.id;
    if (!priceId) return null;

    const planId = PRICE_TO_PLAN_MAP[priceId];
    if (!planId) return null;

    return {
      id: sub.id,
      status: sub.status as SubscriptionStatus,
      planId,
      priceId,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    };
  } catch (error) {
    console.error('Erro ao cancelar subscription:', error);
    return null;
  }
}

/**
 * Agenda o cancelamento de uma subscription no final do período
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @returns Dados da subscription atualizada ou null
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<SubscriptionData | null> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    const sub = subscription as any;

    const priceId = sub.items?.data?.[0]?.price?.id;
    if (!priceId) return null;

    const planId = PRICE_TO_PLAN_MAP[priceId];
    if (!planId) return null;

    return {
      id: sub.id,
      status: sub.status as SubscriptionStatus,
      planId,
      priceId,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    };
  } catch (error) {
    console.error('Erro ao agendar cancelamento:', error);
    return null;
  }
}

/**
 * Atualiza uma subscription para um novo plano IMEDIATAMENTE com proration
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @param newPriceId - ID do novo price no Stripe
 * @returns Dados da subscription atualizada ou null
 */
export async function updateSubscriptionNow(
  subscriptionId: string,
  newPriceId: string
): Promise<SubscriptionData | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as any;
    const subscriptionItemId = sub.items?.data?.[0]?.id;

    if (!subscriptionItemId) {
      console.error('Subscription item não encontrado');
      return null;
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Cria proration para upgrade/downgrade imediato
    });
    const updatedSub = updatedSubscription as any;

    const priceId = updatedSub.items?.data?.[0]?.price?.id;
    if (!priceId) return null;

    const planId = PRICE_TO_PLAN_MAP[priceId];
    if (!planId) return null;

    return {
      id: updatedSub.id,
      status: updatedSub.status as SubscriptionStatus,
      planId,
      priceId,
      currentPeriodStart: new Date(updatedSub.current_period_start * 1000),
      currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
      cancelAtPeriodEnd: updatedSub.cancel_at_period_end || false,
      canceledAt: updatedSub.canceled_at ? new Date(updatedSub.canceled_at * 1000) : null,
      trialEnd: updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000) : null,
    };
  } catch (error) {
    console.error('Erro ao atualizar subscription:', error);
    return null;
  }
}

/**
 * Agenda uma atualização de subscription para o final do período (sem proration)
 *
 * Usa a API de subscription_schedule da Stripe para agendar a mudança.
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @param newPriceId - ID do novo price no Stripe
 * @returns Dados da subscription atual (a mudança ocorrerá no futuro) ou null
 */
export async function scheduleSubscriptionUpdate(
  subscriptionId: string,
  newPriceId: string
): Promise<SubscriptionData | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as any;
    const subscriptionItemId = sub.items?.data?.[0]?.id;

    if (!subscriptionItemId) {
      console.error('Subscription item não encontrado');
      return null;
    }

    // Criar um schedule para mudar no próximo período
    await (stripe.subscriptionSchedules as any).create({
      from_subscription: subscriptionId,
      phases: [
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

    // A subscription atual não muda imediatamente
    return await getSubscriptionData(subscriptionId);
  } catch (error) {
    console.error('Erro ao agendar mudança de subscription:', error);
    return null;
  }
}

/**
 * Calcula o valor da proration para uma mudança de plano imediata
 *
 * @param subscriptionId - ID da subscription no Stripe
 * @param newPriceId - ID do novo price no Stripe
 * @returns Valor da proration em cents ou null
 */
export async function calculateProration(subscriptionId: string, newPriceId: string): Promise<number | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as any;
    const subscriptionItemId = sub.items?.data?.[0]?.id;

    if (!subscriptionItemId) return null;

    // Simular a mudança para calcular proration
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
