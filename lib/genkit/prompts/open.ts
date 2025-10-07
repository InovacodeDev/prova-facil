/**
 * Simplified Open-ended/Dissertative Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateOpenPrompt = `
You are an expert in crafting insightful open-ended and dissertative questions.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} open-ended questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

Instructions:
- **All output must be in Brazilian Portuguese (pt-BR).**
- Formulate a question that requires analysis, synthesis, or evaluation, not just memorization.
- Avoid questions that can be answered with a simple "yes" or "no".
- For each question, provide a model answer or a detailed guideline in the 'expected_answer' field. This should summarize the key points, arguments, and evidence a student is expected to provide for a comprehensive response.
`;