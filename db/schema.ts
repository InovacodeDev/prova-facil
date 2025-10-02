import { relations } from "drizzle-orm";
import {
    pgTable,
    varchar,
    text,
    timestamp,
    boolean,
    uuid,
    pgEnum,
    integer,
    serial,
    pgSequence,
} from "drizzle-orm/pg-core";

export const RenewStatus = {
    monthly: "monthly",
    yearly: "yearly",
    trial: "trial",
    canceled: "canceled",
    none: "none",
} as const;

export const renewStatusEnum = pgEnum("renew_status", ["monthly", "yearly", "trial", "canceled", "none"]);

export const PlanType = {
    starter: "starter",
    basic: "basic",
    essentials: "essentials",
    plus: "plus",
    advanced: "advanced",
} as const;

export const planEnum = pgEnum("plan", ["starter", "basic", "essentials", "plus", "advanced"]);

export const QuestionType = {
    fill_in_the_blank: "fill_in_the_blank",
    matching_columns: "matching_columns",
    multiple_choice: "multiple_choice",
    true_false: "true_false",
    problem_solving: "problem_solving",
    summative: "summative",
    project_based: "project_based",
    gamified: "gamified",
    essay: "essay", // redação
    open: "open",
    sum: "sum",
} as const;

export const questionTypeEnum = pgEnum("question_type", [
    "multiple_choice",
    "true_false",
    "open",
    "sum",
    "fill_in_the_blank",
    "matching_columns",
    "problem_solving",
    "essay",
]);

export const QuestionContext = {
    fixacao: "fixacao",
    contextualizada: "contextualizada",
    teorica: "teorica",
    estudo_caso: "estudo_caso",
    discursiva_aberta: "discursiva_aberta",
    letra_lei: "letra_lei",
    pesquisa: "pesquisa",
} as const;

export const questionContextEnum = pgEnum("question_context", [
    "fixacao",
    "contextualizada",
    "teorica",
    "estudo_caso",
    "discursiva_aberta",
    "letra_lei",
    "pesquisa",
]);

export const ActionType = {
    create_new_questions: "create_new_questions",
    new_questions: "new_questions",
    copy_question: "copy_question",
    unique_assessments: "unique_assessments",
    mean_questions_per_assessment: "mean_questions_per_assessment",
} as const;

export const actionTypeEnum = pgEnum("action_type", [
    "create_new_questions",
    "new_questions",
    "copy_question",
    "unique_assessments",
    "mean_questions_per_assessment",
]);

export const AcademicLevel = {
    elementarySchool: "elementary_school",
    middleSchool: "middle_school",
    highSchool: "high_school",
    technical: "technical",
    undergraduate: "undergraduate",
    specialization: "specialization",
    mba: "mba",
    masters: "masters",
    doctorate: "doctorate",
    postdoctoral: "postdoctoral",
    extension: "extension",
    languageCourse: "language_course",
    none: "none",
} as const;

export const academicLevelEnum = pgEnum("academic_level", [
    "elementary_school",
    "middle_school",
    "high_school",
    "technical",
    "undergraduate",
    "specialization",
    "mba",
    "masters",
    "doctorate",
    "postdoctoral",
    "extension",
    "language_course",
    "none",
]);

// tables
export const academicLevels = pgTable("academic_levels", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: academicLevelEnum("name").notNull().unique(),
    allowed_question_types: questionTypeEnum("allowed_question_types").array().notNull(),
    allowed_question_context: questionContextEnum("allowed_question_context").array().notNull(),
    description: text("description"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    user_id: uuid("user_id").notNull().unique(),
    is_admin: boolean("is_admin").default(false).notNull(),
    full_name: varchar("full_name", { length: 255 }),
    email: varchar("email", { length: 320 }).notNull().unique(),
    plan: planEnum().notNull().default("starter"),
    plan_expire_at: timestamp("plan_expire_at", { mode: "date" }),
    renew_status: renewStatusEnum().notNull().default("none"),
    academic_level_id: uuid("academic_level_id").references(() => academicLevels.id),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    user_id: uuid("user_id")
        .references(() => profiles.id)
        .notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    title: varchar("title", { length: 1024 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    assessment_id: uuid("assessment_id").references(() => assessments.id),
    type: questionTypeEnum().notNull().default("multiple_choice"),
    question: varchar("question", { length: 8192 }).notNull(),
    copy_count: integer("copy_count").notNull().default(0),
    copy_last_at: timestamp("copy_last_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export const answers = pgTable("answers", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    question_id: uuid("question_id")
        .references(() => questions.id)
        .notNull(),
    answer: varchar("answer", { length: 8192 }).notNull(),
    number: integer("number"),
    is_correct: boolean("is_correct").notNull().default(false),
});

export const logs = pgTable("logs", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    action: actionTypeEnum().notNull(),
    count: integer("count").notNull().default(0),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const planModels = pgTable("plan_models", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    plan: planEnum().notNull().unique(),
    model: varchar("model", { length: 255 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
    academicLevel: one(academicLevels, { fields: [profiles.academic_level_id], references: [academicLevels.id] }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
    questions: many(questions),
    user: one(profiles, { fields: [assessments.user_id], references: [profiles.id] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    assessment: one(assessments, { fields: [questions.assessment_id], references: [assessments.id] }),
    answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
    question: one(questions, { fields: [answers.question_id], references: [questions.id] }),
}));

export const academicLevelsRelations = relations(academicLevels, ({ many }) => ({
    profiles: many(profiles),
}));
