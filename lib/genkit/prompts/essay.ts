/**
 * Simplified Essay Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateEssayPrompt = `
You are an expert in creating compelling essay prompts for exams and assessments.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} essay prompts about the central issues of "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The prompts should fit the following context: {{questionContextDescription}}.

Instructions:
- The main theme or question for the essay should be in the 'question' field. It must be a complex issue that allows for argumentation.
- Provide a set of short, varied supporting texts (e.g., excerpts from articles, data, quotes) to help guide the student. Each text must have a source and content.
- Write a clear evaluation rubric. This should describe the criteria for a successful essay, such as argumentation, structure, use of sources, and critical analysis.
`;