'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useState } from 'react';

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  aiLevel: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export const plans: Plan[] = [
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
  },
];

interface PricingSharedProps {
  currentPlan?: string;
  onPlanClick: (planId: string) => void;
}

export function PricingShared({ currentPlan, onPlanClick }: PricingSharedProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const formatPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return 'Grátis';

    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const getPeriod = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return '';
    return billingPeriod === 'monthly' ? '/mês' : '/ano';
  };

  return (
    <div className="space-y-8">
      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
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
        <p className="text-sm text-green-600 text-center font-medium">
          {getAnnualSavingsMessage(plans)}
        </p>
      )}

      {/* Scroll horizontal container */}
      <div className="overflow-x-auto py-8">
        <div className="flex gap-6 min-w-max px-4 mx-auto no-scrollbar" style={{ justifyContent: 'center' }}>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col w-[280px] transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                plan.highlighted ? 'border-primary border-2 shadow-lg' : 'border-border'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-0 right-0 text-center">
                  <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {currentPlan && currentPlan === plan.id && (
                    <Badge variant="secondary" className="text-xs">
                      Atual
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-xs whitespace-nowrap w-fit">
                  {plan.aiLevel}
                </Badge>
                <CardDescription className="text-xs min-h-[32px] pt-2">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{formatPrice(plan)}</span>
                  {getPeriod(plan) && <span className="text-sm text-muted-foreground">{getPeriod(plan)}</span>}
                </div>
              </CardHeader>

              <CardContent className="flex-grow pt-0">
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  className="w-full"
                  variant={currentPlan === plan.id ? 'secondary' : plan.highlighted ? 'default' : 'outline'}
                  onClick={() => onPlanClick(plan.id)}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? 'Plano Atual' : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Scroll hint for mobile */}
      <div className="text-center text-xs text-muted-foreground md:hidden">← Deslize para ver todos os planos →</div>
    </div>
  );
}
