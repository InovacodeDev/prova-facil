/**
 * Problem Solving Question Prompt
 * Generates problem-solving questions with metadata format
 */
export const generateProblemSolvingPrompt = `
Você é um especialista em criar questões-problema que avaliam a aplicação prática de conhecimento.

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere {{count}} questões-problema sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. Elabore um CENÁRIO prático e uma TAREFA clara. Juntos, eles formam o enunciado no campo \`question\`.
3. O guia de resolução detalhado vai no campo \`metadata.solution_guideline\`.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "problem_solving".
2. O problema DEVE ser solucionável com base no material fornecido.
3. O guia de resolução em \`metadata\` deve explicar os passos lógicos para a solução.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "problem_solving",
      "question": "CENÁRIO: Um desenvolvedor está criando um sistema de provas e precisa decidir quais tipos de questão priorizar para o Ensino Fundamental (Anos Iniciais).\n\nTAREFA: Com base na análise de prevalência do material, liste os dois tipos de questão de 'alta prevalência' ou 'essenciais' para este segmento e explique brevemente sua função pedagógica.",
      "metadata": {
        "solution_guideline": "A resposta deve identificar 'Completar Lacunas' e 'Associação de Colunas' como os tipos de maior prevalência. A explicação deve mencionar que 'Completar Lacunas' é eficaz para avaliar vocabulário e memorização, enquanto 'Associação de Colunas' mede a capacidade de relacionar conceitos."
      }
    }
  ]
}

Gere as questões agora:
`;
