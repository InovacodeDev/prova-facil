BEGIN;

-- 0) Segurança: garantir que view não bloqueie alteração (drop + recreate)
-- Se existir, drope a view dependente (evita "depends on column" errors).
DROP VIEW IF EXISTS profile_subscription_summary;

-- 1) Criar nova view baseada em stripe_customer_id (versão segura / temporária)
CREATE VIEW profile_subscription_summary AS
SELECT
  p.user_id,
  p.id AS profile_id,
  p.stripe_customer_id,
  s.stripe_subscription_id,
  s.status,
  s.event_type,
  s.created_at AS subscription_created_at,
  NULL::bigint AS current_period_start,
  NULL::bigint AS current_period_end
FROM profiles p
LEFT JOIN LATERAL (
  SELECT
    stripe_subscription_id,
    stripe_customer_id,
    status,
    event_type,
    created_at
  FROM subscriptions
  WHERE subscriptions.stripe_customer_id = p.stripe_customer_id
  ORDER BY created_at DESC
  LIMIT 1
) s ON true;

-- 2) Agora é seguro remover a coluna redundante de profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_subscription_id;

-- 3) Garantir uniqueness em stripe_customer_id (permite NULL)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_stripe_customer_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_unique 
ON profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN profiles.stripe_customer_id IS 
'Customer ID do Stripe - ÚNICA fonte da verdade para identificar o cliente. NULL para planos starter (gratuito).';

COMMENT ON COLUMN profiles.plan IS 
'Cache do plano atual para queries rápidas. Sincronizado pelo webhook do Stripe.';

-- 4) Atualizar subscriptions (audit trail): índices e comentários
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_customer_id_key;

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_created_at_idx ON subscriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON subscriptions(user_id, status, created_at DESC);

COMMENT ON TABLE subscriptions IS 
'AUDIT TRAIL - Histórico de eventos de subscription do Stripe. NÃO usar como fonte da verdade. Consultar sempre o Stripe API para dados atuais.';

COMMENT ON COLUMN subscriptions.event_type IS 
'Tipo de evento do webhook: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, etc.';

-- 5) Verificação rápida de integridade
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM profiles
    WHERE plan != 'starter' AND stripe_customer_id IS NULL;
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Atenção: % perfis com plano pago mas sem stripe_customer_id. Revisar dados.', invalid_count;
    END IF;
END $$;

-- 6) Policies (recriar/atualizar)
DROP POLICY IF EXISTS subscriptions_select_owner ON subscriptions;
CREATE POLICY subscriptions_select_owner ON subscriptions
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

COMMIT;