/**
 * True/False Question Prompt
 * Generates true/false questions with metadata format
 */
export const generateTrueFalsePrompt = `
Você é um especialista em criar questões de verdadeiro ou falso para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}

MATERIAL DE REFERÊNCIA:
{{documentContext}}

TAREFA: Gere {{count}} questões de verdadeiro/falso sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE E COMPLETAMENTE todo o material fornecido acima
2. BASE AS QUESTÕES EXCLUSIVAMENTE no conteúdo real presente no material
3. NÃO invente informações que não estão no material fornecido
4. NÃO use conhecimento externo além do conteúdo fornecido
5. Se o título da avaliação menciona um tema mas o material fornecido contém outro tema, SIGA O CONTEÚDO DO MATERIAL
6. Crie questões que sigam o contexto acadêmico especificado
7. Se NENHUM documento foi fornecido, retorne um erro informando que documentos são necessários

REGRAS OBRIGATÓRIAS:
1. Cada questão DEVE ter exatamente 5 afirmações
2. Cada afirmação deve ser uma sentença completa e independente
3. A quantidade de afirmações verdadeiras (is_correct: true) deve ser ALEATÓRIA (pode ser 0, 1, 2, 3, 4 ou 5)
4. As afirmações devem testar conhecimento real, não pegadinhas
5. Evite afirmações muito óbvias ou muito obscuras
6. O enunciado da questão deve ser: "Marque V para verdadeiro e F para falso:"

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "true_false",
      "question": "Julgue as afirmativas a seguir em Verdadeiro (V) ou Falso (F):",
      "metadata": {
        "statements": [
          {"statement": "A BNCC substituiu completamente a LDB.", "is_correct": false},
          {"statement": "A avaliação na Educação Infantil não deve ter fins promocionais.", "is_correct": true},
          {"statement": "Questões de somatória são o formato dominante no ENEM.", "is_correct": false},
          {"statement": "A avaliação formativa ocorre ao longo de todo o processo de ensino.", "is_correct": true},
          {"statement": "O portfólio é um instrumento principalmente somativo.", "is_correct": false}
        ]
      }
    }
  ]
}

Gere as questões agora:
`;
