CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id 
ON profiles(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_stripe_subscription_id 
ON payments(stripe_subscription_id);

CREATE INDEX idx_subscriptions_stripe_subscription_id 
ON subscriptions(stripe_subscription_id);

CREATE INDEX idx_subscriptions_user_id 
ON subscriptions(user_id);

CREATE INDEX idx_subscriptions_status 
ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id 
ON profiles(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON profiles(stripe_customer_id);

CREATE INDEX idx_plans_id ON public.plans(id);