/**
 * API Endpoint: Histórico de Pagamentos
 *
 * GET /api/stripe/payment-history?customerId=cus_...
 *
 * Retorna o histórico de pagamentos (charges) de um customer do Stripe.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. Obter customerId da query string
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId é obrigatório' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 3. Verificar se o customer pertence ao usuário logado
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[payment-history] Erro ao buscar profile:', profileError);
      return NextResponse.json(
        { error: 'Erro ao buscar perfil' },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!profile) {
      console.error('[payment-history] Perfil não encontrado para usuário:', user.id);
      return NextResponse.json(
        { error: 'Perfil não encontrado. Por favor, complete seu cadastro.' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (profile.stripe_customer_id !== customerId) {
      console.error('[payment-history] Tentativa de acesso a customer de outro usuário', {
        userId: user.id,
        requestedCustomerId: customerId,
        userCustomerId: profile.stripe_customer_id,
      });
      return NextResponse.json(
        { error: 'Acesso negado' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 4. Buscar charges do Stripe
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });

    // 5. Formatar pagamentos
    const payments = charges.data.map((charge) => ({
      id: charge.id,
      amount: charge.amount,
      status: charge.status,
      created: new Date(charge.created * 1000),
      invoice_pdf: charge.receipt_url || undefined,
      description: charge.description || `Pagamento - ${charge.id}`,
    }));

    return NextResponse.json(
      { payments },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
