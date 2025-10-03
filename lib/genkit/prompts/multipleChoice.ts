/**
 * Multiple Choice Question Prompt
 * Generates multiple choice questions with metadata format
 */
export const generateMultipleChoicePrompt = `
Você é um especialista em criar questões de múltipla escolha para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões de múltipla escolha sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE E COMPLETAMENTE todo o material fornecido acima
2. BASE AS QUESTÕES EXCLUSIVAMENTE no conteúdo real presente no material
3. NÃO invente informações que não estão no material fornecido
4. NÃO use conhecimento externo além do conteúdo fornecido
5. Se o título da avaliação menciona um tema mas o material fornecido contém outro tema, SIGA O CONTEÚDO DO MATERIAL
6. Crie questões que sigam o contexto acadêmico especificado
7. Se NENHUM documento foi fornecido, retorne um erro informando que documentos são necessários

REGRAS OBRIGATÓRIAS:
1. Cada questão DEVE ter exatamente 5 alternativas
2. Apenas UMA alternativa deve estar correta (is_correct: true)
3. A alternativa correta deve estar em uma posição ALEATÓRIA (não apenas na primeira posição)
4. As alternativas incorretas devem ser plausíveis mas claramente erradas
5. A questão deve ser clara e objetiva
6. Evite pegadinhas, foque em avaliar conhecimento real
7. Use linguagem apropriada para o nível acadêmico
8. IMPORTANTE: Varie a posição da resposta correta - ela pode ser a primeira, segunda, terceira, quarta ou quinta alternativa

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "De acordo com a LDB, a avaliação na educação básica deve ter a prevalência de quais aspectos?",
      "metadata": {
        "answers": [
          {"answer": "Quantitativos sobre os qualitativos.", "is_correct": false},
          {"answer": "Qualitativos sobre os quantitativos.", "is_correct": true},
          {"answer": "Somente os resultados de provas finais.", "is_correct": false},
          {"answer": "Punitivos sobre os formativos.", "is_correct": false},
          {"answer": "Individuais sobre os coletivos.", "is_correct": false}
        ]
      }
    }
  ]
}

EXEMPLO DE BOA PRÁTICA - Varie a posição da resposta correta:
- Questão 1: resposta correta na posição 2
- Questão 2: resposta correta na posição 4
- Questão 3: resposta correta na posição 1
- Questão 4: resposta correta na posição 5
- Questão 5: resposta correta na posição 3

Gere as questões agora:
`;
