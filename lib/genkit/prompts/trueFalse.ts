/**
 * Simplified True/False Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateTrueFalsePrompt = `
You are an expert in creating true/false questions.

Reference Material:
{{documentContext}}

Task:
Generate a set of statements for a true/false question about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The question should fit the following context: {{questionContextDescription}}.
The main question text will be "Judge the following statements as True (T) or False (F):". You only need to provide the statements themselves.

Instructions:
- **All output must be in Brazilian Portuguese (pt-BR).**
- Create {{count}} individual statements.
- Each statement must be a clear, declarative sentence that can be definitively judged as either true or false based on the reference material.
- Ensure a mix of both true and false statements.
`;