/**
 * Fill in the Blank Question Prompt
 * Generates fill-in-the-blank questions with metadata format (supports multiple blanks)
 */
export const generateFillInTheBlankPrompt = `
VOCÊ É UM GERADOR DE QUESTÕES DE COMPLETAR LACUNAS.

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões de completar lacunas sobre {{subject}}{{#if academicLevel}} (nível: {{academicLevel}}){{/if}}.
CONTEXTO: {{questionContextDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FORMATO OBRIGATÓRIO - COPIE EXATAMENTE ESTE JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "questions": [
    {
      "type": "fill_in_the_blank",
      "question": "A [BLANK_1] é a capital do [BLANK_2].",
      "metadata": {
        "blanks": [
          {"id": "BLANK_1", "correct_answer": "Brasília"},
          {"id": "BLANK_2", "correct_answer": "Brasil"}
        ],
        "options_bank": ["Brasília", "Brasil", "Rio de Janeiro", "Portugal", "São Paulo", "Argentina"]
      }
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ REGRAS INEGOCIÁVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Use marcadores [BLANK_1], [BLANK_2], etc. NO TEXTO da questão
2. "blanks" DEVE SER UM ARRAY [ ]
3. Cada item do array DEVE SER UM OBJETO { }
4. Cada objeto TEM "id" (BLANK_1, BLANK_2...) e "correct_answer" (a resposta)
5. Os IDs em "blanks" DEVEM CORRESPONDER aos marcadores [BLANK_X] no texto
6. "options_bank" é OPCIONAL - array de strings com respostas + distratores

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NUNCA FAÇA ISSO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"blanks": ["resposta1", "resposta2"]  ← STRINGS SIMPLES (ERRADO!)
"blanks": {"chave": "valor escapado"}  ← JSON ESCAPADO (ERRADO!)
"blanks": ["id:BLANK_1", "correct_answer:teste"]  ← FORMATO INVÁLIDO (ERRADO!)

RETORNE APENAS O JSON. SEM TEXTO ANTES OU DEPOIS.
`;
