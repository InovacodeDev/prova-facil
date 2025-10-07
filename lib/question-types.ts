// Question Type Translations
// Central place for translating question type IDs to Portuguese labels

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Múltipla Escolha',
  true_false: 'Verdadeiro ou Falso',
  open: 'Aberta/Dissertativa',
  sum: 'Somatória',
  fill_in_the_blank: 'Preencher Lacunas',
  matching_columns: 'Associação de Colunas',
  problem_solving: 'Resolução de Problemas',
  essay: 'Redação',
  project_based: 'Baseada em Projeto',
  gamified: 'Gamificada',
};

export const QUESTION_TYPE_DESCRIPTIONS: Record<string, string> = {
  multiple_choice: '5 alternativas, 1 correta',
  true_false: 'Julgamento de afirmativas',
  open: 'Resposta livre e argumentada',
  sum: 'Soma de valores das corretas',
  fill_in_the_blank: 'Complete os espaços em branco',
  matching_columns: 'Relacione itens de duas colunas',
  problem_solving: 'Problemas práticos e aplicados',
  essay: 'Produção textual completa',
  project_based: 'Projetos com fases e entregas',
  gamified: 'Cenários e desafios interativos',
};

// Helper function to get translated label
export function getQuestionTypeLabel(typeId: string): string {
  return QUESTION_TYPE_LABELS[typeId] || typeId;
}

// Helper function to get description
export function getQuestionTypeDescription(typeId: string): string {
  return QUESTION_TYPE_DESCRIPTIONS[typeId] || '';
}

// All question types with labels and descriptions
// Recomendações de contexto por tipo de questão
export const QUESTION_TYPE_CONTEXT_RECOMMENDATIONS: Record<string, string[]> = {
  multiple_choice: ['fixacao', 'contextualizada', 'teorica', 'letra_lei'],
  true_false: ['fixacao', 'contextualizada', 'teorica', 'letra_lei'],
  open: ['teorica', 'discursiva_aberta', 'estudo_caso'],
  sum: ['fixacao', 'contextualizada', 'letra_lei'],
  fill_in_the_blank: ['fixacao', 'teorica'],
  matching_columns: ['fixacao', 'teorica', 'contextualizada'],
  problem_solving: ['contextualizada', 'estudo_caso', 'discursiva_aberta'],
  essay: ['discursiva_aberta', 'estudo_caso', 'pesquisa'],
  project_based: ['estudo_caso', 'discursiva_aberta', 'pesquisa'],
  gamified: ['contextualizada', 'estudo_caso'],
};

// Dicas de contexto por nível acadêmico
export const ACADEMIC_LEVEL_CONTEXT_SUGGESTIONS: Record<string, { primary: string[]; secondary: string[] }> = {
  'Ensino Fundamental I': {
    primary: ['fixacao', 'contextualizada'],
    secondary: ['teorica'],
  },
  'Ensino Fundamental II': {
    primary: ['fixacao', 'contextualizada', 'teorica'],
    secondary: ['estudo_caso'],
  },
  'Ensino Médio': {
    primary: ['contextualizada', 'teorica', 'fixacao'],
    secondary: ['estudo_caso', 'letra_lei'],
  },
  'Ensino Técnico': {
    primary: ['contextualizada', 'estudo_caso', 'fixacao'],
    secondary: ['teorica', 'discursiva_aberta'],
  },
  'Ensino Superior': {
    primary: ['contextualizada', 'teorica', 'estudo_caso'],
    secondary: ['discursiva_aberta', 'letra_lei', 'pesquisa'],
  },
  'Pós-Graduação': {
    primary: ['estudo_caso', 'discursiva_aberta', 'pesquisa'],
    secondary: ['contextualizada', 'teorica'],
  },
  'Concurso Público': {
    primary: ['letra_lei', 'contextualizada', 'teorica'],
    secondary: ['fixacao', 'estudo_caso'],
  },
};

// Helper para obter recomendações de contexto baseadas no tipo de questão
export function getContextRecommendationsForType(typeId: string): string[] {
  return QUESTION_TYPE_CONTEXT_RECOMMENDATIONS[typeId] || [];
}

// Helper para obter sugestões de contexto baseadas no nível acadêmico
export function getContextSuggestionsForAcademicLevel(academicLevel: string): {
  primary: string[];
  secondary: string[];
} {
  return ACADEMIC_LEVEL_CONTEXT_SUGGESTIONS[academicLevel] || { primary: [], secondary: [] };
}

export const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Múltipla Escolha', description: '5 alternativas, 1 correta' },
  { id: 'true_false', label: 'Verdadeiro ou Falso', description: 'Julgamento de afirmativas' },
  { id: 'open', label: 'Aberta/Dissertativa', description: 'Resposta livre e argumentada' },
  { id: 'sum', label: 'Somatória', description: 'Soma de valores das corretas' },
  // { id: 'fill_in_the_blank', label: 'Preencher Lacunas', description: 'Complete os espaços em branco' },
  { id: 'matching_columns', label: 'Associação de Colunas', description: 'Relacione itens de duas colunas' },
  { id: 'essay', label: 'Redação', description: 'Produção textual completa' },
  // { id: 'problem_solving', label: 'Resolução de Problemas', description: 'Problemas práticos e aplicados' },
  // { id: 'project_based', label: 'Baseada em Projeto', description: 'Projetos com fases e entregas' },
  // { id: 'gamified', label: 'Gamificada', description: 'Cenários e desafios interativos' },
];
