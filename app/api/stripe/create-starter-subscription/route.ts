/**
 * Create Starter Subscription API Route
 *
 * This endpoint is called during user signup to:
 * 1. Create a Stripe customer
 * 2. Create a free "Starter" subscription (no payment required)
 * 3. Update the user's profile with the customer and subscription IDs
 */

import { invalidateSubscriptionCache } from '@/lib/cache/subscription-cache';
import { STRIPE_PRODUCTS } from '@/lib/stripe/config';
import { stripe } from '@/lib/stripe/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RequestBody {
  userId: string;
  email: string;
  fullName: string;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { userId, email, fullName } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
    }

    // Verificar se o usuário já tem um customer_id
    // const supabaseAdmin = await createClient();
    // const {
    //   data: { user },
    // } = await supabaseAdmin.auth.getUser();
    // console.log(`Fetched user for admin:`, user);

    // Para operações de escrita (INSERT/UPDATE), usar service role para bypass RLS
    const supabaseAdmin = await createServiceRoleClient();

    // Busca o perfil usando user_id (não é RLS, é busca direta)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, stripe_customer_id, stripe_subscription_id, email')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
    console.log(`Fetched profile for user_id ${userId}:`, profile);

    // Se o perfil não existe, criar um primeiro
    if (!profile) {
      console.log(`Profile not found for user ${userId}, creating one...`);

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          email: email,
          full_name: fullName,
        })
        .select('id, stripe_customer_id, stripe_subscription_id')
        .maybeSingle();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile', details: createError.message },
          { status: 500 }
        );
      }

      console.log(`Profile created with id: ${newProfile.id}`);
    }

    // Re-buscar o perfil para garantir que temos dados atualizados
    const { data: currentProfile, error: refetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (refetchError || !currentProfile) {
      console.error('Error re-fetching profile:', refetchError);
      return NextResponse.json({ error: 'Failed to fetch profile after creation' }, { status: 500 });
    }

    // Se já tem customer e subscription, não criar novamente
    if (currentProfile.stripe_customer_id && currentProfile.stripe_subscription_id) {
      console.log(`Customer and subscription already exist for user ${userId}`);
      return NextResponse.json({
        success: true,
        customerId: currentProfile.stripe_customer_id,
        subscriptionId: currentProfile.stripe_subscription_id,
        message: 'Customer and subscription already exist',
      });
    }

    let customerId = currentProfile.stripe_customer_id;

    // 1. Criar ou usar o customer existente
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: fullName,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;

      console.log(`Created Stripe customer: ${customerId} for user: ${userId}`);
    } else {
      console.log(`Using existing Stripe customer: ${customerId} for user: ${userId}`);
    }

    // 2. Verificar se o produto Starter existe no Stripe
    const starterProductId = STRIPE_PRODUCTS.starter;
    if (!starterProductId) {
      return NextResponse.json({ error: 'Starter product not configured in Stripe' }, { status: 500 });
    }

    // 3. Buscar ou criar um price gratuito para o produto Starter
    // Primeiro, verificar se já existe um price gratuito
    let starterPrice;
    const prices = await stripe.prices.list({
      product: starterProductId,
      active: true,
      limit: 100,
    });

    // Procurar por um price gratuito (unit_amount = 0)
    starterPrice = prices.data.find((price) => price.unit_amount === 0 && price.recurring);

    // Se não existir, criar um
    if (!starterPrice) {
      starterPrice = await stripe.prices.create({
        product: starterProductId,
        unit_amount: 0, // Gratuito
        currency: 'brl',
        recurring: {
          interval: 'month',
        },
        nickname: 'Starter - Free',
        metadata: {
          plan: 'starter',
        },
      });
      console.log(`Created free price for Starter plan: ${starterPrice.id}`);
    }

    // 4. Criar a subscription gratuita
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: starterPrice.id,
        },
      ],
      metadata: {
        supabase_user_id: userId,
        plan: 'starter',
      },
      // Para planos gratuitos, não precisamos de trial ou pagamento
      trial_period_days: undefined,
    });

    console.log(`Created Starter subscription: ${subscription.id} for customer: ${customerId}`);

    // 5. Atualizar o profile com os IDs - CRÍTICO: usar service role para bypass RLS
    console.log(`Attempting to update profile for user_id: ${userId}`);
    console.log(`Setting stripe_customer_id: ${customerId}, stripe_subscription_id: ${subscription.id}`);

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('id, stripe_customer_id, stripe_subscription_id')
      .maybeSingle();

    if (updateError) {
      console.error('ERROR updating profile with Stripe IDs:', updateError);
      console.error('Update error details:', JSON.stringify(updateError, null, 2));

      // Este é um erro crítico - não queremos continuar
      return NextResponse.json(
        {
          error: 'Failed to save Stripe IDs to profile',
          details: updateError.message,
          customerId,
          subscriptionId: subscription.id,
        },
        { status: 500 }
      );
    }

    console.log('✅ Profile updated successfully:', updatedProfile);
    console.log(`✅ stripe_customer_id: ${updatedProfile?.stripe_customer_id}`);
    console.log(`✅ stripe_subscription_id: ${updatedProfile?.stripe_subscription_id}`);

    // 6. Invalidar cache para forçar atualização
    await invalidateSubscriptionCache(userId);

    return NextResponse.json({
      success: true,
      customerId,
      subscriptionId: subscription.id,
      message: 'Starter subscription created successfully',
    });
  } catch (error) {
    console.error('Error creating starter subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to create starter subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
