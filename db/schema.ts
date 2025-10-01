import { relations } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, boolean, uuid, pgEnum, integer } from "drizzle-orm/pg-core";

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
    multiple_choice: "multiple_choice",
    true_false: "true_false",
    open: "open",
    sum: "sum",
} as const;

export const questionTypeEnum = pgEnum("question_type", ["multiple_choice", "true_false", "open", "sum"]);

// Action types for logging
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

export const Subject = {
    mathematics: "mathematics",
    portuguese: "portuguese",
    history: "history",
    geography: "geography",
    science: "science",
    arts: "arts",
    english: "english",
    literature: "literature",
    physics: "physics",
    chemistry: "chemistry",
    biology: "biology",
    philosophy: "philosophy",
    sociology: "sociology",
    spanish: "spanish",
} as const;

export const academicLevels = pgTable("academic_levels", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    user_id: uuid("user_id").notNull(),
    full_name: varchar("full_name", { length: 255 }),
    email: varchar("email", { length: 320 }),
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
    subject_id: uuid("subject_id").references(() => subjects.id),
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

export const academicLevelSubjects = pgTable("academic_level_subjects", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    academic_level_id: uuid("academic_level_id")
        .references(() => academicLevels.id)
        .notNull(),
    subject_id: uuid("subject_id")
        .references(() => subjects.id)
        .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
    academicLevel: one(academicLevels, { fields: [profiles.academic_level_id], references: [academicLevels.id] }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
    questions: many(questions),
    subject: one(subjects, { fields: [assessments.subject_id], references: [subjects.id] }),
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
    academicLevelSubjects: many(academicLevelSubjects),
}));

export const academicLevelSubjectsRelations = relations(academicLevelSubjects, ({ one }) => ({
    academicLevel: one(academicLevels, {
        fields: [academicLevelSubjects.academic_level_id],
        references: [academicLevels.id],
    }),
    subject: one(subjects, { fields: [academicLevelSubjects.subject_id], references: [subjects.id] }),
}));
