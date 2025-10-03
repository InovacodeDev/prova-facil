/**
 * Project Based Question Prompt (NEW)
 * Generates project-based questions with metadata format
 */
export const generateProjectBasedPrompt = `
Você é um especialista em metodologias ativas e Aprendizagem Baseada em Projetos (ABP).

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere {{count}} propostas de projeto (ABP) sobre o tema central de {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. O título do projeto vai no campo \`question\`.
3. Todos os detalhes do projeto (pergunta norteadora, objetivos, produto final, etapas e rubrica) vão estruturados dentro do campo \`metadata\`.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "project_based".
2. A proposta em \`metadata\` DEVE ser um projeto completo e coerente.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "project_based",
      "question": "Projeto: Criando a Avaliação do Futuro",
      "metadata": {
        "guiding_question": "Como podemos criar um sistema de avaliação para nossa disciplina que seja justo, eficaz e alinhado às competências do século XXI?",
        "learning_objectives": ["Analisar criticamente diferentes métodos de avaliação.", "Colaborar em equipe para desenvolver uma proposta coesa.", "Aplicar os conceitos de avaliação formativa e somativa."],
        "final_product_description": "Os grupos deverão apresentar um 'Manual de Avaliação' para a disciplina, incluindo exemplos de atividades, instrumentos e uma rubrica.",
        "main_steps": ["Pesquisa teórica", "Análise de práticas atuais", "Desenvolvimento da proposta", "Apresentação"],
        "evaluation_rubric": [
          {"criterion": "Profundidade da Pesquisa", "levels": [{"level": "Básico", "description": "..."}, {"level": "Proficiente", "description": "..."}]},
          {"criterion": "Qualidade do Produto Final", "levels": [{"level": "Básico", "description": "..."}, {"level": "Proficiente", "description": "..."}]}
        ]
      }
    }
  ]
}

Gere as questões agora:
`;
