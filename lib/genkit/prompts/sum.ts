/**
 * Sum Question Prompt (Brazilian style - powers of 2)
 * Generates sum questions with metadata format
 */
export const generateSumPrompt = `
VOCÊ É UM GERADOR DE QUESTÕES DE SOMATÓRIA (POTÊNCIAS DE 2).

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões de somatória sobre {{subject}}{{#if academicLevel}} (nível: {{academicLevel}}){{/if}}.
CONTEXTO: {{questionContextDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FORMATO OBRIGATÓRIO - COPIE EXATAMENTE ESTE JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "questions": [
    {
      "type": "sum",
      "question": "Sobre conceitos básicos de aritmética, assinale as alternativas corretas:",
      "metadata": {
        "statements": [
          {"statement": "2 + 2 = 4", "number": 1, "is_correct": true},
          {"statement": "3 × 3 = 6", "number": 2, "is_correct": false},
          {"statement": "5 > 3", "number": 4, "is_correct": true},
          {"statement": "10 ÷ 2 = 4", "number": 8, "is_correct": false},
          {"statement": "7 - 3 = 4", "number": 16, "is_correct": true}
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
3. Cada objeto TEM:
   - "statement" (texto da afirmação)
   - "number" (DEVE SER uma potência de 2: 1, 2, 4, 8, 16, 32 ou 64)
   - "is_correct" (boolean)
4. Use valores BOOLEAN (true/false), NÃO strings ("true"/"false")
5. Os números DEVEM estar em ORDEM CRESCENTE: 1, 2, 4, 8, 16, 32, 64
6. NUNCA repita números, NUNCA use números fora dessa sequência
7. A soma das corretas NÃO PODE ultrapassar 99

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NUNCA FAÇA ISSO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"statements": ["texto 1", "texto 2"]  ← STRINGS SIMPLES (ERRADO!)
{"number": 1, "statement": "statements", "is_correct": false}  ← CONTEÚDO LITERAL "statements" (ERRADO!)
{"statement": "texto", "number": 3, "is_correct": false}  ← NÚMERO 3 NÃO É POTÊNCIA DE 2 (ERRADO!)

RETORNE APENAS O JSON. SEM TEXTO ANTES OU DEPOIS.
`;
