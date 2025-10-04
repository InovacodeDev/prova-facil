/**
 * Sum Question Prompt (Brazilian style - powers of 2)
 * Generates sum questions with metadata format
 */
export const generateSumPrompt = `
Você é um especialista em criar questões de somatória para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões de somatória sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE E COMPLETAMENTE todo o material fornecido acima
2. BASE AS QUESTÕES EXCLUSIVAMENTE no conteúdo real presente no material
3. NÃO invente informações que não estão no material fornecido
4. NÃO use conhecimento externo além do conteúdo fornecido
5. Se o título da avaliação menciona um tema mas o material fornecido contém outro tema, SIGA O CONTEÚDO DO MATERIAL
6. Crie questões que sigam o contexto acadêmico especificado
7. Se NENHUM documento foi fornecido, retorne um erro informando que documentos são necessários

REGRAS OBRIGATÓRIAS PARA QUESTÕES DE SOMATÓRIA:
1. Cada questão deve ter entre 1 e 7 afirmações
2. Os números das alternativas DEVEM SER em ordem: 1, 2, 4, 8, 16, 32, 64 (potências de 2)
3. NUNCA repita números, NUNCA pule números na sequência
4. A soma das alternativas corretas NÃO PODE ultrapassar 99
5. Cada afirmação deve ser independente e clara
6. O enunciado deve pedir para "Assinale as alternativas corretas" ou similar
7. Use o campo "number" com os valores exatos: 1, 2, 4, 8, 16, 32 ou 64

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "sum",
      "question": "Sobre os instrumentos e funções da avaliação na Educação Básica, assinale o que for correto:",
      "metadata": {
        "statements": [
          {"statement": "A avaliação diagnóstica é aplicada ao final do ciclo letivo para classificar os alunos.", "number": 1, "is_correct": false},
          {"statement": "O parecer descritivo é um instrumento qualitativo chave na Educação Infantil.", "number": 2, "is_correct": true},
          {"statement": "O ENEM utiliza predominantemente questões de somatória em sua primeira fase.", "number": 4, "is_correct": false},
          {"statement": "Rubricas são ferramentas que aumentam a transparência dos critérios de avaliação.", "number": 8, "is_correct": true},
          {"statement": "A LDB determina a prevalência dos aspectos quantitativos sobre os qualitativos.", "number": 16, "is_correct": false}
        ]
      }
    }
  ]
}

IMPORTANTE: Verifique que a soma das alternativas corretas é <= 99!

Gere as questões agora:
`;
