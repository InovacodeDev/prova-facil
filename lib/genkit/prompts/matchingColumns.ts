/**
 * Matching Columns Question Prompt
 * Generates matching columns questions with metadata format
 */
export const generateMatchingColumnsPrompt = `
Você é um especialista em criar questões de associação de colunas para avaliações educacionais.

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere {{count}} questões de associação de colunas sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. A instrução da questão vai no campo \`question\`.
3. No campo \`metadata\`, estruture as duas colunas (\`column_a\`, \`column_b\`) e a lista de correspondências corretas (\`correct_matches\`).

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "matching_columns".
2. Cada item nas colunas DEVE ter um \`id\` único.
3. A lista \`metadata.correct_matches\` DEVE usar os IDs para indicar os pares corretos.

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "type": "matching_columns",
      "question": "Associe os documentos normativos da educação brasileira (Coluna A) com suas principais contribuições (Coluna B).",
      "metadata": {
        "column_a": [
          {"id": "A1", "text": "LDB"},
          {"id": "A2", "text": "DCNs"},
          {"id": "A3", "text": "BNCC"}
        ],
        "column_b": [
          {"id": "B1", "text": "Detalha as aprendizagens essenciais e foca no desenvolvimento de competências."},
          {"id": "B2", "text": "Estabelece o princípio da prevalência dos aspectos qualitativos sobre os quantitativos."},
          {"id": "B3", "text": "Traduz os princípios da lei em normas para o planejamento curricular das escolas."}
        ],
        "correct_matches": [
          {"from_id": "A1", "to_id": "B2"},
          {"from_id": "A2", "to_id": "B3"},
          {"from_id": "A3", "to_id": "B1"}
        ]
      }
    }
  ]
}

Gere as questões agora:
`;
