/**
 * Simplified Gamified Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateGamifiedPrompt = `
You are an expert in creating engaging, gamified quiz questions.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} rapid-fire questions for a gamified quiz on "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

Instructions:
- The question itself should be concise and direct, suitable for a fast-paced quiz format.
- Create a compelling narrative or scenario for the gamified challenge.
- Assign score points for a correct answer.
- You can optionally include a time limit in seconds.
`;