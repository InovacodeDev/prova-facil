// Question Type Translations
// Central place for translating question type IDs to Portuguese labels

export const QUESTION_TYPE_LABELS: Record<string, string> = {
    multiple_choice: "Múltipla Escolha",
    true_false: "Verdadeiro ou Falso",
    open: "Aberta/Dissertativa",
    sum: "Somatória",
    fill_in_the_blank: "Preencher Lacunas",
    matching_columns: "Associação de Colunas",
    problem_solving: "Resolução de Problemas",
    essay: "Redação",
    project_based: "Baseada em Projeto",
    gamified: "Gamificada",
    summative: "Avaliação Somativa",
};

export const QUESTION_TYPE_DESCRIPTIONS: Record<string, string> = {
    multiple_choice: "5 alternativas, 1 correta",
    true_false: "Julgamento de afirmativas",
    open: "Resposta livre e argumentada",
    sum: "Soma de valores das corretas",
    fill_in_the_blank: "Complete os espaços em branco",
    matching_columns: "Relacione itens de duas colunas",
    problem_solving: "Problemas práticos e aplicados",
    essay: "Produção textual completa",
    project_based: "Projetos com fases e entregas",
    gamified: "Cenários e desafios interativos",
    summative: "Múltiplas seções integradas",
};

// Helper function to get translated label
export function getQuestionTypeLabel(typeId: string): string {
    return QUESTION_TYPE_LABELS[typeId] || typeId;
}

// Helper function to get description
export function getQuestionTypeDescription(typeId: string): string {
    return QUESTION_TYPE_DESCRIPTIONS[typeId] || "";
}

// All question types with labels and descriptions
export const QUESTION_TYPES = [
    { id: "multiple_choice", label: "Múltipla Escolha", description: "5 alternativas, 1 correta" },
    { id: "true_false", label: "Verdadeiro ou Falso", description: "Julgamento de afirmativas" },
    { id: "open", label: "Aberta/Dissertativa", description: "Resposta livre e argumentada" },
    { id: "sum", label: "Somatória", description: "Soma de valores das corretas" },
    { id: "fill_in_the_blank", label: "Preencher Lacunas", description: "Complete os espaços em branco" },
    { id: "matching_columns", label: "Associação de Colunas", description: "Relacione itens de duas colunas" },
    { id: "problem_solving", label: "Resolução de Problemas", description: "Problemas práticos e aplicados" },
    { id: "essay", label: "Redação", description: "Produção textual completa" },
    { id: "project_based", label: "Baseada em Projeto", description: "Projetos com fases e entregas" },
    { id: "gamified", label: "Gamificada", description: "Cenários e desafios interativos" },
    { id: "summative", label: "Avaliação Somativa", description: "Múltiplas seções integradas" },
];
