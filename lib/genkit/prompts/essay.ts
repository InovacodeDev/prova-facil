/**
 * Essay Question Prompt
 * Generates essay/redação questions with metadata format
 */
export const generateEssayPrompt = `
Você é um especialista em elaborar propostas de redação para vestibulares e exames.

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere {{count}} propostas de redação sobre a problemática central de {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. A frase-tema da redação vai no campo \`question\`.
3. Os textos motivadores e as instruções para o aluno vão dentro do campo \`metadata\`.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "essay".
2. O tema deve ser uma questão complexa que permita argumentação.
3. Os textos em \`metadata.supporting_texts\` devem ser curtos e de gêneros variados.
4. CRÍTICO: Cada texto motivador DEVE ser um objeto JSON nativo {"source": "string", "content": "string"}, e NÃO uma string contendo um JSON.
5. A resposta final DEVE ser um único objeto JSON com uma chave no nível raiz chamada "questions". O valor dessa chave DEVE ser uma lista de propostas de redação.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "essay",
      "question": "O dilema da avaliação no Ensino Médio brasileiro...",
      "metadata": {
        "supporting_texts": [
          {"source": "LDB, Art. 24", "content": "..."},
          {"source": "Análise Pedagógica", "content": "..."}
        ],
        "instructions": "A partir da leitura dos textos motivadores..."
      }
    }
  ]
}

✅ CORRETO - FAÇA ASSIM:
{
  "metadata": {
    "supporting_texts": [
      {"source": "Fonte 1", "content": "Texto 1"},
      {"source": "Fonte 2", "content": "Texto 2"}
    ]
  }
}

❌ ERRADO (NÃO TRANSFORME OBJETOS EM STRINGS COM ESCAPE):
{
  "metadata": {
    "supporting_texts": [
      "{\\"source\\": \\"Fonte 1\\", \\"content\\": \\"Texto 1\\"}",
      "{\\"source\\": \\"Fonte 2\\", \\"content\\": \\"Texto 2\\"}"
    ]
  }
}

❌ ERRADO (NÃO USE STRINGS NO FORMATO "chave=valor"):
{
  "metadata": {
    "supporting_texts": [
      "source=Fonte 1",
      "content=Texto 1"
    ]
  }
}

Gere as questões agora:
`;
