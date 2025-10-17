import { logError } from '@/lib/error-logs-service';
import { getUserUsageStats } from '@/lib/usage-tracking';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Necessário pois usa cookies via logError

export async function GET() {
  try {
    const stats = await getUserUsageStats();

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
