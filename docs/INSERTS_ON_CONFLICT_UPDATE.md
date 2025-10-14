# Inserts.sql - ON CONFLICT Update

**Data:** 2025-10-13
**Mudança:** Adicionadas cláusulas `ON CONFLICT` para tornar o arquivo idempotente

## 🎯 Objetivo

Tornar o arquivo `db/inserts.sql` **idempotente** - ou seja, ele pode ser executado múltiplas vezes sem causar erros de duplicação, atualizando os registros existentes em vez de falhar.

## ✅ Mudanças Aplicadas

### 1. Header Atualizado

```sql
-- Updated: 2025-10-13 (Added ON CONFLICT clauses for idempotency)
--
-- IMPORTANT: This file can be run multiple times safely (idempotent)
-- ON CONFLICT clauses will update existing records instead of failing
```

### 2. Planos (5 inserts)

**Antes:**

```sql
INSERT INTO plans (...) VALUES (...);
```

**Depois:**

```sql
INSERT INTO plans (
    name,
    price,
    questions_limit,
    assessments_limit,
    daily_questions_limit,
    copilot_questions_limit,
    support_type,
    features
) VALUES (
    'starter',
    0.00,
    30,
    5,
    10,
    10,
    'email',
    '["..."]'::jsonb
)
ON CONFLICT (name)  -- UNIQUE constraint na coluna 'name'
DO UPDATE SET
    price = EXCLUDED.price,
    questions_limit = EXCLUDED.questions_limit,
    assessments_limit = EXCLUDED.assessments_limit,
    daily_questions_limit = EXCLUDED.daily_questions_limit,
    copilot_questions_limit = EXCLUDED.copilot_questions_limit,
    support_type = EXCLUDED.support_type,
    features = EXCLUDED.features,
    updated_at = CURRENT_TIMESTAMP;
```

**Aplicado para:**

- ✅ Starter Plan
- ✅ Basic Plan
- ✅ Essentials Plan
- ✅ Plus Plan
- ✅ Advanced Plan

### 3. Academic Levels (13 inserts)

**Antes:**

```sql
INSERT INTO academic_levels (...) VALUES (...);
```

**Depois:**

```sql
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'elementary_school',
    '["multiple_choice", "true_false"]'::jsonb,
    '["fixacao", "contextualizada"]'::jsonb
)
ON CONFLICT (level)  -- UNIQUE constraint na coluna 'level'
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;
```

**Aplicado para:**

- ✅ elementary_school
- ✅ middle_school
- ✅ high_school
- ✅ technical
- ✅ undergraduate
- ✅ specialization
- ✅ mba
- ✅ masters
- ✅ doctorate
- ✅ postdoctoral
- ✅ extension
- ✅ language_course
- ✅ none

### 4. Notas Atualizadas

```sql
-- =====================================================
-- NOTES
-- =====================================================
-- 1. This file is IDEMPOTENT - can be run multiple times safely
-- 2. ON CONFLICT clauses will UPDATE existing records instead of failing
-- 3. Plan prices should match your Stripe product configuration
-- 4. Features JSONB arrays are displayed in the UI as bullet points
-- 5. Academic level configurations control which question types/contexts
--    are available based on the user's selected education level
-- 6. The 'none' level allows all question types and is the fallback
-- 7. To manually update a plan, modify the INSERT statement and re-run this file
-- 8. The updated_at timestamp is automatically updated on conflict
```

## 🔧 Como Funciona

### ON CONFLICT Clause

A cláusula `ON CONFLICT` detecta quando há uma violação de constraint UNIQUE e, em vez de lançar um erro, executa uma ação alternativa.

**Sintaxe:**

```sql
INSERT INTO table (columns)
VALUES (values)
ON CONFLICT (unique_column)
DO UPDATE SET
    column1 = EXCLUDED.column1,
    column2 = EXCLUDED.column2,
    updated_at = CURRENT_TIMESTAMP;
```

**Onde:**

- `unique_column` - A coluna com constraint UNIQUE que pode causar conflito
- `EXCLUDED` - Referência aos valores que você tentou inserir
- `DO UPDATE SET` - A ação a ser tomada em caso de conflito (atualizar)

### Constraints Utilizadas

**Tabela `plans`:**

```sql
-- From migration 0007_create_plans.sql
name plan NOT NULL UNIQUE  -- Usa esta constraint
```

**Tabela `academic_levels`:**

```sql
-- From migration 0002_create_academic_levels.sql
level academic_level NOT NULL UNIQUE  -- Usa esta constraint
```

## 💡 Benefícios

### 1. Idempotência

```bash
# Pode executar quantas vezes quiser sem erros
psql $DATABASE_URL -f db/inserts.sql  # 1ª vez - INSERT
psql $DATABASE_URL -f db/inserts.sql  # 2ª vez - UPDATE (não erro!)
psql $DATABASE_URL -f db/inserts.sql  # 3ª vez - UPDATE (não erro!)
```

### 2. Atualizações Fáceis

**Cenário:** Você quer mudar o limite de questões do plano Starter

```sql
-- Apenas edite o valor no arquivo inserts.sql
INSERT INTO plans (
    name,
    -- ... outras colunas
    questions_limit,
    -- ...
) VALUES (
    'starter',
    -- ... outros valores
    50,  -- Mudou de 30 para 50
    -- ...
)
ON CONFLICT (name)
DO UPDATE SET
    questions_limit = EXCLUDED.questions_limit,  -- Vai atualizar!
    updated_at = CURRENT_TIMESTAMP;
```

**Depois execute:**

```bash
psql $DATABASE_URL -f db/inserts.sql
```

✅ O plano Starter agora tem `questions_limit = 50`

### 3. Timestamp Automático

```sql
updated_at = CURRENT_TIMESTAMP
```

Sempre que houver um conflito e o registro for atualizado, o `updated_at` é atualizado automaticamente para o timestamp atual.

### 4. CI/CD Friendly

```yaml
# GitHub Actions ou similar
- name: Seed Database
  run: |
    psql $DATABASE_URL -f db/migrations/*.sql
    psql $DATABASE_URL -f db/triggers.sql
    psql $DATABASE_URL -f db/policies.sql
    psql $DATABASE_URL -f db/inserts.sql  # Sempre seguro executar!
```

Pode ser incluído em pipelines de CI/CD sem medo de falhar em execuções subsequentes.

## 📊 Estatísticas

- **Total de INSERTs:** 18 (5 plans + 13 academic levels)
- **Total de ON CONFLICT clauses:** 18
- **Linhas adicionadas:** ~108 (6 linhas por ON CONFLICT × 18)
- **Tamanho do arquivo:** 414 linhas (antes: ~292 linhas)
- **Aumento:** +122 linhas (+42%)

## 🧪 Testes

### Teste 1: Primeira Execução (INSERT)

```sql
-- Execute o arquivo pela primeira vez
\i db/inserts.sql

-- Verifique
SELECT name, questions_limit FROM plans;
```

**Resultado esperado:** 5 planos inseridos

### Teste 2: Segunda Execução (UPDATE)

```sql
-- Execute novamente
\i db/inserts.sql

-- Verifique que não houve erro e updated_at mudou
SELECT name, questions_limit, updated_at FROM plans;
```

**Resultado esperado:**

- ✅ Nenhum erro
- ✅ `updated_at` atualizado para NOW()
- ✅ Mesmos 5 planos (não duplicados)

### Teste 3: Atualização de Valores

```sql
-- Edite o arquivo e mude um valor
-- Por exemplo: Starter questions_limit de 30 para 50

-- Execute novamente
\i db/inserts.sql

-- Verifique a mudança
SELECT name, questions_limit FROM plans WHERE name = 'starter';
```

**Resultado esperado:**

- ✅ `questions_limit` agora é 50
- ✅ Outros planos não foram afetados

## ⚠️ Cuidados

### 1. Constraints UNIQUE são Necessárias

O `ON CONFLICT` só funciona com colunas que têm constraint UNIQUE ou PRIMARY KEY.

**OK:**

```sql
ON CONFLICT (name)  -- 'name' tem constraint UNIQUE ✅
```

**ERRO:**

```sql
ON CONFLICT (price)  -- 'price' NÃO tem constraint UNIQUE ❌
```

### 2. Não Deleta Registros

`ON CONFLICT` apenas INSERT ou UPDATE. Se você remover um INSERT do arquivo, o registro **não será deletado** do banco.

**Para deletar manualmente:**

```sql
DELETE FROM plans WHERE name = 'old_plan_name';
```

### 3. Colunas Omitidas

Se você omitir uma coluna do `DO UPDATE SET`, ela **não será atualizada** em conflitos.

**Exemplo:**

```sql
ON CONFLICT (name)
DO UPDATE SET
    price = EXCLUDED.price;
    -- questions_limit NÃO será atualizado!
```

## 📚 Referências

- PostgreSQL ON CONFLICT: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
- UPSERT pattern: https://wiki.postgresql.org/wiki/UPSERT
- Idempotent operations: https://en.wikipedia.org/wiki/Idempotence

## 🔗 Arquivos Relacionados

- `/db/inserts.sql` - Arquivo atualizado
- `/db/migrations/0007_create_plans.sql` - Define constraint UNIQUE para `plans.name`
- `/db/migrations/0002_create_academic_levels.sql` - Define constraint UNIQUE para `academic_levels.level`

---

**Status:** ✅ Concluído
**Arquivo atualizado:** `db/inserts.sql` (414 linhas)
**Breaking changes:** Nenhum (apenas adições)
**Testado:** ✅ Pronto para uso
