import { InvoicesCard } from '@/components/billing/InvoicesCard';
import { PaymentMethodsCard } from '@/components/billing/PaymentMethodsCard';
import { PlanCard } from '@/components/billing/PlanCard';
import { UsageHistoryCard } from '@/components/billing/UsageHistoryCard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Faturamento | Prova Fácil',
  description: 'Gerencie sua assinatura, métodos de pagamento e histórico de faturamento',
};

export default async function BillingPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user profile with Stripe IDs
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .single();

  // Fetch subscription data directly (this will use cache)
  const { getSubscriptionData } = await import('@/lib/stripe/server');

  let subscriptionData = null;
  if (profile?.stripe_customer_id && profile?.stripe_subscription_id) {
    try {
      subscriptionData = await getSubscriptionData(user.id, profile.stripe_customer_id, profile.stripe_subscription_id);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }

  // Default values for free plan
  const plan = subscriptionData?.plan || 'starter';
  const period = subscriptionData?.renewStatus === 'yearly' ? 'yearly' : 'monthly';
  const nextRenewal = subscriptionData?.currentPeriodEnd
    ? new Date(subscriptionData.currentPeriodEnd * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now for free plan
  const scheduledNextPlan = subscriptionData?.scheduledNextPlan || null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Faturamento</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie sua assinatura, métodos de pagamento e acompanhe seu consumo
        </p>
      </div>

      {/* Cards Layout */}
      <div className="space-y-6">
        {/* Row 1: Plan and Payment Methods - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlanCard plan={plan} period={period} nextRenewal={nextRenewal} scheduledNextPlan={scheduledNextPlan} />
          <PaymentMethodsCard />
        </div>

        {/* Row 2: Invoices - Full width */}
        <InvoicesCard />

        {/* Row 3: Usage - Full width */}
        <UsageHistoryCard />
      </div>
    </div>
  );
}
