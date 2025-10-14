'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { ClipboardList, Crown, FileEdit, LayoutDashboard, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isExpanded: boolean;
  isOpen: boolean;
  onNavigate?: () => void;
}

type PlanType = 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';

interface PlanData {
  id: PlanType; // ID do plano (vem da coluna 'id' da tabela plans)
  cancelAtPeriodEnd?: boolean; // Se o plano será cancelado/downgrade ao final do período
  currentPeriodEnd?: number; // Unix timestamp do fim do período atual
  scheduledNextPlan?: PlanType | null; // Próximo plano agendado (quando há downgrade)
}

const navigationItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/new-assessment',
    icon: FileEdit,
    label: 'Criar Questões',
  },
  {
    href: '/my-assessments',
    icon: ClipboardList,
    label: 'Minhas Questões',
  },
] as const;

const planConfig = {
  starter: {
    icon: Sparkles,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  basic: {
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  essentials: {
    icon: Zap,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
  },
  plus: {
    icon: Crown,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  advanced: {
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
} as const;

export function Sidebar({ isExpanded, isOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPlan();

    // Subscribe to profile changes for real-time updates
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get user's profile ID
        const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();

        if (!profile) return;

        console.log('[Sidebar] Setting up real-time subscription for profile:', profile.id);

        // Create a channel for profile updates
        channel = supabase
          .channel(`profile-changes-${profile.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${profile.id}`,
            },
            (payload) => {
              console.log('[Sidebar] Profile updated, refreshing plan...', payload);
              // Refetch plan when profile changes
              fetchPlan();
            }
          )
          .subscribe((status) => {
            console.log('[Sidebar] Realtime subscription status:', status);
          });
      } catch (error) {
        console.error('[Sidebar] Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Also listen to custom subscription update events
    const handleSubscriptionUpdate = () => {
      console.log('[Sidebar] Subscription cache invalidated, refreshing plan...');
      fetchPlan();
    };

    // Listen for custom events from other components (e.g., plan page)
    window.addEventListener('subscription-updated', handleSubscriptionUpdate);

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log('[Sidebar] Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
  }, []);

  const fetchPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get subscription data from API (uses cache)
      const subscriptionResponse = await fetch('/api/stripe/subscription');

      if (!subscriptionResponse.ok) {
        setLoading(false);
        return;
      }

      const { subscription } = await subscriptionResponse.json();
      const stripeProductId = subscription.productId;
      const scheduledNextProductId = subscription.scheduledNextPlan; // This is already the plan ID from backend

      if (!stripeProductId) {
        setLoading(false);
        return;
      }

      // Get plan configuration based on stripe_product_id
      const { data: planData } = await supabase
        .from('plans')
        .select('id')
        .eq('stripe_product_id', stripeProductId)
        .single();

      if (planData) {
        setPlan({
          id: planData.id as PlanType,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd,
          scheduledNextPlan: scheduledNextProductId as PlanType | null, // Already mapped from backend
        });
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const getPlanCTA = () => {
    if (!plan || plan.id === 'starter') {
      return {
        text: 'Selecionar Plano',
        href: '/plan',
      };
    }

    if (plan.id !== 'advanced') {
      return {
        text: 'Fazer Upgrade',
        href: '/plan',
      };
    }

    return null;
  };

  // Format date for badge display (compact format)
  const formatDateCompact = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Format date for tooltip (full format)
  const formatDateFull = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderNavItem = (item: (typeof navigationItems)[number]) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const content = (
      <Button
        asChild
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start gap-3 transition-colors font-normal',
          isActive && 'bg-primary/10 text-primary hover:bg-primary/15',
          !isExpanded && 'justify-center px-2'
        )}
        onClick={handleNavigation}
      >
        <Link href={item.href}>
          <Icon size={24} strokeWidth={1.5} className="flex-shrink-0" />
          {isExpanded && <span>{item.label}</span>}
        </Link>
      </Button>
    );

    if (!isExpanded) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{content}</div>;
  };

  const renderPlanCard = () => {
    if (loading) {
      return <div className={cn('animate-pulse rounded-lg bg-muted', isExpanded ? 'h-24' : 'h-12')} />;
    }

    if (!plan) return null;

    const config = planConfig[plan.id];
    const PlanIcon = config.icon;
    const cta = getPlanCTA();

    if (!isExpanded) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center justify-center rounded-lg border p-3',
                config.bgColor,
                config.borderColor
              )}
            >
              <PlanIcon className={cn('h-5 w-5', config.color)} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">Plano {plan.id}</p>
            {cta && <p className="text-xs text-muted-foreground">{cta.text}</p>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div className={cn('rounded-lg border p-3 space-y-2', config.bgColor, config.borderColor)}>
        <div className="flex items-center gap-2">
          <PlanIcon className={cn('h-5 w-5', config.color)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">Plano Ativo</p>
              {/* Show badge if downgrade/cancellation is scheduled */}
              {plan.cancelAtPeriodEnd && plan.currentPeriodEnd && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs font-normal cursor-help">
                      Até {formatDateCompact(plan.currentPeriodEnd)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium mb-1">Mudança de plano agendada</p>
                    <p className="text-xs text-muted-foreground">
                      Seu plano atual <span className="font-medium">{plan.id}</span> continua ativo até{' '}
                      <span className="font-medium">{formatDateFull(plan.currentPeriodEnd)}</span>.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Após essa data, a mudança será aplicada automaticamente.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground truncate">{plan.id}</p>
              {/* Show next plan badge when there's a scheduled change */}
              {plan.scheduledNextPlan && plan.currentPeriodEnd && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs font-normal cursor-help">
                      → {plan.scheduledNextPlan}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium mb-1">Próximo plano</p>
                    <p className="text-xs text-muted-foreground">
                      Após <span className="font-medium">{formatDateFull(plan.currentPeriodEnd)}</span>, você será
                      migrado para o plano <span className="font-medium">{plan.scheduledNextPlan}</span>.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {cta && (
          <Button asChild size="sm" className="w-full" variant="default">
            <Link href={cta.href}>{cta.text}</Link>
          </Button>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 z-40',
        'flex flex-col',
        isExpanded ? 'w-64' : 'w-16',
        // Mobile: overlay when open, hidden when closed
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">{navigationItems.map(renderNavItem)}</nav>

      {/* Footer with plan card */}
      <div className="p-3 space-y-3">
        <Separator className="mb-3" />
        {renderPlanCard()}
      </div>
    </aside>
  );
}
