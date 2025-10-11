/**
 * UpgradeConfirmDialog - Dialog para confirmar upgrade imediato ou agendado
 *
 * Exibe:
 * - Preview de proration (crédito do plano atual)
 * - Custo imediato vs agendado
 * - Opção de upgrade imediato ou aguardar próxima renovação
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Calendar, DollarSign, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logClientError } from '@/lib/client-error-logger';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface UpgradeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (immediate: boolean) => void;
  currentPlan: string;
  newPlan: string;
  billingPeriod: 'monthly' | 'annual';
  newPlanPrice: number;
}

export function UpgradeConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  billingPeriod,
  newPlanPrice,
}: UpgradeConfirmDialogProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeType, setUpgradeType] = useState<'immediate' | 'scheduled'>('immediate');
  const [preview, setPreview] = useState<{
    immediateCharge: number;
    prorationCredit: number;
    newPlanCharge: number;
    nextInvoiceDate: Date;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
    }
  }, [isOpen, newPlan, billingPeriod]);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/stripe/upgrade-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPlanId: newPlan,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar preview');
      }

      const data = await response.json();
      setPreview({
        ...data.preview,
        nextInvoiceDate: new Date(data.preview.nextInvoiceDate),
      });
    } catch (error: any) {
      console.error('Erro ao buscar preview:', error);
      logClientError(error, {
        component: 'UpgradeConfirmDialog',
        action: 'fetchPreview',
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular o preview. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    onConfirm(upgradeType === 'immediate');
  };

  const formatPrice = (price: number) => {
    return `R$ ${(price ?? 0).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Confirmar Upgrade
          </DialogTitle>
          <DialogDescription>
            Você está fazendo upgrade de <strong>{currentPlan}</strong> para <strong>{newPlan}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : preview ? (
            <>
              {/* Opções de upgrade */}
              <RadioGroup
                value={upgradeType}
                onValueChange={(value) => setUpgradeType(value as 'immediate' | 'scheduled')}
                className="space-y-4"
              >
                {/* Upgrade Imediato */}
                <div className="relative flex items-start space-x-3 rounded-lg border-2 border-border p-4 transition-colors hover:border-primary">
                  <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
                  <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Upgrade Imediato</span>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Recomendado</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ative o novo plano agora e aproveite os benefícios imediatamente
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Crédito do plano atual:</span>
                        <span className="font-medium text-green-600">- {formatPrice(preview.prorationCredit)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cobrança do novo plano:</span>
                        <span className="font-medium">+ {formatPrice(preview.newPlanCharge)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold">Total a pagar agora:</span>
                        <span className="text-lg font-bold text-primary">{formatPrice(preview.immediateCharge)}</span>
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Upgrade Agendado */}
                <div className="relative flex items-start space-x-3 rounded-lg border-2 border-border p-4 transition-colors hover:border-primary">
                  <RadioGroupItem value="scheduled" id="scheduled" className="mt-1" />
                  <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Agendar para Renovação</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">O novo plano será ativado na próxima renovação</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Ativação em: <strong>{formatDate(preview.nextInvoiceDate)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Cobrança futura: <strong>{formatPrice(newPlanPrice)}</strong>
                        </span>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Informações adicionais */}
              <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                <p className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    {upgradeType === 'immediate'
                      ? 'Acesso imediato a todos os recursos do novo plano'
                      : 'Continue usando seu plano atual até a data de ativação'}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Você pode cancelar a qualquer momento</span>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Erro ao carregar preview</div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoadingPreview || isProcessing || !preview} className="flex-1">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Upgrade
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
