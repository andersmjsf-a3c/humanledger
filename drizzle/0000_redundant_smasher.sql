CREATE TYPE "public"."card_kind" AS ENUM('deliverable', 'skill_retest', 'worksheet');--> statement-breakpoint
CREATE TYPE "public"."receipt_action" AS ENUM('recommendation_written', 'aggregate_written');--> statement-breakpoint
CREATE TYPE "public"."service_agent" AS ENUM('coach', 'team_reporter');--> statement-breakpoint
CREATE TABLE "agent_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent" "service_agent" NOT NULL,
	"credential_id" text NOT NULL,
	"action" "receipt_action" NOT NULL,
	"cards_read" integer NOT NULL,
	"written_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "release_registry" (
	"value" text PRIMARY KEY NOT NULL,
	"vendor" text NOT NULL,
	"released_on" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorecards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "card_kind" NOT NULL,
	"schema_version" text NOT NULL,
	"graded_on" date NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"card" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scorecards_user_idx" ON "scorecards" USING btree ("user_id","received_at");