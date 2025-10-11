/**
 * Componente: BillingPeriodToggle
 *
 * Toggle reutilizável para alternar entre período mensal e anual.
 * Usado em páginas de pricing e planos.
 */

import { Badge } from '@/components/ui/badge';
import { BillingPeriod } from '@/hooks/use-billing-period';
import { cn } from '@/lib/utils';

interface BillingPeriodToggleProps {
  period: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
  discount?: string;
  className?: string;
}

export function BillingPeriodToggle({
  period,
  onPeriodChange,
  discount = '-20%',
  className,
}: BillingPeriodToggleProps) {
  const togglePeriod = () => {
    onPeriodChange(period === 'monthly' ? 'annual' : 'monthly');
  };

  return (
    <div className={cn('flex justify-center items-center gap-4', className)}>
      <span className={cn('transition-colors', period === 'monthly' ? 'font-semibold' : 'text-muted-foreground')}>
        Mensal
      </span>

      <button
        onClick={togglePeriod}
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Alternar entre mensal e anual"
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            period === 'annual' ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>

      <span
        className={cn(
          'flex items-center gap-2 transition-colors',
          period === 'annual' ? 'font-semibold' : 'text-muted-foreground'
        )}
      >
        Anual
        <Badge variant="secondary" className="ml-1">
          {discount}
        </Badge>
      </span>
    </div>
  );
}
