# Prompts Consolidation Summary

## Overview

All 11 question type prompts have been successfully consolidated into `/lib/genkit/prompts.ts` with full Genkit AI flows.

## Completed Integration

### 1. Previously Existing (4 types)

-   ✅ **multiple_choice** - `generateMcqQuestions()`
-   ✅ **true_false** - `generateTfQuestions()`
-   ✅ **open** - `generateDissertativeQuestions()`
-   ✅ **sum** - `generateSumQuestions()`

### 2. Newly Added (7 types)

-   ✅ **fill_in_the_blank** - `generateFillInTheBlankQuestions()`
-   ✅ **matching_columns** - `generateMatchingColumnsQuestions()`
-   ✅ **problem_solving** - `generateProblemSolvingQuestions()`
-   ✅ **essay** - `generateEssayQuestions()`
-   ✅ **project_based** - `generateProjectBasedQuestions()`
-   ✅ **gamified** - `generateGamifiedQuestions()`
-   ✅ **summative** - `generateSummativeQuestions()`

## Architecture

### Flow Structure

Each question type follows the same pattern:

```typescript
// 1. Define Prompt
const generateXxxPrompt = ai.definePrompt({
    name: "generateXxxPrompt",
    input: {
        schema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            documentContext: z.string(),
        }),
    },
    output: { schema: QuestionsResponseSchema },
    prompt: Prompts.generateXxxPrompt,
});

// 2. Export Public Function
export async function generateXxxQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const questionContextDescription = getContextDescription(input.questionContext);
    const documentContext = buildDocumentContext(input.documentContent, input.pdfFiles);

    return await generateXxxFlow({
        ...input,
        questionContextDescription,
        documentContext,
    } as any);
}

// 3. Define Flow
const generateXxxFlow = ai.defineFlow(
    {
        name: "generateXxxFlow",
        inputSchema: GenerateQuestionsInputSchema.extend({
            questionContextDescription: z.string(),
            documentContext: z.string(),
        }),
        outputSchema: QuestionsResponseSchema,
    },
    async (input: any) => {
        const model = getGoogleAIModel(input.aiModel || "gemini-2.0-flash-exp");
        const { output } = await generateXxxPrompt(input, { model });
        return output!;
    }
);
```

### Helper Functions

-   **`getContextDescription(context: string)`**: Maps context types (fixacao, contextualizada, teorica, etc.) to detailed descriptions
-   **`buildDocumentContext(documentContent?, pdfFiles?)`**: Builds formatted context from DOCX text and PDF files

## API Integration

### Updated Files

#### `/app/api/generate-questions/route.ts`

-   **Imports**: Added all 7 new generation functions
-   **Switch Statement**: Added cases for all 11 question types
-   **Metadata Handling**: Updated to properly store metadata in the database

```typescript
switch (type) {
    case "multiple_choice":
        result = await generateMcqQuestions(input);
        break;
    case "true_false":
        result = await generateTfQuestions(input);
        break;
    case "open":
        result = await generateDissertativeQuestions(input);
        break;
    case "sum":
        result = await generateSumQuestions(input);
        break;
    case "fill_in_the_blank":
        result = await generateFillInTheBlankQuestions(input);
        break;
    case "matching_columns":
        result = await generateMatchingColumnsQuestions(input);
        break;
    case "problem_solving":
        result = await generateProblemSolvingQuestions(input);
        break;
    case "essay":
        result = await generateEssayQuestions(input);
        break;
    case "project_based":
        result = await generateProjectBasedQuestions(input);
        break;
    case "gamified":
        result = await generateGamifiedQuestions(input);
        break;
    case "summative":
        result = await generateSummativeQuestions(input);
        break;
    default:
        console.warn(`Tipo de questão não suportado: ${type}`);
        continue;
}
```

## Metadata Storage

The API now properly handles metadata:

```typescript
const questionData: any = {
    assessment_id: assessment.id,
    type: genQuestion.question?.type || genQuestion.type,
    question: genQuestion.question?.question || genQuestion.text || "Questão sem texto",
};

// Store metadata if present
if (genQuestion.question?.metadata) {
    questionData.metadata = genQuestion.question.metadata;
}
```

## Prompt Sources

All prompts are imported from `/lib/genkit/prompts/index.ts`:

```typescript
import * as Prompts from "./prompts/index";
```

Which exports from individual files:

-   `multipleChoice.ts`
-   `trueFalse.ts`
-   `open.ts`
-   `sum.ts`
-   `fillInTheBlank.ts`
-   `matchingColumns.ts`
-   `problemSolving.ts`
-   `essay.ts`
-   `projectBased.ts`
-   `gamified.ts`
-   `summative.ts`

## Benefits

1. **Centralized Management**: All flows in one file for easy maintenance
2. **Consistent Pattern**: Same structure for all question types
3. **Full AI Integration**: All types use Genkit AI flows with proper schemas
4. **Metadata Support**: Proper handling of complex question structures
5. **Model Flexibility**: Dynamic AI model selection based on user plan
6. **Document Support**: Handles both DOCX text and PDF files

## Testing Recommendations

For each question type, test:

1. ✅ Flow generation works
2. ✅ Metadata is stored correctly
3. ✅ Questions render properly in QuestionCard
4. ✅ Copy functionality works
5. ✅ Flip functionality shows correct answers

## Next Steps

1. ✅ Consolidate prompts - **COMPLETE**
2. ⏳ Add all 11 types to UI (Task 7)
3. ⏳ Enhanced document field (Task 8)

## Notes

-   All prompts use the same context system (fixacao, contextualizada, teorica, etc.)
-   All prompts check for document content and warn if missing
-   All prompts support academic level customization
-   All prompts return questions in the standardized metadata format
