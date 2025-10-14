-- Data Migration: Populate stripe_product_id in plans table
-- This script should be run AFTER setting up your Stripe products
-- Run this manually or via a migration script after updating the product IDs

-- STEP 1: Update these variables with your actual Stripe Product IDs
-- \set starter_id 'prod_TEN621F9c7mmmf'
-- \set basic_id 'prod_TEN7yqB6u8yLoN'
-- \set essentials_id 'prod_TEN7czfNuZR8az'
-- \set plus_id 'prod_TEN7Dg4bHd46Lw'
-- \set advanced_id 'prod_TEN7ZiR3FQfyK6'

-- STEP 2: Populate stripe_product_id for each plan
UPDATE plans SET stripe_product_id = 'prod_TEN621F9c7mmmf' WHERE id = 'starter';
UPDATE plans SET stripe_product_id = 'prod_TEN7yqB6u8yLoN' WHERE id = 'basic';
UPDATE plans SET stripe_product_id = 'prod_TEN7czfNuZR8az' WHERE id = 'essentials';
UPDATE plans SET stripe_product_id = 'prod_TEN7Dg4bHd46Lw' WHERE id = 'plus';
UPDATE plans SET stripe_product_id = 'prod_TEN7ZiR3FQfyK6' WHERE id = 'advanced';

-- STEP 3: Apply constraints after data is populated
ALTER TABLE plans
ALTER COLUMN stripe_product_id SET NOT NULL;

ALTER TABLE plans
ADD CONSTRAINT plans_stripe_product_id_unique UNIQUE (stripe_product_id);

-- STEP 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_plans_stripe_product_id ON plans(stripe_product_id);

-- Verify the migration
SELECT id, stripe_product_id FROM plans ORDER BY id;
