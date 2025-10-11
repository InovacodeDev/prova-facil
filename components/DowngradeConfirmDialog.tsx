/**
 * DowngradeConfirmDialog - Dialog para confirmar downgrade
 *
 * Downgrades são sempre agendados para o final do período atual
 * para que o usuário aproveite o que já pagou
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
import { Loader2, TrendingDown, Calendar, AlertCircle, Check, X } from 'lucide-react';

interface DowngradeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  currentPeriodEnd: Date | null;
}

export function DowngradeConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  currentPeriodEnd,
}: DowngradeConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = () => {
    setIsProcessing(true);
    onConfirm();
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            Confirmar Downgrade
          </DialogTitle>
          <DialogDescription>
            Você está fazendo downgrade de <strong>{currentPlan}</strong> para <strong>{newPlan}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Aviso sobre quando o downgrade ocorre */}
          <div className="rounded-lg border-2 border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-sm">Downgrade Agendado</p>
                <p className="text-sm text-muted-foreground">
                  O downgrade será efetivado apenas no final do seu período atual. Você continuará com acesso completo
                  ao plano <strong>{currentPlan}</strong> até lá.
                </p>
              </div>
            </div>
          </div>

          {/* Data de efetivação */}
          {currentPeriodEnd && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Data de Efetivação</p>
                  <p className="text-lg font-bold text-primary">{formatDate(currentPeriodEnd)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                A partir desta data, seu plano será alterado para <strong>{newPlan}</strong> e a cobrança será ajustada
                de acordo.
              </p>
            </div>
          )}

          {/* O que acontece */}
          <div className="space-y-3">
            <p className="font-semibold text-sm">O que vai acontecer:</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  Você mantém todos os benefícios do plano <strong>{currentPlan}</strong> até{' '}
                  {currentPeriodEnd && formatDate(currentPeriodEnd)}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  Após esta data, seu plano será automaticamente alterado para <strong>{newPlan}</strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Você pode cancelar este downgrade a qualquer momento antes da data</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Alguns recursos do plano atual poderão não estar disponíveis após o downgrade</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="flex-1" variant="default">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Downgrade
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
