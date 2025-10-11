CREATE OR REPLACE VIEW profile_subscription_summary AS
SELECT 
  p.id as profile_id,
  p.user_id,
  p.email,
  p.full_name,
  p.plan,
  p.stripe_subscription_id,
  p.stripe_customer_id,
  s.status as subscription_status,
  s.event_type as last_subscription_event,
  s.created_at as subscription_last_updated
FROM profiles p
LEFT JOIN (
  SELECT DISTINCT ON (stripe_subscription_id)
    stripe_subscription_id,
    status,
    event_type,
    created_at
  FROM subscriptions
  ORDER BY stripe_subscription_id, created_at DESC
) s ON p.stripe_subscription_id = s.stripe_subscription_id;

CREATE OR REPLACE VIEW public_profiles_count AS
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_profiles,
  COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified_profiles
FROM profiles;

CREATE OR REPLACE VIEW profile_subscription_summary AS
SELECT 
  p.id as profile_id,
  p.user_id,
  p.email,
  p.full_name,
  p.plan,
  p.stripe_subscription_id,
  p.stripe_customer_id,
  s.status as subscription_status,
  s.event_type as last_subscription_event,
  s.created_at as subscription_last_updated
FROM profiles p
LEFT JOIN (
  SELECT DISTINCT ON (stripe_subscription_id)
    stripe_subscription_id,
    status,
    event_type,
    created_at
  FROM subscriptions
  ORDER BY stripe_subscription_id, created_at DESC
) s ON p.stripe_subscription_id = s.stripe_subscription_id;