import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Matching Columns Question Prompt with strategic hints and complete example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateMatchingColumnsPrompt = `
${formatHintForPrompt('matching_columns')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Brazilian Literature
Level: High School (Ensino Médio)
Context: Modernist authors and their iconic works

Example Matching Columns Question:

{
  "type": "matching_columns",
  "question": "Relacione os autores modernistas brasileiros (Coluna A) com suas obras mais importantes (Coluna B):",
  "metadata": {
    "column_a": [
      { "id": "A1", "text": "Mário de Andrade" },
      { "id": "A2", "text": "Oswald de Andrade" },
      { "id": "A3", "text": "Carlos Drummond de Andrade" },
      { "id": "A4", "text": "Cecília Meireles" }
    ],
    "column_b": [
      { "id": "B1", "text": "Sentimento do Mundo" },
      { "id": "B2", "text": "Macunaíma" },
      { "id": "B3", "text": "Pau-Brasil" },
      { "id": "B4", "text": "Romanceiro da Inconfidência" },
      { "id": "B5", "text": "Grande Sertão: Veredas" }
    ],
    "correct_matches": [
      { "from_id": "A1", "to_id": "B2" },
      { "from_id": "A2", "to_id": "B3" },
      { "from_id": "A3", "to_id": "B1" },
      { "from_id": "A4", "to_id": "B4" }
    ]
  }
}

Correct Answers:
A1 (Mário de Andrade) → B2 (Macunaíma)
A2 (Oswald de Andrade) → B3 (Pau-Brasil)
A3 (Carlos Drummond) → B1 (Sentimento do Mundo)
A4 (Cecília Meireles) → B4 (Romanceiro da Inconfidência)

Why this example is excellent:
✅ Column A has 4 items, Column B has 5 items (one extra to increase difficulty)
✅ Items are NOT in matching order (shuffled for challenge)
✅ All authors are from the same movement (Modernism) making it harder
✅ Extra item (B5 - Guimarães Rosa) is plausible but incorrect
✅ Tests specific knowledge (not just "who wrote what")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} matching columns questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Create 3-5 items in Column A (the "from" column)
3. Create 4-6 items in Column B (the "to" column) - ideally 1-2 MORE than Column A
4. **Shuffle Column B** - do NOT keep them in matching order
5. Use clear IDs: "A1", "A2", etc. for column_a and "B1", "B2", etc. for column_b
6. **METADATA FORMAT:**
   - "column_a" is an ARRAY of OBJECTS (id + text)
   - "column_b" is an ARRAY of OBJECTS (id + text)
   - "correct_matches" is an ARRAY of OBJECTS (from_id + to_id)

📋 CONTENT GUIDELINES:
- Column A: Items that need to be associated (authors, events, concepts, organs)
- Column B: Their counterparts (works, dates, definitions, functions)
- Extra items in Column B should be plausible but incorrect
- All items should be from a similar category (don't mix apples and oranges)

💡 DIFFICULTY TIPS:
- EASY: 3 items in A, 3 items in B (1:1 matching)
- MEDIUM: 4 items in A, 5 items in B (one extra)
- HARD: 5 items in A, 6 items in B (two extras) + all from same category

❌ DO NOT:
- Keep Column B in the same order as Column A (must shuffle!)
- Create only one item in either column
- Make extra items in Column B obviously wrong
- Forget to define correct_matches
- Output anything except valid JSON
`;
