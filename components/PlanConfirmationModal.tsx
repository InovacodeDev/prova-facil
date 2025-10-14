'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPeriodEnd, formatPrice, getBillingIntervalDisplay, isFreePlan } from '@/lib/stripe/plan-helpers';
import type { StripeProductWithPrices } from '@/types/stripe';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';

interface PlanConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: StripeProductWithPrices | null;
  billingPeriod: 'monthly' | 'annual';
  onConfirm: () => void;
  loading: boolean;
  variant: 'upgrade' | 'downgrade';
  currentPlan?: string;
  currentPeriodEnd?: string;
}

export function PlanConfirmationModal({
  open,
  onOpenChange,
  plan,
  billingPeriod,
  onConfirm,
  loading,
  variant,
  currentPlan,
  currentPeriodEnd,
}: PlanConfirmationModalProps) {
  if (!plan) return null;

  const isDowngradeToStarter = variant === 'downgrade' && isFreePlan(plan.internalPlanId);
  const price = billingPeriod === 'monthly' ? plan.prices.monthly : plan.prices.yearly;
  const priceAmount = price?.unit_amount ? formatPrice(price.unit_amount) : 'Grátis';
  const billingDisplay = getBillingIntervalDisplay(billingPeriod === 'monthly' ? 'month' : 'year');
  const formattedPeriodEnd = currentPeriodEnd ? formatPeriodEnd(currentPeriodEnd) : '';

  // Determine modal title
  const title = variant === 'upgrade' ? 'Confirmar Upgrade de Plano' : 'Confirmar Alteração de Plano';

  // Determine modal description
  let description: string;
  if (isDowngradeToStarter) {
    description = `Seu plano atual será cancelado ao final do período de cobrança em ${formattedPeriodEnd}. Você voltará ao plano gratuito Starter após essa data.`;
  } else if (variant === 'downgrade') {
    description = `Seu plano será alterado para ${plan.name} (${billingDisplay}) ao final do período de cobrança atual em ${formattedPeriodEnd}. Seu novo valor será ${priceAmount}.`;
  } else {
    description = `Você está prestes a fazer upgrade para o plano ${plan.name}. A cobrança será processada imediatamente.`;
  }

  // Determine button text
  let confirmButtonText: string;
  if (isDowngradeToStarter) {
    confirmButtonText = 'Confirmar Cancelamento';
  } else if (variant === 'downgrade') {
    confirmButtonText = 'Confirmar Alteração';
  } else {
    confirmButtonText = 'Confirmar e Pagar';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'downgrade' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left pt-2">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Details */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <Badge variant="outline" className="mt-1">
                  {plan.aiLevel}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{priceAmount}</div>
                {!isFreePlan(plan.internalPlanId) && (
                  <div className="text-sm text-muted-foreground">por {billingDisplay}</div>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">Recursos incluídos:</p>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional Info for Downgrades */}
          {variant === 'downgrade' && !isDowngradeToStarter && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Atenção:</strong> A alteração será efetivada em {formattedPeriodEnd}. Até lá, você continuará
                com acesso ao seu plano atual.
              </p>
            </div>
          )}

          {/* Warning for Starter Downgrade */}
          {isDowngradeToStarter && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-900 dark:text-red-100">
                <strong>Atenção:</strong> Ao confirmar, sua assinatura será cancelada e você perderá o acesso aos
                recursos premium em {formattedPeriodEnd}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading} variant={isDowngradeToStarter ? 'destructive' : 'default'}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
