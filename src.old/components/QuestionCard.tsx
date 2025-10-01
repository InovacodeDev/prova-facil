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
    
    const answersText = question.answers
      .map((a, i) => `${String.fromCharCode(97 + i)}) ${a.answer}`)
      .join("\n");
    
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
    <div className="perspective-1000">
      <Card
        className={cn(
          "cursor-pointer transition-all duration-500 transform-style-preserve-3d hover:shadow-lg",
          isFlipped && "rotate-y-180"
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <CardContent className="p-6">
          <div className={cn("backface-hidden", isFlipped && "hidden")}>
            {/* Frente do card */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-foreground leading-relaxed flex-1">
                  {question.question}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {question.answers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className="p-3 bg-muted rounded-lg text-sm"
                  >
                    <span className="font-semibold mr-2">
                      {String.fromCharCode(97 + index)})
                    </span>
                    {answer.answer}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cn("backface-hidden rotate-y-180", !isFlipped && "hidden")}>
            {/* Verso do card */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-foreground leading-relaxed flex-1">
                  {question.question}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {question.answers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={cn(
                      "p-3 rounded-lg text-sm transition-all",
                      answer.is_correct
                        ? "bg-green-500/20 border-2 border-green-500 font-medium"
                        : "bg-muted/50 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {String.fromCharCode(97 + index)})
                      </span>
                      <span className="flex-1">{answer.answer}</span>
                      {answer.is_correct && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
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
