import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BookOpen, Upload, ArrowLeft, FileText, Loader2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { value: "mathematics", label: "Matemática" },
  { value: "portuguese", label: "Português" },
  { value: "history", label: "História" },
  { value: "geography", label: "Geografia" },
  { value: "science", label: "Ciências" },
  { value: "arts", label: "Artes" },
  { value: "english", label: "Inglês" },
  { value: "literature", label: "Literatura" },
  { value: "physics", label: "Física" },
  { value: "chemistry", label: "Química" },
  { value: "biology", label: "Biologia" },
  { value: "philosophy", label: "Filosofia" },
  { value: "sociology", label: "Sociologia" },
  { value: "spanish", label: "Espanhol" },
];

const QUESTION_TYPES = [
  { id: "multiple_choice", label: "Múltipla escolha" },
  { id: "true_false", label: "Verdadeiro ou Falso" },
  { id: "open", label: "Aberta ou Dissertativa" },
  { id: "sum", label: "Somatória" },
];

const NewAssessment = () => {
  const [content, setContent] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Buscar títulos de avaliações existentes
  useEffect(() => {
    const fetchAssessmentTitles = async () => {
      try {
        const { data, error } = await supabase
          .from("assessments")
          .select("title")
          .not("title", "is", null);

        if (error) throw error;

        const titles = data
          .map((item) => item.title)
          .filter((title): title is string => title !== null && title.trim() !== "");
        
        // Remove duplicatas
        const uniqueTitles = Array.from(new Set(titles));
        setSuggestions(uniqueTitles);
      } catch (error) {
        console.error("Erro ao buscar títulos:", error);
      }
    };

    fetchAssessmentTitles();
  }, []);

  // Filtrar sugestões baseado no input
  useEffect(() => {
    if (content.trim()) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(content.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [content, suggestions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = selectedFiles.filter((file) => validTypes.includes(file.type));
    
    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF, PPT, PPTX, DOC e DOCX são permitidos.",
        variant: "destructive",
      });
      return;
    }

    const totalSize = [...files, ...validFiles].reduce((acc, file) => acc + file.size, 0);
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (totalSize > maxSize) {
      toast({
        title: "Erro",
        description: "O tamanho total dos arquivos não pode exceder 50MB.",
        variant: "destructive",
      });
      return;
    }

    setFiles([...files, ...validFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const toggleQuestionType = (typeId: string) => {
    setQuestionTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "O conteúdo das questões é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!subject) {
      toast({
        title: "Erro",
        description: "Selecione uma matéria.",
        variant: "destructive",
      });
      return;
    }

    if (questionTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de questão.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar questões.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // TODO: Integrar com IA para gerar questões
      toast({
        title: "Sucesso",
        description: `${questionCount} questões de ${SUBJECTS.find(s => s.value === subject)?.label} serão geradas!`,
      });

      navigate("/my-assessments");
    } catch (error: any) {
      console.error("Erro ao criar questões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar as questões. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const isFormValid = content.trim() && subject && questionTypes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Criar Questões</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Criar Questões com IA
              </CardTitle>
              <CardDescription>
                Preencha os campos abaixo para gerar questões automaticamente com inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Conteúdo das Questões */}
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo das Questões *</Label>
                  <Popover open={showSuggestions && filteredSuggestions.length > 0} onOpenChange={setShowSuggestions}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          id="content"
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder="Ex: Segunda Guerra Mundial, Teorema de Pitágoras, Fotossíntese..."
                          required
                          autoComplete="off"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start" side="bottom">
                      <Command>
                        <CommandList>
                          <CommandEmpty>Nenhuma sugestão encontrada.</CommandEmpty>
                          <CommandGroup heading="Sugestões baseadas em avaliações anteriores">
                            {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                              <CommandItem
                                key={index}
                                value={suggestion}
                                onSelect={() => {
                                  setContent(suggestion);
                                  setShowSuggestions(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    content === suggestion ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {suggestion}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Quantidade e Matéria */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Quantidade de Questões *</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min="1"
                      max="100"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Matéria *</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a matéria" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subj) => (
                          <SelectItem key={subj.value} value={subj.value}>
                            {subj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Upload de Arquivos */}
                <div className="space-y-2">
                  <Label htmlFor="files">Importar Documentos (opcional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="space-y-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        Arraste arquivos aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, PPT, PPTX, DOC ou DOCX - Máximo 50MB total
                      </p>
                      <Input
                        id="files"
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("files")?.click()}
                      >
                        Selecionar Arquivos
                      </Button>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-muted p-2 rounded"
                          >
                            <span className="text-sm truncate flex-1">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4 italic">
                      * Os documentos são usados apenas para gerar as questões e não ficam salvos
                    </p>
                  </div>
                </div>

                {/* Tipos de Questões */}
                <div className="space-y-2">
                  <Label>Tipos de Questões *</Label>
                  <div className="space-y-3">
                    {QUESTION_TYPES.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={questionTypes.includes(type.id)}
                          onCheckedChange={() => toggleQuestionType(type.id)}
                        />
                        <Label
                          htmlFor={type.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading || !isFormValid}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Questões...
                      </>
                    ) : (
                      "Gerar Questões"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewAssessment;