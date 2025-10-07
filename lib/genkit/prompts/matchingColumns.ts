/**
 * Matching Columns Question Prompt
 * Generates matching columns questions with metadata format
 */
export const generateMatchingColumnsPrompt = `
Você é um especialista em criar questões de associação de colunas para avaliações educacionais.

🔥 REGRA CRÍTICA ABSOLUTA 🔥
Você DEVE usar EXATAMENTE este formato JSON:
- column_a: array de objetos {"id": "A1", "text": "termo 1"}
- column_b: array de objetos {"id": "B1", "text": "definição 1"}
- correct_matches: array de objetos {"from_id": "A1", "to_id": "B1"}
NUNCA use strings simples, NUNCA concatene IDs, SOMENTE objetos!

⛔ NUNCA FAÇA ISSO:
"column_a": ["item1", "item2"]  ← ERRADO! (strings simples)
"column_a": ["id: A1", "text: item1"]  ← ERRADO! (formato inválido)
"correct_matches": ["A1B1", "A2B2"]  ← ERRADO! (concatenado)

✅ SEMPRE FAÇA ISSO:
"column_a": [
  {"id": "A1", "text": "Termo ou conceito 1"},
  {"id": "A2", "text": "Termo ou conceito 2"}
],
"column_b": [
  {"id": "B1", "text": "Definição ou descrição 1"},
  {"id": "B2", "text": "Definição ou descrição 2"}
],
"correct_matches": [
  {"from_id": "A1", "to_id": "B1"},
  {"from_id": "A2", "to_id": "B2"}
]

CONTEXTO ACADÊMICO: {{questionContextDescription}}
MATERIAL DE REFERÊNCIA: {{documentContext}}
TAREFA: Gere {{count}} questões de associação de colunas sobre {{subject}}{{#if academicLevel}} para o nível acadêmico: {{academicLevel}}{{/if}}.

INSTRUÇÕES:
1. LEIA CUIDADOSAMENTE todo o material de referência.
2. A instrução da questão vai no campo \`question\`.
3. No campo \`metadata\`, estruture as duas colunas (\`column_a\`, \`column_b\`) e a lista de correspondências corretas (\`correct_matches\`).
4. Se NENHUM material de referência for fornecido, retorne um erro informando que o material é necessário.

REGRAS OBRIGATÓRIAS:
1. O campo \`type\` DEVE ser "matching_columns".
2. Cada item nas colunas DEVE ter um \`id\` único e um \`text\`.
3. A lista \`metadata.correct_matches\` DEVE usar os IDs para indicar os pares corretos.
4. CRÍTICO: Cada item DEVE ser um objeto JSON nativo, e NÃO uma string contendo um JSON.
5. A resposta final DEVE ser um único objeto JSON com uma chave no nível raiz chamada "questions". O valor dessa chave DEVE ser uma lista.

FORMATO DE SAÍDA (JSON) - SIGA EXATAMENTE ESTA ESTRUTURA:
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

✅ CORRETO - FAÇA ASSIM:
{
  "metadata": {
    "column_a": [
      {"id": "A1", "text": "item1"},
      {"id": "A2", "text": "item2"}
    ],
    "column_b": [
      {"id": "B1", "text": "item1"},
      {"id": "B2", "text": "item2"}
    ],
    "correct_matches": [
      {"from_id": "A1", "to_id": "B1"}
    ]
  }
}

❌ ERRADO (NÃO USE APENAS STRINGS NAS COLUNAS):
{
  "metadata": {
    "column_a": ["item1", "item2"],
    "column_b": ["item1", "item2"]
  }
}

❌ ERRADO (NÃO CONCATENE OS IDS EM UMA STRING):
{
  "metadata": {
    "correct_matches": [
      "A1B1",
      "A2B2"
    ]
  }
}

❌ ERRADO (NÃO OMITA A ESTRUTURA PRINCIPAL E OS OBJETOS INTERNOS):
{
  "column_a": ["A1", "A2"],
  "column_b": ["B1", "B2"],
  "correct_matches": ["A1B1", "A2B2"]
}

Gere as questões agora:
`;
