/**
 * True/False Question Prompt
 * Generates true/false questions with metadata format
 */

export const generateTrueFalsePrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões educacionais de Verdadeiro ou Falso de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões de Verdadeiro/Falso sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Cada questão deve ser uma afirmação clara
2. A resposta deve ser Verdadeiro ou Falso
3. Evite ambiguidades ou pegadinhas
4. Use linguagem técnica apropriada ao nível acadêmico
5. As afirmações devem testar conhecimento relevante

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Afirmação aqui.",
      "metadata": {
        "answers": [
          {"answer": "Verdadeiro", "is_correct": true},
          {"answer": "Falso", "is_correct": false}
        ]
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
