/**
 * Error Logging Service
 *
 * Serviço centralizado para persistir erros no banco de dados.
 * Segue os princípios do Grimório Arcano:
 * - Responsabilidade Única (SRP)
 * - Segurança First
 * - Nunca permitir que o log de erro quebre a aplicação (fallback)
 */

import { createClient } from '@/lib/supabase/server';

export type ErrorLevel = 'error' | 'warn' | 'fatal' | 'info';

export interface ErrorLogContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  [key: string]: any; // Permite campos adicionais
}

export interface CreateErrorLogDto {
  message: string;
  stack?: string;
  level?: ErrorLevel;
  context?: ErrorLogContext;
}

/**
 * ErrorLogsService - Serviço para persistir logs de erro
 *
 * @example
 * ```typescript
 * import { logError } from '@/lib/error-logs-service';
 *
 * try {
 *   // código que pode falhar
 * } catch (error) {
 *   await logError({
 *     message: error.message,
 *     stack: error.stack,
 *     level: 'error',
 *     context: { userId: '123', endpoint: '/api/users' }
 *   });
 * }
 * ```
 */
export class ErrorLogsService {
  /**
   * Persiste um erro no banco de dados
   *
   * @param dto - Dados do erro a ser registrado
   * @returns Promise<void>
   *
   * @remarks
   * Este método nunca lança exceções. Se falhar ao persistir,
   * registra no console e continua (fallback seguro).
   */
  static async logError(dto: CreateErrorLogDto): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.from('error_logs').insert({
        message: dto.message,
        stack: dto.stack || null,
        level: dto.level || 'error',
        context: dto.context || null,
      });

      if (error) {
        // Fallback: Se falhar ao persistir, apenas loga no console
        console.error('[ErrorLogsService] Failed to persist error to database:', error);
        console.error('[ErrorLogsService] Original error:', dto);
      }
    } catch (err) {
      // Fallback crítico: Nunca permitir que o log de erro quebre a aplicação
      console.error('[ErrorLogsService] Critical failure in logError:', err);
      console.error('[ErrorLogsService] Original error:', dto);
    }
  }

  /**
   * Persiste múltiplos erros em lote (útil para logs acumulados)
   *
   * @param dtos - Array de erros a serem registrados
   * @returns Promise<void>
   */
  static async logErrors(dtos: CreateErrorLogDto[]): Promise<void> {
    try {
      const supabase = await createClient();

      const records = dtos.map((dto) => ({
        message: dto.message,
        stack: dto.stack || null,
        level: dto.level || 'error',
        context: dto.context || null,
      }));

      const { error } = await supabase.from('error_logs').insert(records);

      if (error) {
        console.error('[ErrorLogsService] Failed to persist batch errors:', error);
        console.error('[ErrorLogsService] Batch size:', dtos.length);
      }
    } catch (err) {
      console.error('[ErrorLogsService] Critical failure in logErrors:', err);
    }
  }

  /**
   * Método utilitário para extrair informações de uma exceção
   *
   * @param error - O erro a ser processado
   * @returns CreateErrorLogDto formatado
   */
  static formatError(error: unknown, context?: ErrorLogContext): CreateErrorLogDto {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        level: 'error',
        context,
      };
    }

    return {
      message: String(error),
      level: 'error',
      context,
    };
  }
}

/**
 * Função helper para uso mais simples (exportação nomeada)
 *
 * @example
 * ```typescript
 * import { logError } from '@/lib/error-logs-service';
 *
 * await logError({
 *   message: 'Something went wrong',
 *   level: 'error'
 * });
 * ```
 */
export const logError = ErrorLogsService.logError.bind(ErrorLogsService);
export const logErrors = ErrorLogsService.logErrors.bind(ErrorLogsService);
export const formatError = ErrorLogsService.formatError.bind(ErrorLogsService);
