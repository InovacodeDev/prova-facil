import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Multiple Choice Question Prompt with strategic hints and complete example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateMultipleChoicePrompt = `
${formatHintForPrompt('multiple_choice')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Artificial Intelligence (AI)
Level: Higher Education (Computer Science)
Context: Understanding the fundamentals of LLMs (Large Language Models)

Example Question:

{
  "type": "multiple_choice",
  "question": "Qual dos seguintes conceitos é FUNDAMENTAL para o funcionamento de um LLM (Large Language Model) como o GPT?",
  "metadata": {
    "answers": [
      {
        "answer": "Transformers e Atenção (Attention Mechanism)",
        "is_correct": true
      },
      {
        "answer": "Redes Neurais Convolucionais (CNNs)",
        "is_correct": false
      },
      {
        "answer": "Algoritmos Genéticos",
        "is_correct": false
      },
      {
        "answer": "Árvores de Decisão",
        "is_correct": false
      },
      {
        "answer": "K-Means Clustering",
        "is_correct": false
      }
    ]
  }
}

Why this example is excellent:
✅ Question is clear and specific (tests conceptual understanding)
✅ Correct answer: "Transformers e Atenção" - the actual architecture behind LLMs
✅ Distractors are plausible (all are real ML techniques) but incorrect for LLMs
✅ Forces deep understanding, not just memorization

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} multiple-choice questions about the subject "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Question must be clear, specific, and test deep understanding
3. Provide 4-5 answer options (exactly one correct)
4. Distractors must be:
   - Plausible (related to the topic)
   - Based on common mistakes or misconceptions
   - Not obviously wrong
5. **METADATA FORMAT:**
   - "answers" is an ARRAY of objects
   - Each object has "answer" (string) and "is_correct" (boolean)
   - Exactly ONE answer has is_correct: true

❌ DO NOT:
- Create questions with "all of the above" or "none of the above"
- Use ambiguous language
- Make distractors too easy or too hard
- Output anything except valid JSON
`;
