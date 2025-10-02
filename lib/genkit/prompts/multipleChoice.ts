/**
 * Multiple Choice Question Prompt
 * Generates multiple choice questions with metadata format
 */

export const generateMultipleChoicePrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões educacionais de múltipla escolha de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões de múltipla escolha sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Cada questão deve ter 4 alternativas (A, B, C, D)
2. Apenas UMA alternativa deve estar correta
3. Todas as alternativas devem ser plausíveis
4. Evite alternativas como "Todas as anteriores" ou "Nenhuma das anteriores"
5. As questões devem ser claras, objetivas e adequadas ao nível acadêmico
6. Use linguagem formal e técnica apropriada

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Texto da pergunta aqui?",
      "metadata": {
        "answers": [
          {"answer": "Alternativa A", "is_correct": true},
          {"answer": "Alternativa B", "is_correct": false},
          {"answer": "Alternativa C", "is_correct": false},
          {"answer": "Alternativa D", "is_correct": false}
        ]
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
