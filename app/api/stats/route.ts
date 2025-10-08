/**
 * API Route: Public Stats
 * Endpoint público para ler estatísticas da tabela logs
 * Revalidação a cada 1 hora (3600 segundos)
 */

import { NextResponse } from 'next/server';
import { getAllLogsStats } from '@/lib/logs';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/error-logs-service';

export const revalidate = 3600; // Revalidar a cada 1 hora
export const dynamic = 'force-dynamic'; // Necessário pois usa cookies via logError

export async function GET() {
  try {
    const supabase = await createClient();

    const stats = await getAllLogsStats();

    const { data: viewData } = await supabase.from('public_profiles_count').select('*').single();

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat.action] = {
        count: stat.count,
        createdAt: stat.created_at,
        updatedAt: stat.updated_at,
      };
      return acc;
    }, {} as Record<string, { count: number; createdAt: Date; updatedAt: Date }>);

    const totalQuestions =
      (formattedStats.create_new_questions?.count || 0) + (formattedStats.new_questions?.count || 0);
    const totalCopies = formattedStats.copy_question?.count || 0;
    const uniqueAssessments = formattedStats.unique_assessments?.count || 0;
    const meanQuestionsPerAssessment = (formattedStats.mean_questions_per_assessment?.count || 0) / 10;

    return NextResponse.json({
      success: true,
      data: {
        stats: formattedStats,
        totals: {
          questionsGenerated: totalQuestions,
          questionsCopied: totalCopies,
          totalActions: totalQuestions + totalCopies,
          uniqueProfiles: viewData?.count || 0,
          uniqueAssessments: uniqueAssessments,
          meanQuestionsPerAssessment: meanQuestionsPerAssessment,
        },
      },
    });
  } catch (error) {
    // Log do erro no banco de dados
    await logError({
      message: error instanceof Error ? error.message : 'Unknown error fetching public stats',
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      context: {
        endpoint: '/api/stats',
        method: 'GET',
      },
    });

    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}
