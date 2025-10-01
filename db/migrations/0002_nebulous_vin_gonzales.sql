CREATE TYPE "public"."action_type" AS ENUM('create_new_questions', 'new_questions', 'copy_question');--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" "action_type" NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "copy_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "copy_last_at" timestamp;