import { z } from "zod";

// Schema para resposta de múltipla escolha (mcq)
export const McqAnswerSchema = z.object({
    answer: z.string().describe("O texto da alternativa"),
    is_correct: z.boolean().describe("Se esta alternativa é a correta (apenas 1 deve ser true)"),
});

export const McqQuestionSchema = z.object({
    question: z.object({
        type: z.string().describe("O tipo da questão: multiple_choice"),
        question: z.string().describe("A pergunta da questão"),
        created_at: z.string().optional(),
    }),
    answers: z.array(McqAnswerSchema).describe("Exatamente 5 alternativas, sendo apenas 1 correta"),
});

// Schema para verdadeiro/falso (tf)
export const TfAnswerSchema = z.object({
    answer: z.string().describe("Uma afirmação completa sobre o tópico"),
    is_correct: z.boolean().describe("Se a afirmação é verdadeira ou falsa"),
});

export const TfQuestionSchema = z.object({
    question: z.object({
        type: z.string().describe("O tipo da questão: true_false"),
        question: z.string().describe('O enunciado da questão, geralmente "Marque V para verdadeiro e F para falso:"'),
        created_at: z.string().optional(),
    }),
    answers: z.array(TfAnswerSchema).describe("Exatamente 5 afirmações, com quantidade aleatória de verdadeiras"),
});

// Schema para dissertativa
export const DissertativeAnswerSchema = z.object({
    answer: z.string().describe("A resposta modelo completa e bem elaborada"),
    is_correct: z.boolean().describe("Sempre true para resposta modelo"),
});

export const DissertativeQuestionSchema = z.object({
    question: z.object({
        type: z.string().describe("O tipo da questão: open"),
        question: z.string().describe("A pergunta dissertativa"),
        created_at: z.string().optional(),
    }),
    answers: z.array(DissertativeAnswerSchema).describe("Apenas 1 resposta modelo"),
});

// Schema para somatória (sum)
export const SumAnswerSchema = z.object({
    answer: z.string().describe("O texto da afirmação"),
    number: z.number().describe("O número da alternativa: pode ser 1, 2, 4, 8, 16, 32 ou 64"),
    is_correct: z.boolean().describe("Se esta afirmação está correta"),
});

export const SumQuestionSchema = z.object({
    question: z.object({
        type: z.string().describe("O tipo da questão: sum"),
        question: z.string().describe("O enunciado da questão de somatória"),
        created_at: z.string().optional(),
    }),
    answers: z
        .array(SumAnswerSchema)
        .describe(
            "De 1 a 7 alternativas, com números 1,2,4,8,16,32,64 em ordem e sem repetir. A soma das corretas deve ser <= 99"
        ),
});

// Schema unificado simplificado para Google AI
export const QuestionsResponseSchema = z.object({
    questions: z
        .array(
            z.object({
                question: z.object({
                    type: z.string().describe("O tipo da questão: multiple_choice, true_false, open ou sum"),
                    question: z.string().describe("O texto da pergunta"),
                    created_at: z.string().optional(),
                }),
                answers: z.array(
                    z.object({
                        answer: z.string().describe("O texto da resposta ou afirmação"),
                        is_correct: z.boolean().describe("Se esta resposta está correta"),
                        number: z.number().optional().describe("Apenas para tipo sum: 1, 2, 4, 8, 16, 32 ou 64"),
                    })
                ),
            })
        )
        .describe("Array com todas as questões geradas"),
});

export type QuestionType = z.infer<
    typeof McqQuestionSchema | typeof TfQuestionSchema | typeof DissertativeQuestionSchema | typeof SumQuestionSchema
>;
export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;
