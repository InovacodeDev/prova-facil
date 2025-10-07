/**
 * Metadata Normalizer
 * Força metadatas malformados a ficarem no formato correto
 * Esta é uma camada de defesa crítica contra respostas mal estruturadas da IA
 */

type MetadataInput = any;

/**
 * Converte string de boolean para boolean real
 */
function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Garante que o input é um array, não um objeto único
 */
function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  // Se é um objeto único, transforma em array de 1 elemento
  if (typeof value === 'object') return [value];
  // Se é string, tenta parsear JSON escapado
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return ensureArray(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Remove JSON escapado de dentro de strings
 * Ex: "{\"answer\": \"text\"}" vira {"answer": "text"}
 */
function unescapeJSON(value: any): any {
  if (typeof value === 'string') {
    // Tenta detectar JSON escapado
    if (value.startsWith('{') && value.includes('\\"')) {
      try {
        // Remove escapes e parseia
        const unescaped = value.replace(/\\"/g, '"');
        return JSON.parse(unescaped);
      } catch {
        return value;
      }
    }
  }
  return value;
}

/**
 * NORMALIZA MÚLTIPLA ESCOLHA
 */
export function normalizeMultipleChoiceMetadata(metadata: MetadataInput): {
  answers: Array<{ answer: string; is_correct: boolean }>;
} {
  const answers = ensureArray(metadata?.answers);

  const normalizedAnswers = answers
    .map((item) => {
      // Remove JSON escapado
      const unescaped = unescapeJSON(item);

      // Se é string simples, não é válido - skip
      if (typeof unescaped === 'string') {
        console.warn('[Normalizer] Skipping string answer:', unescaped);
        return null;
      }

      // Se é objeto, normaliza
      if (typeof unescaped === 'object' && unescaped !== null) {
        return {
          answer: String(unescaped.answer || ''),
          is_correct: toBoolean(unescaped.is_correct),
        };
      }

      return null;
    })
    .filter((item): item is { answer: string; is_correct: boolean } => item !== null);

  // Garante pelo menos 1 alternativa
  if (normalizedAnswers.length === 0) {
    console.error('[Normalizer] No valid answers found, creating fallback');
    return {
      answers: [{ answer: 'Resposta não disponível', is_correct: true }],
    };
  }

  // Garante que pelo menos 1 está correta
  const hasCorrect = normalizedAnswers.some((a) => a.is_correct);
  if (!hasCorrect && normalizedAnswers.length > 0) {
    normalizedAnswers[0].is_correct = true;
  }

  return { answers: normalizedAnswers };
}

/**
 * NORMALIZA VERDADEIRO/FALSO
 */
export function normalizeTrueFalseMetadata(metadata: MetadataInput): {
  statements: Array<{ statement: string; is_correct: boolean }>;
} {
  const statements = ensureArray(metadata?.statements);

  const normalizedStatements = statements
    .map((item) => {
      const unescaped = unescapeJSON(item);

      // Se é string simples OU se o campo "statement" tem valor literal "statements", skip
      if (typeof unescaped === 'string') {
        console.warn('[Normalizer] Skipping string statement:', unescaped);
        return null;
      }

      if (typeof unescaped === 'object' && unescaped !== null) {
        const statementText = String(unescaped.statement || '');

        // Detecta conteúdo literal inválido
        if (statementText === 'statements' || statementText === 'statement') {
          console.warn('[Normalizer] Skipping literal statement value:', statementText);
          return null;
        }

        return {
          statement: statementText,
          is_correct: toBoolean(unescaped.is_correct),
        };
      }

      return null;
    })
    .filter((item): item is { statement: string; is_correct: boolean } => item !== null);

  // Fallback se não houver statements válidos
  if (normalizedStatements.length === 0) {
    console.error('[Normalizer] No valid statements found, creating fallback');
    return {
      statements: [{ statement: 'Afirmação não disponível', is_correct: false }],
    };
  }

  return { statements: normalizedStatements };
}

/**
 * NORMALIZA COMPLETAR LACUNAS
 */
export function normalizeFillInTheBlankMetadata(metadata: MetadataInput): {
  blanks: Array<{ id: string; correct_answer: string }>;
  options_bank?: string[];
} {
  const blanks = ensureArray(metadata?.blanks);

  const normalizedBlanks = blanks
    .map((item) => {
      const unescaped = unescapeJSON(item);

      // Se é string simples, tenta detectar formato "id:BLANK_X"
      if (typeof unescaped === 'string') {
        console.warn('[Normalizer] Skipping string blank:', unescaped);
        return null;
      }

      if (typeof unescaped === 'object' && unescaped !== null) {
        const id = String(unescaped.id || '');
        const correctAnswer = String(unescaped.correct_answer || unescaped.correctAnswer || '');

        // Valida que tem ID e resposta
        if (!id || !correctAnswer) {
          console.warn('[Normalizer] Blank missing id or answer:', unescaped);
          return null;
        }

        return {
          id,
          correct_answer: correctAnswer,
        };
      }

      return null;
    })
    .filter((item): item is { id: string; correct_answer: string } => item !== null);

  // Fallback
  if (normalizedBlanks.length === 0) {
    console.error('[Normalizer] No valid blanks found, creating fallback');
    return {
      blanks: [{ id: 'BLANK_1', correct_answer: 'resposta não disponível' }],
    };
  }

  // Normaliza options_bank se existir
  const optionsBank = Array.isArray(metadata?.options_bank)
    ? metadata.options_bank.filter((opt: any) => typeof opt === 'string')
    : undefined;

  return {
    blanks: normalizedBlanks,
    ...(optionsBank && optionsBank.length > 0 ? { options_bank: optionsBank } : {}),
  };
}

/**
 * NORMALIZA SOMATÓRIA
 */
export function normalizeSumMetadata(metadata: MetadataInput): {
  statements: Array<{ statement: string; number: number; is_correct: boolean }>;
} {
  const statements = ensureArray(metadata?.statements);

  const normalizedStatements = statements
    .map((item) => {
      const unescaped = unescapeJSON(item);

      if (typeof unescaped === 'string') {
        console.warn('[Normalizer] Skipping string statement:', unescaped);
        return null;
      }

      if (typeof unescaped === 'object' && unescaped !== null) {
        const statementText = String(unescaped.statement || '');
        const number = Number(unescaped.number || 0);

        // Detecta conteúdo literal inválido
        if (statementText === 'statements' || statementText === 'statement') {
          console.warn('[Normalizer] Skipping literal statement value:', statementText);
          return null;
        }

        // Valida que o número é potência de 2
        if (![1, 2, 4, 8, 16, 32, 64].includes(number)) {
          console.warn('[Normalizer] Invalid power of 2:', number);
          return null;
        }

        return {
          statement: statementText,
          number,
          is_correct: toBoolean(unescaped.is_correct),
        };
      }

      return null;
    })
    .filter((item): item is { statement: string; number: number; is_correct: boolean } => item !== null);

  // Fallback
  if (normalizedStatements.length === 0) {
    console.error('[Normalizer] No valid statements found for sum, creating fallback');
    return {
      statements: [{ statement: 'Afirmação não disponível', number: 1, is_correct: false }],
    };
  }

  return { statements: normalizedStatements };
}

/**
 * NORMALIZA ASSOCIAÇÃO DE COLUNAS
 */
export function normalizeMatchingColumnsMetadata(metadata: MetadataInput): {
  column_a: Array<{ id: string; text: string }>;
  column_b: Array<{ id: string; text: string }>;
  correct_matches: Array<{ from_id: string; to_id: string }>;
} {
  const columnA = ensureArray(metadata?.column_a);
  const columnB = ensureArray(metadata?.column_b);
  const correctMatches = ensureArray(metadata?.correct_matches);

  const normalizeColumn = (items: any[]): Array<{ id: string; text: string }> => {
    return items
      .map((item) => {
        const unescaped = unescapeJSON(item);

        if (typeof unescaped === 'string') {
          console.warn('[Normalizer] Skipping string column item:', unescaped);
          return null;
        }

        if (typeof unescaped === 'object' && unescaped !== null) {
          const id = String(unescaped.id || '');
          const text = String(unescaped.text || '');

          if (!id || !text) return null;

          return { id, text };
        }

        return null;
      })
      .filter((item): item is { id: string; text: string } => item !== null);
  };

  const normalizedColumnA = normalizeColumn(columnA);
  const normalizedColumnB = normalizeColumn(columnB);

  const normalizedMatches = correctMatches
    .map((item) => {
      const unescaped = unescapeJSON(item);

      // Detecta IDs concatenados como "A1B1"
      if (typeof unescaped === 'string') {
        console.warn('[Normalizer] Skipping concatenated match:', unescaped);
        return null;
      }

      if (typeof unescaped === 'object' && unescaped !== null) {
        const fromId = String(unescaped.from_id || unescaped.fromId || '');
        const toId = String(unescaped.to_id || unescaped.toId || '');

        if (!fromId || !toId) return null;

        return { from_id: fromId, to_id: toId };
      }

      return null;
    })
    .filter((item): item is { from_id: string; to_id: string } => item !== null);

  // Fallback
  if (normalizedColumnA.length === 0 || normalizedColumnB.length === 0) {
    console.error('[Normalizer] No valid columns found, creating fallback');
    return {
      column_a: [{ id: 'A1', text: 'Item A1' }],
      column_b: [{ id: 'B1', text: 'Item B1' }],
      correct_matches: [{ from_id: 'A1', to_id: 'B1' }],
    };
  }

  if (normalizedMatches.length === 0) {
    // Cria pelo menos 1 match usando os primeiros itens
    console.error('[Normalizer] No valid matches found, creating fallback');
    return {
      column_a: normalizedColumnA,
      column_b: normalizedColumnB,
      correct_matches: [
        {
          from_id: normalizedColumnA[0].id,
          to_id: normalizedColumnB[0].id,
        },
      ],
    };
  }

  return {
    column_a: normalizedColumnA,
    column_b: normalizedColumnB,
    correct_matches: normalizedMatches,
  };
}

/**
 * NORMALIZA METADATA POR TIPO
 */
export function normalizeMetadata(type: string, metadata: MetadataInput): any {
  console.log(`[Normalizer] Normalizing ${type} metadata:`, JSON.stringify(metadata));

  try {
    switch (type) {
      case 'multiple_choice':
        return normalizeMultipleChoiceMetadata(metadata);

      case 'true_false':
        return normalizeTrueFalseMetadata(metadata);

      case 'fill_in_the_blank':
        return normalizeFillInTheBlankMetadata(metadata);

      case 'sum':
        return normalizeSumMetadata(metadata);

      case 'matching_columns':
        return normalizeMatchingColumnsMetadata(metadata);

      case 'gamified':
        return normalizeGamifiedMetadata(metadata);

      case 'essay':
        return normalizeEssayMetadata(metadata);

      case 'problem_solving':
        return normalizeProblemSolvingMetadata(metadata);

      case 'project_based':
        return normalizeProjectBasedMetadata(metadata);

      default:
        console.warn(`[Normalizer] Unknown type: ${type}, returning metadata as-is`);
        return metadata;
    }
  } catch (error) {
    console.error(`[Normalizer] Error normalizing ${type}:`, error);
    return metadata; // Retorna original em caso de erro
  }
}

/**
 * NORMALIZA GAMIFIED
 */
export function normalizeGamifiedMetadata(metadata: MetadataInput): {
  mission_briefing: string;
  challenges: string[];
  conclusion_message?: string;
} {
  // Suporta campo legado "scenario" → migra para mission_briefing
  const missionBriefing = String(metadata?.mission_briefing || metadata?.scenario || 'Missão gamificada');

  const challenges = ensureArray(metadata?.challenges);

  const normalizedChallenges = challenges
    .map((item) => {
      // Challenges devem ser strings simples
      if (typeof item === 'string') return item;

      // Se veio como objeto, tenta extrair propriedade "challenge" ou "text"
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, any>;
        return String(obj.challenge || obj.text || obj.question || '');
      }

      return null;
    })
    .filter((item): item is string => item !== null && item.length > 0);

  // Fallback se não houver challenges
  if (normalizedChallenges.length === 0) {
    console.error('[Normalizer] No valid challenges found, creating fallback');
    return {
      mission_briefing: missionBriefing,
      challenges: ['Desafio não disponível'],
    };
  }

  const conclusionMessage = metadata?.conclusion_message ? String(metadata.conclusion_message) : undefined;

  return {
    mission_briefing: missionBriefing,
    challenges: normalizedChallenges,
    ...(conclusionMessage ? { conclusion_message: conclusionMessage } : {}),
  };
}

/**
 * NORMALIZA ESSAY
 */
export function normalizeEssayMetadata(metadata: MetadataInput): {
  instructions: string[];
  supporting_texts: Array<{ source: string; content: string }>;
  essay_prompt: string;
} {
  // Normaliza instructions
  let instructions: string[] = [];

  if (Array.isArray(metadata?.instructions)) {
    instructions = metadata.instructions.map((item: any) => String(item)).filter((item: string) => item.length > 0);
  } else if (typeof metadata?.instructions === 'string') {
    // Se veio como string única, transforma em array
    instructions = [metadata.instructions];
  }

  // Fallback para instructions
  if (instructions.length === 0) {
    console.warn('[Normalizer] No valid instructions found, creating fallback');
    instructions = ['Escreva um texto dissertativo-argumentativo em norma padrão da língua portuguesa'];
  }

  // Normaliza supporting_texts
  const supportingTexts = ensureArray(metadata?.supporting_texts);

  const normalizedSupportingTexts = supportingTexts
    .map((item) => {
      const unescaped = unescapeJSON(item);

      if (typeof unescaped === 'string') {
        console.warn('[Normalizer] Skipping string supporting text:', unescaped);
        return null;
      }

      if (typeof unescaped === 'object' && unescaped !== null) {
        const source = String(unescaped.source || 'Texto de apoio');
        const content = String(unescaped.content || '');

        if (!content) return null;

        return { source, content };
      }

      return null;
    })
    .filter((item): item is { source: string; content: string } => item !== null);

  // Fallback para supporting_texts
  if (normalizedSupportingTexts.length === 0) {
    console.error('[Normalizer] No valid supporting texts found, creating fallback');
    normalizedSupportingTexts.push({
      source: 'Texto motivador',
      content: 'Utilize seus conhecimentos para desenvolver o tema proposto.',
    });
  }

  // Essay prompt
  const essayPrompt = String(metadata?.essay_prompt || metadata?.theme || 'Desenvolva o tema proposto');

  return {
    instructions,
    supporting_texts: normalizedSupportingTexts,
    essay_prompt: essayPrompt,
  };
}

/**
 * NORMALIZA PROBLEM SOLVING
 */
export function normalizeProblemSolvingMetadata(metadata: MetadataInput): {
  scenario: string;
  data?: Array<{ label: string; value: string }>;
  task: string;
  solution_guideline: string;
} {
  const scenario = String(metadata?.scenario || 'Cenário do problema');

  // Suporta campo legado "step_by_step_solution" → migra para solution_guideline
  const solutionGuideline = String(
    metadata?.solution_guideline || metadata?.step_by_step_solution || 'Solução não disponível'
  );

  const task = String(metadata?.task || metadata?.question || 'Resolva o problema apresentado');

  // Normaliza data array (opcional)
  const dataArray = ensureArray(metadata?.data);

  const normalizedData = dataArray
    .map((item) => {
      const unescaped = unescapeJSON(item);

      if (typeof unescaped === 'string') {
        console.warn('[Normalizer] Skipping string data item:', unescaped);
        return null;
      }

      if (typeof unescaped === 'object' && unescaped !== null) {
        const label = String(unescaped.label || unescaped.key || '');
        const value = String(unescaped.value || '');

        if (!label || !value) return null;

        return { label, value };
      }

      return null;
    })
    .filter((item): item is { label: string; value: string } => item !== null);

  return {
    scenario,
    ...(normalizedData.length > 0 ? { data: normalizedData } : {}),
    task,
    solution_guideline: solutionGuideline,
  };
}

/**
 * NORMALIZA PROJECT BASED
 */
export function normalizeProjectBasedMetadata(metadata: MetadataInput): {
  welcome_message?: string;
  guiding_question: string;
  phases: string[];
  deliverables: string[];
  evaluation_criteria?: string[];
} {
  const guidingQuestion = String(
    metadata?.guiding_question || metadata?.question || 'Como podemos resolver o desafio proposto?'
  );

  const welcomeMessage = metadata?.welcome_message ? String(metadata.welcome_message) : undefined;

  // Normaliza phases (suporta campo legado "project_tasks")
  const phasesArray = ensureArray(metadata?.phases || metadata?.project_tasks);

  const normalizedPhases = phasesArray
    .map((item: any) => {
      // Phases devem ser strings simples
      if (typeof item === 'string') return item;

      // Se veio como objeto, tenta extrair propriedade "phase" ou "task"
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, any>;
        return String(obj.phase || obj.task || obj.description || '');
      }

      return null;
    })
    .filter((item): item is string => item !== null && item.length > 0);

  // Fallback para phases
  if (normalizedPhases.length === 0) {
    console.error('[Normalizer] No valid phases found, creating fallback');
    normalizedPhases.push('Fase 1: Planejamento do projeto');
  }

  // Normaliza deliverables
  const deliverablesArray = ensureArray(metadata?.deliverables);

  const normalizedDeliverables = deliverablesArray
    .map((item: any) => {
      // Deliverables devem ser strings simples
      if (typeof item === 'string') return item;

      // Se veio como objeto, tenta extrair propriedade relevante
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, any>;
        return String(obj.deliverable || obj.item || obj.product || '');
      }

      return null;
    })
    .filter((item): item is string => item !== null && item.length > 0);

  // Fallback para deliverables
  if (normalizedDeliverables.length === 0) {
    console.error('[Normalizer] No valid deliverables found, creating fallback');
    normalizedDeliverables.push('Relatório final do projeto');
  }

  // Normaliza evaluation_criteria (opcional)
  const evaluationCriteriaArray = ensureArray(metadata?.evaluation_criteria);

  const normalizedCriteria = evaluationCriteriaArray
    .map((item: any) => {
      if (typeof item === 'string') return item;

      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, any>;
        return String(obj.criterion || obj.criteria || obj.description || '');
      }

      return null;
    })
    .filter((item): item is string => item !== null && item.length > 0);

  return {
    ...(welcomeMessage ? { welcome_message: welcomeMessage } : {}),
    guiding_question: guidingQuestion,
    phases: normalizedPhases,
    deliverables: normalizedDeliverables,
    ...(normalizedCriteria.length > 0 ? { evaluation_criteria: normalizedCriteria } : {}),
  };
}
