-- Triggers: Database Triggers for Prova Fácil
-- Description: Automatic timestamp updates and cache invalidation
-- Dependencies: All migrations (especially 0003_create_profiles)
-- Created: 2025-10-13
--
-- This file contains:
-- 1. Timestamp update triggers (updated_at)
-- 2. Stripe subscription cache invalidation triggers
-- 3. Question types update tracking and validation

-- =====================================================
-- 1. AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- =====================================================
-- 1. AUTOMATIC TIMESTAMP UPDATES
-- =====================================================
-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for assessments table
CREATE TRIGGER assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for questions table
CREATE TRIGGER questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for plans table
CREATE TRIGGER plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates the updated_at timestamp on row update';

-- =====================================================
-- 2. STRIPE SUBSCRIPTION CACHE INVALIDATION
-- =====================================================

-- =====================================================
-- 2. STRIPE SUBSCRIPTION CACHE INVALIDATION
-- =====================================================
-- Notifies application to invalidate Redis cache when Stripe fields change

CREATE OR REPLACE FUNCTION notify_subscription_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if Stripe fields changed
    IF (OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id) OR
       (OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id) THEN

        -- Notify with profile_id as payload
        PERFORM pg_notify('subscription_cache_invalidate', NEW.id::text);

        -- Log the change for debugging
        RAISE NOTICE 'Subscription cache invalidation triggered for profile_id: %', NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on profiles table
CREATE TRIGGER trigger_invalidate_subscription_cache
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN (
        OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
        OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id
    )
    EXECUTE FUNCTION notify_subscription_cache_invalidation();

COMMENT ON FUNCTION notify_subscription_cache_invalidation IS
    'Notifies application to invalidate Redis subscription cache when Stripe fields change';

COMMENT ON TRIGGER trigger_invalidate_subscription_cache ON profiles IS
    'Triggers cache invalidation notification when stripe_customer_id or stripe_subscription_id changes';

-- =====================================================
-- 3. LOG TRACKING FOR ACTIONS
-- =====================================================
-- Helper function for safe upsert/increment of log counters

CREATE OR REPLACE FUNCTION increment_action_log(p_action action_type)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  LOOP
    -- Try to update existing row
    UPDATE logs
    SET details = jsonb_set(
        COALESCE(details, '{}'::jsonb),
        '{count}',
        to_jsonb(COALESCE((details->>'count')::integer, 0) + 1)
    ),
        created_at = CURRENT_TIMESTAMP
    WHERE action = p_action;

    IF FOUND THEN
      RETURN;
    END IF;

    -- If no row was updated, try to insert one
    BEGIN
      INSERT INTO logs (action, details, created_at)
      VALUES (p_action, '{"count": 1}'::jsonb, CURRENT_TIMESTAMP);
      RETURN;
    EXCEPTION WHEN unique_violation THEN
      -- Concurrent insert happened, loop and try update again
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- Trigger: Increment log when assessments are created
CREATE OR REPLACE FUNCTION trg_assessments_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_action_log('create_new_questions'::action_type);
  PERFORM increment_action_log('unique_assessments'::action_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessments_after_insert_log
    AFTER INSERT ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION trg_assessments_after_insert();

-- Trigger: Increment log when questions are created
CREATE OR REPLACE FUNCTION trg_questions_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_action_log('new_questions'::action_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_after_insert_log
    AFTER INSERT ON questions
    FOR EACH ROW
    EXECUTE FUNCTION trg_questions_after_insert();

COMMENT ON FUNCTION increment_action_log IS 'Safely increments action log counters with concurrency handling';
COMMENT ON FUNCTION trg_assessments_after_insert IS 'Logs assessment creation events';
COMMENT ON FUNCTION trg_questions_after_insert IS 'Logs question creation events';

-- Function and Trigger: Auto-update plan_id when stripe_subscription_id changes
-- This ensures profiles.plan_id always reflects the current active subscription

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_plan_id_on_subscription_change ON profiles;
DROP FUNCTION IF EXISTS update_plan_id_from_subscription();

-- Create function to update plan_id based on subscription
CREATE OR REPLACE FUNCTION update_plan_id_from_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id TEXT;
  v_plan_id plan;
BEGIN
  -- Check if stripe_subscription_id changed
  IF (TG_OP = 'UPDATE' AND OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id)
     OR (TG_OP = 'INSERT' AND NEW.stripe_subscription_id IS NOT NULL) THEN

    -- If subscription was removed, set to starter
    IF NEW.stripe_subscription_id IS NULL THEN
      NEW.plan_id := 'starter';
      RAISE NOTICE 'Setting plan_id to starter (no subscription)';
      RETURN NEW;
    END IF;

    -- Try to get product_id from Stripe (this would be set by webhook)
    -- For now, we'll use a mapping approach via the plans table
    -- The webhook should update stripe_subscription_id and plan_id together

    -- If webhook already set plan_id, keep it
    IF TG_OP = 'UPDATE' AND OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
      RAISE NOTICE 'plan_id already updated to: %', NEW.plan_id;
      RETURN NEW;
    END IF;

    -- Otherwise, default to starter (webhook should update it properly)
    IF TG_OP = 'INSERT' THEN
      NEW.plan_id := 'starter';
    END IF;

    RAISE NOTICE 'Subscription changed. plan_id: %, subscription_id: %', NEW.plan_id, NEW.stripe_subscription_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_plan_id_on_subscription_change
  BEFORE INSERT OR UPDATE OF stripe_subscription_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_id_from_subscription();

-- Add comment
COMMENT ON FUNCTION update_plan_id_from_subscription() IS
  'Automatically updates plan_id when stripe_subscription_id changes.
   Sets to starter if subscription is null.
   Webhook should update both stripe_subscription_id and plan_id together.';

-- Test the trigger (optional - remove in production)
-- UPDATE profiles SET stripe_subscription_id = NULL WHERE id = 'some-id';

-- =====================================================
-- 4. AUTO-SYNC STRIPE SUBSCRIPTION ON PROFILE CHANGES
-- =====================================================
-- Automatically sync the most recent active subscription from Stripe
-- whenever profile changes and has a stripe_customer_id

CREATE OR REPLACE FUNCTION notify_sync_stripe_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if profile has a stripe_customer_id
    IF NEW.stripe_customer_id IS NOT NULL THEN
        -- Check if this is a significant change that might require sync
        -- (any update to the profile, except updated_at changes)
        IF TG_OP = 'INSERT' OR (
            TG_OP = 'UPDATE' AND (
                OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
                OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id OR
                OLD.plan_id IS DISTINCT FROM NEW.plan_id
            )
        ) THEN
            -- Notify with profile_id and customer_id as payload
            PERFORM pg_notify(
                'sync_stripe_subscription',
                json_build_object(
                    'profile_id', NEW.id,
                    'customer_id', NEW.stripe_customer_id
                )::text
            );

            RAISE NOTICE 'Stripe subscription sync notification triggered for profile_id: %, customer_id: %',
                NEW.id, NEW.stripe_customer_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on profiles table
CREATE TRIGGER trigger_sync_stripe_subscription
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    WHEN (NEW.stripe_customer_id IS NOT NULL)
    EXECUTE FUNCTION notify_sync_stripe_subscription();

COMMENT ON FUNCTION notify_sync_stripe_subscription IS
    'Notifies application to sync the most recent active Stripe subscription when profile changes.
     This ensures stripe_subscription_id always reflects the current active subscription from Stripe.';

COMMENT ON TRIGGER trigger_sync_stripe_subscription ON profiles IS
    'Triggers subscription sync notification when profile is created or Stripe fields change';
