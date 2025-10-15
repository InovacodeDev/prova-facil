'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Crown, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PlanCardProps {
  plan: string;
  period: 'monthly' | 'yearly';
  nextRenewal: Date;
  scheduledNextPlan?: string | null;
  isLoading?: boolean;
}

const planDisplayNames: Record<string, string> = {
  starter: 'Starter',
  basic: 'Basic',
  essentials: 'Essentials',
  plus: 'Plus',
  advanced: 'Advanced',
};

export function PlanCard({ plan, period, nextRenewal, scheduledNextPlan, isLoading }: PlanCardProps) {
  const router = useRouter();
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      // Get current subscription data
      const subResponse = await fetch('/api/stripe/subscription');
      if (!subResponse.ok) throw new Error('Failed to fetch subscription');

      const { subscription } = await subResponse.json();

      // Schedule downgrade to starter
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: 'starter',
          newPriceId: null, // Starter is free
          billingPeriod: period,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      // Refresh the page to show updated data
      router.refresh();
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert(error instanceof Error ? error.message : 'Erro ao cancelar assinatura');
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Plano Atual
        </CardTitle>
        <CardDescription>Gerencie sua assinatura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plano</span>
            <Badge variant="default" className="text-base">
              {planDisplayNames[plan] || plan}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Período</span>
            <span className="text-sm font-medium">{period === 'monthly' ? 'Mensal' : 'Anual'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Próxima renovação</span>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatDate(nextRenewal)}</span>
            </div>
          </div>
        </div>

        {/* Scheduled Change */}
        {scheduledNextPlan && scheduledNextPlan !== plan && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">Mudança agendada</p>
                <p className="text-xs text-orange-700 mt-1">
                  Após {formatDate(nextRenewal)}, seu plano será alterado para{' '}
                  <span className="font-semibold">{planDisplayNames[scheduledNextPlan] || scheduledNextPlan}</span>
                </p>
              </div>
              <Badge variant="outline" className="bg-white">
                → {planDisplayNames[scheduledNextPlan] || scheduledNextPlan}
              </Badge>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => router.push('/plan')}>
            Alterar Plano
          </Button>

          {plan !== 'starter' && !scheduledNextPlan && (
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar Assinatura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seu plano <strong>{planDisplayNames[plan]}</strong> continuará ativo até{' '}
                    <strong>{formatDate(nextRenewal)}</strong>. Após essa data, você será migrado para o plano Starter
                    (gratuito).
                    <br />
                    <br />
                    Você pode alterar essa decisão a qualquer momento antes da data de renovação.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelSubscription} disabled={isCanceling}>
                    {isCanceling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Confirmar Cancelamento'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {plan === 'starter' && (
          <p className="text-xs text-muted-foreground text-center">
            Faça upgrade para acessar mais recursos e gerar mais questões
          </p>
        )}
      </CardContent>
    </Card>
  );
}
