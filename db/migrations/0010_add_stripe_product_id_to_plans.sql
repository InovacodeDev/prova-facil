-- Migration: Add stripe_product_id to plans table
-- Description: Links plans table with Stripe products for single source of truth
-- Author: AI Agent
-- Date: 2025-10-14
-- Add stripe_product_id column (temporarily nullable for migration)
ALTER TABLE plans
ADD COLUMN stripe_product_id VARCHAR(255);

-- IMPORTANT: Update these values with your actual Stripe Product IDs from Stripe Dashboard
-- You can find them in: Stripe Dashboard > Products > [Product Name] > ID (starts with 'prod_')
-- Or get them from your environment variables:
-- STRIPE_PRODUCT_STARTER, STRIPE_PRODUCT_BASIC, STRIPE_PRODUCT_ESSENTIALS,
-- STRIPE_PRODUCT_PLUS, STRIPE_PRODUCT_ADVANCED
-- Temporary placeholder values (MUST BE UPDATED)
-- Example format: UPDATE plans SET stripe_product_id = 'prod_ABC123XYZ' WHERE id = 'starter';
-- Uncomment and update these lines with your real Stripe Product IDs:
-- UPDATE plans SET stripe_product_id = 'prod_YOUR_STARTER_ID' WHERE id = 'starter';
-- UPDATE plans SET stripe_product_id = 'prod_YOUR_BASIC_ID' WHERE id = 'basic';
-- UPDATE plans SET stripe_product_id = 'prod_YOUR_ESSENTIALS_ID' WHERE id = 'essentials';
-- UPDATE plans SET stripe_product_id = 'prod_YOUR_PLUS_ID' WHERE id = 'plus';
-- UPDATE plans SET stripe_product_id = 'prod_YOUR_ADVANCED_ID' WHERE id = 'advanced';
-- After updating the product IDs above, uncomment these constraints:
-- Make stripe_product_id NOT NULL and UNIQUE
-- ALTER TABLE plans
-- ALTER COLUMN stripe_product_id SET NOT NULL;
-- ALTER TABLE plans
-- ADD CONSTRAINT plans_stripe_product_id_unique UNIQUE (stripe_product_id);
-- Create index for faster lookups
-- CREATE INDEX idx_plans_stripe_product_id ON plans(stripe_product_id);
-- Comments
COMMENT ON COLUMN plans.stripe_product_id IS 'Stripe Product ID (e.g., prod_XXX) - Links plan with Stripe product';
