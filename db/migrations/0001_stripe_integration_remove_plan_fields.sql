-- Migration: Remove plan fields from profiles and add Stripe fields
-- Created at: 2025-01-28
-- Description: Removes plan, plan_expire_at, renew_status from profiles table
--              and adds stripe_customer_id and stripe_subscription_id.
--              Plan information will be fetched from Stripe API with Redis caching.

-- Drop the old renew_status enum if it exists (it won't be used anymore)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'renew_status') THEN
    -- First, we need to drop columns using this enum
    ALTER TABLE profiles DROP COLUMN IF EXISTS renew_status;
    -- Then drop the enum
    DROP TYPE IF EXISTS renew_status;
  END IF;
END $$;

-- Remove plan-related columns from profiles table
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS plan,
  DROP COLUMN IF EXISTS plan_expire_at;

-- Add Stripe fields if they don't exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
  ON profiles (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id 
  ON profiles (stripe_subscription_id);

-- Add comments to explain the purpose
COMMENT ON COLUMN profiles.stripe_customer_id IS 
  'Stripe Customer ID for payment management';

COMMENT ON COLUMN profiles.stripe_subscription_id IS 
  'Current active Stripe Subscription ID. Plan info fetched from Stripe API with Redis cache';

-- Note: The 'plan' enum type is kept for the 'plans' configuration table,
-- but profiles no longer store plan information directly.
