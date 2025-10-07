import { z } from 'zod';
import {
  McqMetadataSchema,
  TfMetadataSchema,
  SumMetadataSchema,
  FillInTheBlankMetadataSchema,
  MatchingColumnsMetadataSchema,
  OpenMetadataSchema,
  ProblemSolvingMetadataSchema,
  EssayMetadataSchema,
  ProjectBasedMetadataSchema,
  GamifiedMetadataSchema,
  SummativeMetadataSchema,
} from './schemas/metadataSchemas';

// ============================================================================
// DISCRIMINATED UNION FOR QUESTION-SPECIFIC METADATA
// ============================================================================

const QuestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('multiple_choice'),
    question: z.string().describe('The text of the question.'),
    metadata: McqMetadataSchema,
  }),
  z.object({
    type: z.literal('true_false'),
    question: z.string().describe('The text of the question.'),
    metadata: TfMetadataSchema,
  }),
  z.object({
    type: z.literal('sum'),
    question: z.string().describe('The text of the question.'),
    metadata: SumMetadataSchema,
  }),
  z.object({
    type: z.literal('fill_in_the_blank'),
    question: z.string().describe('The text of the question, containing placeholders like {{blank_1}}.'),
    metadata: FillInTheBlankMetadataSchema,
  }),
  z.object({
    type: z.literal('matching_columns'),
    question: z.string().describe('The text of the question.'),
    metadata: MatchingColumnsMetadataSchema,
  }),
  z.object({
    type: z.literal('open'),
    question: z.string().describe('The text of the question.'),
    metadata: OpenMetadataSchema,
  }),
  z.object({
    type: z.literal('problem_solving'),
    question: z.string().describe('The text of the question.'),
    metadata: ProblemSolvingMetadataSchema,
  }),
  z.object({
    type: z.literal('essay'),
    question: z.string().describe('The text of the question.'),
    metadata: EssayMetadataSchema,
  }),
  z.object({
    type: z.literal('project_based'),
    question: z.string().describe('The text of the question.'),
    metadata: ProjectBasedMetadataSchema,
  }),
  z.object({
    type: z.literal('gamified'),
    question: z.string().describe('The text of the question.'),
    metadata: GamifiedMetadataSchema,
  }),
  z.object({
    type: z.literal('summative'),
    question: z.string().describe('The text of the question.'),
    metadata: SummativeMetadataSchema,
  }),
]);

// ============================================================================
// MAIN RESPONSE SCHEMA
// ============================================================================

/**
 * Defines the final structure of the AI's response, containing an array of questions.
 * Each question in the array is validated against the discriminated union,
 * ensuring that the metadata strictly matches the question type.
 */
export const QuestionsResponseSchema = z.object({
  questions: z
    .array(QuestionSchema)
    .describe('An array of all the generated questions.'),
});

export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;