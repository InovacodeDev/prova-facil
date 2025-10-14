# 🗄️ Database - Guia de Uso

## 📁 Estrutura de Arquivos

```
db/
├── schema.ts                    # ✨ FONTE DA VERDADE (Drizzle ORM)
├── migrations/                  # 📂 Migrations SQL sequenciais
│   ├── 0001_create_enums.sql
│   ├── 0002_create_academic_levels.sql
│   ├── 0003_create_profiles.sql
│   ├── 0004_create_assessments.sql
│   ├── 0005_create_questions.sql
│   ├── 0006_create_logs.sql
│   ├── 0007_create_plans.sql
│   ├── 0008_create_profile_logs_cycle.sql
│   └── 0009_create_error_logs.sql
├── triggers.sql                 # ⚡ Triggers automáticos
├── policies.sql                 # 🔒 Row Level Security (RLS)
├── inserts.sql                  # 🌱 Dados iniciais (seed)
├── apply-migrations.sh          # 🚀 Script de deploy
├── reset-database.sh            # 🔄 Script de reset completo
└── README.md                    # 📖 Este arquivo
```

---

## 🚀 Quick Start

### 1️⃣ Setup Inicial (primeira vez)

```bash
# 1. Certifique-se de que o Supabase CLI está instalado
supabase --version

# 2. Inicie o Supabase local
supabase start

# 3. Execute as migrations
./db/apply-migrations.sh
```

### 2️⃣ Desenvolvimento Diário

```bash
# Resetar o banco local (limpa tudo e reaplica)
./db/reset-database.sh

# Aplicar apenas as migrations (incremental)
./db/apply-migrations.sh
```

### 3️⃣ Deploy para Produção

```bash
# 1. Configure a DATABASE_URL
export DATABASE_URL='postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres'

# 2. Execute com confirmação
./db/apply-migrations.sh --remote

# Ou: Deploy via Supabase Dashboard
# - Copie o conteúdo de cada arquivo SQL
# - Execute no SQL Editor do Supabase
```

---

## 📋 Scripts Disponíveis

### `apply-migrations.sh`

**Propósito:** Executa todas as migrations em ordem correta.

**Uso:**
```bash
./db/apply-migrations.sh           # Local (padrão)
./db/apply-migrations.sh --local   # Local (explícito)
./db/apply-migrations.sh --remote  # Remoto (requer confirmação)
```

**Fases de Execução:**
1. **Migrations** (0001 → 0009): Cria tabelas, enums, constraints
2. **Triggers**: Automações (updated_at, cache, logs)
3. **Policies**: Segurança (RLS para todas tabelas)
4. **Inserts**: Dados iniciais (5 plans + 13 academic levels)

**Características:**
- ✅ Idempotente: seguro executar múltiplas vezes
- ✅ Error handling: para no primeiro erro
- ✅ Output colorido: progresso visual
- ✅ Validação: checa DATABASE_URL para remote

---

### `reset-database.sh`

**Propósito:** APAGA TUDO e recria o banco do zero.

**⚠️ PERIGO:** Esta operação é IRREVERSÍVEL!

**Uso:**
```bash
./db/reset-database.sh           # Local (padrão)
./db/reset-database.sh --local   # Local (explícito)
# Remoto não suportado (faça manualmente via Dashboard)
```

**O que faz:**
1. Executa `supabase db reset --local`
2. Chama `apply-migrations.sh` automaticamente
3. Resultado: banco limpo com estrutura e seed data

**Segurança:**
- Requer confirmação: digite `RESET`
- Apenas local (remote deve ser feito via Dashboard)

---

## 🏗️ Ordem de Dependências (Migrations)

**CRÍTICO:** As migrations devem ser executadas EXATAMENTE nesta ordem:

```
0001_create_enums.sql
   ↓ (enums são usados por academic_levels)
0002_create_academic_levels.sql
   ↓ (academic_levels não tem FK, pode vir aqui)
0003_create_profiles.sql
   ↓ (profiles.user_id referencia auth.users)
0004_create_assessments.sql
   ↓ (assessments.user_id → profiles.user_id)
0005_create_questions.sql
   ↓ (questions.assessment_id → assessments.id)
0006_create_logs.sql
   ↓ (logs independente, mas usa enums)
0007_create_plans.sql
   ↓ (plans usa plan enum como PK)
0008_create_profile_logs_cycle.sql
   ↓ (usa user_id → profiles.user_id)
0009_create_error_logs.sql
   ↓ (independente, última por convenção)
```

---

## 🔐 Variáveis de Ambiente

### Local Development
```bash
# Supabase CLI cuida automaticamente
# Database: http://localhost:54322
# Studio: http://localhost:54323
```

### Remote/Production
```bash
# Obrigatório para deploy remoto
export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres'

# Encontre sua DATABASE_URL em:
# Supabase Dashboard → Settings → Database → Connection String → URI
```

---

## 📊 Estrutura do Banco (Resumo)

### Tabelas Principais

| Tabela | PK Type | Principais Colunas | Relacionamentos |
|--------|---------|-------------------|-----------------|
| `profiles` | UUID | user_id, is_admin, plan, stripe_* | → auth.users |
| `assessments` | UUID | user_id, title, subject, academic_level | → profiles |
| `questions` | UUID | assessment_id, question, type, correct_answer | → assessments |
| `academic_levels` | INTEGER | name (enum), allowed_question_types[] | Nenhum |
| `plans` | plan (enum) | model, questions_month, doc_type[] | Nenhum |
| `logs` | SERIAL | action, count, updated_at | Nenhum |
| `profile_logs_cycle` | UUID | user_id, cycle, questions_created | → profiles |
| `error_logs` | UUID | component, message, severity, context | Nenhum |

### Enums Definidos

```sql
- plan: free, basic, pro, enterprise, admin
- academic_level: elementary_school, middle_school_years_6_7, ...
- question_type: multiple_choice, true_false, open, fill_blank, ...
- question_context: text, image, audio, video, table, graph, none
- model_type: gemini_1_5_flash, gemini_1_5_pro, ...
- doc_type: pdf, docx, txt, md, csv, xlsx
- support_type: email, priority_email, chat, phone
```

---

## 🧪 Testando as Migrations

### Teste Local Completo

```bash
# 1. Reset completo
./db/reset-database.sh

# 2. Verifique se tudo foi criado
supabase db diff

# 3. Teste os dados seed
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT * FROM plans;"

psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT * FROM academic_levels;"

# 4. Teste as policies (via Studio)
open http://localhost:54323
```

### Verificação Manual (SQL)

```sql
-- Listar todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar enums
SELECT typname FROM pg_type WHERE typcategory = 'E';

-- Contar registros seed
SELECT 'plans' as table, COUNT(*) FROM plans
UNION ALL
SELECT 'academic_levels', COUNT(*) FROM academic_levels;

-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Verificar policies
SELECT tablename, policyname FROM pg_policies;
```

---

## 🚨 Troubleshooting

### Erro: "relation already exists"
```bash
# Causa: Tentou criar tabela que já existe
# Solução: Reset completo
./db/reset-database.sh
```

### Erro: "foreign key constraint"
```bash
# Causa: Ordem errada de migrations
# Solução: Use o script (ordem correta garantida)
./db/apply-migrations.sh
```

### Erro: "permission denied"
```bash
# Causa: Scripts não executáveis
# Solução:
chmod +x db/apply-migrations.sh db/reset-database.sh
```

### Erro: "DATABASE_URL not set" (remote)
```bash
# Causa: Variável não configurada
# Solução:
export DATABASE_URL='postgresql://...'
./db/apply-migrations.sh --remote
```

### Erro: "column does not exist"
```bash
# Causa: Schema desatualizado ou ordem errada
# Solução 1: Reset local
./db/reset-database.sh

# Solução 2: Verifique schema.ts (fonte da verdade)
```

---

## 📝 Boas Práticas

### ✅ DOs

- ✅ Use os scripts (`apply-migrations.sh`, `reset-database.sh`)
- ✅ Mantenha `schema.ts` como fonte da verdade
- ✅ Teste localmente antes de remote
- ✅ Use `ON CONFLICT` para idempotência
- ✅ Commit migrations no Git
- ✅ Execute migrations em ordem sequencial

### ❌ DON'Ts

- ❌ Nunca edite o banco manualmente via psql/Studio (exceto debug)
- ❌ Nunca pule migrations ou mude a ordem
- ❌ Nunca edite migrations já commitadas (crie novas)
- ❌ Nunca faça reset remoto sem backup
- ❌ Nunca ignore erros do script (investigue!)

---

## 🔄 Workflow de Mudanças no Schema

### 1. Editar Schema
```typescript
// db/schema.ts
export const myNewTable = pgTable('my_new_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
});
```

### 2. Criar Migration
```bash
# Crie arquivo: db/migrations/0010_create_my_new_table.sql
# Replique a estrutura do schema.ts em SQL
```

### 3. Aplicar Localmente
```bash
./db/apply-migrations.sh
```

### 4. Testar
```bash
# Via Supabase Studio ou psql
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT * FROM my_new_table;"
```

### 5. Commit
```bash
git add db/schema.ts db/migrations/0010_*
git commit -m "feat(db): adicionar tabela my_new_table"
```

### 6. Deploy
```bash
export DATABASE_URL='...'
./db/apply-migrations.sh --remote
```

---

## 📚 Recursos Adicionais

- **Drizzle ORM Docs**: https://orm.drizzle.team/docs/overview
- **Supabase CLI**: https://supabase.com/docs/guides/cli
- **PostgreSQL 14 Docs**: https://www.postgresql.org/docs/14/
- **Schema.ts**: A fonte da verdade definitiva

---

## 🤝 Suporte

Problemas? Verifique:
1. `supabase status` (local deve estar running)
2. Logs do script (output colorido indica problemas)
3. `git log db/` (histórico de mudanças)
4. Este README 😉

---

**Última Atualização:** Janeiro 2025  
**Versão das Migrations:** 0001-0009 (9 migrations)
