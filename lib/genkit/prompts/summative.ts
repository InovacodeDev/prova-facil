/**
 * Summative Question Prompt (NEW)
 * Generates summative assessment questions with metadata format
 */

export const generateSummativePrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões avaliativas somativas de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} questões somativas sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. A questão deve avaliar múltiplas competências/objetivos
2. Integre diferentes aspectos do conteúdo estudado
3. Especifique os objetivos de aprendizagem avaliados
4. Forneça critérios de avaliação detalhados com pesos
5. Inclua uma resposta modelo abrangente

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Questão integradora que avalia múltiplos objetivos de aprendizagem",
      "metadata": {
        "learning_objectives": [
          "Objetivo 1: Compreender conceito X",
          "Objetivo 2: Aplicar técnica Y",
          "Objetivo 3: Analisar situação Z"
        ],
        "competencies_assessed": [
          "Conhecimento conceitual",
          "Aplicação prática",
          "Pensamento crítico",
          "Comunicação"
        ],
        "evaluation_criteria": [
          {
            "criterion": "Compreensão conceitual",
            "weight": 30,
            "description": "Demonstra entendimento dos conceitos-chave"
          },
          {
            "criterion": "Aplicação prática",
            "weight": 40,
            "description": "Aplica conhecimento em situação real"
          },
          {
            "criterion": "Análise crítica",
            "weight": 30,
            "description": "Analisa e avalia informações criticamente"
          }
        ],
        "model_answer": "Resposta modelo completa que integra todos os objetivos de aprendizagem",
        "total_points": 100
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
