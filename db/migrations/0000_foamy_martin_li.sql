CREATE TYPE "public"."academic_level" AS ENUM('elementary_school', 'middle_school', 'high_school', 'technical', 'undergraduate', 'specialization', 'mba', 'masters', 'doctorate', 'postdoctoral', 'extension', 'language_course', 'none');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('create_new_questions', 'new_questions', 'copy_question', 'unique_assessments', 'mean_questions_per_assessment');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('starter', 'basic', 'essentials', 'plus', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."question_context" AS ENUM('fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'letra_lei', 'pesquisa');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving', 'essay', 'project_based', 'gamified', 'summative');--> statement-breakpoint
CREATE TYPE "public"."renew_status" AS ENUM('monthly', 'yearly', 'trial', 'canceled', 'none');--> statement-breakpoint
CREATE TYPE "public"."support_type_enum" AS ENUM('email', 'whatsapp', 'vip');--> statement-breakpoint
CREATE TABLE "academic_levels" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_levels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" "academic_level" NOT NULL,
	"allowed_question_types" "question_type"[] NOT NULL,
	"allowed_question_context" "question_context"[] NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academic_levels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject" varchar(255) NOT NULL,
	"title" varchar(1024),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" "action_type" NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" "plan" PRIMARY KEY NOT NULL,
	"model" varchar(255) NOT NULL,
	"questions_month" integer DEFAULT 30 NOT NULL,
	"doc_type" text[] NOT NULL,
	"docs_size" integer DEFAULT 10 NOT NULL,
	"max_question_types" integer DEFAULT 1 NOT NULL,
	"support" "support_type_enum"[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_logs_cycle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cycle" varchar(7) NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"subjects_breakdown" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"full_name" varchar(255),
	"email" varchar(320) NOT NULL,
	"plan" "plan" DEFAULT 'starter' NOT NULL,
	"plan_expire_at" timestamp,
	"renew_status" "renew_status" DEFAULT 'none' NOT NULL,
	"academic_level_id" integer,
	"allowed_cookies" text[] DEFAULT '{}' NOT NULL,
	"selected_question_types" "question_type"[] DEFAULT '{}' NOT NULL,
	"question_types_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid,
	"type" "question_type" DEFAULT 'multiple_choice' NOT NULL,
	"question" varchar(8192) NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"copy_count" integer DEFAULT 0 NOT NULL,
	"copy_last_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_logs_cycle" ADD CONSTRAINT "profile_logs_cycle_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_academic_level_id_academic_levels_id_fk" FOREIGN KEY ("academic_level_id") REFERENCES "public"."academic_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;