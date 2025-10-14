# Database Migrations

Este diretório contém as migrations do banco de dados do Prova Fácil, organizadas em arquivos individuais para facilitar a manutenção e versionamento.

## Estrutura

As migrations estão numeradas sequencialmente e devem ser executadas **em ordem**:

### 0001_create_enums.sql

Cria todos os tipos ENUM usados no banco de dados:

- `plan` - Planos de assinatura (starter, basic, essentials, plus, advanced)
- `support_type_enum` - Tipos de suporte (email, whatsapp, vip)
- `question_type` - Tipos de questões (multiple_choice, true_false, open, etc.)
- `question_context` - Contextos de questões (fixacao, contextualizada, teorica, etc.)
- `action_type` - Tipos de ações logadas (create_new_questions, copy_question, etc.)
- `academic_level` - Níveis acadêmicos (elementary_school até postdoctoral)
- `error_level` - Níveis de erro (error, warn, fatal, info)

### 0002_create_academic_levels.sql

Cria a tabela `academic_levels`:

- Armazena configurações de níveis acadêmicos
- Define tipos e contextos de questões permitidos por nível
- **Sem dependências de outras tabelas**

### 0003_create_profiles.sql

Cria a tabela `profiles`:

- Perfis de usuário com dados de assinatura
- Integração com Stripe (customer_id, subscription_id)
- Limites e contadores de uso (questões, avaliações, copilot)
- **Depende de:** `academic_levels` (FK: academic_level_id)

### 0004_create_assessments.sql

Cria a tabela `assessments`:

- Avaliações/provas criadas pelos usuários
- **Depende de:** `profiles` (FK: profile_id)

### 0005_create_questions.sql

Cria a tabela `questions`:

- Questões geradas por IA dentro das avaliações
- Metadados da questão e da geração por IA
- **Depende de:** `assessments` (FK: assessment_id)

### 0006_create_logs.sql

Cria a tabela `logs`:

- Log de ações para analytics
- **Sem dependências de outras tabelas**

### 0007_create_plans.sql

Cria a tabela `plans`:

- Configurações de planos e precificação
- Features e limites por plano
- **Sem dependências de outras tabelas**

### 0008_create_profile_logs_cycle.sql

Cria a tabela `profile_logs_cycle`:

- Tracking de uso mensal por usuário
- Contadores de questões e avaliações criadas por ciclo
- **Depende de:** `profiles` (FK: profile_id)

### 0009_create_error_logs.sql

Cria a tabela `error_logs`:

- Log de erros da aplicação
- **Sem dependências de outras tabelas**

## Ordem de Execução

**IMPORTANTE:** As migrations devem ser executadas na ordem numérica devido às dependências:

```text
0001 (ENUMs)
  ↓
0002 (academic_levels)
  ↓
0003 (profiles) ← depende de academic_levels
  ↓
0004 (assessments) ← depende de profiles
  ↓
0005 (questions) ← depende de assessments

Paralelo (sem dependências entre si):
- 0006 (logs)
- 0007 (plans)
- 0008 (profile_logs_cycle) ← depende de profiles
- 0009 (error_logs)
```

## Como Executar

### Via Supabase Dashboard

1. Acesse o Supabase Dashboard → SQL Editor
2. Execute cada arquivo na ordem numérica
3. Verifique se não há erros antes de prosseguir

### Via CLI (psql)

```bash
# Execute todas as migrations em ordem
for file in db/migrations/*.sql; do
  psql $DATABASE_URL -f "$file"
done
```

### Via Drizzle

```bash
# Gerar migrations do Drizzle a partir do schema.ts
pnpm drizzle-kit generate

# Aplicar migrations
pnpm drizzle-kit push
```

## Rollback

Para reverter uma migration, você precisa criar uma migration reversa. Exemplo:

```sql
-- 0010_rollback_error_logs.sql
DROP TABLE IF EXISTS error_logs;
```

## Notas Importantes

- ✅ Cada tabela tem seu próprio arquivo para facilitar manutenção
- ✅ Comentários SQL descrevem o propósito de cada coluna
- ✅ Indexes criados para otimizar queries comuns
- ✅ Foreign Keys configuradas com `ON DELETE CASCADE` ou `ON DELETE SET NULL`
- ✅ Constraints de unicidade onde necessário
- ⚠️ **NUNCA execute migrations em produção sem backup**
- ⚠️ **SEMPRE teste as migrations em ambiente de desenvolvimento primeiro**

## Próximos Passos

Após executar as migrations, você deve:

1. Executar `db/triggers.sql` para criar triggers de atualização de timestamps
2. Executar `db/policies.sql` para configurar Row Level Security (RLS)
3. Executar `db/inserts.sql` para popular dados iniciais (planos, níveis acadêmicos)

## Manutenção

Ao adicionar novas tabelas:

1. Crie um novo arquivo numerado sequencialmente (ex: `0010_create_nova_tabela.sql`)
2. Documente as dependências no header do arquivo
3. Atualize este README com a nova migration
4. Teste em desenvolvimento antes de aplicar em produção
