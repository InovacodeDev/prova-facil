'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/stripe';
import { getPlanConfig } from '@/lib/plans/config';
import type { StripeProductWithPrices } from '@/types/stripe';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PricingSharedProps {
  currentPlan?: string;
  currentBillingPeriod?: 'monthly' | 'annual';
  scheduledNextPlan?: string | null;
  currentPeriodEnd?: string | null;
  onPlanClick: (planId: string, priceId: string, billingPeriod: 'monthly' | 'annual') => void;
}

export function PricingShared({
  currentPlan,
  currentBillingPeriod,
  scheduledNextPlan,
  currentPeriodEnd,
  onPlanClick,
}: PricingSharedProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Use the hook to fetch products with automatic caching
  const { data: products, isLoading, error } = useProducts();

  const formatPrice = (product: StripeProductWithPrices) => {
    const price = billingPeriod === 'monthly' ? product.prices.monthly : product.prices.yearly;

    if (!price || price.unit_amount === 0) return 'Grátis';

    const reais = price.unit_amount / 100;
    return `R$ ${reais.toFixed(2).replace('.', ',')}`;
  };

  const getPeriod = (product: StripeProductWithPrices) => {
    const price = billingPeriod === 'monthly' ? product.prices.monthly : product.prices.yearly;
    if (!price || price.unit_amount === 0) return '';
    return billingPeriod === 'monthly' ? '/mês' : '/ano';
  };

  const getPriceId = (product: StripeProductWithPrices): string => {
    const price = billingPeriod === 'monthly' ? product.prices.monthly : product.prices.yearly;
    return price?.id || '';
  };

  return (
    <div className="space-y-8">
      {/* Scheduled Plan Change Alert - Same style as billing page */}
      {scheduledNextPlan && currentPeriodEnd && (
        <div className="max-w-2xl mx-auto rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">Mudança de plano agendada</p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Após{' '}
                <strong>
                  {new Date(currentPeriodEnd).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
                , seu plano será alterado para <strong className="capitalize">{scheduledNextPlan}</strong>.
              </p>
            </div>
            <Badge variant="outline" className="bg-white dark:bg-slate-950 shrink-0">
              → {scheduledNextPlan}
            </Badge>
          </div>
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingPeriod('monthly')}
          className="min-w-[120px]"
          disabled={isLoading}
        >
          Mensal
        </Button>
        <Button
          variant={billingPeriod === 'annual' ? 'default' : 'outline'}
          onClick={() => setBillingPeriod('annual')}
          className="min-w-[120px] relative"
          disabled={isLoading}
        >
          Anual
          <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5">-25%</Badge>
        </Button>
      </div>
      {billingPeriod === 'annual' && (
        <p className="text-sm text-green-600 text-center font-medium">💰 Economize 25% com o plano anual</p>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao carregar planos. Por favor, tente novamente.</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      )}

      {/* Scroll horizontal container */}
      {!isLoading && products && products.length > 0 && (
        <div className="overflow-x-auto py-8">
          <div className="flex gap-6 min-w-max px-4 mx-auto no-scrollbar" style={{ justifyContent: 'center' }}>
            {/* Sort products by price (ascending - lowest to highest) */}
            {[...products]
              .sort((a, b) => {
                const priceA =
                  billingPeriod === 'monthly' ? a.prices.monthly?.unit_amount : a.prices.yearly?.unit_amount;
                const priceB =
                  billingPeriod === 'monthly' ? b.prices.monthly?.unit_amount : b.prices.yearly?.unit_amount;
                return (priceA || 0) - (priceB || 0);
              })
              .map((product) => {
                // Get static plan config from frontend
                const planConfig = getPlanConfig(product.internalPlanId);
                const priceId = getPriceId(product);
                const isCurrentPlan = currentPlan === product.internalPlanId;

                // Check if this is the same plan but different billing period
                const isCurrentPlanDifferentPeriod =
                  isCurrentPlan &&
                  currentBillingPeriod &&
                  ((currentBillingPeriod === 'monthly' && billingPeriod === 'annual') ||
                    (currentBillingPeriod === 'annual' && billingPeriod === 'monthly'));

                // Button text logic
                let buttonText = 'Selecionar Plano';
                let isButtonDisabled = isLoading;

                if (isCurrentPlan && !isCurrentPlanDifferentPeriod) {
                  buttonText = 'Plano Atual';
                  isButtonDisabled = true;
                } else if (isCurrentPlanDifferentPeriod) {
                  buttonText = billingPeriod === 'annual' ? 'Mudar para Anual' : 'Mudar para Mensal';
                  isButtonDisabled = false;
                }

                return (
                  <Card
                    key={product.id}
                    className={`relative flex flex-col w-[280px] transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      planConfig.highlighted ? 'border-primary border-2 shadow-lg' : 'border-border'
                    }`}
                  >
                    {planConfig.highlighted && (
                      <div className="absolute -top-4 left-0 right-0 text-center">
                        <Badge className="bg-primary text-primary-foreground">
                          {planConfig.badge || 'Recomendado'}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-2">
                        {/* Name from Stripe, fallback to frontend config */}
                        <CardTitle className="text-xl">{product.name || planConfig.displayName}</CardTitle>
                        {isCurrentPlan && !isCurrentPlanDifferentPeriod && (
                          <Badge variant="secondary" className="text-xs">
                            Atual
                          </Badge>
                        )}
                        {isCurrentPlanDifferentPeriod && (
                          <Badge variant="outline" className="text-xs">
                            {billingPeriod === 'annual' ? 'Economize 25%' : 'Seu Plano'}
                          </Badge>
                        )}
                      </div>
                      {/* AI Level from frontend config */}
                      <Badge variant="outline" className="text-xs whitespace-nowrap w-fit">
                        {planConfig.aiLevel}
                      </Badge>
                      {/* Description from frontend config */}
                      <CardDescription className="text-xs min-h-[32px] pt-2">{planConfig.description}</CardDescription>
                      {/* Prices from Stripe */}
                      <div className="mt-4">
                        <span className="text-3xl font-bold">{formatPrice(product)}</span>
                        {getPeriod(product) && (
                          <span className="text-sm text-muted-foreground">{getPeriod(product)}</span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-grow pt-0">
                      {/* Features from frontend config */}
                      <ul className="space-y-2.5">
                        {planConfig.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Button
                        className="w-full"
                        variant={isCurrentPlan && !isCurrentPlanDifferentPeriod ? 'secondary' : 'default'}
                        onClick={() => onPlanClick(product.internalPlanId, priceId, billingPeriod)}
                        disabled={isButtonDisabled}
                      >
                        {buttonText}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Scroll hint for mobile */}
      {!isLoading && products && products.length > 0 && (
        <div className="text-center text-xs text-muted-foreground md:hidden">← Deslize para ver todos os planos →</div>
      )}
    </div>
  );
}
