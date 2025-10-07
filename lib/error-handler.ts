/**
 * Global Error Handler
 * 
 * Middleware/handler para capturar e registrar erros não tratados
 * na aplicação Next.js.
 */

import { NextResponse } from 'next/server';
import { ErrorLogsService } from './error-logs-service';

/**
 * Handler de erro para API Routes do Next.js
 * 
 * @example
 * ```typescript
 * // app/api/users/route.ts
 * import { handleApiError } from '@/lib/error-handler';
 * 
 * export async function GET(request: Request) {
 *   try {
 *     // sua lógica aqui
 *   } catch (error) {
 *     return handleApiError(error, request);
 *   }
 * }
 * ```
 */
export async function handleApiError(error: unknown, request: Request): Promise<NextResponse> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Determinar status code
  let statusCode = 500;
  if (error instanceof Error) {
    // Você pode adicionar lógica customizada aqui para mapear erros específicos
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('unauthorized')) statusCode = 401;
    if (error.message.includes('forbidden')) statusCode = 403;
  }

  // Extrair informações do request
  const url = new URL(request.url);
  const context = {
    endpoint: url.pathname,
    method: request.method,
    statusCode,
    userAgent: request.headers.get('user-agent') || undefined,
  };

  // Log apenas erros 5xx (erros de servidor)
  if (statusCode >= 500) {
    await ErrorLogsService.logError({
      message: errorMessage,
      stack: errorStack,
      level: 'error',
      context,
    });
  }

  // Retornar resposta apropriada
  return NextResponse.json(
    {
      error: statusCode >= 500 ? 'Internal Server Error' : errorMessage,
      status: statusCode,
    },
    { status: statusCode }
  );
}

/**
 * Wrapper para proteger Server Actions
 * 
 * @example
 * ```typescript
 * // app/actions/users.ts
 * import { withErrorHandling } from '@/lib/error-handler';
 * 
 * export const createUser = withErrorHandling(async (data: UserData) => {
 *   // sua lógica aqui
 *   return result;
 * });
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: { action: string }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      await ErrorLogsService.logError({
        message: errorMessage,
        stack: errorStack,
        level: 'error',
        context: {
          action: context?.action || 'server-action',
          args: JSON.stringify(args).substring(0, 500), // Limita tamanho
        },
      });

      // Re-lança o erro para que o caller possa tratá-lo
      throw error;
    }
  }) as T;
}

/**
 * Hook para capturar erros do lado do cliente
 * 
 * @example
 * ```typescript
 * // Em um componente cliente
 * import { useErrorHandler } from '@/lib/error-handler';
 * 
 * const { handleError } = useErrorHandler();
 * 
 * try {
 *   // código
 * } catch (error) {
 *   handleError(error, { component: 'UserForm' });
 * }
 * ```
 */
export function useErrorHandler() {
  const handleError = async (error: unknown, context?: Record<string, any>) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Envia o erro para um endpoint de API que irá persistir
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: errorMessage,
          stack: errorStack,
          level: 'error',
          context: {
            ...context,
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
        }),
      });
    } catch (logError) {
      // Silenciosamente falha se não conseguir logar
      console.error('Failed to log error to server:', logError);
    }
  };

  return { handleError };
}
