ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
ALTER TABLE "assessments" RENAME COLUMN "category_id" TO "subject_id";--> statement-breakpoint
ALTER TABLE "assessments" DROP CONSTRAINT "assessments_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;