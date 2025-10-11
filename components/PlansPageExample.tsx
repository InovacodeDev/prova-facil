/**
 * Exemplo de Integração do SubscriptionManager na Página de Planos
 *
 * Este arquivo demonstra como integrar o componente SubscriptionManager
 * na página de planos para permitir upgrades, downgrades e cancelamentos.
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle } from 'lucide-react';
import { PlanType } from '@/db/schema';

// Definição dos planos
const PLANS = [
  {
    id: 'starter' as keyof typeof PlanType,
    name: 'Starter',
    price: 0,
    description: 'Plano gratuito para começar',
    features: ['10 questões por mês', 'Formatos básicos', 'Suporte por e-mail'],
  },
  {
    id: 'basic' as keyof typeof PlanType,
    name: 'Basic',
    price: 49,
    description: 'Para professores individuais',
    features: ['100 questões por mês', 'Todos os formatos', 'Suporte prioritário', 'Histórico de 30 dias'],
  },
  {
    id: 'essentials' as keyof typeof PlanType,
    name: 'Essentials',
    price: 69,
    description: 'Para uso profissional',
    features: [
      '500 questões por mês',
      'Todos os formatos',
      'Suporte prioritário',
      'Histórico de 90 dias',
      'Exportação em PDF',
    ],
  },
  {
    id: 'plus' as keyof typeof PlanType,
    name: 'Plus',
    price: 99,
    description: 'Para equipes pequenas',
    features: [
      '1000 questões por mês',
      'Todos os formatos',
      'Suporte dedicado',
      'Histórico ilimitado',
      'Exportação avançada',
      'API de integração',
    ],
  },
  {
    id: 'advanced' as keyof typeof PlanType,
    name: 'Advanced',
    price: 149,
    description: 'Para instituições',
    features: [
      'Questões ilimitadas',
      'Todos os formatos',
      'Suporte 24/7',
      'Histórico ilimitado',
      'Exportação avançada',
      'API de integração',
      'White label',
      'Gerenciamento de equipes',
    ],
  },
];

interface SubscriptionAction {
  action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
  targetPlan: keyof typeof PlanType;
  billingInterval: 'monthly' | 'annual';
}

export function PlansPageExample() {
  const { profile } = useAuth();
  const [subscriptionAction, setSubscriptionAction] = useState<SubscriptionAction | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  const currentPlan = (profile?.plan || 'starter') as keyof typeof PlanType;
  const hasActiveSubscription = currentPlan !== 'starter';
  const isCancelled = false; // TODO: Buscar do Stripe via getSubscriptionData()

  // Determinar a ação para cada plano
  const getActionForPlan = (planId: keyof typeof PlanType): 'upgrade' | 'downgrade' | 'cancel' | 'current' => {
    if (planId === currentPlan) return 'current';
    if (planId === 'starter') return 'cancel';

    const currentIndex = PLANS.findIndex((p) => p.id === currentPlan);
    const targetIndex = PLANS.findIndex((p) => p.id === planId);

    return targetIndex > currentIndex ? 'upgrade' : 'downgrade';
  };

  // Obter texto do botão
  const getButtonText = (planId: keyof typeof PlanType): string => {
    const action = getActionForPlan(planId);
    switch (action) {
      case 'current':
        return 'Plano Atual';
      case 'upgrade':
        return 'Fazer Upgrade';
      case 'downgrade':
        return 'Fazer Downgrade';
      case 'cancel':
        return 'Cancelar Assinatura';
    }
  };

  // Lidar com clique no botão
  const handlePlanAction = (planId: keyof typeof PlanType) => {
    const action = getActionForPlan(planId);

    if (action === 'current') return;

    setSubscriptionAction({
      action,
      targetPlan: planId,
      billingInterval,
    });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-muted-foreground text-lg">
          {hasActiveSubscription
            ? `Você está no plano ${PLANS.find((p) => p.id === currentPlan)?.name}`
            : 'Comece gratuitamente ou escolha um plano pago'}
        </p>

        {/* Toggle Mensal/Anual */}
        <div className="mt-6 inline-flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingInterval('monthly')}
          >
            Mensal
          </Button>
          <Button
            variant={billingInterval === 'annual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingInterval('annual')}
          >
            Anual
            <Badge variant="secondary" className="ml-2">
              -20%
            </Badge>
          </Button>
        </div>

        {isCancelled && (
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>Sua assinatura será cancelada no final do período</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSubscriptionAction({ action: 'reactivate', targetPlan: currentPlan, billingInterval })}
            >
              Reativar
            </Button>
          </div>
        )}
      </div>

      {/* Grid de Planos */}
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const action = getActionForPlan(plan.id);

          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent && <Badge variant="default">Atual</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? (
                      'Grátis'
                    ) : (
                      <>R$ {billingInterval === 'annual' ? Math.round(plan.price * 0.8 * 12) : plan.price}</>
                    )}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/{billingInterval === 'annual' ? 'ano' : 'mês'}</span>
                  )}
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={action === 'upgrade' ? 'default' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => handlePlanAction(plan.id)}
                >
                  {getButtonText(plan.id)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Gerenciamento de Assinatura */}
      {subscriptionAction && (
        <SubscriptionManager
          currentPlan={currentPlan}
          targetPlan={subscriptionAction.targetPlan}
          billingInterval={subscriptionAction.billingInterval}
          action={subscriptionAction.action}
          isOpen={!!subscriptionAction}
          onClose={() => setSubscriptionAction(null)}
          onSuccess={() => {
            setSubscriptionAction(null);
            // Recarregar dados do usuário
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

/**
 * COMO USAR:
 *
 * 1. Substituir o conteúdo de app/plan/page.tsx por:
 *
 * ```tsx
 * import { PlansPageExample } from '@/components/PlansPageExample';
 *
 * export default function PlanPage() {
 *   return <PlansPageExample />;
 * }
 * ```
 *
 * 2. Buscar status de cancelamento do Stripe:
 *
 * ```tsx
 * const [isCancelled, setIsCancelled] = useState(false);
 *
 * useEffect(() => {
 *   async function checkCancellation() {
 *     if (profile?.stripe_subscription_id) {
 *       const subData = await getSubscriptionData(profile.stripe_subscription_id);
 *       setIsCancelled(subData?.cancelAtPeriodEnd || false);
 *     }
 *   }
 *   checkCancellation();
 * }, [profile]);
 * ```
 *
 * 3. Para planos com período de trial:
 *
 * ```tsx
 * {subData?.trialEnd && new Date(subData.trialEnd) > new Date() && (
 *   <Badge variant="secondary">
 *     Trial até {new Date(subData.trialEnd).toLocaleDateString()}
 *   </Badge>
 * )}
 * ```
 */
