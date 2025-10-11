# 🗄️ Aplicação de Migrações - Stripe Integration

## Como Aplicar as Migrações no Supabase

As novas tabelas `subscriptions` e `payments` foram adicionadas ao schema. Para aplicá-las no Supabase:

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo do arquivo: `db/migrations/0002_brave_layla_miller.sql`
6. Clique em **Run** para executar

### Opção 2: Via SQL direto (copie e cole)

```sql
-- Criar enum para status de assinatura
CREATE TYPE "public"."subscription_status" AS ENUM(
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'trialing',
  'unpaid'
);

-- Criar tabela de pagamentos
CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "subscription_id" uuid,
  "stripe_payment_intent_id" varchar(255) NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(3) DEFAULT 'brl' NOT NULL,
  "status" varchar(50) NOT NULL,
  "payment_method" varchar(50),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);

-- Criar tabela de assinaturas
CREATE TABLE "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "stripe_customer_id" varchar(255) NOT NULL,
  "stripe_subscription_id" varchar(255) NOT NULL,
  "stripe_price_id" varchar(255) NOT NULL,
  "status" "subscription_status" NOT NULL,
  "plan_id" "plan" NOT NULL,
  "current_period_start" timestamp NOT NULL,
  "current_period_end" timestamp NOT NULL,
  "cancel_at_period_end" boolean DEFAULT false NOT NULL,
  "canceled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);

-- Adicionar foreign keys
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."profiles"("id")
  ON DELETE no action
  ON UPDATE no action;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk"
  FOREIGN KEY ("subscription_id")
  REFERENCES "public"."subscriptions"("id")
  ON DELETE no action
  ON UPDATE no action;

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."profiles"("id")
  ON DELETE no action
  ON UPDATE no action;
```

### Opção 3: Via Drizzle CLI (se configurado)

```bash
# Aplicar migrações usando Drizzle
pnpm drizzle-kit push:pg
```

## ✅ Verificação

Após aplicar, verifique se as tabelas foram criadas:

```sql
-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payments');

-- Verificar enum
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'subscription_status'::regtype;
```

Você deve ver:

- ✅ Tabela `subscriptions` criada
- ✅ Tabela `payments` criada
- ✅ Enum `subscription_status` com 7 valores

## 🔐 Políticas RLS (Row Level Security)

**IMPORTANTE**: As migrações criam apenas as tabelas. Você precisa configurar as políticas RLS manualmente.

### Exemplo de Políticas Recomendadas

```sql
-- Habilitar RLS nas novas tabelas
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Usuários podem ver apenas seus próprios pagamentos
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Apenas o sistema pode inserir/atualizar (via Service Role Key)
-- Webhooks usarão Service Role Key, então não precisam de política pública
```

## 📝 Notas

- As tabelas usam `uuid` para IDs (compatível com Supabase Auth)
- Timestamps usam `now()` como padrão
- Foreign keys garantem integridade referencial
- Constraints únicos previnem duplicação de registros Stripe

---

**Próximo passo**: Configure as variáveis de ambiente e teste o fluxo completo! 🚀
