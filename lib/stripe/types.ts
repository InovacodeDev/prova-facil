/**
 * Stripe Types - Tipagem TypeScript para objetos do Stripe
 *
 * Define tipos para objetos retornados pela API do Stripe,
 * garantindo type-safety em toda a aplicação.
 */

/**
 * Informações de preço por período de faturamento
 */
export interface StripePriceInfo {
  /** ID do preço no Stripe */
  id: string;
  /** Valor em centavos (ex: 12990 = R$ 129,90) */
  amount: number | null;
  /** Código da moeda (ex: 'brl') */
  currency: string;
  /** Intervalo de faturamento */
  interval: 'month' | 'year';
}

/**
 * Objeto de preços mensal e anual
 */
export interface StripePrices {
  /** Preço para faturamento mensal */
  monthly: StripePriceInfo;
  /** Preço para faturamento anual */
  yearly: StripePriceInfo;
}

/**
 * Produto do Stripe com informações de preços
 *
 * Este é o formato retornado pela API /api/stripe/products
 * e armazenado no cache local.
 */
export interface StripeProduct {
  /** ID do produto no Stripe */
  id: string;
  /** Nome do produto (ex: "STRIPE_PRICE_ID_ADVANCED") */
  name: string;
  /** Descrição do produto */
  description: string | null;
  /** Metadados customizados do produto */
  metadata: Record<string, string>;
  /** Lista de features do produto */
  features: string[];
  /** Preços por período de faturamento */
  prices: StripePrices;
}

/**
 * Type guard para verificar se um objeto é um StripeProduct válido
 */
export function isValidStripeProduct(obj: unknown): obj is StripeProduct {
  if (typeof obj !== 'object' || obj === null) return false;

  const product = obj as Partial<StripeProduct>;

  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    (product.description === null || typeof product.description === 'string') &&
    typeof product.metadata === 'object' &&
    Array.isArray(product.features) &&
    typeof product.prices === 'object' &&
    product.prices !== null &&
    isValidStripePriceInfo((product.prices as StripePrices).monthly) &&
    isValidStripePriceInfo((product.prices as StripePrices).yearly)
  );
}

/**
 * Type guard para StripePriceInfo
 */
function isValidStripePriceInfo(obj: unknown): obj is StripePriceInfo {
  if (typeof obj !== 'object' || obj === null) return false;

  const price = obj as Partial<StripePriceInfo>;

  return (
    typeof price.id === 'string' &&
    (price.amount === null || typeof price.amount === 'number') &&
    typeof price.currency === 'string' &&
    (price.interval === 'month' || price.interval === 'year')
  );
}

/**
 * Mapeamento de nomes de produtos para IDs de planos
 */
export const STRIPE_PRODUCT_NAME_TO_PLAN_ID: Record<string, string> = {
  STRIPE_PRICE_ID_BASIC: 'basic',
  STRIPE_PRICE_ID_ESSENTIALS: 'essentials',
  STRIPE_PRICE_ID_PLUS: 'plus',
  STRIPE_PRICE_ID_ADVANCED: 'advanced',
};

/**
 * Extrai o ID do plano a partir do nome do produto Stripe
 */
export function getPlanIdFromProductName(productName: string): string | null {
  return STRIPE_PRODUCT_NAME_TO_PLAN_ID[productName] || null;
}
