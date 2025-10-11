'use client';

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Pricing } from '@/components/Pricing';
import { About } from '@/components/About';
import { Footer } from '@/components/Footer';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    router.push(`/auth?selectedPlan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <About />
        <Pricing handleSelectPlan={handleSelectPlan} />
      </main>
      <Footer />
    </div>
  );
}
