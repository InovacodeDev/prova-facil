/**
 * API Endpoint: Buscar produtos e preços do Stripe
 *
 * GET /api/stripe/products
 *
 * Retorna todos os produtos ativos com seus preços (mensal e anual).
 * Esta rota é pública e não requer autenticação pois mostra informações
 * de pricing que são públicas no site.
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { StripeProduct } from '@/lib/stripe/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function GET() {
  try {
    // 1. Buscar todos os produtos ativos
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // 2. Buscar todos os preços
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // 3. Organizar produtos com seus preços
    const productsWithPrices: StripeProduct[] = products.data.map((product) => {
      // Filtrar preços deste produto
      const productPrices = prices.data.filter((price) =>
        typeof price.product === 'string' ? price.product === product.id : price.product?.id === product.id
      );

      // Separar preços mensais e anuais
      const monthlyPrice = productPrices.find((price) => price.recurring?.interval === 'month');
      const yearlyPrice = productPrices.find((price) => price.recurring?.interval === 'year');

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
        features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
        prices: {
          monthly: {
            id: monthlyPrice?.id || '',
            amount: monthlyPrice?.unit_amount ?? null,
            currency: monthlyPrice?.currency || 'brl',
            interval: 'month',
          },
          yearly: {
            id: yearlyPrice?.id || '',
            amount: yearlyPrice?.unit_amount ?? null,
            currency: yearlyPrice?.currency || 'brl',
            interval: 'year',
          },
        },
      };
    });

    // 4. Ordenar produtos (starter, basic, plus, premium)
    const orderedProducts = productsWithPrices.sort((a, b) => {
      const order: Record<string, number> = {
        starter: 0,
        basic: 1,
        plus: 2,
        premium: 3,
      };

      const aOrder = order[a.metadata.plan?.toLowerCase() || ''] ?? 999;
      const bOrder = order[b.metadata.plan?.toLowerCase() || ''] ?? 999;

      return aOrder - bOrder;
    });

    return NextResponse.json(
      { products: orderedProducts },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache por 5 minutos
        },
      }
    );
  } catch (error) {
    console.error('[products] Erro ao buscar produtos do Stripe:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
