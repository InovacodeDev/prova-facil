CREATE TABLE "plan_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan" "plan" NOT NULL,
	"model" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_models_plan_unique" UNIQUE("plan")
);

-- Insert default plan-model mappings
INSERT INTO "plan_models" ("plan", "model") VALUES
	('starter', 'gemini-2.0-flash-exp'),
	('basic', 'gemini-2.0-flash-exp'),
	('essentials', 'gemini-2.0-flash-exp'),
	('plus', 'gemini-2.0-flash-exp'),
	('advanced', 'gemini-exp-1206');
