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
    .min(4, 'Must have at least two answer options.')
    .max(5, 'Can have at most five answer options.')
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
    .min(4, 'Must have at least one statement.')
    .max(5, 'Can have at most five statements.')
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
    .min(4, 'Must have at least four statements.')
    .max(7, 'Can have at most seven statements.')
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
        id: z
          .string()
          .regex(/^blank_\d+$/, 'ID must be in the format "blank_n".')
          .describe('The identifier for the blank, matching the placeholder in the question text (e.g., "blank_1").'),
        correct_answer: z.string().describe('The correct word or phrase to fill the blank.'),
      })
    )
    .min(1, 'Must have at least one blank to fill.')
    .max(4, 'Can have at most four blanks.')
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
    .min(3, 'Column A must have at least three items.')
    .max(5, 'Column A can have at most five items.')
    .describe('The first column of items to be matched.'),
  column_b: z
    .array(MatchingColumnItemSchema)
    .min(3, 'Column B must have at least three items.')
    .max(5, 'Column B can have at most five items.')
    .describe('The second column of items to be matched.'),
  correct_matches: z
    .array(CorrectMatchSchema)
    .min(3, 'There must be at least three correct matches defined.')
    .max(5, 'There can be at most five correct matches defined.')
    .describe('The correct pairings between items from column_a and column_b.'),
});

/**
 * Metadata for Open-ended/Dissertative questions.
 * Provides a main question, a list of sub-questions, and detailed guidelines for the expected answer.
 */
export const OpenQuestionMetadataSchema = z.object({
  main_question: z.string().min(1, 'Main question cannot be empty.').describe('The main, contextualizing text of the question (enunciado).'),
  sub_questions: z.array(z.string().min(1)).min(1).describe('An array of sub-questions (items a, b, c).'),
  expected_answer_guideline: z
    .string()
    .min(1, 'Expected answer guideline cannot be empty.')
    .describe(
      'A detailed model answer, including evaluation criteria and point distribution, explaining what constitutes a good response for each sub-question.'
    ),
});

/**
 * Metadata for Problem Solving questions.
 * Provides scenario, data, task, and step-by-step solution.
 */
export const ProblemSolvingMetadataSchema = z.object({
  scenario: z.string().describe('The contextualized scenario/problem description.'),
  data: z
    .array(
      z.object({
        label: z.string().describe('The label for the data point (e.g., "Distance", "Weight").'),
        value: z.string().describe('The value of the data point (e.g., "450 km", "12 kg").'),
      })
    )
    .optional()
    .describe('Optional structured data for the problem.'),
  task: z.string().describe('The specific task or question to be solved.'),
  solution_guideline: z
    .string()
    .describe('A detailed, step-by-step explanation of how to arrive at the correct solution.'),
  // Legacy field for backward compatibility
  step_by_step_solution: z.string().optional().describe('DEPRECATED: Use solution_guideline instead.'),
});

/**
 * Metadata for Essay questions.
 * Provides instructions, supporting texts, and essay prompt.
 */
export const EssayMetadataSchema = z.object({
  instructions: z
    .array(z.string())
    .describe('An array of instructions for the student (e.g., ["Use formal language", "Minimum 30 lines"]).'),
  supporting_texts: z
    .array(
      z.object({
        source: z.string().describe('The source of the supporting text (e.g., "Text I", "LDB, Art. 24").'),
        content: z.string().describe('The content of the supporting text.'),
      })
    )
    .describe('Supporting texts or documents to be used as a basis for the essay.'),
  essay_prompt: z.string().describe('The essay prompt/theme/command.'),
  // Legacy field for backward compatibility
  evaluation_rubric: z.string().optional().describe('DEPRECATED: A rubric or criteria for evaluating the essay.'),
});

/**
 * Metadata for Project-Based questions.
 * Outlines welcome message, guiding question, phases, deliverables, and evaluation criteria.
 */
export const ProjectBasedMetadataSchema = z.object({
  welcome_message: z.string().optional().describe('Optional welcome message to contextualize the project.'),
  guiding_question: z.string().describe('The guiding question for the project.'),
  phases: z.array(z.string()).describe('A list of phases/tasks the student needs to complete.'),
  deliverables: z.array(z.string()).describe('A list of what the student needs to deliver at the end of the project.'),
  evaluation_criteria: z
    .array(z.string())
    .optional()
    .describe('Optional list of criteria that will be used to evaluate the final project.'),
  // Legacy field for backward compatibility
  project_tasks: z.array(z.string()).optional().describe('DEPRECATED: Use phases instead.'),
});

/**
 * Metadata for Gamified questions.
 * Includes mission briefing, challenges, and conclusion message.
 */
export const GamifiedMetadataSchema = z.object({
  mission_briefing: z.string().describe('The mission briefing/context for the gamified challenge.'),
  challenges: z.array(z.string()).describe('An array of challenges for the student to complete.'),
  conclusion_message: z.string().optional().describe('Optional conclusion message after completing the challenge.'),
  // Legacy fields for backward compatibility
  scenario: z.string().optional().describe('DEPRECATED: Use mission_briefing instead.'),
  score_points: z.number().int().min(2).max(5).optional().describe('DEPRECATED: Points awarded for a correct answer.'),
  time_limit_seconds: z
    .number()
    .int()
    .min(2)
    .max(5)
    .optional()
    .describe('DEPRECATED: An optional time limit in seconds for the question.'),
});
