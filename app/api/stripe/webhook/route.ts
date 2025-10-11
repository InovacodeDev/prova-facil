/**
 * API Route: Stripe Webhook
 *
 * Processa eventos do Stripe via webhook.
 * Esta rota é pública mas requer validação de assinatura do Stripe.
 *
 * IMPORTANTE: Esta rota requer configuração especial no Next.js para
 * desabilitar o body parser padrão, pois precisamos do raw body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe/stripe.service';
import { invalidateFromStripeEvent } from '@/lib/stripe-products';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Configuração para desabilitar o body parser
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Obter o body raw e a assinatura
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Assinatura do webhook ausente' }, { status: 400 });
    }

    // 2. Verificar e construir o evento
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
      // Invalidate product cache for events that affect products/prices
      try {
        invalidateFromStripeEvent(event as any);
      } catch (err) {
        // Non-fatal: log and continue processing the webhook
        console.error('Erro ao invalidar cache de produtos a partir do webhook:', err);
      }
    } catch (error: any) {
      console.error('Erro ao verificar webhook:', error);
      return NextResponse.json({ error: 'Assinatura do webhook inválida' }, { status: 400 });
    }

    // 3. Processar evento baseado no tipo
    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);

    // Log do erro no banco de dados
    try {
      const supabase = await createClient();
      await supabase.from('error_logs').insert({
        message: error.message || 'Erro desconhecido no webhook do Stripe',
        stack: error.stack,
        level: 'error',
        context: {
          endpoint: '/api/stripe/webhook',
          method: 'POST',
        },
      });
    } catch (logError) {
      console.error('Erro ao logar erro:', logError);
    }

    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}

/**
 * Processa conclusão de checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    console.error('Metadata ausente na sessão:', session.id);
    return;
  }

  console.log(`Checkout concluído para usuário ${userId}, plano ${planId}`);

  // A assinatura será processada pelo evento subscription.created
}

/**
 * Processa criação ou atualização de assinatura
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;

  if (!userId || !planId) {
    console.error('Metadata ausente na assinatura:', subscription.id);
    return;
  }

  try {
    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error(`Perfil não encontrado para user_id: ${userId}`);
    }

    // Atualizar profile.stripe_customer_id se ainda não estiver setado
    if (!profile.stripe_customer_id) {
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: subscription.customer as string,
          updated_at: new Date(),
        })
        .eq('user_id', userId);
    }

    // Inserir registro de audit trail na tabela subscriptions
    await supabase.from('subscriptions').insert({
      user_id: profile.id,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status as any,
      plan_id: planId,
      event_type: 'customer.subscription.updated',
    });

    // Atualizar plano do usuário no profile (cache)
    await supabase
      .from('profiles')
      .update({
        plan: planId,
        updated_at: new Date(),
      })
      .eq('user_id', userId);

    console.log(`Assinatura ${subscription.id} processada para usuário ${userId} - plano: ${planId}`);
  } catch (error) {
    console.error('Erro ao processar mudança de assinatura:', error);
    throw error;
  }
}

/**
 * Processa cancelamento de assinatura
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.error('userId ausente no metadata da assinatura:', subscription.id);
      return;
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single();

    if (!profile) {
      console.error('Perfil não encontrado para userId:', userId);
      return;
    }

    // Inserir registro de audit trail (cancelamento)
    await supabase.from('subscriptions').insert({
      user_id: profile.id,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status: 'canceled',
      plan_id: subscription.metadata?.planId || 'starter',
      event_type: 'customer.subscription.deleted',
    });

    // Downgrade para plano gratuito
    await supabase
      .from('profiles')
      .update({
        plan: 'starter',
        updated_at: new Date(),
      })
      .eq('user_id', userId);

    console.log(`Assinatura ${subscription.id} cancelada - usuário ${userId} movido para plano starter`);
  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    throw error;
  }
}

/**
 * Processa pagamento bem-sucedido de fatura
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  const inv = invoice as any;
  if (!inv.subscription) return;

  try {
    // Buscar assinatura
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', inv.subscription)
      .single();

    if (!subscription) {
      console.error('Assinatura não encontrada:', inv.subscription);
      return;
    }

    // Registrar pagamento
    await supabase.from('payments').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_payment_intent_id: (inv.payment_intent as string) || `invoice_${invoice.id}`,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      payment_method: inv.charge ? 'card' : 'unknown',
    });

    console.log(`Pagamento processado para fatura ${invoice.id}`);
  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error);
    throw error;
  }
}

/**
 * Processa falha de pagamento de fatura
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  const inv = invoice as any;
  if (!inv.subscription) return;

  try {
    // Buscar assinatura
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', inv.subscription)
      .single();

    if (!subscription) {
      console.error('Assinatura não encontrada:', inv.subscription);
      return;
    }

    // Registrar tentativa de pagamento falhada
    await supabase.from('payments').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_payment_intent_id: (inv.payment_intent as string) || `failed_${Date.now()}`,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      payment_method: 'unknown',
    });

    console.log(`Falha de pagamento registrada para fatura ${invoice.id}`);
  } catch (error) {
    console.error('Erro ao processar falha de pagamento:', error);
    throw error;
  }
}
