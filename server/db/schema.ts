import { pgTable, text, varchar, timestamp, jsonb, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "moderator", "admin"]);
export const postVisibilityEnum = pgEnum("post_visibility", ["public", "followers", "private"]);
export const videoStatusEnum = pgEnum("video_status", [
  "uploading",
  "queued",
  "processing",
  "encoding",
  "ready",
  "failed",
]);

export const users = pgTable("users", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  role: roleEnum("role").notNull().default("user"),
  tierSlug: text("tier_slug").notNull().default("free"),
  credits: integer("credits").notNull().default(0), // User's current credit balance
  subscriptionActive: boolean("subscription_active").notNull().default(false), // Is subscription currently active
  subscriptionExpiresAt: timestamp("subscription_expires_at"), // When subscription expires
  lastCreditReset: timestamp("last_credit_reset"), // Last time credits were reset
  isDisabled: boolean("is_disabled").notNull().default(false),
  defaultPostVisibility: postVisibilityEnum("default_post_visibility").notNull().default("public"),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groups = pgTable("groups", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 255 })
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const platformEnum = pgEnum("platform", ["youtube", "tiktok", "instagram", "facebook", "twitter"]);

// Uploaded videos table - tracks videos uploaded to Bunny.net
export const uploadedVideos = pgTable("uploaded_videos", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bunnyVideoId: varchar("bunny_video_id", { length: 255 }).notNull().unique(),
  bunnyLibraryId: integer("bunny_library_id").notNull(),
  title: text("title"),
  originalFilename: text("original_filename"),
  fileSize: integer("file_size"),
  duration: integer("duration"),
  width: integer("width"),
  height: integer("height"),
  playbackUrl: text("playback_url"),
  thumbnailUrl: text("thumbnail_url"),
  previewUrl: text("preview_url"),
  status: videoStatusEnum("status").notNull().default("uploading"),
  encodingProgress: integer("encoding_progress").default(0),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  encodingStartedAt: timestamp("encoding_started_at"),
  readyAt: timestamp("ready_at"),
});

export const posts = pgTable("posts", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: platformEnum("platform"),
  mediaUrl: text("media_url"),
  embedCode: text("embed_code"),
  caption: text("caption"),
  captionRich: jsonb("caption_rich"),
  images: jsonb("images").default([]),
  videoId: varchar("video_id", { length: 255 })
    .references(() => uploadedVideos.id, { onDelete: "set null" }),
  visibility: postVisibilityEnum("visibility").notNull().default("public"),
  likesCount: text("likes_count").notNull().default("0"),
  commentsCount: text("comments_count").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id", { length: 255 })
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id", { length: 255 })
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const follows = pgTable("follows", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followeeId: varchar("followee_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User mutes - stops posts from muted users appearing in trending feed
export const userMutes = pgTable("user_mutes", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  muterId: varchar("muter_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mutedId: varchar("muted_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User blocks - bidirectional blocking (neither can see each other's posts)
export const userBlocks = pgTable("user_blocks", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  blockerId: varchar("blocker_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blockedId: varchar("blocked_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const helpQueries = pgTable("help_queries", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  response: text("response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type HelpQuery = typeof helpQueries.$inferSelect;
export type InsertHelpQuery = typeof helpQueries.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export const settings = pgTable("settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", ["deduction", "refill", "bonus", "adjustment", "purchase"]);

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: creditTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  feature: text("feature"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Role = "user" | "moderator" | "admin";
export type Platform = "youtube" | "tiktok" | "instagram" | "facebook" | "twitter";
export type PostVisibility = "public" | "followers" | "private";
export type VideoStatus = "uploading" | "queued" | "processing" | "encoding" | "ready" | "failed";
export type UploadedVideo = typeof uploadedVideos.$inferSelect;
export type InsertUploadedVideo = typeof uploadedVideos.$inferInsert;
export type CreditTransactionType = "deduction" | "refill" | "bonus" | "adjustment" | "purchase";
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;
export type UserMute = typeof userMutes.$inferSelect;
export type InsertUserMute = typeof userMutes.$inferInsert;
export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = typeof userBlocks.$inferInsert;

export const generationTypeEnum = pgEnum("generation_type", ["movie_star", "dress_me", "restore_photo", "tiktok_dance"]);

export const artGenerations = pgTable("art_generations", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: generationTypeEnum("type").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  prompt: text("prompt"),
  creditsUsed: integer("credits_used").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ArtGeneration = typeof artGenerations.$inferSelect;
export type InsertArtGeneration = typeof artGenerations.$inferInsert;
export type GenerationType = "movie_star" | "dress_me" | "restore_photo" | "tiktok_dance";

// AI Service Configurations - one config per AI provider service
export const aiServiceConfigs = pgTable("ai_service_configs", {
  serviceKey: varchar("service_key", { length: 50 }).primaryKey(), // google_gemini, google_vertex, openai, anthropic, grok
  displayName: text("display_name").notNull(), // Human-readable name
  modelName: text("model_name").notNull(), // e.g., "gemini-2.0-flash", "gpt-4o", "claude-3-opus"
  apiKeyEncrypted: text("api_key_encrypted"), // Encrypted API key
  apiKeyIv: text("api_key_iv"), // Initialization vector for decryption
  apiKeyAuthTag: text("api_key_auth_tag"), // Auth tag for AES-GCM
  credentialsJsonEncrypted: text("credentials_json_encrypted"), // Encrypted JSON credentials (for Vertex AI service accounts)
  credentialsJsonIv: text("credentials_json_iv"),
  credentialsJsonAuthTag: text("credentials_json_auth_tag"),
  projectId: text("project_id"), // GCP Project ID for Vertex AI
  region: text("region"), // GCP Region for Vertex AI (e.g., us-central1)
  endpointUrl: text("endpoint_url"), // Optional custom endpoint override
  isEnabled: boolean("is_enabled").notNull().default(true),
  lastTestedAt: timestamp("last_tested_at"),
  lastTestStatus: text("last_test_status"), // "success", "error", or error message
  sourceType: text("source_type").notNull().default("local"), // "local" or "three_tears"
  threeTearsSyncedAt: timestamp("three_tears_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiServiceConfig = typeof aiServiceConfigs.$inferSelect;
export type InsertAiServiceConfig = typeof aiServiceConfigs.$inferInsert;

// AI Prompts table for customizable prompts
export const aiPrompts = pgTable("ai_prompts", {
  key: varchar("key", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("custom"),
  prompt: text("prompt").notNull(),
  serviceKey: varchar("service_key", { length: 50 }).references(() => aiServiceConfigs.serviceKey, { onDelete: "set null" }), // Which AI service to use
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = typeof aiPrompts.$inferInsert;

// ============================================
// ENCRYPTED MESSAGING TABLES
// ============================================

// Direct conversations between two users
export const directConversations = pgTable("direct_conversations", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  participant2Id: varchar("participant2_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Message type enum
export const messageTypeEnum = pgEnum("message_type", ["text", "image", "file"]);

// Encrypted messages - server stores only ciphertext
export const encryptedMessages = pgTable("encrypted_messages", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id", { length: 255 })
    .notNull()
    .references(() => directConversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // E2E encrypted content - server cannot read this
  encryptedContent: text("encrypted_content").notNull(),
  encryptedContentIv: text("encrypted_content_iv").notNull(),
  // Message metadata
  messageType: messageTypeEnum("message_type").notNull().default("text"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User public keys for E2E encryption (X25519/ECDH)
export const userPublicKeys = pgTable("user_public_keys", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(), // X25519 public key (base64)
  identityPublicKey: text("identity_public_key").notNull(), // For verification
  signedPreKey: text("signed_pre_key").notNull(), // Signed pre-key
  preKeySignature: text("pre_key_signature").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Conversation encryption keys (shared secret per conversation, encrypted per user)
export const conversationKeys = pgTable("conversation_keys", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id", { length: 255 })
    .notNull()
    .references(() => directConversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Encrypted shared key (encrypted with user's public key)
  encryptedSharedKey: text("encrypted_shared_key").notNull(),
  encryptedSharedKeyIv: text("encrypted_shared_key_iv").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI Avatar Settings for Talk to Ong feature
export const avatarSettings = pgTable("avatar_settings", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`'default'`), // Singleton - only one row
  voice: varchar("voice", { length: 50 }).notNull().default("Charon"),
  prompt: text("prompt").notNull().default(`You are Ong, a friendly AI companion for the Mien Kingdom community.

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
- If you don't know something about Mien culture, admit it honestly
- Encourage users to explore and learn more about their heritage

Remember: You represent the Mien Kingdom community - be welcoming and inclusive!`),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AvatarSettings = typeof avatarSettings.$inferSelect;
export type InsertAvatarSettings = typeof avatarSettings.$inferInsert;

export type DirectConversation = typeof directConversations.$inferSelect;
export type InsertDirectConversation = typeof directConversations.$inferInsert;
export type EncryptedMessage = typeof encryptedMessages.$inferSelect;
export type InsertEncryptedMessage = typeof encryptedMessages.$inferInsert;
export type UserPublicKey = typeof userPublicKeys.$inferSelect;
export type InsertUserPublicKey = typeof userPublicKeys.$inferInsert;
export type ConversationKey = typeof conversationKeys.$inferSelect;
export type InsertConversationKey = typeof conversationKeys.$inferInsert;
export type MessageType = "text" | "image" | "file";

// ============================================
// FEATURE USAGE TRACKING TABLES
// ============================================

// Feature categories for tracking
export const featureCategoryEnum = pgEnum("feature_category", [
  "ai_generation",
  "ai_translation",
  "ai_assistant",
  "avatar",
  "social",
  "messaging",
  "media",
  "account"
]);

// Specific features to track
export const featureNameEnum = pgEnum("feature_name", [
  // AI Generation features
  "movie_star",
  "dress_me",
  "restore_photo",
  "tiktok_dance",
  // AI Translation features
  "translate_to_english",
  "translate_to_mien",
  // AI Assistant features
  "recipe_it",
  "help_chat",
  "transcribe_audio",
  // Avatar features
  "avatar_session",
  // Social features
  "create_post",
  "like_post",
  "comment_post",
  "follow_user",
  // Messaging features
  "send_message",
  // Media features
  "upload_video",
  "upload_image",
  // Account features
  "login",
  "signup"
]);

// Avatar types for sub-feature tracking
export const avatarTypeEnum = pgEnum("avatar_type", [
  "ong",           // Default Ong avatar
  "custom"         // Future custom avatars
]);

// Detailed feature usage tracking
export const featureUsage = pgTable("feature_usage", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .references(() => users.id, { onDelete: "set null" }),
  category: featureCategoryEnum("category").notNull(),
  featureName: featureNameEnum("feature_name").notNull(),
  // Sub-feature details (e.g., avatar type, generation style, translation direction)
  subFeature: text("sub_feature"),
  // Additional metadata as JSON (e.g., credits used, duration, input params)
  metadata: jsonb("metadata"),
  // Track success/failure
  status: text("status").notNull().default("success"), // success, failed, cancelled
  errorMessage: text("error_message"),
  // Credits consumed for this action
  creditsUsed: integer("credits_used").default(0),
  // Duration in milliseconds (useful for avatar sessions, video processing)
  durationMs: integer("duration_ms"),
  // Request context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Avatar session tracking with detailed metrics
export const avatarSessions = pgTable("avatar_sessions", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  avatarType: avatarTypeEnum("avatar_type").notNull().default("ong"),
  // Session timing
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  // Interaction metrics
  messageCount: integer("message_count").default(0),
  userMessageCount: integer("user_message_count").default(0),
  avatarResponseCount: integer("avatar_response_count").default(0),
  // Configuration used
  voiceUsed: varchar("voice_used", { length: 50 }),
  // Session metadata
  platform: text("platform"), // web, ios, android
  connectionType: text("connection_type"), // livekit, simli
  // Status
  status: text("status").notNull().default("active"), // active, completed, failed, abandoned
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Daily aggregated feature usage (for efficient dashboard queries)
export const featureUsageDaily = pgTable("feature_usage_daily", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  category: featureCategoryEnum("category").notNull(),
  featureName: featureNameEnum("feature_name").notNull(),
  subFeature: text("sub_feature"),
  // Aggregated counts
  totalCount: integer("total_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  uniqueUsers: integer("unique_users").notNull().default(0),
  // Aggregated metrics
  totalCreditsUsed: integer("total_credits_used").notNull().default(0),
  totalDurationMs: integer("total_duration_ms").notNull().default(0),
  avgDurationMs: integer("avg_duration_ms").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type FeatureCategory = "ai_generation" | "ai_translation" | "ai_assistant" | "avatar" | "social" | "messaging" | "media" | "account";
export type FeatureName = "movie_star" | "dress_me" | "restore_photo" | "tiktok_dance" | "translate_to_english" | "translate_to_mien" | "translate_to_vietnamese" | "translate_to_mandarin" | "translate_to_hmong" | "translate_to_cantonese" | "translate_to_thai" | "translate_to_lao" | "translate_to_burmese" | "translate_to_french" | "translate_to_pinghua" | "translate_to_khmer" | "recipe_it" | "help_chat" | "transcribe_audio" | "avatar_session" | "create_post" | "like_post" | "comment_post" | "follow_user" | "send_message" | "upload_video" | "upload_image" | "login" | "signup";
export type AvatarType = "ong" | "custom";
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = typeof featureUsage.$inferInsert;
export type AvatarSession = typeof avatarSessions.$inferSelect;
export type InsertAvatarSession = typeof avatarSessions.$inferInsert;
export type FeatureUsageDaily = typeof featureUsageDaily.$inferSelect;
export type InsertFeatureUsageDaily = typeof featureUsageDaily.$inferInsert;

// ============================================
// BILLING PROVIDERS CONFIGURATION
// ============================================

// Billing provider enum
export const billingProviderEnum = pgEnum("billing_provider", ["stripe", "revenuecat"]);

// Platform enum for billing context
export const clientPlatformEnum = pgEnum("client_platform", ["web", "ios", "android"]);

// Billing provider configurations - encrypted credentials storage
export const billingProviders = pgTable("billing_providers", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  provider: billingProviderEnum("provider").notNull().unique(),
  displayName: text("display_name").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),

  // Encrypted API key (for both Stripe secret key and RevenueCat API key)
  apiKeyEncrypted: text("api_key_encrypted"),
  apiKeyIv: text("api_key_iv"),
  apiKeyAuthTag: text("api_key_auth_tag"),

  // Publishable/Public key (not encrypted, safe for client-side)
  publicKey: text("public_key"),

  // Webhook secret for signature verification (encrypted)
  webhookSecretEncrypted: text("webhook_secret_encrypted"),
  webhookSecretIv: text("webhook_secret_iv"),
  webhookSecretAuthTag: text("webhook_secret_auth_tag"),

  // Provider-specific configuration stored as JSON
  // For Stripe: { accountId, currency, webhookEndpointId }
  // For RevenueCat: { appAppleId, appGoogleId, projectId, entitlementId }
  config: jsonb("config"),

  // Source tracking (local admin vs pushed from Three Tears)
  sourceType: text("source_type").notNull().default("local"), // "local" or "three_tears"
  threeTearsSyncedAt: timestamp("three_tears_synced_at"),

  // Testing status
  lastTestedAt: timestamp("last_tested_at"),
  lastTestStatus: text("last_test_status"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BillingProvider = typeof billingProviders.$inferSelect;
export type InsertBillingProvider = typeof billingProviders.$inferInsert;
export type BillingProviderType = "stripe" | "revenuecat";
export type ClientPlatform = "web" | "ios" | "android";

// ============================================
// TRANSLATION HISTORY
// ============================================

export const translationDirectionEnum = pgEnum("translation_direction", ["to_mien", "to_english", "to_vietnamese", "to_mandarin", "to_hmong", "to_cantonese", "to_thai", "to_lao", "to_burmese", "to_french", "to_pinghua", "to_khmer"]);
export const translationSourceTypeEnum = pgEnum("translation_source_type", ["text", "document", "video"]);

export const translationHistory = pgTable("translation_history", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text").notNull(),
  direction: translationDirectionEnum("direction").notNull(),
  sourceType: translationSourceTypeEnum("source_type").notNull().default("text"),
  creditsUsed: integer("credits_used").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TranslationHistory = typeof translationHistory.$inferSelect;
export type InsertTranslationHistory = typeof translationHistory.$inferInsert;
export type TranslationDirection = "to_mien" | "to_english" | "to_vietnamese" | "to_mandarin" | "to_hmong" | "to_cantonese" | "to_thai" | "to_lao" | "to_burmese" | "to_french" | "to_pinghua" | "to_khmer";
export type TranslationSourceType = "text" | "document" | "video";

// ============================================
// RECIPE STORAGE TABLES
// ============================================

// Recipe categories for organizing saved recipes
export const recipeCategories = pgTable("recipe_categories", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailRecipeId: varchar("thumbnail_recipe_id", { length: 255 }),
  displayOrder: integer("display_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Saved recipes stored by users
export const savedRecipes = pgTable("saved_recipes", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id", { length: 255 })
    .notNull()
    .references(() => recipeCategories.id, { onDelete: "cascade" }),
  // Recipe content
  recipeName: text("recipe_name").notNull(),
  description: text("description"),
  servings: text("servings"),
  prepTime: text("prep_time"),
  cookTime: text("cook_time"),
  ingredients: jsonb("ingredients").default([]),
  instructions: jsonb("instructions").default([]),
  shoppingList: jsonb("shopping_list").default([]),
  // Mien cultural integration
  isMienDish: boolean("is_mien_dish").notNull().default(false),
  mienHighlights: text("mien_highlights"),
  mienModifications: text("mien_modifications"),
  similarMienDish: text("similar_mien_dish"),
  // Photos stored in R2
  photos: jsonb("photos").default([]),
  primaryPhotoUrl: text("primary_photo_url"),
  sourceImageUrl: text("source_image_url"),
  // User notes and favorites
  notes: text("notes"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  // Share tracking
  sharedPostId: varchar("shared_post_id", { length: 255 })
    .references(() => posts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type RecipeCategory = typeof recipeCategories.$inferSelect;
export type InsertRecipeCategory = typeof recipeCategories.$inferInsert;
export type SavedRecipe = typeof savedRecipes.$inferSelect;
export type InsertSavedRecipe = typeof savedRecipes.$inferInsert;

// Default recipe categories
export const DEFAULT_RECIPE_CATEGORIES = [
  { name: "Main Course", description: "Hearty main dishes and entrees", displayOrder: 1 },
  { name: "Appetizers", description: "Starters and small bites", displayOrder: 2 },
  { name: "Desserts", description: "Sweet treats and desserts", displayOrder: 3 },
  { name: "Traditional Mien", description: "Authentic Mien cultural recipes", displayOrder: 4 },
  { name: "Soups & Stews", description: "Warming soups and hearty stews", displayOrder: 5 },
  { name: "Rice & Noodles", description: "Rice dishes and noodle preparations", displayOrder: 6 },
  { name: "Vegetables", description: "Vegetable-focused dishes", displayOrder: 7 },
  { name: "Quick & Easy", description: "Simple recipes under 30 minutes", displayOrder: 8 },
];

// ============================================
// PUSH NOTIFICATIONS TABLES
// ============================================

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_follower",
  "new_post",
]);

// Push tokens - store Expo push tokens for each user's device
export const pushTokens = pgTable("push_tokens", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  platform: clientPlatformEnum("platform").notNull(),
  deviceId: text("device_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Global user notification settings (master switches)
export const userNotificationSettings = pgTable("user_notification_settings", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  newFollowerNotifications: boolean("new_follower_notifications").notNull().default(true),
  newPostNotifications: boolean("new_post_notifications").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Per-follower notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followeeId: varchar("followee_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notifyOnNewPost: boolean("notify_on_new_post").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications log table
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actorId: varchar("actor_id", { length: 255 })
    .references(() => users.id, { onDelete: "set null" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  pushSentAt: timestamp("push_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
export type UserNotificationSettings = typeof userNotificationSettings.$inferSelect;
export type InsertUserNotificationSettings = typeof userNotificationSettings.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationType = "new_follower" | "new_post";

// ============================================
// MIEN DICTIONARY
// ============================================

export const dictionaryEntries = pgTable("dictionary_entries", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  mienWord: text("mien_word").notNull(),
  englishDefinition: text("english_definition").notNull(),
  partOfSpeech: text("part_of_speech"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DictionaryEntry = typeof dictionaryEntries.$inferSelect;
export type InsertDictionaryEntry = typeof dictionaryEntries.$inferInsert;

// ============================================
// GAME SCORES
// ============================================

export const gameScores = pgTable("game_scores", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  phrasesCompleted: integer("phrases_completed").notNull(),
  gameType: text("game_type").notNull().default("wheel_of_fortune"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = typeof gameScores.$inferInsert;

// ============================================
// XP / LEVELING SYSTEM
// ============================================

export const xpActivityTypeEnum = pgEnum("xp_activity_type", [
  "post_created",
  "comment_created",
  "ai_translation",
  "ai_image_dress_me",
  "ai_image_restore_photo",
  "ai_image_story_cover",
  "ai_video_movie_star",
  "ai_video_tiktok_dance",
  "story_completed",
]);

export const xpTransactions = pgTable("xp_transactions", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activityType: xpActivityTypeEnum("activity_type").notNull(),
  xpAmount: integer("xp_amount").notNull(),
  totalXpAfter: integer("total_xp_after").notNull(),
  levelAfter: integer("level_after").notNull(),
  leveledUp: boolean("leveled_up").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyXpCaps = pgTable("daily_xp_caps", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activityType: xpActivityTypeEnum("activity_type").notNull(),
  date: timestamp("date").notNull(),
  count: integer("count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type XpActivityType = "post_created" | "comment_created" | "ai_translation" | "ai_image_dress_me" | "ai_image_restore_photo" | "ai_image_story_cover" | "ai_video_movie_star" | "ai_video_tiktok_dance" | "story_completed" | "game_wheel_of_fortune" | "game_vocab_match" | "game_mien_wordle" | "game_leaderboard_top3";
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = typeof xpTransactions.$inferInsert;
export type DailyXpCap = typeof dailyXpCaps.$inferSelect;
export type InsertDailyXpCap = typeof dailyXpCaps.$inferInsert;
