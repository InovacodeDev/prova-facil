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

      default:
        console.warn(`[Normalizer] Unknown type: ${type}, returning metadata as-is`);
        return metadata;
    }
  } catch (error) {
    console.error(`[Normalizer] Error normalizing ${type}:`, error);
    return metadata; // Retorna original em caso de erro
  }
}
