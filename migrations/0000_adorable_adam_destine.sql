CREATE TYPE "public"."avatar_type" AS ENUM('ong', 'custom');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_type" AS ENUM('deduction', 'refill', 'bonus', 'adjustment', 'purchase');--> statement-breakpoint
CREATE TYPE "public"."feature_category" AS ENUM('ai_generation', 'ai_translation', 'ai_assistant', 'avatar', 'social', 'messaging', 'media', 'account');--> statement-breakpoint
CREATE TYPE "public"."feature_name" AS ENUM('movie_star', 'dress_me', 'restore_photo', 'tiktok_dance', 'translate_to_english', 'translate_to_mien', 'recipe_it', 'help_chat', 'transcribe_audio', 'avatar_session', 'create_post', 'like_post', 'comment_post', 'follow_user', 'send_message', 'upload_video', 'upload_image', 'login', 'signup');--> statement-breakpoint
CREATE TYPE "public"."generation_type" AS ENUM('movie_star', 'dress_me', 'restore_photo', 'tiktok_dance');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'file');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('youtube', 'tiktok', 'instagram', 'facebook', 'twitter');--> statement-breakpoint
CREATE TYPE "public"."post_visibility" AS ENUM('public', 'followers', 'private');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('uploading', 'queued', 'processing', 'encoding', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"action" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'custom' NOT NULL,
	"prompt" text NOT NULL,
	"service_key" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_service_configs" (
	"service_key" varchar(50) PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"model_name" text NOT NULL,
	"api_key_encrypted" text,
	"api_key_iv" text,
	"api_key_auth_tag" text,
	"credentials_json_encrypted" text,
	"credentials_json_iv" text,
	"credentials_json_auth_tag" text,
	"project_id" text,
	"region" text,
	"endpoint_url" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_tested_at" timestamp,
	"last_test_status" text,
	"source_type" text DEFAULT 'local' NOT NULL,
	"three_tears_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "art_generations" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "generation_type" NOT NULL,
	"image_url" text,
	"video_url" text,
	"prompt" text,
	"credits_used" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avatar_sessions" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"avatar_type" "avatar_type" DEFAULT 'ong' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"message_count" integer DEFAULT 0,
	"user_message_count" integer DEFAULT 0,
	"avatar_response_count" integer DEFAULT 0,
	"voice_used" varchar(50),
	"platform" text,
	"connection_type" text,
	"status" text DEFAULT 'active' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avatar_settings" (
	"id" varchar(255) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"voice" varchar(50) DEFAULT 'Charon' NOT NULL,
	"prompt" text DEFAULT 'You are Ong, a friendly AI companion for the Mien Kingdom community.

Your role:
- Help users learn about Mien culture, traditions, and history
- Assist with Mien language translation and pronunciation
- Share knowledge about Mien cuisine, clothing, and customs
- Be warm, patient, and encouraging with users of all ages
- Speak naturally and conversationally, like a wise friend

Guidelines:
- Keep responses concise and conversational (1-3 sentences typically)
- Use simple, clear language
- Be respectful of Mien cultural traditions
- If you don''t know something about Mien culture, admit it honestly
- Encourage users to explore and learn more about their heritage

Remember: You represent the Mien Kingdom community - be welcoming and inclusive!' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"post_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_keys" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"encrypted_shared_key" text NOT NULL,
	"encrypted_shared_key_iv" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "credit_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"feature" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "direct_conversations" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant1_id" varchar(255) NOT NULL,
	"participant2_id" varchar(255) NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encrypted_messages" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar(255) NOT NULL,
	"sender_id" varchar(255) NOT NULL,
	"encrypted_content" text NOT NULL,
	"encrypted_content_iv" text NOT NULL,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_usage" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"category" "feature_category" NOT NULL,
	"feature_name" "feature_name" NOT NULL,
	"sub_feature" text,
	"metadata" jsonb,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"credits_used" integer DEFAULT 0,
	"duration_ms" integer,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_usage_daily" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"category" "feature_category" NOT NULL,
	"feature_name" "feature_name" NOT NULL,
	"sub_feature" text,
	"total_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"total_credits_used" integer DEFAULT 0 NOT NULL,
	"total_duration_ms" integer DEFAULT 0 NOT NULL,
	"avg_duration_ms" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" varchar(255) NOT NULL,
	"followee_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_queries" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"query" text NOT NULL,
	"response" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"post_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"platform" "platform",
	"media_url" text,
	"embed_code" text,
	"caption" text,
	"caption_rich" jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"video_id" varchar(255),
	"visibility" "post_visibility" DEFAULT 'public' NOT NULL,
	"likes_count" text DEFAULT '0' NOT NULL,
	"comments_count" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploaded_videos" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"bunny_video_id" varchar(255) NOT NULL,
	"bunny_library_id" integer NOT NULL,
	"title" text,
	"original_filename" text,
	"file_size" integer,
	"duration" integer,
	"width" integer,
	"height" integer,
	"playback_url" text,
	"thumbnail_url" text,
	"preview_url" text,
	"status" "video_status" DEFAULT 'uploading' NOT NULL,
	"encoding_progress" integer DEFAULT 0,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"encoding_started_at" timestamp,
	"ready_at" timestamp,
	CONSTRAINT "uploaded_videos_bunny_video_id_unique" UNIQUE("bunny_video_id")
);
--> statement-breakpoint
CREATE TABLE "user_public_keys" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"public_key" text NOT NULL,
	"identity_public_key" text NOT NULL,
	"signed_pre_key" text NOT NULL,
	"pre_key_signature" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text,
	"bio" text,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"tier_slug" text DEFAULT 'free' NOT NULL,
	"credits" integer DEFAULT 30 NOT NULL,
	"pack_credits" integer DEFAULT 0 NOT NULL,
	"subscription_end" timestamp,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_service_key_ai_service_configs_service_key_fk" FOREIGN KEY ("service_key") REFERENCES "public"."ai_service_configs"("service_key") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "art_generations" ADD CONSTRAINT "art_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avatar_sessions" ADD CONSTRAINT "avatar_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_keys" ADD CONSTRAINT "conversation_keys_conversation_id_direct_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."direct_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_keys" ADD CONSTRAINT "conversation_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_participant1_id_users_id_fk" FOREIGN KEY ("participant1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_participant2_id_users_id_fk" FOREIGN KEY ("participant2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encrypted_messages" ADD CONSTRAINT "encrypted_messages_conversation_id_direct_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."direct_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encrypted_messages" ADD CONSTRAINT "encrypted_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_id_users_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_queries" ADD CONSTRAINT "help_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_video_id_uploaded_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."uploaded_videos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_videos" ADD CONSTRAINT "uploaded_videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_public_keys" ADD CONSTRAINT "user_public_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;