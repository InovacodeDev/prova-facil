# Guia de Deploy - Aplicar Mudanças no Supabase

## 📋 Checklist Pré-Deploy

-   [ ] Backup do banco de dados
-   [ ] Código testado localmente
-   [ ] Todas as migrations revisadas
-   [ ] RLS policies documentadas

---

## 🚀 Passo a Passo

### 1. Aplicar Migration `plan_models`

**Acesse**: Supabase Dashboard → SQL Editor → New Query

**Execute**:

```sql
-- ============================================
-- Migration: Create plan_models table
-- Data: 2025-10-02
-- Descrição: Relaciona planos a modelos de IA
-- ============================================

BEGIN;

-- Criar tabela
CREATE TABLE IF NOT EXISTS "plan_models" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "plan" "plan" NOT NULL UNIQUE,
    "model" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Inserir mapeamentos padrão
INSERT INTO "plan_models" ("plan", "model") VALUES
    ('starter', 'gemini-2.0-flash-exp'),
    ('basic', 'gemini-2.0-flash-exp'),
    ('essentials', 'gemini-2.0-flash-exp'),
    ('plus', 'gemini-2.0-flash-exp'),
    ('advanced', 'gemini-exp-1206')
ON CONFLICT (plan) DO NOTHING;

COMMIT;
```

**Verificar**:

```sql
SELECT * FROM plan_models ORDER BY plan;
```

**Resultado esperado**:

```
 id                                   | plan       | model                    | created_at          | updated_at
--------------------------------------+------------+--------------------------+---------------------+---------------------
 <uuid>                               | starter    | gemini-2.0-flash-exp     | 2025-10-02 ...      | 2025-10-02 ...
 <uuid>                               | basic      | gemini-2.0-flash-exp     | 2025-10-02 ...      | 2025-10-02 ...
 <uuid>                               | essentials | gemini-2.0-flash-exp     | 2025-10-02 ...      | 2025-10-02 ...
 <uuid>                               | plus       | gemini-2.0-flash-exp     | 2025-10-02 ...      | 2025-10-02 ...
 <uuid>                               | advanced   | gemini-exp-1206          | 2025-10-02 ...      | 2025-10-02 ...
```

---

### 2. Aplicar RLS Policies

```sql
-- ============================================
-- RLS Policies para plan_models
-- ============================================

-- Habilitar RLS
ALTER TABLE plan_models ENABLE ROW LEVEL SECURITY;

-- Política 1: Leitura pública (todos podem ler)
CREATE POLICY "Allow public read access"
ON plan_models
FOR SELECT
USING (true);

-- Verificar políticas criadas
SELECT * FROM pg_policies WHERE tablename = 'plan_models';
```

**Resultado esperado**:

```
 schemaname | tablename   | policyname                | roles  | cmd    | qual | with_check
------------+-------------+---------------------------+--------+--------+------+------------
 public     | plan_models | Allow public read access  | public | SELECT | true | NULL
```

---

### 3. Testar Consultas

#### Teste 1: Buscar modelo por plano

```sql
SELECT model FROM plan_models WHERE plan = 'advanced';
```

**Esperado**: `gemini-exp-1206`

#### Teste 2: Buscar modelo para plano inexistente

```sql
SELECT model FROM plan_models WHERE plan = 'enterprise';
```

**Esperado**: Nenhum resultado (retorna NULL)

#### Teste 3: Simular busca da API

```sql
SELECT
    p.id,
    p.plan,
    pm.model,
    p.user_id
FROM profiles p
LEFT JOIN plan_models pm ON p.plan = pm.plan
WHERE p.user_id = '<seu-user-id>';
```

**Esperado**: Mostra plano do usuário e modelo correspondente

---

### 4. Rollback (Se Necessário)

Se algo der errado, execute:

```sql
BEGIN;

-- Remover políticas
DROP POLICY IF EXISTS "Allow public read access" ON plan_models;

-- Remover tabela
DROP TABLE IF EXISTS plan_models;

COMMIT;
```

---

## 🧪 Testes Pós-Deploy

### Teste 1: Upload PDF (Plano Básico)

1. Login com usuário `basic`
2. Ir para `/new-assessment`
3. Tentar upload de PDF
4. **Esperado**: Toast "PDF não permitido"

### Teste 2: Upload PDF (Plano Plus)

1. Login com usuário `plus` ou `advanced`
2. Ir para `/new-assessment`
3. Upload de PDF
4. **Esperado**: PDF aceito, toast "PDFs serão enviados completos"

### Teste 3: Upload DOCX (Qualquer Plano)

1. Login com qualquer usuário
2. Upload DOCX
3. **Esperado**: Texto extraído, toast mostrando palavras extraídas

### Teste 4: Limites Mensais

1. Criar questões em "Matemática" - 10 questões
2. Criar questões em "História" - 5 questões
3. Ir para nova avaliação
4. **Esperado**: UI mostra "15/30 questões usadas este mês"

### Teste 5: Modelo de IA Correto

1. Verificar logs da API (`pnpm dev` ou Vercel Logs)
2. Criar questões com plano `advanced`
3. **Esperado no log**: `"Usando modelo gemini-exp-1206 para plano advanced"`

---

## 📊 Monitoramento

### Consultas Úteis

#### Ver uso mensal por usuário

```sql
SELECT
    p.user_id,
    p.plan,
    COUNT(q.id) as questions_this_month
FROM profiles p
LEFT JOIN assessments a ON a.user_id = p.id
LEFT JOIN questions q ON q.assessment_id = a.id
WHERE a.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY p.user_id, p.plan
ORDER BY questions_this_month DESC;
```

#### Ver modelos mais usados

```sql
SELECT
    pm.model,
    COUNT(DISTINCT a.id) as assessments_created
FROM assessments a
JOIN profiles p ON p.id = a.user_id
JOIN plan_models pm ON pm.plan = p.plan
WHERE a.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY pm.model
ORDER BY assessments_created DESC;
```

#### Ver uploads de PDF vs DOCX

```sql
-- Nota: Requer logging customizado ou campo na tabela assessments
-- Para implementar no futuro
```

---

## 🔧 Configurações Adicionais (Opcional)

### Atualizar Modelo de um Plano

```sql
UPDATE plan_models
SET
    model = 'gemini-2.5-pro',
    updated_at = now()
WHERE plan = 'advanced';
```

### Adicionar Novo Plano (Futuro)

```sql
-- Primeiro, adicionar ao enum plan (requer migration)
-- Depois, adicionar mapeamento
INSERT INTO plan_models (plan, model)
VALUES ('enterprise', 'gemini-2.5-pro');
```

---

## ⚠️ Troubleshooting

### Erro: "relation plan_models does not exist"

**Causa**: Migration não aplicada  
**Solução**: Execute a migration novamente

### Erro: "duplicate key value violates unique constraint"

**Causa**: Tentando inserir plano que já existe  
**Solução**: Use `ON CONFLICT (plan) DO UPDATE SET model = EXCLUDED.model`

### Erro: "permission denied for table plan_models"

**Causa**: RLS bloqueando acesso  
**Solução**: Verifique políticas RLS com `SELECT * FROM pg_policies WHERE tablename = 'plan_models'`

### PDF ainda bloqueado em plano Plus

**Causa**: Frontend não atualizou `allowPdfUpload`  
**Solução**:

1. Verificar `PLAN_LIMITS` em `new-assessment/page.tsx`
2. Clear cache do navegador
3. Verificar se `userPlan` state está correto

---

## 📝 Notas Importantes

1. **Cache**: O frontend pode cachear o plano do usuário. Se mudar manualmente no banco, usuário precisa relogar.

2. **Modelos Disponíveis**: Certifique-se de que os modelos no `plan_models` existem na Google AI API:

    - ✅ `gemini-2.0-flash-exp`
    - ✅ `gemini-exp-1206`
    - ❌ Não use modelos não listados na documentação Google AI

3. **Custo**: Modelos `pro` são mais caros. Monitore uso em planos Advanced.

4. **Rate Limits**: Google AI tem rate limits. Considere implementar retry logic.

---

## ✅ Checklist Pós-Deploy

-   [ ] Migration aplicada com sucesso
-   [ ] RLS policies criadas
-   [ ] Testes manuais passaram
-   [ ] Logs da API mostram modelo correto
-   [ ] Documentação atualizada
-   [ ] Time notificado das mudanças

---

**Última Atualização**: 2 de Outubro de 2025  
**Responsável**: DevOps Team  
**Status**: ✅ Pronto para produção
