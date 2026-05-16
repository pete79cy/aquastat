/**
 * Aquastat — Drizzle schema
 * Implements PDR v1.1 (multi-club tenancy, bilingual labels, GDPR consent,
 * forgot-password flow). Times stored as integer milliseconds.
 *
 * Conventions:
 * - UUIDs from gen_random_uuid() (pgcrypto). Postgres extension assumed enabled.
 * - snake_case in DB, camelCase in TS (Drizzle casing: snake_case).
 * - Timestamps always (timestamp with time zone, default now()).
 */

import {
  pgTable, uuid, text, integer, boolean, timestamp, date, pgEnum, jsonb,
  numeric, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── ENUMS ─────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("user_role", [
  "federation_admin",
  "club_admin",
  "coach",
  "parent",
]);

export const localeEnum = pgEnum("locale", ["el", "en"]);

export const genderEnum = pgEnum("gender", ["male", "female", "mixed", "any"]);

export const strokeEnum = pgEnum("stroke", [
  "freestyle", "backstroke", "breaststroke", "butterfly", "medley",
]);

export const poolTypeEnum = pgEnum("pool_type", ["25m", "50m", "unknown"]);

export const seasonStatusEnum = pgEnum("season_status", [
  "draft", "active", "archived",
]);

export const competitionSourceEnum = pgEnum("competition_source", [
  "manual", "ai_yearbook", "imported",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "draft", "pending_review", "verified", "rejected",
]);

export const roundTypeEnum = pgEnum("round_type", [
  "heat", "final", "direct_final", "training_race", "unknown",
]);

export const resultSourceEnum = pgEnum("result_source", [
  "manual", "ai_pdf", "official_import",
]);

export const resultStatusEnum = pgEnum("result_status", [
  "pending", "verified", "rejected",
]);

export const trainingTypeEnum = pgEnum("training_type", [
  "test", "time_trial", "race_simulation", "set_result", "coach_observation",
]);

export const trainingContextEnum = pgEnum("training_context", [
  "normal", "heavy_fatigue", "taper", "after_gym",
  "before_competition", "technical_test",
]);

export const standardTypeEnum = pgEnum("standard_type", [
  "domestic_qualification", "penalty_limit", "international",
  "national_team", "incentive",
]);

export const recordTypeEnum = pgEnum("record_type", [
  "national", "age_group", "international_reference",
]);

export const fileTypeEnum = pgEnum("file_type", ["pdf", "doc", "docx", "other"]);

export const documentTypeEnum = pgEnum("document_type", [
  "season_proclamation", "results_pdf", "standards_pdf", "records_pdf", "other",
]);

export const documentScopeEnum = pgEnum("document_scope", ["federation", "club"]);

export const processingStatusEnum = pgEnum("processing_status", [
  "uploaded", "processing", "completed", "failed", "needs_review",
]);

export const extractionTypeEnum = pgEnum("extraction_type", [
  "competitions", "program", "categories",
  "standards", "results", "records", "rules",
]);

export const aiStatusEnum = pgEnum("ai_status", [
  "pending", "approved", "rejected", "edited",
]);

export const noteVisibilityEnum = pgEnum("note_visibility", [
  "internal", "parent_visible",
]);

export const consentTypeEnum = pgEnum("consent_type", [
  "data_processing", "photo_usage", "performance_publishing", "ai_extraction",
]);

// ─── TABLES ────────────────────────────────────────────────────────────────

/** Multi-club tenancy root (PDR v1.1 §B.1). */
export const clubs = pgTable("clubs", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  name: text().notNull(),
  shortName: text(),
  federationCode: text(),
  country: text().notNull().default("CY"),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Users — split admin into federation_admin / club_admin (PDR v1.1 §F.1). */
export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid().references(() => clubs.id, { onDelete: "set null" }),
    name: text().notNull(),
    email: text().notNull(),
    passwordHash: text().notNull(),
    role: roleEnum().notNull(),
    preferredLocale: localeEnum().notNull().default("el"),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uidx").on(t.email)]
);

/** Athletes — club-scoped, derived category (PDR v1.1 §B.3). */
export const athletes = pgTable(
  "athletes",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid().notNull().references(() => clubs.id, { onDelete: "restrict" }),
    firstName: text().notNull(),
    lastName: text().notNull(),
    dateOfBirth: date().notNull(),
    gender: genderEnum().notNull(),
    registrationNumber: text(),
    coachId: uuid().references(() => users.id, { onDelete: "set null" }),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("athletes_club_idx").on(t.clubId),
    index("athletes_coach_idx").on(t.coachId),
  ]
);

/** Many-to-many: parent <-> athlete. */
export const parentAthleteLinks = pgTable(
  "parent_athlete_links",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    parentUserId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    athleteId: uuid().notNull().references(() => athletes.id, { onDelete: "cascade" }),
    relationship: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("parent_athlete_uidx").on(t.parentUserId, t.athleteId)]
);

/** Many-to-many: coach <-> athletes (for multi-coach setups). */
export const coachAthleteAssignments = pgTable(
  "coach_athlete_assignments",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    coachUserId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    athleteId: uuid().notNull().references(() => athletes.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coach_athlete_uidx").on(t.coachUserId, t.athleteId)]
);

/** Seasons — federation-wide. */
export const seasons = pgTable("seasons", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  name: text().notNull(),
  startDate: date().notNull(),
  endDate: date().notNull(),
  qualificationStartDate: date(),
  evaluationStartDate: date(),
  evaluationEndDate: date(),
  sourceDocumentId: uuid(),
  status: seasonStatusEnum().notNull().default("draft"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Age categories — bilingual labels (PDR v1.1 §B.15). */
export const ageCategories = pgTable(
  "age_categories",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    seasonId: uuid().notNull().references(() => seasons.id, { onDelete: "cascade" }),
    nameEl: text().notNull(),
    nameEn: text().notNull(),
    genderScope: genderEnum().notNull(),
    birthYearFrom: integer(),
    birthYearTo: integer(),
    notes: text(),
  },
  (t) => [index("age_cat_season_idx").on(t.seasonId)]
);

/** Swim events catalogue — unique on (distance, stroke, gender, relay). */
export const swimEvents = pgTable(
  "swim_events",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    distanceM: integer().notNull(),
    stroke: strokeEnum().notNull(),
    relay: boolean().notNull().default(false),
    relayLegs: integer(),
    gender: genderEnum().notNull(),
    displayName: text().notNull(),
  },
  (t) => [uniqueIndex("swim_events_unique_uidx").on(t.distanceM, t.stroke, t.gender, t.relay)]
);

/** Competitions — federation-wide. */
export const competitions = pgTable("competitions", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  seasonId: uuid().notNull().references(() => seasons.id, { onDelete: "restrict" }),
  name: text().notNull(),
  startDate: date().notNull(),
  endDate: date().notNull(),
  location: text(),
  venue: text(),
  poolType: poolTypeEnum().notNull().default("unknown"),
  declarationDeadline: timestamp({ withTimezone: true }),
  maxEventsPerAthlete: integer(),
  source: competitionSourceEnum().notNull().default("manual"),
  verificationStatus: verificationStatusEnum().notNull().default("verified"),
  sourceDocumentId: uuid(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const competitionProgramItems = pgTable(
  "competition_program_items",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    competitionId: uuid().notNull().references(() => competitions.id, { onDelete: "cascade" }),
    dayDate: date().notNull(),
    sessionName: text(),
    eventOrder: integer().notNull(),
    swimEventId: uuid().notNull().references(() => swimEvents.id, { onDelete: "restrict" }),
    categoryId: uuid().references(() => ageCategories.id, { onDelete: "set null" }),
    gender: genderEnum().notNull(),
    startTime: text(),
    notes: text(),
  },
  (t) => [index("program_competition_idx").on(t.competitionId)]
);

/** Competition results — pool_type authoritative here (PDR v1.1 §B.7). */
export const competitionResults = pgTable(
  "competition_results",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    athleteId: uuid().notNull().references(() => athletes.id, { onDelete: "cascade" }),
    competitionId: uuid().notNull().references(() => competitions.id, { onDelete: "restrict" }),
    swimEventId: uuid().notNull().references(() => swimEvents.id, { onDelete: "restrict" }),
    resultTimeMs: integer().notNull(),
    rank: integer(),
    roundType: roundTypeEnum().notNull().default("unknown"),
    poolType: poolTypeEnum().notNull(),
    source: resultSourceEnum().notNull().default("manual"),
    verificationStatus: resultStatusEnum().notNull().default("pending"),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    sourceDocumentId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("results_athlete_event_idx").on(t.athleteId, t.swimEventId, t.poolType),
    index("results_competition_idx").on(t.competitionId),
  ]
);

/** Training results — club-scoped (denormalized for tenancy queries). */
export const trainingResults = pgTable(
  "training_results",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid().notNull().references(() => clubs.id, { onDelete: "restrict" }),
    athleteId: uuid().notNull().references(() => athletes.id, { onDelete: "cascade" }),
    coachId: uuid().references(() => users.id, { onDelete: "set null" }),
    swimEventId: uuid().notNull().references(() => swimEvents.id, { onDelete: "restrict" }),
    resultTimeMs: integer().notNull(),
    date: date().notNull(),
    trainingType: trainingTypeEnum().notNull(),
    trainingContext: trainingContextEnum().notNull().default("normal"),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("training_club_idx").on(t.clubId),
    index("training_athlete_idx").on(t.athleteId),
  ]
);

export const qualificationStandards = pgTable("qualification_standards", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  seasonId: uuid().notNull().references(() => seasons.id, { onDelete: "cascade" }),
  standardType: standardTypeEnum().notNull(),
  competitionId: uuid().references(() => competitions.id, { onDelete: "set null" }),
  categoryId: uuid().references(() => ageCategories.id, { onDelete: "set null" }),
  gender: genderEnum().notNull(),
  swimEventId: uuid().notNull().references(() => swimEvents.id, { onDelete: "restrict" }),
  timeMs: integer().notNull(),
  validFrom: date(),
  validUntil: date(),
  sourceDocumentId: uuid(),
  verificationStatus: resultStatusEnum().notNull().default("pending"),
});

export const records = pgTable("records", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  seasonId: uuid().references(() => seasons.id, { onDelete: "set null" }),
  recordType: recordTypeEnum().notNull(),
  categoryId: uuid().references(() => ageCategories.id, { onDelete: "set null" }),
  gender: genderEnum().notNull(),
  swimEventId: uuid().notNull().references(() => swimEvents.id, { onDelete: "restrict" }),
  timeMs: integer().notNull(),
  athleteName: text(),
  dateAchieved: date(),
  sourceDocumentId: uuid(),
});

export const documents = pgTable("documents", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  scope: documentScopeEnum().notNull(),
  clubId: uuid().references(() => clubs.id, { onDelete: "cascade" }),
  competitionId: uuid().references(() => competitions.id, { onDelete: "set null" }),
  filename: text().notNull(),
  originalFilename: text().notNull(),
  fileType: fileTypeEnum().notNull(),
  documentType: documentTypeEnum().notNull(),
  storageUrl: text().notNull(),
  uploadedBy: uuid().references(() => users.id, { onDelete: "set null" }),
  uploadedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  processingStatus: processingStatusEnum().notNull().default("uploaded"),
});

export const aiExtractions = pgTable("ai_extractions", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  documentId: uuid().notNull().references(() => documents.id, { onDelete: "cascade" }),
  extractionType: extractionTypeEnum().notNull(),
  rawOutputJson: jsonb().notNull(),
  confidence: numeric({ precision: 5, scale: 2 }),
  status: aiStatusEnum().notNull().default("pending"),
  reviewedBy: uuid().references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const aiExtractedItems = pgTable("ai_extracted_items", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  aiExtractionId: uuid().notNull().references(() => aiExtractions.id, { onDelete: "cascade" }),
  itemType: text().notNull(),
  extractedJson: jsonb().notNull(),
  mappedEntityType: text(),
  mappedEntityId: uuid(),
  confidence: numeric({ precision: 5, scale: 2 }),
  status: aiStatusEnum().notNull().default("pending"),
  reviewerNotes: text(),
});

export const coachNotes = pgTable("coach_notes", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  athleteId: uuid().notNull().references(() => athletes.id, { onDelete: "cascade" }),
  coachId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text().notNull(),
  visibility: noteVisibilityEnum().notNull().default("internal"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** GDPR consent records (PDR v1.1 §C). */
export const consentRecords = pgTable("consent_records", {
  id: uuid().primaryKey().default(sql`gen_random_uuid()`),
  athleteId: uuid().notNull().references(() => athletes.id, { onDelete: "cascade" }),
  consentType: consentTypeEnum().notNull(),
  grantedBy: uuid().notNull().references(() => users.id, { onDelete: "set null" }),
  grantedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp({ withTimezone: true }),
  documentId: uuid().references(() => documents.id, { onDelete: "set null" }),
});

/** Forgot password (PDR v1.1 §D.1). */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("prt_user_idx").on(t.userId),
    uniqueIndex("prt_token_hash_uidx").on(t.tokenHash),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    entityType: text(),
    entityId: uuid(),
    oldValueJson: jsonb(),
    newValueJson: jsonb(),
    ip: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_user_idx").on(t.userId),
    index("audit_entity_idx").on(t.entityType, t.entityId),
  ]
);
