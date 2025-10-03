# Guia de Integração - Sistema de Questões com Metadata

## 🎯 Objetivo

Este guia mostra como integrar o novo sistema de questões baseado em metadata com o fluxo de geração de questões existente.

---

## 1️⃣ Aplicar a Migration

### Passo 1: Execute a migration SQL

```bash
# Opção 1: Via Supabase CLI (recomendado)
supabase db push

# Opção 2: Via psql direto
psql -h <SUPABASE_HOST> -U postgres -d postgres < db/migrations/0012_add_metadata_and_new_question_types.sql
```

### Passo 2: Verifique a migration

```sql
-- Conecte ao banco e verifique
\d questions;  -- Deve mostrar coluna metadata

-- Verifique os novos tipos
SELECT unnest(enum_range(NULL::question_type));
-- Deve listar todos os 11 tipos incluindo project_based, gamified, summative
```

---

## 2️⃣ Atualizar a Geração de Questões

### No arquivo: `/app/api/generate-questions/route.ts`

#### Passo 1: Importar novos prompts

```typescript
import {
    generateMultipleChoicePrompt,
    generateTrueFalsePrompt,
    generateOpenPrompt,
    generateSumPrompt,
    generateFillInTheBlankPrompt,
    generateMatchingColumnsPrompt,
    generateProblemSolvingPrompt,
    generateEssayPrompt,
    generateProjectBasedPrompt, // NOVO
    generateGamifiedPrompt, // NOVO
    generateSummativePrompt, // NOVO
} from "@/lib/genkit/prompts";
```

#### Passo 2: Adicionar validação de quota

```typescript
import { checkUserQuota } from "@/lib/usage-tracking";
import { validateQuestionType } from "@/lib/validators/question";

export async function POST(request: Request) {
    try {
        const { user } = await supabase.auth.getUser();
        const body = await request.json();
        const { questionType, count } = body;

        // Validar quota
        const hasQuota = await checkUserQuota(user.id, count);
        if (!hasQuota) {
            return NextResponse.json(
                { error: "Você atingiu o limite de questões do seu plano" },
                { status: 403 }
            );
        }

        // Validar tipo de questão
        const validation = await validateQuestionType(user.id, questionType);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 403 }
            );
        }

        // Continuar com geração...
    }
}
```

#### Passo 3: Usar prompt correto baseado no tipo

```typescript
// Mapeamento de tipo para prompt
const promptMap = {
    multiple_choice: generateMultipleChoicePrompt,
    true_false: generateTrueFalsePrompt,
    open: generateOpenPrompt,
    sum: generateSumPrompt,
    fill_in_the_blank: generateFillInTheBlankPrompt,
    matching_columns: generateMatchingColumnsPrompt,
    problem_solving: generateProblemSolvingPrompt,
    essay: generateEssayPrompt,
    project_based: generateProjectBasedPrompt,
    gamified: generateGamifiedPrompt,
    summative: generateSummativePrompt,
};

const promptFunction = promptMap[questionType];
if (!promptFunction) {
    return NextResponse.json({ error: "Tipo de questão inválido" }, { status: 400 });
}

const prompt = promptFunction(subject, count, academicLevel, questionContext, documentContent);
```

#### Passo 4: Salvar questões com metadata

```typescript
// Após gerar questões com IA
const generatedQuestions = await generateWithAI(prompt);

// Salvar no banco com metadata
for (const q of generatedQuestions.questions) {
    await db.insert(questions).values({
        assessment_id: assessmentId,
        type: questionType,
        question: q.question,
        metadata: q.metadata, // ← Salvar metadata diretamente
        created_at: new Date(),
    });
}
```

---

## 3️⃣ Atualizar Interface de Criação

### No arquivo: `/app/new-assessment/page.tsx`

#### Passo 1: Buscar tipos permitidos

```typescript
import { getAllowedQuestionTypes } from "@/lib/validators/question";

const [allowedTypes, setAllowedTypes] = useState<string[]>([]);

useEffect(() => {
    const fetchAllowedTypes = async () => {
        const types = await getAllowedQuestionTypes(user.id);
        setAllowedTypes(types);
    };
    fetchAllowedTypes();
}, [user]);
```

#### Passo 2: Filtrar opções de seleção

```typescript
const questionTypeOptions = [
    { value: "multiple_choice", label: "Múltipla Escolha" },
    { value: "true_false", label: "Verdadeiro/Falso" },
    { value: "open", label: "Dissertativa" },
    { value: "sum", label: "Somatória" },
    { value: "fill_in_the_blank", label: "Preencher Lacunas" },
    { value: "matching_columns", label: "Associação de Colunas" },
    { value: "problem_solving", label: "Resolução de Problemas" },
    { value: "essay", label: "Redação" },
    { value: "project_based", label: "Baseada em Projeto" },
    { value: "gamified", label: "Gamificada" },
    { value: "summative", label: "Avaliação Somativa" },
].filter((option) => allowedTypes.includes(option.value));
```

#### Passo 3: Adicionar tooltip para tipos bloqueados

```typescript
<Select value={questionType} onValueChange={setQuestionType}>
    <SelectTrigger>
        <SelectValue placeholder="Selecione o tipo" />
    </SelectTrigger>
    <SelectContent>
        {questionTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
                {option.label}
            </SelectItem>
        ))}
        {/* Mostrar tipos bloqueados como disabled */}
        {!allowedTypes.includes("project_based") && (
            <SelectItem value="project_based" disabled>
                Baseada em Projeto (Upgrade necessário) 🔒
            </SelectItem>
        )}
    </SelectContent>
</Select>
```

---

## 4️⃣ Atualizar Exibição de Questões

### No arquivo: `/components/QuestionCard.tsx`

#### Passo 1: Renderizar baseado em metadata

```typescript
interface QuestionCardProps {
    question: {
        id: string;
        type: string;
        question: string;
        metadata: any;
    };
}

export function QuestionCard({ question }: QuestionCardProps) {
    const renderAnswers = () => {
        switch (question.type) {
            case "multiple_choice":
            case "true_false":
                return (
                    <div className="space-y-2">
                        {question.metadata.answers.map((answer: any, i: number) => (
                            <div
                                key={i}
                                className={`p-2 rounded ${
                                    answer.is_correct ? "bg-green-100 border-green-300" : "bg-gray-50"
                                }`}
                            >
                                {answer.answer}
                                {answer.is_correct && <span className="ml-2">✓</span>}
                            </div>
                        ))}
                    </div>
                );

            case "fill_in_the_blank":
                return (
                    <div>
                        <h4 className="font-semibold mb-2">Respostas:</h4>
                        {question.metadata.blanks.map((blank: any, i: number) => (
                            <div key={i} className="mb-1">
                                <span className="font-mono bg-blue-100 px-2 py-1 rounded">{blank.id}</span>: {blank.correct_answer}
                            </div>
                        ))}
                        {question.metadata.options_bank && (
                            <div className="mt-3">
                                <h5 className="text-sm font-semibold">Banco de Opções:</h5>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {question.metadata.options_bank.map((opt: string, i: number) => (
                                        <span key={i} className="bg-gray-200 px-2 py-1 rounded text-sm">
                                            {opt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "sum":
                return (
                    <div>
                        <h4 className="font-semibold mb-2">Afirmativas:</h4>
                        {question.metadata.statements.map((stmt: any, i: number) => (
                            <div key={i} className="mb-2 flex items-start gap-2">
                                <span className="font-bold">{String(stmt.value).padStart(2, "0")})</span>
                                <span className={stmt.is_correct ? "text-green-700" : ""}>
                                    {stmt.statement}
                                    {stmt.is_correct && " ✓"}
                                </span>
                            </div>
                        ))}
                        <div className="mt-3 p-2 bg-green-50 rounded">
                            <strong>Resposta:</strong> {question.metadata.correct_sum}
                        </div>
                    </div>
                );

            case "project_based":
                return (
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold">Questão Norteadora:</h4>
                            <p className="text-gray-700">{question.metadata.guiding_question}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Objetivos:</h4>
                            <ul className="list-disc list-inside">
                                {question.metadata.learning_objectives.map((obj: string, i: number) => (
                                    <li key={i}>{obj}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold">Produto Final:</h4>
                            <p>{question.metadata.final_product_description}</p>
                        </div>
                    </div>
                );

            case "gamified":
                return (
                    <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded">
                            <h4 className="font-semibold text-purple-900">Narrativa:</h4>
                            <p className="text-purple-800">{question.metadata.narrative}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Níveis:</h4>
                            {question.metadata.levels.map((level: any, i: number) => (
                                <div key={i} className="mb-2 p-2 bg-gray-50 rounded">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Nível {level.level_number}</span>
                                        <span className="text-sm text-gray-600">{level.points} pts</span>
                                    </div>
                                    <p className="text-sm mt-1">{level.challenge}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "summative":
                return (
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold">Objetivos Avaliados:</h4>
                            <ul className="list-disc list-inside">
                                {question.metadata.learning_objectives.map((obj: string, i: number) => (
                                    <li key={i}>{obj}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold">Critérios de Avaliação:</h4>
                            {question.metadata.evaluation_criteria.map((crit: any, i: number) => (
                                <div key={i} className="p-2 bg-blue-50 rounded mb-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{crit.criterion}</span>
                                        <span className="text-sm text-blue-700">{crit.weight}%</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{crit.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "open":
                return (
                    <div className="p-3 bg-gray-50 rounded">
                        <h4 className="font-semibold mb-2">Resposta Esperada:</h4>
                        <p className="text-gray-700">{question.metadata.expected_answer}</p>
                    </div>
                );

            default:
                return <p className="text-gray-500">Tipo de questão não suportado</p>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{question.question}</CardTitle>
                    <Badge variant="outline">{question.type}</Badge>
                </div>
            </CardHeader>
            <CardContent>{renderAnswers()}</CardContent>
        </Card>
    );
}
```

---

## 5️⃣ Testar o Sistema

### Teste 1: Criar questão de tipo novo

```bash
# Acesse: http://localhost:8800/new-assessment
# Selecione tipo "Baseada em Projeto"
# Gere algumas questões
```

### Teste 2: Verificar quota

```bash
# Acesse: http://localhost:8800/usage
# Deve mostrar gráfico de pizza com distribuição
```

### Teste 3: Validação de plano

```bash
# Com um usuário do plano Starter:
# Tente criar questão tipo "project_based"
# Deve receber erro: "não está disponível no plano starter"
```

---

## 6️⃣ Checklist de Integração

-   [ ] Migration aplicada no banco
-   [ ] Novos tipos aparecem no enum
-   [ ] API de generate-questions validando quota
-   [ ] API de generate-questions validando tipo
-   [ ] Prompts sendo usados corretamente
-   [ ] Questões sendo salvas com metadata
-   [ ] Página de uso funcionando
-   [ ] Gráfico de pizza renderizando
-   [ ] QuestionCard renderizando todos os tipos
-   [ ] Seleção de tipo filtrando por plano

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique logs do servidor: `pnpm dev`
2. Verifique console do navegador
3. Verifique tabela questions no banco: `SELECT * FROM questions LIMIT 5;`
4. Verifique se migration foi aplicada: `\d questions;`

---

**Boa integração! 🚀**
