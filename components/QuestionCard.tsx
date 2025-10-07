import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Check, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { track } from '@vercel/analytics';
import {
  hasCorrectAnswers,
  isMultipleChoiceMetadata,
  isTrueFalseMetadata,
  isSumMetadata,
  isMatchingColumnsMetadata,
  isFillInTheBlankMetadata,
  isOpenMetadata,
  isProblemSolvingMetadata,
  isEssayMetadata,
  isProjectBasedMetadata,
  isGamifiedMetadata,
  type QuestionMetadata,
  type MultipleChoiceMetadata,
  type TrueFalseMetadata,
  type SumMetadata,
  type MatchingColumnsMetadata,
  type FillInTheBlankMetadata,
  type OpenMetadata,
  type ProblemSolvingMetadata,
  type EssayMetadata,
  type ProjectBasedMetadata,
  type GamifiedMetadata,
} from '@/lib/question-metadata-types';

export interface Question {
  id: string;
  question: string;
  type: string;
  copy_count: number;
  metadata: QuestionMetadata;
}

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard = ({ question }: QuestionCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copyCount, setCopyCount] = useState(question.copy_count);
  const { toast } = useToast();

  // Garantir que metadata existe e é um objeto válido
  const metadata = question.metadata && typeof question.metadata === 'object' ? question.metadata : {};
  const canFlip = hasCorrectAnswers(question.type);

  const formatCopyText = (): string => {
    let text = `${question.question}\n\n`;

    try {
      if (isMultipleChoiceMetadata(metadata)) {
        text +=
          metadata.answers
            ?.filter((item) => item && typeof item === 'object')
            .map((item, i) => `${String.fromCharCode(97 + i)}) ${item.answer || ''}`)
            .join('\n') || '';
      } else if (isTrueFalseMetadata(metadata)) {
        text +=
          metadata.statements
            ?.filter((item) => item && typeof item === 'object')
            .map((item) => `( ) ${item.statement || ''}`)
            .join('\n') || '';
      } else if (isSumMetadata(metadata)) {
        // Formatação específica para Sum: (01), (02), (04), (08), etc.
        text +=
          metadata.statements
            ?.filter((item) => item && typeof item === 'object' && item.number)
            .map((item) => `(${String(item.number).padStart(2, '0')}) ${item.statement || ''}`)
            .join('\n') || '';
      } else if (isMatchingColumnsMetadata(metadata)) {
        text += 'Coluna A:\n';
        text +=
          metadata.column_a
            ?.filter((item) => item && typeof item === 'object')
            .map((item) => `${item.id}) ${item.text}`)
            .join('\n') || '';
        text += '\n\nColuna B:\n';
        text +=
          metadata.column_b
            ?.filter((item) => item && typeof item === 'object')
            .map((item) => `${item.id}) ${item.text}`)
            .join('\n') || '';
      } else if (isFillInTheBlankMetadata(metadata)) {
        text += metadata.text_with_blanks || question.question;
      } else if (isOpenMetadata(metadata)) {
        text += `\nResposta esperada:\n${metadata.expected_answer_guideline || 'Não especificada'}`;
      } else if (isProblemSolvingMetadata(metadata)) {
        text += `\nGuia de resolução:\n${metadata.solution_guideline || 'Não especificado'}`;
      } else if (isEssayMetadata(metadata)) {
        text += '\nTextos motivadores:\n';
        metadata.supporting_texts
          ?.filter((txt) => txt && typeof txt === 'object')
          .forEach((txt) => {
            text += `\n[${txt.source || 'Fonte'}]\n${txt.content || ''}\n`;
          });
        text += `\nInstruções:\n${metadata.instructions || 'Não especificadas'}`;
      } else if (isProjectBasedMetadata(metadata)) {
        text += '\nFases:\n';
        text +=
          metadata.phases
            ?.filter((p) => p && typeof p === 'string')
            .map((p, i) => `${i + 1}. ${p}`)
            .join('\n') || '';
        text += '\n\nEntregáveis:\n';
        text +=
          metadata.deliverables
            ?.filter((d) => d && typeof d === 'string')
            .map((d) => `- ${d}`)
            .join('\n') || '';
      } else if (isGamifiedMetadata(metadata)) {
        text += `Cenário: ${metadata.scenario || 'Não especificado'}\n\nDesafios:\n`;
        text +=
          metadata.challenges
            ?.filter((c) => c && typeof c === 'string')
            .map((c, i) => `${i + 1}. ${c}`)
            .join('\n') || '';
      }
    } catch (error) {
      console.error('Erro ao formatar texto de cópia:', error);
      text += '\n[Erro ao formatar conteúdo]';
    }

    return text;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(formatCopyText());

      track('question_copied', { questionType: question.type });

      try {
        const response = await fetch('/api/copy-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id }),
        });

        const data = await response.json();
        if (data.success && data.copy_count !== undefined) {
          setCopyCount(data.copy_count);
        }
      } catch (apiError) {
        console.error('Error tracking copy:', apiError);
      }

      toast({
        title: 'Copiado!',
        description: 'Questão copiada para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar a questão.',
        variant: 'destructive',
      });
    }
  };

  const renderMultipleChoice = (data: MultipleChoiceMetadata) => {
    // VALIDAÇÃO ROBUSTA: Garante que answers é um array válido
    if (!data || !data.answers) {
      console.warn('[QuestionCard] Multiple choice missing answers:', data);
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Questão sem alternativas
        </div>
      );
    }

    let answers = data.answers;

    // Se answers é um objeto único, transforma em array
    if (!Array.isArray(answers) && typeof answers === 'object') {
      console.warn('[QuestionCard] Answers is object, converting to array');
      answers = [answers];
    }

    // Se ainda não é array, fallback
    if (!Array.isArray(answers)) {
      console.error('[QuestionCard] Answers is not an array:', answers);
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Formato de alternativas inválido
        </div>
      );
    }

    // Filtra e valida cada alternativa
    const validAnswers = answers.filter((item) => {
      if (!item || typeof item !== 'object') {
        console.warn('[QuestionCard] Skipping non-object answer:', item);
        return false;
      }
      if (!item.answer || typeof item.answer !== 'string') {
        console.warn('[QuestionCard] Skipping answer without text:', item);
        return false;
      }
      return true;
    });

    if (validAnswers.length === 0) {
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Nenhuma alternativa válida encontrada
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {validAnswers.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-3 bg-muted rounded-lg text-sm transition-all',
              isFlipped && !item.is_correct && 'opacity-40'
            )}
          >
            <span className="font-semibold mr-2">{String.fromCharCode(97 + index)})</span>
            {item.answer}
            {isFlipped && item.is_correct && <span className="ml-2 text-green-600 font-semibold">✓ Correta</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderTrueFalse = (data: TrueFalseMetadata) => {
    // VALIDAÇÃO ROBUSTA
    if (!data || !data.statements) {
      console.warn('[QuestionCard] True/False missing statements:', data);
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Questão sem afirmativas
        </div>
      );
    }

    let statements = data.statements;

    // Se statements é um objeto único, transforma em array
    if (!Array.isArray(statements) && typeof statements === 'object') {
      console.warn('[QuestionCard] Statements is object, converting to array');
      statements = [statements];
    }

    if (!Array.isArray(statements)) {
      console.error('[QuestionCard] Statements is not an array:', statements);
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Formato de afirmativas inválido
        </div>
      );
    }

    // Filtra e valida cada afirmativa
    const validStatements = statements.filter((item) => {
      if (!item || typeof item !== 'object') {
        console.warn('[QuestionCard] Skipping non-object statement:', item);
        return false;
      }
      if (!item.statement || typeof item.statement !== 'string') {
        console.warn('[QuestionCard] Skipping statement without text:', item);
        return false;
      }
      // Detecta conteúdo literal inválido
      if (item.statement === 'statements' || item.statement === 'statement') {
        console.warn('[QuestionCard] Skipping literal statement value');
        return false;
      }
      return true;
    });

    if (validStatements.length === 0) {
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Nenhuma afirmativa válida encontrada
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {validStatements.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-3 bg-muted rounded-lg text-sm transition-all',
              isFlipped && !item.is_correct && 'opacity-40'
            )}
          >
            <span className="font-semibold mr-2">{isFlipped ? (item.is_correct ? '(V)' : '(F)') : '( )'}</span>
            {item.statement}
          </div>
        ))}
      </div>
    );
  };

  const renderSum = (data: SumMetadata) => {
    // VALIDAÇÃO ROBUSTA
    if (!data || !data.statements) {
      console.warn('[QuestionCard] Sum missing statements:', data);
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Questão sem afirmativas
        </div>
      );
    }

    let statements = data.statements;

    if (!Array.isArray(statements) && typeof statements === 'object') {
      console.warn('[QuestionCard] Sum statements is object, converting to array');
      statements = [statements];
    }

    if (!Array.isArray(statements)) {
      console.error('[QuestionCard] Sum statements is not an array:', statements);
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Formato de afirmativas inválido
        </div>
      );
    }

    const validStatements = statements.filter((item) => {
      if (!item || typeof item !== 'object') {
        console.warn('[QuestionCard] Sum: Skipping non-object statement:', item);
        return false;
      }
      if (!item.statement || typeof item.statement !== 'string') {
        console.warn('[QuestionCard] Sum: Skipping statement without text:', item);
        return false;
      }
      // Detecta conteúdo literal inválido
      if (item.statement === 'statements' || item.statement === 'statement') {
        console.warn('[QuestionCard] Sum: Skipping literal statement value');
        return false;
      }
      if (typeof item.number !== 'number' || ![1, 2, 4, 8, 16, 32, 64].includes(item.number)) {
        console.warn('[QuestionCard] Sum: Invalid power of 2:', item.number);
        return false;
      }
      return true;
    });

    if (validStatements.length === 0) {
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Nenhuma afirmativa válida encontrada
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-3">Marque as afirmativas corretas e some seus valores:</p>
        {validStatements.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-3 bg-muted rounded-lg text-sm transition-all',
              isFlipped && !item.is_correct && 'opacity-40'
            )}
          >
            <span className="font-semibold mr-2">({item.number})</span>
            {item.statement}
            {isFlipped && item.is_correct && <span className="ml-2 text-green-600 font-semibold">✓ Correta</span>}
          </div>
        ))}
        {isFlipped && validStatements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-semibold">
              Soma correta:{' '}
              {validStatements.filter((item) => item.is_correct).reduce((sum, item) => sum + item.number, 0)}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMatchingColumns = (data: MatchingColumnsMetadata) => {
    // VALIDAÇÃO ROBUSTA
    if (!data) {
      console.warn('[QuestionCard] Matching columns missing data');
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">⚠️ Questão sem dados</div>
      );
    }

    let columnA = data.column_a;
    let columnB = data.column_b;

    // Garante que são arrays
    if (!Array.isArray(columnA) && typeof columnA === 'object') {
      columnA = [columnA];
    }
    if (!Array.isArray(columnB) && typeof columnB === 'object') {
      columnB = [columnB];
    }

    if (!Array.isArray(columnA) || !Array.isArray(columnB)) {
      console.error('[QuestionCard] Matching columns are not arrays');
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Formato de colunas inválido
        </div>
      );
    }

    // Valida itens de cada coluna
    const validColumnA = columnA.filter((item) => item && typeof item === 'object' && item.id && item.text);
    const validColumnB = columnB.filter((item) => item && typeof item === 'object' && item.id && item.text);

    if (validColumnA.length === 0 || validColumnB.length === 0) {
      console.warn('[QuestionCard] No valid items in columns');
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Colunas vazias ou inválidas
        </div>
      );
    }

    // Valida matches
    let correctMatches = data.correct_matches;
    if (!Array.isArray(correctMatches) && typeof correctMatches === 'object') {
      correctMatches = [correctMatches];
    }
    const validMatches = Array.isArray(correctMatches)
      ? correctMatches.filter((item) => item && typeof item === 'object' && item.from_id && item.to_id)
      : [];

    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Coluna A:</p>
          <div className="space-y-2">
            {validColumnA.map((item) => (
              <div key={item.id} className="p-2 bg-muted rounded text-sm">
                <span className="font-semibold mr-2">{item.id})</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Coluna B:</p>
          <div className="space-y-2">
            {validColumnB.map((item) => (
              <div key={item.id} className="p-2 bg-muted rounded text-sm">
                <span className="font-semibold mr-2">{item.id})</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
        {isFlipped && validMatches.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Gabarito:</p>
            <div className="space-y-1">
              {validMatches.map((match, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{match.from_id}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold">{match.to_id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFillInTheBlank = (data: FillInTheBlankMetadata) => {
    // VALIDAÇÃO ROBUSTA
    if (!data) {
      console.warn('[QuestionCard] Fill in the blank missing data');
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">⚠️ Questão sem dados</div>
      );
    }

    let blanks = data.blanks;

    // Garante que blanks é array
    if (!Array.isArray(blanks) && typeof blanks === 'object') {
      console.warn('[QuestionCard] Blanks is object, converting to array');
      blanks = [blanks];
    }

    if (!Array.isArray(blanks)) {
      console.error('[QuestionCard] Blanks is not an array:', blanks);
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Formato de lacunas inválido
        </div>
      );
    }

    const validBlanks = blanks.filter((item) => item && typeof item === 'object' && item.id && item.correct_answer);

    if (validBlanks.length === 0) {
      console.warn('[QuestionCard] No valid blanks found');
      return (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm italic">
          ⚠️ Nenhuma lacuna válida encontrada
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm bg-muted p-3 rounded-lg">{data.text_with_blanks || question.question}</p>
        {data.options_bank && Array.isArray(data.options_bank) && data.options_bank.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Banco de opções:</p>
            <div className="flex flex-wrap gap-2">
              {data.options_bank
                .filter((opt) => typeof opt === 'string')
                .map((option, i) => (
                  <Badge key={i} variant="outline">
                    {option}
                  </Badge>
                ))}
            </div>
          </div>
        )}
        {isFlipped && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Respostas:</p>
            <div className="space-y-1">
              {validBlanks.map((blank, i) => (
                <div key={i} className="text-sm p-2 bg-muted rounded">
                  <span className="font-semibold mr-2">{blank.id}:</span>
                  {blank.correct_answer}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOpen = (data: OpenMetadata) => (
    <div className="space-y-3">
      <div className="p-3 bg-muted rounded-lg text-sm italic">
        Resposta dissertativa (avalie conforme critérios estabelecidos)
      </div>
      {isFlipped && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Resposta esperada:</p>
          <div className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">{data.expected_answer_guideline}</div>
        </div>
      )}
    </div>
  );

  const renderProblemSolving = (data: ProblemSolvingMetadata) => (
    <div className="space-y-3">
      <div className="p-3 bg-muted rounded-lg text-sm italic">Questão-problema (avalie o processo de resolução)</div>
      {isFlipped && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Guia de resolução:</p>
          <div className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">{data.solution_guideline}</div>
        </div>
      )}
    </div>
  );

  const renderEssay = (data: EssayMetadata) => (
    <div className="space-y-3">
      {data.supporting_texts && data.supporting_texts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Textos motivadores:</p>
          <div className="space-y-2">
            {data.supporting_texts.map((text, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-semibold text-xs text-muted-foreground mb-1">{text.source}</p>
                <p className="italic">{text.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
        <p className="font-semibold mb-1">Instruções:</p>
        <p>{data.instructions}</p>
      </div>
    </div>
  );

  const renderProjectBased = (data: ProjectBasedMetadata) => (
    <div className="space-y-3">
      {data.phases && data.phases.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Fases do projeto:</p>
          <div className="space-y-2">
            {data.phases.map((phase, i) => (
              <div key={i} className="p-2 bg-muted rounded-lg text-sm">
                <span className="font-semibold mr-2">{i + 1}.</span>
                {phase}
              </div>
            ))}
          </div>
        </div>
      )}
      {isFlipped && data.deliverables && data.deliverables.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Entregáveis:</p>
          <ul className="space-y-1 text-sm">
            {data.deliverables.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderGamified = (data: GamifiedMetadata) => (
    <div className="space-y-3">
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
        <p className="font-semibold text-primary mb-1">🎮 Cenário:</p>
        <p>{data.scenario}</p>
      </div>
      {data.challenges && data.challenges.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Desafios:</p>
          <div className="space-y-2">
            {data.challenges.map((challenge, i) => (
              <div key={i} className="p-2 bg-muted rounded-lg text-sm">
                <span className="font-semibold mr-2">{i + 1}.</span>
                {challenge}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const getQuestionTypeLabel = () => {
    const labels: Record<string, string> = {
      multiple_choice: 'Múltipla Escolha',
      true_false: 'Verdadeiro/Falso',
      sum: 'Somatória',
      matching_columns: 'Associação',
      fill_in_the_blank: 'Completar Lacunas',
      open: 'Dissertativa',
      problem_solving: 'Resolução de Problemas',
      essay: 'Redação',
      project_based: 'Projeto',
      gamified: 'Gamificada',
      summative: 'Avaliação Somativa',
    };
    return labels[question.type] || question.type;
  };

  const renderQuestionContent = () => {
    if (isMultipleChoiceMetadata(metadata)) {
      return renderMultipleChoice(metadata);
    } else if (isSumMetadata(metadata)) {
      return renderSum(metadata);
    } else if (isTrueFalseMetadata(metadata)) {
      return renderTrueFalse(metadata);
    } else if (isMatchingColumnsMetadata(metadata)) {
      return renderMatchingColumns(metadata);
    } else if (isFillInTheBlankMetadata(metadata)) {
      return renderFillInTheBlank(metadata);
    } else if (isOpenMetadata(metadata)) {
      return renderOpen(metadata);
    } else if (isProblemSolvingMetadata(metadata)) {
      return renderProblemSolving(metadata);
    } else if (isEssayMetadata(metadata)) {
      return renderEssay(metadata);
    } else if (isProjectBasedMetadata(metadata)) {
      return renderProjectBased(metadata);
    } else if (isGamifiedMetadata(metadata)) {
      return renderGamified(metadata);
    }

    // Fallback genérico
    return (
      <div className="p-3 bg-muted rounded-lg text-sm italic text-muted-foreground">
        Conteúdo da questão (tipo: {getQuestionTypeLabel()})
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge variant="secondary" className="text-xs">
            {getQuestionTypeLabel()}
          </Badge>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
              <Clipboard className="h-4 w-4" />
            </Button>
            {copyCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {copyCount} {copyCount === 1 ? 'cópia' : 'cópias'}
              </Badge>
            )}
          </div>
        </div>

        <div
          className={cn('space-y-4', canFlip && 'cursor-pointer')}
          onClick={() => canFlip && setIsFlipped(!isFlipped)}
        >
          <div className="font-medium text-base leading-relaxed">{question.question}</div>

          {renderQuestionContent()}

          {canFlip && (
            <div className="flex items-center justify-center pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="text-xs">
                {isFlipped ? (
                  <>
                    <Check className="h-3 w-3 mr-1" /> Gabarito visível
                  </>
                ) : (
                  'Clique para ver o gabarito'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
