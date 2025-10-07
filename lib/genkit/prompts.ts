/**
 * @fileOverview This file defines Genkit flows to generate educational assessment questions.
 *
 * It includes flows for:
 * - Multiple Choice Questions (MCQ)
 * - True/False Questions (TF)
 * - Dissertative/Open Questions
 * - Sum Questions (Brazilian style with powers of 2)
 */
import { ai, getGoogleAIModel } from '@/lib/genkit/config';
import { z } from 'zod';
import { QuestionsResponseSchema } from './schemas';

import * as Prompts from './prompts/index';

// ============================================================================
// INPUT SCHEMAS
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

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;
export type GenerateQuestionsOutput = z.infer<typeof QuestionsResponseSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getContextDescription(context: string): string {
  const contexts: Record<string, string> = {
    fixacao:
      'Questões rápidas, diretas e factuais, projetadas para reforçar e verificar a memorização de conceitos, datas e nomes essenciais. A pergunta deve exigir uma resposta única e objetiva, testando puramente a memorização de fatos cruciais.',
    contextualizada:
      'Estilo ENEM - Apresente um texto de apoio, imagem, gráfico ou citação relacionado ao conteúdo dos arquivos fornecidos, exigindo que o aluno interprete o material e o relacione com seus conhecimentos prévios. Não pede apenas um fato, mas exige interpretação e contextualização temporal/espacial.',
    teorica:
      'Foca em conceitos abstratos, ideologias ou teorias presentes no material. Peça ao aluno que defina, explique ou discuta uma ideia em vez de um evento factual. A questão não trata de um evento específico, mas de um conceito ideológico complexo.',
    estudo_caso:
      'Apresente um cenário ou evento específico e complexo do material fornecido, exigindo análise detalhada de múltiplas variáveis (políticas, éticas, técnicas, etc.) para formar uma conclusão fundamentada. Transforme um evento em um caso de estudo multifacetado.',
    discursiva_aberta:
      'Uma questão ampla que permite uma vasta gama de respostas corretas, desde que bem argumentadas. Valorize a profundidade da análise, a capacidade de síntese e a originalidade do pensamento. Não há uma resposta única - o aluno pode argumentar sobre múltiplos fatores e construir uma tese original.',
    letra_lei:
      'Estilo Concurso - Exige conhecimento literal e detalhado de um documento, lei, data específica ou definição exata presente no material. A precisão factual é mais importante que a interpretação. A resposta é uma questão de conhecimento factual específico, sem margem para interpretação.',
    pesquisa:
      'Nível Pós-Doc - Não é uma questão de prova tradicional, mas um ponto de partida para uma investigação acadêmica aprofundada. Formule uma pergunta que abre um campo de estudo, gerando uma tese, um artigo ou um debate acadêmico. É um convite à pesquisa original, exigindo levantamento de fontes, análise e formulação de um argumento novo.',
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
    return '⚠️ ATENÇÃO: NENHUM DOCUMENTO FOI FORNECIDO.\n\nVocê NÃO deve criar questões neste caso. Informe o usuário que é necessário fornecer documentos com o conteúdo para gerar questões específicas sobre o tema.';
  }

  let context = '';

  // Adicionar texto extraído de DOCX
  if (hasTextContent) {
    context += `📚 CONTEÚDO TRANSCRITO (DOCX/DOC):\n\n${documentContent}\n\n`;
  }

  // Adicionar PDFs como media files
  if (hasPdfFiles) {
    const filesList = pdfFiles
      .map((file, index) => `PDF ${index + 1}: {{media url=pdfFiles.${index}.data}}`)
      .join('\n');
    context += `📄 ARQUIVOS PDF FORNECIDOS:\n${filesList}\n\n`;
  }

  context += `⚠️ REGRA CRÍTICA: Você DEVE ler e analisar TODO o conteúdo acima.
As questões devem ser criadas EXCLUSIVAMENTE baseadas no conteúdo presente acima.
NÃO invente informações. NÃO use conhecimento externo além do que está no conteúdo fornecido.
Se o usuário pediu questões sobre "Segunda Guerra Mundial" mas o conteúdo fornecido contém apenas sobre "Primeira Guerra Mundial", 
você DEVE criar questões sobre "Primeira Guerra Mundial" (o conteúdo fornecido).`;

  return context;
}

// ============================================================================
// MULTIPLE CHOICE QUESTIONS (MCQ)
// ============================================================================

const generateMcqPrompt = ai.definePrompt({
  name: 'generateMcqPrompt',
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateMultipleChoicePrompt,
});

export async function generateMcqQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateMcqFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateMcqFlow = ai.defineFlow(
  {
    name: 'generateMcqFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateMcqPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// TRUE/FALSE QUESTIONS (TF)
// ============================================================================

const generateTfPrompt = ai.definePrompt({
  name: 'generateTfPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      filesContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateTrueFalsePrompt,
});

export async function generateTfQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateTfFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateTfFlow = ai.defineFlow(
  {
    name: 'generateTfFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateTfPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// DISSERTATIVE/OPEN QUESTIONS
// ============================================================================

const generateDissertativePrompt = ai.definePrompt({
  name: 'generateDissertativePrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      filesContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateOpenPrompt,
});

export async function generateDissertativeQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateDissertativeFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateDissertativeFlow = ai.defineFlow(
  {
    name: 'generateDissertativeFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateDissertativePrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// SUM QUESTIONS (Brazilian style with powers of 2)
// ============================================================================

const generateSumPrompt = ai.definePrompt({
  name: 'generateSumPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      filesContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateSumPrompt,
});

export async function generateSumQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateSumFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateSumFlow = ai.defineFlow(
  {
    name: 'generateSumFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateSumPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// FILL IN THE BLANK QUESTIONS
// ============================================================================

const generateFillInTheBlankPrompt = ai.definePrompt({
  name: 'generateFillInTheBlankPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateFillInTheBlankPrompt,
});

export async function generateFillInTheBlankQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateFillInTheBlankFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateFillInTheBlankFlow = ai.defineFlow(
  {
    name: 'generateFillInTheBlankFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateFillInTheBlankPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// MATCHING COLUMNS QUESTIONS
// ============================================================================

const generateMatchingColumnsPrompt = ai.definePrompt({
  name: 'generateMatchingColumnsPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateMatchingColumnsPrompt,
});

export async function generateMatchingColumnsQuestions(
  input: GenerateQuestionsInput
): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateMatchingColumnsFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateMatchingColumnsFlow = ai.defineFlow(
  {
    name: 'generateMatchingColumnsFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateMatchingColumnsPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// PROBLEM SOLVING QUESTIONS
// ============================================================================

const generateProblemSolvingPrompt = ai.definePrompt({
  name: 'generateProblemSolvingPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateProblemSolvingPrompt,
});

export async function generateProblemSolvingQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateProblemSolvingFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateProblemSolvingFlow = ai.defineFlow(
  {
    name: 'generateProblemSolvingFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateProblemSolvingPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// ESSAY QUESTIONS
// ============================================================================

const generateEssayPrompt = ai.definePrompt({
  name: 'generateEssayPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateEssayPrompt,
});

export async function generateEssayQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateEssayFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateEssayFlow = ai.defineFlow(
  {
    name: 'generateEssayFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateEssayPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// PROJECT-BASED QUESTIONS
// ============================================================================

const generateProjectBasedPrompt = ai.definePrompt({
  name: 'generateProjectBasedPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateProjectBasedPrompt,
});

export async function generateProjectBasedQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateProjectBasedFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateProjectBasedFlow = ai.defineFlow(
  {
    name: 'generateProjectBasedFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateProjectBasedPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// GAMIFIED QUESTIONS
// ============================================================================

const generateGamifiedPrompt = ai.definePrompt({
  name: 'generateGamifiedPrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateGamifiedPrompt,
});

export async function generateGamifiedQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateGamifiedFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateGamifiedFlow = ai.defineFlow(
  {
    name: 'generateGamifiedFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateGamifiedPrompt(input, { model });
    return output!;
  }
);

// ============================================================================
// SUMMATIVE QUESTIONS
// ============================================================================

const generateSummativePrompt = ai.definePrompt({
  name: 'generateSummativePrompt',
  input: {
    schema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
  },
  output: { schema: QuestionsResponseSchema },
  prompt: Prompts.generateSummativePrompt,
});

export async function generateSummativeQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const questionContextDescription = getContextDescription(input.questionContext);
  const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

  return await generateSummativeFlow({
    ...input,
    questionContextDescription,
    documentContext,
  } as any);
}

const generateSummativeFlow = ai.defineFlow(
  {
    name: 'generateSummativeFlow',
    inputSchema: GenerateQuestionsInputSchema.extend({
      questionContextDescription: z.string(),
      documentContext: z.string(),
    }),
    outputSchema: QuestionsResponseSchema,
  },
  async (input: any) => {
    const model = getGoogleAIModel(input.aiModel || 'gemini-2.0-flash-exp');
    const { output } = await generateSummativePrompt(input, { model });
    return output!;
  }
);
