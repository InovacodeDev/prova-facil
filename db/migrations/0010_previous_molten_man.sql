ALTER TYPE "public"."question_type" ADD VALUE 'project_based';--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'gamified';--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'summative';--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "metadata" jsonb DEFAULT '{}' NOT NULL;