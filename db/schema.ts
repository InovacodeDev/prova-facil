import { relations } from 'drizzle-orm';
import { pgTable, varchar, text, timestamp, boolean, uuid, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core';

export const RenewStatus = {
  monthly: 'monthly',
  yearly: 'yearly',
  trial: 'trial',
  canceled: 'canceled',
  none: 'none',
} as const;

export const renewStatusEnum = pgEnum('renew_status', ['monthly', 'yearly', 'trial', 'canceled', 'none']);

export const PlanType = {
  starter: 'starter',
  basic: 'basic',
  essentials: 'essentials',
  plus: 'plus',
  advanced: 'advanced',
} as const;

export const planEnum = pgEnum('plan', ['starter', 'basic', 'essentials', 'plus', 'advanced']);

export const SupportType = {
  email: 'email',
  whatsapp: 'whatsapp',
  vip: 'vip',
} as const;

export const supportTypeEnum = pgEnum('support_type_enum', ['email', 'whatsapp', 'vip']);

export const QuestionType = {
  fill_in_the_blank: 'fill_in_the_blank',
  matching_columns: 'matching_columns',
  multiple_choice: 'multiple_choice',
  true_false: 'true_false',
  problem_solving: 'problem_solving',
  summative: 'summative',
  project_based: 'project_based',
  gamified: 'gamified',
  essay: 'essay', // redação
  open: 'open',
  sum: 'sum',
} as const;

export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice',
  'true_false',
  'open',
  'sum',
  'fill_in_the_blank',
  'matching_columns',
  'problem_solving',
  'essay',
  'project_based',
  'gamified',
  'summative',
]);

export const QuestionContext = {
  fixacao: 'fixacao',
  contextualizada: 'contextualizada',
  teorica: 'teorica',
  estudo_caso: 'estudo_caso',
  discursiva_aberta: 'discursiva_aberta',
  letra_lei: 'letra_lei',
  pesquisa: 'pesquisa',
} as const;

export const questionContextEnum = pgEnum('question_context', [
  'fixacao',
  'contextualizada',
  'teorica',
  'estudo_caso',
  'discursiva_aberta',
  'letra_lei',
  'pesquisa',
]);

export const ActionType = {
  create_new_questions: 'create_new_questions',
  new_questions: 'new_questions',
  copy_question: 'copy_question',
  unique_assessments: 'unique_assessments',
  mean_questions_per_assessment: 'mean_questions_per_assessment',
} as const;

export const actionTypeEnum = pgEnum('action_type', [
  'create_new_questions',
  'new_questions',
  'copy_question',
  'unique_assessments',
  'mean_questions_per_assessment',
]);

export const AcademicLevel = {
  elementarySchool: 'elementary_school',
  middleSchool: 'middle_school',
  highSchool: 'high_school',
  technical: 'technical',
  undergraduate: 'undergraduate',
  specialization: 'specialization',
  mba: 'mba',
  masters: 'masters',
  doctorate: 'doctorate',
  postdoctoral: 'postdoctoral',
  extension: 'extension',
  languageCourse: 'language_course',
  none: 'none',
} as const;

export const academicLevelEnum = pgEnum('academic_level', [
  'elementary_school',
  'middle_school',
  'high_school',
  'technical',
  'undergraduate',
  'specialization',
  'mba',
  'masters',
  'doctorate',
  'postdoctoral',
  'extension',
  'language_course',
  'none',
]);

// tables
export const academicLevels = pgTable('academic_levels', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: academicLevelEnum('name').notNull().unique(),
  allowed_question_types: questionTypeEnum('allowed_question_types').array().notNull(),
  allowed_question_context: questionContextEnum('allowed_question_context').array().notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id').notNull().unique(),
  is_admin: boolean('is_admin').default(false).notNull(),
  full_name: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 320 }).notNull().unique(),
  email_verified: boolean('email_verified').default(false).notNull(),
  email_verified_at: timestamp('email_verified_at'),
  plan: planEnum().notNull().default('starter'),
  plan_expire_at: timestamp('plan_expire_at', { mode: 'date' }),
  renew_status: renewStatusEnum().notNull().default('none'),
  academic_level_id: integer('academic_level_id').references(() => academicLevels.id),
  allowed_cookies: text('allowed_cookies').array().notNull().default([]), // jsonb stored as text
  selected_question_types: questionTypeEnum('selected_question_types').array().notNull().default([]),
  question_types_updated_at: timestamp('question_types_updated_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id')
    .references(() => profiles.id)
    .notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  title: varchar('title', { length: 1024 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  assessment_id: uuid('assessment_id').references(() => assessments.id),
  type: questionTypeEnum().notNull().default('multiple_choice'),
  question: varchar('question', { length: 8192 }).notNull(),
  metadata: jsonb('metadata').notNull().default('{}'),
  copy_count: integer('copy_count').notNull().default(0),
  copy_last_at: timestamp('copy_last_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const logs = pgTable('logs', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  action: actionTypeEnum().notNull(),
  count: integer('count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const plans = pgTable('plans', {
  id: planEnum('id').notNull().primaryKey(),
  model: varchar('model', { length: 255 }).notNull(),
  questions_month: integer('questions_month').notNull().default(30),
  doc_type: text('doc_type').array().notNull(),
  docs_size: integer('docs_size').notNull().default(10),
  max_question_types: integer('max_question_types').notNull().default(1),
  support: supportTypeEnum('support').array().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const profileLogsCycle = pgTable('profile_logs_cycle', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id')
    .references(() => profiles.id)
    .notNull(),
  cycle: varchar('cycle', { length: 7 }).notNull(), // Format: YYYY-MM
  total_questions: integer('total_questions').notNull().default(0),
  subjects_breakdown: jsonb('subjects_breakdown').notNull().default('[]'), // Array of {subject: string, count: number}
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const ErrorLevel = {
  error: 'error',
  warn: 'warn',
  fatal: 'fatal',
  info: 'info',
} as const;

export const errorLevelEnum = pgEnum('error_level', ['error', 'warn', 'fatal', 'info']);

export const errorLogs = pgTable('error_logs', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  message: text('message').notNull(),
  stack: text('stack'),
  level: errorLevelEnum().notNull().default('error'),
  context: jsonb('context'), // { userId?, endpoint?, method?, userAgent?, etc }
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  academicLevel: one(academicLevels, { fields: [profiles.academic_level_id], references: [academicLevels.id] }),
  logsCycles: many(profileLogsCycle),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  questions: many(questions),
  user: one(profiles, { fields: [assessments.user_id], references: [profiles.id] }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  assessment: one(assessments, { fields: [questions.assessment_id], references: [assessments.id] }),
}));

export const academicLevelsRelations = relations(academicLevels, ({ many }) => ({
  profiles: many(profiles),
}));

export const profileLogsCycleRelations = relations(profileLogsCycle, ({ one }) => ({
  user: one(profiles, { fields: [profileLogsCycle.user_id], references: [profiles.id] }),
}));
