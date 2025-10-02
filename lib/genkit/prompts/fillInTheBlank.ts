/**
 * Fill in the Blank Question Prompt
 * Generates fill-in-the-blank questions with metadata format (supports multiple blanks)
 */

export const generateFillInTheBlankPrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões de preencher lacunas de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões de preencher lacunas sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Cada questão pode ter 1 ou mais lacunas (use BLANK_1, BLANK_2, etc.)
2. Forneça as respostas corretas para cada lacuna
3. Opcionalmente, forneça um banco de opções para os alunos
4. As lacunas devem testar conhecimento chave
5. Use linguagem técnica apropriada

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "O BLANK_1 é responsável pela BLANK_2 nas células.",
      "metadata": {
        "blanks": [
          {"id": "BLANK_1", "correct_answer": "mitocôndria"},
          {"id": "BLANK_2", "correct_answer": "respiração celular"}
        ],
        "options_bank": ["mitocôndria", "núcleo", "respiração celular", "fotossíntese"]
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
