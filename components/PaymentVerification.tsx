/**
 * PaymentVerification - Componente de verificação de pagamento
 *
 * Exibido durante a validação do pagamento após retorno do Stripe
 */

'use client';

import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentVerificationProps {
  status: 'verifying' | 'success' | 'error';
  message?: string;
}

export function PaymentVerification({ status, message }: PaymentVerificationProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'verifying' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Verificando pagamento...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Pagamento confirmado!
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Erro na verificação
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Aguarde enquanto confirmamos seu pagamento...'}
            {status === 'success' && 'Seu plano foi ativado com sucesso!'}
            {status === 'error' && (message || 'Não foi possível verificar o pagamento.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status === 'verifying' && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Validando sessão de pagamento
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" />
                  Atualizando seu plano
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" />
                  Liberando acesso às funcionalidades
                </div>
              </div>
            )}
            {status === 'success' && (
              <div className="text-center py-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-3 animate-in zoom-in duration-500" />
                <p className="text-sm text-muted-foreground">Redirecionando em instantes...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="text-center py-4">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Por favor, entre em contato com o suporte se o problema persistir.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
