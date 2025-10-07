# Resumo de Implementação - Sistema de Questões com Metadata

## Data: 2025

## Status: ✅ Completo

---

## 📋 Resumo Executivo

Implementação completa de um sistema avançado de questões com:

-   Schema JSONB flexível para suportar 11 tipos de questões
-   3 novos tipos de questões (Project-Based, Gamified, Summative)
-   Sistema de rastreamento de uso com visualização de dados
-   Validação baseada em planos
-   Interface visual com gráficos de pizza

---

## 🔧 Mudanças no Banco de Dados

### 1. Schema - Tabela Questions

**Arquivo:** `/db/schema.ts`

Adicionada coluna `metadata`:

```typescript
export const questions = pgTable("questions", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    assessment_id: uuid("assessment_id").references(() => assessments.id),
    type: questionTypeEnum().notNull().default("multiple_choice"),
    question: varchar("question", { length: 8192 }).notNull(),
    metadata: jsonb("metadata").notNull().default("{}"), // ← NOVO
    copy_count: integer("copy_count").notNull().default(0),
    copy_last_at: timestamp("copy_last_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});
```

### 2. Enum de Tipos de Questões

**Arquivo:** `/db/schema.ts`

Adicionados 3 novos tipos:

```typescript
export const questionTypeEnum = pgEnum("question_type", [
    "multiple_choice",
    "true_false",
    "open",
    "sum",
    "fill_in_the_blank",
    "matching_columns",
    "problem_solving",
    "essay",
    "project_based", // ← NOVO
    "gamified", // ← NOVO
    "summative", // ← NOVO
]);
```

### 3. Migration

**Arquivo:** `/db/migrations/0012_add_metadata_and_new_question_types.sql`

-   Adiciona novos tipos ao enum `question_type`
-   Adiciona coluna `metadata` com tipo JSONB
-   Cria índice GIN para consultas eficientes no metadata
-   Adiciona comentário de documentação

---

## 📝 Sistema de Prompts

### Estrutura de Diretórios

```
/lib/genkit/prompts/
├── index.ts
├── multipleChoice.ts
├── trueFalse.ts
├── open.ts
├── sum.ts
├── fillInTheBlank.ts
├── matchingColumns.ts
├── problemSolving.ts
├── essay.ts
├── projectBased.ts       ← NOVO
├── gamified.ts           ← NOVO
└── summative.ts          ← NOVO
```

### Exemplos de Estrutura Metadata

#### Multiple Choice

```json
{
    "answers": [
        { "answer": "Alternativa A", "is_correct": true },
        { "answer": "Alternativa B", "is_correct": false }
    ]
}
```

#### Fill in the Blank (suporta múltiplas lacunas)

```json
{
    "blanks": [
        { "id": "BLANK_1", "correct_answer": "mitocôndria" },
        { "id": "BLANK_2", "correct_answer": "respiração celular" }
    ],
    "options_bank": ["mitocôndria", "núcleo", "respiração celular"]
}
```

#### Project Based (NOVO)

```json
{
    "guiding_question": "Como podemos reduzir o desperdício de água?",
    "learning_objectives": ["Objetivo 1", "Objetivo 2"],
    "final_product_description": "Apresentação de 10 minutos",
    "main_steps": ["Pesquisa", "Planejamento", "Desenvolvimento"],
    "evaluation_rubric": [
        {
            "criterion": "Pesquisa",
            "levels": [
                { "level": "Excelente", "description": "Pesquisa abrangente" },
                { "level": "Bom", "description": "Pesquisa adequada" }
            ]
        }
    ]
}
```

#### Gamified (NOVO)

```json
{
    "narrative": "Você é um detetive investigando...",
    "game_type": "quiz_adventure",
    "levels": [
        {
            "level_number": 1,
            "objective": "Resolver o primeiro enigma",
            "challenge": "Descrição do desafio",
            "points": 100,
            "success_condition": "Acertar a resposta"
        }
    ],
    "total_points": 300,
    "feedback": {
        "success": "Parabéns!",
        "partial": "Você está no caminho certo",
        "failure": "Tente novamente!"
    }
}
```

#### Summative (NOVO)

```json
{
    "learning_objectives": ["Objetivo 1", "Objetivo 2"],
    "competencies_assessed": ["Conhecimento", "Aplicação"],
    "evaluation_criteria": [
        {
            "criterion": "Compreensão conceitual",
            "weight": 30,
            "description": "Demonstra entendimento dos conceitos"
        }
    ],
    "model_answer": "Resposta modelo completa",
    "total_points": 100
}
```

---

## 📊 Sistema de Rastreamento de Uso

### 1. Módulo de Tracking

**Arquivo:** `/lib/usage-tracking.ts`

Funções principais:

-   `getUserUsageStats(userId)` - Estatísticas completas de uso
-   `checkUserQuota(userId, requestedCount)` - Verifica quota disponível

Retorna:

```typescript
{
    userId: string;
    totalQuestions: number;
    totalQuota: number;
    remainingQuota: number;
    percentageUsed: number;
    subjectBreakdown: SubjectUsage[];
    currentMonth: string;
}
```

### 2. API Route

**Arquivo:** `/app/api/usage-stats/route.ts`

Endpoint: `GET /api/usage-stats`

-   Autentica usuário via Supabase
-   Retorna estatísticas de uso do mês corrente
-   Agrupa questões por matéria

### 3. Componente de Gráfico

**Arquivo:** `/components/UsageChart.tsx`

Recursos:

-   Gráfico de pizza com Recharts
-   Cores distintas para cada matéria
-   Slice cinza para quota restante
-   Tooltip customizado com quantidades e porcentagens
-   Legend com todas as matérias

### 4. Página de Uso

**Arquivo:** `/app/usage/page.tsx`

Seções:

-   **Cards de Overview**: Questões criadas, cota total, disponível
-   **Barra de Progresso**: Visual com cores baseadas em uso
-   **Gráfico de Pizza**: Distribuição por matéria
-   **Tabela de Detalhamento**: Lista todas as matérias com contagens
-   **CTA de Upgrade**: Exibido quando próximo do limite

---

## ✅ Sistema de Validação

### Arquivo: `/lib/validators/question.ts`

#### Funções Principais

1. **`validateQuestionType(userId, questionType)`**

    - Valida se o tipo de questão está no plano do usuário
    - Consulta `plans.allowed_questions`
    - Retorna mensagem de erro personalizada

2. **`getAllowedQuestionTypes(userId)`**
    - Retorna array com todos os tipos permitidos
    - Útil para interfaces de seleção

#### Exemplo de Uso

```typescript
const validation = await validateQuestionType(userId, "project_based");
if (!validation.valid) {
    return { error: validation.error };
}
```

---

## 📦 Dependências Instaladas

### Recharts

```bash
pnpm install recharts
```

Biblioteca de gráficos React:

-   PieChart para visualização de quota
-   ResponsiveContainer para layout responsivo
-   Tooltip e Legend customizáveis

---

## 🔄 Próximos Passos (Opcional)

### 1. Integração com Genkit

-   Atualizar `/lib/genkit/prompts.ts` para usar os novos prompts modulares
-   Conectar cada tipo de questão ao seu respectivo prompt

### 2. Interface de Criação

-   Adicionar validação de quota antes de criar questões
-   Integrar `validateQuestionType()` no form de nova questão
-   Exibir tipos de questão disponíveis baseado no plano

### 3. Migração de Dados (Se necessário)

-   Script para migrar dados da tabela `answers` para `metadata`
-   Transformar estrutura antiga para novo formato JSONB

### 4. Testes

-   Testes unitários para funções de validação
-   Testes de integração para API de usage-stats
-   Testes de renderização para UsageChart

---

## 📁 Arquivos Criados/Modificados

### Criados (16 arquivos)

```
/db/migrations/0012_add_metadata_and_new_question_types.sql
/lib/genkit/prompts/index.ts
/lib/genkit/prompts/multipleChoice.ts
/lib/genkit/prompts/trueFalse.ts
/lib/genkit/prompts/open.ts
/lib/genkit/prompts/sum.ts
/lib/genkit/prompts/fillInTheBlank.ts
/lib/genkit/prompts/matchingColumns.ts
/lib/genkit/prompts/problemSolving.ts
/lib/genkit/prompts/essay.ts
/lib/genkit/prompts/projectBased.ts
/lib/genkit/prompts/gamified.ts
/lib/genkit/prompts/summative.ts
/lib/usage-tracking.ts
/lib/validators/question.ts
/components/UsageChart.tsx
/app/api/usage-stats/route.ts
```

### Modificados (2 arquivos)

```
/db/schema.ts
/app/usage/page.tsx
```

---

## ✨ Recursos Implementados

-   ✅ Schema JSONB flexível para questões
-   ✅ 11 tipos de questões (8 existentes + 3 novos)
-   ✅ 11 prompts Genkit modulares
-   ✅ Sistema de rastreamento de uso mensal
-   ✅ Gráfico de pizza interativo (Recharts)
-   ✅ API REST para estatísticas de uso
-   ✅ Validação baseada em planos
-   ✅ Interface de usuário completa
-   ✅ Migration SQL com novos tipos e metadata
-   ✅ Documentação completa

---

## 🎯 Benefícios

1. **Flexibilidade**: Schema JSONB permite adicionar novos campos sem migrations
2. **Escalabilidade**: Estrutura modular de prompts facilita manutenção
3. **UX Melhorada**: Visualização clara de uso com gráficos
4. **Monetização**: Validação por plano incentiva upgrades
5. **Manutenibilidade**: Código bem documentado e tipado

---

## 🚀 Como Usar

### Aplicar Migration

```bash
# Execute a migration no banco
psql -d prova_facil < db/migrations/0012_add_metadata_and_new_question_types.sql
```

### Testar Página de Uso

```bash
# Inicie o servidor dev
pnpm dev

# Acesse: http://localhost:8800/usage
```

### Validar Tipo de Questão

```typescript
import { validateQuestionType } from "@/lib/validators/question";

const result = await validateQuestionType(userId, "gamified");
if (!result.valid) {
    throw new Error(result.error);
}
```

---

## 📚 Referências

-   **Drizzle ORM**: https://orm.drizzle.team/docs/overview
-   **Recharts**: https://recharts.org/
-   **PostgreSQL JSONB**: https://www.postgresql.org/docs/current/datatype-json.html

---

**Fim do Documento**
