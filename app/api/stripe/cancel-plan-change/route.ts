/**
 * API Route: Cancel Scheduled Plan Change
 *
 * Cancela uma mudança de plano agendada (upgrade ou downgrade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelScheduledPlanChange } from '@/lib/stripe/plan-change.service';

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

    // 2. Buscar perfil do usuário
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

    // 3. Buscar assinatura ativa no Stripe (fonte da verdade)
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

    // 4. Cancelar mudança no Stripe
    await cancelScheduledPlanChange(activeSubscription.id);

    return NextResponse.json({
      success: true,
      message: 'Mudança de plano agendada cancelada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao cancelar mudança de plano:', error);

    // Log do erro
    try {
      const supabase = await createClient();
      await supabase.from('error_logs').insert({
        message: error.message || 'Erro ao cancelar mudança de plano',
        stack: error.stack,
        level: 'error',
        context: {
          endpoint: '/api/stripe/cancel-plan-change',
          method: 'POST',
        },
      });
    } catch (logError) {
      console.error('Erro ao logar erro:', logError);
    }

    return NextResponse.json(
      {
        error: 'Erro ao cancelar mudança de plano',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
