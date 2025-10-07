/**
 * Simplified Matching Columns Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateMatchingColumnsPrompt = `
You are an expert in creating matching columns questions.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} matching columns questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

Instructions:
- Write a clear instruction for the student in the 'question' field (e.g., "Match the concepts in Column A with their definitions in Column B.").
- Create a set of items for the first column ('column_a'). Each item must have a unique ID (e.g., "A1", "A2") and its text.
- Create a corresponding set of items for the second column ('column_b'). Each item must have a unique ID (e.g., "B1", "B2") and its text.
- The items in column_b should be shuffled to not directly correspond to the order of column_a.
- Define the correct pairings by mapping the ID from an item in 'column_a' to the ID of its corresponding item in 'column_b'.
`;