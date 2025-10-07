import { z } from 'zod';
import {
  McqMetadataSchema,
  TfMetadataSchema,
  SumMetadataSchema,
  FillInTheBlankMetadataSchema,
  MatchingColumnsMetadataSchema,
  OpenQuestionMetadataSchema,
  ProblemSolvingMetadataSchema,
  EssayMetadataSchema,
  ProjectBasedMetadataSchema,
  GamifiedMetadataSchema,
} from './schemas/metadataSchemas';

// ============================================================================
// UNION FOR QUESTION-SPECIFIC METADATA
// ============================================================================

const QuestionSchema = z.union([
  z.object({
    type: z.enum(['multiple_choice']),
    question: z.string().describe('The text of the question.'),
    metadata: McqMetadataSchema,
  }),
  z.object({
    type: z.enum(['true_false']),
    question: z.string().describe('The text of the question.'),
    metadata: TfMetadataSchema,
  }),
  z.object({
    type: z.enum(['sum']),
    question: z.string().describe('The text of the question.'),
    metadata: SumMetadataSchema,
  }),
  z.object({
    type: z.enum(['fill_in_the_blank']),
    question: z.string().describe('The text of the question, containing placeholders like {{blank_1}}.'),
    metadata: FillInTheBlankMetadataSchema,
  }),
  z.object({
    type: z.enum(['matching_columns']),
    question: z.string().describe('The text of the question.'),
    metadata: MatchingColumnsMetadataSchema,
  }),
  z.object({
    type: z.enum(['open']),
    // For 'open' questions, the question content is now in the metadata.
    question: z.string().optional().describe('Legacy field. Not used for new open questions.'),
    metadata: OpenQuestionMetadataSchema,
  }),
  z.object({
    type: z.enum(['problem_solving']),
    question: z.string().describe('The text of the question.'),
    metadata: ProblemSolvingMetadataSchema,
  }),
  z.object({
    type: z.enum(['essay']),
    question: z.string().describe('The text of the question.'),
    metadata: EssayMetadataSchema,
  }),
  z.object({
    type: z.enum(['project_based']),
    question: z.string().describe('The text of the question.'),
    metadata: ProjectBasedMetadataSchema,
  }),
  z.object({
    type: z.enum(['gamified']),
    question: z.string().describe('The text of the question.'),
    metadata: GamifiedMetadataSchema,
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
  questions: z.array(QuestionSchema).describe('An array of all the generated questions.'),
});

export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;
