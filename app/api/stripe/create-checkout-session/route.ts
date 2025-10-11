/**
 * API Route: Create Checkout Session
 *
 * Cria uma sessão de checkout do Stripe para o plano selecionado.
 * Esta rota é protegida e requer autenticação do usuário.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/stripe.service';
import { PlanType } from '@/db/schema';
import { z } from 'zod';

// Schema de validação para o body da requisição
const CreateCheckoutSchema = z.object({
  planId: z.enum(['basic', 'essentials', 'plus', 'advanced']),
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

    // 2. Buscar dados do perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 });
    }

    // 3. Validar body da requisição
    const body = await request.json();
    const validationResult = CreateCheckoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { planId, billingPeriod } = validationResult.data;

    // 4. Construir URLs de sucesso e cancelamento
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8800';
    const successUrl = `${baseUrl}/plan?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/plan?canceled=true`;

    // 5. Criar sessão de checkout no Stripe
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: profile.email,
      planId,
      billingPeriod,
      successUrl,
      cancelUrl,
    });

    // 6. Retornar URL de checkout
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erro ao criar checkout session:', error);

    // Log do erro no banco de dados
    try {
      const supabase = await createClient();
      await supabase.from('error_logs').insert({
        message: error.message || 'Erro desconhecido ao criar checkout session',
        stack: error.stack,
        level: 'error',
        context: {
          endpoint: '/api/stripe/create-checkout-session',
          method: 'POST',
        },
      });
    } catch (logError) {
      console.error('Erro ao logar erro:', logError);
    }

    return NextResponse.json(
      {
        error: 'Erro ao criar sessão de checkout',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
