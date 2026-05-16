CREATE TYPE "public"."ai_status" AS ENUM('pending', 'approved', 'rejected', 'edited');--> statement-breakpoint
CREATE TYPE "public"."competition_source" AS ENUM('manual', 'ai_yearbook', 'imported');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('data_processing', 'photo_usage', 'performance_publishing', 'ai_extraction');--> statement-breakpoint
CREATE TYPE "public"."document_scope" AS ENUM('federation', 'club');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('season_proclamation', 'results_pdf', 'standards_pdf', 'records_pdf', 'other');--> statement-breakpoint
CREATE TYPE "public"."extraction_type" AS ENUM('competitions', 'program', 'categories', 'standards', 'results', 'records', 'rules');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('pdf', 'doc', 'docx', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'mixed', 'any');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('el', 'en');--> statement-breakpoint
CREATE TYPE "public"."note_visibility" AS ENUM('internal', 'parent_visible');--> statement-breakpoint
CREATE TYPE "public"."pool_type" AS ENUM('25m', '50m', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('uploaded', 'processing', 'completed', 'failed', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."record_type" AS ENUM('national', 'age_group', 'international_reference');--> statement-breakpoint
CREATE TYPE "public"."result_source" AS ENUM('manual', 'ai_pdf', 'official_import');--> statement-breakpoint
CREATE TYPE "public"."result_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('federation_admin', 'club_admin', 'coach', 'parent');--> statement-breakpoint
CREATE TYPE "public"."round_type" AS ENUM('heat', 'final', 'direct_final', 'training_race', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."season_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."standard_type" AS ENUM('domestic_qualification', 'penalty_limit', 'international', 'national_team', 'incentive');--> statement-breakpoint
CREATE TYPE "public"."stroke" AS ENUM('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley');--> statement-breakpoint
CREATE TYPE "public"."training_context" AS ENUM('normal', 'heavy_fatigue', 'taper', 'after_gym', 'before_competition', 'technical_test');--> statement-breakpoint
CREATE TYPE "public"."training_type" AS ENUM('test', 'time_trial', 'race_simulation', 'set_result', 'coach_observation');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('draft', 'pending_review', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "age_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"name_el" text NOT NULL,
	"name_en" text NOT NULL,
	"gender_scope" "gender" NOT NULL,
	"birth_year_from" integer,
	"birth_year_to" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ai_extracted_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_extraction_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"extracted_json" jsonb NOT NULL,
	"mapped_entity_type" text,
	"mapped_entity_id" uuid,
	"confidence" numeric(5, 2),
	"status" "ai_status" DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text
);
--> statement-breakpoint
CREATE TABLE "ai_extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"extraction_type" "extraction_type" NOT NULL,
	"raw_output_json" jsonb NOT NULL,
	"confidence" numeric(5, 2),
	"status" "ai_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athletes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "gender" NOT NULL,
	"registration_number" text,
	"coach_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"old_value_json" jsonb,
	"new_value_json" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"federation_code" text,
	"country" text DEFAULT 'CY' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_athlete_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_user_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"note" text NOT NULL,
	"visibility" "note_visibility" DEFAULT 'internal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_program_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"day_date" date NOT NULL,
	"session_name" text,
	"event_order" integer NOT NULL,
	"swim_event_id" uuid NOT NULL,
	"category_id" uuid,
	"gender" "gender" NOT NULL,
	"start_time" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "competition_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"swim_event_id" uuid NOT NULL,
	"result_time_ms" integer NOT NULL,
	"rank" integer,
	"round_type" "round_type" DEFAULT 'unknown' NOT NULL,
	"pool_type" "pool_type" NOT NULL,
	"source" "result_source" DEFAULT 'manual' NOT NULL,
	"verification_status" "result_status" DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"source_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"location" text,
	"venue" text,
	"pool_type" "pool_type" DEFAULT 'unknown' NOT NULL,
	"declaration_deadline" timestamp with time zone,
	"max_events_per_athlete" integer,
	"source" "competition_source" DEFAULT 'manual' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'verified' NOT NULL,
	"source_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"granted_by" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"document_id" uuid
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "document_scope" NOT NULL,
	"club_id" uuid,
	"filename" text NOT NULL,
	"original_filename" text NOT NULL,
	"file_type" "file_type" NOT NULL,
	"document_type" "document_type" NOT NULL,
	"storage_url" text NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processing_status" "processing_status" DEFAULT 'uploaded' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_athlete_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_user_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"relationship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualification_standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"standard_type" "standard_type" NOT NULL,
	"competition_id" uuid,
	"category_id" uuid,
	"gender" "gender" NOT NULL,
	"swim_event_id" uuid NOT NULL,
	"time_ms" integer NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"source_document_id" uuid,
	"verification_status" "result_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid,
	"record_type" "record_type" NOT NULL,
	"category_id" uuid,
	"gender" "gender" NOT NULL,
	"swim_event_id" uuid NOT NULL,
	"time_ms" integer NOT NULL,
	"athlete_name" text,
	"date_achieved" date,
	"source_document_id" uuid
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"qualification_start_date" date,
	"evaluation_start_date" date,
	"evaluation_end_date" date,
	"source_document_id" uuid,
	"status" "season_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swim_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distance_m" integer NOT NULL,
	"stroke" "stroke" NOT NULL,
	"relay" boolean DEFAULT false NOT NULL,
	"relay_legs" integer,
	"gender" "gender" NOT NULL,
	"display_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"coach_id" uuid,
	"swim_event_id" uuid NOT NULL,
	"result_time_ms" integer NOT NULL,
	"date" date NOT NULL,
	"training_type" "training_type" NOT NULL,
	"training_context" "training_context" DEFAULT 'normal' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"preferred_locale" "locale" DEFAULT 'el' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "age_categories" ADD CONSTRAINT "age_categories_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extracted_items" ADD CONSTRAINT "ai_extracted_items_ai_extraction_id_ai_extractions_id_fk" FOREIGN KEY ("ai_extraction_id") REFERENCES "public"."ai_extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extractions" ADD CONSTRAINT "ai_extractions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extractions" ADD CONSTRAINT "ai_extractions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_athlete_assignments" ADD CONSTRAINT "coach_athlete_assignments_coach_user_id_users_id_fk" FOREIGN KEY ("coach_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_athlete_assignments" ADD CONSTRAINT "coach_athlete_assignments_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_program_items" ADD CONSTRAINT "competition_program_items_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_program_items" ADD CONSTRAINT "competition_program_items_swim_event_id_swim_events_id_fk" FOREIGN KEY ("swim_event_id") REFERENCES "public"."swim_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_program_items" ADD CONSTRAINT "competition_program_items_category_id_age_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."age_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_swim_event_id_swim_events_id_fk" FOREIGN KEY ("swim_event_id") REFERENCES "public"."swim_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_athlete_links" ADD CONSTRAINT "parent_athlete_links_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_athlete_links" ADD CONSTRAINT "parent_athlete_links_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_standards" ADD CONSTRAINT "qualification_standards_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_standards" ADD CONSTRAINT "qualification_standards_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_standards" ADD CONSTRAINT "qualification_standards_category_id_age_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."age_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_standards" ADD CONSTRAINT "qualification_standards_swim_event_id_swim_events_id_fk" FOREIGN KEY ("swim_event_id") REFERENCES "public"."swim_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_category_id_age_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."age_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_swim_event_id_swim_events_id_fk" FOREIGN KEY ("swim_event_id") REFERENCES "public"."swim_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_results" ADD CONSTRAINT "training_results_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_results" ADD CONSTRAINT "training_results_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_results" ADD CONSTRAINT "training_results_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_results" ADD CONSTRAINT "training_results_swim_event_id_swim_events_id_fk" FOREIGN KEY ("swim_event_id") REFERENCES "public"."swim_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "age_cat_season_idx" ON "age_categories" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "athletes_club_idx" ON "athletes" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "athletes_coach_idx" ON "athletes" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coach_athlete_uidx" ON "coach_athlete_assignments" USING btree ("coach_user_id","athlete_id");--> statement-breakpoint
CREATE INDEX "program_competition_idx" ON "competition_program_items" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "results_athlete_event_idx" ON "competition_results" USING btree ("athlete_id","swim_event_id","pool_type");--> statement-breakpoint
CREATE INDEX "results_competition_idx" ON "competition_results" USING btree ("competition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parent_athlete_uidx" ON "parent_athlete_links" USING btree ("parent_user_id","athlete_id");--> statement-breakpoint
CREATE INDEX "prt_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prt_token_hash_uidx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "swim_events_unique_uidx" ON "swim_events" USING btree ("distance_m","stroke","gender","relay");--> statement-breakpoint
CREATE INDEX "training_club_idx" ON "training_results" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "training_athlete_idx" ON "training_results" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" USING btree ("email");