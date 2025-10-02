ALTER TABLE "profiles" ALTER COLUMN "allowed_cookies" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "allowed_cookies" SET DEFAULT '{"essential": true, "analytics": false, "preferences": false, "marketing": false}';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "allowed_cookies" SET NOT NULL;

COMMENT ON COLUMN public.profiles.allowed_cookies IS 'JSON object storing user cookie preferences: {essential: boolean, analytics: boolean, preferences: boolean, marketing: boolean}';
