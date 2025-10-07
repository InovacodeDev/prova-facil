/**
 * Simplified Sum Question Prompt (Brazilian "Somatório").
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateSumPrompt = `
You are an expert in creating Brazilian-style "somatório" (sum) questions.

Reference Material:
{{documentContext}}

Task:
Generate a set of statements for a sum question about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The question should fit the following context: {{questionContextDescription}}.

Instructions:
- **All output must be in Brazilian Portuguese (pt-BR).**
- Create {{count}} individual statements to be judged as correct or incorrect.
- For each statement, assign a unique number that is a power of 2 (1, 2, 4, 8, 16, etc.).
- The numbers must be assigned in ascending order.
- Ensure a mix of both correct and incorrect statements.
- The total sum of the numbers for the correct statements should be plausible and not excessively high.
`;