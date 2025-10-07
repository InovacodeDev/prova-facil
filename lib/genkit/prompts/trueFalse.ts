/**
 * True/False Question Prompt
 * Generates true/false questions with metadata format
 */
export const generateTrueFalsePrompt = `
VOCÊ É UM GERADOR DE QUESTÕES DE VERDADEIRO OU FALSO.

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões de verdadeiro/falso sobre {{subject}}{{#if academicLevel}} (nível: {{academicLevel}}){{/if}}.
CONTEXTO: {{questionContextDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FORMATO OBRIGATÓRIO - COPIE EXATAMENTE ESTE JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "questions": [
    {
      "type": "true_false",
      "question": "Julgue as afirmativas a seguir em Verdadeiro (V) ou Falso (F):",
      "metadata": {
        "statements": [
          {"statement": "Afirmação 1 aqui", "is_correct": true},
          {"statement": "Afirmação 2 aqui", "is_correct": false},
          {"statement": "Afirmação 3 aqui", "is_correct": true},
          {"statement": "Afirmação 4 aqui", "is_correct": false},
          {"statement": "Afirmação 5 aqui", "is_correct": true}
        ]
      }
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ REGRAS INEGOCIÁVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. "statements" DEVE SER UM ARRAY [ ]
2. Cada item do array DEVE SER UM OBJETO { }
3. EXATAMENTE 5 afirmações
4. Cada objeto TEM "statement" (texto) e "is_correct" (boolean)
5. Use valores BOOLEAN (true/false), NÃO strings ("true"/"false")
6. O campo "question" é SEMPRE: "Julgue as afirmativas a seguir em Verdadeiro (V) ou Falso (F):"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NUNCA FAÇA ISSO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"statements": ["texto 1", "texto 2"]  ← STRINGS SIMPLES (ERRADO!)
"statements": [{"statement": "texto", "is_correct": "false"}]  ← STRING DE BOOLEAN (ERRADO!)
{"statement": "statements", "is_correct": false}  ← CONTEÚDO LITERAL (ERRADO!)

RETORNE APENAS O JSON. SEM TEXTO ANTES OU DEPOIS.
`;
