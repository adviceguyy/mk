-- Migration: Ensure all tables exist
-- Run this in production to create any missing tables
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE translation_direction AS ENUM ('to_mien', 'to_english', 'to_vietnamese', 'to_mandarin', 'to_hmong', 'to_cantonese', 'to_thai', 'to_lao', 'to_burmese', 'to_french', 'to_pinghua', 'to_khmer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new language directions to existing enum if they don't exist yet
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_vietnamese'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_mandarin'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_hmong'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_cantonese'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_thai'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_lao'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_burmese'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_french'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_pinghua'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE translation_direction ADD VALUE IF NOT EXISTS 'to_khmer'; EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE translation_source_type AS ENUM ('text', 'document', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('new_follower', 'new_post');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Translation History table
CREATE TABLE IF NOT EXISTS translation_history (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    direction translation_direction NOT NULL,
    source_type translation_source_type NOT NULL DEFAULT 'text',
    credits_used INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Mutes table
CREATE TABLE IF NOT EXISTS user_mutes (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    muter_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Recipe Categories table
CREATE TABLE IF NOT EXISTS recipe_categories (
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
);

-- Saved Recipes table
CREATE TABLE IF NOT EXISTS saved_recipes (
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
);

-- Push Tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform client_platform NOT NULL,
    device_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Notification Settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    new_follower_notifications BOOLEAN NOT NULL DEFAULT true,
    new_post_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notification Preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followee_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notify_on_new_post BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
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
);

-- User Public Keys table (for E2E encryption)
CREATE TABLE IF NOT EXISTS user_public_keys (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    identity_public_key TEXT NOT NULL,
    signed_pre_key TEXT NOT NULL,
    pre_key_signature TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Direct Conversations table
CREATE TABLE IF NOT EXISTS direct_conversations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Encrypted Messages table
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS encrypted_messages (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(255) NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_content TEXT NOT NULL,
    encrypted_content_iv TEXT NOT NULL,
    message_type message_type NOT NULL DEFAULT 'text',
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversation Keys table
CREATE TABLE IF NOT EXISTS conversation_keys (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(255) NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_shared_key TEXT NOT NULL,
    encrypted_shared_key_iv TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_translation_history_user_id ON translation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_history_created_at ON translation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_mutes_muter_id ON user_mutes(muter_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_category_id ON saved_recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_messages_conversation_id ON encrypted_messages(conversation_id);

SELECT 'Migration completed successfully!' as status;
