// import { useState } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Clipboard, Check, Copy, ArrowRight } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
// import { cn } from '@/lib/utils';
// import { track } from '@vercel/analytics';
// import {
//   hasCorrectAnswers,
//   isMultipleChoiceMetadata,
//   isTrueFalseMetadata,
//   isSumMetadata,
//   isMatchingColumnsMetadata,
//   isFillInTheBlankMetadata,
//   isOpenMetadata,
//   isProblemSolvingMetadata,
//   isEssayMetadata,
//   isProjectBasedMetadata,
//   isGamifiedMetadata,
//   isSummativeMetadata,
//   type QuestionMetadata,
// } from '@/lib/question-metadata-types';

// interface Question {
//   id: string;
//   question: string;
//   type: string;
//   copy_count: number;
//   metadata: QuestionMetadata;
// }

// interface QuestionCardProps {
//   question: Question;
// }

// export const QuestionCard = ({ question }: QuestionCardProps) => {
//   const [isFlipped, setIsFlipped] = useState(false);
//   const [copyCount, setCopyCount] = useState(question.copy_count);
//   const { toast } = useToast();
//   const metadata = question.metadata || {};
//   const canFlip = hasCorrectAnswers(question.type);

//   const handleCopy = async (e: React.MouseEvent) => {
//     e.stopPropagation();

//     let textToCopy = `${question.question}\n\n`;

//     const content = getQuestionContent();
//     const metadata = question.metadata || {};

//     // Format text based on question type
//     switch (question.type) {
//       case 'multiple_choice':
//         if (Array.isArray(content)) {
//           textToCopy += content
//             .map((item: any, i: number) => `${String.fromCharCode(97 + i)}) ${item.answer}`)
//             .join('\n');
//         }
//         break;

//       case 'true_false':
//         if (Array.isArray(content)) {
//           textToCopy += content.map((item: any) => `( ) ${item.statement}`).join('\n');
//         }
//         break;

//       case 'matching_columns':
//         if (content.columnA && content.columnB) {
//           textToCopy += 'Coluna A:\n';
//           textToCopy += content.columnA.map((item: any) => `${item.id}) ${item.text}`).join('\n');
//           textToCopy += '\n\nColuna B:\n';
//           textToCopy += content.columnB.map((item: any) => `${item.id}) ${item.text}`).join('\n');
//         }
//         break;

//       case 'fill_in_the_blank':
//         textToCopy += content.text || question.question;
//         break;

//       case 'sum':
//         if (Array.isArray(content)) {
//           textToCopy += content
//             .map((item: any, i: number) => `${String.fromCharCode(65 + i)}) ${item.statement}`)
//             .join('\n');
//         }
//         break;

//       case 'open':
//       case 'essay':
//       case 'problem_solving':
//         if (Array.isArray(content)) {
//           textToCopy += '\nCritérios de avaliação:\n';
//           textToCopy += content.map((c: any) => `- ${c}`).join('\n');
//         } else if (question.answers.length > 0) {
//           textToCopy += question.answers[0]?.answer || '';
//         }
//         break;

//       case 'project_based':
//         if (content.phases) {
//           textToCopy += '\nFases:\n';
//           textToCopy += content.phases.map((p: any) => `- ${p}`).join('\n');
//         }
//         if (content.deliverables) {
//           textToCopy += '\n\nEntregáveis:\n';
//           textToCopy += content.deliverables.map((d: any) => `- ${d}`).join('\n');
//         }
//         break;

//       case 'gamified':
//         textToCopy += `\nCenário: ${content.scenario}\n\nDesafios:\n`;
//         textToCopy += content.challenges.map((c: any, i: number) => `${i + 1}. ${c}`).join('\n');
//         break;

//       case 'summative':
//         if (content.sections) {
//           content.sections.forEach((section: any) => {
//             textToCopy += `\n${section.title}:\n`;
//             textToCopy += section.questions.map((q: any, i: number) => `${i + 1}. ${q}`).join('\n');
//           });
//         }
//         break;

//       default:
//         if (Array.isArray(question.answers)) {
//           textToCopy += question.answers
//             .map((a: any, i: number) => {
//               if (question.type === 'open') return a.answer;
//               return `${a.number ? a.number : String.fromCharCode(97 + i)}) ${a.answer}`;
//             })
//             .join('\n');
//         }
//     }

//     try {
//       await navigator.clipboard.writeText(textToCopy);

//       // Track evento de cópia (Vercel Analytics)
//       track('question_copied', {
//         questionType: question.type,
//       });

//       // Registrar cópia no backend
//       try {
//         const response = await fetch('/api/copy-question', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ questionId: question.id }),
//         });

//         const data = await response.json();
//         if (data.success && data.copy_count !== undefined) {
//           setCopyCount(data.copy_count);
//         }
//       } catch (apiError) {
//         console.error('Error tracking copy:', apiError);
//         // Não falhar a cópia por erro no tracking
//       }

//       toast({
//         title: 'Copiado!',
//         description: 'Questão copiada para a área de transferência.',
//       });
//     } catch (error) {
//       toast({
//         title: 'Erro',
//         description: 'Não foi possível copiar a questão.',
//         variant: 'destructive',
//       });
//     }
//   };

//   const renderQuestionContent = () => {
//     const content = getQuestionContent();
//     const metadata = question.metadata || {};

//     switch (question.type) {
//       case 'multiple_choice':
//         if (Array.isArray(content) && content.length > 0) {
//           return (
//             <div className="space-y-2">
//               {content.map((item: any, index: number) => (
//                 <div
//                   key={index}
//                   className={cn(
//                     'p-3 bg-muted rounded-lg text-sm transition-all',
//                     isFlipped && !item.is_correct && 'opacity-40'
//                   )}
//                 >
//                   <span className="font-semibold mr-2">{String.fromCharCode(97 + index)})</span>
//                   {item.answer}
//                 </div>
//               ))}
//             </div>
//           );
//         }
//         break;

//       case 'true_false':
//         if (Array.isArray(content) && content.length > 0) {
//           return (
//             <div className="space-y-2">
//               <p className="text-xs text-muted-foreground mb-3">Marque V para Verdadeiro e F para Falso:</p>
//               {content.map((item: any, index: number) => (
//                 <div
//                   key={index}
//                   className={cn(
//                     'p-3 bg-muted rounded-lg text-sm transition-all',
//                     isFlipped && !item.is_correct && 'opacity-40'
//                   )}
//                 >
//                   <span className="font-semibold mr-2">{isFlipped ? (item.is_correct ? 'V' : 'F') : '( )'}</span>
//                   {item.statement}
//                 </div>
//               ))}
//             </div>
//           );
//         }
//         break;

//       case 'matching_columns':
//         if (content.columnA && content.columnB) {
//           return (
//             <div className="space-y-4">
//               <div>
//                 <p className="text-xs font-semibold text-muted-foreground mb-2">Coluna A:</p>
//                 <div className="space-y-2">
//                   {content.columnA.map((item: any) => (
//                     <div key={item.id} className="p-2 bg-muted rounded text-sm">
//                       <span className="font-semibold mr-2">{item.id})</span>
//                       {item.text}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div>
//                 <p className="text-xs font-semibold text-muted-foreground mb-2">Coluna B:</p>
//                 <div className="space-y-2">
//                   {content.columnB.map((item: any) => (
//                     <div key={item.id} className="p-2 bg-muted rounded text-sm">
//                       <span className="font-semibold mr-2">{item.id})</span>
//                       {item.text}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               {isFlipped && content.matches && (
//                 <div className="mt-4 pt-4 border-t border-border">
//                   <p className="text-xs font-semibold text-muted-foreground mb-2">Gabarito:</p>
//                   <div className="space-y-1">
//                     {content.matches.map((match: any, i: number) => (
//                       <div key={i} className="flex items-center gap-2 text-sm">
//                         <span className="font-semibold">{match.from_id}</span>
//                         <ArrowRight className="h-3 w-3 text-muted-foreground" />
//                         <span className="font-semibold">{match.to_id}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         }
//         break;

//       case 'fill_in_the_blank':
//         return (
//           <div className="space-y-3">
//             <p className="text-sm bg-muted p-3 rounded-lg">{content.text || question.question}</p>
//             {isFlipped && content.blanks && (
//               <div className="mt-4 pt-4 border-t border-border">
//                 <p className="text-xs font-semibold text-muted-foreground mb-2">Respostas:</p>
//                 <div className="space-y-1">
//                   {content.blanks.map((blank: any, i: number) => (
//                     <div key={i} className="text-sm p-2 bg-muted rounded">
//                       <span className="font-semibold mr-2">{i + 1}.</span>
//                       {blank.answer || blank}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         );

//       case 'sum':
//         if (Array.isArray(content) && content.length > 0) {
//           return (
//             <div className="space-y-2">
//               <p className="text-xs text-muted-foreground mb-3">Marque as afirmativas corretas e some seus valores:</p>
//               {content.map((item: any, index: number) => (
//                 <div
//                   key={index}
//                   className={cn(
//                     'p-3 bg-muted rounded-lg text-sm transition-all',
//                     isFlipped && !item.is_correct && 'opacity-40'
//                   )}
//                 >
//                   <span className="font-semibold mr-2">
//                     {String.fromCharCode(65 + index)}) ({Math.pow(2, index)})
//                   </span>
//                   {item.statement}
//                 </div>
//               ))}
//               {isFlipped && (
//                 <div className="mt-4 pt-4 border-t border-border">
//                   <p className="text-sm font-semibold">
//                     Soma correta:{' '}
//                     {content
//                       .map((item: any, i: number) => (item.is_correct ? Math.pow(2, i) : 0))
//                       .reduce((a: number, b: number) => a + b, 0)}
//                   </p>
//                 </div>
//               )}
//             </div>
//           );
//         }
//         break;

//       case 'open':
//       case 'essay':
//       case 'problem_solving':
//         return (
//           <div className="space-y-3">
//             <div className="p-3 bg-muted rounded-lg text-sm italic">
//               Resposta dissertativa (avalie conforme critérios estabelecidos)
//             </div>
//             {isFlipped && content && (
//               <div className="mt-4 pt-4 border-t border-border">
//                 <p className="text-xs font-semibold text-muted-foreground mb-2">
//                   {question.type === 'open'
//                     ? 'Resposta esperada:'
//                     : question.type === 'problem_solving'
//                     ? 'Guia de resolução:'
//                     : 'Critérios de avaliação:'}
//                 </p>
//                 {typeof content === 'string' ? (
//                   <div className="text-sm p-3 bg-muted rounded-lg">{content}</div>
//                 ) : Array.isArray(content) && content.length > 0 ? (
//                   <ul className="space-y-1 text-sm">
//                     {content.map((criterion: any, i: number) => (
//                       <li key={i} className="flex gap-2">
//                         <span className="text-muted-foreground">•</span>
//                         <span>
//                           {typeof criterion === 'string'
//                             ? criterion
//                             : criterion.text || criterion.content || JSON.stringify(criterion)}
//                         </span>
//                       </li>
//                     ))}
//                   </ul>
//                 ) : null}
//               </div>
//             )}
//           </div>
//         );

//       case 'project_based':
//         return (
//           <div className="space-y-3">
//             {content.phases && content.phases.length > 0 && (
//               <div>
//                 <p className="text-xs font-semibold text-muted-foreground mb-2">Fases do projeto:</p>
//                 <div className="space-y-2">
//                   {content.phases.map((phase: any, i: number) => (
//                     <div key={i} className="p-2 bg-muted rounded-lg text-sm">
//                       <span className="font-semibold mr-2">{i + 1}.</span>
//                       {typeof phase === 'string' ? phase : phase.description}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//             {isFlipped && content.deliverables && content.deliverables.length > 0 && (
//               <div className="mt-4 pt-4 border-t border-border">
//                 <p className="text-xs font-semibold text-muted-foreground mb-2">Entregáveis:</p>
//                 <ul className="space-y-1 text-sm">
//                   {content.deliverables.map((item: any, i: number) => (
//                     <li key={i} className="flex gap-2">
//                       <span className="text-muted-foreground">•</span>
//                       <span>{typeof item === 'string' ? item : item.description}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>
//         );

//       case 'gamified':
//         return (
//           <div className="space-y-3">
//             {content.scenario && (
//               <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
//                 <p className="font-semibold text-primary mb-1">🎮 Cenário:</p>
//                 <p>{content.scenario}</p>
//               </div>
//             )}
//             {content.challenges && content.challenges.length > 0 && (
//               <div>
//                 <p className="text-xs font-semibold text-muted-foreground mb-2">Desafios:</p>
//                 <div className="space-y-2">
//                   {content.challenges.map((challenge: any, i: number) => (
//                     <div key={i} className="p-2 bg-muted rounded-lg text-sm">
//                       <span className="font-semibold mr-2">{i + 1}.</span>
//                       {typeof challenge === 'string' ? challenge : challenge.description}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         );

//       case 'summative':
//         return (
//           <div className="space-y-3">
//             {content.sections && content.sections.length > 0 ? (
//               content.sections.map((section: any, i: number) => (
//                 <div key={i} className="space-y-2">
//                   <p className="text-xs font-semibold text-muted-foreground">{section.title}</p>
//                   <div className="space-y-2">
//                     {section.questions &&
//                       section.questions.map((q: any, j: number) => (
//                         <div key={j} className="p-2 bg-muted rounded-lg text-sm">
//                           <span className="font-semibold mr-2">{j + 1}.</span>
//                           {typeof q === 'string' ? q : q.question}
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="p-3 bg-muted rounded-lg text-sm">Avaliação somativa (múltiplas seções e critérios)</div>
//             )}
//           </div>
//         );

//       default:
//         // Fallback to answers table
//         if (question.answers && question.answers.length > 0) {
//           return (
//             <div className="space-y-2">
//               {question.answers.map((answer, index) => (
//                 <div
//                   key={answer.id}
//                   className={cn(
//                     'p-3 bg-muted rounded-lg text-sm transition-all',
//                     isFlipped && !answer.is_correct && 'opacity-40'
//                   )}
//                 >
//                   {question.type === 'open' ? null : (
//                     <span className="font-semibold mr-2">
//                       {answer.number ? answer.number : `${String.fromCharCode(97 + index)})`}
//                     </span>
//                   )}
//                   {answer.answer}
//                 </div>
//               ))}
//             </div>
//           );
//         }
//     }

//     return null;
//   };

//   return (
//     <div className="perspective-1000 relative" style={{ perspective: '1000px' }}>
//       {/* Badge de copy count - posicionada fora do card, estilo notificação */}
//       {copyCount > 0 && (
//         <div className="absolute -top-2 -right-2 z-20">
//           <Badge variant="secondary" className="flex items-center gap-1 shadow-lg border-2 border-background">
//             <Copy className="h-3 w-3" />
//             <span className="text-xs font-semibold">{copyCount}</span>
//           </Badge>
//         </div>
//       )}

//       {/* Type badge - top left */}
//       <div className="absolute -top-2 -left-2 z-20">
//         <Badge variant="outline" className="text-xs bg-background">
//           {question.type.replace(/_/g, ' ')}
//         </Badge>
//       </div>

//       <Card
//         className={cn('cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]', 'relative')}
//         style={{
//           transformStyle: 'preserve-3d',
//         }}
//         onClick={() => setIsFlipped(!isFlipped)}
//       >
//         <CardContent className="p-6">
//           {/* Frente do card */}
//           {!isFlipped && (
//             <div className="space-y-4">
//               <div className="flex items-start justify-between gap-4">
//                 <p className="font-medium text-foreground leading-relaxed flex-1">{question.question}</p>
//                 <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
//                   <Clipboard className="h-4 w-4" />
//                 </Button>
//               </div>
//               {renderQuestionContent()}
//             </div>
//           )}

//           {/* Verso do card */}
//           {isFlipped && (
//             <div className="space-y-4">
//               <div className="flex items-start justify-between gap-4">
//                 <div className="flex-1">
//                   <p className="font-medium text-foreground leading-relaxed mb-2">{question.question}</p>
//                   <Badge variant="secondary" className="text-xs">
//                     Gabarito
//                   </Badge>
//                 </div>
//                 <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
//                   <Clipboard className="h-4 w-4" />
//                 </Button>
//               </div>
//               {renderQuestionContent()}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };
