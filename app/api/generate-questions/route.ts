import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateMcqQuestions,
  generateTfQuestions,
  generateDissertativeQuestions,
  generateSumQuestions,
  generateFillInTheBlankQuestions,
  generateMatchingColumnsQuestions,
  generateProblemSolvingQuestions,
  generateEssayQuestions,
  generateProjectBasedQuestions,
  generateGamifiedQuestions,
  generateSummativeQuestions,
  GenerateQuestionsInput,
  GenerateQuestionsOutput,
} from '@/lib/genkit/prompts';
import { QuestionType } from '@/db/schema';
import { checkUserQuota, updateProfileLogsCycle } from '@/lib/usage-tracking';
import type { QuestionMetadata } from '@/lib/question-metadata-types';
import { normalizeMetadata } from '@/lib/metadata-normalizer';

/**
 * Tipo para a estrutura de questão dentro do objeto retornado pela IA
 * Baseado em QuestionsResponseSchema (campos são opcionais devido ao Zod)
 */
interface QuestionFromAI {
  type?: string;
  question?: string;
  metadata?: QuestionMetadata;
  created_at?: string;
}

/**
 * Tipo para o item do array questions
 */
interface QuestionWrapper {
  question?: QuestionFromAI;
}

/**
 * Tipo para os dados de inserção no banco (campos obrigatórios)
 */
interface QuestionInsertData {
  assessment_id: string;
  type: string;
  question: string;
  metadata: QuestionMetadata;
}

/**
 * Converte strings no formato "key: value" ou "key:value" em objetos
 * Exemplo: ["id: A1", "text: Função"] => {id: "A1", text: "Função"}
 */
function parseKeyValueStrings(array: any[]): any {
  if (!Array.isArray(array) || array.length === 0) return array;

  // Verifica se todos os elementos são strings no formato "key: value" ou "key:value"
  const allAreKeyValueStrings = array.every(
    (item) => typeof item === 'string' && (item.includes(': ') || item.includes(':'))
  );

  if (!allAreKeyValueStrings) return array;

  // Tenta construir um objeto a partir das strings
  const obj: any = {};
  let hasValidPairs = false;

  for (const item of array) {
    // Suporta tanto "key: value" quanto "key:value"
    const separatorIndex = item.includes(': ') ? item.indexOf(': ') : item.indexOf(':');
    if (separatorIndex > 0) {
      const key = item.substring(0, separatorIndex).trim();
      const value = item.substring(separatorIndex + (item.includes(': ') ? 2 : 1)).trim();
      obj[key] = value;
      hasValidPairs = true;
    }
  }

  return hasValidPairs ? obj : array;
}

/**
 * Sanitiza e valida metadata de acordo com o tipo de questão
 */
function sanitizeMetadataByType(metadata: any, questionType: string): any {
  if (!metadata || typeof metadata !== 'object') return metadata;

  const sanitized = { ...metadata };

  switch (questionType) {
    case 'multiple_choice':
      // Garante que answers seja array de objetos {answer, is_correct}
      if (Array.isArray(sanitized.answers)) {
        sanitized.answers = sanitized.answers
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any) => {
            if (typeof item === 'object' && item !== null && 'answer' in item && 'is_correct' in item) {
              return item;
            }
            if (typeof item === 'string') {
              return { answer: item, is_correct: false };
            }
            return { answer: String(item), is_correct: false };
          });

        // Se nenhum item tem is_correct true, marca o primeiro como correto
        if (!sanitized.answers.some((a: any) => a.is_correct === true)) {
          console.warn('⚠️ Multiple choice sem resposta correta! Marcando a primeira como correta.');
          if (sanitized.answers.length > 0) {
            sanitized.answers[0].is_correct = true;
          }
        }
      }
      break;

    case 'true_false':
    case 'sum':
      // Garante que statements seja array de objetos
      if (Array.isArray(sanitized.statements)) {
        sanitized.statements = sanitized.statements
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any) => {
            if (typeof item === 'object' && item !== null && 'statement' in item && 'is_correct' in item) {
              // Para sum, garante que number existe
              if (questionType === 'sum' && !('number' in item)) {
                return { ...item, number: 1 };
              }
              return item;
            }
            // Se é string, cria objeto
            const obj: any = { statement: String(item), is_correct: false };
            if (questionType === 'sum') {
              obj.number = 1;
            }
            return obj;
          });
      }
      break;

    case 'matching_columns':
      // Garante que column_a e column_b sejam arrays de objetos {id, text}
      ['column_a', 'column_b'].forEach((colName) => {
        if (Array.isArray(sanitized[colName])) {
          sanitized[colName] = sanitized[colName]
            .filter((item: any) => item !== null && item !== undefined)
            .map((item: any, index: number) => {
              if (typeof item === 'object' && item !== null && 'id' in item && 'text' in item) {
                return item;
              }
              // Tenta converter se veio errado
              const parsed = parseKeyValueStrings([item]);
              if (typeof parsed === 'object' && parsed !== null && 'id' in parsed && 'text' in parsed) {
                return parsed;
              }
              // Fallback: cria estrutura mínima
              const prefix = colName === 'column_a' ? 'A' : 'B';
              return { id: `${prefix}${index + 1}`, text: String(item) };
            });
        }
      });

      // Garante que correct_matches seja array de objetos {from_id, to_id}
      if (Array.isArray(sanitized.correct_matches)) {
        sanitized.correct_matches = sanitized.correct_matches
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any, index: number) => {
            if (typeof item === 'object' && item !== null && 'from_id' in item && 'to_id' in item) {
              return item;
            }
            const parsed = parseKeyValueStrings([item]);
            if (typeof parsed === 'object' && parsed !== null && 'from_id' in parsed && 'to_id' in parsed) {
              return parsed;
            }
            // Fallback: cria match baseado no índice
            return { from_id: `A${index + 1}`, to_id: `B${index + 1}` };
          });
      }
      break;

    case 'fill_in_the_blank':
      // Garante que blanks seja array de objetos {id, correct_answer}
      if (Array.isArray(sanitized.blanks)) {
        sanitized.blanks = sanitized.blanks
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any, index: number) => {
            if (typeof item === 'object' && item !== null && 'id' in item && 'correct_answer' in item) {
              return item;
            }
            // Se veio como strings "id:valor" e "correct_answer:valor"
            if (typeof item === 'string') {
              const parsed = parseKeyValueStrings([item]);
              if (typeof parsed === 'object' && parsed !== null) {
                return { id: parsed.id || `BLANK_${index + 1}`, correct_answer: parsed.correct_answer || '' };
              }
              // Fallback
              return { id: `BLANK_${index + 1}`, correct_answer: String(item) };
            }
            return { id: `BLANK_${index + 1}`, correct_answer: String(item) };
          });
      }
      break;

    case 'essay':
      // Garante que supporting_texts seja array de objetos {source, content}
      if (Array.isArray(sanitized.supporting_texts)) {
        sanitized.supporting_texts = sanitized.supporting_texts
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any, index: number) => {
            if (typeof item === 'object' && item !== null && 'source' in item && 'content' in item) {
              return item;
            }
            const parsed = parseKeyValueStrings([item]);
            if (typeof parsed === 'object' && parsed !== null && 'source' in parsed && 'content' in parsed) {
              return parsed;
            }
            return { source: `Texto ${index + 1}`, content: String(item) };
          });
      }
      break;
  }

  return sanitized;
}

/**
 * Parser inteligente de metadata com correção automática de formatos incorretos
 * Lida com:
 * 1. Strings JSON escapadas
 * 2. Arrays de strings no formato "key: value" que deveriam ser objetos
 * 3. Arrays de objetos que vieram como strings simples
 */
function parseAndFixMetadata(obj: any, questionType?: string): any {
  // 1. Se é string, tenta fazer parse JSON
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj);
      return parseAndFixMetadata(parsed, questionType);
    } catch {
      return obj;
    }
  }

  // 2. Se é array, processa cada elemento
  if (Array.isArray(obj)) {
    // Verifica se é um array de strings que deveria ser um array de objetos
    if (obj.length > 0 && typeof obj[0] === 'string') {
      // Se todas as strings têm formato "key: value", converte para objetos
      const firstItem = obj[0];
      if (firstItem.includes(': ') || firstItem.includes(':')) {
        // Pode ser um array onde cada item deveria ser um objeto
        // Ex: ["id: A1", "text: Função"] => {id: "A1", text: "Função"}
        const possibleObject = parseKeyValueStrings(obj);
        if (typeof possibleObject === 'object' && !Array.isArray(possibleObject)) {
          return possibleObject;
        }
      }
    }

    // Senão, processa recursivamente cada elemento
    return obj.map((item) => parseAndFixMetadata(item, questionType));
  }

  // 3. Se é objeto, processa cada propriedade E aplica correções específicas por tipo
  if (obj !== null && typeof obj === 'object') {
    const parsed: any = {};

    for (const key in obj) {
      parsed[key] = parseAndFixMetadata(obj[key], questionType);
    }

    // CORREÇÕES ESPECÍFICAS POR TIPO DE QUESTÃO

    // Fill in the Blank: blanks deve ser array de objetos {id, correct_answer}
    if ('blanks' in parsed && Array.isArray(parsed.blanks)) {
      parsed.blanks = parsed.blanks.map((item: any) => {
        if (typeof item === 'string') {
          // Se é string no formato "correct_answer:value" ou "id:value"
          const obj: any = {};
          if (item.includes('correct_answer:')) {
            obj.correct_answer = item.replace('correct_answer:', '').trim();
          } else if (item.includes('id:')) {
            obj.id = item.replace('id:', '').trim();
          }
          return obj;
        }
        return item;
      });
    }

    // Matching Columns: column_a, column_b devem ser arrays de objetos {id, text}
    if ('column_a' in parsed && Array.isArray(parsed.column_a)) {
      parsed.column_a = parsed.column_a.map((item: any) => {
        if (typeof item === 'object' && !Array.isArray(item)) {
          return item; // Já está correto
        }
        // Se veio como string, tenta converter
        return parseKeyValueStrings([item]);
      });
    }

    if ('column_b' in parsed && Array.isArray(parsed.column_b)) {
      parsed.column_b = parsed.column_b.map((item: any) => {
        if (typeof item === 'object' && !Array.isArray(item)) {
          return item; // Já está correto
        }
        return parseKeyValueStrings([item]);
      });
    }

    // Matching Columns: correct_matches deve ser array de objetos {from_id, to_id}
    if ('correct_matches' in parsed && Array.isArray(parsed.correct_matches)) {
      parsed.correct_matches = parsed.correct_matches.map((item: any) => {
        if (typeof item === 'object' && !Array.isArray(item)) {
          return item; // Já está correto
        }
        return parseKeyValueStrings([item]);
      });
    }

    // Multiple Choice: answers deve ser array de objetos {answer, is_correct}
    if ('answers' in parsed && Array.isArray(parsed.answers)) {
      parsed.answers = parsed.answers
        .filter((item: any) => item !== null && item !== undefined) // Remove nulls/undefined
        .map((item: any, index: number) => {
          if (typeof item === 'object' && item !== null && 'answer' in item) {
            return item; // Já está correto
          }
          // Se é apenas string, assume que precisa de is_correct
          if (typeof item === 'string') {
            return { answer: item, is_correct: false }; // Será preciso inferir is_correct
          }
          return item;
        });
    }

    return parsed;
  }

  // Valores primitivos retornam direto
  return obj;
}

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos para chamadas de IA

interface DocumentMetadata {
  fileName: string;
  fileType: string;
  wordCount: number;
  pageCount?: number;
}

interface GenerateQuestionsRequest {
  title: string;
  questionCount: number;
  subject: string;
  subjectId: string;
  questionTypes: Array<keyof typeof QuestionType>;
  questionContext: string;
  academicLevel?: string;
  documentContent?: string; // Texto extraído de DOCX
  pdfFiles?: Array<{ name: string; type: string; data: string }>; // PDFs completos (plus/advanced)
  documentMetadata?: DocumentMetadata[];
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar profile e plano do usuário
    const { data: profile } = await supabase.from('profiles').select('id, plan').eq('user_id', user.id).single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile não encontrado' }, { status: 404 });
    }

    // Buscar modelo de IA configurado para o plano do usuário
    const { data: planModelData } = await supabase
      .from('plan_models')
      .select('model')
      .eq('plan', profile.plan)
      .single();

    const aiModel = planModelData?.model || 'gemini-2.0-flash';

    // 2. Parse do body
    const body: GenerateQuestionsRequest = await request.json();
    const {
      title,
      questionCount: requestedQuestionCount,
      subject,
      questionTypes,
      questionContext,
      academicLevel,
      documentContent,
      pdfFiles,
    } = body;

    const normalizedQuestionCount = Number(requestedQuestionCount);

    if (!Number.isFinite(normalizedQuestionCount) || normalizedQuestionCount <= 0) {
      return NextResponse.json({ error: 'Quantidade de questões inválida' }, { status: 400 });
    }

    const totalRequestedQuestions = Math.max(1, Math.floor(normalizedQuestionCount));

    // Validações
    if (!title || !subject || !questionTypes || questionTypes.length === 0 || !questionContext) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const hasQuota = await checkUserQuota(profile.id, totalRequestedQuestions);

    if (!hasQuota) {
      return NextResponse.json(
        {
          error:
            'Você atingiu o limite mensal de geração de questões do seu plano. Aguarde o próximo ciclo ou faça upgrade.',
        },
        { status: 403 }
      );
    }

    // 3. Criar o assessment
    let { data: assessment } = await supabase.from('assessments').select().eq('title', title).single();
    if (!assessment) {
      const { data, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          user_id: profile.id,
          title: title,
          subject,
        })
        .select()
        .single();

      if (assessmentError || !assessment) {
        console.error('Erro ao criar assessment:', assessmentError);
        return NextResponse.json({ error: 'Erro ao criar avaliação' }, { status: 500 });
      } else {
        assessment = data;
      }
    }

    // 4. Distribuir questões pelos tipos
    // GARANTIR pelo menos 1 questão de cada tipo selecionado
    const typeCount = questionTypes.length;
    const distribution: Record<string, number> = {};

    if (totalRequestedQuestions < typeCount) {
      // Se tiver menos questões que tipos, ajustar para gerar pelo menos 1 de cada
      console.warn(
        `⚠️ Quantidade de questões (${totalRequestedQuestions}) < tipos selecionados (${typeCount}). Ajustando para ${typeCount} questões.`
      );
      // Cada tipo recebe exatamente 1 questão
      questionTypes.forEach((type) => {
        distribution[type] = 1;
      });
    } else {
      // Se tiver mais questões que tipos, garantir 1 de cada primeiro
      // Depois distribuir o resto proporcionalmente
      const questionsAfterMinimum = totalRequestedQuestions - typeCount;
      const extraPerType = Math.floor(questionsAfterMinimum / typeCount);
      const remainder = questionsAfterMinimum % typeCount;

      questionTypes.forEach((type, index) => {
        // 1 questão mínima + extra proporcional + resto para os primeiros tipos
        distribution[type] = 1 + extraPerType + (index < remainder ? 1 : 0);
      });
    }

    console.log('📊 Distribuição de questões por tipo:', distribution);

    const allGeneratedQuestions: QuestionWrapper[] = [];

    // 5. Gerar questões para cada tipo
    for (const type of questionTypes) {
      const count = distribution[type];

      if (!count || count === 0) continue;

      const input: GenerateQuestionsInput = {
        subject,
        count,
        questionContext,
        academicLevel,
        documentContent, // Texto de DOCX
        pdfFiles, // PDFs completos (plus/advanced)
        aiModel, // Modelo de IA configurado por plano
      };

      try {
        let result: GenerateQuestionsOutput | undefined;

        switch (type) {
          case 'multiple_choice':
            result = await generateMcqQuestions(input);
            break;
          case 'true_false':
            result = await generateTfQuestions(input);
            break;
          case 'open':
            result = await generateDissertativeQuestions(input);
            break;
          case 'sum':
            result = await generateSumQuestions(input);
            break;
          case 'fill_in_the_blank':
            result = await generateFillInTheBlankQuestions(input);
            break;
          case 'matching_columns':
            result = await generateMatchingColumnsQuestions(input);
            break;
          case 'problem_solving':
            result = await generateProblemSolvingQuestions(input);
            break;
          case 'essay':
            result = await generateEssayQuestions(input);
            break;
          case 'project_based':
            result = await generateProjectBasedQuestions(input);
            break;
          case 'gamified':
            result = await generateGamifiedQuestions(input);
            break;
          case 'summative':
            result = await generateSummativeQuestions(input);
            break;
          default:
            console.warn(`Tipo de questão não suportado: ${type}`);
            continue;
        }

        if (result?.questions) {
          allGeneratedQuestions.push(...result.questions);
        }
      } catch (aiError) {
        console.error(`Erro ao gerar questões do tipo ${type}:`, aiError);
        // Continua com outros tipos mesmo se um falhar
      }
    }

    if (allGeneratedQuestions.length === 0) {
      // Deletar assessment se nenhuma questão foi gerada
      await supabase.from('assessments').delete().eq('id', assessment.id);

      return NextResponse.json({ error: 'Não foi possível gerar questões' }, { status: 500 });
    }

    // 7. Inserir questões e metadata no banco
    for (const questionWrapper of allGeneratedQuestions) {
      const questionFromAI = questionWrapper.question;

      if (!questionFromAI || !questionFromAI.type || !questionFromAI.question) {
        console.warn('⚠️ Questão inválida detectada, pulando:', questionWrapper);
        continue;
      }

      // Etapa 1: Parse e correção de formatos incorretos
      const parsedMetadata = parseAndFixMetadata(questionFromAI.metadata, questionFromAI.type);

      // Etapa 1.5: NORMALIZAÇÃO FORÇADA - Garante formato correto SEMPRE
      console.log('\n🔧 NORMALIZANDO METADATA:');
      console.log('Tipo:', questionFromAI.type);
      console.log('Antes da normalização:', JSON.stringify(parsedMetadata, null, 2));

      const normalizedMetadata = normalizeMetadata(questionFromAI.type, parsedMetadata);

      console.log('Depois da normalização:', JSON.stringify(normalizedMetadata, null, 2));

      // Etapa 2: Sanitização e validação específica por tipo
      const sanitizedMetadata = sanitizeMetadataByType(normalizedMetadata, questionFromAI.type);

      // Log detalhado para debug
      console.log('\n🔍 METADATA APÓS PROCESSAMENTO COMPLETO:');
      console.log('Tipo:', questionFromAI.type);
      console.log('Chaves:', Object.keys(sanitizedMetadata || {}));
      console.log('Metadata completo:', JSON.stringify(sanitizedMetadata, null, 2));

      // Preparar dados da questão
      const questionData: QuestionInsertData = {
        assessment_id: assessment.id,
        type: questionFromAI.type,
        question: questionFromAI.question,
        metadata: sanitizedMetadata,
      };

      // Inserir questão
      const { data: insertedQuestion, error: questionError } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single();

      if (questionError || !insertedQuestion) {
        console.error('Erro ao inserir questão:', questionError);
        continue;
      }
    }

    if (allGeneratedQuestions.length > 0) {
      await updateProfileLogsCycle(profile.id, subject.trim() || 'Geral', allGeneratedQuestions.length);
    }

    // 8. Retornar sucesso
    // NOTA: Os logs são atualizados automaticamente via triggers SQL:
    // - create_new_questions: trigger no INSERT de assessments
    // - new_questions: trigger no INSERT de questions
    return NextResponse.json({
      success: true,
      assessment_id: assessment.id,
      questions_generated: allGeneratedQuestions.length,
    });
  } catch (error: any) {
    console.error('Erro no endpoint de geração:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
