# Academic Level Filtering - Implementation Guide

## Overview

This guide provides step-by-step instructions to implement question type and context filtering based on academic levels.

## Background

The database already has:

-   ✅ `academic_levels` table with allowed_question_types and allowed_question_contexts arrays
-   ✅ `academic_levels_question_types` normalized relation table
-   ✅ `academic_levels_question_contexts` normalized relation table
-   ✅ `profiles.academic_level_id` foreign key to academic_levels

## Task: Filter Questions by Academic Level

### Step 1: Create Academic Level Query Helper

Create `/lib/helpers/academic-level.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";

export async function getUserAcademicLevel(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("academic_level_id, academic_levels(allowed_question_types, allowed_question_context)")
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function getAcademicLevelQuestionTypes(academicLevelId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("academic_levels")
        .select("allowed_question_types")
        .eq("id", academicLevelId)
        .single();

    if (error || !data) {
        return [];
    }

    return data.allowed_question_types;
}

export async function getAcademicLevelContexts(academicLevelId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("academic_levels")
        .select("allowed_question_context")
        .eq("id", academicLevelId)
        .single();

    if (error || !data) {
        return [];
    }

    return data.allowed_question_context;
}
```

### Step 2: Update Question Generation API

Modify `/app/api/generate-questions/route.ts`:

```typescript
import { getUserAcademicLevel } from "@/lib/helpers/academic-level";

export async function POST(request: Request) {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's academic level restrictions
    const academicLevel = await getUserAcademicLevel(user.id);

    const { questionType, questionContext, ...otherParams } = await request.json();

    // Validate question type against academic level
    if (academicLevel?.academic_levels?.allowed_question_types) {
        const allowedTypes = academicLevel.academic_levels.allowed_question_types;

        if (!allowedTypes.includes(questionType)) {
            return NextResponse.json(
                {
                    error: `Tipo de questão '${questionType}' não disponível para seu nível acadêmico. Disponíveis: ${allowedTypes.join(
                        ", "
                    )}`,
                },
                { status: 400 }
            );
        }
    }

    // Validate question context against academic level
    if (academicLevel?.academic_levels?.allowed_question_context) {
        const allowedContexts = academicLevel.academic_levels.allowed_question_context;

        if (!allowedContexts.includes(questionContext)) {
            return NextResponse.json(
                {
                    error: `Contexto '${questionContext}' não disponível para seu nível acadêmico. Disponíveis: ${allowedContexts.join(
                        ", "
                    )}`,
                },
                { status: 400 }
            );
        }
    }

    // Continue with question generation...
}
```

### Step 3: Create Question Type Filter Component

Create `/components/QuestionTypeFilter.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface QuestionType {
    id: string;
    label: string;
    description: string;
}

const ALL_QUESTION_TYPES: QuestionType[] = [
    { id: "multiple_choice", label: "Múltipla Escolha", description: "Questões com 4-5 alternativas" },
    { id: "true_false", label: "Verdadeiro/Falso", description: "Afirmações para julgar" },
    { id: "open", label: "Aberta", description: "Resposta dissertativa" },
    { id: "sum", label: "Somatório", description: "Soma de afirmações corretas" },
    { id: "fill_in_the_blank", label: "Preencher Lacunas", description: "Complete as lacunas" },
    { id: "matching_columns", label: "Relacionar Colunas", description: "Associação entre itens" },
    { id: "problem_solving", label: "Resolução de Problemas", description: "Problemas práticos" },
    { id: "essay", label: "Redação", description: "Texto dissertativo" },
];

interface Props {
    selectedType: string | null;
    onTypeSelect: (type: string) => void;
}

export function QuestionTypeFilter({ selectedType, onTypeSelect }: Props) {
    const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchAllowedTypes();
    }, []);

    const fetchAllowedTypes = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("academic_level_id, academic_levels(allowed_question_types)")
                .eq("user_id", user.id)
                .single();

            if (error) throw error;

            if (data?.academic_levels?.allowed_question_types) {
                setAllowedTypes(data.academic_levels.allowed_question_types);
            } else {
                // Default to all types if no academic level set
                setAllowedTypes(ALL_QUESTION_TYPES.map((t) => t.id));
            }
        } catch (error) {
            console.error("Error fetching allowed types:", error);
        } finally {
            setLoading(false);
        }
    };

    const isAllowed = (typeId: string) => allowedTypes.includes(typeId);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo de Questão</h3>

            {loading ? (
                <div className="text-sm text-muted-foreground">Carregando tipos disponíveis...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ALL_QUESTION_TYPES.map((type) => {
                        const allowed = isAllowed(type.id);

                        if (!allowed) {
                            return (
                                <TooltipProvider key={type.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="h-auto flex-col items-start p-3 opacity-50 cursor-not-allowed"
                                                disabled
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <span className="text-sm font-medium">{type.label}</span>
                                                    <Lock className="h-3 w-3 ml-auto" />
                                                </div>
                                                <span className="text-xs text-muted-foreground mt-1">
                                                    {type.description}
                                                </span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Tipo não disponível para seu nível acadêmico</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }

                        return (
                            <Button
                                key={type.id}
                                variant={selectedType === type.id ? "default" : "outline"}
                                className="h-auto flex-col items-start p-3"
                                onClick={() => onTypeSelect(type.id)}
                            >
                                <span className="text-sm font-medium">{type.label}</span>
                                <span className="text-xs text-muted-foreground mt-1">{type.description}</span>
                            </Button>
                        );
                    })}
                </div>
            )}

            <div className="text-xs text-muted-foreground">
                Alguns tipos de questão podem não estar disponíveis dependendo do seu nível acadêmico.
            </div>
        </div>
    );
}
```

### Step 4: Create Question Context Filter Component

Create `/components/QuestionContextFilter.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface QuestionContext {
    id: string;
    label: string;
    description: string;
}

const ALL_CONTEXTS: QuestionContext[] = [
    { id: "fixacao", label: "Fixação", description: "Conceitos básicos" },
    { id: "contextualizada", label: "Contextualizada", description: "Situações práticas" },
    { id: "teorica", label: "Teórica", description: "Fundamentação teórica" },
    { id: "estudo_caso", label: "Estudo de Caso", description: "Análise de casos" },
    { id: "discursiva_aberta", label: "Discursiva Aberta", description: "Argumentação livre" },
    { id: "letra_lei", label: "Letra da Lei", description: "Texto legal" },
    { id: "pesquisa", label: "Pesquisa", description: "Investigação científica" },
];

interface Props {
    selectedContext: string | null;
    onContextSelect: (context: string) => void;
}

export function QuestionContextFilter({ selectedContext, onContextSelect }: Props) {
    const [allowedContexts, setAllowedContexts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchAllowedContexts();
    }, []);

    const fetchAllowedContexts = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("academic_level_id, academic_levels(allowed_question_context)")
                .eq("user_id", user.id)
                .single();

            if (error) throw error;

            if (data?.academic_levels?.allowed_question_context) {
                setAllowedContexts(data.academic_levels.allowed_question_context);
            } else {
                // Default to all contexts if no academic level set
                setAllowedContexts(ALL_CONTEXTS.map((c) => c.id));
            }
        } catch (error) {
            console.error("Error fetching allowed contexts:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContexts = ALL_CONTEXTS.filter((ctx) => allowedContexts.includes(ctx.id));

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Contexto da Questão</label>

            {loading ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
                <>
                    <Select value={selectedContext || ""} onValueChange={onContextSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o contexto" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredContexts.map((context) => (
                                <SelectItem key={context.id} value={context.id}>
                                    <div>
                                        <div className="font-medium">{context.label}</div>
                                        <div className="text-xs text-muted-foreground">{context.description}</div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {filteredContexts.length < ALL_CONTEXTS.length && (
                        <p className="text-xs text-muted-foreground">
                            {ALL_CONTEXTS.length - filteredContexts.length} contexto(s) não disponível(is) para seu
                            nível acadêmico
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
```

### Step 5: Integrate Components into Question Generation Form

Update your question generation form (e.g., `/app/new-assessment/page.tsx`):

```typescript
import { QuestionTypeFilter } from "@/components/QuestionTypeFilter";
import { QuestionContextFilter } from "@/components/QuestionContextFilter";

export default function NewAssessmentPage() {
    const [questionType, setQuestionType] = useState<string | null>(null);
    const [questionContext, setQuestionContext] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <QuestionTypeFilter selectedType={questionType} onTypeSelect={setQuestionType} />

            <QuestionContextFilter selectedContext={questionContext} onContextSelect={setQuestionContext} />

            {/* Rest of form */}
        </div>
    );
}
```

### Step 6: Add Academic Level Selection in Profile

Update `/app/profile/page.tsx` to allow users to select their academic level:

```typescript
const ACADEMIC_LEVELS = [
    { id: "elementary_school", label: "Ensino Fundamental" },
    { id: "middle_school", label: "Ensino Fundamental II" },
    { id: "high_school", label: "Ensino Médio" },
    { id: "technical", label: "Técnico" },
    { id: "undergraduate", label: "Graduação" },
    { id: "specialization", label: "Especialização" },
    { id: "mba", label: "MBA" },
    { id: "masters", label: "Mestrado" },
    { id: "doctorate", label: "Doutorado" },
];

// Add academic level selector
<Select value={academicLevel} onValueChange={handleAcademicLevelChange}>
    <SelectTrigger>
        <SelectValue placeholder="Selecione seu nível acadêmico" />
    </SelectTrigger>
    <SelectContent>
        {ACADEMIC_LEVELS.map((level) => (
            <SelectItem key={level.id} value={level.id}>
                {level.label}
            </SelectItem>
        ))}
    </SelectContent>
</Select>;
```

## Testing Checklist

-   [ ] User without academic_level_id set sees all question types
-   [ ] User with elementary_school level sees only basic question types
-   [ ] User with university level sees all question types
-   [ ] Disabled question types show lock icon and tooltip
-   [ ] Context filter only shows allowed contexts
-   [ ] API rejects invalid question type for academic level
-   [ ] API rejects invalid context for academic level
-   [ ] Profile page allows setting academic level
-   [ ] Academic level persists after page reload

## Database Query Examples

### Get allowed question types for a user:

```sql
SELECT al.allowed_question_types
FROM profiles p
JOIN academic_levels al ON p.academic_level_id = al.id
WHERE p.user_id = 'user-uuid';
```

### Get allowed contexts for a user:

```sql
SELECT al.allowed_question_context
FROM profiles p
JOIN academic_levels al ON p.academic_level_id = al.id
WHERE p.user_id = 'user-uuid';
```

### Check if user can use a specific question type:

```sql
SELECT EXISTS (
  SELECT 1
  FROM profiles p
  JOIN academic_levels al ON p.academic_level_id = al.id
  WHERE p.user_id = 'user-uuid'
  AND 'multiple_choice'::question_type = ANY(al.allowed_question_types)
) AS can_use;
```

## Error Messages

Use these user-friendly error messages:

```typescript
const ERROR_MESSAGES = {
    questionTypeNotAllowed: (type: string, allowed: string[]) =>
        `O tipo de questão "${type}" não está disponível para seu nível acadêmico. Tipos disponíveis: ${allowed.join(
            ", "
        )}`,

    contextNotAllowed: (context: string) =>
        `O contexto "${context}" não está disponível para seu nível acadêmico. Selecione outro contexto.`,

    noAcademicLevel: () => `Configure seu nível acadêmico no perfil para acessar todos os tipos de questão.`,
};
```

## Future Enhancements

1. **Dynamic Academic Level Detection**: Automatically suggest academic level based on usage patterns
2. **Level Upgrade Prompts**: Suggest upgrading academic level when user tries restricted features
3. **Custom Academic Levels**: Allow institutions to create custom levels with specific question types
4. **Analytics**: Track which question types are most popular per academic level
5. **A/B Testing**: Test different question type combinations for better learning outcomes

## Conclusion

This implementation ensures that:

-   ✅ Users only see question types appropriate for their academic level
-   ✅ API validates requests against academic level restrictions
-   ✅ Clear UI feedback for unavailable features
-   ✅ Database constraints prevent invalid data
-   ✅ Easy to extend with new academic levels or question types

Estimated implementation time: **4-6 hours**

Dependencies:

-   All database migrations from previous tasks must be applied
-   Supabase RLS policies must be configured
-   User authentication must be working
