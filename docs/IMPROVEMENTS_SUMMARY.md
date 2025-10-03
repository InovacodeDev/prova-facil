# Melhorias Implementadas - Otimização e Novos Recursos

Data: 2 de Outubro de 2025

## 📋 Resumo das Mudanças

### 1. ✅ Tabela `plan_models` - Relacionamento Plano → Modelo de IA

**Objetivo**: Permitir que cada plano use um modelo de IA diferente do Google Gemini.

**Implementação**:

-   ✅ Criado schema Drizzle em `db/schema.ts`
-   ✅ Criada migration `db/migrations/0004_create_plan_models.sql`
-   ✅ Configuração padrão:
    -   `starter`: gemini-2.0-flash-exp
    -   `basic`: gemini-2.0-flash-exp
    -   `essentials`: gemini-2.0-flash-exp
    -   `plus`: gemini-2.0-flash-exp
    -   `advanced`: gemini-exp-1206 (modelo mais avançado)

**Uso**:

```sql
SELECT model FROM plan_models WHERE plan = 'advanced';
-- Retorna: gemini-exp-1206
```

**Arquivos Modificados**:

-   `db/schema.ts` - Adicionada tabela `planModels`
-   `db/migrations/0004_create_plan_models.sql` - Migration completa
-   `app/api/generate-questions/route.ts` - Busca modelo por plano
-   `lib/genkit/config.ts` - Função `getGoogleAIModel()`
-   `lib/genkit/prompts.ts` - Schema aceita `aiModel`

---

### 2. ✅ Lógica Diferenciada: PDF vs DOCX

**Objetivo**: Reduzir custos de IA processando documentos de forma diferente conforme o tipo.

**Regras Implementadas**:
| Tipo | Planos | Processamento |
|------|--------|---------------|
| **PDF** | Plus, Advanced | Enviado completo (base64) para IA |
| **PDF** | Starter, Basic, Essentials | ❌ **BLOQUEADO** |
| **DOCX/DOC** | Todos | Transcrito no client-side, apenas texto enviado |

**Benefícios**:

-   📉 **Economia de custos**: DOCX transcritos = menos tokens
-   🔒 **Controle de acesso**: PDFs restritos a planos premium
-   ⚡ **Performance**: Transcrição no navegador (paralelo)

**Validação**:

```typescript
// Em new-assessment/page.tsx
const allowPdfUpload = PLAN_LIMITS[userPlan]?.allowPdfUpload;

if (hasPDFs && !allowPdfUpload) {
    toast({
        title: "PDF não permitido",
        description: "PDFs são permitidos apenas para planos Plus e Advanced. Use arquivos DOCX.",
        variant: "destructive",
    });
}
```

**Arquivos Modificados**:

-   `app/new-assessment/page.tsx`:
    -   `handleFileChange()` - Valida tipo por plano
    -   `handleSubmit()` - Envia PDFs como base64 ou DOCX como texto
    -   `PLAN_LIMITS` - Adicionado `allowPdfUpload` booleano
-   `app/api/generate-questions/route.ts`:
    -   Interface aceita `pdfFiles` e `documentContent`
-   `lib/genkit/prompts.ts`:
    -   `buildDocumentContext()` - Lida com ambos os tipos
    -   Schema aceita `pdfFiles`

---

### 3. ✅ Limites Mensais Totais (não por matéria)

**Objetivo**: Simplificar controle e aumentar generosidade nos limites.

**Antes**:

-   Limite POR MATÉRIA POR MÊS
-   Usuário precisava gerenciar múltiplos limites
-   Confuso e restritivo

**Depois**:

-   Limite TOTAL MENSAL (todas as matérias)
-   Aumento de **50%** em todos os planos

| Plano      | Antes (por matéria) | Depois (total/mês) | Aumento |
| ---------- | ------------------- | ------------------ | ------- |
| Starter    | 20                  | **30**             | +50%    |
| Basic      | 50                  | **75**             | +50%    |
| Essentials | 100                 | **150**            | +50%    |
| Plus       | 300                 | **450**            | +50%    |
| Advanced   | 300                 | **450**            | +50%    |

**Consulta Atualizada**:

```typescript
// Busca TODAS as questões do mês (independente de matéria)
const { data: questionsData } = await supabase
    .from("questions")
    .select(`id, assessments!inner (user_id, created_at)`)
    .eq("assessments.user_id", profile.id)
    .gte("assessments.created_at", startOfMonth.toISOString());

const monthlyUsage = questionsData?.length || 0;
```

**Arquivos Modificados**:

-   `app/new-assessment/page.tsx`:
    -   Removido `subjectUsage` state
    -   Adicionado `monthlyUsage` state
    -   `useEffect` agora busca total mensal
    -   UI mostra "30/75 questões usadas este mês" (sem mencionar matéria)
-   `PLAN_LIMITS`: Renomeado `questionLimit` → `monthlyQuestionLimit`

---

### 4. ✅ Configuração de Modelo de IA por Plano

**Objetivo**: Usar IAs mais avançadas para planos premium.

**Fluxo Completo**:

```
1. Usuário cria assessment
   ↓
2. API busca plano do usuário (profiles.plan)
   ↓
3. API consulta plan_models WHERE plan = user.plan
   ↓
4. API passa aiModel para funções Genkit
   ↓
5. Genkit usa modelo específico para gerar questões
```

**Mapeamento de Modelos**:

-   **Starter/Basic/Essentials**: `gemini-2.0-flash-exp` (rápido, econômico)
-   **Plus**: `gemini-2.0-flash-exp` (balanceado)
-   **Advanced**: `gemini-exp-1206` (mais inteligente, caro)

**Código**:

```typescript
// Em app/api/generate-questions/route.ts
const { data: planModelData } = await supabase.from("plan_models").select("model").eq("plan", profile.plan).single();

const aiModel = planModelData?.model || "gemini-2.0-flash-exp";
console.log(`Usando modelo ${aiModel} para plano ${profile.plan}`);

// Passar para Genkit
const input: GenerateQuestionsInput = {
    // ... outros campos
    aiModel,
};
```

**Arquivos Modificados**:

-   `app/api/generate-questions/route.ts` - Busca e passa modelo
-   `lib/genkit/config.ts` - Helper `getGoogleAIModel()`
-   `lib/genkit/prompts.ts` - Schema e flows aceitam `aiModel`

---

### 5. ✅ Otimizações de Performance

**Objetivo**: Melhorar velocidade de navegação e renderização.

**Mudanças**:

```typescript
// Em app/layout.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-cache"; // Cache agressivo
export const revalidate = 3600; // 1 hora
```

**Benefícios**:

-   ⚡ Cache de dados por 1 hora
-   🚀 Navegação mais fluida
-   📉 Menos requisições ao Supabase

**Recomendações Futuras**:

1. **Prefetch de Links**: Usar `<Link prefetch={true}>` em navegação crítica
2. **Loading States**: Adicionar Suspense boundaries
3. **Lazy Loading**: Carregar componentes pesados sob demanda
4. **Virtualization**: Para listas longas de questões

---

## 🚀 Como Aplicar as Mudanças

### 1. Aplicar Migration no Supabase

Execute no SQL Editor do Supabase:

```sql
-- Copie e cole o conteúdo de db/migrations/0004_create_plan_models.sql

CREATE TABLE IF NOT EXISTS "plan_models" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "plan" "plan" NOT NULL UNIQUE,
    "model" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "plan_models" ("plan", "model") VALUES
    ('starter', 'gemini-2.0-flash-exp'),
    ('basic', 'gemini-2.0-flash-exp'),
    ('essentials', 'gemini-2.0-flash-exp'),
    ('plus', 'gemini-2.0-flash-exp'),
    ('advanced', 'gemini-exp-1206');
```

### 2. Verificar Políticas RLS

Adicione RLS para `plan_models` (somente leitura):

```sql
ALTER TABLE plan_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON plan_models
    FOR SELECT
    USING (true);
```

### 3. Testar Fluxo Completo

1. **Teste PDF Upload**:

    - Login como usuário Starter → Upload PDF → Deve bloquear
    - Login como usuário Plus → Upload PDF → Deve permitir

2. **Teste DOCX Upload**:

    - Qualquer plano → Upload DOCX → Deve transcrever e funcionar

3. **Teste Limites Mensais**:

    - Criar questões em múltiplas matérias
    - Verificar que conta todas juntas

4. **Teste Modelos de IA**:
    - Verificar logs da API para confirmar modelo usado
    - Comparar qualidade das respostas entre planos

---

## 📊 Impacto Esperado

### Custos

-   **Redução estimada**: 30-50% nos custos de IA
    -   DOCX transcritos = menos tokens
    -   PDFs restritos a planos premium

### User Experience

-   **Clareza**: Limite mensal total mais fácil de entender
-   **Generosidade**: +50% de questões disponíveis
-   **Performance**: Navegação mais rápida

### Business

-   **Diferenciação de Planos**: Premium tem acesso a PDFs e IA melhor
-   **Escalabilidade**: Modelo sustentável de custos

---

## 🐛 Troubleshooting

### PDF bloqueado mesmo em plano Plus/Advanced

**Verificar**:

```typescript
console.log(userPlan, PLAN_LIMITS[userPlan]?.allowPdfUpload);
```

**Solução**: Verificar se `userPlan` está correto no estado

### Modelo de IA não mudando

**Verificar**:

```sql
SELECT * FROM plan_models WHERE plan = 'advanced';
```

**Solução**: Confirmar migration aplicada

### Limite mensal não atualizando

**Verificar**:

-   Timezone do servidor
-   Query de `startOfMonth`
-   Cache do React Query

---

## 📝 Próximos Passos (Sugestões)

1. **Dashboard de Uso**: Mostrar gráfico de uso mensal
2. **Notificações**: Avisar quando atingir 80% do limite
3. **Upgrade Prompt**: Sugerir upgrade quando usuário tenta PDF em plano baixo
4. **Analytics**: Rastrear qual modelo de IA é mais usado
5. **A/B Testing**: Comparar qualidade das questões entre modelos

---

## 🔍 Arquivos para Revisão

Antes de fazer deploy, revise:

-   [ ] `db/migrations/0004_create_plan_models.sql` - Aplicada?
-   [ ] `app/new-assessment/page.tsx` - Lógica de validação PDF
-   [ ] `app/api/generate-questions/route.ts` - Busca modelo correto
-   [ ] Testes E2E para cada plano

---

**Implementado por**: GitHub Copilot  
**Data**: 2 de Outubro de 2025  
**Status**: ✅ Completo, pronto para teste e deploy
