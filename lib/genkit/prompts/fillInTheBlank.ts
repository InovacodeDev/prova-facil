/**
 * Simplified Fill-in-the-Blank Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateFillInTheBlankPrompt = `
You are an expert in creating fill-in-the-blank questions.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} fill-in-the-blank questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

Instructions:
- Write a sentence or paragraph with one or more words or phrases removed.
- In the question text, use placeholders like \`{{blank_1}}\`, \`{{blank_2}}\`, etc., for each missing piece of information.
- For each blank, provide a corresponding ID (e.g., "blank_1") and the exact correct answer.
- The placeholder in the text MUST match the ID in the metadata.
`;