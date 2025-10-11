/**
 * Componente: EmptyState
 *
 * Componente reutilizável para exibir estados vazios (sem dados).
 * Melhora a UX ao informar claramente quando não há conteúdo.
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /**
   * Ícone a ser exibido
   */
  icon?: LucideIcon;
  /**
   * Título principal
   */
  title: string;
  /**
   * Descrição adicional
   */
  description?: string;
  /**
   * Ação principal (ex: botão "Criar")
   */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      {description && <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>}

      {action && (
        <Button onClick={action.onClick}>
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
