/\*\*

- Exemplo de Uso do Sistema de Logs de Erro
-
- Este arquivo demonstra como aplicar o sistema de logs em diferentes
- cenários da aplicação.
  \*/

// ============================================================================
// 1. EM API ROUTES (Next.js)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { logError } from '@/lib/error-logs-service';

// Exemplo 1: Usar handleApiError (recomendado)
export async function GET(request: NextRequest) {
try {
// Sua lógica aqui
const data = await fetchSomeData();
return NextResponse.json({ data });
} catch (error) {
// O handleApiError irá:
// 1. Determinar o status code apropriado
// 2. Registrar o erro no banco (se 5xx)
// 3. Retornar uma resposta JSON apropriada
return handleApiError(error, request);
}
}

// Exemplo 2: Log manual com contexto customizado
export async function POST(request: NextRequest) {
try {
const body = await request.json();

    // Validação customizada
    if (!body.email) {
      throw new Error('Email is required');
    }

    // Processamento
    const result = await createUser(body);
    return NextResponse.json(result);

} catch (error) {
// Log com contexto adicional
await logError({
message: error instanceof Error ? error.message : 'Unknown error',
stack: error instanceof Error ? error.stack : undefined,
level: 'error',
context: {
endpoint: '/api/users',
method: 'POST',
requestBody: JSON.stringify(request.body).substring(0, 200), // Limita tamanho
},
});

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );

}
}

// ============================================================================
// 2. EM SERVER ACTIONS
// ============================================================================

'use server';

import { withErrorHandling, formatError } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/server';

// Exemplo 1: Usar wrapper withErrorHandling (recomendado)
export const createAssessment = withErrorHandling(
async (data: { title: string; subject: string }) => {
const supabase = await createClient();
const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('Unauthorized');
    }

    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({
        user_id: user.user.id,
        title: data.title,
        subject: data.subject,
      })
      .select()
      .single();

    if (error) throw error;

    return assessment;

},
{ action: 'createAssessment' } // Contexto adicional
);

// Exemplo 2: Log manual em server action
export async function deleteAssessment(assessmentId: string) {
try {
const supabase = await createClient();
const { error } = await supabase
.from('assessments')
.delete()
.eq('id', assessmentId);

    if (error) throw error;

    return { success: true };

} catch (error) {
// Log do erro
await logError(formatError(error, {
action: 'deleteAssessment',
assessmentId,
}));

    // Re-lançar ou retornar erro
    return { success: false, error: 'Failed to delete assessment' };

}
}

// ============================================================================
// 3. EM COMPONENTES REACT (CLIENT SIDE)
// ============================================================================

'use client';

import { useState } from 'react';
import { useErrorHandler } from '@/lib/error-handler';
import { useToast } from '@/hooks/use-toast';

export function UserForm() {
const [loading, setLoading] = useState(false);
const { handleError } = useErrorHandler();
const { toast } = useToast();

async function onSubmit(data: FormData) {
setLoading(true);
try {
const response = await fetch('/api/users', {
method: 'POST',
body: JSON.stringify(Object.fromEntries(data)),
headers: { 'Content-Type': 'application/json' },
});

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    } catch (error) {
      // Logar erro no servidor via API
      await handleError(error, {
        component: 'UserForm',
        action: 'submitForm',
      });

      // Mostrar mensagem ao usuário
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }

}

return (
<form onSubmit={(e) => {
e.preventDefault();
onSubmit(new FormData(e.currentTarget));
}}>
{/_ Campos do formulário _/}
</form>
);
}

// ============================================================================
// 4. EM HOOKS CUSTOMIZADOS
// ============================================================================

import { useEffect } from 'react';
import { logError } from '@/lib/error-logs-service';

export function useDataFetcher(endpoint: string) {
const [data, setData] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
async function fetchData() {
try {
const response = await fetch(endpoint);
if (!response.ok) throw new Error('Fetch failed');
const json = await response.json();
setData(json);
} catch (err) {
setError(err);

        // Log via API endpoint
        await fetch('/api/errors/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: err instanceof Error ? err.message : 'Unknown error',
            level: 'error',
            context: {
              hook: 'useDataFetcher',
              endpoint,
            },
          }),
        });
      }
    }

    fetchData();

}, [endpoint]);

return { data, error };
}

// ============================================================================
// 5. LOGS DE DIFERENTES NÍVEIS
// ============================================================================

import { logError } from '@/lib/error-logs-service';

// Log de nível INFO (para auditoria)
await logError({
message: 'User logged in successfully',
level: 'info',
context: {
userId: user.id,
ip: request.ip,
timestamp: new Date().toISOString(),
},
});

// Log de nível WARN (para situações suspeitas)
await logError({
message: 'Multiple failed login attempts detected',
level: 'warn',
context: {
email: loginAttempt.email,
attempts: failedAttempts,
ip: request.ip,
},
});

// Log de nível FATAL (para erros críticos que param o sistema)
await logError({
message: 'Database connection lost',
level: 'fatal',
context: {
databaseHost: process.env.DATABASE_URL,
error: connectionError.message,
},
});

// ============================================================================
// 6. LOGS EM LOTE
// ============================================================================

import { logErrors } from '@/lib/error-logs-service';

// Útil para processar múltiplos erros de uma vez
const errors = validationResults
.filter(result => !result.success)
.map(result => ({
message: result.error,
level: 'warn' as const,
context: { validation: true, field: result.field },
}));

await logErrors(errors);

// ============================================================================
// 7. INTEGRAÇÃO COM MONITORAMENTO EXTERNO (FUTURO)
// ============================================================================

import { ErrorLogsService } from '@/lib/error-logs-service';

// Você pode estender o ErrorLogsService para integrar com serviços externos
class ExtendedErrorLogsService extends ErrorLogsService {
static async logError(dto: CreateErrorLogDto): Promise<void> {
// Log no banco (comportamento original)
await super.logError(dto);

    // Enviar para Sentry
    if (dto.level === 'fatal' || dto.level === 'error') {
      // Sentry.captureException(new Error(dto.message), {
      //   extra: dto.context,
      //   level: dto.level,
      // });
    }

    // Enviar para DataDog
    // if (dto.level === 'fatal') {
    //   await datadogClient.log({
    //     level: 'error',
    //     message: dto.message,
    //     tags: [`userId:${dto.context?.userId}`],
    //   });
    // }

    // Enviar alerta por email/slack para erros FATAL
    if (dto.level === 'fatal') {
      // await sendAlert(dto);
    }

}
}

// ============================================================================
// 8. QUERY DE LOGS (PARA DASHBOARD ADMIN)
// ============================================================================

// Exemplo de como buscar logs para exibir em um dashboard
export async function getRecentErrors(limit: number = 50) {
const supabase = await createClient();

const { data, error } = await supabase
.from('error_logs')
.select('\*')
.order('created_at', { ascending: false })
.limit(limit);

if (error) {
console.error('Failed to fetch error logs:', error);
return [];
}

return data;
}

// Buscar erros de um usuário específico
export async function getUserErrors(userId: string) {
const supabase = await createClient();

const { data } = await supabase
.from('error_logs')
.select('\*')
.eq('context->userId', userId)
.order('created_at', { ascending: false });

return data || [];
}

// Estatísticas de erros
export async function getErrorStats() {
const supabase = await createClient();

// Total de erros nas últimas 24h
const oneDayAgo = new Date();
oneDayAgo.setDate(oneDayAgo.getDate() - 1);

const { count } = await supabase
.from('error_logs')
.select('\*', { count: 'exact', head: true })
.gte('created_at', oneDayAgo.toISOString());

return { last24h: count || 0 };
}

// ============================================================================
// 9. LIMPEZA DE LOGS ANTIGOS (CRON JOB)
// ============================================================================

// Executar mensalmente para manter a tabela de logs gerenciável
export async function cleanupOldLogs(olderThanDays: number = 90) {
const supabase = await createClient();
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

const { error } = await supabase
.from('error_logs')
.delete()
.lt('created_at', cutoffDate.toISOString());

if (error) {
await logError({
message: `Failed to cleanup old logs: ${error.message}`,
level: 'error',
context: { task: 'cleanupOldLogs', olderThanDays },
});
}
}

// ============================================================================
// BOAS PRÁTICAS
// ============================================================================

/\*\*

- ✅ DO:
- - Use handleApiError em API routes para tratamento automático
- - Use withErrorHandling para server actions
- - Adicione contexto útil (userId, endpoint, ação)
- - Use níveis apropriados (info, warn, error, fatal)
- - Limite o tamanho de dados sensíveis no contexto
-
- ❌ DON'T:
- - Não logue senhas ou tokens no contexto
- - Não logue payloads completos (limite a 200-500 chars)
- - Não deixe o sistema quebrar se o log falhar (já tratado no serviço)
- - Não use console.log para erros de produção (use o serviço)
    \*/
