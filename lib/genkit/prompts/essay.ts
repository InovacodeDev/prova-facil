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

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "essay",
      "question": "O dilema da avaliação no Ensino Médio brasileiro: entre a formação para a vida e o treinamento para o vestibular",
      "metadata": {
        "supporting_texts": [
          {"source": "LDB, Art. 24", "content": "A avaliação deve ser 'contínua e cumulativa do desempenho do aluno, com prevalência dos aspectos qualitativos sobre os quantitativos...'"},
          {"source": "Análise Pedagógica", "content": "A 'vestibularização' do Ensino Médio exerce uma pressão que, na prática, dita as regras do jogo pedagógico, forçando escolas a 'treinar' seus alunos para um tipo específico de prova."}
        ],
        "instructions": "A partir da leitura dos textos motivadores e com base nos conhecimentos construídos, redija um texto dissertativo-argumentativo em modalidade escrita formal sobre o tema, apresentando proposta de intervenção que respeite os direitos humanos."
      }
    }
  ]
}

Gere as questões agora:
`;
