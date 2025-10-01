/**
 * API Route: Public Stats
 * Endpoint público para ler estatísticas da tabela logs
 * Revalidação a cada 1 hora (3600 segundos)
 */

import { NextResponse } from "next/server";
import { getAllLogsStats } from "@/lib/logs";

export const revalidate = 3600; // Revalidar a cada 1 hora

export async function GET() {
    try {
        const stats = await getAllLogsStats();

        // Transformar para formato mais amigável
        const formattedStats = stats.reduce((acc, stat) => {
            acc[stat.action] = {
                count: stat.count,
                createdAt: stat.created_at,
                updatedAt: stat.updated_at,
            };
            return acc;
        }, {} as Record<string, { count: number; createdAt: Date; updatedAt: Date }>);

        // Calcular totais agregados
        const totalQuestions =
            (formattedStats.create_new_questions?.count || 0) + (formattedStats.new_questions?.count || 0);
        const totalCopies = formattedStats.copy_question?.count || 0;
        const uniqueAssessments = formattedStats.unique_assessments?.count || 0;
        // Mean is stored as integer * 10, so divide by 10 to get decimal
        const meanQuestionsPerAssessment = (formattedStats.mean_questions_per_assessment?.count || 0) / 10;

        return NextResponse.json({
            success: true,
            data: {
                stats: formattedStats,
                totals: {
                    questionsGenerated: totalQuestions,
                    questionsCopied: totalCopies,
                    totalActions: totalQuestions + totalCopies,
                    uniqueAssessments: uniqueAssessments,
                    meanQuestionsPerAssessment: meanQuestionsPerAssessment,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching public stats:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch statistics",
            },
            { status: 500 }
        );
    }
}
