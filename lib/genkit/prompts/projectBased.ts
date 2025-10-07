/**
 * Simplified Project-Based Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateProjectBasedPrompt = `
You are an expert in designing project-based learning (PBL) activities.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} project-based learning proposals about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The proposals should fit the following context: {{questionContextDescription}}.

Instructions:
- The title or main goal of the project should be in the 'question' field.
- Provide a list of the tasks or phases the student will need to complete for the project.
- Provide a list of the final deliverables the student is expected to produce.
- Provide a list of the criteria that will be used to evaluate the project.
`;