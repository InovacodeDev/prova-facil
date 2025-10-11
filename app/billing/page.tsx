/**
 * Página de Faturamento e Gerenciamento de Assinatura
 *
 * Segue os padrões do projeto:
 * - Header padrão com navegação
 * - Hooks de cache (useProfile, usePlan)
 * - Layout consistente
 * - Performance otimizada
 */

'use client';

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Receipt, CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile } from '@/hooks/use-cache';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import { PlanType } from '@/db/schema';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionType, useSubscriptionCache } from '@/hooks/use-subscription-cache';
import { ComponentLoader } from '@/components/ui/component-loader';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/PageHeader';
import Stripe from 'stripe';

// Lazy load de componentes pesados
const SubscriptionManager = lazy(() =>
  import('@/components/SubscriptionManager').then((mod) => ({ default: mod.SubscriptionManager }))
);
const Pricing = lazy(() => import('@/components/Pricing').then((mod) => ({ default: mod.Pricing })));

interface Payment {
  id: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  created: Date;
  invoice_pdf?: string;
  description?: string;
}

interface BillingInfo {
  planName: string;
  planId: keyof typeof PlanType;
  status: string;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  billingInterval: 'month' | 'year';
}

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  basic: 'Básico',
  essentials: 'Essencial',
  plus: 'Plus',
  advanced: 'Avançado',
};

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Use hooks de cache para melhor performance
  const { profile, loading: profileLoading } = useProfile();
  const {
    subscription,
    currentPeriodEndDate,
    daysUntilRenewal: subscriptionDaysUntilRenewal,
  } = useSubscriptionCache();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ priceId: string; planName: string } | null>(null);

  // Carrega dados quando profile estiver disponível
  useEffect(() => {
    if (!profileLoading && profile) {
      loadBillingData();
    }
  }, [profileLoading, profile]);

  const loadBillingData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      if (subscription) {
        console.log({ subscription });
        // const paymentsResponse = await fetch(
        //   `/api/stripe/payment-history?customerId=${(subscription.customer as Stripe.Customer).id}`,
        //   {
        //     cache: 'no-store',
        //   }
        // );

        // if (paymentsResponse.ok) {
        //   const data = await paymentsResponse.json();
        //   setPayments(data.payments || []);
        // }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de faturamento:', error);
    } finally {
      setLoading(false);
    }
  }, [profile, supabase, subscription]);

  // Handler para seleção de plano
  const handleSelectPlan = useCallback((priceId: string, planName: string) => {
    setSelectedPlan({ priceId, planName });
    setShowUpgradeDialog(true);
  }, []);

  // Determina se é upgrade ou downgrade
  const getActionType = useCallback((currentPlan: string, targetPlan: string): 'upgrade' | 'downgrade' => {
    const planOrder = ['starter', 'basic', 'essentials', 'plus', 'advanced'];
    const currentIndex = planOrder.indexOf(currentPlan.toLowerCase());
    const targetIndex = planOrder.indexOf(targetPlan.toLowerCase());
    return targetIndex > currentIndex ? 'upgrade' : 'downgrade';
  }, []);

  // Badge de status
  const getStatusBadge = useCallback((status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          Cancelamento Agendado
        </Badge>
      );
    }

    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Ativo
          </Badge>
        );
      case 'trialing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Trial
          </Badge>
        );
      case 'past_due':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Pagamento Atrasado
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }, []);

  // Ícone de status do pagamento
  const getPaymentStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  // Formatação de datas
  const formatDate = useCallback((date?: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date ? new Date(date) : new Date());
  }, []);

  const formatShortDate = useCallback((date?: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date ? new Date(date) : new Date());
  }, []);

  if (profileLoading || loading) {
    return (
      <AppLayout>
        <PageHeader title="Faturamento" description="Gerencie sua assinatura e histórico de pagamentos" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Faturamento" description="Gerencie sua assinatura e histórico de pagamentos" />

      {/* Alerta de Cancelamento */}
      {subscription?.cancel_at_period_end && currentPeriodEndDate && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sua assinatura será cancelada em {formatDate(currentPeriodEndDate.getTime())}.
            <Button
              variant="link"
              size="sm"
              className="ml-2 text-destructive underline"
              onClick={() => router.push('/plan')}
            >
              Reativar Assinatura
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Informações */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Plano Atual */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plano Atual</CardTitle>
              {subscription && getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
            </div>
            <CardDescription>Detalhes da sua assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{PLAN_NAMES[profile?.plan || 'starter']}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {subscription?.items[0]?.data?.plan?.interval === 'year' ? 'Cobrança anual' : 'Cobrança mensal'}
              </p>
            </div>

            {subscription && currentPeriodEndDate && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Período atual</span>
                    <span className="font-medium">{formatShortDate(currentPeriodEndDate.getTime())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {subscription.cancel_at_period_end ? 'Expira em' : 'Renova em'}
                    </span>
                    <span className="font-medium">{formatShortDate(currentPeriodEndDate.getTime())}</span>
                  </div>
                  {!subscription.cancel_at_period_end && subscriptionDaysUntilRenewal && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dias restantes</span>
                      <Badge variant="secondary">{subscriptionDaysUntilRenewal} dias</Badge>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
          {subscription && !subscription.cancel_at_period_end && (
            <CardFooter>
              <Button variant="destructive" className="w-full" onClick={() => setShowCancelDialog(true)}>
                Cancelar Assinatura
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Método de Pagamento
            </CardTitle>
            <CardDescription>Informações de cobrança</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription && !subscription.cancel_at_period_end && currentPeriodEndDate ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Próxima cobrança</span>
                  <span className="text-sm font-medium">{formatShortDate(currentPeriodEndDate.getTime())}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cartão</span>
                  <span className="text-sm font-medium">•••• 4242</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {subscription?.cancel_at_period_end
                    ? 'Sua assinatura não será renovada automaticamente'
                    : 'Nenhum método de pagamento configurado'}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              <CreditCard className="mr-2 h-4 w-4" />
              Atualizar Método
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Planos Disponíveis
      <div>
        <h2 className="text-2xl font-bold mb-4">Planos Disponíveis</h2>
        <Suspense fallback={<ComponentLoader message="Carregando planos..." />}>
          <Pricing handleSelectPlan={() => ({})} className="" />
        </Suspense>
      </div> */}

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>Todos os pagamentos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getPaymentStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">{payment.description || 'Pagamento de assinatura'}</p>
                      <p className="text-sm text-muted-foreground">{formatShortDate(payment.created.getTime())}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{formatPrice(payment.amount / 100)}</p>
                    {payment.invoice_pdf && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={payment.invoice_pdf} target="_blank" rel="noopener noreferrer">
                          Baixar
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showCancelDialog && profile && (
        <Suspense fallback={null}>
          <SubscriptionManager
            currentPlan={profile.plan as keyof typeof PlanType}
            targetPlan="starter"
            action="cancel"
            isOpen={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onSuccess={() => {
              setShowCancelDialog(false);
              loadBillingData();
            }}
          />
        </Suspense>
      )}

      {showUpgradeDialog && selectedPlan && profile && (
        <Suspense fallback={null}>
          <SubscriptionManager
            currentPlan={profile.plan as keyof typeof PlanType}
            targetPlan={selectedPlan.planName as keyof typeof PlanType}
            action={getActionType(profile.plan, selectedPlan.planName)}
            isOpen={showUpgradeDialog}
            onClose={() => {
              setShowUpgradeDialog(false);
              setSelectedPlan(null);
            }}
            onSuccess={() => {
              setShowUpgradeDialog(false);
              setSelectedPlan(null);
              loadBillingData();
            }}
          />
        </Suspense>
      )}
    </AppLayout>
  );
}
