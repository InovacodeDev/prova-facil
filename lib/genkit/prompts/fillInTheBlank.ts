/**
 * Fill in the Blank Question Prompt
 * Generates fill-in-the-blank questions with metadata format (supports multiple blanks)
 */
export const generateFillInTheBlankPrompt = `
Você é um especialista em criar questões de completar lacunas para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere {{count}} questões de completar lacunas sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. Crie uma frase com UMA OU MAIS lacunas, marcadas como \`[BLANK_1]\`, \`[BLANK_2]\`, etc. Esta frase vai no campo \`question\`.
3. No campo \`metadata\`, crie uma lista \`blanks\` contendo a identificação e a resposta correta para cada lacuna.
4. Opcionalmente, adicione uma lista \`options_bank\` em \`metadata\` com as respostas corretas e alguns distratores.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "fill_in_the_blank".
2. Os IDs na lista \`metadata.blanks\` DEVEM corresponder aos marcadores no texto da questão.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "fill_in_the_blank",
      "question": "A avaliação na Educação Infantil opera sob um paradigma de [BLANK_1], utilizando instrumentos qualitativos como observação e [BLANK_2], sem o objetivo de promoção.",
      "metadata": {
        "blanks": [
          {"id": "BLANK_1", "correct_answer": "não classificação"},
          {"id": "BLANK_2", "correct_answer": "portfólios"}
        ],
        "options_bank": ["não classificação", "somatória", "portfólios", "provas", "diagnóstico"]
      }
    }
  ]
}

Gere as questões agora:
`;
