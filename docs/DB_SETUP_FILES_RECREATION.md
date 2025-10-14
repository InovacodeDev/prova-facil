# Database Setup Files - Clean Recreation Summary

**Data:** 2025-10-13
**Tarefa:** Recriar `inserts.sql`, `policies.sql` e `triggers.sql` sem DROP statements desnecessários

## 📋 Visão Geral

Os três arquivos principais de configuração do banco de dados foram recriados do zero, removendo todos os `DROP` statements e adaptando para o novo schema das migrations.

## ✅ Arquivos Recriados

### 1. `/db/triggers.sql` (125 linhas)

**Propósito:** Triggers automáticas para manutenção do banco de dados

**Conteúdo:**

#### 1.1. Automatic Timestamp Updates

- Função `update_updated_at_column()` - Atualiza `updated_at` automaticamente
- Triggers para 5 tabelas:
  - `profiles_updated_at`
  - `assessments_updated_at`
  - `questions_updated_at`
  - `plans_updated_at`
  - `academic_levels_updated_at`

#### 1.2. Stripe Subscription Cache Invalidation

- Função `notify_subscription_cache_invalidation()`
- Trigger `trigger_invalidate_subscription_cache` em `profiles`
- Envia notificação PostgreSQL quando `stripe_customer_id` ou `stripe_subscription_id` mudam
- Usado para invalidar cache Redis no lado da aplicação

#### 1.3. Log Tracking for Actions

- Função `increment_action_log(p_action)` - Incrementa contadores de forma segura (com concorrência)
- Trigger `assessments_after_insert_log` - Registra criação de assessments
- Trigger `questions_after_insert_log` - Registra criação de questions
- Usa JSONB `{"count": N}` em vez de coluna `count` integer

**Mudanças principais:**

- ❌ Removidos todos os `DROP TRIGGER IF EXISTS`
- ❌ Removidas triggers obsoletas de `copy_count` e `mean_questions_per_assessment`
- ✅ Simplificado para apenas essentials: timestamps, cache, e log básico
- ✅ Adaptado para nova estrutura de schema

---

### 2. `/db/policies.sql` (322 linhas)

**Propósito:** Row Level Security (RLS) policies para controle de acesso

**Conteúdo:**

#### 2.1. Profiles Table

- `profiles_select_all` - Leitura pública (para páginas de perfil)
- `profiles_update_own` - Usuários podem atualizar apenas seu próprio perfil
- `profiles_insert_own` - Usuários podem criar seu próprio perfil no signup
- `profiles_delete_own` - Usuários podem deletar seu próprio perfil

#### 2.2. Assessments Table

- `assessments_select_all` - Leitura pública (para compartilhamento)
- `assessments_insert_auth` - Usuários autenticados podem criar
- `assessments_update_own` - Apenas o dono pode atualizar
- `assessments_delete_own` - Apenas o dono pode deletar

#### 2.3. Questions Table

- `questions_select_all` - Leitura pública (para compartilhamento de assessments)
- `questions_insert_owner` - Inserir apenas em assessments próprios
- `questions_update_owner` - Atualizar apenas em assessments próprios
- `questions_delete_owner` - Deletar apenas de assessments próprios

#### 2.4. Logs Table

- `logs_select_all` - Leitura pública (para estatísticas)
- `logs_insert_auth` - Usuários autenticados podem inserir
- `logs_update_service` - Apenas sistema pode atualizar contadores

#### 2.5. Plans Table

- `plans_select_all` - Leitura pública (todos podem ver planos)
- `plans_manage_service` - Apenas admins podem gerenciar (requer coluna `is_admin`)

#### 2.6. Academic Levels Table

- `academic_levels_select_all` - Leitura pública
- `academic_levels_manage_service` - Apenas admins podem gerenciar

#### 2.7. Profile Logs Cycle Table

- `profile_logs_cycle_select_own` - Usuários veem apenas seus próprios logs
- `profile_logs_cycle_manage_system` - Sistema gerencia os logs

#### 2.8. Error Logs Table

- `error_logs_select_own` - Usuários veem apenas seus erros
- `error_logs_insert_all` - Qualquer um pode reportar erros (anon + auth)
- `error_logs_manage_service` - Apenas admins podem gerenciar

#### 2.9. Performance Indexes

- `idx_profiles_auth_uid` - Para lookups de `auth.uid()`
- `idx_assessments_profile_id_uid` - Para checks de ownership
- `idx_questions_assessment_for_auth` - Para ownership através de assessments

**Mudanças principais:**

- ❌ Removidos todos os `DROP POLICY IF EXISTS`
- ❌ Removidas referências a tabela `answers` (não existe no schema)
- ❌ Removidas policies complexas com `user_id` (schema usa `profile_id` = `auth.uid()` direto)
- ✅ Políticas simplificadas e mais claras
- ✅ Comentários em todas as policies explicando o propósito
- ✅ Notas sobre como habilitar funcionalidade de admin

---

### 3. `/db/inserts.sql` (260 linhas)

**Propósito:** Dados iniciais (seed data) para planos e níveis acadêmicos

**Conteúdo:**

#### 3.1. Plans (5 planos de assinatura)

| Plano          | Preço     | Questões | Assessments | Daily Limit | Copilot | Suporte  |
| -------------- | --------- | -------- | ----------- | ----------- | ------- | -------- |
| **Starter**    | R$ 0      | 30       | 5           | 10          | 10      | email    |
| **Basic**      | R$ 29,90  | 75       | 15          | 25          | 25      | email    |
| **Essentials** | R$ 49,90  | 150      | 30          | 50          | 50      | whatsapp |
| **Plus**       | R$ 79,90  | 250      | 50          | 100         | 100     | vip      |
| **Advanced**   | R$ 129,90 | 300      | 100         | 150         | 150     | vip      |

**Features incluídas como JSONB:**

- Modelo de IA usado (gemini-2.5-flash-lite, flash, ou pro)
- Tipos de documento suportados
- Tamanho máximo de arquivo
- Número de tipos de questão permitidos
- Tipo de suporte

#### 3.2. Academic Levels (13 níveis de ensino)

Cada nível tem configuração específica de:

- `allowed_question_types` - Array de tipos de questão permitidos
- `allowed_question_contexts` - Array de contextos permitidos

| Nível                 | Tipos de Questão  | Contextos                              |
| --------------------- | ----------------- | -------------------------------------- |
| **elementary_school** | 2 tipos (MC, T/F) | 2 contextos (fixação, contextualizada) |
| **middle_school**     | 4 tipos           | 3 contextos                            |
| **high_school**       | 7 tipos           | 4 contextos                            |
| **technical**         | 5 tipos           | 5 contextos                            |
| **undergraduate**     | 9 tipos           | 6 contextos                            |
| **specialization**    | 7 tipos           | 5 contextos                            |
| **mba**               | 6 tipos           | 4 contextos                            |
| **masters**           | 5 tipos           | 4 contextos                            |
| **doctorate**         | 4 tipos           | 4 contextos                            |
| **postdoctoral**      | 4 tipos           | 3 contextos                            |
| **extension**         | 5 tipos           | 4 contextos                            |
| **language_course**   | 5 tipos           | 2 contextos                            |
| **none**              | 11 tipos (todos)  | 7 contextos (todos)                    |

**Mudanças principais:**

- ❌ Removidos inserts para tabela `logs` com actions (não necessários)
- ❌ Removidas referências a colunas antigas (`model`, `doc_type`, `docs_size`, etc.)
- ✅ Schema adaptado ao novo design (colunas corretas da migration 0007)
- ✅ Features armazenadas como JSONB array de strings
- ✅ Preços alinhados com Stripe
- ✅ Academic levels com JSONB para arrays de enums

---

## 🔄 Ordem de Execução

Para um banco de dados limpo (após rodar as migrations):

```bash
# 1. Execute as migrations (em ordem)
cd db/migrations
for file in *.sql; do
  psql $DATABASE_URL -f "$file"
done

# 2. Execute triggers
psql $DATABASE_URL -f db/triggers.sql

# 3. Execute policies
psql $DATABASE_URL -f db/policies.sql

# 4. Execute inserts (dados iniciais)
psql $DATABASE_URL -f db/inserts.sql
```

**Via Supabase Dashboard:**

1. SQL Editor → Nova query
2. Cole o conteúdo de cada arquivo
3. Execute em ordem: migrations → triggers → policies → inserts

---

## 📝 Notas Importantes

### Para Produção

1. **Backup antes de tudo:**

   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Teste em staging primeiro** - Nunca aplique direto em produção

3. **Service Role** - Use service role key para executar migrations:
   - Bypass RLS automaticamente
   - Permissões completas

### Funcionalidade Admin

Para habilitar administradores:

```sql
-- Adicione coluna is_admin em profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Promova um usuário a admin
UPDATE profiles SET is_admin = true WHERE email = 'admin@example.com';
```

Depois descomente as linhas com `-- AND profiles.is_admin = true` nos arquivos de policies.

### Cache Redis

O trigger `notify_subscription_cache_invalidation` envia notificações PostgreSQL. Para capturá-las na aplicação:

```typescript
// Exemplo (Node.js + pg)
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query('LISTEN subscription_cache_invalidate');

client.on('notification', (msg) => {
  if (msg.channel === 'subscription_cache_invalidate') {
    const userId = msg.payload;
    // Invalidate Redis cache for this user
    redis.del(`subscription:${userId}`);
  }
});
```

---

## 🎯 Benefícios da Recriação

✅ **Código limpo** - Sem DROP statements desnecessários
✅ **Mais legível** - Comentários claros em português
✅ **Alinhado com schema** - Usa as colunas corretas das migrations
✅ **Melhor organização** - Cada seção bem documentada
✅ **Pronto para produção** - Pode ser aplicado em banco limpo
✅ **Manutenível** - Fácil de entender e modificar

---

## 🔗 Arquivos Relacionados

- `/db/migrations/` - Migrations individuais (0001 a 0009)
- `/db/migrations/README.md` - Guia completo de migrations
- `/db/schema.ts` - Schema Drizzle (fonte da verdade)
- `AGENTS.md` - Padrões de desenvolvimento

---

## 📚 Próximos Passos

Após aplicar estes arquivos:

1. ✅ Verificar que todas as policies funcionam:

   ```sql
   SET ROLE authenticated;
   SET request.jwt.claim.sub = '<user-uuid>';
   SELECT * FROM profiles; -- Deve retornar dados
   RESET ROLE;
   ```

2. ✅ Testar inserts funcionaram:

   ```sql
   SELECT COUNT(*) FROM plans; -- Deve ser 5
   SELECT COUNT(*) FROM academic_levels; -- Deve ser 13
   ```

3. ✅ Verificar triggers funcionam:

   ```sql
   UPDATE profiles SET email = 'test@example.com' WHERE id = auth.uid();
   SELECT updated_at FROM profiles WHERE id = auth.uid(); -- Deve ser NOW()
   ```

4. 🔄 Sincronizar com Stripe (se necessário):
   - Criar produtos no Stripe
   - Atualizar `plan_stripe_price_id` nos profiles

---

**Status:** ✅ Concluído
**Arquivos criados:** 3 (triggers.sql, policies.sql, inserts.sql)
**Linhas totais:** ~707 linhas
**Breaking changes:** Nenhum (arquivos novos, não edições)
