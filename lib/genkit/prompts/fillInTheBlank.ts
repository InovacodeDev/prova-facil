import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Fill-in-the-Blank Question Prompt with strategic hints and complete example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateFillInTheBlankPrompt = `
${formatHintForPrompt('fill_in_the_blank')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Natural Sciences (Water Cycle)
Level: Elementary School (Ensino Fundamental I - 5º ano)
Context: Understanding the water cycle process

Example Fill-in-the-Blank Question:

{
  "type": "fill_in_the_blank",
  "question": "Complete o texto sobre o ciclo da água com as palavras corretas:\\n\\nO ciclo da água começa quando o calor do {{blank_1}} aquece a água dos rios, lagos e oceanos. Esse processo é chamado de {{blank_2}}, e transforma a água líquida em vapor. O vapor sobe para a atmosfera e, ao encontrar temperaturas mais frias, se transforma novamente em pequenas gotículas de água através da {{blank_3}}. Essas gotículas formam as {{blank_4}}. Quando as gotículas ficam muito pesadas, caem em forma de chuva, neve ou granizo, num processo chamado {{blank_5}}.",
  "metadata": {
    "blanks": [
      {
        "id": "blank_1",
        "correct_answer": "Sol"
      },
      {
        "id": "blank_2",
        "correct_answer": "evaporação"
      },
      {
        "id": "blank_3",
        "correct_answer": "condensação"
      },
      {
        "id": "blank_4",
        "correct_answer": "nuvens"
      },
      {
        "id": "blank_5",
        "correct_answer": "precipitação"
      }
    ]
  }
}

Why this example is excellent:
✅ Text is contextual and educational (tells a story)
✅ 5 blanks test key vocabulary (Sol, evaporação, condensação, nuvens, precipitação)
✅ Blanks are distributed throughout (not all at the end)
✅ Each blank tests a specific concept
✅ Age-appropriate difficulty (Elementary School)
✅ NO word bank provided (for older students) - but could add one for younger

ALTERNATIVE with Word Bank (for younger students):

{
  "type": "fill_in_the_blank",
  "question": "Complete o texto sobre o ciclo da água usando o banco de palavras:\\n\\n[Banco de palavras: precipitação, Sol, nuvens, condensação, evaporação, oceano]\\n\\nO ciclo da água começa quando o calor do {{blank_1}} aquece a água dos rios, lagos e oceanos...",
  "metadata": {
    "blanks": [...same as above...],
    "options_bank": ["precipitação", "Sol", "nuvens", "condensação", "evaporação", "oceano"]
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} fill-in-the-blank questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Create a coherent text/paragraph (2-4 sentences) with 3-5 blanks
3. Use {{blank_1}}, {{blank_2}}, etc. as placeholders in the text
4. Distribute blanks throughout the text (not all at beginning/end)
5. Each blank should test KEY VOCABULARY or CONCEPTS
6. **METADATA FORMAT:**
   - "blanks" is an ARRAY of OBJECTS
   - Each object has "id" (string like "blank_1") and "correct_answer" (string)
   - Optional: "options_bank" array of strings (word bank for younger students)

📝 TEXT GUIDELINES:
- Create a narrative or explanatory text (not just disconnected sentences)
- Context should help students understand what goes in the blanks
- For Elementary School: Include word bank with 1-2 extra options
- For High School/University: No word bank (tests recall, not recognition)

🎯 BLANK SELECTION:
- Remove KEY TERMS (not trivial words like "o", "a", "de")
- Test vocabulary that demonstrates understanding of the concept
- Make blanks logical (student should be able to infer from context)

❌ DO NOT:
- Remove random words that make the sentence incomprehensible
- Create blanks for articles/prepositions (o, a, de, em) unless testing grammar
- Make text too long (max 6-8 lines)
- Forget to match blank IDs in text with metadata
- Output anything except valid JSON
`;
