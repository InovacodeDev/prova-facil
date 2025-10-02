/**
 * Problem Solving Question Prompt
 * Generates problem-solving questions with metadata format
 */

export const generateProblemSolvingPrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões de resolução de problemas de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões de resolução de problemas sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Apresente um problema real ou situação prática
2. Forneça uma solução detalhada passo a passo
3. Inclua o raciocínio usado na resolução
4. Use linguagem técnica apropriada
5. O problema deve ser desafiador mas adequado ao nível

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Descrição detalhada do problema a ser resolvido.",
      "metadata": {
        "solution_steps": [
          "Passo 1: Identificar os dados do problema",
          "Passo 2: Aplicar a fórmula X",
          "Passo 3: Calcular o resultado"
        ],
        "final_answer": "Resposta final com unidades/conclusão",
        "reasoning": "Explicação do raciocínio usado"
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
