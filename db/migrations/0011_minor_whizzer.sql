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
DROP TABLE "answers" CASCADE;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "max_question_types" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "selected_question_types" "question_type"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "question_types_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "profile_logs_cycle" ADD CONSTRAINT "profile_logs_cycle_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Step 2: Add new column to plans
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS max_question_types INTEGER NOT NULL DEFAULT 1;

-- Step 3: Populate max_question_types based on existing allowed_questions
-- This migration assumes the following mappings:
-- starter: 1 type
-- basic: 3 types
-- essentials: 5 types
-- plus: 8 types
-- advanced: 11 types

UPDATE plans SET max_question_types = 1 WHERE id = 'starter';
UPDATE plans SET max_question_types = 3 WHERE id = 'basic';
UPDATE plans SET max_question_types = 5 WHERE id = 'essentials';
UPDATE plans SET max_question_types = 8 WHERE id = 'plus';
UPDATE plans SET max_question_types = 11 WHERE id = 'advanced';

-- Step 4: Migrate existing user data - set default selected_question_types based on their plan
-- Starter users get multiple_choice by default
UPDATE profiles 
SET selected_question_types = ARRAY['multiple_choice']::question_type[]
WHERE plan = 'starter' AND selected_question_types = '{}';

-- Basic users get multiple_choice, open, true_false by default
UPDATE profiles 
SET selected_question_types = ARRAY['multiple_choice', 'open', 'true_false']::question_type[]
WHERE plan = 'basic' AND selected_question_types = '{}';

-- Essentials users get 5 types by default
UPDATE profiles 
SET selected_question_types = ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank']::question_type[]
WHERE plan = 'essentials' AND selected_question_types = '{}';

-- Plus users get 8 types by default
UPDATE profiles 
SET selected_question_types = ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving', 'essay']::question_type[]
WHERE plan = 'plus' AND selected_question_types = '{}';

-- Advanced users get all 11 types by default
UPDATE profiles 
SET selected_question_types = ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving', 'essay', 'project_based', 'gamified', 'summative']::question_type[]
WHERE plan = 'advanced' AND selected_question_types = '{}';

-- Step 5: Drop old column from plans (after data migration)
ALTER TABLE plans DROP COLUMN IF EXISTS allowed_questions;

-- Step 6: Add comments
COMMENT ON COLUMN profiles.selected_question_types IS 'Array of question types the user has chosen to use (limited by plan max_question_types)';
COMMENT ON COLUMN profiles.question_types_updated_at IS 'Timestamp of last question types change (limited to once per month)';
COMMENT ON COLUMN plans.max_question_types IS 'Maximum number of question types allowed for this plan';

-- Step 7: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_selected_question_types 
ON profiles USING GIN(selected_question_types);

-- Step 8: Create function to check if user can update question types (once per month)
CREATE OR REPLACE FUNCTION can_update_question_types(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_update TIMESTAMP WITH TIME ZONE;
    one_month_ago TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the last update timestamp
    SELECT question_types_updated_at INTO last_update
    FROM profiles
    WHERE id = user_id;
    
    -- If never updated, allow update
    IF last_update IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate one month ago from now
    one_month_ago := NOW() - INTERVAL '1 month';
    
    -- Return true if last update was more than a month ago
    RETURN last_update <= one_month_ago;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION can_update_question_types IS 'Check if user can update their selected question types (limited to once per month)';

-- Create unique index to ensure one record per user per cycle
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_logs_cycle_user_cycle 
ON profile_logs_cycle(user_id, cycle);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_profile_logs_cycle_user_id 
ON profile_logs_cycle(user_id);

-- Create index for faster queries by cycle
CREATE INDEX IF NOT EXISTS idx_profile_logs_cycle_cycle 
ON profile_logs_cycle(cycle);

-- Add RLS policies
ALTER TABLE profile_logs_cycle ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own logs
CREATE POLICY "Users can view their own cycle logs"
ON profile_logs_cycle
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert/update logs (via service role)
CREATE POLICY "System can manage cycle logs"
ON profile_logs_cycle
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE profile_logs_cycle IS 'Monthly usage tracking for question generation by user and subject';
COMMENT ON COLUMN profile_logs_cycle.cycle IS 'Month and year in YYYY-MM format';
COMMENT ON COLUMN profile_logs_cycle.subjects_breakdown IS 'JSONB array of objects with subject and count: [{subject: "Math", count: 10}]';
