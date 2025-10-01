/**
 * @fileOverview This file defines Genkit flows to generate educational assessment questions.
 *
 * It includes flows for:
 * - Multiple Choice Questions (MCQ)
 * - True/False Questions (TF)
 * - Dissertative/Open Questions
 * - Sum Questions (Brazilian style with powers of 2)
 */
import { ai } from "@/lib/genkit/config";
import { z } from "zod";
import {
    McqQuestionSchema,
    TfQuestionSchema,
    DissertativeQuestionSchema,
    SumQuestionSchema,
    QuestionsResponseSchema,
} from "./schemas";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const FileContentSchema = z.object({
    name: z.string().describe("The filename"),
    type: z.string().describe("The MIME type of the file"),
    data: z.string().describe("The file content as a data URI (base64 encoded)"),
});

const GenerateQuestionsInputSchema = z.object({
    subject: z.string().describe("The subject/discipline of the questions (e.g., Mathematics, History)"),
    count: z.number().positive().describe("The number of questions to generate"),
    academicLevel: z
        .string()
        .optional()
        .describe("The academic level of the students (e.g., high_school, undergraduate)"),
    questionContext: z
        .string()
        .describe(
            "The context/level of the question: fixacao, contextualizada, teorica, estudo_caso, discursiva_aberta, letra_lei, pesquisa"
        ),
    files: z
        .array(FileContentSchema)
        .optional()
        .describe("Optional array of files (PDF, DOCX, PPTX) to use as source material for questions"),
});

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;
export type GenerateQuestionsOutput = z.infer<typeof QuestionsResponseSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getContextDescription(context: string): string {
    const contexts: Record<string, string> = {
        fixacao:
            "Questões rápidas, diretas e factuais, projetadas para reforçar e verificar a memorização de conceitos, datas e nomes essenciais. A pergunta deve exigir uma resposta única e objetiva, testando puramente a memorização de fatos cruciais.",
        contextualizada:
            "Estilo ENEM - Apresente um texto de apoio, imagem, gráfico ou citação relacionado ao conteúdo dos arquivos fornecidos, exigindo que o aluno interprete o material e o relacione com seus conhecimentos prévios. Não pede apenas um fato, mas exige interpretação e contextualização temporal/espacial.",
        teorica:
            "Foca em conceitos abstratos, ideologias ou teorias presentes no material. Peça ao aluno que defina, explique ou discuta uma ideia em vez de um evento factual. A questão não trata de um evento específico, mas de um conceito ideológico complexo.",
        estudo_caso:
            "Apresente um cenário ou evento específico e complexo do material fornecido, exigindo análise detalhada de múltiplas variáveis (políticas, éticas, técnicas, etc.) para formar uma conclusão fundamentada. Transforme um evento em um caso de estudo multifacetado.",
        discursiva_aberta:
            "Uma questão ampla que permite uma vasta gama de respostas corretas, desde que bem argumentadas. Valorize a profundidade da análise, a capacidade de síntese e a originalidade do pensamento. Não há uma resposta única - o aluno pode argumentar sobre múltiplos fatores e construir uma tese original.",
        letra_lei:
            "Estilo Concurso - Exige conhecimento literal e detalhado de um documento, lei, data específica ou definição exata presente no material. A precisão factual é mais importante que a interpretação. A resposta é uma questão de conhecimento factual específico, sem margem para interpretação.",
        pesquisa:
            "Nível Pós-Doc - Não é uma questão de prova tradicional, mas um ponto de partida para uma investigação acadêmica aprofundada. Formule uma pergunta que abre um campo de estudo, gerando uma tese, um artigo ou um debate acadêmico. É um convite à pesquisa original, exigindo levantamento de fontes, análise e formulação de um argumento novo.",
    };

    return contexts[context] || contexts.fixacao;
}

function buildFilesContext(files?: Array<{ name?: string; type?: string; data?: string }>): string {
    if (!files || files.length === 0) {
        return "NENHUM ARQUIVO FORNECIDO. Você deve criar questões baseadas no título e na matéria, usando seus conhecimentos gerais sobre o tema.";
    }

    return files.map((file, index) => `Arquivo ${index + 1}: {{media url=files.${index}.data}}`).join("\n");
}

// ============================================================================
// MULTIPLE CHOICE QUESTIONS (MCQ)
// ============================================================================

const generateMcqPrompt = ai.definePrompt({
    name: "generateMcqPrompt",
    input: { schema: GenerateQuestionsInputSchema },
    output: { schema: QuestionsResponseSchema },
    prompt: `Você é um especialista em criar questões de múltipla escolha para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{filesContext}}

TAREFA: Gere {{count}} questões de múltipla escolha sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. Analise cuidadosamente todo o material fornecido nos arquivos acima
2. Crie questões que sigam EXATAMENTE o contexto acadêmico especificado
3. Base as questões no conteúdo real dos arquivos fornecidos
4. Se nenhum arquivo foi fornecido, crie questões relevantes sobre o tema da matéria

REGRAS OBRIGATÓRIAS:
1. Cada questão DEVE ter exatamente 5 alternativas
2. Apenas UMA alternativa deve estar correta (is_correct: true)
3. As alternativas incorretas devem ser plausíveis mas claramente erradas
4. A questão deve ser clara e objetiva
5. Evite pegadinhas, foque em avaliar conhecimento real
6. Use linguagem apropriada para o nível acadêmico

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "question": {
        "type": "multiple_choice",
        "question": "Texto da pergunta aqui?"
      },
      "answers": [
        {"answer": "Alternativa correta", "is_correct": true},
        {"answer": "Alternativa incorreta 1", "is_correct": false},
        {"answer": "Alternativa incorreta 2", "is_correct": false},
        {"answer": "Alternativa incorreta 3", "is_correct": false},
        {"answer": "Alternativa incorreta 4", "is_correct": false}
      ]
    }
  ]
}

Gere as questões agora:`,
});

export async function generateMcqQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const questionContextDescription = getContextDescription(input.questionContext);
    const filesContext = buildFilesContext(input.files);

    return await generateMcqFlow({
        ...input,
        questionContextDescription,
        filesContext,
    } as any);
}

const generateMcqFlow = ai.defineFlow(
    {
        name: "generateMcqFlow",
        inputSchema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            filesContext: z.string(),
        }),
        outputSchema: QuestionsResponseSchema,
    },
    async (input: any) => {
        const { output } = await generateMcqPrompt(input);
        return output!;
    }
);

// ============================================================================
// TRUE/FALSE QUESTIONS (TF)
// ============================================================================

const generateTfPrompt = ai.definePrompt({
    name: "generateTfPrompt",
    input: {
        schema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            filesContext: z.string(),
        }),
    },
    output: { schema: QuestionsResponseSchema },
    prompt: `Você é um especialista em criar questões de verdadeiro ou falso para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{filesContext}}

TAREFA: Gere {{count}} questões de verdadeiro/falso sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. Analise cuidadosamente todo o material fornecido nos arquivos acima
2. Crie questões que sigam EXATAMENTE o contexto acadêmico especificado
3. Base as questões no conteúdo real dos arquivos fornecidos
4. Se nenhum arquivo foi fornecido, crie questões relevantes sobre o tema da matéria

REGRAS OBRIGATÓRIAS:
1. Cada questão DEVE ter exatamente 5 afirmações
2. Cada afirmação deve ser uma sentença completa e independente
3. A quantidade de afirmações verdadeiras (is_correct: true) deve ser ALEATÓRIA (pode ser 0, 1, 2, 3, 4 ou 5)
4. As afirmações devem testar conhecimento real, não pegadinhas
5. Evite afirmações muito óbvias ou muito obscuras
6. O enunciado da questão deve ser: "Marque V para verdadeiro e F para falso:"

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "question": {
        "type": "true_false",
        "question": "Marque V para verdadeiro e F para falso:"
      },
      "answers": [
        {"answer": "Afirmação completa sobre o tema.", "is_correct": true},
        {"answer": "Outra afirmação completa sobre o tema.", "is_correct": false},
        {"answer": "Mais uma afirmação sobre o tema.", "is_correct": true},
        {"answer": "Afirmação adicional sobre o tema.", "is_correct": false},
        {"answer": "Última afirmação sobre o tema.", "is_correct": true}
      ]
    }
  ]
}

Gere as questões agora:`,
});

export async function generateTfQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const questionContextDescription = getContextDescription(input.questionContext);
    const filesContext = buildFilesContext(input.files);

    return await generateTfFlow({
        ...input,
        questionContextDescription,
        filesContext,
    } as any);
}

const generateTfFlow = ai.defineFlow(
    {
        name: "generateTfFlow",
        inputSchema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            filesContext: z.string(),
        }),
        outputSchema: QuestionsResponseSchema,
    },
    async (input: any) => {
        const { output } = await generateTfPrompt(input);
        return output!;
    }
);

// ============================================================================
// DISSERTATIVE/OPEN QUESTIONS
// ============================================================================

const generateDissertativePrompt = ai.definePrompt({
    name: "generateDissertativePrompt",
    input: {
        schema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            filesContext: z.string(),
        }),
    },
    output: { schema: QuestionsResponseSchema },
    prompt: `Você é um especialista em criar questões dissertativas para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{filesContext}}

TAREFA: Gere {{count}} questões dissertativas sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. Analise cuidadosamente todo o material fornecido nos arquivos acima
2. Crie questões que sigam EXATAMENTE o contexto acadêmico especificado
3. Base as questões no conteúdo real dos arquivos fornecidos
4. Se nenhum arquivo foi fornecido, crie questões relevantes sobre o tema da matéria

REGRAS OBRIGATÓRIAS:
1. Cada questão deve ter UMA pergunta aberta que estimule reflexão
2. Forneça UMA resposta modelo completa e bem elaborada (sempre com is_correct: true)
3. A pergunta deve exigir análise, síntese ou avaliação, não apenas memorização
4. A resposta modelo deve ter entre 3 e 5 parágrafos bem estruturados
5. Use linguagem apropriada para o nível acadêmico
6. Evite perguntas que possam ser respondidas com sim/não

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "question": {
        "type": "open",
        "question": "Pergunta dissertativa completa e clara?"
      },
      "answers": [
        {"answer": "Resposta modelo completa com múltiplos parágrafos bem estruturados explicando o tema em profundidade.", "is_correct": true}
      ]
    }
  ]
}

Gere as questões agora:`,
});

export async function generateDissertativeQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const questionContextDescription = getContextDescription(input.questionContext);
    const filesContext = buildFilesContext(input.files);

    return await generateDissertativeFlow({
        ...input,
        questionContextDescription,
        filesContext,
    } as any);
}

const generateDissertativeFlow = ai.defineFlow(
    {
        name: "generateDissertativeFlow",
        inputSchema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            filesContext: z.string(),
        }),
        outputSchema: QuestionsResponseSchema,
    },
    async (input: any) => {
        const { output } = await generateDissertativePrompt(input);
        return output!;
    }
);

// ============================================================================
// SUM QUESTIONS (Brazilian style with powers of 2)
// ============================================================================

const generateSumPrompt = ai.definePrompt({
    name: "generateSumPrompt",
    input: {
        schema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            filesContext: z.string(),
        }),
    },
    output: { schema: QuestionsResponseSchema },
    prompt: `Você é um especialista em criar questões de somatória para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{filesContext}}

TAREFA: Gere {{count}} questões de somatória sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. Analise cuidadosamente todo o material fornecido nos arquivos acima
2. Crie questões que sigam EXATAMENTE o contexto acadêmico especificado
3. Base as questões no conteúdo real dos arquivos fornecidos
4. Se nenhum arquivo foi fornecido, crie questões relevantes sobre o tema da matéria

REGRAS OBRIGATÓRIAS PARA QUESTÕES DE SOMATÓRIA:
1. Cada questão deve ter entre 1 e 7 afirmações
2. Os números das alternativas DEVEM SER em ordem: 1, 2, 4, 8, 16, 32, 64 (potências de 2)
3. NUNCA repita números, NUNCA pule números na sequência
4. A soma das alternativas corretas NÃO PODE ultrapassar 99
5. Cada afirmação deve ser independente e clara
6. O enunciado deve pedir para "Assinale as alternativas corretas" ou similar
7. Use o campo "number" com os valores exatos: 1, 2, 4, 8, 16, 32 ou 64

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "question": {
        "type": "sum",
        "question": "Assinale as alternativas corretas sobre [tema]:"
      },
      "answers": [
        {"answer": "Primeira afirmação.", "number": 1, "is_correct": true},
        {"answer": "Segunda afirmação.", "number": 2, "is_correct": false},
        {"answer": "Terceira afirmação.", "number": 4, "is_correct": true},
        {"answer": "Quarta afirmação.", "number": 8, "is_correct": false},
        {"answer": "Quinta afirmação.", "number": 16, "is_correct": true}
      ]
    }
  ]
}

IMPORTANTE: Verifique que a soma das alternativas corretas é <= 99!

Gere as questões agora:`,
});

export async function generateSumQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const questionContextDescription = getContextDescription(input.questionContext);
    const filesContext = buildFilesContext(input.files);

    return await generateSumFlow({
        ...input,
        questionContextDescription,
        filesContext,
    } as any);
}

const generateSumFlow = ai.defineFlow(
    {
        name: "generateSumFlow",
        inputSchema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            filesContext: z.string(),
        }),
        outputSchema: QuestionsResponseSchema,
    },
    async (input: any) => {
        const { output } = await generateSumPrompt(input);
        return output!;
    }
);
