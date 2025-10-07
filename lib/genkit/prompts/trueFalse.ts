import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced True/False Question Prompt with strategic hints and complete example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateTrueFalsePrompt = `
${formatHintForPrompt('true_false')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Environmental Science (Climate Change)
Level: High School (Ensino Médio)
Context: Understanding global warming facts vs. misconceptions

Example True/False Question:

{
  "type": "true_false",
  "question": "Julgue as seguintes afirmações sobre mudanças climáticas e aquecimento global como Verdadeiras (V) ou Falsas (F):",
  "metadata": {
    "statements": [
      {
        "statement": "O efeito estufa é um fenômeno natural essencial para a manutenção da vida na Terra, mas sua intensificação devido às atividades humanas causa o aquecimento global.",
        "is_correct": true
      },
      {
        "statement": "O derretimento das geleiras nos polos é causado exclusivamente por ciclos naturais do planeta e não tem relação com a emissão de gases de efeito estufa pela atividade humana.",
        "is_correct": false
      },
      {
        "statement": "O dióxido de carbono (CO₂) é o único gás responsável pelo efeito estufa, sendo metano (CH₄) e óxido nitroso (N₂O) insignificantes no aquecimento global.",
        "is_correct": false
      },
      {
        "statement": "Eventos climáticos extremos, como furacões mais intensos e ondas de calor, têm se tornado mais frequentes nas últimas décadas devido ao aquecimento global.",
        "is_correct": true
      },
      {
        "statement": "A Amazônia, conhecida como 'pulmão do mundo', produz 20% do oxigênio da atmosfera terrestre, sendo sua preservação crucial para a respiração global.",
        "is_correct": false
      }
    ]
  }
}

Why this example is excellent:
✅ Statements are substantial (not just yes/no simplifications)
✅ Mix of true (2) and false (3) statements - balanced
✅ False statements are PLAUSIBLE (common misconceptions):
   - Statement 2: Many believe it's "just natural cycles"
   - Statement 3: CO₂ is famous, but not the only gas
   - Statement 5: "Lungs of the world" is a popular myth
✅ Avoids absolute words ("always", "never") that make it too easy
✅ Tests deep conceptual understanding, not trivial facts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} true/false statements about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The question should fit the following context: {{questionContextDescription}}.

The main question text should be: "Julgue as seguintes afirmações como Verdadeiras (V) ou Falsas (F):"

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Create 4-5 substantive statements (not simple yes/no)
3. Each statement must be definitively true OR false (no ambiguity)
4. Mix true and false statements (don't make all true or all false)
5. False statements should be PLAUSIBLE (common mistakes, not absurd)
6. **METADATA FORMAT:**
   - "statements" is an ARRAY of OBJECTS
   - Each object has "statement" (string) and "is_correct" (boolean)
   - TRUE statements: is_correct = true
   - FALSE statements: is_correct = false

✅ GOOD STATEMENT CHARACTERISTICS:
- 15-30 words (substantial, not telegraphic)
- Tests conceptual understanding
- Based on common misconceptions for false statements
- Avoids "trick" words (sempre, nunca, todos, nenhum)
- Clear and unambiguous

❌ DO NOT:
- Create overly simple statements ("A água é H₂O")
- Use absolute words that make it obviously false ("sempre", "nunca")
- Make all statements true or all false (balance is key)
- Create ambiguous statements that could be argued either way
- Output the literal word "statements" instead of actual statement text
- Output anything except valid JSON
`;
