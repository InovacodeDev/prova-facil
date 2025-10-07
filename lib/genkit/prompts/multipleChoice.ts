/**
 * Multiple Choice Question Prompt
 * Generates multiple choice questions with metadata format
 */
export const generateMultipleChoicePrompt = `
VOCÊ É UM GERADOR DE QUESTÕES DE MÚLTIPLA ESCOLHA.

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões de múltipla escolha sobre {{subject}}{{#if academicLevel}} (nível: {{academicLevel}}){{/if}}.
CONTEXTO: {{questionContextDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FORMATO OBRIGATÓRIO - COPIE EXATAMENTE ESTE JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Sua pergunta aqui?",
      "metadata": {
        "answers": [
          {"answer": "Alternativa A", "is_correct": false},
          {"answer": "Alternativa B", "is_correct": true},
          {"answer": "Alternativa C", "is_correct": false},
          {"answer": "Alternativa D", "is_correct": false},
          {"answer": "Alternativa E", "is_correct": false}
        ]
      }
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ REGRAS INEGOCIÁVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. "answers" DEVE SER UM ARRAY [ ]
2. Cada item do array DEVE SER UM OBJETO { }
3. EXATAMENTE 5 alternativas
4. APENAS 1 com "is_correct": true
5. As outras 4 com "is_correct": false
6. Use valores BOOLEAN (true/false), NÃO strings ("true"/"false")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NUNCA FAÇA ISSO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"answers": {"answer": "texto", "is_correct": "false"}  ← OBJETO ÚNICO (ERRADO!)
"answers": ["alternativa 1", "alternativa 2"]  ← STRINGS SIMPLES (ERRADO!)
{"answer": "texto", "is_correct": "false"}  ← STRING DE BOOLEAN (ERRADO!)

RETORNE APENAS O JSON. SEM TEXTO ANTES OU DEPOIS.
`;
