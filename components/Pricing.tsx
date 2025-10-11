'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Ideal para testar a plataforma',
    aiLevel: 'IA Básica',
    features: [
      'Até 25 questões/mês para suas primeiras turmas',
      '1 tipo de questão personalizável',
      'Upload de arquivos TXT e DOCX (10MB)',
      'Entrada de texto direto',
      'Suporte por email',
    ],
    cta: 'Começar Grátis',
    highlighted: false,
    stripeProductId: null, // Plano gratuito não tem product_id
    stripePriceIds: {
      monthly: null, // Plano gratuito não tem price_id
      annual: null,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 29.9,
    annualPrice: 269.1, // 29.9 * 12 * 0.75 = 25% desconto
    description: 'Perfeito para 2-3 turmas pequenas',
    aiLevel: 'IA Básica',
    features: [
      'Até 50 questões/mês, ideal para aulas semanais',
      'Até 2 tipos de questões disponíveis',
      'Upload de arquivos TXT e DOCX (20MB)',
      'Entrada de texto direto',
      'Suporte prioritário com resposta em 24h',
    ],
    cta: 'Começar Agora',
    highlighted: false,
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_BASIC || 'prod_TCS8S7wBmvsW3g',
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_ANNUAL || '',
    },
  },
  {
    id: 'essentials',
    name: 'Essentials',
    monthlyPrice: 49.9,
    annualPrice: 449.1, // 49.9 * 12 * 0.75 = 25% desconto
    description: 'Ótimo para 4-5 turmas regulares',
    aiLevel: 'IA Avançada',
    features: [
      'Até 75 questões/mês para diversas disciplinas',
      'Até 3 tipos de questões disponíveis',
      'Upload de PDF, DOCX, TXT e links externos (30MB)',
      'IA avançada com maior precisão contextual',
      'Suporte prioritário via email e WhatsApp',
    ],
    cta: 'Começar Agora',
    highlighted: false,
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_ESSENTIALS || 'prod_TCS9mLq5I4Ocsd',
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENTIALS_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENTIALS_ANNUAL || '',
    },
  },
  {
    id: 'plus',
    name: 'Plus',
    monthlyPrice: 79.9,
    annualPrice: 719.1, // 79.9 * 12 * 0.75 = 25% desconto
    description: 'Completo para múltiplas turmas',
    aiLevel: 'IA Avançada',
    features: [
      'Até 100 questões/mês, liberdade para criar sem limites',
      'Até 4 tipos de questões disponíveis',
      'Upload de PPTX, PDF, DOCX, TXT + links (40MB)',
      'IA avançada otimizada para contextos técnicos',
      'Suporte VIP com atendimento prioritário',
    ],
    cta: 'Começar Agora',
    highlighted: false,
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_PLUS || 'prod_TCSAL9dxY7XDmh',
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_ANNUAL || '',
    },
  },
  {
    id: 'advanced',
    name: 'Advanced',
    monthlyPrice: 129.9,
    annualPrice: 1169.1, // 129.9 * 12 * 0.75 = 25% desconto
    description: 'Máxima capacidade para instituições',
    aiLevel: 'IA Premium',
    features: [
      'Até 150 questões/mês com máxima qualidade',
      'Todos os 6 tipos de questões disponíveis',
      'Upload de PPTX, PDF, DOCX, TXT + links (50MB)',
      'IA Premium com precisão máxima e contexto profundo',
      'Suporte VIP dedicado com resposta imediata',
    ],
    cta: 'Começar Agora',
    highlighted: true,
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_ADVANCED || 'prod_TCSAOytSIbuuYi',
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED_ANNUAL || '',
    },
  },
];

type Props = {
  className?: string;
  currentPlanId?: string;
  handleSelectPlan: (planId: string) => void;
};

export function Pricing({ className, currentPlanId, handleSelectPlan }: Props) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [stripeProducts, setStripeProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stripe/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setStripeProducts(data.products);
      })
      .catch((error) => {
        console.error('Erro ao carregar produtos do Stripe:', error);
      });
  }, []);

  const formatPrice = (plan: (typeof plans)[0]) => {
    if (plan.monthlyPrice === 0) return 'Grátis';

    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const getPeriod = (plan: (typeof plans)[0]) => {
    if (plan.monthlyPrice === 0) return '';
    return billingPeriod === 'monthly' ? '/mês' : '/ano';
  };

  return (
    <section id="pricing" className={className ?? 'py-20 bg-muted/50'}>
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos e Preços</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Escolha o plano que se encaixa no seu ritmo de trabalho. Todos com acesso completo às funcionalidades
            principais.
          </p>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
              onClick={() => setBillingPeriod('monthly')}
              className="min-w-[120px]"
            >
              Mensal
            </Button>
            <Button
              variant={billingPeriod === 'annual' ? 'default' : 'outline'}
              onClick={() => setBillingPeriod('annual')}
              className="min-w-[120px] relative"
            >
              Anual
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5">-25%</Badge>
            </Button>
          </div>
          {billingPeriod === 'annual' && (
            <p className="text-sm text-green-600 mt-2 font-medium">
              🎉 Economize ~75 dias (equivalente a 2,5 meses) ao escolher o plano anual!
            </p>
          )}
        </div>

        {/* Scroll horizontal container */}
        <div className="overflow-x-auto py-8 no-scrollbar">
          <div className="flex gap-6 min-w-max px-4 mx-auto" style={{ justifyContent: 'center' }}>
            {plans.map((plan) => {
              const stripeProduct = (stripeProducts ?? []).find((p) => p.id === plan.stripeProductId);
              if (!stripeProduct && plan.id !== 'starter') return null;
              const priceId = billingPeriod === 'monthly' ? plan.stripePriceIds.monthly : plan.stripePriceIds.annual;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col w-[320px] transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    plan.highlighted ? 'border-primary border-2 shadow-lg' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between mb-2">
                      {currentPlanId === plan.id && (
                        <Badge variant="secondary" className="text-xs mr-4">
                          Atual
                        </Badge>
                      )}
                      <span className="flex-grow">{plan.name}</span>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {plan.aiLevel}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm min-h-[40px]">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{formatPrice(plan)}</span>
                      {getPeriod(plan) && <span className="text-sm text-muted-foreground">{getPeriod(plan)}</span>}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow pt-0">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Button
                      className="w-full"
                      variant={currentPlanId === plan.id ? 'secondary' : 'default'}
                      disabled={currentPlanId === plan.id}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {currentPlanId === plan.id ? 'Plano Atual' : 'Selecionar Plano'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Scroll hint for mobile */}
        <div className="text-center mt-4 text-xs text-muted-foreground md:hidden">
          ← Deslize para ver todos os planos →
        </div>
      </div>
    </section>
  );
}
