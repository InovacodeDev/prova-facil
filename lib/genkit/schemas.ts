import { z } from 'zod';

// Schema unificado simplificado para Google AI
// IMPORTANTE: O campo metadata é OBRIGATÓRIO e deve sempre ser retornado pelos prompts
// Cada tipo de questão tem sua própria estrutura de metadata
export const QuestionsResponseSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.object({
          type: z
            .string()
            .describe(
              'O tipo da questão: multiple_choice, true_false, open, sum, fill_in_the_blank, matching_columns, problem_solving, essay, project_based, gamified, summative'
            ),
          question: z.string().describe('O texto da pergunta'),
          metadata: z
            .record(z.any())
            .describe(
              'Metadados obrigatórios contendo as respostas/estrutura específica de cada tipo de questão. NUNCA deve ser undefined ou null.'
            ),
          created_at: z.string().optional(),
        }),
      })
    )
    .describe('Array com todas as questões geradas'),
});

export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;
