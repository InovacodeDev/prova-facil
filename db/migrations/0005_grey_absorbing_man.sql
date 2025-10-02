CREATE TYPE "public"."academic_level" AS ENUM('elementary_school', 'middle_school', 'high_school', 'technical', 'undergraduate', 'specialization', 'mba', 'masters', 'doctorate', 'postdoctoral', 'extension', 'language_course', 'none');--> statement-breakpoint
CREATE TYPE "public"."question_context" AS ENUM('fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'letra_lei', 'pesquisa');--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'fill_in_the_blank';--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'matching_columns';--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'problem_solving';--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'essay';--> statement-breakpoint
ALTER TABLE "academic_level_subjects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subjects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "academic_level_subjects" CASCADE;--> statement-breakpoint
DROP TABLE "subjects" CASCADE;--> statement-breakpoint
ALTER TABLE "assessments" DROP CONSTRAINT "assessments_subject_id_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "academic_levels" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "academic_levels" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "academic_levels" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "academic_levels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "academic_levels" ALTER COLUMN "name" SET DATA TYPE "public"."academic_level" USING "name"::"public"."academic_level";--> statement-breakpoint
ALTER TABLE "academic_levels" ADD COLUMN "allowed_question_types" "question_type"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_levels" ADD COLUMN "allowed_question_context" "question_context"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "subject" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" DROP COLUMN "subject_id";