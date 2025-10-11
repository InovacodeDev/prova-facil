/**
 * ImmediateUpgradeDialog - Dialog para confirmar upgrade imediato com proration
 *
 * Informa ao usuário:
 * - O upgrade será imediato
 * - A cobrança será proporcional (proration automática do Stripe)
 * - A data de renovação será mantida
 * - Crédito do plano anterior + cobrança proporcional do novo
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Info, Check } from 'lucide-react';

interface ImmediateUpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  billingPeriod: 'monthly' | 'annual';
  nextRenewalDate?: Date;
}

export function ImmediateUpgradeDialog({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  billingPeriod,
  nextRenewalDate,
}: ImmediateUpgradeDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const getPlanName = (planId: string) => {
    const names: Record<string, string> = {
      starter: 'Starter',
      basic: 'Básico',
      essentials: 'Essencial',
      plus: 'Plus',
      advanced: 'Avançado',
    };
    return names[planId] || planId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Confirmar Upgrade de Plano
          </DialogTitle>
          <DialogDescription>
            Você está fazendo upgrade de <strong>{getPlanName(currentPlan)}</strong> para{' '}
            <strong>{getPlanName(newPlan)}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações sobre o upgrade */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">Como funciona o upgrade:</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Acesso imediato às funcionalidades do novo plano</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    Você receberá crédito proporcional dos dias não utilizados do plano {getPlanName(currentPlan)}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Será cobrado apenas pelos dias restantes do plano {getPlanName(newPlan)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Sua data de renovação será mantida</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Data de renovação */}
          {nextRenewalDate && (
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground">Próxima renovação</div>
              <div className="text-base font-medium">{formatDate(nextRenewalDate)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Período: {billingPeriod === 'monthly' ? 'Mensal' : 'Anual'}
              </div>
            </div>
          )}

          {/* Aviso sobre cobrança */}
          <Alert>
            <AlertDescription className="text-sm">
              Uma fatura será gerada imediatamente com o valor proporcional. O cálculo é feito automaticamente pelo
              Stripe, garantindo que você pague apenas pelo que usar.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Confirmar Upgrade
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
