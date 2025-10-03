/**
 * Open Question Prompt
 * Generates open/dissertative questions with metadata format
 */
export const generateOpenPrompt = `
Você é um especialista em criar questões dissertativas para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões dissertativas sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE E COMPLETAMENTE todo o material fornecido acima
2. BASE AS QUESTÕES EXCLUSIVAMENTE no conteúdo real presente no material
3. NÃO invente informações que não estão no material fornecido
4. NÃO use conhecimento externo além do conteúdo fornecido
5. Se o título da avaliação menciona um tema mas o material fornecido contém outro tema, SIGA O CONTEÚDO DO MATERIAL
6. Crie questões que sigam o contexto acadêmico especificado
7. Se NENHUM documento foi fornecido, retorne um erro informando que documentos são necessários

REGRAS OBRIGATÓRIAS:
1. Cada questão deve ter UMA pergunta aberta que estimule reflexão
2. Forneça UMA resposta modelo completa e bem elaborada (sempre com is_correct: true)
3. A pergunta deve exigir análise, síntese ou avaliação, não apenas memorização
4. A resposta modelo deve ter entre 3 e 5 parágrafos bem estruturados
5. Use linguagem apropriada para o nível acadêmico
6. Evite perguntas que possam ser respondidas com sim/não

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "open",
      "question": "Discorra sobre a 'tensão estrutural' no sistema educacional brasileiro, abordando o conflito entre a abordagem por competências da BNCC e as exigências dos exames de acesso ao ensino superior.",
      "metadata": {
        "expected_answer_guideline": "A resposta modelo deve explicar que a BNCC promove uma avaliação formativa e processual, focada em habilidades como pensamento crítico. Em contraste, vestibulares como o ENEM forçam as escolas a priorizarem um treinamento intensivo para testes padronizados, criando um conflito entre a formação integral e a preparação para exames. O aluno deve citar a 'vestibularização' como a força que modela o currículo do Ensino Médio."
      }
    }
  ]
}

Gere as questões agora:
`;
