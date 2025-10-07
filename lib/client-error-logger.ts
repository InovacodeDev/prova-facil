/**
 * Client-Side Error Logger
 * Sends errors to the error logging API endpoint
 * Should ONLY be used in client components ('use client')
 */

interface ClientErrorLog {
  message: string;
  stack?: string;
  level?: 'info' | 'warn' | 'error' | 'fatal';
  context?: Record<string, any>;
}

/**
 * Log an error from a client component
 * This sends the error to /api/errors/log which persists it to the database
 *
 * @param error - The error object or message
 * @param context - Additional context about where the error occurred
 */
export async function logClientError(error: unknown, context: Record<string, any> = {}): Promise<void> {
  try {
    const errorData: ClientErrorLog = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      context,
    };

    // Fire and forget - don't block the UI
    fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    }).catch((fetchError) => {
      // If the error logging itself fails, just console.error
      // We don't want to create infinite loops
      console.error('Failed to log error to server:', fetchError);
    });
  } catch (loggingError) {
    // Fail silently - error logging should never break the app
    console.error('Error in logClientError:', loggingError);
  }
}

/**
 * Wrap an async function with error logging
 * Any errors thrown will be logged and re-thrown
 *
 * @param fn - The async function to wrap
 * @param context - Context to include with any logged errors
 */
export function withClientErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: Record<string, any> = {}
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await logClientError(error, context);
      throw error;
    }
  }) as T;
}
