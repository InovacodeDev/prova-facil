-- Data Migration: Populate stripe_product_id in plans table
-- This script should be run AFTER setting up your Stripe products
-- Run this manually or via a migration script after updating the product IDs

-- STEP 1: Update these variables with your actual Stripe Product IDs
\set starter_id 'prod_YOUR_STARTER_ID_HERE'
\set basic_id 'prod_YOUR_BASIC_ID_HERE'
\set essentials_id 'prod_YOUR_ESSENTIALS_ID_HERE'
\set plus_id 'prod_YOUR_PLUS_ID_HERE'
\set advanced_id 'prod_YOUR_ADVANCED_ID_HERE'

-- STEP 2: Populate stripe_product_id for each plan
UPDATE plans SET stripe_product_id = :'starter_id' WHERE id = 'starter';
UPDATE plans SET stripe_product_id = :'basic_id' WHERE id = 'basic';
UPDATE plans SET stripe_product_id = :'essentials_id' WHERE id = 'essentials';
UPDATE plans SET stripe_product_id = :'plus_id' WHERE id = 'plus';
UPDATE plans SET stripe_product_id = :'advanced_id' WHERE id = 'advanced';

-- STEP 3: Apply constraints after data is populated
ALTER TABLE plans
ALTER COLUMN stripe_product_id SET NOT NULL;

ALTER TABLE plans
ADD CONSTRAINT plans_stripe_product_id_unique UNIQUE (stripe_product_id);

-- STEP 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_plans_stripe_product_id ON plans(stripe_product_id);

-- Verify the migration
SELECT id, stripe_product_id FROM plans ORDER BY id;
