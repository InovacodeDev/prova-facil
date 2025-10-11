ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_stripe_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripe_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "event_type" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "plan_expire_at";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "renew_status";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "pending_plan_id";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "pending_plan_change_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "current_period_start";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "current_period_end";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "cancel_at_period_end";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "canceled_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "updated_at";

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_subscription_id_fkey;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);