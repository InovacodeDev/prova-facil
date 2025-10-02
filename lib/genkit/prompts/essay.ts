/**
 * Essay Question Prompt
 * Generates essay/redação questions with metadata format
 */

export const generateEssayPrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar propostas de redação/dissertação de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} propostas de redação sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Apresente um tema relevante e atual
2. Forneça orientações claras de desenvolvimento
3. Especifique os requisitos (gênero textual, extensão, etc.)
4. Inclua critérios de avaliação
5. O tema deve ser apropriado ao nível acadêmico

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Tema da redação: [Título do tema]",
      "metadata": {
        "theme": "Descrição detalhada do tema",
        "guidelines": [
          "Apresente sua tese",
          "Desenvolva argumentos",
          "Conclua sua redação"
        ],
        "requirements": {
          "text_type": "Dissertativo-argumentativo",
          "min_words": 300,
          "max_words": 500
        },
        "evaluation_criteria": [
          "Coerência e coesão textual",
          "Argumentação",
          "Domínio da norma culta"
        ]
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
