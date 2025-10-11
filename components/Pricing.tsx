'use client';

import { useRouter } from 'next/navigation';
import { PricingShared } from '@/components/PricingShared';

export function Pricing() {
  const router = useRouter();

  const handlePlanClick = (planId: string) => {
    router.push('/auth');
  };

  return (
    <section id="pricing" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos e Preços</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano que se encaixa no seu ritmo de trabalho. Todos com acesso completo às funcionalidades
            principais.
          </p>
        </div>

        <PricingShared onPlanClick={handlePlanClick} />
      </div>
    </section>
  );
}
