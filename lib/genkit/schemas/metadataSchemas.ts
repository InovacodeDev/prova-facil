import { z } from 'zod';

// ============================================================================
// METADATA SCHEMAS FOR EACH QUESTION TYPE
// ============================================================================

/**
 * Metadata for Multiple Choice questions.
 * Requires an array of answers, with one marked as correct.
 */
export const McqMetadataSchema = z.object({
  answers: z
    .array(
      z.object({
        answer: z.string().describe('The text of the answer option.'),
        is_correct: z.boolean().describe('Indicates if this is the correct answer.'),
      })
    )
    .min(2, 'Must have at least two answer options.')
    .describe('A list of possible answers for the question.'),
});

/**
 * Metadata for True/False questions.
 * Requires an array of statements, each with a correctness flag.
 */
export const TfMetadataSchema = z.object({
  statements: z
    .array(
      z.object({
        statement: z.string().describe('The text of the statement to be judged.'),
        is_correct: z.boolean().describe('Indicates if the statement is true or false.'),
      })
    )
    .min(1, 'Must have at least one statement.')
    .describe('A list of statements to be evaluated as true or false.'),
});

/**
 * Metadata for "Sum" type questions (Brazilian "Somatório").
 * Requires an array of statements, each with a number and a correctness flag.
 */
export const SumMetadataSchema = z.object({
  statements: z
    .array(
      z.object({
        number: z.number().int().min(1).describe('The number associated with the statement (e.g., 1, 2, 4, 8).'),
        statement: z.string().describe('The text of the statement.'),
        is_correct: z.boolean().describe('Indicates if the statement is correct and should be included in the sum.'),
      })
    )
    .min(1, 'Must have at least one statement.')
    .describe('A list of numbered statements to be evaluated for a final sum.'),
});

/**
 * Metadata for Fill-in-the-Blank questions.
 * The question text should contain placeholders like `{{blank_1}}`.
 * This metadata defines the correct answers for each blank.
 */
export const FillInTheBlankMetadataSchema = z.object({
  blanks: z
    .array(
      z.object({
        id: z.string().regex(/^blank_\d+$/, 'ID must be in the format "blank_n".')
          .describe('The identifier for the blank, matching the placeholder in the question text (e.g., "blank_1").'),
        correct_answer: z.string().describe('The correct word or phrase to fill the blank.'),
      })
    )
    .min(1, 'Must have at least one blank to fill.')
    .describe('A list of blanks and their corresponding correct answers.'),
});

/**
 * A single item in one of the columns for a Matching Columns question.
 */
const MatchingColumnItemSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty.').describe('A unique identifier for this item (e.g., "A1", "B1").'),
  text: z.string().min(1, 'Text cannot be empty.').describe('The text content of the item.'),
});

/**
 * A single correct match between an item from column A and an item from column B.
 */
const CorrectMatchSchema = z.object({
  from_id: z.string().describe('The ID of the item from the first column (column_a).'),
  to_id: z.string().describe('The ID of the item from the second column (column_b).'),
});

/**
 * Metadata for Matching Columns questions.
 * Defines the items in two columns and the correct pairings between them.
 */
export const MatchingColumnsMetadataSchema = z.object({
  column_a: z
    .array(MatchingColumnItemSchema)
    .min(1, 'Column A must have at least one item.')
    .describe('The first column of items to be matched.'),
  column_b: z
    .array(MatchingColumnItemSchema)
    .min(1, 'Column B must have at least one item.')
    .describe('The second column of items to be matched.'),
  correct_matches: z
    .array(CorrectMatchSchema)
    .min(1, 'There must be at least one correct match defined.')
    .describe('The correct pairings between items from column_a and column_b.'),
});

/**
 * Metadata for Open-ended/Dissertative questions.
 * Provides an expected answer or key topics for evaluation.
 */
export const OpenMetadataSchema = z.object({
  expected_answer: z.string().min(1, 'Expected answer cannot be empty.')
    .describe('A model answer or a description of the key points, topics, and arguments expected for a correct response.'),
});

/**
* Metadata for Problem Solving questions.
* Provides a detailed, step-by-step solution to the problem.
*/
export const ProblemSolvingMetadataSchema = z.object({
  step_by_step_solution: z.string()
    .describe('A detailed, step-by-step explanation of how to arrive at the correct solution.'),
});

/**
 * Metadata for Essay questions.
 * Provides supporting texts and an evaluation rubric.
 */
export const EssayMetadataSchema = z.object({
  evaluation_rubric: z.string()
    .describe('A rubric or criteria for evaluating the essay, detailing what is expected in terms of argumentation, structure, and use of sources.'),
  supporting_texts: z
    .array(
      z.object({
        source: z.string().describe('The source of the supporting text (e.g., author, book, website).'),
        content: z.string().describe('The content of the supporting text.'),
      })
    )
    .optional()
    .describe('Optional supporting texts or documents to be used as a basis for the essay.'),
});

/**
 * Metadata for Project-Based questions.
 * Outlines the project tasks, deliverables, and evaluation criteria.
 */
export const ProjectBasedMetadataSchema = z.object({
  project_tasks: z.array(z.string()).describe('A list of tasks the student needs to complete.'),
  deliverables: z.array(z.string()).describe('A list of what the student needs to deliver at the end of the project.'),
  evaluation_criteria: z.array(z.string()).describe('A list of criteria that will be used to evaluate the final project.'),
});

/**
 * Metadata for Gamified questions.
 * Includes elements like score, time limits, and narrative context.
 */
export const GamifiedMetadataSchema = z.object({
  scenario: z.string().describe('The narrative or scenario for the gamified challenge.'),
  score_points: z.number().int().min(1).describe('Points awarded for a correct answer.'),
  time_limit_seconds: z.number().int().min(1).optional().describe('An optional time limit in seconds for the question.'),
});

/**
 * Metadata for Summative questions.
 * Provides a summary of the expected answer and evaluation criteria.
 */
export const SummativeMetadataSchema = z.object({
  summary_of_expected_answer: z.string().describe('A summary of the expected answer or key points.'),
  evaluation_criteria: z.string().describe('The criteria for evaluating the answer.'),
});