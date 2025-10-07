/**
 * Type definitions for question metadata structures
 * Each question type has its own specific metadata format
 * These types match EXACTLY the JSON output format specified in each prompt
 */

// Multiple Choice - FORMATO DO PROMPT: answers array com answer e is_correct
export interface MultipleChoiceMetadata {
  answers: Array<{
    answer: string;
    is_correct: boolean;
  }>;
}

// True/False - FORMATO DO PROMPT: statements array com statement e is_correct
export interface TrueFalseMetadata {
  statements: Array<{
    statement: string;
    is_correct: boolean;
  }>;
}

// Sum - FORMATO DO PROMPT: statements array com statement, number e is_correct
export interface SumMetadata {
  statements: Array<{
    statement: string;
    number: number; // Potências de 2: 1, 2, 4, 8, 16, 32, 64
    is_correct: boolean;
  }>;
}

// Matching Columns - FORMATO DO PROMPT: column_a, column_b e correct_matches
export interface MatchingColumnsMetadata {
  column_a: Array<{
    id: string; // "A1", "A2", etc.
    text: string;
  }>;
  column_b: Array<{
    id: string; // "B1", "B2", etc.
    text: string;
  }>;
  correct_matches: Array<{
    from_id: string; // ID da coluna A
    to_id: string; // ID da coluna B
  }>;
}

// Fill in the Blank - FORMATO DO PROMPT: blanks array e options_bank opcional
// NOTA: text_with_blanks é opcional, pode vir no campo question da questão
export interface FillInTheBlankMetadata {
  blanks: Array<{
    id: string; // "BLANK_1", "BLANK_2", etc.
    correct_answer: string;
  }>;
  options_bank?: string[]; // Banco de opções opcional
  text_with_blanks?: string; // Texto com marcadores [BLANK_1], pode vir no question
}

// Open (Dissertative) - FORMATO DO PROMPT: expected_answer_guideline
export interface OpenMetadata {
  expected_answer: string; // Diretriz da resposta esperada
}

// Problem Solving - FORMATO DO PROMPT: scenario, data, task, solution_guideline
export interface ProblemSolvingMetadata {
  scenario: string; // Cenário contextualizado do problema
  data?: Array<{
    label: string; // Ex: "Distância", "Peso do pacote"
    value: string; // Ex: "450 km", "12 kg"
  }>; // Dados estruturados do problema (opcional)
  task: string; // Tarefa/pergunta específica
  solution_guideline: string; // Guia de resolução passo a passo
}

// Essay - FORMATO DO PROMPT: instructions, supporting_texts, essay_prompt
export interface EssayMetadata {
  instructions: string[]; // Array de instruções para o aluno (ex: ["Use norma culta", "Mínimo 30 linhas"])
  supporting_texts: Array<{
    source: string; // Ex: "LDB, Art. 24" ou "Texto I"
    content: string; // Conteúdo do texto motivador
  }>;
  essay_prompt: string; // Comando/tema da redação
}

// Project Based - FORMATO DO PROMPT: welcome_message, guiding_question, phases, deliverables, evaluation_criteria
export interface ProjectBasedMetadata {
  welcome_message?: string; // Mensagem de boas-vindas contextualizada (opcional)
  guiding_question: string; // Pergunta norteadora do projeto
  phases: string[]; // Array de strings simples com as fases do projeto
  deliverables: string[]; // Array de strings simples com os entregáveis
  evaluation_criteria?: string[]; // Critérios de avaliação (opcional)
}

// Gamified - FORMATO DO PROMPT: mission_briefing, challenges, conclusion_message
export interface GamifiedMetadata {
  mission_briefing: string; // Briefing/contexto da missão gamificada
  challenges: string[]; // Array de strings simples com os desafios
  conclusion_message?: string; // Mensagem de conclusão (opcional)
  scenario?: string; // DEPRECATED: Use mission_briefing ao invés
}

// Union type for all metadata
export type QuestionMetadata =
  | MultipleChoiceMetadata
  | TrueFalseMetadata
  | SumMetadata
  | MatchingColumnsMetadata
  | FillInTheBlankMetadata
  | OpenMetadata
  | ProblemSolvingMetadata
  | EssayMetadata
  | ProjectBasedMetadata
  | GamifiedMetadata
  | Record<string, any>; // Fallback for unknown structures

// Type guard functions
export function isMultipleChoiceMetadata(metadata: any): metadata is MultipleChoiceMetadata {
  return metadata && Array.isArray(metadata.answers);
}

export function isTrueFalseMetadata(metadata: any): metadata is TrueFalseMetadata {
  return metadata && Array.isArray(metadata.statements) && metadata.statements.some((s: any) => s.number === undefined);
}

export function isSumMetadata(metadata: any): metadata is SumMetadata {
  return metadata && Array.isArray(metadata.statements) && metadata.statements.some((s: any) => s.number !== undefined);
}

export function isMatchingColumnsMetadata(metadata: any): metadata is MatchingColumnsMetadata {
  return metadata && metadata.column_a && metadata.column_b && metadata.correct_matches;
}

export function isFillInTheBlankMetadata(metadata: any): metadata is FillInTheBlankMetadata {
  return metadata && Array.isArray(metadata.blanks);
}

export function isOpenMetadata(metadata: any): metadata is OpenMetadata {
  return metadata && typeof metadata.expected_answer === 'string';
}

export function isProblemSolvingMetadata(metadata: any): metadata is ProblemSolvingMetadata {
  return (
    metadata &&
    (typeof metadata.solution_guideline === 'string' ||
      (typeof metadata.scenario === 'string' && typeof metadata.task === 'string'))
  );
}

export function isEssayMetadata(metadata: any): metadata is EssayMetadata {
  return (
    metadata &&
    Array.isArray(metadata.supporting_texts) &&
    (Array.isArray(metadata.instructions) || typeof metadata.instructions === 'string') &&
    (typeof metadata.essay_prompt === 'string' || !metadata.essay_prompt)
  );
}

export function isProjectBasedMetadata(metadata: any): metadata is ProjectBasedMetadata {
  return (
    metadata &&
    Array.isArray(metadata.phases) &&
    Array.isArray(metadata.deliverables) &&
    (typeof metadata.guiding_question === 'string' || !metadata.guiding_question)
  );
}

export function isGamifiedMetadata(metadata: any): metadata is GamifiedMetadata {
  return (
    metadata &&
    Array.isArray(metadata.challenges) &&
    (typeof metadata.mission_briefing === 'string' || typeof metadata.scenario === 'string')
  );
}

// Helper to determine if a question type has correct answers
export function hasCorrectAnswers(questionType: string): boolean {
  const typesWithCorrectAnswers = [
    'multiple_choice',
    'true_false',
    'sum',
    'matching_columns',
    'fill_in_the_blank',
    'open',
    'problem_solving',
    'essay',
    'project_based',
    'gamified',
  ];
  return typesWithCorrectAnswers.includes(questionType);
}
