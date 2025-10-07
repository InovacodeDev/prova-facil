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
3. As fases (\`phases\`) e os entregáveis (\`deliverables\`) do projeto vão estruturados dentro do campo \`metadata\`.
4. Se NENHUM material de referência for fornecido, retorne um erro informando que o material é necessário.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "project_based".
2. A proposta em \`metadata\` DEVE ser um projeto completo e coerente.
3. IMPORTANTE: \`phases\` e \`deliverables\` devem ser arrays de strings simples (não objetos).
4. A resposta final DEVE ser um único objeto JSON com uma chave no nível raiz chamada "questions". O valor dessa chave DEVE ser uma lista.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "project_based",
      "question": "Projeto: Criando a Avaliação do Futuro - Como podemos criar um sistema de avaliação para nossa disciplina que seja justo, eficaz e alinhado às competências do século XXI?",
      "metadata": {
        "phases": [
          "Fase 1: Pesquisa teórica sobre diferentes métodos de avaliação e suas aplicações.",
          "Fase 2: Análise crítica das práticas de avaliação atuais na escola.",
          "Fase 3: Desenvolvimento colaborativo da proposta de sistema de avaliação.",
          "Fase 4: Apresentação do Manual de Avaliação para a turma."
        ],
        "deliverables": [
          "Manual de Avaliação completo (incluindo exemplos de atividades e instrumentos)",
          "Rubrica detalhada para avaliação dos trabalhos",
          "Apresentação em slides do sistema proposto",
          "Reflexão individual sobre o processo de aprendizagem"
        ]
      }
    }
  ]
}

✅ CORRETO - Arrays de strings simples:
{
  "metadata": {
    "phases": ["Fase 1", "Fase 2"],
    "deliverables": ["Entregável 1", "Entregável 2"]
  }
}

❌ ERRADO (NÃO OMITA A ESTRUTURA PRINCIPAL "questions" e "metadata"):
{
  "phases": ["Fase 1", "Fase 2"],
  "deliverables": ["Entregável 1", "Entregável 2"]
}

Gere as questões agora:
`;