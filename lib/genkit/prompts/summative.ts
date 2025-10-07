/**
 * Simplified Summative Question Prompt.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateSummativePrompt = `
You are an expert in instructional design and creating comprehensive summative assessments.

Reference Material:
{{documentContext}}

Task:
Generate {{count}} summative questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

Instructions:
- Formulate a high-level question that requires the student to synthesize information from the entire reference material, demonstrating a comprehensive understanding of the subject.
- Provide a summary of the key points expected in a complete answer.
- Provide the specific criteria that will be used to evaluate the student's response.
`;