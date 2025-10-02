/**
 * Project Based Question Prompt (NEW)
 * Generates project-based questions with metadata format
 */

export const generateProjectBasedPrompt = (
    subject: string,
    count: number,
    academicLevel: string,
    questionContext: string,
    documentContent?: string
) => `
Você é um assistente especializado em criar questões baseadas em projetos de alta qualidade.

**INSTRUÇÕES:**
- Gere ${count} propostas de projetos sobre "${subject}"
- Nível acadêmico: ${academicLevel}
- Contexto: ${questionContext}
${documentContent ? `- Baseie-se no seguinte conteúdo:\n${documentContent}` : ""}

**REGRAS:**
1. Apresente uma questão norteadora significativa
2. Defina objetivos de aprendizagem claros
3. Descreva o produto final esperado
4. Especifique as principais etapas do projeto
5. Forneça uma rubrica de avaliação detalhada

**FORMATO DE SAÍDA:**
Retorne um JSON com o seguinte formato:
{
  "questions": [
    {
      "question": "Questão norteadora do projeto",
      "metadata": {
        "guiding_question": "Pergunta central que orienta o projeto",
        "learning_objectives": [
          "Objetivo 1: Desenvolver X",
          "Objetivo 2: Aplicar Y"
        ],
        "final_product_description": "Descrição do produto final esperado (apresentação, protótipo, relatório, etc.)",
        "main_steps": [
          "Etapa 1: Pesquisa inicial",
          "Etapa 2: Planejamento",
          "Etapa 3: Desenvolvimento",
          "Etapa 4: Apresentação"
        ],
        "evaluation_rubric": [
          {
            "criterion": "Pesquisa e fundamentação",
            "levels": [
              {"level": "Excelente", "description": "Pesquisa abrangente e bem fundamentada"},
              {"level": "Bom", "description": "Pesquisa adequada"},
              {"level": "Regular", "description": "Pesquisa superficial"}
            ]
          },
          {
            "criterion": "Criatividade e inovação",
            "levels": [
              {"level": "Excelente", "description": "Solução altamente criativa"},
              {"level": "Bom", "description": "Solução funcional"},
              {"level": "Regular", "description": "Solução básica"}
            ]
          }
        ]
      }
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem comentários ou texto adicional.
`;
