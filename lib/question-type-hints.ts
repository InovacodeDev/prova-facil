/**
 * Question Type Strategic Hints
 * Tabela de dicas estratégicas para cada tipo de questão
 * Baseada em boas práticas pedagógicas e orientações de especialistas
 */

export interface QuestionTypeHint {
  type: string;
  bestDisciplines: string;
  educationLevel: string;
  strategicTip: string;
}

export const QUESTION_TYPE_HINTS: Record<string, QuestionTypeHint> = {
  multiple_choice: {
    type: 'multiple_choice',
    bestDisciplines: 'Todas. É o formato mais versátil.',
    educationLevel: 'Todos os níveis (do Fundamental ao Superior).',
    strategicTip:
      'O segredo está nos distratores (as alternativas erradas). Eles devem ser plausíveis e baseados em erros comuns para testar um conhecimento mais profundo.',
  },

  true_false: {
    type: 'true_false',
    bestDisciplines: 'História, Biologia, Geografia, Direito (com base em fatos).',
    educationLevel: 'Ensino Fundamental e Médio.',
    strategicTip:
      'Excelente para verificar a compreensão de um grande volume de conceitos de forma rápida. Evite "pegadinhas" com palavras como "sempre" ou "nunca".',
  },

  matching_columns: {
    type: 'matching_columns',
    bestDisciplines: 'História (datas/eventos), Literatura (autores/obras), Biologia (órgãos/funções).',
    educationLevel: 'Ensino Fundamental II e Médio.',
    strategicTip:
      'Perfeita para avaliar a capacidade de relacionar conceitos. Aumente o desafio colocando um ou dois itens a mais na segunda coluna.',
  },

  fill_in_the_blank: {
    type: 'fill_in_the_blank',
    bestDisciplines: 'Línguas (gramática), História (datas, nomes), Ciências (termos técnicos).',
    educationLevel: 'Ensino Fundamental.',
    strategicTip:
      'Imbatível para avaliar a memorização de vocabulário-chave e fatos específicos. Use um "banco de palavras" para guiar os alunos mais novos.',
  },

  sum: {
    type: 'sum',
    bestDisciplines: 'Todas, especialmente em contextos de alta exigência.',
    educationLevel: 'Ensino Médio (avançado) e Vestibulares.',
    strategicTip:
      'Exige conhecimento profundo, pois um único erro em uma afirmativa compromete toda a soma. Use para diferenciar alunos com domínio completo do conteúdo.',
  },

  open: {
    type: 'open',
    bestDisciplines: 'Sociologia, Filosofia, História, Geografia, Literatura.',
    educationLevel: 'Ensino Médio e Superior.',
    strategicTip:
      'Ideal para avaliar a capacidade de análise, síntese e argumentação. Dividir o comando em itens (a, b) torna a correção mais objetiva.',
  },

  essay: {
    type: 'essay',
    bestDisciplines: 'Língua Portuguesa e temas transversais (Atualidades).',
    educationLevel: 'Ensino Médio e Vestibulares.',
    strategicTip:
      'A chave é a coletânea de textos motivadores. Ela deve apresentar diferentes gêneros e perspectivas para estimular uma reflexão crítica e autoral.',
  },

  problem_solving: {
    type: 'problem_solving',
    bestDisciplines: 'Matemática, Física, Química, Administração, Lógica.',
    educationLevel: 'Todos os níveis (ajustando a complexidade).',
    strategicTip:
      'O foco é o processo, não apenas a resposta final. Use cenários do mundo real para avaliar a aplicação prática do conhecimento teórico.',
  },

  project_based: {
    type: 'project_based',
    bestDisciplines: 'Ideal para projetos multidisciplinares.',
    educationLevel: 'Ensino Fundamental II, Médio e Superior.',
    strategicTip:
      'A pergunta norteadora é a alma do projeto. Ela precisa ser aberta, complexa e autêntica, conectando o aprendizado com a vida do aluno.',
  },

  gamified: {
    type: 'gamified',
    bestDisciplines: 'Todas, especialmente para conteúdos que exigem memorização ou revisão.',
    educationLevel: 'Ensino Fundamental e Médio.',
    strategicTip:
      'Use uma narrativa (cenário) para dar contexto e transformar a avaliação em um desafio divertido. O objetivo é aumentar a motivação e diminuir a ansiedade.',
  },
};

/**
 * Retorna as dicas para um tipo de questão específico
 */
export function getQuestionTypeHint(type: string): QuestionTypeHint | undefined {
  return QUESTION_TYPE_HINTS[type];
}

/**
 * Retorna todas as dicas em formato de array
 */
export function getAllQuestionTypeHints(): QuestionTypeHint[] {
  return Object.values(QUESTION_TYPE_HINTS);
}

/**
 * Formata as dicas para inclusão nos prompts da IA
 */
export function formatHintForPrompt(type: string): string {
  const hint = getQuestionTypeHint(type);
  if (!hint) return '';

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 DICAS ESTRATÉGICAS PARA ESTE TIPO DE QUESTÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Melhores Disciplinas: ${hint.bestDisciplines}
🎓 Nível Indicado: ${hint.educationLevel}
💡 Dica do Especialista: ${hint.strategicTip}
`;
}
