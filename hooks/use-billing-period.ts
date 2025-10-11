/**
 * Hook: useBillingPeriod
 *
 * Gerencia o estado de período de cobrança (mensal/anual) de forma centralizada.
 * Usado em múltiplas páginas para manter consistência.
 */

import { useState, useCallback } from 'react';

export type BillingPeriod = 'monthly' | 'annual';

interface UseBillingPeriodReturn {
  billingPeriod: BillingPeriod;
  setBillingPeriod: (period: BillingPeriod) => void;
  toggleBillingPeriod: () => void;
  isMonthly: boolean;
  isAnnual: boolean;
}

/**
 * Hook para gerenciar período de cobrança
 */
export function useBillingPeriod(initialPeriod: BillingPeriod = 'monthly'): UseBillingPeriodReturn {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(initialPeriod);

  const toggleBillingPeriod = useCallback(() => {
    setBillingPeriod((prev) => (prev === 'monthly' ? 'annual' : 'monthly'));
  }, []);

  return {
    billingPeriod,
    setBillingPeriod,
    toggleBillingPeriod,
    isMonthly: billingPeriod === 'monthly',
    isAnnual: billingPeriod === 'annual',
  };
}

/**
 * Utilitário para formatar preço baseado no período
 */
export function formatPriceByPeriod(
  monthlyPrice: number,
  annualPrice: number,
  period: BillingPeriod
): { price: number; period: string } {
  const price = period === 'monthly' ? monthlyPrice : annualPrice;
  const periodLabel = period === 'monthly' ? '/mês' : '/ano';

  return { price, period: periodLabel };
}
