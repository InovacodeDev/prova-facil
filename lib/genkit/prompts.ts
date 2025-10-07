/**
 * @fileOverview This file defines Genkit flows to generate educational assessment questions.
 * It uses a factory function to create generators for various question types,
 * ensuring consistency and reducing boilerplate code.
 */
import { ai, getGoogleAIModel } from '@/lib/genkit/config';
import { z } from 'zod';
import { QuestionsResponseSchema } from './schemas';
import * as Prompts from './prompts/index';

// ============================================================================
// BASE INPUT SCHEMA
// ============================================================================

const FileContentSchema = z.object({
  name: z.string().describe('The filename'),
  type: z.string().describe('The MIME type of the file'),
  data: z.string().describe('The file content as a data URI (base64 encoded)'),
});

const GenerateQuestionsInputSchema = z.object({
  subject: z.string().describe('The subject/discipline of the questions (e.g., Mathematics, History)'),
  count: z.number().positive().describe('The number of questions to generate'),
  academicLevel: z
    .string()
    .optional()
    .describe('The academic level of the students (e.g., high_school, undergraduate)'),
  questionContext: z
    .string()
    .describe(
      'The context/level of the question: fixacao, contextualizada, teorica, estudo_caso, discursiva_aberta, letra_lei, pesquisa'
    ),
  documentContent: z.string().optional().describe('Optional extracted text content from DOCX/DOC documents'),
  pdfFiles: z
    .array(FileContentSchema)
    .optional()
    .describe('Optional PDF files as base64 (for plus/advanced plans only)'),
  aiModel: z.string().optional().describe('AI model to use (e.g., gemini-2.0-flash-exp, gemini-exp-1206)'),
});

// The extended schema used by all flows, including derived context.
const FlowInputSchema = GenerateQuestionsInputSchema.extend({
  questionContextDescription: z.string(),
  documentContext: z.string(),
});

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;
export type GenerateQuestionsOutput = z.infer<typeof QuestionsResponseSchema>;
type FlowInput = z.infer<typeof FlowInputSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getContextDescription(context: string): string {
  const contexts: Record<string, string> = {
    fixacao:
      'Questões rápidas, diretas e factuais, projetadas para reforçar e verificar a memorização de conceitos, datas e nomes essenciais.',
    contextualizada:
      'Estilo ENEM - Apresente um texto de apoio ou citação, exigindo que o aluno interprete o material e o relacione com seus conhecimentos.',
    teorica: 'Foca em conceitos abstratos, ideologias ou teorias. Peça ao aluno que defina, explique ou discuta uma ideia.',
    estudo_caso:
      'Apresente um cenário específico e complexo, exigindo análise detalhada de múltiplas variáveis para formar uma conclusão.',
    discursiva_aberta:
      'Uma questão ampla que permite uma vasta gama de respostas corretas, desde que bem argumentadas. Valorize a profundidade da análise.',
    letra_lei:
      'Estilo Concurso - Exige conhecimento literal e detalhado de um documento, lei ou definição exata. A precisão factual é crucial.',
    pesquisa:
      'Nível Pós-Doc - Formule uma pergunta que abre um campo de estudo, gerando uma tese ou um debate acadêmico.',
  };
  return contexts[context] || contexts.fixacao;
}

function buildDocumentContext(
  documentContent?: string,
  pdfFiles?: Array<{ name?: string; type?: string; data?: string }>
): string {
  const hasTextContent = documentContent && documentContent.trim().length > 0;
  const hasPdfFiles = pdfFiles && pdfFiles.length > 0;

  if (!hasTextContent && !hasPdfFiles) {
    return '⚠️ ATENÇÃO: NENHUM DOCUMENTO FOI FORNECIDO. Você deve informar ao usuário que o conteúdo é necessário para gerar as questões.';
  }

  let context = '⚠️ REGRA CRÍTICA: Baseie-se EXCLUSIVAMENTE no conteúdo fornecido abaixo. NÃO invente informações.\n\n';

  if (hasTextContent) {
    context += `📚 CONTEÚDO TRANSCRITO:\n${documentContent}\n\n`;
  }
  if (hasPdfFiles) {
    const filesList = pdfFiles.map((file, index) => `PDF ${index + 1}: {{media url=pdfFiles.${index}.data}}`).join('\n');
    context += `📄 ARQUIVOS PDF:\n${filesList}\n\n`;
  }

  return context;
}

// ============================================================================
// GENERIC FLOW FACTORY
// ============================================================================

/**
 * Creates a Genkit prompt and flow for a specific question type.
 * This factory function abstracts away the repetitive boilerplate of defining
 * a prompt, a flow, and an exported function for each question type.
 *
 * @param name - The base name for the flow and prompt (e.g., 'Mcq').
 * @param promptTemplate - The template string for the AI prompt.
 * @returns A function that executes the Genkit flow.
 */
function createQuestionGenerator(name: string, promptTemplate: string) {
  const prompt = ai.definePrompt({
    name: `generate${name}Prompt`,
    input: { schema: FlowInputSchema },
    output: { schema: QuestionsResponseSchema },
    prompt: promptTemplate,
  });

  const flow = ai.defineFlow(
    {
      name: `generate${name}Flow`,
      inputSchema: FlowInputSchema,
      outputSchema: QuestionsResponseSchema,
    },
    async (input: FlowInput) => {
      const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
      const { output } = await prompt(input, { model });
      // The output is guaranteed to be valid by Genkit's schema validation
      return output!;
    }
  );

  /**
   * Prepares the full input and executes the question generation flow.
   */
  return async (input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> => {
    const questionContextDescription = getContextDescription(input.questionContext);
    const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

    return await flow({
      ...input,
      questionContextDescription,
      documentContext,
    });
  };
}

// ============================================================================
// EXPORTED QUESTION GENERATORS
// ============================================================================

export const generateMcqQuestions = createQuestionGenerator('Mcq', Prompts.generateMultipleChoicePrompt);
export const generateTfQuestions = createQuestionGenerator('Tf', Prompts.generateTrueFalsePrompt);
export const generateDissertativeQuestions = createQuestionGenerator('Dissertative', Prompts.generateOpenPrompt);
export const generateSumQuestions = createQuestionGenerator('Sum', Prompts.generateSumPrompt);
export const generateFillInTheBlankQuestions = createQuestionGenerator('FillInTheBlank', Prompts.generateFillInTheBlankPrompt);
export const generateMatchingColumnsQuestions = createQuestionGenerator('MatchingColumns', Prompts.generateMatchingColumnsPrompt);
export const generateProblemSolvingQuestions = createQuestionGenerator('ProblemSolving', Prompts.generateProblemSolvingPrompt);
export const generateEssayQuestions = createQuestionGenerator('Essay', Prompts.generateEssayPrompt);
export const generateProjectBasedQuestions = createQuestionGenerator('ProjectBased', Prompts.generateProjectBasedPrompt);
export const generateGamifiedQuestions = createQuestionGenerator('Gamified', Prompts.generateGamifiedPrompt);
export const generateSummativeQuestions = createQuestionGenerator('Summative', Prompts.generateSummativePrompt);