/**
 * Stripe Service - Serviço centralizado para operações do Stripe
 *
 * Este serviço encapsula toda a lógica de integração com o Stripe seguindo
 * os princípios do AGENTS.md:
 * - Type-safety estrito
 * - Single Responsibility Principle
 * - Segurança em primeiro lugar
 * - Tratamento robusto de erros
 */

import Stripe from 'stripe';
import { PlanType } from '@/db/schema';

// Inicializar Stripe com a chave secreta
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

/**
 * Mapeamento de planos para Price IDs do Stripe
 * Estes IDs devem ser configurados no dashboard do Stripe
 */
export const STRIPE_PRICE_IDS: Record<keyof typeof PlanType, { monthly: string; annual: string } | null> = {
  starter: null, // Plano gratuito não tem price ID
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

interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  planId: keyof typeof PlanType;
  billingPeriod: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const { userId, userEmail, planId, billingPeriod, successUrl, cancelUrl } = params;

  // Validar que o plano não é gratuito
  if (planId === 'starter') {
    throw new Error('Plano Starter é gratuito e não requer checkout');
  }

  // Buscar o Price ID do plano
  const priceConfig = STRIPE_PRICE_IDS[planId];
  if (!priceConfig) {
    throw new Error(`Configuração de preço não encontrada para o plano: ${planId}`);
  }

  const priceId = priceConfig[billingPeriod];
  if (!priceId) {
    throw new Error(`Price ID não configurado para ${planId} ${billingPeriod}`);
  }

  try {
    // Verificar se o cliente já existe no Stripe
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    let customerId: string;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Criar novo cliente no Stripe
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
          billingPeriod,
        },
      },
    });

    return session;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
}

/**
 * Busca uma assinatura pelo ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    throw error;
  }
}

/**
 * Cancela uma assinatura no final do período de faturamento
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
}

/**
 * Cancela uma assinatura imediatamente
 */
export async function cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Erro ao cancelar assinatura imediatamente:', error);
    throw error;
  }
}

/**
 * Reativa uma assinatura que estava marcada para cancelamento
 */
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    throw error;
  }
}

/**
 * Cria um portal de gerenciamento de assinatura
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  } catch (error) {
    console.error('Erro ao criar portal de faturamento:', error);
    throw error;
  }
}

/**
 * Verifica a assinatura de um webhook do Stripe
 */
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET não está definida nas variáveis de ambiente');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Erro ao verificar webhook:', error);
    throw error;
  }
}
