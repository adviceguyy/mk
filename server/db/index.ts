import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export { pool };

// Ensure all required tables exist (safe to run multiple times)
export async function ensureTablesExist(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log("[DB] Checking and creating missing tables...");

    // Create enums if they don't exist
    const enums = [
      `DO $$ BEGIN CREATE TYPE translation_direction AS ENUM ('to_mien', 'to_english'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE translation_source_type AS ENUM ('text', 'document', 'video'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('new_follower', 'new_post'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE message_type AS ENUM ('text', 'image', 'file'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE xp_activity_type AS ENUM ('post_created', 'comment_created', 'ai_translation', 'ai_image_dress_me', 'ai_image_restore_photo', 'ai_image_story_cover', 'ai_video_movie_star', 'ai_video_tiktok_dance', 'story_completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    ];

    for (const sql of enums) {
      await client.query(sql);
    }

    // Create tables if they don't exist
    const tables = [
      // Translation History
      `CREATE TABLE IF NOT EXISTS translation_history (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        direction translation_direction NOT NULL,
        source_type translation_source_type NOT NULL DEFAULT 'text',
        credits_used INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // User Blocks
      `CREATE TABLE IF NOT EXISTS user_blocks (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        blocker_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // User Mutes
      `CREATE TABLE IF NOT EXISTS user_mutes (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        muter_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        muted_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Recipe Categories
      `CREATE TABLE IF NOT EXISTS recipe_categories (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        thumbnail_recipe_id VARCHAR(255),
        display_order INTEGER NOT NULL DEFAULT 0,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Saved Recipes
      `CREATE TABLE IF NOT EXISTS saved_recipes (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id VARCHAR(255) NOT NULL REFERENCES recipe_categories(id) ON DELETE CASCADE,
        recipe_name TEXT NOT NULL,
        description TEXT,
        servings TEXT,
        prep_time TEXT,
        cook_time TEXT,
        ingredients JSONB DEFAULT '[]',
        instructions JSONB DEFAULT '[]',
        shopping_list JSONB DEFAULT '[]',
        is_mien_dish BOOLEAN NOT NULL DEFAULT false,
        mien_highlights TEXT,
        mien_modifications TEXT,
        similar_mien_dish TEXT,
        photos JSONB DEFAULT '[]',
        primary_photo_url TEXT,
        source_image_url TEXT,
        notes TEXT,
        is_favorite BOOLEAN NOT NULL DEFAULT false,
        shared_post_id VARCHAR(255) REFERENCES posts(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // User Public Keys (E2E encryption)
      `CREATE TABLE IF NOT EXISTS user_public_keys (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        public_key TEXT NOT NULL,
        identity_public_key TEXT NOT NULL,
        signed_pre_key TEXT NOT NULL,
        pre_key_signature TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Direct Conversations
      `CREATE TABLE IF NOT EXISTS direct_conversations (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        participant1_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participant2_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_message_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Encrypted Messages
      `CREATE TABLE IF NOT EXISTS encrypted_messages (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id VARCHAR(255) NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        encrypted_content TEXT NOT NULL,
        encrypted_content_iv TEXT NOT NULL,
        message_type message_type NOT NULL DEFAULT 'text',
        is_read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Conversation Keys
      `CREATE TABLE IF NOT EXISTS conversation_keys (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id VARCHAR(255) NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        encrypted_shared_key TEXT NOT NULL,
        encrypted_shared_key_iv TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Push Tokens
      `CREATE TABLE IF NOT EXISTS push_tokens (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        platform client_platform NOT NULL,
        device_id TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // User Notification Settings
      `CREATE TABLE IF NOT EXISTS user_notification_settings (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        push_enabled BOOLEAN NOT NULL DEFAULT true,
        new_follower_notifications BOOLEAN NOT NULL DEFAULT true,
        new_post_notifications BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Notification Preferences
      `CREATE TABLE IF NOT EXISTS notification_preferences (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        followee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notify_on_new_post BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Dictionary Entries
      `CREATE TABLE IF NOT EXISTS dictionary_entries (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        mien_word TEXT NOT NULL,
        english_definition TEXT NOT NULL,
        part_of_speech TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Notifications
      `CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        type notification_type NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMP,
        push_sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      // Game Scores
      `CREATE TABLE IF NOT EXISTS game_scores (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        phrases_completed INTEGER NOT NULL,
        game_type TEXT NOT NULL DEFAULT 'wheel_of_fortune',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // XP Transactions
      `CREATE TABLE IF NOT EXISTS xp_transactions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type xp_activity_type NOT NULL,
        xp_amount INTEGER NOT NULL,
        total_xp_after INTEGER NOT NULL,
        level_after INTEGER NOT NULL,
        leveled_up BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Daily XP Caps
      `CREATE TABLE IF NOT EXISTS daily_xp_caps (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type xp_activity_type NOT NULL,
        date TIMESTAMP NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
    ];

    for (const sql of tables) {
      await client.query(sql);
    }

    // Add missing columns to existing tables
    const alterStatements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'wheel_of_fortune'`,
    ];

    for (const sql of alterStatements) {
      await client.query(sql);
    }

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_translation_history_user_id ON translation_history(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_translation_history_created_at ON translation_history(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_mutes_muter_id ON user_mutes(muter_id)`,
      `CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_saved_recipes_category_id ON saved_recipes(category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_encrypted_messages_conversation_id ON encrypted_messages(conversation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_dictionary_entries_mien_word ON dictionary_entries(mien_word)`,
      `CREATE INDEX IF NOT EXISTS idx_dictionary_entries_mien_word_trgm ON dictionary_entries USING gin (mien_word gin_trgm_ops)`,
      `CREATE INDEX IF NOT EXISTS idx_dictionary_entries_english_trgm ON dictionary_entries USING gin (english_definition gin_trgm_ops)`,
      `CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_xp_caps_unique ON daily_xp_caps(user_id, activity_type, date)`,
    ];

    for (const sql of indexes) {
      await client.query(sql);
    }

    console.log("[DB] All tables verified/created successfully");
  } catch (error) {
    console.error("[DB] Error ensuring tables exist:", error);
    throw error;
  } finally {
    client.release();
  }
}
