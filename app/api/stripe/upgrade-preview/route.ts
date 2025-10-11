/**
 * API Route: Upgrade Preview
 *
 * Retorna preview de proration para upgrade imediato
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUpgradeProrationPreview } from '@/lib/stripe/plan-change.service';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/stripe.service';
import { PlanType } from '@/db/schema';
import { z } from 'zod';

const PreviewSchema = z.object({
  newPlanId: z.enum(['starter', 'basic', 'essentials', 'plus', 'advanced']),
  billingPeriod: z.enum(['monthly', 'annual']),
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
    const validationResult = PreviewSchema.safeParse(body);

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
      .select('id, user_id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 });
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Usuário não possui um customer ID do Stripe' }, { status: 400 });
    }

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

    // 5. Buscar Price ID do novo plano
    const priceConfig = STRIPE_PRICE_IDS[newPlanId as keyof typeof PlanType];
    if (!priceConfig) {
      return NextResponse.json({ error: 'Configuração de preço não encontrada' }, { status: 400 });
    }

    const newPriceId = priceConfig[billingPeriod];
    if (!newPriceId) {
      return NextResponse.json({ error: 'Price ID não configurado' }, { status: 400 });
    }

    // 6. Buscar preview de proration
    const preview = await getUpgradeProrationPreview(activeSubscription.id, newPriceId);

    return NextResponse.json({
      success: true,
      preview: {
        ...preview,
        // Converter de centavos para reais
        immediateCharge: preview.immediateCharge / 100,
        prorationCredit: preview.prorationCredit / 100,
        newPlanCharge: preview.newPlanCharge / 100,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar preview de upgrade:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar preview',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
