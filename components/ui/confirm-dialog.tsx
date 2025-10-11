/**
 * Componente: ConfirmDialog
 *
 * Dialog de confirmação reutilizável para ações importantes.
 * Reduz duplicação de AlertDialog em toda a aplicação.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InlineSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  /**
   * Controla visibilidade do dialog
   */
  open: boolean;
  /**
   * Callback ao fechar
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Callback ao confirmar
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Título do dialog
   */
  title: string;
  /**
   * Descrição/mensagem
   */
  description: string;
  /**
   * Texto do botão de confirmação
   * @default "Confirmar"
   */
  confirmText?: string;
  /**
   * Texto do botão de cancelamento
   * @default "Cancelar"
   */
  cancelText?: string;
  /**
   * Variant do botão de confirmação
   * @default "default"
   */
  variant?: 'default' | 'destructive';
  /**
   * Estado de loading
   */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={cn(
              variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {loading && <InlineSpinner />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
