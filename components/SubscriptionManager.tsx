/**
 * SubscriptionManager Component
 *
 * Gerencia upgrades, downgrades, cancelamento e reativação de assinaturas.
 *
 * Comportamentos:
 * - Upgrade: imediato com cobrança proporcional
 * - Downgrade: agendado para final do período (sem cobrança adicional)
 * - Cancelamento: mantém acesso até o final do período pago
 * - Reativação: remove flag de cancelamento agendado
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { PlanType } from '@/db/schema';

type BillingInterval = 'monthly' | 'annual';

interface SubscriptionManagerProps {
  currentPlan: keyof typeof PlanType;
  targetPlan: keyof typeof PlanType;
  billingInterval?: BillingInterval; // Intervalo de cobrança (padrão: monthly)
  action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ActionResult {
  success: boolean;
  message: string;
  effectiveDate?: string;
  prorationAmount?: number;
}

export function SubscriptionManager({
  currentPlan,
  targetPlan,
  billingInterval = 'monthly',
  action,
  isOpen,
  onClose,
  onSuccess,
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [prorationAmount, setProrationAmount] = useState<number | null>(null);

  // Buscar proration se for upgrade
  const fetchProration = async () => {
    if (action !== 'upgrade') return;

    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upgrade',
          newPlan: targetPlan,
          billingInterval,
        }),
      });

      const data = await response.json();
      if (data.prorationAmount) {
        setProrationAmount(data.prorationAmount);
      }
    } catch (error) {
      console.error('Erro ao calcular proration:', error);
    }
  };

  // Executar ação
  const handleAction = async (immediate: boolean = false) => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          newPlan: action === 'cancel' ? undefined : targetPlan,
          billingInterval,
          immediate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          effectiveDate: data.effectiveDate,
          prorationAmount: data.prorationAmount,
        });

        // Aguardar 2 segundos antes de chamar onSuccess
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro ao processar solicitação',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Erro de conexão',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar proration ao abrir dialog de upgrade
  if (isOpen && action === 'upgrade' && prorationAmount === null) {
    fetchProration();
  }

  // Textos dinâmicos
  const getTitle = () => {
    switch (action) {
      case 'upgrade':
        return `Fazer Upgrade para ${targetPlan}`;
      case 'downgrade':
        return `Fazer Downgrade para ${targetPlan}`;
      case 'cancel':
        return 'Cancelar Assinatura';
      case 'reactivate':
        return 'Reativar Assinatura';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'upgrade':
        return `Seu plano será atualizado imediatamente de ${currentPlan} para ${targetPlan}. Você será cobrado proporcionalmente pelo tempo restante no período atual.`;
      case 'downgrade':
        return `Seu plano será alterado para ${targetPlan} no final do período atual (${new Date().toLocaleDateString()}). Você continuará usando o plano ${currentPlan} até lá, sem cobrança adicional.`;
      case 'cancel':
        return `Sua assinatura será cancelada no final do período atual. Você continuará tendo acesso aos recursos do plano ${currentPlan} até ${new Date().toLocaleDateString()}.`;
      case 'reactivate':
        return `Sua assinatura será reativada e você continuará no plano ${currentPlan}.`;
    }
  };

  const getIcon = () => {
    if (result) {
      return result.success ? (
        <CheckCircle2 className="h-6 w-6 text-green-600" />
      ) : (
        <AlertTriangle className="h-6 w-6 text-red-600" />
      );
    }
    return action === 'cancel' ? (
      <AlertTriangle className="h-6 w-6 text-yellow-600" />
    ) : (
      <Info className="h-6 w-6 text-blue-600" />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="pt-4">{getDescription()}</DialogDescription>
        </DialogHeader>

        {/* Informação de Proration (Upgrade) */}
        {action === 'upgrade' && prorationAmount !== null && !result && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Valor a cobrar agora:</strong> {formatPrice(prorationAmount / 100)}
              <br />
              <span className="text-sm text-muted-foreground">
                Este valor representa o período restante do seu plano atual.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Opção de Downgrade Imediato */}
        {action === 'downgrade' && !result && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Você pode aplicar o downgrade imediatamente, mas isso gerará um crédito proporcional que será usado no
              próximo pagamento. Recomendamos aguardar o final do período.
            </AlertDescription>
          </Alert>
        )}

        {/* Resultado da Operação */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <AlertDescription>
              {result.message}
              {result.effectiveDate && (
                <>
                  <br />
                  <span className="text-sm">Data efetiva: {new Date(result.effectiveDate).toLocaleDateString()}</span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>

          {!result && (
            <>
              {action === 'downgrade' && (
                <Button variant="outline" onClick={() => handleAction(true)} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Aplicar Agora'
                  )}
                </Button>
              )}

              <Button
                onClick={() => handleAction(false)}
                disabled={isLoading}
                variant={action === 'cancel' ? 'destructive' : 'default'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {action === 'upgrade' && 'Confirmar Upgrade'}
                    {action === 'downgrade' && 'Agendar para Fim do Período'}
                    {action === 'cancel' && 'Confirmar Cancelamento'}
                    {action === 'reactivate' && 'Reativar Assinatura'}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
