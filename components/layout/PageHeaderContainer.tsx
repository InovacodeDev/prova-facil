/**
 * PageHeaderContainer
 *
 * Container responsivo que limita a largura do conteúdo da página
 * ao máximo de 1264px e adiciona padding lateral adequado.
 *
 * Uso:
 * Envolver todo o conteúdo principal da página (incluindo PageHeader)
 * dentro deste container para manter consistência visual.
 *
 * Responsabilidades:
 * - Limitar largura máxima a 1264px
 * - Centralizar conteúdo
 * - Adicionar padding responsivo (16px mobile, 24px tablet, 32px desktop)
 * - Permitir scroll vertical
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderContainerProps {
  children: ReactNode;
  /**
   * Classes adicionais para customização
   */
  className?: string;
}

/**
 * Container de largura máxima 1264px para conteúdo das páginas
 */
export function PageHeaderContainer({ children, className }: PageHeaderContainerProps) {
  return (
    <div className={cn('w-full max-w-[1264px] mx-auto px-4 sm:px-6 lg:px-8', 'py-6 sm:py-8', className)}>
      {children}
    </div>
  );
}
