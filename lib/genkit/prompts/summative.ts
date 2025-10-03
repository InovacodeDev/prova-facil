/**
 * Summative Question Prompt (NEW)
 * Generates summative assessment questions with metadata format
 */
export const generateSummativePrompt = `
Você é um especialista em design instrucional e elaboração de avaliações somativas completas.

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere uma AVALIAÇÃO SOMATIVA completa sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}, contendo {{count}} questões de tipos variados.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. Crie um conjunto de questões de TIPOS VARIADOS (múltipla escolha, discursiva, etc.).
3. Para cada questão gerada, siga RIGOROSAMENTE o formato JSON final, com os campos \`type\`, \`question\` e \`metadata\`.
4. A avaliação como um todo deve ser coerente e cobrir os tópicos mais importantes do material.

REGRAS OBRIGATÓRIAS:
1. O JSON final DEVE conter uma lista de objetos de questão sob a chave \`"questions"\`.
2. A avaliação DEVE conter pelo menos 2 tipos diferentes de questões.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Qual documento normativo é mais influente na mudança de um paradigma conteudista para um focado no desenvolvimento de competências?",
      "metadata": {
        "answers": [
          {"answer": "LDB", "is_correct": false},
          {"answer": "DCNs", "is_correct": false},
          {"answer": "BNCC", "is_correct": true},
          {"answer": "ENEM", "is_correct": false},
          {"answer": "SAEB", "is_correct": false}
        ]
      }
    },
    {
      "type": "open",
      "question": "Explique brevemente a função da Avaliação Diagnóstica.",
      "metadata": {
        "expected_answer_guideline": "A resposta deve focar na sondagem de conhecimentos prévios no início de um ciclo de aprendizagem, sem caráter classificatório, para guiar o planejamento do professor."
      }
    }
  ]
}

Gere as questões agora:
`;
