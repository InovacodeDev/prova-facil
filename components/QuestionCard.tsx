import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clipboard, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { track } from "@vercel/analytics";

interface Answer {
    id: string;
    answer: string;
    is_correct: boolean;
    number: number | null;
}

interface Question {
    id: string;
    question: string;
    type: string;
    copy_count: number;
    answers: Answer[];
}

interface QuestionCardProps {
    question: Question;
}

export const QuestionCard = ({ question }: QuestionCardProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [copyCount, setCopyCount] = useState(question.copy_count);
    const { toast } = useToast();

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const answersText = question.answers.map((a, i) => `${String.fromCharCode(97 + i)}) ${a.answer}`).join("\n");

        const textToCopy = `${question.question}\n\n${answersText}`;

        try {
            await navigator.clipboard.writeText(textToCopy);

            // Track evento de cópia (Vercel Analytics)
            track("question_copied", {
                questionType: question.type,
            });

            // Registrar cópia no backend
            try {
                const response = await fetch("/api/copy-question", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ questionId: question.id }),
                });

                const data = await response.json();
                if (data.success && data.copy_count !== undefined) {
                    setCopyCount(data.copy_count);
                }
            } catch (apiError) {
                console.error("Error tracking copy:", apiError);
                // Não falhar a cópia por erro no tracking
            }

            toast({
                title: "Copiado!",
                description: "Questão copiada para a área de transferência.",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível copiar a questão.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="perspective-1000 relative" style={{ perspective: "1000px" }}>
            {/* Badge de copy count - posicionada fora do card, estilo notificação */}
            {copyCount > 0 && (
                <div className="absolute -top-2 -right-2 z-20">
                    <Badge variant="secondary" className="flex items-center gap-1 shadow-lg border-2 border-background">
                        <Copy className="h-3 w-3" />
                        <span className="text-xs font-semibold">{copyCount}</span>
                    </Badge>
                </div>
            )}

            <Card
                className={cn("cursor-pointer transition-transform duration-500 hover:shadow-lg", "relative")}
                style={{
                    transformStyle: "preserve-3d",
                    // transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <CardContent className="p-6" style={{ backfaceVisibility: "hidden" }}>
                    <div style={{ backfaceVisibility: "hidden" }} className={cn(isFlipped && "hidden")}>
                        {/* Frente do card */}
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <p className="font-medium text-foreground leading-relaxed flex-1">
                                    {question.question}
                                </p>
                                <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
                                    <Clipboard className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {question.answers.map((answer, index) => (
                                    <div key={answer.id} className="p-3 bg-muted rounded-lg text-sm">
                                        {question.type === "open" ? null : (
                                            <span className="font-semibold mr-2">
                                                {answer.number ? answer.number : `${String.fromCharCode(97 + index)})`}
                                            </span>
                                        )}
                                        {answer.answer}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            backfaceVisibility: "hidden",
                            position: isFlipped ? "relative" : "absolute",
                            top: isFlipped ? "auto" : 0,
                            left: isFlipped ? "auto" : 0,
                            width: isFlipped ? "auto" : "100%",
                        }}
                        className={cn(!isFlipped && "hidden")}
                    >
                        {/* Verso do card */}
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <p className="font-medium text-foreground leading-relaxed flex-1">
                                    {question.question}
                                </p>
                                <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
                                    <Clipboard className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {question.answers.map((answer, index) => (
                                    <div
                                        key={answer.id}
                                        className={cn(
                                            "p-3 bg-muted rounded-lg text-sm transition-all",
                                            !answer.is_correct && "opacity-40"
                                        )}
                                    >
                                        {question.type === "open" ? null : (
                                            <span className="font-semibold mr-2">
                                                {answer.number ? answer.number : `${String.fromCharCode(97 + index)})`}
                                            </span>
                                        )}
                                        <span>{answer.answer}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
