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
