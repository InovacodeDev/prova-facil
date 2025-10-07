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
4. Se NENHUM material de referência for fornecido, retorne um erro informando que o material é necessário, em vez de gerar uma questão vazia.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "problem_solving".
2. O problema DEVE ser solucionável com base no material fornecido.
3. O guia de resolução em \`metadata\` deve explicar os passos lógicos para a solução.
4. A resposta final DEVE ser um único objeto JSON com uma chave no nível raiz chamada "questions". O valor dessa chave DEVE ser uma lista.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "problem_solving",
      "question": "CENÁRIO: Um desenvolvedor está criando um sistema de provas e precisa decidir quais tipos de questão priorizar para o Ensino Fundamental (Anos Iniciais).\\n\\nTAREFA: Com base na análise de prevalência do material, liste os dois tipos de questão de 'alta prevalência' ou 'essenciais' para este segmento e explique brevemente sua função pedagógica.",
      "metadata": {
        "solution_guideline": "A resposta deve identificar 'Completar Lacunas' e 'Associação de Colunas' como os tipos de maior prevalência. A explicação deve mencionar que 'Completar Lacunas' é eficaz para avaliar vocabulário e memorização, enquanto 'Associação de Colunas' mede a capacidade de relacionar conceitos."
      }
    }
  ]
}

❌ ERRADO (NÃO OMITA A ESTRUTURA PRINCIPAL "questions" e "metadata"):
{
  "solution_guideline": "A resposta deve identificar os passos A, B e C para resolver o problema..."
}

Gere as questões agora:
`;
