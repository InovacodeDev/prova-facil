import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Sum Question Prompt (Brazilian "Somatório") with strategic hints and complete example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateSumPrompt = `
${formatHintForPrompt('sum')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Geography of Brazil (Regional Studies)
Level: High School (Ensino Médio)
Context: Characteristics of Santa Catarina state

Example Sum Question:

{
  "type": "sum",
  "question": "Analise as afirmações sobre o estado de Santa Catarina e some os números das afirmativas CORRETAS:",
  "metadata": {
    "statements": [
      {
        "number": 1,
        "statement": "Santa Catarina é o menor estado da Região Sul do Brasil em extensão territorial.",
        "is_correct": false
      },
      {
        "number": 2,
        "statement": "A capital de Santa Catarina, Florianópolis, localiza-se parcialmente em uma ilha, sendo uma das três ilhas-capitais do Brasil.",
        "is_correct": true
      },
      {
        "number": 4,
        "statement": "O clima predominante em Santa Catarina é o subtropical, com as quatro estações do ano bem definidas.",
        "is_correct": true
      },
      {
        "number": 8,
        "statement": "Santa Catarina é o maior produtor de carvão mineral do Brasil, com reservas concentradas principalmente na região sul do estado.",
        "is_correct": true
      },
      {
        "number": 16,
        "statement": "A Oktoberfest de Blumenau é considerada a maior festa alemã das Américas e a segunda maior do mundo, perdendo apenas para a de Munique.",
        "is_correct": true
      },
      {
        "number": 32,
        "statement": "Santa Catarina faz divisa territorial com todos os estados da Região Sul do Brasil (Paraná e Rio Grande do Sul) e também com São Paulo.",
        "is_correct": false
      }
    ]
  }
}

Answer: 2 + 4 + 8 + 16 = 30

Why this example is excellent:
✅ Numbers are powers of 2 in ascending order: 1, 2, 4, 8, 16, 32
✅ Mix of correct (4) and incorrect (2) statements
✅ Incorrect statements are PLAUSIBLE (common misconceptions):
   - Statement 1: SC is actually the THIRD smallest in the South (wrong)
   - Statement 32: SC doesn't border São Paulo (only PR and RS)
✅ Tests deep, specific knowledge (not generic facts)
✅ Answer is a reasonable number (30, not 127)
✅ One error ruins the entire answer (tests mastery)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} sum questions (with 5-7 statements each) about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The question should fit the following context: {{questionContextDescription}}.

The main question text should be: "Analise as afirmações sobre [TOPIC] e some os números das afirmativas CORRETAS:"

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Create 5-7 substantive statements (substantial, not trivial)
3. Assign numbers that are POWERS OF 2 in ascending order:
   - 5 statements: 1, 2, 4, 8, 16
   - 6 statements: 1, 2, 4, 8, 16, 32
   - 7 statements: 1, 2, 4, 8, 16, 32, 64
4. Mix correct and incorrect statements (aim for 3-4 correct)
5. **METADATA FORMAT:**
   - "statements" is an ARRAY of OBJECTS
   - Each object has "number" (power of 2), "statement" (string), and "is_correct" (boolean)

⚠️ DIFFICULTY CALIBRATION:
- This is the HARDEST question type (one mistake = wrong answer)
- Use it to differentiate students with MASTERY from those with partial knowledge
- Incorrect statements must be subtle (test nuances, not obvious errors)
- Aim for a final sum that is reasonable (between 10-60 typically)

✅ GOOD STATEMENT CHARACTERISTICS:
- 20-40 words (substantial, specific)
- Tests deep factual knowledge or conceptual precision
- Incorrect statements are plausible (experts might debate them)
- Mix conceptual understanding with factual recall

❌ DO NOT:
- Use numbers that aren't powers of 2
- Make all statements true or all false
- Create obviously wrong statements ("O Brasil fica na Europa")
- Have a final sum over 100 (too many correct statements)
- Output anything except valid JSON
`;
