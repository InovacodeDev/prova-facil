import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Answer {
    id: string;
    answer: string;
    is_correct: boolean;
    number: number | null;
}

interface Question {
    id: string;
    question: string;
    answers: Answer[];
}

interface QuestionCardProps {
    question: Question;
}

export const QuestionCard = ({ question }: QuestionCardProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const { toast } = useToast();

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const answersText = question.answers.map((a, i) => `${String.fromCharCode(97 + i)}) ${a.answer}`).join("\n");

        const textToCopy = `${question.question}\n\n${answersText}`;

        try {
            await navigator.clipboard.writeText(textToCopy);
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
        <div className="perspective-1000" style={{ perspective: "1000px" }}>
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
                                        <span className="font-semibold mr-2">{String.fromCharCode(97 + index)})</span>
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
                                        <span className="font-semibold mr-2">{String.fromCharCode(97 + index)})</span>
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
