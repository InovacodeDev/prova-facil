/**
 * Matching Columns Question Prompt
 * Generates matching columns questions with metadata format
 */

export const generateMatchingColumnsPrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões de associação de colunas de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões de associação de colunas sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Coluna A contém os conceitos/perguntas (use letras: a, b, c...)
2. Coluna B contém as definições/respostas (use números: 1, 2, 3...)
3. Use entre 4 e 6 itens em cada coluna
4. Pode haver mais itens em uma coluna que na outra
5. As correspondências devem ser claras

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Associe os conceitos da coluna A com as definições da coluna B:",
      "metadata": {
        "column_a": [
          {"id": "a", "text": "Fotossíntese"},
          {"id": "b", "text": "Respiração"}
        ],
        "column_b": [
          {"id": "1", "text": "Produção de energia"},
          {"id": "2", "text": "Produção de glicose"}
        ],
        "correct_matches": [
          {"column_a_id": "a", "column_b_id": "2"},
          {"column_a_id": "b", "column_b_id": "1"}
        ]
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
