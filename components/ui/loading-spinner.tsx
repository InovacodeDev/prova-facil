/**
 * Componente: LoadingSpinner
 *
 * Componente reutilizável para estados de loading em toda a aplicação.
 * Centraliza a lógica de exibição de spinners para evitar duplicação.
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /**
   * Tamanho do spinner
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Texto a ser exibido abaixo do spinner
   */
  text?: string;
  /**
   * Se true, centraliza o spinner na tela (full screen)
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * Spinner inline para uso em botões
 */
export function InlineSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 mr-2 animate-spin', className)} />;
}

/**
 * Spinner principal com opções de tamanho e texto
 */
export function LoadingSpinner({ size = 'default', text, fullScreen = false, className }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-background">{spinner}</div>;
  }

  return spinner;
}

/**
 * Overlay de loading para uso em modals ou seções
 */
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <LoadingSpinner text={text} />
    </div>
  );
}
