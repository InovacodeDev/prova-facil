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
  expected_answer_guideline: string; // Diretriz da resposta esperada
}

// Problem Solving - FORMATO DO PROMPT: solution_guideline
export interface ProblemSolvingMetadata {
  solution_guideline: string; // Guia de resolução passo a passo
}

// Essay - FORMATO DO PROMPT: supporting_texts array e instructions
export interface EssayMetadata {
  supporting_texts: Array<{
    source: string; // Ex: "LDB, Art. 24"
    content: string; // Conteúdo do texto motivador
  }>;
  instructions: string; // Instruções para o aluno
}

// Project Based - FORMATO DO PROMPT: phases e deliverables como arrays de strings
export interface ProjectBasedMetadata {
  phases: string[]; // Array de strings simples (não objetos)
  deliverables: string[]; // Array de strings simples (não objetos)
}

// Gamified - FORMATO DO PROMPT: scenario string e challenges array de strings
export interface GamifiedMetadata {
  scenario: string; // Cenário do quiz (string simples)
  challenges: string[]; // Array de strings simples (não objetos)
}

// Summative - FORMATO DO PROMPT: Pode conter qualquer combinação de questões
// O metadata de cada questão individual deve seguir seu tipo específico
export interface SummativeMetadata {
  // Summative não tem estrutura própria, usa as estruturas dos tipos que contém
  sections?: Array<{
    title: string;
    questions: string[];
  }>;
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
  | SummativeMetadata
  | Record<string, any>; // Fallback for unknown structures

// Type guard functions
export function isMultipleChoiceMetadata(metadata: any): metadata is MultipleChoiceMetadata {
  return metadata && Array.isArray(metadata.answers);
}

export function isTrueFalseMetadata(metadata: any): metadata is TrueFalseMetadata {
  return metadata && Array.isArray(metadata.statements);
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
  return metadata && typeof metadata.expected_answer_guideline === 'string';
}

export function isProblemSolvingMetadata(metadata: any): metadata is ProblemSolvingMetadata {
  return metadata && typeof metadata.solution_guideline === 'string';
}

export function isEssayMetadata(metadata: any): metadata is EssayMetadata {
  return metadata && Array.isArray(metadata.supporting_texts) && typeof metadata.instructions === 'string';
}

export function isProjectBasedMetadata(metadata: any): metadata is ProjectBasedMetadata {
  return metadata && Array.isArray(metadata.phases) && Array.isArray(metadata.deliverables);
}

export function isGamifiedMetadata(metadata: any): metadata is GamifiedMetadata {
  return metadata && typeof metadata.scenario === 'string' && Array.isArray(metadata.challenges);
}

export function isSummativeMetadata(metadata: any): metadata is SummativeMetadata {
  return metadata && Array.isArray(metadata.sections);
}

// Helper to determine if a question type has correct answers
export function hasCorrectAnswers(questionType: string): boolean {
  const typesWithCorrectAnswers = ['multiple_choice', 'true_false', 'sum', 'matching_columns', 'fill_in_the_blank'];
  return typesWithCorrectAnswers.includes(questionType);
}
