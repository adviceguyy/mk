CREATE TYPE "public"."billing_provider" AS ENUM('stripe', 'revenuecat');--> statement-breakpoint
CREATE TYPE "public"."client_platform" AS ENUM('web', 'ios', 'android');--> statement-breakpoint
CREATE TABLE "billing_providers" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "billing_provider" NOT NULL,
	"display_name" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"api_key_encrypted" text,
	"api_key_iv" text,
	"api_key_auth_tag" text,
	"public_key" text,
	"webhook_secret_encrypted" text,
	"webhook_secret_iv" text,
	"webhook_secret_auth_tag" text,
	"config" jsonb,
	"source_type" text DEFAULT 'local' NOT NULL,
	"three_tears_synced_at" timestamp,
	"last_tested_at" timestamp,
	"last_test_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_providers_provider_unique" UNIQUE("provider")
);
