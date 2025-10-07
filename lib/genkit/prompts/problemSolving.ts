/**
 * Simplified Problem-Solving Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateProblemSolvingPrompt = `
You are an expert in creating problem-solving questions that assess the practical application of knowledge.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} problem-solving questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

Instructions:
- Present a realistic scenario or case study in the 'question' field.
- The question must pose a clear problem or task that needs to be solved using the information from the reference material.
- Provide a detailed, step-by-step solution in the 'step_by_step_solution' metadata field. This should explain the logical steps and reasoning required to arrive at the correct answer.
`;