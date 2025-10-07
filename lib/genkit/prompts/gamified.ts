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
3. O cenário do quiz (\`scenario\`) e a lista de desafios (\`challenges\`) vão dentro do campo \`metadata\`.
4. Se NENHUM material de referência for fornecido, retorne um erro informando que o material é necessário.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "gamified".
2. As perguntas devem ser concisas e diretas.
3. IMPORTANTE: \`scenario\` deve ser uma string simples e \`challenges\` deve ser um array de strings simples (não objetos).
4. A resposta final DEVE ser um único objeto JSON com uma chave no nível raiz chamada "questions". O valor dessa chave DEVE ser uma lista.

FORMATO DE SAÍDA (JSON):
// ... (o formato de saída continua o mesmo)

✅ CORRETO - scenario é string, challenges é array de strings:
{
  "metadata": {
    "scenario": "Descrição do cenário",
    "challenges": ["Desafio 1", "Desafio 2", "Desafio 3"]
  }
}

❌ ERRADO (NÃO OMITA A ESTRUTURA PRINCIPAL "questions" e "metadata"):
{
  "scenario": "Descrição do cenário",
  "challenges": ["Desafio 1", "Desafio 2", "Desafio 3"]
}

Gere as questões agora:
`;
