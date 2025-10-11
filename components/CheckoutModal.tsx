/**
 * CheckoutModal - Modal para iniciar processo de checkout do Stripe
 *
 * Este componente exibe os detalhes do plano selecionado e inicia
 * a sessão de checkout do Stripe quando o usuário confirma.
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logClientError } from '@/lib/client-error-logger';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  billingPeriod: 'monthly' | 'annual';
}

export function CheckoutModal({ isOpen, onClose, plan, billingPeriod }: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!plan) return null;

  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const formattedPrice = `R$ ${price.toFixed(2).replace('.', ',')}`;
  const period = billingPeriod === 'monthly' ? '/mês' : '/ano';
  const savings =
    billingPeriod === 'annual'
      ? (((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100).toFixed(0)
      : 0;

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      // Chamar API para criar sessão de checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar sessão de checkout');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('URL de checkout não recebida');
      }

      // Redirecionar para o Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      logClientError(error, {
        component: 'CheckoutModal',
        action: 'handleCheckout',
        planId: plan.id,
        billingPeriod,
      });

      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Ocorreu um erro ao iniciar o checkout. Tente novamente.',
        variant: 'destructive',
      });

      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Confirmar assinatura
          </DialogTitle>
          <DialogDescription>
            Você está prestes a assinar o plano {plan.name}. Revise os detalhes abaixo antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Detalhes do plano */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              {billingPeriod === 'annual' && Number(savings) > 0 && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  Economize {savings}%
                </Badge>
              )}
            </div>

            {/* Preço */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">{formattedPrice}</span>
              <span className="text-muted-foreground">{period}</span>
            </div>

            {/* Características incluídas */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Inclui:</p>
              {plan.features.slice(0, 5).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Informações de pagamento */}
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Pagamento seguro processado pelo Stripe</span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Cancele a qualquer momento sem taxas</span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{billingPeriod === 'monthly' ? 'Cobrado mensalmente' : 'Cobrado anualmente com desconto'}</span>
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleCheckout} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Ir para pagamento
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
