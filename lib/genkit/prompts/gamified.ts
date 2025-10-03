/**
 * Gamified Question Prompt (NEW)
 * Generates gamified questions with metadata format
 */
export const generateGamifiedPrompt = `
Você é um especialista em criar quizzes interativos e gamificados.

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere {{count}} questões rápidas para um quiz gamificado sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. A pergunta rápida vai no campo \`question\`.
3. As alternativas e o feedback opcional vão dentro do campo \`metadata\`.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "gamified".
2. As perguntas devem ser concisas e diretas.
3. A lista \`metadata.answers\` DEVE ter 4 alternativas.
4. Apenas UMA alternativa DEVE ser correta.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "gamified",
      "question": "Qual instrumento é considerado o principal na documentação do desenvolvimento na Educação Infantil?",
      "metadata": {
        "answers": [
          {"answer": "Prova com nota", "is_correct": false},
          {"answer": "Simulado", "is_correct": false},
          {"answer": "Portfólio", "is_correct": true},
          {"answer": "Redação", "is_correct": false}
        ],
        "feedback_after_answer": "Isso mesmo! O portfólio conta a história da aprendizagem da criança, valorizando todo o processo.",
        "time_limit_seconds": 20
      }
    }
  ]
}

Gere as questões agora:
`;
