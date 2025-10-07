/**
 * Simplified Multiple Choice Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateMultipleChoicePrompt = `
You are an expert in creating multiple-choice questions.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} multiple-choice questions about the subject "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

Instructions:
- **All output must be in Brazilian Portuguese (pt-BR).**
- Create a clear and concise question.
- Provide a set of answer options.
- Exactly one answer must be correct.
- The other answers should be plausible but incorrect distractors.
`;