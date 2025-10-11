import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clipboard, Check, ArrowRight, Eye } from 'lucide-react';
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
  isOpenQuestionMetadata,
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
  type OpenQuestionMetadata,
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
  const [copyCount, setCopyCount] = useState(question.copy_count);
  const [showGabarito, setShowGabarito] = useState(false);
  const { toast } = useToast();

  // Garantir que metadata existe e é um objeto válido
  const metadata = question.metadata && typeof question.metadata === 'object' ? question.metadata : {};
  const canFlip = hasCorrectAnswers(question.type);

  // Função para converter Markdown simples para HTML
  const markdownToHtml = (text: string): string => {
    if (!text) return '';

    return (
      text
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        // Lists (preservar indentação)
        .replace(/^\*{3}\s+/gm, '    • ')
        .replace(/^- /gm, '• ')
        // Line breaks
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>')
    );
  };

  const formatCopyText = (): string => {
    // COPIA APENAS O QUE O ALUNO DEVE RECEBER (SEM GABARITOS)
    let text = `${question.question}\n\n`;

    try {
      if (isMultipleChoiceMetadata(metadata)) {
        // Apenas as alternativas, sem marcar qual é correta
        text +=
          metadata.answers
            ?.filter((item) => item && typeof item === 'object')
            .map((item, i) => `${String.fromCharCode(97 + i)}) ${item.answer || ''}`)
            .join('\n') || '';
      } else if (isTrueFalseMetadata(metadata)) {
        // Apenas as afirmações com ( ) vazio
        text +=
          metadata.statements
            ?.filter((item) => item && typeof item === 'object')
            .map((item) => `( ) ${item.statement || ''}`)
            .join('\n') || '';
      } else if (isSumMetadata(metadata)) {
        // Apenas as afirmativas com os números, sem marcar quais são corretas
        text +=
          metadata.statements
            ?.filter((item) => item && typeof item === 'object' && item.number)
            .map((item) => `(${String(item.number).padStart(2, '0')}) ${item.statement || ''}`)
            .join('\n') || '';
      } else if (isMatchingColumnsMetadata(metadata)) {
        // Ambas as colunas sem mostrar as associações corretas
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
        // Apenas o texto com lacunas ({{blank_1}}, {{blank_2}}, etc.)
        text += metadata.text_with_blanks || question.question;

        // Se houver banco de opções, incluir
        if (metadata.options_bank && Array.isArray(metadata.options_bank) && metadata.options_bank.length > 0) {
          text += '\n\nBanco de opções:\n';
          text += metadata.options_bank.filter((opt) => typeof opt === 'string').join(', ');
        }
      } else if (isOpenQuestionMetadata(metadata)) {
        // Concatena a pergunta principal e as sub-questões
        text = `${metadata.main_question}\n\n`;
        text += metadata.sub_questions.join('\n');
      } else if (isProblemSolvingMetadata(metadata)) {
        // Incluir cenário e dados estruturados, mas NÃO a solução
        if (metadata.scenario) {
          text += `\n${metadata.scenario}\n`;
        }
        if (metadata.data && Array.isArray(metadata.data) && metadata.data.length > 0) {
          text += '\nDados:\n';
          text += metadata.data
            .filter((item) => item && typeof item === 'object')
            .map((item) => `• ${item.label}: ${item.value}`)
            .join('\n');
        }
        if (metadata.task) {
          text += `\n\nTarefa:\n${metadata.task}`;
        }
        // solution_guideline NÃO é copiado (apenas para o professor)
      } else if (isEssayMetadata(metadata)) {
        // Incluir textos motivadores e tema/prompt
        if (metadata.supporting_texts && Array.isArray(metadata.supporting_texts)) {
          text += '\nTextos motivadores:\n\n';
          metadata.supporting_texts
            .filter((txt) => txt && typeof txt === 'object')
            .forEach((txt, i) => {
              text += `Texto ${i + 1} - ${txt.source || 'Fonte'}\n`;
              text += `${txt.content || ''}\n\n`;
            });
        }
        if (metadata.essay_prompt) {
          text += `\n${metadata.essay_prompt}\n`;
        }
        // Incluir instruções (são para o aluno)
        if (Array.isArray(metadata.instructions)) {
          text += '\nInstruções:\n';
          text += metadata.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n');
        } else if (metadata.instructions) {
          text += `\nInstruções:\n${metadata.instructions}`;
        }
      } else if (isProjectBasedMetadata(metadata)) {
        // Incluir pergunta norteadora, fases e entregáveis (tudo é para o aluno)
        if (metadata.welcome_message) {
          text += `\n${metadata.welcome_message}\n\n`;
        }
        if (metadata.guiding_question) {
          text += `Pergunta Norteadora:\n${metadata.guiding_question}\n`;
        }
        if (metadata.phases && Array.isArray(metadata.phases)) {
          text += '\nFases do Projeto:\n';
          text += metadata.phases
            .filter((p) => p && typeof p === 'string')
            .map((p, i) => `${i + 1}. ${p}`)
            .join('\n');
        }
        if (metadata.deliverables && Array.isArray(metadata.deliverables)) {
          text += '\n\nEntregáveis:\n';
          text += metadata.deliverables
            .filter((d) => d && typeof d === 'string')
            .map((d) => `• ${d}`)
            .join('\n');
        }
        // evaluation_criteria NÃO é copiado (apenas para o professor ver no gabarito)
      } else if (isGamifiedMetadata(metadata)) {
        // Incluir briefing da missão e desafios (tudo é para o aluno)
        if (metadata.mission_briefing) {
          text += `\n${metadata.mission_briefing}\n\n`;
        }
        if (metadata.challenges && Array.isArray(metadata.challenges)) {
          text += 'Desafios:\n';
          text += metadata.challenges
            .filter((c) => c && typeof c === 'string')
            .map((c, i) => `${i + 1}. ${c}`)
            .join('\n');
        }
        // conclusion_message NÃO é copiado (apenas para o professor ver no gabarito)
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
          <div key={index} className="p-3 bg-muted rounded-lg text-sm">
            <span className="font-semibold mr-2">{String.fromCharCode(97 + index)})</span>
            {item.answer}
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
          <div key={index} className="p-3 bg-muted rounded-lg text-sm">
            <span className="font-semibold mr-2">( )</span>
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
          <div key={index} className="p-3 bg-muted rounded-lg text-sm">
            <span className="font-semibold mr-2">({item.number})</span>
            {item.statement}
          </div>
        ))}
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
      </div>
    );
  };

  const renderOpenQuestion = (data: OpenQuestionMetadata) => {
    return (
      <div className="space-y-4">
        <div
          className="text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(data.main_question) }}
        />
        <div className="space-y-2">
          {data.sub_questions.map((sub, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg text-sm">
              {sub}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProblemSolving = (data: ProblemSolvingMetadata) => (
    <div className="space-y-3">
      <div className="p-3 bg-muted rounded-lg text-sm italic">Questão-problema (avalie o processo de resolução)</div>
    </div>
  );

  const renderEssay = (data: EssayMetadata) => (
    <div className="space-y-3">
      {data.essay_prompt && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
          <p className="font-semibold text-primary mb-1">🎯 Tema:</p>
          <p>{data.essay_prompt}</p>
        </div>
      )}
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
    } else if (isOpenQuestionMetadata(metadata)) {
      return renderOpenQuestion(metadata);
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

  // ============================================================================
  // FUNÇÕES DE GABARITO PARA O MODAL
  // ============================================================================

  const renderGabaritoMultipleChoice = (data: MultipleChoiceMetadata) => {
    const answers = Array.isArray(data.answers) ? data.answers : [data.answers];
    const validAnswers = answers.filter((item) => item && typeof item === 'object' && item.answer);

    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold mb-2">Gabarito:</p>
        {validAnswers.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg text-sm',
              item.is_correct
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            )}
          >
            <span
              className={cn(
                'font-semibold mr-2',
                item.is_correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              )}
            >
              {String.fromCharCode(97 + index)})
            </span>
            {item.answer}
          </div>
        ))}
      </div>
    );
  };

  const renderGabaritoTrueFalse = (data: TrueFalseMetadata) => {
    const statements = Array.isArray(data.statements) ? data.statements : [data.statements];
    const validStatements = statements.filter((item) => item && typeof item === 'object' && item.statement);

    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold mb-3">Gabarito:</p>
        {validStatements.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg text-sm',
              item.is_correct
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            )}
          >
            <span
              className={cn(
                'font-semibold mr-2',
                item.is_correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              )}
            >
              {item.is_correct ? '(V)' : '(F)'}
            </span>
            {item.statement}
          </div>
        ))}
      </div>
    );
  };

  const renderGabaritoSum = (data: SumMetadata) => {
    const statements = Array.isArray(data.statements) ? data.statements : [data.statements];
    const validStatements = statements.filter(
      (item) => item && typeof item === 'object' && item.statement && typeof item.number === 'number'
    );
    const correctStatements = validStatements.filter((item) => item.is_correct);
    const sum = correctStatements.reduce((acc, item) => acc + item.number, 0);

    return (
      <div className="space-y-3">
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-sm font-semibold mb-1">Soma correta:</p>
          <p className="text-3xl font-bold text-primary">{sum}</p>
        </div>
        <p className="text-sm font-semibold mb-2">Gabarito:</p>
        {validStatements.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg text-sm',
              item.is_correct
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            )}
          >
            <span
              className={cn(
                'font-semibold mr-2',
                item.is_correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              )}
            >
              ({String(item.number).padStart(2, '0')})
            </span>
            {item.statement}
          </div>
        ))}
      </div>
    );
  };

  const renderGabaritoMatchingColumns = (data: MatchingColumnsMetadata) => {
    let correctMatches = data.correct_matches;
    if (!Array.isArray(correctMatches) && typeof correctMatches === 'object') {
      correctMatches = [correctMatches];
    }
    const validMatches = Array.isArray(correctMatches)
      ? correctMatches.filter((item) => item && item.from_id && item.to_id)
      : [];

    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">Associações corretas:</p>
        <div className="space-y-2">
          {validMatches.map((match, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <span className="font-semibold text-lg">{match.from_id}</span>
              <ArrowRight className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{match.to_id}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGabaritoFillInTheBlank = (data: FillInTheBlankMetadata) => {
    const blanks = Array.isArray(data.blanks) ? data.blanks : [data.blanks];
    const validBlanks = blanks.filter((item) => item && typeof item === 'object' && item.id && item.correct_answer);

    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">Respostas corretas:</p>
        {validBlanks.map((blank, i) => (
          <div
            key={i}
            className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <span className="font-semibold text-green-700 dark:text-green-400 mr-2">{blank.id}:</span>
            <span className="text-sm">{blank.correct_answer}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderGabaritoOpenQuestion = (data: OpenQuestionMetadata) => {
    const answerText = data.expected_answer_guideline || '';

    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">Gabarito e Critérios de Avaliação:</p>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div
            className="text-sm leading-relaxed text-green-900 dark:text-green-100 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(answerText) }}
          />
        </div>
        <p className="text-xs text-muted-foreground italic">
          💡 Esta é uma resposta modelo. Outras respostas podem ser aceitas desde que abordem os pontos principais.
        </p>
      </div>
    );
  };

  const renderGabaritoProblemSolving = (data: ProblemSolvingMetadata) => (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Guia de resolução:</p>
      <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
        {data.solution_guideline}
      </div>
    </div>
  );

  const renderGabaritoEssay = (data: EssayMetadata) => {
    // Função para copiar todo o conteúdo da redação
    const handleCopyEssay = async () => {
      let text = '📝 PROPOSTA DE REDAÇÃO\n\n';

      // Textos motivadores
      if (data.supporting_texts && Array.isArray(data.supporting_texts)) {
        text += '📚 TEXTOS MOTIVADORES:\n\n';
        data.supporting_texts.forEach((txt, i) => {
          text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          text += `TEXTO ${i + 1}\n`;
          if (txt.source) {
            text += `Fonte: ${txt.source}\n\n`;
          }
          text += `${txt.content || ''}\n\n`;
        });
      }

      // Tema da redação
      if (data.essay_prompt) {
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🎯 TEMA DA REDAÇÃO:\n\n${data.essay_prompt}\n\n`;
      }

      // Instruções
      if (data.instructions && Array.isArray(data.instructions)) {
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📋 INSTRUÇÕES:\n\n`;
        data.instructions.forEach((inst, i) => {
          text += `${i + 1}. ${inst}\n`;
        });
      }

      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: 'Copiado!',
          description: 'Proposta de redação completa copiada para a área de transferência.',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível copiar o conteúdo.',
          variant: 'destructive',
        });
      }
    };

    return (
      <div className="space-y-4">
        {/* Botão de copiar no topo */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopyEssay} className="gap-2">
            <Clipboard className="h-4 w-4" />
            Copiar Proposta Completa
          </Button>
        </div>

        {/* Textos Motivadores */}
        {data.supporting_texts && Array.isArray(data.supporting_texts) && data.supporting_texts.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3">📚 Textos Motivadores:</p>
            <div className="space-y-4">
              {data.supporting_texts.map((txt, i) => (
                <div key={i} className="border-l-4 border-primary pl-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Texto {i + 1}
                    {txt.source && <span className="ml-2">— {txt.source}</span>}
                  </p>
                  <p className="text-sm leading-relaxed">{txt.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tema da Redação */}
        {data.essay_prompt && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm font-semibold mb-2">🎯 Tema da Redação:</p>
            <p className="text-sm leading-relaxed font-medium">{data.essay_prompt}</p>
          </div>
        )}

        {/* Instruções */}
        {data.instructions && Array.isArray(data.instructions) && data.instructions.length > 0 && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">📋 Instruções:</p>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              {data.instructions.map((instruction, i) => (
                <li key={i} className="leading-relaxed">
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            ℹ️ <strong>Nota:</strong> Redações não possuem gabarito fixo. Avalie de acordo com os critérios
            estabelecidos.
          </p>
        </div>
      </div>
    );
  };

  const renderGabaritoProjectBased = (data: ProjectBasedMetadata) => (
    <div className="space-y-4">
      {data.deliverables && data.deliverables.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Entregáveis esperados:</p>
          <ul className="space-y-1 text-sm">
            {data.deliverables.map((item, i) => (
              <li key={i} className="flex gap-2 p-2 bg-muted rounded">
                <span className="text-muted-foreground">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.evaluation_criteria && data.evaluation_criteria.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Critérios de avaliação:</p>
          <ul className="space-y-1 text-sm">
            {data.evaluation_criteria.map((item, i) => (
              <li key={i} className="flex gap-2 p-2 bg-muted rounded">
                <span className="text-muted-foreground">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderGabaritoGamified = (data: GamifiedMetadata) => (
    <div className="space-y-3">
      {data.conclusion_message && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-sm font-semibold mb-2">🎉 Mensagem de conclusão:</p>
          <p className="text-sm">{data.conclusion_message}</p>
        </div>
      )}
      {!data.conclusion_message && (
        <div className="p-4 bg-muted rounded-lg text-sm italic">
          Avalie o desempenho do estudante nos desafios propostos.
        </div>
      )}
    </div>
  );

  const renderGabaritoContent = () => {
    if (isMultipleChoiceMetadata(metadata)) {
      return renderGabaritoMultipleChoice(metadata);
    } else if (isTrueFalseMetadata(metadata)) {
      return renderGabaritoTrueFalse(metadata);
    } else if (isSumMetadata(metadata)) {
      return renderGabaritoSum(metadata);
    } else if (isMatchingColumnsMetadata(metadata)) {
      return renderGabaritoMatchingColumns(metadata);
    } else if (isFillInTheBlankMetadata(metadata)) {
      return renderGabaritoFillInTheBlank(metadata);
    } else if (isOpenQuestionMetadata(metadata)) {
      return renderGabaritoOpenQuestion(metadata);
    } else if (isProblemSolvingMetadata(metadata)) {
      return renderGabaritoProblemSolving(metadata);
    } else if (isEssayMetadata(metadata)) {
      return renderGabaritoEssay(metadata);
    } else if (isProjectBasedMetadata(metadata)) {
      return renderGabaritoProjectBased(metadata);
    } else if (isGamifiedMetadata(metadata)) {
      return renderGabaritoGamified(metadata);
    }

    return (
      <div className="p-4 bg-muted rounded-lg text-sm italic">Gabarito não disponível para este tipo de questão.</div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
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

        <div className="space-y-4">
          <div className="font-medium text-base leading-relaxed">{question.question}</div>

          {renderQuestionContent()}

          {canFlip && (
            <Dialog open={showGabarito} onOpenChange={setShowGabarito}>
              <DialogTrigger asChild>
                <div className="flex items-center justify-center pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Ver Gabarito
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gabarito - {getQuestionTypeLabel()}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">{renderGabaritoContent()}</div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
