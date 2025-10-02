/**
 * Gamified Question Prompt (NEW)
 * Generates gamified questions with metadata format
 */

export const generateGamifiedPrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões gamificadas de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões gamificadas sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Crie uma narrativa envolvente (história, desafio, missão)
2. Divida o desafio em níveis/fases progressivas
3. Cada nível deve ter um objetivo claro
4. Defina pontuação para cada nível
5. Especifique condições de sucesso e feedback

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Narrativa/contexto da questão gamificada",
      "metadata": {
        "narrative": "História ou contexto que envolve o aluno",
        "game_type": "quiz_adventure / escape_room / simulation / puzzle",
        "levels": [
          {
            "level_number": 1,
            "objective": "O que o aluno deve fazer neste nível",
            "challenge": "Descrição do desafio ou pergunta",
            "points": 100,
            "success_condition": "Critério para avançar"
          },
          {
            "level_number": 2,
            "objective": "Objetivo do segundo nível",
            "challenge": "Desafio mais complexo",
            "points": 200,
            "success_condition": "Critério para completar"
          }
        ],
        "total_points": 300,
        "feedback": {
          "success": "Mensagem de sucesso motivadora",
          "partial": "Mensagem para progresso parcial",
          "failure": "Mensagem de encorajamento para tentar novamente"
        }
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
