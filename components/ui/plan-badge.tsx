/**
 * Componente: PlanBadge
 *
 * Badge reutilizável para indicar informações sobre planos.
 * Usado em pricing cards, perfil, e outras páginas.
 */

import { Badge } from '@/components/ui/badge';
import { Crown, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  /**
   * Tipo do badge
   */
  type: 'current' | 'popular' | 'recommended';
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

const badgeConfig = {
  current: {
    label: 'Plano Atual',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  },
  popular: {
    label: 'Mais Popular',
    icon: Crown,
    className: 'bg-primary text-primary-foreground',
  },
  recommended: {
    label: 'Recomendado',
    icon: TrendingUp,
    className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

export function PlanBadge({ type, className }: PlanBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <Badge className={cn(config.className, 'flex items-center gap-1', className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

/**
 * Badge absoluto posicionado no topo do card
 */
export function PlanCardBadge({ type }: { type: 'current' | 'popular' | 'recommended' }) {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
      <PlanBadge type={type} />
    </div>
  );
}
