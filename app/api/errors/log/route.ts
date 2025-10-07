/**
 * API Route para registrar erros
 *
 * Este endpoint permite que o frontend envie erros para serem persistidos
 * no banco de dados.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ErrorLogsService, type CreateErrorLogDto } from '@/lib/error-logs-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateErrorLogDto;

    // Validação básica
    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Tentar obter o usuário autenticado (se existir)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Adicionar userId ao contexto se disponível
    const context = {
      ...body.context,
      userId: user?.id || body.context?.userId,
    };

    // Persistir o erro
    await ErrorLogsService.logError({
      message: body.message,
      stack: body.stack,
      level: body.level || 'error',
      context,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Não queremos que o endpoint de log de erro falhe
    console.error('[Error Log API] Failed to log error:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
