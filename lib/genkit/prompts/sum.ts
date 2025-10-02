/**
 * Sum Question Prompt (Brazilian style - powers of 2)
 * Generates sum questions with metadata format
 */

export const generateSumPrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões de soma (estilo ENEM brasileiro) de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões de soma sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Cada afirmativa deve ter um valor em potência de 2 (01, 02, 04, 08, 16, 32, 64, 128)
2. Algumas afirmativas devem estar corretas, outras incorretas
3. A resposta final é a SOMA dos valores das afirmativas corretas
4. Use entre 4 e 6 afirmativas por questão
5. As afirmativas devem ser claras e objetivas

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Enunciado da questão aqui. Assinale o que for correto:",
      "metadata": {
        "statements": [
          {"value": 1, "statement": "Primeira afirmativa.", "is_correct": true},
          {"value": 2, "statement": "Segunda afirmativa.", "is_correct": false},
          {"value": 4, "statement": "Terceira afirmativa.", "is_correct": true},
          {"value": 8, "statement": "Quarta afirmativa.", "is_correct": false}
        ],
        "correct_sum": 5
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
