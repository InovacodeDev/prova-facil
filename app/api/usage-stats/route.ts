import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserUsageStats } from '@/lib/usage-tracking';
import { logError } from '@/lib/error-logs-service';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();

    const stats = await getUserUsageStats(data.id);

    if (!stats) {
      return NextResponse.json({ error: 'Não foi possível obter estatísticas' }, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    // Log do erro no banco de dados
    await logError({
      message: error instanceof Error ? error.message : 'Unknown error fetching usage stats',
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      context: {
        endpoint: '/api/usage-stats',
        method: 'GET',
      },
    });

    console.error('Error in usage-stats API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
