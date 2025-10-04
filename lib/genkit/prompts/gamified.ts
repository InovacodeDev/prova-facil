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
      "question": "Quiz Rápido: Avaliação na Educação Infantil",
      "metadata": {
        "scenario": "Você é um professor da Educação Infantil planejando as avaliações do semestre.",
        "challenges": [
          "Qual instrumento é considerado o principal na documentação do desenvolvimento?",
          "Verdadeiro ou Falso: A avaliação na Educação Infantil tem caráter classificatório.",
          "Complete: A avaliação deve valorizar o ________ mais do que apenas o produto final."
        ]
      }
    }
  ]
}

Gere as questões agora:
`;
