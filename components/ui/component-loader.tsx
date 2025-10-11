/**
 * ComponentLoader
 *
 * Componente de loading reutilizável para uso em Suspense fallbacks.
 * Exibe um spinner centralizado com mensagem opcional.
 *
 * Uso:
 * <Suspense fallback={<ComponentLoader />}>
 *   <MyLazyComponent />
 * </Suspense>
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComponentLoaderProps {
  /**
   * Mensagem opcional para exibir abaixo do spinner
   */
  message?: string;
  /**
   * Tamanho do spinner ('sm' | 'md' | 'lg')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Classes adicionais para customização do container
   */
  className?: string;
  /**
   * Se true, ocupa toda a tela (para loaders de página inteira)
   */
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * Loading spinner para Suspense boundaries
 */
export function ComponentLoader({ message, size = 'md', className, fullScreen = false }: ComponentLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'min-h-screen' : 'py-12',
        className
      )}
    >
      <Loader2 className={cn('text-primary animate-spin', sizeClasses[size])} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

/**
 * Skeleton para cards de loading
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
    </div>
  );
}

/**
 * Skeleton para tabelas de loading
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="h-10 w-10 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded w-1/2" />
          </div>
          <div className="h-3 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  );
}
