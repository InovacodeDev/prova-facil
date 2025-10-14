-- Migration: Add plan_id to profiles table
-- This creates a direct relationship between profiles and plans
-- The plan_id is automatically updated when stripe_subscription_id changes
-- Step 1: Add plan_id column (nullable initially for existing records)
ALTER TABLE profiles
ADD COLUMN plan_id plan DEFAULT 'starter';

-- Step 2: Add foreign key constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_plan_id ON profiles (plan_id);

-- Step 4: Set plan_id to NOT NULL with default
ALTER TABLE profiles
ALTER COLUMN plan_id
SET
  NOT NULL;

-- Step 5: Add comment
COMMENT ON COLUMN profiles.plan_id IS 'Current plan ID - updated automatically when subscription changes. Defaults to starter for free users.';

-- Verify the migration
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM
  information_schema.columns
WHERE
  table_name = 'profiles'
  AND column_name = 'plan_id';
