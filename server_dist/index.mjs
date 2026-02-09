var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  DEFAULT_RECIPE_CATEGORIES: () => DEFAULT_RECIPE_CATEGORIES,
  activityLogs: () => activityLogs,
  aiPrompts: () => aiPrompts,
  aiServiceConfigs: () => aiServiceConfigs,
  artGenerations: () => artGenerations,
  avatarSessions: () => avatarSessions,
  avatarSettings: () => avatarSettings,
  avatarTypeEnum: () => avatarTypeEnum,
  billingProviderEnum: () => billingProviderEnum,
  billingProviders: () => billingProviders,
  clientPlatformEnum: () => clientPlatformEnum,
  comments: () => comments,
  conversationKeys: () => conversationKeys,
  creditTransactionTypeEnum: () => creditTransactionTypeEnum,
  creditTransactions: () => creditTransactions,
  dailyXpCaps: () => dailyXpCaps,
  dictionaryEntries: () => dictionaryEntries,
  directConversations: () => directConversations,
  encryptedMessages: () => encryptedMessages,
  featureCategoryEnum: () => featureCategoryEnum,
  featureNameEnum: () => featureNameEnum,
  featureUsage: () => featureUsage,
  featureUsageDaily: () => featureUsageDaily,
  follows: () => follows,
  gameScores: () => gameScores,
  generationTypeEnum: () => generationTypeEnum,
  groupMembers: () => groupMembers,
  groups: () => groups,
  helpQueries: () => helpQueries,
  likes: () => likes,
  messageTypeEnum: () => messageTypeEnum,
  notificationPreferences: () => notificationPreferences,
  notificationTypeEnum: () => notificationTypeEnum,
  notifications: () => notifications,
  platformEnum: () => platformEnum,
  postVisibilityEnum: () => postVisibilityEnum,
  posts: () => posts,
  pushTokens: () => pushTokens,
  recipeCategories: () => recipeCategories,
  roleEnum: () => roleEnum,
  savedRecipes: () => savedRecipes,
  sessions: () => sessions,
  settings: () => settings,
  translationDirectionEnum: () => translationDirectionEnum,
  translationHistory: () => translationHistory,
  translationSourceTypeEnum: () => translationSourceTypeEnum,
  uploadedVideos: () => uploadedVideos,
  userBlocks: () => userBlocks,
  userMutes: () => userMutes,
  userNotificationSettings: () => userNotificationSettings,
  userPublicKeys: () => userPublicKeys,
  users: () => users,
  videoStatusEnum: () => videoStatusEnum,
  xpActivityTypeEnum: () => xpActivityTypeEnum,
  xpTransactions: () => xpTransactions
});
import { pgTable, text, varchar, timestamp, jsonb, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
var roleEnum, postVisibilityEnum, videoStatusEnum, users, sessions, groups, groupMembers, activityLogs, platformEnum, uploadedVideos, posts, likes, comments, follows, userMutes, userBlocks, helpQueries, settings, creditTransactionTypeEnum, creditTransactions, generationTypeEnum, artGenerations, aiServiceConfigs, aiPrompts, directConversations, messageTypeEnum, encryptedMessages, userPublicKeys, conversationKeys, avatarSettings, featureCategoryEnum, featureNameEnum, avatarTypeEnum, featureUsage, avatarSessions, featureUsageDaily, billingProviderEnum, clientPlatformEnum, billingProviders, translationDirectionEnum, translationSourceTypeEnum, translationHistory, recipeCategories, savedRecipes, DEFAULT_RECIPE_CATEGORIES, notificationTypeEnum, pushTokens, userNotificationSettings, notificationPreferences, notifications, dictionaryEntries, gameScores, xpActivityTypeEnum, xpTransactions, dailyXpCaps;
var init_schema = __esm({
  "server/db/schema.ts"() {
    "use strict";
    roleEnum = pgEnum("role", ["user", "moderator", "admin"]);
    postVisibilityEnum = pgEnum("post_visibility", ["public", "followers", "private"]);
    videoStatusEnum = pgEnum("video_status", [
      "uploading",
      "queued",
      "processing",
      "encoding",
      "ready",
      "failed"
    ]);
    users = pgTable("users", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      email: text("email").notNull(),
      displayName: text("display_name").notNull(),
      avatar: text("avatar"),
      bio: text("bio"),
      provider: text("provider").notNull(),
      providerUserId: text("provider_user_id").notNull(),
      role: roleEnum("role").notNull().default("user"),
      tierSlug: text("tier_slug").notNull().default("free"),
      credits: integer("credits").notNull().default(0),
      // User's current credit balance
      subscriptionActive: boolean("subscription_active").notNull().default(false),
      // Is subscription currently active
      subscriptionExpiresAt: timestamp("subscription_expires_at"),
      // When subscription expires
      lastCreditReset: timestamp("last_credit_reset"),
      // Last time credits were reset
      isDisabled: boolean("is_disabled").notNull().default(false),
      defaultPostVisibility: postVisibilityEnum("default_post_visibility").notNull().default("public"),
      totalXp: integer("total_xp").notNull().default(0),
      level: integer("level").notNull().default(1),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      lastLoginAt: timestamp("last_login_at").notNull().defaultNow()
    });
    sessions = pgTable("sessions", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    groups = pgTable("groups", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    groupMembers = pgTable("group_members", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id", { length: 255 }).notNull().references(() => groups.id, { onDelete: "cascade" }),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      role: roleEnum("role").notNull().default("user"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    activityLogs = pgTable("activity_logs", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
      action: text("action").notNull(),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    platformEnum = pgEnum("platform", ["youtube", "tiktok", "instagram", "facebook", "twitter"]);
    uploadedVideos = pgTable("uploaded_videos", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
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
      readyAt: timestamp("ready_at")
    });
    posts = pgTable("posts", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      platform: platformEnum("platform"),
      mediaUrl: text("media_url"),
      embedCode: text("embed_code"),
      caption: text("caption"),
      captionRich: jsonb("caption_rich"),
      images: jsonb("images").default([]),
      videoId: varchar("video_id", { length: 255 }).references(() => uploadedVideos.id, { onDelete: "set null" }),
      visibility: postVisibilityEnum("visibility").notNull().default("public"),
      likesCount: text("likes_count").notNull().default("0"),
      commentsCount: text("comments_count").notNull().default("0"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    likes = pgTable("likes", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      postId: varchar("post_id", { length: 255 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    comments = pgTable("comments", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      postId: varchar("post_id", { length: 255 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    follows = pgTable("follows", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      followerId: varchar("follower_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      followeeId: varchar("followee_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    userMutes = pgTable("user_mutes", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      muterId: varchar("muter_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      mutedId: varchar("muted_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    userBlocks = pgTable("user_blocks", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      blockerId: varchar("blocker_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      blockedId: varchar("blocked_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    helpQueries = pgTable("help_queries", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      query: text("query").notNull(),
      response: text("response"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    settings = pgTable("settings", {
      key: varchar("key", { length: 255 }).primaryKey(),
      value: text("value").notNull(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    creditTransactionTypeEnum = pgEnum("credit_transaction_type", ["deduction", "refill", "bonus", "adjustment", "purchase"]);
    creditTransactions = pgTable("credit_transactions", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      type: creditTransactionTypeEnum("type").notNull(),
      amount: integer("amount").notNull(),
      balanceAfter: integer("balance_after").notNull(),
      feature: text("feature"),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    generationTypeEnum = pgEnum("generation_type", ["movie_star", "dress_me", "restore_photo", "tiktok_dance"]);
    artGenerations = pgTable("art_generations", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      type: generationTypeEnum("type").notNull(),
      imageUrl: text("image_url"),
      videoUrl: text("video_url"),
      prompt: text("prompt"),
      creditsUsed: integer("credits_used").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    aiServiceConfigs = pgTable("ai_service_configs", {
      serviceKey: varchar("service_key", { length: 50 }).primaryKey(),
      // google_gemini, google_vertex, openai, anthropic, grok
      displayName: text("display_name").notNull(),
      // Human-readable name
      modelName: text("model_name").notNull(),
      // e.g., "gemini-2.0-flash", "gpt-4o", "claude-3-opus"
      apiKeyEncrypted: text("api_key_encrypted"),
      // Encrypted API key
      apiKeyIv: text("api_key_iv"),
      // Initialization vector for decryption
      apiKeyAuthTag: text("api_key_auth_tag"),
      // Auth tag for AES-GCM
      credentialsJsonEncrypted: text("credentials_json_encrypted"),
      // Encrypted JSON credentials (for Vertex AI service accounts)
      credentialsJsonIv: text("credentials_json_iv"),
      credentialsJsonAuthTag: text("credentials_json_auth_tag"),
      projectId: text("project_id"),
      // GCP Project ID for Vertex AI
      region: text("region"),
      // GCP Region for Vertex AI (e.g., us-central1)
      endpointUrl: text("endpoint_url"),
      // Optional custom endpoint override
      isEnabled: boolean("is_enabled").notNull().default(true),
      lastTestedAt: timestamp("last_tested_at"),
      lastTestStatus: text("last_test_status"),
      // "success", "error", or error message
      sourceType: text("source_type").notNull().default("local"),
      // "local" or "three_tears"
      threeTearsSyncedAt: timestamp("three_tears_synced_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    aiPrompts = pgTable("ai_prompts", {
      key: varchar("key", { length: 255 }).primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      category: text("category").notNull().default("custom"),
      prompt: text("prompt").notNull(),
      serviceKey: varchar("service_key", { length: 50 }).references(() => aiServiceConfigs.serviceKey, { onDelete: "set null" }),
      // Which AI service to use
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    directConversations = pgTable("direct_conversations", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      participant1Id: varchar("participant1_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      participant2Id: varchar("participant2_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      lastMessageAt: timestamp("last_message_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    messageTypeEnum = pgEnum("message_type", ["text", "image", "file"]);
    encryptedMessages = pgTable("encrypted_messages", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id", { length: 255 }).notNull().references(() => directConversations.id, { onDelete: "cascade" }),
      senderId: varchar("sender_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      // E2E encrypted content - server cannot read this
      encryptedContent: text("encrypted_content").notNull(),
      encryptedContentIv: text("encrypted_content_iv").notNull(),
      // Message metadata
      messageType: messageTypeEnum("message_type").notNull().default("text"),
      isRead: boolean("is_read").notNull().default(false),
      readAt: timestamp("read_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    userPublicKeys = pgTable("user_public_keys", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      publicKey: text("public_key").notNull(),
      // X25519 public key (base64)
      identityPublicKey: text("identity_public_key").notNull(),
      // For verification
      signedPreKey: text("signed_pre_key").notNull(),
      // Signed pre-key
      preKeySignature: text("pre_key_signature").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    conversationKeys = pgTable("conversation_keys", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id", { length: 255 }).notNull().references(() => directConversations.id, { onDelete: "cascade" }),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      // Encrypted shared key (encrypted with user's public key)
      encryptedSharedKey: text("encrypted_shared_key").notNull(),
      encryptedSharedKeyIv: text("encrypted_shared_key_iv").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    avatarSettings = pgTable("avatar_settings", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`'default'`),
      // Singleton - only one row
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
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    featureCategoryEnum = pgEnum("feature_category", [
      "ai_generation",
      "ai_translation",
      "ai_assistant",
      "avatar",
      "social",
      "messaging",
      "media",
      "account"
    ]);
    featureNameEnum = pgEnum("feature_name", [
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
    avatarTypeEnum = pgEnum("avatar_type", [
      "ong",
      // Default Ong avatar
      "custom"
      // Future custom avatars
    ]);
    featureUsage = pgTable("feature_usage", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
      category: featureCategoryEnum("category").notNull(),
      featureName: featureNameEnum("feature_name").notNull(),
      // Sub-feature details (e.g., avatar type, generation style, translation direction)
      subFeature: text("sub_feature"),
      // Additional metadata as JSON (e.g., credits used, duration, input params)
      metadata: jsonb("metadata"),
      // Track success/failure
      status: text("status").notNull().default("success"),
      // success, failed, cancelled
      errorMessage: text("error_message"),
      // Credits consumed for this action
      creditsUsed: integer("credits_used").default(0),
      // Duration in milliseconds (useful for avatar sessions, video processing)
      durationMs: integer("duration_ms"),
      // Request context
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    avatarSessions = pgTable("avatar_sessions", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
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
      platform: text("platform"),
      // web, ios, android
      connectionType: text("connection_type"),
      // livekit, simli
      // Status
      status: text("status").notNull().default("active"),
      // active, completed, failed, abandoned
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    featureUsageDaily = pgTable("feature_usage_daily", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
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
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    billingProviderEnum = pgEnum("billing_provider", ["stripe", "revenuecat"]);
    clientPlatformEnum = pgEnum("client_platform", ["web", "ios", "android"]);
    billingProviders = pgTable("billing_providers", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
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
      sourceType: text("source_type").notNull().default("local"),
      // "local" or "three_tears"
      threeTearsSyncedAt: timestamp("three_tears_synced_at"),
      // Testing status
      lastTestedAt: timestamp("last_tested_at"),
      lastTestStatus: text("last_test_status"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    translationDirectionEnum = pgEnum("translation_direction", ["to_mien", "to_english", "to_vietnamese", "to_mandarin", "to_hmong", "to_cantonese", "to_thai", "to_lao", "to_burmese", "to_french", "to_pinghua", "to_khmer"]);
    translationSourceTypeEnum = pgEnum("translation_source_type", ["text", "document", "video"]);
    translationHistory = pgTable("translation_history", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      originalText: text("original_text").notNull(),
      translatedText: text("translated_text").notNull(),
      direction: translationDirectionEnum("direction").notNull(),
      sourceType: translationSourceTypeEnum("source_type").notNull().default("text"),
      creditsUsed: integer("credits_used").notNull().default(1),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    recipeCategories = pgTable("recipe_categories", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      thumbnailUrl: text("thumbnail_url"),
      thumbnailRecipeId: varchar("thumbnail_recipe_id", { length: 255 }),
      displayOrder: integer("display_order").notNull().default(0),
      isDefault: boolean("is_default").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    savedRecipes = pgTable("saved_recipes", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      categoryId: varchar("category_id", { length: 255 }).notNull().references(() => recipeCategories.id, { onDelete: "cascade" }),
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
      sharedPostId: varchar("shared_post_id", { length: 255 }).references(() => posts.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    DEFAULT_RECIPE_CATEGORIES = [
      { name: "Main Course", description: "Hearty main dishes and entrees", displayOrder: 1 },
      { name: "Appetizers", description: "Starters and small bites", displayOrder: 2 },
      { name: "Desserts", description: "Sweet treats and desserts", displayOrder: 3 },
      { name: "Traditional Mien", description: "Authentic Mien cultural recipes", displayOrder: 4 },
      { name: "Soups & Stews", description: "Warming soups and hearty stews", displayOrder: 5 },
      { name: "Rice & Noodles", description: "Rice dishes and noodle preparations", displayOrder: 6 },
      { name: "Vegetables", description: "Vegetable-focused dishes", displayOrder: 7 },
      { name: "Quick & Easy", description: "Simple recipes under 30 minutes", displayOrder: 8 }
    ];
    notificationTypeEnum = pgEnum("notification_type", [
      "new_follower",
      "new_post"
    ]);
    pushTokens = pgTable("push_tokens", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull(),
      platform: clientPlatformEnum("platform").notNull(),
      deviceId: text("device_id"),
      isActive: boolean("is_active").notNull().default(true),
      lastUsedAt: timestamp("last_used_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    userNotificationSettings = pgTable("user_notification_settings", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      pushEnabled: boolean("push_enabled").notNull().default(true),
      newFollowerNotifications: boolean("new_follower_notifications").notNull().default(true),
      newPostNotifications: boolean("new_post_notifications").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    notificationPreferences = pgTable("notification_preferences", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      followeeId: varchar("followee_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      notifyOnNewPost: boolean("notify_on_new_post").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    notifications = pgTable("notifications", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      actorId: varchar("actor_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
      type: notificationTypeEnum("type").notNull(),
      title: text("title").notNull(),
      body: text("body").notNull(),
      data: jsonb("data"),
      isRead: boolean("is_read").notNull().default(false),
      readAt: timestamp("read_at"),
      pushSentAt: timestamp("push_sent_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    dictionaryEntries = pgTable("dictionary_entries", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      mienWord: text("mien_word").notNull(),
      englishDefinition: text("english_definition").notNull(),
      partOfSpeech: text("part_of_speech"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    gameScores = pgTable("game_scores", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      score: integer("score").notNull(),
      phrasesCompleted: integer("phrases_completed").notNull(),
      gameType: text("game_type").notNull().default("wheel_of_fortune"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    xpActivityTypeEnum = pgEnum("xp_activity_type", [
      "post_created",
      "comment_created",
      "ai_translation",
      "ai_image_dress_me",
      "ai_image_restore_photo",
      "ai_image_story_cover",
      "ai_video_movie_star",
      "ai_video_tiktok_dance",
      "story_completed"
    ]);
    xpTransactions = pgTable("xp_transactions", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      activityType: xpActivityTypeEnum("activity_type").notNull(),
      xpAmount: integer("xp_amount").notNull(),
      totalXpAfter: integer("total_xp_after").notNull(),
      levelAfter: integer("level_after").notNull(),
      leveledUp: boolean("leveled_up").notNull().default(false),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    dailyXpCaps = pgTable("daily_xp_caps", {
      id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
      activityType: xpActivityTypeEnum("activity_type").notNull(),
      date: timestamp("date").notNull(),
      count: integer("count").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
  }
});

// server/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
async function ensureTablesExist() {
  const client = await pool.connect();
  try {
    console.log("[DB] Checking and creating missing tables...");
    const enums = [
      `DO $$ BEGIN CREATE TYPE translation_direction AS ENUM ('to_mien', 'to_english'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE translation_source_type AS ENUM ('text', 'document', 'video'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('new_follower', 'new_post'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE message_type AS ENUM ('text', 'image', 'file'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE xp_activity_type AS ENUM ('post_created', 'comment_created', 'ai_translation', 'ai_image_dress_me', 'ai_image_restore_photo', 'ai_image_story_cover', 'ai_video_movie_star', 'ai_video_tiktok_dance', 'story_completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    ];
    for (const sql7 of enums) {
      await client.query(sql7);
    }
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
      )`
    ];
    for (const sql7 of tables) {
      await client.query(sql7);
    }
    const alterStatements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'wheel_of_fortune'`
    ];
    for (const sql7 of alterStatements) {
      await client.query(sql7);
    }
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
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_xp_caps_unique ON daily_xp_caps(user_id, activity_type, date)`
    ];
    for (const sql7 of indexes) {
      await client.query(sql7);
    }
    console.log("[DB] All tables verified/created successfully");
  } catch (error) {
    console.error("[DB] Error ensuring tables exist:", error);
    throw error;
  } finally {
    client.release();
  }
}
var Pool, pool, db;
var init_db = __esm({
  "server/db/index.ts"() {
    "use strict";
    init_schema();
    ({ Pool } = pg);
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// shared/tier-config.ts
function getTierPriority(slug) {
  if (!slug) return 0;
  return TIER_CHECKMARK_CONFIG[slug]?.priority ?? 0;
}
function getCreditsForTier(slug) {
  return TIER_CREDITS[slug] || 0;
}
var TIER_CHECKMARK_CONFIG, WEEKLY_ALLOCATION, MONTHLY_ALLOCATION, YEARLY_ALLOCATION, TIER_CONFIG, TIER_CREDITS, TIER_ORDER;
var init_tier_config = __esm({
  "shared/tier-config.ts"() {
    "use strict";
    TIER_CHECKMARK_CONFIG = {
      free: null,
      tier_weekly: { color: "#3B82F6", label: "Blue verified", priority: 1 },
      tier_monthly: { color: "#8B5CF6", label: "Purple verified", priority: 2 },
      tier_yearly: { color: "#F59E0B", label: "Gold verified", priority: 3 }
    };
    WEEKLY_ALLOCATION = {
      imageGenerations: 10,
      translationCredits: 20,
      foodAnalysis: 20,
      audioMinutes: 20,
      videoWorkflows: 3
    };
    MONTHLY_ALLOCATION = {
      imageGenerations: 40,
      translationCredits: 80,
      foodAnalysis: 80,
      audioMinutes: 80,
      videoWorkflows: 12
    };
    YEARLY_ALLOCATION = {
      imageGenerations: 200,
      translationCredits: 400,
      foodAnalysis: 400,
      audioMinutes: 400,
      videoWorkflows: 60
    };
    TIER_CONFIG = {
      free: {
        slug: "free",
        name: "Free",
        price: 0,
        billingPeriod: "month",
        allocation: {
          imageGenerations: 2,
          translationCredits: 5,
          foodAnalysis: 1,
          audioMinutes: 2,
          videoWorkflows: 0
        },
        features: [
          "5 translation credits (renews monthly)",
          "1 food analysis",
          "2 image generations",
          "2 minutes companion",
          "Free access to non-AI features",
          "Community access"
        ]
      },
      tier_weekly: {
        slug: "tier_weekly",
        name: "Weekly",
        price: 5,
        billingPeriod: "week",
        allocation: WEEKLY_ALLOCATION,
        features: [
          "20 translations per week",
          "20 food analysis per week",
          "10 image generations per week",
          "20 minutes companion per week",
          "3 video workflows per week",
          "Free access to non-AI features",
          "Priority support",
          "Blue verified checkmark"
        ]
      },
      tier_monthly: {
        slug: "tier_monthly",
        name: "Monthly",
        price: 18,
        billingPeriod: "month",
        allocation: MONTHLY_ALLOCATION,
        popular: true,
        features: [
          "80 translations per month",
          "80 food analysis per month",
          "40 image generations per month",
          "80 minutes companion per month",
          "12 video workflows per month",
          "Free access to non-AI features",
          "Priority support",
          "Purple verified checkmark"
        ]
      },
      tier_yearly: {
        slug: "tier_yearly",
        name: "Yearly",
        price: 79.99,
        billingPeriod: "year",
        allocation: YEARLY_ALLOCATION,
        features: [
          "400 translations per year",
          "400 food analysis per year",
          "200 image generations per year",
          "400 minutes companion per year",
          "60 video workflows per year",
          "Free access to non-AI features",
          "Priority support",
          "Best value - Save 20%",
          "Gold verified checkmark",
          "Trending feed priority"
        ]
      }
    };
    TIER_CREDITS = {
      free: 0,
      tier_weekly: 100,
      tier_monthly: 500,
      tier_yearly: 2500
    };
    TIER_ORDER = ["free", "tier_weekly", "tier_monthly", "tier_yearly"];
  }
});

// server/utils/encryption.ts
import crypto from "crypto";
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    const fallbackSecret = process.env.THREE_TEARS_ENROLLMENT_SECRET;
    if (!fallbackSecret) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("[Security] ENCRYPTION_KEY is required in production. Generate one with: openssl rand -hex 32");
      }
      console.warn("[Security] WARNING: No ENCRYPTION_KEY set. Using derived key from DATABASE_URL. Set ENCRYPTION_KEY for production use.");
      const dbUrl = process.env.DATABASE_URL || "dev-fallback-insecure";
      return crypto.scryptSync(dbUrl, "mienkingdom-dev-salt", 32);
    }
    return crypto.scryptSync(fallbackSecret, "mienkingdom-salt", 32);
  }
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  return crypto.scryptSync(key, "mienkingdom-salt", 32);
}
function encryptApiKey(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex")
  };
}
function decryptApiKey(encryptedData) {
  const key = getEncryptionKey();
  const iv = Buffer.from(encryptedData.iv, "hex");
  const authTag = Buffer.from(encryptedData.authTag, "hex");
  const encryptedText = Buffer.from(encryptedData.encrypted, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}
function decryptApiKeyFromFields(encrypted, iv, authTag) {
  if (!encrypted || !iv || !authTag) {
    return null;
  }
  try {
    return decryptApiKey({
      encrypted,
      iv,
      authTag
    });
  } catch {
    console.error("Failed to decrypt API key");
    return null;
  }
}
function maskApiKey(apiKey) {
  if (!apiKey) {
    return "(not set)";
  }
  if (apiKey.length <= 4) {
    return "***" + apiKey.slice(-1);
  }
  return apiKey.slice(0, 1) + "***" + apiKey.slice(-3);
}
var ALGORITHM, IV_LENGTH;
var init_encryption = __esm({
  "server/utils/encryption.ts"() {
    "use strict";
    ALGORITHM = "aes-256-gcm";
    IV_LENGTH = 16;
  }
});

// server/services/ai-providers.ts
import { eq as eq2 } from "drizzle-orm";
import jwt from "jsonwebtoken";
async function getGoogleAccessToken(credentialsJson) {
  const credentials = JSON.parse(credentialsJson);
  const now = Math.floor(Date.now() / 1e3);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform"
  };
  const token = jwt.sign(payload, credentials.private_key, { algorithm: "RS256" });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }
  const data = await response.json();
  return data.access_token;
}
async function getAllServiceConfigs() {
  const dbConfigs = await db.select().from(aiServiceConfigs);
  const configMap = new Map(dbConfigs.map((c) => [c.serviceKey, c]));
  const result = [];
  for (const [serviceKey, defaults] of Object.entries(DEFAULT_SERVICE_CONFIGS)) {
    const dbConfig = configMap.get(serviceKey);
    if (dbConfig) {
      const hasApiKey = !!(dbConfig.apiKeyEncrypted && dbConfig.apiKeyIv && dbConfig.apiKeyAuthTag);
      let apiKeyMasked = "(not configured)";
      if (hasApiKey) {
        const decrypted = decryptApiKeyFromFields(
          dbConfig.apiKeyEncrypted,
          dbConfig.apiKeyIv,
          dbConfig.apiKeyAuthTag
        );
        apiKeyMasked = maskApiKey(decrypted);
      }
      const hasCredentialsJson = !!(dbConfig.credentialsJsonEncrypted && dbConfig.credentialsJsonIv && dbConfig.credentialsJsonAuthTag);
      let credentialsJsonMasked = "(not configured)";
      if (hasCredentialsJson) {
        credentialsJsonMasked = "***configured***";
      }
      result.push({
        serviceKey,
        displayName: defaults.displayName,
        modelName: dbConfig.modelName,
        availableModels: defaults.availableModels,
        endpointUrl: dbConfig.endpointUrl,
        defaultEndpointUrl: defaults.endpointUrl,
        isEnabled: dbConfig.isEnabled,
        hasApiKey,
        apiKeyMasked,
        hasCredentialsJson,
        credentialsJsonMasked,
        projectId: dbConfig.projectId,
        region: dbConfig.region,
        lastTestedAt: dbConfig.lastTestedAt,
        lastTestStatus: dbConfig.lastTestStatus,
        sourceType: dbConfig.sourceType
      });
    } else {
      result.push({
        serviceKey,
        displayName: defaults.displayName,
        modelName: defaults.defaultModel,
        availableModels: defaults.availableModels,
        endpointUrl: null,
        defaultEndpointUrl: defaults.endpointUrl,
        isEnabled: false,
        hasApiKey: false,
        apiKeyMasked: "(not configured)",
        hasCredentialsJson: false,
        credentialsJsonMasked: "(not configured)",
        projectId: null,
        region: null,
        lastTestedAt: null,
        lastTestStatus: null,
        sourceType: "local"
      });
    }
  }
  return result;
}
async function getServiceConfigWithApiKey(serviceKey) {
  const defaults = DEFAULT_SERVICE_CONFIGS[serviceKey];
  if (!defaults) return null;
  const [dbConfig] = await db.select().from(aiServiceConfigs).where(eq2(aiServiceConfigs.serviceKey, serviceKey));
  if (!dbConfig) {
    return {
      modelName: defaults.defaultModel,
      apiKey: null,
      credentialsJson: null,
      projectId: null,
      region: null,
      endpointUrl: defaults.endpointUrl,
      isEnabled: false
    };
  }
  const apiKey = decryptApiKeyFromFields(
    dbConfig.apiKeyEncrypted,
    dbConfig.apiKeyIv,
    dbConfig.apiKeyAuthTag
  );
  const credentialsJson = decryptApiKeyFromFields(
    dbConfig.credentialsJsonEncrypted,
    dbConfig.credentialsJsonIv,
    dbConfig.credentialsJsonAuthTag
  );
  return {
    modelName: dbConfig.modelName,
    apiKey,
    credentialsJson,
    projectId: dbConfig.projectId,
    region: dbConfig.region,
    endpointUrl: dbConfig.endpointUrl || defaults.endpointUrl,
    isEnabled: dbConfig.isEnabled
  };
}
async function updateServiceConfig(serviceKey, updates) {
  const defaults = DEFAULT_SERVICE_CONFIGS[serviceKey];
  if (!defaults) return null;
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (updates.modelName !== void 0) {
    updateData.modelName = updates.modelName;
  }
  if (updates.endpointUrl !== void 0) {
    updateData.endpointUrl = updates.endpointUrl || null;
  }
  if (updates.isEnabled !== void 0) {
    updateData.isEnabled = updates.isEnabled;
  }
  if (updates.projectId !== void 0) {
    updateData.projectId = updates.projectId || null;
  }
  if (updates.region !== void 0) {
    updateData.region = updates.region || null;
  }
  if (updates.apiKey !== void 0 && updates.apiKey !== "") {
    const encrypted = encryptApiKey(updates.apiKey);
    updateData.apiKeyEncrypted = encrypted.encrypted;
    updateData.apiKeyIv = encrypted.iv;
    updateData.apiKeyAuthTag = encrypted.authTag;
  }
  if (updates.credentialsJson !== void 0 && updates.credentialsJson !== "") {
    const encrypted = encryptApiKey(updates.credentialsJson);
    updateData.credentialsJsonEncrypted = encrypted.encrypted;
    updateData.credentialsJsonIv = encrypted.iv;
    updateData.credentialsJsonAuthTag = encrypted.authTag;
  }
  const [existing] = await db.select().from(aiServiceConfigs).where(eq2(aiServiceConfigs.serviceKey, serviceKey));
  if (existing) {
    await db.update(aiServiceConfigs).set(updateData).where(eq2(aiServiceConfigs.serviceKey, serviceKey));
  } else {
    await db.insert(aiServiceConfigs).values({
      serviceKey,
      displayName: defaults.displayName,
      modelName: updates.modelName || defaults.defaultModel,
      isEnabled: updates.isEnabled ?? true,
      ...updateData
    });
  }
  const configs = await getAllServiceConfigs();
  return configs.find((c) => c.serviceKey === serviceKey) || null;
}
async function updateTestStatus(serviceKey, status) {
  const [existing] = await db.select().from(aiServiceConfigs).where(eq2(aiServiceConfigs.serviceKey, serviceKey));
  if (existing) {
    await db.update(aiServiceConfigs).set({
      lastTestedAt: /* @__PURE__ */ new Date(),
      lastTestStatus: status,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(aiServiceConfigs.serviceKey, serviceKey));
  }
}
async function testGoogleGemini(apiKey, modelName, endpointUrl) {
  const startTime = Date.now();
  try {
    const url = `${endpointUrl}/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say 'Connection successful' in exactly those words." }] }],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0
        }
      })
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName
      };
    }
    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName
    };
  }
}
async function testOpenAI(apiKey, modelName, endpointUrl) {
  const startTime = Date.now();
  try {
    const url = `${endpointUrl}/chat/completions`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Say 'Connection successful' in exactly those words." }],
        max_tokens: 20,
        temperature: 0
      })
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName
      };
    }
    const data = await response.json();
    const responseText = data?.choices?.[0]?.message?.content || "";
    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName
    };
  }
}
async function testAnthropic(apiKey, modelName, endpointUrl) {
  const startTime = Date.now();
  try {
    const url = `${endpointUrl}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 20,
        messages: [{ role: "user", content: "Say 'Connection successful' in exactly those words." }]
      })
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName
      };
    }
    const data = await response.json();
    const responseText = data?.content?.[0]?.text || "";
    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName
    };
  }
}
async function testGrok(apiKey, modelName, endpointUrl) {
  const startTime = Date.now();
  try {
    const url = `${endpointUrl}/chat/completions`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Say 'Connection successful' in exactly those words." }],
        max_tokens: 20,
        temperature: 0
      })
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName
      };
    }
    const data = await response.json();
    const responseText = data?.choices?.[0]?.message?.content || "";
    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName
    };
  }
}
async function testGoogleVertex(credentialsJson, modelName, projectId, region) {
  const startTime = Date.now();
  try {
    const accessToken = await getGoogleAccessToken(credentialsJson);
    const testModel = modelName.startsWith("imagen") ? "gemini-1.5-flash-002" : modelName;
    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${testModel}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say 'Connection successful' in exactly those words." }] }],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0
        }
      })
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: testModel
      };
    }
    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      success: true,
      message: `Connected successfully. Response: "${responseText.trim()}"`,
      responseTime,
      details: `Project: ${projectId}, Region: ${region}, Model: ${testModel}`,
      modelUsed: testModel
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName
    };
  }
}
async function testWaveSpeed(apiKey, modelName, endpointUrl) {
  const startTime = Date.now();
  try {
    const url = `${endpointUrl}/${modelName}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: "A simple red circle on white background",
        images: [],
        size: "512*512"
      })
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        message: `API Error: ${errorMessage}`,
        responseTime,
        details: JSON.stringify(errorData, null, 2),
        modelUsed: modelName
      };
    }
    const data = await response.json();
    const predictionId = data?.data?.id;
    return {
      success: true,
      message: `Connected successfully. Prediction ID: ${predictionId || "received"}`,
      responseTime,
      details: `Model: ${modelName}, Endpoint: ${endpointUrl}`,
      modelUsed: modelName
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      details: error.stack,
      modelUsed: modelName
    };
  }
}
async function testServiceConnection(serviceKey) {
  const config = await getServiceConfigWithApiKey(serviceKey);
  if (!config) {
    return {
      success: false,
      message: `Unknown service: ${serviceKey}`
    };
  }
  if (serviceKey === AI_SERVICES.GOOGLE_VERTEX) {
    if (!config.credentialsJson) {
      return {
        success: false,
        message: "Service account credentials not configured",
        details: "Please upload a Google Cloud service account JSON file for this service."
      };
    }
    if (!config.projectId || !config.region) {
      return {
        success: false,
        message: "Project ID and Region required",
        details: "Please configure the GCP Project ID and Region for Vertex AI."
      };
    }
    const result2 = await testGoogleVertex(
      config.credentialsJson,
      config.modelName,
      config.projectId,
      config.region
    );
    await updateTestStatus(serviceKey, result2.success ? "success" : result2.message);
    return result2;
  }
  if (!config.apiKey) {
    return {
      success: false,
      message: "API key not configured",
      details: "Please configure an API key for this service before testing."
    };
  }
  let result;
  switch (serviceKey) {
    case AI_SERVICES.GOOGLE_GEMINI:
      result = await testGoogleGemini(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.OPENAI:
      result = await testOpenAI(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.ANTHROPIC:
      result = await testAnthropic(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.GROK:
      result = await testGrok(config.apiKey, config.modelName, config.endpointUrl);
      break;
    case AI_SERVICES.WAVESPEED:
      result = await testWaveSpeed(config.apiKey, config.modelName, config.endpointUrl);
      break;
    default:
      result = {
        success: false,
        message: `No test implementation for service: ${serviceKey}`
      };
  }
  await updateTestStatus(serviceKey, result.success ? "success" : result.message);
  return result;
}
async function getServiceConfigsForSync() {
  const configs = await getAllServiceConfigs();
  return configs.map((c) => ({
    serviceKey: c.serviceKey,
    displayName: c.displayName,
    modelName: c.modelName,
    isEnabled: c.isEnabled,
    hasApiKey: c.hasApiKey
  }));
}
var AI_SERVICES, DEFAULT_SERVICE_CONFIGS;
var init_ai_providers = __esm({
  "server/services/ai-providers.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_encryption();
    AI_SERVICES = {
      GOOGLE_GEMINI: "google_gemini",
      GOOGLE_VERTEX: "google_vertex",
      OPENAI: "openai",
      ANTHROPIC: "anthropic",
      GROK: "grok",
      WAVESPEED: "wavespeed"
    };
    DEFAULT_SERVICE_CONFIGS = {
      [AI_SERVICES.GOOGLE_GEMINI]: {
        displayName: "Google Gemini",
        defaultModel: "gemini-2.5-flash",
        availableModels: [
          // Gemini 3 Series (Latest)
          "gemini-3-flash-preview",
          "gemini-3-pro-preview",
          "gemini-3-pro-image-preview",
          // Gemini 2.5 Series
          "gemini-2.5-flash",
          "gemini-2.5-flash-lite",
          "gemini-2.5-flash-image",
          "gemini-2.5-pro",
          // Gemini 2.0 Series
          "gemini-2.0-flash",
          "gemini-2.0-flash-lite",
          // Legacy
          "gemini-1.5-pro",
          "gemini-1.5-flash"
        ],
        endpointUrl: "https://generativelanguage.googleapis.com/v1beta"
      },
      [AI_SERVICES.GOOGLE_VERTEX]: {
        displayName: "Google Vertex AI",
        defaultModel: "imagen-3.0-generate-002",
        availableModels: [
          // Imagen 3 (Image Generation)
          "imagen-3.0-generate-002",
          "imagen-3.0-generate-001",
          "imagen-3.0-fast-generate-001",
          // Imagen 3 (Image Editing)
          "imagen-3.0-capability-001",
          // Gemini on Vertex
          "gemini-2.0-flash-001",
          "gemini-1.5-pro-002",
          "gemini-1.5-flash-002",
          // Nano Banana Pro (Custom/Preview)
          "nano-banana-pro"
        ],
        endpointUrl: "https://us-central1-aiplatform.googleapis.com/v1"
      },
      [AI_SERVICES.OPENAI]: {
        displayName: "OpenAI",
        defaultModel: "gpt-4o",
        availableModels: [
          "gpt-4o",
          "gpt-4o-mini",
          "gpt-4-turbo",
          "gpt-4",
          "gpt-3.5-turbo",
          "o1-preview",
          "o1-mini"
        ],
        endpointUrl: "https://api.openai.com/v1"
      },
      [AI_SERVICES.ANTHROPIC]: {
        displayName: "Anthropic Claude",
        defaultModel: "claude-3-5-sonnet-20241022",
        availableModels: [
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307"
        ],
        endpointUrl: "https://api.anthropic.com/v1"
      },
      [AI_SERVICES.GROK]: {
        displayName: "xAI Grok",
        defaultModel: "grok-beta",
        availableModels: [
          "grok-beta",
          "grok-vision-beta"
        ],
        endpointUrl: "https://api.x.ai/v1"
      },
      [AI_SERVICES.WAVESPEED]: {
        displayName: "WaveSpeed AI",
        defaultModel: "wavespeed-ai/qwen-image-max/edit",
        availableModels: [
          "wavespeed-ai/qwen-image-max/edit"
        ],
        endpointUrl: "https://api.wavespeed.ai/api/v3"
      }
    };
  }
});

// server/integration/three-tears.ts
var three_tears_exports = {};
__export(three_tears_exports, {
  broadcastEvent: () => broadcastEvent,
  getAppId: () => getAppId,
  getChatWidgetScript: () => getChatWidgetScript,
  getEnrollmentSecret: () => getEnrollmentSecret,
  getIntegrationSettings: () => getIntegrationSettings,
  getMainAppBaseUrl: () => getMainAppBaseUrl,
  handleAdminCommand: () => handleAdminCommand,
  registerWithThreeTears: () => registerWithThreeTears,
  resetJwksClient: () => resetJwksClient,
  setIntegrationSetting: () => setIntegrationSetting,
  verifyJwt: () => verifyJwt
});
import jwt2 from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { eq as eq3, or } from "drizzle-orm";
async function getSettingValue(key) {
  try {
    const result = await db.select().from(settings).where(eq3(settings.key, key));
    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    return null;
  }
}
async function getMainAppBaseUrl() {
  const dbValue = await getSettingValue("three_tears_base_url");
  if (dbValue) return dbValue;
  if (process.env.THREE_TEARS_BASE_URL) return process.env.THREE_TEARS_BASE_URL;
  const isLocalhost = process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost") || process.env.EXPO_PUBLIC_DOMAIN?.includes("127.0.0.1");
  if (isLocalhost) {
    return "http://localhost:9081";
  }
  return "https://threetears.net";
}
async function getEnrollmentSecret() {
  const dbValue = await getSettingValue("three_tears_enrollment_secret");
  return dbValue || process.env.THREE_TEARS_ENROLLMENT_SECRET || "";
}
async function setIntegrationSetting(key, value) {
  try {
    await db.insert(settings).values({
      key,
      value
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: /* @__PURE__ */ new Date() }
    });
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
    throw error;
  }
}
async function getIntegrationSettings() {
  const baseUrl = await getMainAppBaseUrl();
  const enrollmentSecret = await getEnrollmentSecret();
  const appId = await getAppId();
  const lastStatus = await getSettingValue("three_tears_last_status");
  return {
    baseUrl,
    enrollmentSecret: enrollmentSecret ? "***configured***" : "",
    appId,
    lastRegistrationStatus: lastStatus
  };
}
async function getJwksClient() {
  const baseUrl = await getMainAppBaseUrl();
  if (!jwksClient) {
    jwksClient = jwksRsa({
      jwksUri: `${baseUrl}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 36e5,
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
  }
  return jwksClient;
}
function resetJwksClient() {
  jwksClient = null;
}
async function getAppId() {
  try {
    const result = await db.select().from(settings).where(eq3(settings.key, "registered_app_id"));
    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    console.error("Failed to get app_id from settings:", error);
    return null;
  }
}
async function setAppId(appId) {
  try {
    await db.insert(settings).values({
      key: "registered_app_id",
      value: appId
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: appId, updatedAt: /* @__PURE__ */ new Date() }
    });
  } catch (error) {
    console.error("Failed to save app_id to settings:", error);
  }
}
function getAppBaseUrl() {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const isLocalhost = domain.includes("localhost") || domain.includes("127.0.0.1");
    const protocol = isLocalhost ? "http" : "https";
    return `${protocol}://${domain}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return "http://localhost:5000";
}
function getClientOrigin() {
  if (process.env.NODE_ENV === "development" || process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost")) {
    return "http://localhost:8081";
  }
  return getAppBaseUrl();
}
async function registerWithThreeTears(forceReregister = false) {
  try {
    const mainAppBaseUrl = await getMainAppBaseUrl();
    const enrollmentSecret = await getEnrollmentSecret();
    const existingAppId = await getAppId();
    const appUrl = getAppBaseUrl();
    if (existingAppId && !forceReregister) {
      console.log(`[Three Tears] App already registered with ID: ${existingAppId}. Sending heartbeat...`);
      try {
        const heartbeatResponse = await fetch(`${mainAppBaseUrl}/api/discovery/heartbeat/${existingAppId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Enrollment-Key": enrollmentSecret
          },
          body: JSON.stringify({ url: appUrl })
        });
        if (heartbeatResponse.ok) {
          console.log("[Three Tears] Heartbeat sent successfully");
          await setIntegrationSetting("three_tears_last_status", `Heartbeat OK - ${(/* @__PURE__ */ new Date()).toISOString()}`);
          return { success: true, message: "Heartbeat sent successfully", appId: existingAppId };
        } else {
          const status = `Heartbeat failed with status: ${heartbeatResponse.status}`;
          console.warn(`[Three Tears] ${status}`);
          await setIntegrationSetting("three_tears_last_status", `${status} - ${(/* @__PURE__ */ new Date()).toISOString()}`);
          return { success: false, message: status };
        }
      } catch (error) {
        const status = `Heartbeat request failed: ${error.message}`;
        console.warn("[Three Tears]", status);
        await setIntegrationSetting("three_tears_last_status", `${status} - ${(/* @__PURE__ */ new Date()).toISOString()}`);
        return { success: false, message: status };
      }
    }
    console.log("[Three Tears] Registering with main app...");
    const clientOrigin = getClientOrigin();
    console.log(`[Three Tears] API Base URL: ${appUrl}, Client Origin: ${clientOrigin}`);
    try {
      const aiServicesInfo = await getServiceConfigsForSync();
      const registerResponse = await fetch(`${mainAppBaseUrl}/api/discovery/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Enrollment-Key": enrollmentSecret
        },
        body: JSON.stringify({
          apiBaseUrl: appUrl,
          appJwksUrl: `${appUrl}/.well-known/jwks.json`,
          clientOrigin,
          capabilities: {
            tickets: true,
            users: true,
            groups: true,
            snapshot: true,
            knowledge: false,
            aiConfig: true
          },
          syncEndpoints: {
            tickets: `${appUrl}/api/sync/tickets`,
            users: `${appUrl}/api/sync/users`,
            snapshot: `${appUrl}/api/sync/snapshot`
          },
          commandEndpoint: `${appUrl}/api/admin/command`,
          aiService: {
            name: AI_SERVICE_NAME,
            description: AI_SERVICE_DESCRIPTION,
            services: aiServicesInfo,
            configurable: true
          }
        })
      });
      if (registerResponse.ok) {
        const data = await registerResponse.json();
        if (data.app_id) {
          await setAppId(data.app_id);
          await setIntegrationSetting("three_tears_last_status", `Registered successfully - ${(/* @__PURE__ */ new Date()).toISOString()}`);
          console.log(`[Three Tears] Successfully registered with app_id: ${data.app_id}`);
          return { success: true, message: "Successfully registered", appId: data.app_id };
        }
        return { success: false, message: "Registration response missing app_id" };
      } else {
        const status = `Registration failed with status: ${registerResponse.status}`;
        console.warn(`[Three Tears] ${status}`);
        await setIntegrationSetting("three_tears_last_status", `${status} - ${(/* @__PURE__ */ new Date()).toISOString()}`);
        return { success: false, message: status };
      }
    } catch (error) {
      const status = `Registration request failed: ${error.message}`;
      console.warn("[Three Tears]", status);
      await setIntegrationSetting("three_tears_last_status", `${status} - ${(/* @__PURE__ */ new Date()).toISOString()}`);
      return { success: false, message: status };
    }
  } catch (error) {
    console.error("[Three Tears] Error during registration:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}
async function getSigningKey(header) {
  const client = await getJwksClient();
  return new Promise((resolve2, reject) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      if (signingKey) {
        resolve2(signingKey);
      } else {
        reject(new Error("No signing key found"));
      }
    });
  });
}
async function verifyJwt(token) {
  try {
    const decoded = jwt2.decode(token, { complete: true });
    if (!decoded || !decoded.header) {
      return { valid: false, error: "Invalid token format" };
    }
    const signingKey = await getSigningKey(decoded.header);
    const payload = jwt2.verify(token, signingKey, {
      issuer: "Three Tears",
      algorithms: ["RS256", "RS384", "RS512"]
    });
    return { valid: true, payload };
  } catch (error) {
    console.error("[Three Tears] JWT verification error:", error.message);
    if (error.name === "TokenExpiredError") {
      return { valid: false, error: "Token expired" };
    }
    if (error.name === "JsonWebTokenError") {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: "Verification failed" };
  }
}
async function broadcastEvent(eventName, data) {
  try {
    const appId = await getAppId();
    if (!appId) {
      console.warn("[Three Tears] Cannot broadcast event - app not registered");
      return;
    }
    const mainAppBaseUrl = await getMainAppBaseUrl();
    const enrollmentSecret = await getEnrollmentSecret();
    const response = await fetch(`${mainAppBaseUrl}/webhooks/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Enrollment-Key": enrollmentSecret
      },
      body: JSON.stringify({
        app_id: appId,
        event: eventName,
        data,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
    if (response.ok) {
      console.log(`[Three Tears] Event broadcasted: ${eventName}`);
    } else {
      console.warn(`[Three Tears] Event broadcast failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("[Three Tears] Event broadcast error:", error);
  }
}
async function handleAdminCommand(action, params) {
  try {
    switch (action) {
      case "get_user_details": {
        const { userId, email } = params;
        let user;
        if (userId) {
          const result = await db.select().from(users).where(eq3(users.id, userId));
          user = result[0];
        } else if (email) {
          const result = await db.select().from(users).where(eq3(users.email, email));
          user = result[0];
        }
        if (!user) {
          return { success: false, error: "User not found" };
        }
        return { success: true, data: user };
      }
      case "update_user":
      case "update_subscription": {
        const { userId, tierSlug, subscriptionActive, subscriptionExpiresAt, email, displayName } = params;
        let targetUserId = userId;
        if (!targetUserId) {
          if (email) {
            const [u] = await db.select().from(users).where(eq3(users.email, email)).limit(1);
            if (u) targetUserId = u.id;
          } else if (displayName) {
            const [u] = await db.select().from(users).where(or(eq3(users.displayName, displayName), eq3(users.id, displayName))).limit(1);
            if (u) targetUserId = u.id;
          }
        }
        if (!targetUserId) {
          return { success: false, error: "User not found or userId/email/displayName missing" };
        }
        const updateData = {};
        if (tierSlug !== void 0) updateData.tierSlug = tierSlug;
        if (subscriptionActive !== void 0) {
          updateData.subscriptionActive = subscriptionActive;
        } else if (tierSlug !== void 0) {
          updateData.subscriptionActive = tierSlug !== "free";
        }
        if (subscriptionExpiresAt !== void 0) {
          updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
        }
        if (updateData.subscriptionActive && tierSlug) {
          const creditsToGrant = getCreditsForTier(tierSlug);
          updateData.credits = creditsToGrant;
          updateData.lastCreditReset = /* @__PURE__ */ new Date();
        }
        if (Object.keys(updateData).length === 0) {
          return { success: false, error: "tierSlug or subscription status must be provided" };
        }
        const result = await db.update(users).set(updateData).where(eq3(users.id, targetUserId)).returning();
        if (result.length === 0) {
          return { success: false, error: "User not found" };
        }
        return { success: true, data: { message: "Subscription updated", user: result[0] } };
      }
      case "license_update": {
        const { user_id, tier_slug, subscription_active, expiration_date, status } = params;
        if (!user_id) {
          return { success: false, error: "user_id is required" };
        }
        let targetUser;
        const [u] = await db.select().from(users).where(
          or(eq3(users.id, user_id), eq3(users.email, user_id))
        ).limit(1);
        targetUser = u;
        if (!targetUser) {
          return { success: false, error: "User not found" };
        }
        const isActive = subscription_active ?? status === "active";
        const updateData = {
          subscriptionActive: isActive
        };
        if (tier_slug) updateData.tierSlug = tier_slug;
        if (expiration_date) updateData.subscriptionExpiresAt = new Date(expiration_date);
        if (isActive && tier_slug) {
          const creditsToGrant = getCreditsForTier(tier_slug);
          updateData.credits = creditsToGrant;
          updateData.lastCreditReset = /* @__PURE__ */ new Date();
        } else if (!isActive) {
          updateData.tierSlug = "free";
          updateData.credits = 0;
        }
        const result = await db.update(users).set(updateData).where(eq3(users.id, targetUser.id)).returning();
        return { success: true, data: { message: "License updated", user: result[0] } };
      }
      case "disable_user": {
        const { userId } = params;
        if (!userId) {
          return { success: false, error: "userId is required" };
        }
        const result = await db.update(users).set({ isDisabled: true }).where(eq3(users.id, userId)).returning();
        if (result.length === 0) {
          return { success: false, error: "User not found" };
        }
        return { success: true, data: { message: "User disabled", user: result[0] } };
      }
      case "enable_user": {
        const { userId } = params;
        if (!userId) {
          return { success: false, error: "userId is required" };
        }
        const result = await db.update(users).set({ isDisabled: false }).where(eq3(users.id, userId)).returning();
        if (result.length === 0) {
          return { success: false, error: "User not found" };
        }
        return { success: true, data: { message: "User enabled", user: result[0] } };
      }
      case "reset_password": {
        const { userId } = params;
        if (!userId) {
          return { success: false, error: "userId is required" };
        }
        return { success: true, data: { message: "Password reset not applicable - OAuth-only authentication" } };
      }
      case "update_ai_config":
      case "push_ai_config": {
        const { services } = params;
        if (!services || !Array.isArray(services)) {
          return { success: false, error: "services array is required" };
        }
        let updated = 0;
        const errors = [];
        for (const service of services) {
          if (!service.serviceKey || !AI_SERVICES[service.serviceKey.toUpperCase()]) {
            errors.push(`Unknown service: ${service.serviceKey}`);
            continue;
          }
          try {
            await updateServiceConfig(service.serviceKey, {
              modelName: service.modelName,
              apiKey: service.apiKey,
              endpointUrl: service.endpointUrl,
              isEnabled: service.isEnabled
            });
            updated++;
          } catch (error) {
            errors.push(`Failed to update ${service.serviceKey}: ${error.message}`);
          }
        }
        return {
          success: errors.length === 0,
          data: {
            message: `AI config updated: ${updated} services updated`,
            updated,
            errors
          }
        };
      }
      case "get_ai_config": {
        const aiServicesInfo = await getServiceConfigsForSync();
        return {
          success: true,
          data: {
            serviceName: AI_SERVICE_NAME,
            description: AI_SERVICE_DESCRIPTION,
            services: aiServicesInfo
          }
        };
      }
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    console.error("[Three Tears] Command execution error:", error);
    return { success: false, error: "Command execution failed" };
  }
}
async function getChatWidgetScript() {
  const appId = await getAppId();
  const mainAppBaseUrl = await getMainAppBaseUrl();
  return `<script src="${mainAppBaseUrl}/widget.js" data-app-id="${appId || "pending"}"></script>`;
}
var AI_SERVICE_NAME, AI_SERVICE_DESCRIPTION, jwksClient;
var init_three_tears = __esm({
  "server/integration/three-tears.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_tier_config();
    init_ai_providers();
    AI_SERVICE_NAME = "Mien Kingdom AI";
    AI_SERVICE_DESCRIPTION = "AI-powered features for translation, image generation, and content analysis";
    jwksClient = null;
  }
});

// server/index.ts
import "dotenv/config";
import express from "express";

// server/routes.ts
init_db();
init_schema();
import { createServer } from "node:http";
import { GoogleGenAI } from "@google/genai";
import crypto4 from "crypto";
import jwt4 from "jsonwebtoken";
import path2 from "path";
import fs2 from "fs";
import multer from "multer";
import sharp from "sharp";
import { eq as eq13, and as and5, gt as gt4, count as count2, gte as gte2, desc as desc3, inArray as inArray3, sql as sql6, or as or3, not } from "drizzle-orm";

// server/middleware/auth.ts
init_db();
init_schema();
import { eq, and, gt, sql as sql2 } from "drizzle-orm";
var DEV_ADMIN_ID = "dev-admin-1";
async function ensureDevAdminExists() {
  const existing = await db.select().from(users).where(eq(users.id, DEV_ADMIN_ID)).limit(1);
  if (existing.length === 0) {
    await db.execute(sql2`
      INSERT INTO users (id, email, display_name, avatar, provider, provider_user_id, role, tier_slug, credits)
      VALUES (${DEV_ADMIN_ID}, ${"dev-admin@mien.local"}, ${"Dev Admin"}, ${null}, ${"google"}, ${"dev-admin-provider-id"}, ${"admin"}, ${"free"}, ${30})
      ON CONFLICT (id) DO NOTHING
    `);
  }
}
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }
    const token = authHeader.substring(7);
    const isDevToken = token === "dev-bypass-token" || token === "dev-localhost-token" || token === "dev-session-token";
    const isDevelopment = process.env.NODE_ENV === "development";
    const isLocalhost = req.hostname === "localhost" || req.hostname === "127.0.0.1";
    if (isDevToken && isDevelopment && isLocalhost) {
      await ensureDevAdminExists();
      req.user = {
        id: DEV_ADMIN_ID,
        email: "dev-admin@mien.local",
        displayName: "Dev Admin",
        avatar: null,
        provider: "google",
        role: "admin"
      };
      req.session = {
        id: "dev-session-1",
        token
      };
      return next();
    }
    const sessionResults = await db.select().from(sessions).where(and(eq(sessions.token, token), gt(sessions.expiresAt, /* @__PURE__ */ new Date()))).limit(1);
    if (sessionResults.length === 0) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    const session = sessionResults[0];
    const userResults = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (userResults.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    const user = userResults[0];
    if (user.isDisabled) {
      return res.status(403).json({ error: "Account is disabled. Please contact support." });
    }
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      provider: user.provider,
      role: user.role
    };
    req.session = {
      id: session.id,
      token: session.token
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
function requireModerator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.role !== "admin" && req.user.role !== "moderator") {
    return res.status(403).json({ error: "Moderator or admin access required" });
  }
  next();
}

// server/routes.ts
init_three_tears();

// server/integration/sync.ts
init_db();
init_schema();
init_three_tears();
init_ai_providers();
import { count, gte, gt as gt2, eq as eq4, desc, sql as sql3 } from "drizzle-orm";
async function pushToThreeTears(event) {
  try {
    const appId = await getAppId();
    if (!appId) {
      console.warn("[Sync] Cannot push event - app not registered with Three Tears");
      return false;
    }
    const mainAppBaseUrl = await getMainAppBaseUrl();
    const enrollmentSecret = await getEnrollmentSecret();
    const response = await fetch(`${mainAppBaseUrl}/api/sync/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-ID": appId,
        "X-Enrollment-Key": enrollmentSecret
      },
      body: JSON.stringify({
        app_id: appId,
        event: event.type,
        data: event.data,
        timestamp: event.timestamp
      })
    });
    if (response.ok) {
      console.log(`[Sync] Event pushed successfully: ${event.type}`);
      return true;
    } else {
      console.warn(`[Sync] Event push failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("[Sync] Push error:", error);
    return false;
  }
}
function pushUserCreated(user) {
  setImmediate(async () => {
    try {
      const event = {
        type: "user.created",
        data: user,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const success = await pushToThreeTears(event);
      try {
        await db.insert(activityLogs).values({
          userId: user.id,
          action: "sync_push_user_created",
          metadata: { success, userId: user.id }
        });
      } catch (logError) {
        console.error("[Sync] Failed to log user.created activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushUserCreated:", error);
    }
  });
}
function pushUserUpdated(user) {
  setImmediate(async () => {
    try {
      const event = {
        type: "user.updated",
        data: user,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const success = await pushToThreeTears(event);
      try {
        await db.insert(activityLogs).values({
          userId: user.id,
          action: "sync_push_user_updated",
          metadata: { success, userId: user.id }
        });
      } catch (logError) {
        console.error("[Sync] Failed to log user.updated activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushUserUpdated:", error);
    }
  });
}
function pushGroupCreated(group) {
  setImmediate(async () => {
    try {
      const event = {
        type: "group.created",
        data: group,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const success = await pushToThreeTears(event);
      try {
        await db.insert(activityLogs).values({
          userId: null,
          action: "sync_push_group_created",
          metadata: { success, groupId: group.id }
        });
      } catch (logError) {
        console.error("[Sync] Failed to log group.created activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushGroupCreated:", error);
    }
  });
}
function pushGroupUpdated(group) {
  setImmediate(async () => {
    try {
      const event = {
        type: "group.updated",
        data: group,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const success = await pushToThreeTears(event);
      try {
        await db.insert(activityLogs).values({
          userId: null,
          action: "sync_push_group_updated",
          metadata: { success, groupId: group.id }
        });
      } catch (logError) {
        console.error("[Sync] Failed to log group.updated activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushGroupUpdated:", error);
    }
  });
}
function pushGroupDeleted(groupId) {
  setImmediate(async () => {
    try {
      const event = {
        type: "group.deleted",
        data: { id: groupId },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const success = await pushToThreeTears(event);
      try {
        await db.insert(activityLogs).values({
          userId: null,
          action: "sync_push_group_deleted",
          metadata: { success, groupId }
        });
      } catch (logError) {
        console.error("[Sync] Failed to log group.deleted activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushGroupDeleted:", error);
    }
  });
}
async function generateSnapshot() {
  const now = /* @__PURE__ */ new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
  const [
    allUsers,
    allGroups,
    [totalUsersResult],
    [activeUsers24hResult],
    [activeUsers7dResult],
    [totalSessionsResult],
    [activeSessionsResult],
    [totalPostsResult],
    [userRoleResult],
    [modRoleResult],
    [adminRoleResult]
  ] = await Promise.all([
    db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatar: users.avatar,
      role: users.role,
      provider: users.provider,
      tierSlug: users.tierSlug,
      credits: users.credits,
      isDisabled: users.isDisabled,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt
    }).from(users).orderBy(desc(users.createdAt)),
    db.select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt
    }).from(groups).orderBy(desc(groups.createdAt)),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(gte(users.lastLoginAt, oneDayAgo)),
    db.select({ count: count() }).from(users).where(gte(users.lastLoginAt, sevenDaysAgo)),
    db.select({ count: count() }).from(sessions),
    db.select({ count: count() }).from(sessions).where(gt2(sessions.expiresAt, now)),
    db.select({ count: count() }).from(posts),
    db.select({ count: count() }).from(users).where(eq4(users.role, "user")),
    db.select({ count: count() }).from(users).where(eq4(users.role, "moderator")),
    db.select({ count: count() }).from(users).where(eq4(users.role, "admin"))
  ]);
  const groupMemberCounts = await Promise.all(
    allGroups.map(async (group) => {
      const [result] = await db.select({ count: count() }).from(groupMembers).where(eq4(groupMembers.groupId, group.id));
      return { groupId: group.id, memberCount: result.count };
    })
  );
  const memberCountMap = new Map(groupMemberCounts.map((g) => [g.groupId, g.memberCount]));
  const signupsLast30Days = await db.select({
    date: sql3`DATE(${users.createdAt})`.as("date"),
    count: count()
  }).from(users).where(gte(users.createdAt, thirtyDaysAgo)).groupBy(sql3`DATE(${users.createdAt})`).orderBy(sql3`DATE(${users.createdAt})`);
  const postsLast30Days = await db.select({
    date: sql3`DATE(${posts.createdAt})`.as("date"),
    count: count()
  }).from(posts).where(gte(posts.createdAt, thirtyDaysAgo)).groupBy(sql3`DATE(${posts.createdAt})`).orderBy(sql3`DATE(${posts.createdAt})`);
  return {
    generatedAt: now.toISOString(),
    users: {
      total: totalUsersResult.count,
      byRole: {
        user: userRoleResult.count,
        moderator: modRoleResult.count,
        admin: adminRoleResult.count
      },
      list: allUsers
    },
    groups: {
      total: allGroups.length,
      list: allGroups.map((group) => ({
        ...group,
        memberCount: memberCountMap.get(group.id) || 0
      }))
    },
    metrics: {
      totalUsers: totalUsersResult.count,
      activeUsers24h: activeUsers24hResult.count,
      activeUsers7d: activeUsers7dResult.count,
      totalSessions: totalSessionsResult.count,
      activeSessions: activeSessionsResult.count,
      totalPosts: totalPostsResult.count,
      totalGroups: allGroups.length
    },
    trends: {
      signupsLast30Days: signupsLast30Days.map((row) => ({
        date: row.date,
        count: row.count
      })),
      postsLast30Days: postsLast30Days.map((row) => ({
        date: row.date,
        count: row.count
      }))
    },
    aiService: {
      name: "Mien Kingdom AI",
      description: "AI-powered features for translation, image generation, and content analysis",
      services: await getServiceConfigsForSync(),
      configurable: true
    }
  };
}
async function verifySyncAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid authorization header" };
  }
  const token = authHeader.substring(7);
  const verification = await verifyJwt(token);
  if (!verification.valid) {
    return { valid: false, error: verification.error || "Invalid token" };
  }
  return { valid: true };
}

// server/middleware/credits.ts
init_db();
init_schema();
import { eq as eq5, sql as sql4 } from "drizzle-orm";
function requireCredits(cost = 1, feature = "unknown") {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "unauthorized" });
      }
      const [user] = await db.select({
        credits: users.credits,
        tierSlug: users.tierSlug,
        subscriptionActive: users.subscriptionActive
      }).from(users).where(eq5(users.id, userId));
      if (!user) {
        return res.status(401).json({ error: "user_not_found" });
      }
      if (user.credits < cost) {
        await db.insert(activityLogs).values({
          userId,
          action: "insufficient_credits",
          metadata: {
            required: cost,
            credits: user.credits,
            tierSlug: user.tierSlug,
            subscriptionActive: user.subscriptionActive,
            feature
          }
        });
        return res.status(402).json({
          error: "insufficient_credits",
          message: "You don't have enough credits for this action",
          required: cost,
          available: user.credits,
          redirect_url: "/subscription"
        });
      }
      const [updated] = await db.update(users).set({
        credits: sql4`${users.credits} - ${cost}`
      }).where(sql4`${users.id} = ${userId} AND ${users.credits} >= ${cost}`).returning({ credits: users.credits });
      if (!updated) {
        return res.status(402).json({
          error: "insufficient_credits",
          message: "You don't have enough credits for this action",
          required: cost,
          available: 0,
          redirect_url: "/subscription"
        });
      }
      const newCredits = updated.credits;
      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -cost,
        balanceAfter: newCredits,
        feature,
        description: `Used ${cost} credit${cost > 1 ? "s" : ""} for ${feature}`
      });
      await db.insert(activityLogs).values({
        userId,
        action: "credits_deducted",
        metadata: {
          cost,
          creditsRemaining: newCredits,
          feature
        }
      });
      req.creditCost = cost;
      req.creditFeature = feature;
      next();
    } catch (error) {
      console.error("[Credits] Error checking credits:", error);
      return res.status(500).json({ error: "internal_error" });
    }
  };
}

// server/routes.ts
init_tier_config();

// server/prompts/index.ts
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
var DEFAULT_PROMPTS = {
  // Translation prompts
  translate_to_english: {
    name: "Translate to English",
    description: "System prompt for translating Mien text to English",
    category: "translation",
    prompt: `You are a professional translator specializing in the Mien (Iu Mien) language.
Your task is to translate Mien text into clear, natural English.

Guidelines:
- Preserve the original meaning and cultural context
- Use natural English phrasing while maintaining accuracy
- If a word has no direct English equivalent, provide the closest meaning with a brief explanation
- Identify and note any cultural references that may need explanation
- If the text contains IuMiNR (Iu Mien New Romanization) script, recognize its unique orthography`
  },
  translate_to_mien: {
    name: "Translate to Mien",
    description: "System prompt for translating text to Mien using IuMiNR",
    category: "translation",
    prompt: `Use the Iu Mien language structure and vocabulary from the IuMiNR (Iu Mien New Romanization) script to translate into Mien.

You are a professional translator specializing in translating English and other languages into the Mien (Iu Mien) language using the IuMiNR romanization system.

Guidelines:
- Use proper IuMiNR orthography and tone markers
- Maintain cultural appropriateness in word choices
- Use traditional Mien expressions where applicable
- Preserve the original meaning while using natural Mien phrasing`
  },
  video_extraction: {
    name: "Video Content Extraction",
    description: "Prompt for extracting content from videos",
    category: "translation",
    prompt: `You are a video content analyzer. Watch this video and provide:
1. A brief summary of the video content
2. Full transcription of any spoken words
3. Description of any text visible on screen
4. Cultural context if Mien-related content is present
Output the transcription in clear English. If the video contains speech in another language, translate it to English.
If the video appears to be in Mien language, identify any IuMiNR text and provide both the original and translation.

IMPORTANT: If you cannot process the video, explain why and offer alternative assistance.`
  },
  document_extraction: {
    name: "Document Text Extraction",
    description: "Prompt for extracting text from documents",
    category: "translation",
    prompt: `You are a document text extractor. Extract all text content from this document.
If the document contains:
- Mien language text (IuMiNR script): Identify it and provide both original and English translation
- Cultural or traditional content: Note any cultural significance
- Mixed languages: Separate and label each language section

Format the output clearly with proper paragraph breaks.
IMPORTANT: If you cannot read the document, explain why and ask for clarification.`
  },
  audio_transcription: {
    name: "Audio Transcription",
    description: "Prompt for transcribing audio recordings",
    category: "translation",
    prompt: `You are an audio transcription specialist. Listen to this audio recording and transcribe all spoken words accurately.
If the audio contains:
- Mien language: Transcribe using IuMiNR romanization and provide English translation
- Multiple speakers: Identify and label different speakers if possible
- Background context: Note any relevant sounds or context

Format the transcription with timestamps if the audio is long.
IMPORTANT: If audio quality is poor, note areas of uncertainty.`
  },
  // Recipe prompts
  recipe_analysis: {
    name: "Recipe Analysis",
    description: "Prompt for analyzing food images and generating recipes",
    category: "recipe",
    prompt: `You are a professional chef and food expert with deep knowledge of Mien (Yao/Iu Mien) cuisine and culture. Analyze the provided food image and provide a complete recipe with the following information. Return ONLY valid JSON without any markdown formatting or code blocks.

{
  "dishName": "Name of the dish",
  "mienName": "Traditional Mien name if applicable, or null",
  "description": "Brief description of the dish and its cultural significance",
  "servings": "Number of servings",
  "prepTime": "Preparation time",
  "cookTime": "Cooking time",
  "difficulty": "Easy/Medium/Hard",
  "ingredients": [
    {
      "item": "Ingredient name",
      "amount": "Quantity",
      "notes": "Optional preparation notes"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "tips": ["Cooking tip 1", "Cooking tip 2"],
  "culturalNotes": "Any cultural significance or traditional context for Mien dishes",
  "nutritionEstimate": {
    "calories": "Estimated calories per serving",
    "protein": "Protein content",
    "carbs": "Carbohydrate content",
    "fat": "Fat content"
  }
}`
  },
  // Image generation prompts
  dress_me_mien_attire: {
    name: "Dress Me - Mien Attire",
    description: "Prompt for transforming images to show traditional Mien wedding attire",
    category: "image_generation",
    prompt: `Transform the subject in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. A second reference image is provided showing authentic Mien male and female traditional attire \u2014 use this reference image as your visual guide to accurately dress the characters in the uploaded image. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Keep the subject's pose and background the same.

Upscale the image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.`
  },
  photo_restore: {
    name: "Photo Restoration",
    description: "Prompt for restoring and colorizing old photos",
    category: "image_generation",
    prompt: `Restore this photo to fully restored vintage photograph, colorized, incredibly detailed, sharp focus, 8k, realistic skin texture, natural lighting, vibrant colors, and clean photo. Upscale this image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.`
  },
  movie_star_image: {
    name: "Movie Star - Image Generation",
    description: "Prompt for generating cinematic images with Mien attire",
    category: "image_generation",
    prompt: `Generate a 16:9 widescreen cinematic image. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. A second reference image is provided showing authentic Mien male and female traditional attire \u2014 use this reference image as your visual guide to accurately dress the characters in the uploaded image. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Keep the subject's pose but add a beautiful traditional setting background like misty mountains, rice terraces, or a decorated ceremonial space.`
  },
  movie_star_video: {
    name: "Movie Star - Video Generation",
    description: "Prompt for generating cinematic videos",
    category: "video_generation",
    prompt: `If it's only one female character, she walks forward with a tracking camera of the subject. Audio: Ethereal and haunting piano soundtrack.

If there are two characters, make them interact lovingly together like a couple walking through a misty traditional village with soft piano music.

The camera should have smooth cinematic movements with gentle zooms and pans. The lighting should be soft and dreamy, like golden hour or misty morning light.`
  },
  tiktok_dance_image: {
    name: "TikTok Dance - Image Generation",
    description: "Prompt for generating TikTok-style vertical images",
    category: "image_generation",
    prompt: `Generate a 9:16 vertical still. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. A second reference image is provided showing authentic Mien male and female traditional attire \u2014 use this reference image as your visual guide to accurately dress the characters in the uploaded image. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Add a modern, colorful backdrop suitable for a TikTok video.`
  },
  tiktok_dance_video: {
    name: "TikTok Dance - Video Generation",
    description: "Prompt for generating TikTok dance videos",
    category: "video_generation",
    prompt: `The camera pans zooms and pans with a kpop soundtrack as the subject(s) perform synchronized tiktok dance.`
  },
  // Help/Chat prompts
  help_assistant: {
    name: "Help Assistant",
    description: "System prompt for the app's help chat assistant",
    category: "assistant",
    prompt: `You are a helpful assistant for Mien Kingdom, a social app for the Mien ethnic community.
You help users with questions about the app's features, Mien culture, language, and traditions.
Be friendly, concise, and culturally sensitive. If you don't know something specific about Mien culture, say so rather than making things up.`
  },
  // Watermark text
  watermark_text: {
    name: "Watermark Text",
    description: "Text used for watermarking generated images",
    category: "settings",
    prompt: `Created by Mien Kingdom`
  }
};
async function getPrompt(key) {
  try {
    const result = await db.select().from(aiPrompts).where(eq6(aiPrompts.key, key)).limit(1);
    if (result.length > 0 && result[0].prompt) {
      return result[0].prompt;
    }
  } catch (error) {
    console.error(`Failed to fetch prompt ${key} from database:`, error);
  }
  return DEFAULT_PROMPTS[key]?.prompt || "";
}
async function getAllPrompts() {
  const prompts = [];
  for (const [key, data] of Object.entries(DEFAULT_PROMPTS)) {
    prompts.push({
      key,
      name: data.name,
      description: data.description,
      category: data.category,
      prompt: data.prompt,
      isCustom: false,
      serviceKey: null
    });
  }
  try {
    const dbPrompts = await db.select().from(aiPrompts);
    for (const dbPrompt of dbPrompts) {
      const index = prompts.findIndex((p) => p.key === dbPrompt.key);
      if (index >= 0) {
        prompts[index] = {
          key: dbPrompt.key,
          name: dbPrompt.name,
          description: dbPrompt.description || prompts[index].description,
          category: dbPrompt.category || prompts[index].category,
          prompt: dbPrompt.prompt,
          isCustom: true,
          serviceKey: dbPrompt.serviceKey
        };
      } else {
        prompts.push({
          key: dbPrompt.key,
          name: dbPrompt.name,
          description: dbPrompt.description || "",
          category: dbPrompt.category || "custom",
          prompt: dbPrompt.prompt,
          isCustom: true,
          serviceKey: dbPrompt.serviceKey
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch prompts from database:", error);
  }
  return prompts;
}
async function setPrompt(key, prompt, name, description, category) {
  const defaultData = DEFAULT_PROMPTS[key];
  await db.insert(aiPrompts).values({
    key,
    name: name || defaultData?.name || key,
    description: description || defaultData?.description || "",
    category: category || defaultData?.category || "custom",
    prompt
  }).onConflictDoUpdate({
    target: aiPrompts.key,
    set: {
      prompt,
      name: name || defaultData?.name,
      description: description || defaultData?.description,
      category: category || defaultData?.category,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function resetPrompt(key) {
  if (!DEFAULT_PROMPTS[key]) {
    return false;
  }
  await db.delete(aiPrompts).where(eq6(aiPrompts.key, key));
  return true;
}

// server/routes.ts
init_ai_providers();

// server/services/tickets.ts
init_db();
init_schema();
init_three_tears();
init_encryption();
import crypto2 from "crypto";
import jwt3 from "jsonwebtoken";
import { eq as eq7 } from "drizzle-orm";
var PRIVATE_KEY_SETTING = "app_jwt_private_key";
var PUBLIC_KEY_SETTING = "app_jwt_public_key";
var KEY_ID_SETTING = "app_jwt_key_id";
async function generateKeyPair() {
  return new Promise((resolve2, reject) => {
    crypto2.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem"
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem"
        }
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
          return;
        }
        const keyId = crypto2.randomBytes(8).toString("hex");
        resolve2({ privateKey, publicKey, keyId });
      }
    );
  });
}
async function storeKeyPair(keyPair) {
  const encryptedPrivateKey = encryptApiKey(keyPair.privateKey);
  const entries = [
    { key: PRIVATE_KEY_SETTING, value: JSON.stringify(encryptedPrivateKey) },
    { key: PUBLIC_KEY_SETTING, value: keyPair.publicKey },
    { key: KEY_ID_SETTING, value: keyPair.keyId }
  ];
  for (const entry of entries) {
    await db.insert(settings).values(entry).onConflictDoUpdate({
      target: settings.key,
      set: { value: entry.value, updatedAt: /* @__PURE__ */ new Date() }
    });
  }
}
async function getOrCreateKeyPair() {
  const results = await db.select().from(settings).where(eq7(settings.key, PRIVATE_KEY_SETTING));
  if (results.length > 0 && results[0].value) {
    const [pubResult] = await db.select().from(settings).where(eq7(settings.key, PUBLIC_KEY_SETTING));
    const [kidResult] = await db.select().from(settings).where(eq7(settings.key, KEY_ID_SETTING));
    if (pubResult?.value && kidResult?.value) {
      let privateKey;
      const storedValue = results[0].value;
      try {
        const parsed = JSON.parse(storedValue);
        privateKey = decryptApiKey(parsed);
      } catch {
        privateKey = storedValue;
      }
      return {
        privateKey,
        publicKey: pubResult.value,
        keyId: kidResult.value
      };
    }
  }
  console.log("[Tickets] Generating new JWT signing key pair...");
  const keyPair = await generateKeyPair();
  await storeKeyPair(keyPair);
  console.log("[Tickets] Key pair generated and stored with kid:", keyPair.keyId);
  return keyPair;
}
function pemToJwk(pem, keyId) {
  const key = crypto2.createPublicKey(pem);
  const jwk = key.export({ format: "jwk" });
  return {
    ...jwk,
    kid: keyId,
    use: "sig",
    alg: "RS256"
  };
}
async function getAppJwks() {
  try {
    const keyPair = await getOrCreateKeyPair();
    const jwk = pemToJwk(keyPair.publicKey, keyPair.keyId);
    return { keys: [jwk] };
  } catch (error) {
    console.error("[Tickets] Failed to get JWKS:", error);
    return { keys: [] };
  }
}
async function signJwtForUser(userId, email) {
  const keyPair = await getOrCreateKeyPair();
  const appId = await getAppId();
  const payload = {
    sub: userId,
    iss: appId || "mien-kingdom",
    aud: "three-tears",
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + 300
    // 5 minutes
  };
  if (email) {
    payload.email = email;
  }
  return jwt3.sign(payload, keyPair.privateKey, {
    algorithm: "RS256",
    keyid: keyPair.keyId
  });
}
async function createTicket(userId, email, subject, body, category = "general") {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }
  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);
  console.log("[Tickets] Creating ticket for user:", userId, "category:", category);
  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ subject, body, category })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Create ticket failed:", response.status, errorText);
    throw new Error(`Failed to create ticket: ${response.status}`);
  }
  const ticket = await response.json();
  console.log("[Tickets] Ticket created:", ticket.id);
  return ticket;
}
async function getUserTickets(userId, email) {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }
  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);
  console.log("[Tickets] Fetching tickets for user:", userId);
  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Fetch tickets failed:", response.status, errorText);
    throw new Error(`Failed to fetch tickets: ${response.status}`);
  }
  const tickets = await response.json();
  console.log("[Tickets] Fetched", tickets.length, "tickets");
  return tickets;
}
async function getTicketDetails(userId, ticketId, email) {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }
  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);
  console.log("[Tickets] Fetching ticket details:", ticketId);
  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets/${ticketId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Fetch ticket details failed:", response.status, errorText);
    throw new Error(`Failed to fetch ticket details: ${response.status}`);
  }
  return response.json();
}
async function replyToTicket(userId, ticketId, message, email) {
  const appId = await getAppId();
  if (!appId) {
    throw new Error("App not registered with Three Tears");
  }
  const mainAppBaseUrl = await getMainAppBaseUrl();
  const token = await signJwtForUser(userId, email);
  console.log("[Tickets] Replying to ticket:", ticketId);
  const response = await fetch(`${mainAppBaseUrl}/api/apps/${appId}/tickets/${ticketId}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tickets] Reply failed:", response.status, errorText);
    throw new Error(`Failed to reply to ticket: ${response.status}`);
  }
  const reply = await response.json();
  console.log("[Tickets] Reply sent to ticket:", ticketId);
  return reply;
}

// server/services/video.ts
init_db();
init_schema();
init_encryption();
import { eq as eq8 } from "drizzle-orm";
var VIDEO_MAX_SIZE_BYTES = 500 * 1024 * 1024;
var VIDEO_ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska"
];
async function createVideoUpload(userId, filename, title) {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  console.log("[Video Debug] === CREATE VIDEO UPLOAD START ===");
  console.log("[Video Debug] userId:", userId);
  console.log("[Video Debug] filename:", filename);
  console.log("[Video Debug] BUNNY_LIBRARY_ID:", libraryId || "NOT SET");
  console.log("[Video Debug] BUNNY_API_KEY:", maskApiKey(apiKey || null));
  console.log("[Video Debug] BUNNY_CDN_HOSTNAME:", process.env.BUNNY_CDN_HOSTNAME || "NOT SET");
  if (!libraryId || !apiKey) {
    console.error("[Video Debug] MISSING CONFIG - libraryId:", !!libraryId, "apiKey:", !!apiKey);
    throw new Error("Bunny.net configuration missing");
  }
  const bunnyUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
  console.log("[Video Debug] Calling Bunny API:", bunnyUrl);
  const bunnyResponse = await fetch(
    bunnyUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessKey": apiKey
      },
      body: JSON.stringify({
        title: title || filename
      })
    }
  );
  console.log("[Video Debug] Bunny API response status:", bunnyResponse.status);
  console.log("[Video Debug] Bunny API response ok:", bunnyResponse.ok);
  if (!bunnyResponse.ok) {
    const error = await bunnyResponse.text();
    console.error("[Video Debug] Bunny.net video creation failed:");
    console.error("[Video Debug] Status:", bunnyResponse.status);
    console.error("[Video Debug] Response:", error);
    throw new Error(`Bunny.net video creation failed: ${error}`);
  }
  const bunnyVideo = await bunnyResponse.json();
  console.log("[Video Debug] Bunny API success response:", JSON.stringify(bunnyVideo, null, 2));
  const bunnyVideoId = bunnyVideo.guid;
  console.log("[Video Debug] Got bunnyVideoId:", bunnyVideoId);
  const [video] = await db.insert(uploadedVideos).values({
    userId,
    bunnyVideoId,
    bunnyLibraryId: parseInt(libraryId),
    title: title || filename,
    originalFilename: filename,
    status: "uploading"
  }).returning();
  const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyVideoId}`;
  console.log(`[Video] Created video record: ${video.id} (Bunny: ${bunnyVideoId})`);
  return {
    videoId: video.id,
    bunnyVideoId,
    uploadUrl
  };
}
async function proxyVideoUpload(videoId, userId, videoBuffer) {
  const video = await getVideoById(videoId, userId);
  if (!video) {
    return { success: false, error: "Video not found or access denied" };
  }
  const apiKey = process.env.BUNNY_API_KEY;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!apiKey || !libraryId) {
    return { success: false, error: "Bunny.net configuration missing" };
  }
  const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${video.bunnyVideoId}`;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "AccessKey": apiKey,
      "Content-Type": "application/octet-stream"
    },
    body: videoBuffer
  });
  if (!response.ok) {
    const error = await response.text();
    console.error(`[Video] Proxy upload failed: ${response.status} ${error}`);
    return { success: false, error: "Upload to storage failed" };
  }
  console.log(`[Video] Proxy upload successful for video ${videoId}`);
  return { success: true };
}
async function getVideoById(videoId, userId) {
  const [video] = await db.select().from(uploadedVideos).where(eq8(uploadedVideos.id, videoId)).limit(1);
  if (!video) {
    return null;
  }
  if (userId && video.userId !== userId) {
    return null;
  }
  return video;
}
async function fetchBunnyVideoDetails(libraryId, videoId) {
  const apiKey = process.env.BUNNY_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        headers: {
          "AccessKey": apiKey
        }
      }
    );
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("[Video] Failed to fetch Bunny video details:", error);
    return null;
  }
}
async function updateVideoFromWebhook(bunnyVideoId, bunnyLibraryId, status) {
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
  const statusMap = {
    0: { status: "queued", isTerminal: false },
    1: { status: "processing", isTerminal: false },
    2: { status: "encoding", isTerminal: false },
    3: { status: "ready", isTerminal: true },
    // Finished
    4: { status: "encoding", isTerminal: false },
    // Resolution finished (partial)
    5: { status: "failed", isTerminal: true },
    6: { status: "uploading", isTerminal: false },
    // PresignedUploadStarted
    7: { status: "queued", isTerminal: false },
    // PresignedUploadFinished
    8: { status: "failed", isTerminal: true }
    // PresignedUploadFailed
  };
  const mapped = statusMap[status];
  if (!mapped) {
    console.warn(`[Video Webhook] Unknown status code: ${status}`);
    return;
  }
  const updateData = {
    status: mapped.status
  };
  if (mapped.status === "ready" && cdnHostname) {
    updateData.readyAt = /* @__PURE__ */ new Date();
    const videoDetails = await fetchBunnyVideoDetails(bunnyLibraryId, bunnyVideoId);
    if (videoDetails) {
      updateData.playbackUrl = `https://${cdnHostname}/${bunnyVideoId}/playlist.m3u8`;
      updateData.thumbnailUrl = `https://${cdnHostname}/${bunnyVideoId}/thumbnail.jpg`;
      updateData.previewUrl = `https://${cdnHostname}/${bunnyVideoId}/preview.webp`;
      updateData.duration = videoDetails.length;
      updateData.width = videoDetails.width;
      updateData.height = videoDetails.height;
    }
  } else if (mapped.status === "encoding") {
    updateData.encodingStartedAt = /* @__PURE__ */ new Date();
  } else if (mapped.status === "failed") {
    updateData.failureReason = `Encoding failed with status ${status}`;
  }
  await db.update(uploadedVideos).set(updateData).where(eq8(uploadedVideos.bunnyVideoId, bunnyVideoId));
  console.log(`[Video Webhook] Updated video ${bunnyVideoId} to status: ${mapped.status}`);
}
async function deleteVideo(videoId, userId) {
  const video = await getVideoById(videoId, userId);
  if (!video) {
    return false;
  }
  const apiKey = process.env.BUNNY_API_KEY;
  if (apiKey) {
    try {
      await fetch(
        `https://video.bunnycdn.com/library/${video.bunnyLibraryId}/videos/${video.bunnyVideoId}`,
        {
          method: "DELETE",
          headers: {
            "AccessKey": apiKey
          }
        }
      );
      console.log(`[Video] Deleted from Bunny: ${video.bunnyVideoId}`);
    } catch (error) {
      console.error("[Video] Failed to delete from Bunny:", error);
    }
  }
  await db.update(posts).set({ videoId: null }).where(eq8(posts.videoId, videoId));
  await db.delete(uploadedVideos).where(eq8(uploadedVideos.id, videoId));
  console.log(`[Video] Deleted video record: ${videoId}`);
  return true;
}
async function getVideoStatus(videoId) {
  const [video] = await db.select().from(uploadedVideos).where(eq8(uploadedVideos.id, videoId)).limit(1);
  if (!video) {
    return null;
  }
  const terminalStates = ["ready", "failed"];
  if (!terminalStates.includes(video.status)) {
    console.log(`[Video] Polling Bunny.net for video ${videoId} (current status: ${video.status})`);
    const bunnyDetails = await fetchBunnyVideoDetails(video.bunnyLibraryId, video.bunnyVideoId);
    if (bunnyDetails) {
      const bunnyStatus = bunnyDetails.status;
      console.log(`[Video] Bunny.net status for ${videoId}: ${bunnyStatus}`);
      if (bunnyStatus === 3 || bunnyStatus === 4) {
        const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
        const updateData = {
          status: "ready",
          readyAt: /* @__PURE__ */ new Date()
        };
        if (cdnHostname) {
          updateData.playbackUrl = `https://${cdnHostname}/${video.bunnyVideoId}/playlist.m3u8`;
          updateData.thumbnailUrl = `https://${cdnHostname}/${video.bunnyVideoId}/thumbnail.jpg`;
          updateData.previewUrl = `https://${cdnHostname}/${video.bunnyVideoId}/preview.webp`;
        }
        updateData.duration = bunnyDetails.length;
        updateData.width = bunnyDetails.width;
        updateData.height = bunnyDetails.height;
        await db.update(uploadedVideos).set(updateData).where(eq8(uploadedVideos.id, videoId));
        console.log(`[Video] Updated video ${videoId} to ready (from polling)`);
        return {
          status: "ready",
          encodingProgress: 100,
          playbackUrl: updateData.playbackUrl,
          thumbnailUrl: updateData.thumbnailUrl,
          failureReason: null
        };
      } else if (bunnyStatus === 5) {
        await db.update(uploadedVideos).set({ status: "failed", failureReason: "Encoding failed" }).where(eq8(uploadedVideos.id, videoId));
        return {
          status: "failed",
          encodingProgress: 0,
          playbackUrl: null,
          thumbnailUrl: null,
          failureReason: "Encoding failed"
        };
      } else if (bunnyStatus === 1 || bunnyStatus === 2) {
        const newStatus = bunnyStatus === 2 ? "encoding" : "processing";
        if (video.status !== newStatus) {
          await db.update(uploadedVideos).set({ status: newStatus, encodingProgress: bunnyDetails.encodeProgress || 0 }).where(eq8(uploadedVideos.id, videoId));
        }
        return {
          status: newStatus,
          encodingProgress: bunnyDetails.encodeProgress || 0,
          playbackUrl: null,
          thumbnailUrl: null,
          failureReason: null
        };
      }
    }
  }
  return {
    status: video.status,
    encodingProgress: video.encodingProgress,
    playbackUrl: video.playbackUrl,
    thumbnailUrl: video.thumbnailUrl,
    failureReason: video.failureReason
  };
}

// server/websocket/index.ts
init_db();
init_schema();
import { WebSocketServer, WebSocket } from "ws";
import { eq as eq9, and as and2, gt as gt3 } from "drizzle-orm";
var clients = /* @__PURE__ */ new Map();
async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const [session] = await db.select().from(sessions).where(and2(eq9(sessions.token, token), gt3(sessions.expiresAt, /* @__PURE__ */ new Date())));
    if (!session) return null;
    const [user] = await db.select({ id: users.id }).from(users).where(eq9(users.id, session.userId));
    return user || null;
  } catch {
    return null;
  }
}
function removeClient(ws) {
  if (!ws.userId) return;
  const userClients = clients.get(ws.userId);
  if (userClients) {
    userClients.delete(ws);
    if (userClients.size === 0) {
      clients.delete(ws.userId);
    }
  }
}
function handleMessage(ws, data) {
  try {
    const message = JSON.parse(data.toString());
    switch (message.type) {
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      case "typing":
        if (message.conversationId && message.recipientId) {
          sendToUser(message.recipientId, {
            type: "typing",
            conversationId: message.conversationId,
            userId: ws.userId,
            isTyping: message.isTyping
          });
        }
        break;
      case "read_receipt":
        if (message.conversationId && message.senderId) {
          sendToUser(message.senderId, {
            type: "read_receipt",
            conversationId: message.conversationId,
            messageIds: message.messageIds,
            readBy: ws.userId
          });
        }
        break;
      default:
        console.log("Unknown WebSocket message type:", message.type);
    }
  } catch (error) {
    console.error("Failed to parse WebSocket message:", error);
  }
}
function sendToUser(userId, payload) {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = JSON.stringify(payload);
    userClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}
function broadcastNewMessage(conversationId, participantIds, message) {
  participantIds.forEach((userId) => {
    sendToUser(userId, {
      type: "new_message",
      conversationId,
      message
    });
  });
}
function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws/messages" });
  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const user = await verifySessionToken(token);
    if (!user) {
      ws.close(4001, "Unauthorized");
      return;
    }
    ws.userId = user.id;
    ws.isAlive = true;
    if (!clients.has(user.id)) {
      clients.set(user.id, /* @__PURE__ */ new Set());
    }
    clients.get(user.id).add(ws);
    console.log(`WebSocket connected: user ${user.id}`);
    ws.send(JSON.stringify({ type: "connected", userId: user.id }));
    ws.on("message", (data) => handleMessage(ws, data));
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("close", () => {
      console.log(`WebSocket disconnected: user ${ws.userId}`);
      removeClient(ws);
    });
    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${ws.userId}:`, error);
      removeClient(ws);
    });
  });
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws;
      if (!authWs.isAlive) {
        removeClient(authWs);
        return authWs.terminate();
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 3e4);
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });
  console.log("WebSocket server initialized on /ws/messages");
  return wss;
}

// server/services/xp.ts
init_db();

// shared/xp-config.ts
var XP_REWARDS = {
  post_created: 10,
  comment_created: 1,
  ai_translation: 10,
  ai_image_dress_me: 20,
  ai_image_restore_photo: 20,
  ai_image_story_cover: 20,
  ai_video_movie_star: 20,
  ai_video_tiktok_dance: 20,
  story_completed: 20,
  game_wheel_of_fortune: 20,
  game_vocab_match: 20,
  game_mien_wordle: 20,
  game_leaderboard_top3: 40
};
var DAILY_XP_CAP = 5;
function calculateLevelFromXp(totalXp) {
  if (totalXp < 20) return 1;
  const level = Math.floor(Math.log2(totalXp / 20)) + 2;
  return level;
}

// server/services/xp.ts
async function awardXp(userId, activityType, metadata) {
  try {
    const xpAmount = XP_REWARDS[activityType];
    if (!xpAmount) {
      return { awarded: false, reason: "unknown_activity" };
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const capResult = await client.query(
        `INSERT INTO daily_xp_caps (id, user_id, activity_type, date, count, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 1, NOW(), NOW())
         ON CONFLICT (user_id, activity_type, date)
         DO UPDATE SET count = daily_xp_caps.count + 1, updated_at = NOW()
         RETURNING count`,
        [userId, activityType, today]
      );
      const currentCount = capResult.rows[0].count;
      if (currentCount > DAILY_XP_CAP) {
        await client.query(
          `UPDATE daily_xp_caps SET count = count - 1, updated_at = NOW()
           WHERE user_id = $1 AND activity_type = $2 AND date = $3`,
          [userId, activityType, today]
        );
        await client.query("COMMIT");
        return { awarded: false, reason: "daily_cap_reached" };
      }
      const userResult = await client.query(
        `UPDATE users SET total_xp = total_xp + $1 WHERE id = $2 RETURNING total_xp, level`,
        [xpAmount, userId]
      );
      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { awarded: false, reason: "user_not_found" };
      }
      const newTotalXp = userResult.rows[0].total_xp;
      const oldLevel = userResult.rows[0].level;
      const newLevel = calculateLevelFromXp(newTotalXp);
      const leveledUp = newLevel > oldLevel;
      if (leveledUp) {
        await client.query(
          `UPDATE users SET level = $1 WHERE id = $2`,
          [newLevel, userId]
        );
      }
      await client.query(
        `INSERT INTO xp_transactions (id, user_id, activity_type, xp_amount, total_xp_after, level_after, leveled_up, metadata, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
        [userId, activityType, xpAmount, newTotalXp, newLevel, leveledUp, metadata ? JSON.stringify(metadata) : null]
      );
      await client.query("COMMIT");
      return {
        awarded: true,
        xpAwarded: xpAmount,
        totalXp: newTotalXp,
        level: newLevel,
        leveledUp
      };
    } catch (innerError) {
      await client.query("ROLLBACK").catch(() => {
      });
      throw innerError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[XP] Failed to award XP:", error);
    return { awarded: false, reason: "internal_error" };
  }
}

// server/routes.ts
import { PDFDocument } from "pdf-lib";

// server/services/messaging.ts
init_db();
init_schema();
import { eq as eq10, and as and3, or as or2, desc as desc2, lt, sql as sql5, inArray } from "drizzle-orm";
async function areMutualFollowers(userId1, userId2) {
  const [follow1to2] = await db.select().from(follows).where(and3(eq10(follows.followerId, userId1), eq10(follows.followeeId, userId2)));
  const [follow2to1] = await db.select().from(follows).where(and3(eq10(follows.followerId, userId2), eq10(follows.followeeId, userId1)));
  return !!(follow1to2 && follow2to1);
}
async function getOrCreateConversation(userId1, userId2) {
  const [existing] = await db.select().from(directConversations).where(
    or2(
      and3(
        eq10(directConversations.participant1Id, userId1),
        eq10(directConversations.participant2Id, userId2)
      ),
      and3(
        eq10(directConversations.participant1Id, userId2),
        eq10(directConversations.participant2Id, userId1)
      )
    )
  );
  if (existing) {
    return existing;
  }
  const [conversation] = await db.insert(directConversations).values({
    participant1Id: userId1,
    participant2Id: userId2
  }).returning();
  return conversation;
}
async function getUserConversations(userId) {
  const conversations = await db.select().from(directConversations).where(
    or2(
      eq10(directConversations.participant1Id, userId),
      eq10(directConversations.participant2Id, userId)
    )
  ).orderBy(desc2(directConversations.lastMessageAt));
  const enrichedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const otherParticipantId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const [otherUser] = await db.select({
        id: users.id,
        displayName: users.displayName,
        avatar: users.avatar
      }).from(users).where(eq10(users.id, otherParticipantId));
      const [lastMessage] = await db.select().from(encryptedMessages).where(eq10(encryptedMessages.conversationId, conv.id)).orderBy(desc2(encryptedMessages.createdAt)).limit(1);
      const [unreadCount] = await db.select({ count: sql5`count(*)` }).from(encryptedMessages).where(
        and3(
          eq10(encryptedMessages.conversationId, conv.id),
          eq10(encryptedMessages.isRead, false),
          sql5`${encryptedMessages.senderId} != ${userId}`
        )
      );
      return {
        ...conv,
        participant: otherUser,
        lastMessage: lastMessage || null,
        unreadCount: Number(unreadCount?.count || 0)
      };
    })
  );
  return enrichedConversations;
}
async function getConversationMessages(conversationId, limit = 50, before) {
  let query = db.select().from(encryptedMessages).where(eq10(encryptedMessages.conversationId, conversationId));
  if (before) {
    const [beforeMessage] = await db.select().from(encryptedMessages).where(eq10(encryptedMessages.id, before));
    if (beforeMessage) {
      query = db.select().from(encryptedMessages).where(
        and3(
          eq10(encryptedMessages.conversationId, conversationId),
          lt(encryptedMessages.createdAt, beforeMessage.createdAt)
        )
      );
    }
  }
  const messages = await query.orderBy(desc2(encryptedMessages.createdAt)).limit(limit);
  return messages.reverse();
}
async function sendEncryptedMessage(conversationId, senderId, encryptedContent, encryptedContentIv, messageType = "text") {
  const [message] = await db.insert(encryptedMessages).values({
    conversationId,
    senderId,
    encryptedContent,
    encryptedContentIv,
    messageType
  }).returning();
  await db.update(directConversations).set({ lastMessageAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq10(directConversations.id, conversationId));
  return message;
}
async function markMessagesAsRead(conversationId, userId, messageIds) {
  const now = /* @__PURE__ */ new Date();
  if (messageIds && messageIds.length > 0) {
    await db.update(encryptedMessages).set({ isRead: true, readAt: now }).where(
      and3(
        eq10(encryptedMessages.conversationId, conversationId),
        sql5`${encryptedMessages.senderId} != ${userId}`,
        inArray(encryptedMessages.id, messageIds)
      )
    );
  } else {
    await db.update(encryptedMessages).set({ isRead: true, readAt: now }).where(
      and3(
        eq10(encryptedMessages.conversationId, conversationId),
        sql5`${encryptedMessages.senderId} != ${userId}`,
        eq10(encryptedMessages.isRead, false)
      )
    );
  }
}
async function getUnreadMessageCount(userId) {
  const conversations = await db.select({ id: directConversations.id }).from(directConversations).where(
    or2(
      eq10(directConversations.participant1Id, userId),
      eq10(directConversations.participant2Id, userId)
    )
  );
  if (conversations.length === 0) return 0;
  const conversationIds = conversations.map((c) => c.id);
  const [result] = await db.select({ count: sql5`count(*)` }).from(encryptedMessages).where(
    and3(
      inArray(encryptedMessages.conversationId, conversationIds),
      sql5`${encryptedMessages.senderId} != ${userId}`,
      eq10(encryptedMessages.isRead, false)
    )
  );
  return Number(result?.count || 0);
}
async function saveUserPublicKeys(userId, publicKey, identityPublicKey, signedPreKey, preKeySignature) {
  const [existing] = await db.select().from(userPublicKeys).where(eq10(userPublicKeys.userId, userId));
  if (existing) {
    const [updated] = await db.update(userPublicKeys).set({
      publicKey,
      identityPublicKey,
      signedPreKey,
      preKeySignature,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq10(userPublicKeys.userId, userId)).returning();
    return updated;
  }
  const [newKeys] = await db.insert(userPublicKeys).values({
    userId,
    publicKey,
    identityPublicKey,
    signedPreKey,
    preKeySignature
  }).returning();
  return newKeys;
}
async function getUserPublicKeys(userId) {
  const [keys] = await db.select().from(userPublicKeys).where(eq10(userPublicKeys.userId, userId));
  return keys || null;
}
async function saveConversationKey(conversationId, userId, encryptedSharedKey, encryptedSharedKeyIv) {
  const [existing] = await db.select().from(conversationKeys).where(
    and3(
      eq10(conversationKeys.conversationId, conversationId),
      eq10(conversationKeys.userId, userId)
    )
  );
  if (existing) {
    const [updated] = await db.update(conversationKeys).set({
      encryptedSharedKey,
      encryptedSharedKeyIv
    }).where(eq10(conversationKeys.id, existing.id)).returning();
    return updated;
  }
  const [newKey] = await db.insert(conversationKeys).values({
    conversationId,
    userId,
    encryptedSharedKey,
    encryptedSharedKeyIv
  }).returning();
  return newKey;
}
async function getConversationKey(conversationId, userId) {
  const [key] = await db.select().from(conversationKeys).where(
    and3(
      eq10(conversationKeys.conversationId, conversationId),
      eq10(conversationKeys.userId, userId)
    )
  );
  return key || null;
}
async function isConversationParticipant(conversationId, userId) {
  const [conversation] = await db.select().from(directConversations).where(eq10(directConversations.id, conversationId));
  if (!conversation) return false;
  return conversation.participant1Id === userId || conversation.participant2Id === userId;
}
async function getConversation(conversationId) {
  const [conversation] = await db.select().from(directConversations).where(eq10(directConversations.id, conversationId));
  return conversation || null;
}
async function getFriendsList(userId) {
  const following = await db.select({ followeeId: follows.followeeId }).from(follows).where(eq10(follows.followerId, userId));
  if (following.length === 0) return [];
  const followingIds = following.map((f) => f.followeeId);
  const mutualFollows = await db.select({ followerId: follows.followerId }).from(follows).where(
    and3(
      eq10(follows.followeeId, userId),
      inArray(follows.followerId, followingIds)
    )
  );
  if (mutualFollows.length === 0) return [];
  const friendIds = mutualFollows.map((f) => f.followerId);
  const friends = await db.select({
    id: users.id,
    displayName: users.displayName,
    avatar: users.avatar
  }).from(users).where(inArray(users.id, friendIds));
  return friends;
}

// server/services/r2.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import crypto3 from "crypto";
var R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
var R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
var R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
var R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
var R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
var r2Client = null;
function getR2Client() {
  if (!r2Client) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error("R2 configuration missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.");
    }
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    });
  }
  return r2Client;
}
function isR2Configured() {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}
function getR2PublicUrl(key) {
  if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL not configured");
  }
  const baseUrl = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
  return `${baseUrl}/${key}`;
}
async function uploadToR2(buffer, options = {}) {
  const client = getR2Client();
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }
  const folder = options.folder || "uploads";
  const extension = getExtensionFromContentType(options.contentType || "image/webp");
  const filename = options.filename || `${Date.now()}-${crypto3.randomBytes(8).toString("hex")}${extension}`;
  const key = `${folder}/${filename}`;
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || "image/webp"
    })
  );
  return {
    key,
    url: getR2PublicUrl(key),
    size: buffer.length
  };
}
async function uploadBase64ToR2(base64Data, options = {}) {
  let data = base64Data;
  let detectedContentType = options.contentType;
  if (base64Data.includes("base64,")) {
    const parts = base64Data.split("base64,");
    data = parts[1];
    if (!detectedContentType && parts[0]) {
      const match = parts[0].match(/data:([^;]+)/);
      if (match) {
        detectedContentType = match[1];
      }
    }
  }
  const buffer = Buffer.from(data, "base64");
  return uploadToR2(buffer, {
    ...options,
    contentType: detectedContentType || options.contentType
  });
}
function getExtensionFromContentType(contentType) {
  const map = {
    "image/webp": ".webp",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "video/webm": ".webm"
  };
  return map[contentType] || ".bin";
}
async function getObjectFromR2(key) {
  const client = getR2Client();
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
      })
    );
    if (!response.Body) return null;
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    return {
      body,
      contentType: response.ContentType || "application/octet-stream"
    };
  } catch {
    return null;
  }
}

// server/services/gemini-keys.ts
var keyUsageMap = /* @__PURE__ */ new Map();
var sessionKeyMap = /* @__PURE__ */ new Map();
function getGeminiApiKeys() {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keys.push(key.trim());
    }
  }
  if (keys.length === 0) {
    const singleKey = process.env.GEMINI_AVATAR_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (singleKey && singleKey.trim()) {
      keys.push(singleKey.trim());
    }
  }
  return keys;
}
function initializeKeys() {
  const keys = getGeminiApiKeys();
  for (const key of keys) {
    if (!keyUsageMap.has(key)) {
      keyUsageMap.set(key, {
        key,
        usageCount: 0,
        lastUsed: /* @__PURE__ */ new Date(0),
        sessionId: null
      });
    }
  }
}
function getGeminiKeyForSession(sessionId) {
  initializeKeys();
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    console.error("[Gemini Keys] No API keys configured");
    return 0;
  }
  if (sessionKeyMap.has(sessionId)) {
    const assignedKey = sessionKeyMap.get(sessionId);
    const index = keys.indexOf(assignedKey);
    if (index !== -1) {
      return index;
    }
    sessionKeyMap.delete(sessionId);
  }
  let selectedKey = null;
  let minUsage = Infinity;
  for (const key of keys) {
    const usage2 = keyUsageMap.get(key);
    if (usage2 && usage2.usageCount < minUsage) {
      minUsage = usage2.usageCount;
      selectedKey = key;
    }
  }
  if (!selectedKey) {
    selectedKey = keys[0];
  }
  const usage = keyUsageMap.get(selectedKey);
  if (usage) {
    usage.usageCount++;
    usage.lastUsed = /* @__PURE__ */ new Date();
    usage.sessionId = sessionId;
    sessionKeyMap.set(sessionId, selectedKey);
  }
  const keyIndex = keys.indexOf(selectedKey);
  console.log(`[Gemini Keys] Assigned key index ${keyIndex} to session ${sessionId}`);
  return keyIndex;
}
function getNextGeminiApiKey(sessionId) {
  initializeKeys();
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    console.error("[Gemini Keys] No API keys configured");
    return null;
  }
  if (sessionId && sessionKeyMap.has(sessionId)) {
    const assignedKey = sessionKeyMap.get(sessionId);
    if (keys.includes(assignedKey)) {
      return assignedKey;
    }
    sessionKeyMap.delete(sessionId);
  }
  let selectedKey = null;
  let minUsage = Infinity;
  for (const key of keys) {
    const usage2 = keyUsageMap.get(key);
    if (usage2 && usage2.usageCount < minUsage) {
      minUsage = usage2.usageCount;
      selectedKey = key;
    }
  }
  if (!selectedKey) {
    selectedKey = keys[0];
  }
  const usage = keyUsageMap.get(selectedKey);
  if (usage) {
    usage.usageCount++;
    usage.lastUsed = /* @__PURE__ */ new Date();
    if (sessionId) {
      usage.sessionId = sessionId;
      sessionKeyMap.set(sessionId, selectedKey);
    }
  }
  console.log(`[Gemini Keys] Assigned key ${maskApiKey2(selectedKey)} to session ${sessionId || "unknown"}`);
  return selectedKey;
}
function releaseGeminiApiKey(sessionId) {
  if (sessionKeyMap.has(sessionId)) {
    const key = sessionKeyMap.get(sessionId);
    const usage = keyUsageMap.get(key);
    if (usage && usage.sessionId === sessionId) {
      usage.sessionId = null;
    }
    sessionKeyMap.delete(sessionId);
    console.log(`[Gemini Keys] Released key for session ${sessionId}`);
  }
}
function getKeyStatus() {
  initializeKeys();
  const keys = getGeminiApiKeys();
  const activeCount = Array.from(keyUsageMap.values()).filter((u) => u.sessionId !== null).length;
  return {
    total: 5,
    // Maximum possible keys
    configured: keys.length,
    active: activeCount
  };
}
function maskApiKey2(key) {
  if (key.length <= 8) {
    return "****";
  }
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}
function isGeminiConfigured() {
  return getGeminiApiKeys().length > 0;
}

// server/services/avatar-agent.ts
import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";
var avatarAgentProcess = null;
var avatarAgentIntentionalStop = false;
var avatarAgentRestartCount = 0;
var avatarAgentLastCrashTime = 0;
var avatarAgentStartTime = 0;
var avatarAgentDisabled = false;
var avatarAgentDisabledReason = null;
var AVATAR_AGENT_MAX_RESTARTS = 3;
var AVATAR_AGENT_RESTART_WINDOW_MS = 6e5;
function log2(message) {
  console.log(message);
}
function startAvatarAgent() {
  if (avatarAgentDisabled) {
    log2(`[Avatar Agent] Agent is disabled: ${avatarAgentDisabledReason}`);
    return;
  }
  const agentPath = path.join(process.cwd(), "avatar-agent");
  if (!fs.existsSync(path.join(agentPath, "agent.py"))) {
    log2("[Avatar Agent] agent.py not found, skipping avatar agent startup");
    return;
  }
  log2("[Avatar Agent] Starting Python avatar agent...");
  const agentMode = process.env.NODE_ENV === "production" ? "start" : "dev";
  log2(`[Avatar Agent] Spawning agent in mode: ${agentMode}`);
  const agentScriptPath = path.join(agentPath, "agent.py");
  const agentEnv = {
    PYTHONUNBUFFERED: "1",
    PATH: process.env.PATH,
    PYTHONPATH: agentPath,
    HOME: process.env.HOME,
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5e3}`,
    // LiveKit (required by agent)
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    // Gemini keys (agent supports GEMINI_API_KEY_1-5 and GOOGLE_AI_API_KEY)
    GEMINI_API_KEY_1: process.env.GEMINI_API_KEY_1,
    GEMINI_API_KEY_2: process.env.GEMINI_API_KEY_2,
    GEMINI_API_KEY_3: process.env.GEMINI_API_KEY_3,
    GEMINI_API_KEY_4: process.env.GEMINI_API_KEY_4,
    GEMINI_API_KEY_5: process.env.GEMINI_API_KEY_5,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    // Simli avatar
    SIMLI_API_KEY: process.env.SIMLI_API_KEY,
    SIMLI_FACE_ID: process.env.SIMLI_FACE_ID
  };
  avatarAgentStartTime = Date.now();
  avatarAgentProcess = spawn("python3", [agentScriptPath, agentMode], {
    cwd: agentPath,
    stdio: ["ignore", "pipe", "pipe"],
    env: agentEnv
  });
  avatarAgentProcess.stdout?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        log2(`[Avatar Agent] ${line}`);
      }
    });
  });
  avatarAgentProcess.stderr?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`[Avatar Agent] ${line}`);
      }
    });
  });
  avatarAgentProcess.on("error", (error) => {
    console.error("[Avatar Agent] Failed to start:", error.message);
  });
  avatarAgentProcess.on("exit", (code, signal) => {
    const uptime = avatarAgentStartTime > 0 ? Date.now() - avatarAgentStartTime : 0;
    if (code !== null) {
      log2(`[Avatar Agent] Process exited with code ${code} (uptime: ${uptime}ms)`);
    } else if (signal) {
      log2(`[Avatar Agent] Process killed with signal ${signal} (uptime: ${uptime}ms)`);
    }
    avatarAgentProcess = null;
    if (!avatarAgentIntentionalStop) {
      const now = Date.now();
      const isRapidCrash = uptime < 6e4;
      if (now - avatarAgentLastCrashTime > AVATAR_AGENT_RESTART_WINDOW_MS) {
        avatarAgentRestartCount = 0;
      }
      if (isRapidCrash) {
        if (avatarAgentRestartCount < AVATAR_AGENT_MAX_RESTARTS) {
          avatarAgentRestartCount++;
          avatarAgentLastCrashTime = now;
          const delay = Math.min(1e3 * Math.pow(2, avatarAgentRestartCount - 1), 3e4);
          log2(`[Avatar Agent] Crashed after ${uptime}ms, restarting in ${delay}ms (attempt ${avatarAgentRestartCount}/${AVATAR_AGENT_MAX_RESTARTS})...`);
          setTimeout(() => {
            if (!avatarAgentIntentionalStop && !avatarAgentDisabled) {
              startAvatarAgent();
            }
          }, delay);
        } else {
          avatarAgentDisabled = true;
          avatarAgentDisabledReason = `Crashed ${AVATAR_AGENT_MAX_RESTARTS} times within ${AVATAR_AGENT_RESTART_WINDOW_MS / 6e4} minutes`;
          console.error(`[Avatar Agent] DISABLED: ${avatarAgentDisabledReason}. Manual restart required via admin panel.`);
        }
      } else {
        log2(`[Avatar Agent] Process ended normally after ${Math.round(uptime / 1e3)}s, restarting...`);
        avatarAgentRestartCount = 0;
        setTimeout(() => {
          if (!avatarAgentIntentionalStop && !avatarAgentDisabled) {
            startAvatarAgent();
          }
        }, 2e3);
      }
    }
  });
}
function stopAvatarAgent() {
  if (avatarAgentProcess) {
    avatarAgentIntentionalStop = true;
    avatarAgentProcess.kill();
    log2("[Avatar Agent] Stopping agent...");
    return true;
  }
  return false;
}
function restartAvatarAgent() {
  avatarAgentIntentionalStop = true;
  if (avatarAgentProcess) {
    try {
      avatarAgentProcess.kill();
    } catch (error) {
    }
    avatarAgentProcess = null;
  }
  let killedCount = 0;
  try {
    const result = execSync("pkill -f 'python.*agent\\.py' 2>/dev/null; echo $?", {
      encoding: "utf-8",
      timeout: 5e3
    });
    if (result.trim() === "0") {
      killedCount = 1;
    }
    log2(`[Avatar Agent] Killed all existing avatar agent processes`);
  } catch (error) {
    log2(`[Avatar Agent] No existing processes to kill (or pkill failed)`);
  }
  setTimeout(() => {
    avatarAgentIntentionalStop = false;
    avatarAgentRestartCount = 0;
    avatarAgentDisabled = false;
    avatarAgentDisabledReason = null;
    startAvatarAgent();
  }, 1500);
  return {
    success: true,
    message: killedCount > 0 ? "Avatar agent is restarting..." : "Starting avatar agent..."
  };
}
function getAvatarAgentStatus() {
  if (avatarAgentProcess !== null) {
    return {
      running: true,
      pid: avatarAgentProcess.pid || null,
      restartCount: avatarAgentRestartCount,
      managedByServer: true,
      disabled: avatarAgentDisabled,
      disabledReason: avatarAgentDisabledReason
    };
  }
  try {
    const result = execSync("pgrep -f 'python.*agent\\.py' 2>/dev/null || true", {
      encoding: "utf-8",
      timeout: 5e3
    }).trim();
    if (result) {
      const pids = result.split("\n").filter((p) => p.trim());
      if (pids.length > 0) {
        return {
          running: true,
          pid: parseInt(pids[0], 10),
          restartCount: avatarAgentRestartCount,
          managedByServer: false,
          disabled: avatarAgentDisabled,
          disabledReason: avatarAgentDisabledReason
        };
      }
    }
  } catch (error) {
  }
  return {
    running: false,
    pid: null,
    restartCount: avatarAgentRestartCount,
    managedByServer: false,
    disabled: avatarAgentDisabled,
    disabledReason: avatarAgentDisabledReason
  };
}
function killAvatarAgentOnShutdown() {
  if (avatarAgentProcess) {
    avatarAgentProcess.kill();
  }
}

// server/services/billing-providers.ts
init_db();
init_schema();
init_encryption();
import { eq as eq11 } from "drizzle-orm";
var PROVIDER_DISPLAY_NAMES = {
  stripe: "Stripe",
  revenuecat: "RevenueCat"
};
async function getBillingProviders() {
  const providers = await db.select().from(billingProviders);
  const providerMap = new Map(providers.map((p) => [p.provider, p]));
  const result = [];
  for (const providerType of ["stripe", "revenuecat"]) {
    const existing = providerMap.get(providerType);
    if (existing) {
      const apiKey = decryptApiKeyFromFields(
        existing.apiKeyEncrypted,
        existing.apiKeyIv,
        existing.apiKeyAuthTag
      );
      result.push({
        provider: providerType,
        displayName: existing.displayName,
        isEnabled: existing.isEnabled,
        hasApiKey: !!apiKey,
        apiKeyMasked: maskApiKey(apiKey),
        publicKey: existing.publicKey,
        hasWebhookSecret: !!(existing.webhookSecretEncrypted && existing.webhookSecretIv),
        config: existing.config,
        sourceType: existing.sourceType,
        lastTestedAt: existing.lastTestedAt,
        lastTestStatus: existing.lastTestStatus
      });
    } else {
      result.push({
        provider: providerType,
        displayName: PROVIDER_DISPLAY_NAMES[providerType],
        isEnabled: false,
        hasApiKey: false,
        apiKeyMasked: "(not set)",
        publicKey: null,
        hasWebhookSecret: false,
        config: null,
        sourceType: "local",
        lastTestedAt: null,
        lastTestStatus: null
      });
    }
  }
  return result;
}
async function getBillingProviderWithKeys(providerType) {
  const [provider] = await db.select().from(billingProviders).where(eq11(billingProviders.provider, providerType));
  if (!provider) {
    return null;
  }
  const apiKey = decryptApiKeyFromFields(
    provider.apiKeyEncrypted,
    provider.apiKeyIv,
    provider.apiKeyAuthTag
  );
  const webhookSecret = decryptApiKeyFromFields(
    provider.webhookSecretEncrypted,
    provider.webhookSecretIv,
    provider.webhookSecretAuthTag
  );
  return {
    apiKey,
    webhookSecret,
    publicKey: provider.publicKey,
    config: provider.config,
    isEnabled: provider.isEnabled
  };
}
async function updateBillingProvider(providerType, updates) {
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (updates.apiKey !== void 0) {
    if (updates.apiKey) {
      const encrypted = encryptApiKey(updates.apiKey);
      updateData.apiKeyEncrypted = encrypted.encrypted;
      updateData.apiKeyIv = encrypted.iv;
      updateData.apiKeyAuthTag = encrypted.authTag;
    } else {
      updateData.apiKeyEncrypted = null;
      updateData.apiKeyIv = null;
      updateData.apiKeyAuthTag = null;
    }
  }
  if (updates.publicKey !== void 0) {
    updateData.publicKey = updates.publicKey || null;
  }
  if (updates.webhookSecret !== void 0) {
    if (updates.webhookSecret) {
      const encrypted = encryptApiKey(updates.webhookSecret);
      updateData.webhookSecretEncrypted = encrypted.encrypted;
      updateData.webhookSecretIv = encrypted.iv;
      updateData.webhookSecretAuthTag = encrypted.authTag;
    } else {
      updateData.webhookSecretEncrypted = null;
      updateData.webhookSecretIv = null;
      updateData.webhookSecretAuthTag = null;
    }
  }
  if (updates.config !== void 0) {
    updateData.config = updates.config;
  }
  if (updates.isEnabled !== void 0) {
    updateData.isEnabled = updates.isEnabled;
  }
  if (updates.sourceType !== void 0) {
    updateData.sourceType = updates.sourceType;
    if (updates.sourceType === "three_tears") {
      updateData.threeTearsSyncedAt = /* @__PURE__ */ new Date();
    }
  }
  await db.insert(billingProviders).values({
    provider: providerType,
    displayName: PROVIDER_DISPLAY_NAMES[providerType],
    ...updateData
  }).onConflictDoUpdate({
    target: billingProviders.provider,
    set: updateData
  });
  const providers = await getBillingProviders();
  return providers.find((p) => p.provider === providerType);
}
async function testStripeConnection() {
  const provider = await getBillingProviderWithKeys("stripe");
  if (!provider || !provider.apiKey) {
    return { success: false, message: "Stripe API key not configured" };
  }
  try {
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${provider.apiKey}`
      }
    });
    if (response.ok) {
      await db.update(billingProviders).set({
        lastTestedAt: /* @__PURE__ */ new Date(),
        lastTestStatus: "success"
      }).where(eq11(billingProviders.provider, "stripe"));
      return { success: true, message: "Stripe connection successful" };
    } else {
      const error = await response.json();
      const errorMessage = error.error?.message || "Unknown error";
      await db.update(billingProviders).set({
        lastTestedAt: /* @__PURE__ */ new Date(),
        lastTestStatus: `error: ${errorMessage}`
      }).where(eq11(billingProviders.provider, "stripe"));
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    await db.update(billingProviders).set({
      lastTestedAt: /* @__PURE__ */ new Date(),
      lastTestStatus: `error: ${error.message}`
    }).where(eq11(billingProviders.provider, "stripe"));
    return { success: false, message: error.message };
  }
}
async function testRevenueCatConnection() {
  const provider = await getBillingProviderWithKeys("revenuecat");
  if (!provider || !provider.apiKey) {
    return { success: false, message: "RevenueCat API key not configured" };
  }
  try {
    const response = await fetch(
      "https://api.revenuecat.com/v1/subscribers/$RCAnonymousID:test-connection",
      {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (response.ok || response.status === 404) {
      await db.update(billingProviders).set({
        lastTestedAt: /* @__PURE__ */ new Date(),
        lastTestStatus: "success"
      }).where(eq11(billingProviders.provider, "revenuecat"));
      return { success: true, message: "RevenueCat connection successful" };
    } else {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      const errorMessage = error.message || `HTTP ${response.status}`;
      await db.update(billingProviders).set({
        lastTestedAt: /* @__PURE__ */ new Date(),
        lastTestStatus: `error: ${errorMessage}`
      }).where(eq11(billingProviders.provider, "revenuecat"));
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    await db.update(billingProviders).set({
      lastTestedAt: /* @__PURE__ */ new Date(),
      lastTestStatus: `error: ${error.message}`
    }).where(eq11(billingProviders.provider, "revenuecat"));
    return { success: false, message: error.message };
  }
}
function getBillingProviderForPlatform(platform) {
  switch (platform) {
    case "web":
      return "stripe";
    case "ios":
    case "android":
      return "revenuecat";
    default:
      return "stripe";
  }
}
async function isBillingProviderReady(providerType) {
  const provider = await getBillingProviderWithKeys(providerType);
  return !!(provider && provider.isEnabled && provider.apiKey);
}
async function handleSubscriptionUpdate(params) {
  const { userId, tierSlug, credits, subscriptionExpiresAt, source, transactionId } = params;
  try {
    const [user] = await db.select().from(users).where(eq11(users.id, userId));
    if (!user) {
      return { success: false, error: "User not found" };
    }
    await db.update(users).set({
      tierSlug,
      credits,
      subscriptionActive: tierSlug !== "free",
      subscriptionExpiresAt: subscriptionExpiresAt || null,
      lastCreditReset: /* @__PURE__ */ new Date()
    }).where(eq11(users.id, userId));
    await db.insert(creditTransactions).values({
      userId,
      type: "refill",
      amount: credits,
      balanceAfter: credits,
      feature: null,
      description: `Subscription ${tierSlug} via ${source}${transactionId ? ` (${transactionId})` : ""}`
    });
    console.log(`[Billing] Updated subscription for user ${userId}: ${tierSlug} with ${credits} credits via ${source}`);
    return { success: true };
  } catch (error) {
    console.error(`[Billing] Failed to update subscription for user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}
async function handleSubscriptionCancellation(params) {
  const { userId, source, transactionId } = params;
  try {
    const [user] = await db.select().from(users).where(eq11(users.id, userId));
    if (!user) {
      return { success: false, error: "User not found" };
    }
    await db.update(users).set({
      tierSlug: "free",
      subscriptionActive: false,
      credits: 0
    }).where(eq11(users.id, userId));
    console.log(`[Billing] Cancelled subscription for user ${userId} via ${source}`);
    return { success: true };
  } catch (error) {
    console.error(`[Billing] Failed to cancel subscription for user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}
async function updateBillingCredentialsFromThreeTears(credentials) {
  const updated = [];
  const errors = [];
  if (credentials.stripe) {
    try {
      await updateBillingProvider("stripe", {
        ...credentials.stripe,
        sourceType: "three_tears"
      });
      updated.push("stripe");
    } catch (error) {
      errors.push(`stripe: ${error.message}`);
    }
  }
  if (credentials.revenuecat) {
    try {
      await updateBillingProvider("revenuecat", {
        ...credentials.revenuecat,
        sourceType: "three_tears"
      });
      updated.push("revenuecat");
    } catch (error) {
      errors.push(`revenuecat: ${error.message}`);
    }
  }
  return {
    success: errors.length === 0,
    updated,
    errors
  };
}

// server/services/push-notifications.ts
init_db();
init_schema();
import { eq as eq12, and as and4, inArray as inArray2 } from "drizzle-orm";
var EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
async function sendPushNotifications(messages) {
  if (messages.length === 0) return [];
  const chunks = chunkArray(messages, 100);
  const results = [];
  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(chunk)
      });
      const data = await response.json();
      results.push(...data.data || []);
    } catch (error) {
      console.error("Failed to send push notifications:", error);
    }
  }
  return results;
}
async function registerPushToken(userId, token, platform, deviceId) {
  const [existing] = await db.select().from(pushTokens).where(and4(eq12(pushTokens.userId, userId), eq12(pushTokens.token, token)));
  if (existing) {
    return db.update(pushTokens).set({
      isActive: true,
      lastUsedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq12(pushTokens.id, existing.id)).returning();
  }
  return db.insert(pushTokens).values({
    userId,
    token,
    platform,
    deviceId,
    isActive: true
  }).returning();
}
async function deactivatePushToken(userId, token) {
  return db.update(pushTokens).set({
    isActive: false,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and4(eq12(pushTokens.userId, userId), eq12(pushTokens.token, token)));
}
async function getUserPushTokens(userId) {
  return db.select().from(pushTokens).where(and4(eq12(pushTokens.userId, userId), eq12(pushTokens.isActive, true)));
}
async function getOrCreateUserNotificationSettings(userId) {
  const [existing] = await db.select().from(userNotificationSettings).where(eq12(userNotificationSettings.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(userNotificationSettings).values({ userId }).returning();
  return created;
}
async function sendNewFollowerNotification(followeeId, followerId) {
  const settings2 = await getOrCreateUserNotificationSettings(followeeId);
  if (!settings2.pushEnabled || !settings2.newFollowerNotifications) {
    return null;
  }
  const [follower] = await db.select({ displayName: users.displayName, avatar: users.avatar }).from(users).where(eq12(users.id, followerId));
  if (!follower) return null;
  const tokens = await getUserPushTokens(followeeId);
  if (tokens.length === 0) return null;
  const title = "New Follower";
  const body = `${follower.displayName} started following you`;
  const [notification] = await db.insert(notifications).values({
    userId: followeeId,
    actorId: followerId,
    type: "new_follower",
    title,
    body,
    data: { followerId },
    pushSentAt: /* @__PURE__ */ new Date()
  }).returning();
  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data: {
      type: "new_follower",
      followerId,
      notificationId: notification.id
    },
    sound: "default"
  }));
  const results = await sendPushNotifications(messages);
  return { notification, results };
}
async function sendNewPostNotifications(posterId, postId) {
  const [poster] = await db.select({ displayName: users.displayName }).from(users).where(eq12(users.id, posterId));
  if (!poster) return [];
  const followersList = await db.select({ followerId: follows.followerId }).from(follows).where(eq12(follows.followeeId, posterId));
  if (followersList.length === 0) return [];
  const followerIds = followersList.map((f) => f.followerId);
  const preferences = await db.select().from(notificationPreferences).where(
    and4(
      inArray2(notificationPreferences.userId, followerIds),
      eq12(notificationPreferences.followeeId, posterId)
    )
  );
  const prefMap = new Map(preferences.map((p) => [p.userId, p.notifyOnNewPost]));
  const globalSettings = await db.select().from(userNotificationSettings).where(inArray2(userNotificationSettings.userId, followerIds));
  const globalMap = new Map(globalSettings.map((s) => [s.userId, s]));
  const eligibleFollowers = followerIds.filter((fId) => {
    const global = globalMap.get(fId);
    if (global && (!global.pushEnabled || !global.newPostNotifications)) {
      return false;
    }
    return prefMap.get(fId) !== false;
  });
  if (eligibleFollowers.length === 0) return [];
  const tokens = await db.select().from(pushTokens).where(
    and4(
      inArray2(pushTokens.userId, eligibleFollowers),
      eq12(pushTokens.isActive, true)
    )
  );
  if (tokens.length === 0) return [];
  const title = "New Post";
  const body = `${poster.displayName} shared a new post`;
  const results = [];
  const messages = [];
  for (const token of tokens) {
    const [notification] = await db.insert(notifications).values({
      userId: token.userId,
      actorId: posterId,
      type: "new_post",
      title,
      body,
      data: { postId, posterId },
      pushSentAt: /* @__PURE__ */ new Date()
    }).returning();
    results.push({
      userId: token.userId,
      notification
    });
    messages.push({
      to: token.token,
      title,
      body,
      data: {
        type: "new_post",
        postId,
        posterId,
        notificationId: notification.id
      },
      sound: "default"
    });
  }
  await sendPushNotifications(messages);
  return results;
}

// server/routes.ts
init_schema();
var UPLOAD_DIR = path2.join(process.cwd(), "uploads", "images");
if (!fs2.existsSync(UPLOAD_DIR)) {
  fs2.mkdirSync(UPLOAD_DIR, { recursive: true });
}
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP, HEIC)"));
    }
  }
});
var ADMIN_EMAILS = ["adviceguyy@gmail.com", "jsaeliew@gmail.com"];
function generateSessionToken() {
  return crypto4.randomBytes(32).toString("hex");
}
function getOAuthConfig(provider) {
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo"
    },
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
      userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture"
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      userInfoUrl: "https://api.twitter.com/2/users/me?user.fields=profile_image_url"
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || "",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
      tokenUrl: "https://api.instagram.com/oauth/access_token",
      userInfoUrl: "https://graph.instagram.com/me?fields=id,username"
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_KEY || "",
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
      tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
      userInfoUrl: "https://open.tiktokapis.com/v2/user/info/"
    }
  };
  return configs[provider];
}
async function logActivity(userId, action, metadata) {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      metadata: metadata || null
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
function anonymizeIp(ip) {
  if (!ip) return null;
  return crypto4.createHash("sha256").update(ip).digest("hex").substring(0, 16);
}
async function logFeatureUsage(params) {
  try {
    await db.insert(featureUsage).values({
      userId: params.userId || null,
      category: params.category,
      featureName: params.featureName,
      subFeature: params.subFeature || null,
      metadata: params.metadata || null,
      status: params.status || "success",
      errorMessage: params.errorMessage || null,
      creditsUsed: params.creditsUsed || 0,
      durationMs: params.durationMs || null,
      ipAddress: anonymizeIp(params.ipAddress),
      userAgent: params.userAgent || null
    });
  } catch (error) {
    console.error("Failed to log feature usage:", error);
  }
}
async function createAvatarSession(userId, avatarType, voiceUsed, platform) {
  try {
    const [session] = await db.insert(avatarSessions).values({
      userId,
      avatarType,
      voiceUsed: voiceUsed || null,
      platform: platform || null,
      status: "active"
    }).returning();
    return session.id;
  } catch (error) {
    console.error("Failed to create avatar session:", error);
    throw error;
  }
}
async function endAvatarSession(sessionId, messageCount, userMessageCount, avatarResponseCount, status = "completed", errorMessage) {
  try {
    const [session] = await db.select().from(avatarSessions).where(eq13(avatarSessions.id, sessionId));
    if (session) {
      const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1e3);
      await db.update(avatarSessions).set({
        endedAt: /* @__PURE__ */ new Date(),
        durationSeconds,
        messageCount: messageCount || 0,
        userMessageCount: userMessageCount || 0,
        avatarResponseCount: avatarResponseCount || 0,
        status,
        errorMessage: errorMessage || null
      }).where(eq13(avatarSessions.id, sessionId));
    }
  } catch (error) {
    console.error("Failed to end avatar session:", error);
  }
}
var vertexAccessToken = null;
var vertexTokenExpiry = 0;
async function getVertexAIAccessToken() {
  if (vertexAccessToken && Date.now() < vertexTokenExpiry - 6e4) {
    return vertexAccessToken;
  }
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1e3);
  const expiry = now + 3600;
  const jwtPayload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/cloud-platform"
  };
  const signedJwt = jwt4.sign(jwtPayload, serviceAccount.private_key, { algorithm: "RS256" });
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt
    })
  });
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }
  const tokenData = await tokenResponse.json();
  vertexAccessToken = tokenData.access_token;
  vertexTokenExpiry = Date.now() + tokenData.expires_in * 1e3;
  return vertexAccessToken;
}
async function findOrCreateUser(provider, providerUserId, email, displayName, avatar) {
  const existingUsers = await db.select().from(users).where(and5(eq13(users.provider, provider), eq13(users.providerUserId, providerUserId))).limit(1);
  if (existingUsers.length > 0) {
    const user = existingUsers[0];
    const shouldBeAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    const newRole = shouldBeAdmin ? "admin" : user.role;
    const newLastLoginAt = /* @__PURE__ */ new Date();
    await db.update(users).set({
      lastLoginAt: newLastLoginAt,
      role: newRole
    }).where(eq13(users.id, user.id));
    pushUserUpdated({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      provider: user.provider,
      role: newRole,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: newLastLoginAt.toISOString()
    });
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      provider: user.provider,
      role: newRole
    };
  }
  const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
  const newUser = await db.insert(users).values({
    email,
    displayName,
    avatar,
    provider,
    providerUserId,
    role
  }).returning();
  await logActivity(newUser[0].id, "user_created", { provider, email });
  broadcastEvent("user.created", {
    userId: newUser[0].id,
    email: newUser[0].email,
    displayName: newUser[0].displayName,
    provider: newUser[0].provider
  }).catch((err) => console.warn("Failed to broadcast user.created event:", err));
  pushUserCreated({
    id: newUser[0].id,
    email: newUser[0].email,
    displayName: newUser[0].displayName,
    avatar: newUser[0].avatar,
    provider: newUser[0].provider,
    role: newUser[0].role,
    createdAt: newUser[0].createdAt.toISOString(),
    lastLoginAt: newUser[0].lastLoginAt.toISOString()
  });
  return {
    id: newUser[0].id,
    email: newUser[0].email,
    displayName: newUser[0].displayName,
    avatar: newUser[0].avatar,
    provider: newUser[0].provider,
    role: newUser[0].role
  };
}
async function createSession(userId) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt
  });
  return token;
}
var ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
  }
});
function getDressMeAI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured. Please add your Google AI Studio API key.");
  }
  return new GoogleGenAI({ apiKey });
}
var mienAttireReferenceBase64 = null;
function getMienAttireReference() {
  if (!mienAttireReferenceBase64) {
    const refPath = path2.join(process.cwd(), "assets", "images", "mien-attire-reference.png");
    if (fs2.existsSync(refPath)) {
      mienAttireReferenceBase64 = fs2.readFileSync(refPath).toString("base64");
      console.log("Loaded Mien attire reference image for AI generation");
    } else {
      console.warn("Mien attire reference image not found at:", refPath);
      return "";
    }
  }
  return mienAttireReferenceBase64;
}
var systemPromptToEnglish = `You are a professional translator specializing in the Mien (Iu Mien) language. 
Your task is to translate Mien text into clear, natural English.

Guidelines:
- Preserve the original meaning and cultural context
- Use simple, accessible English
- If a phrase has cultural significance, briefly explain it in parentheses
- If the input appears to be English or another language, still try to provide helpful context about Mien language and culture
- Mien is a Hmong-Mien language spoken by the Iu Mien people of China, Vietnam, Laos, Thailand, and diaspora communities
- Common Mien words include: "kuv" (I/me), "meih" (you), "ninh" (he/she), "mbuo" (we), "hnoi" (day), "hnyouv" (heart)

Always provide a helpful, accurate translation.`;
var systemPromptToMien = `Use the Iu Mien language structure and vocabulary from the IuMiNR (Iu Mien New Romanization) script to translate into Mien.

You are a professional translator specializing in translating English and other languages into the Mien (Iu Mien) language using the IuMiNR romanization system.

Guidelines:
- Use proper IuMiNR (Iu Mien New Romanization) spelling and tone markers
- Preserve the original meaning and cultural context
- Mien is a Hmong-Mien language spoken by the Iu Mien people of China, Vietnam, Laos, Thailand, and diaspora communities
- Use authentic Mien vocabulary and grammar structures
- If a concept doesn't have a direct Mien equivalent, provide the closest cultural translation with explanation

Always provide a helpful, accurate translation into Mien using IuMiNR script.`;
var OTHER_LANGUAGE_NAMES = {
  vietnamese: "Vietnamese",
  mandarin: "Mandarin Chinese",
  hmong: "Hmong",
  cantonese: "Cantonese",
  thai: "Thai",
  lao: "Lao",
  burmese: "Burmese",
  french: "French",
  pinghua: "Pinghua",
  khmer: "Khmer"
};
function getSystemPromptForOtherLanguage(languageKey) {
  const languageName = OTHER_LANGUAGE_NAMES[languageKey] || languageKey;
  return `You are a professional translator. Your ONLY task is to translate text into ${languageName}.

IMPORTANT: Your output must be in ${languageName}. Do NOT translate into any other language.

Guidelines:
- Translate ALL input text into ${languageName} regardless of what language the input is in
- Output ONLY the ${languageName} translation
- Use proper ${languageName} grammar, vocabulary, and writing conventions
- Preserve the original meaning and cultural context
- If a phrase has cultural significance, briefly explain it in parentheses
- Use natural, clear ${languageName} phrasing

Always provide a helpful, accurate translation into ${languageName}.`;
}
var videoExtractionPrompt = `You are a video content analyzer. Watch this video and provide:
1. A comprehensive summary of the video content
2. A full transcription of all spoken words in the video
3. Any text that appears on screen

Output the transcription in clear English. If the video contains speech in another language, translate it to English.
Format your response as:
## Summary
[Your summary here]

## Transcription
[Full transcription of spoken content]

## On-Screen Text
[Any text visible in the video]`;
var documentExtractionPrompt = `You are a document text extractor. Extract all text content from this document.

Instructions:
1. Extract ALL readable text from the document
2. Preserve the structure and formatting as much as possible
3. Include headers, paragraphs, lists, and any other text content
4. If there are images with text, describe them briefly
5. Output the extracted text in a clear, readable format

Format your response as:
## Document Content
[All extracted text from the document]`;
var audioTranscriptionPrompt = `You are an audio transcription specialist. Listen to this audio recording and transcribe all spoken words accurately.

Instructions:
1. Transcribe ALL spoken content in the audio
2. If the speech is in Mien (Iu Mien), transcribe it as accurately as possible using IuMiNR romanization
3. If the speech is in English or another language, transcribe it directly
4. Provide both a brief summary and the full transcription

Format your response EXACTLY as:
SUMMARY: [1-2 sentence summary of what was said]
TRANSCRIPTION: [Full transcription of spoken content]`;
async function extractVideoContent(videoUrl) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: videoExtractionPrompt },
          {
            fileData: {
              fileUri: videoUrl,
              mimeType: "video/*"
            }
          }
        ]
      }
    ]
  });
  return response.text || "";
}
async function extractDocumentContent(fileData, mimeType) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: documentExtractionPrompt },
          {
            inlineData: {
              data: fileData,
              mimeType
            }
          }
        ]
      }
    ]
  });
  return response.text || "";
}
async function transcribeAudio(audioData, mimeType) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: audioTranscriptionPrompt },
          {
            inlineData: {
              data: audioData,
              mimeType
            }
          }
        ]
      }
    ]
  });
  return response.text || "";
}
async function registerRoutes(app2) {
  app2.post("/api/translate", requireAuth, requireCredits(1, "translation"), async (req, res) => {
    try {
      const { content, sourceType, documentContent, targetLanguage } = req.body;
      if (!content && !documentContent) {
        return res.status(400).json({ error: "Content is required" });
      }
      const isToMien = targetLanguage === "mien";
      const isToEnglish = targetLanguage === "english";
      const isToOtherLanguage = !isToMien && !isToEnglish && OTHER_LANGUAGE_NAMES[targetLanguage];
      const systemPrompt = isToMien ? systemPromptToMien : isToOtherLanguage ? getSystemPromptForOtherLanguage(targetLanguage) : systemPromptToEnglish;
      const translationModel = isToMien ? "gemini-3-pro-preview" : "gemini-2.5-flash";
      let userMessage = "";
      if (sourceType === "video") {
        const videoUrl = content;
        try {
          console.log("Step 1: Extracting video content with Gemini 2.5 Flash...");
          const extractedContent = await extractVideoContent(videoUrl);
          console.log("Video extraction complete, length:", extractedContent.length);
          if (isToMien) {
            userMessage = `Please translate the following video content into Mien using IuMiNR (Iu Mien New Romanization) script.

Here is the extracted content from the video:

${extractedContent}

Please provide:
1. The summary translated to Mien
2. The transcription translated to Mien
3. Any on-screen text translated to Mien`;
          } else if (isToOtherLanguage) {
            const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
            userMessage = `Translate the following video content into ${langName}. Your entire response must be in ${langName}.

Here is the extracted content from the video:

${extractedContent}

Provide in ${langName}:
1. The summary translated to ${langName}
2. The transcription translated to ${langName}
3. Any on-screen text translated to ${langName}`;
          } else {
            userMessage = `Here is the extracted content from a video that may contain Mien language:

${extractedContent}

Please analyze this content and:
1. Identify any Mien language phrases
2. Translate any Mien content to English
3. Provide cultural context where relevant`;
          }
        } catch (videoError) {
          console.error("Video extraction failed:", videoError);
          if (isToMien) {
            userMessage = `The user provided a video URL: ${videoUrl}

Unfortunately, I could not extract the video content directly. Please:
1. Acknowledge the video URL
2. If you can recognize the video from its URL, provide any relevant information
3. Offer to translate any text the user can provide from the video into Mien using IuMiNR script`;
          } else if (isToOtherLanguage) {
            const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
            userMessage = `The user provided a video URL: ${videoUrl}

Unfortunately, I could not extract the video content directly. Respond in ${langName}:
1. Acknowledge the video URL
2. If you can recognize the video from its URL, provide any relevant information
3. Offer to translate any text the user can provide from the video into ${langName}`;
          } else {
            userMessage = `The user provided a video URL: ${videoUrl}

Unfortunately, I could not extract the video content directly. Please:
1. Acknowledge the video URL
2. If you can recognize the video from its URL, provide any relevant information
3. Offer to translate any Mien text the user can provide from the video`;
          }
        }
      } else if (sourceType === "document") {
        const { documentData, documentMimeType } = req.body;
        if (documentData && documentMimeType) {
          try {
            console.log("Step 1: Extracting document content with Gemini 2.5 Flash...");
            const extractedText = await extractDocumentContent(documentData, documentMimeType);
            console.log("Document extraction complete, length:", extractedText.length);
            if (isToMien) {
              userMessage = `Please translate the following document content into Mien using IuMiNR (Iu Mien New Romanization) script:

${extractedText}`;
            } else if (isToOtherLanguage) {
              const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
              userMessage = `Translate the following document content into ${langName}. Your entire response must be in ${langName}:

${extractedText}`;
            } else {
              userMessage = `Please translate the following document content (which may contain Mien text) to English:

${extractedText}

Identify any Mien language content and translate it to English with cultural context.`;
            }
          } catch (docError) {
            console.error("Document extraction failed:", docError);
            if (documentContent && documentContent.trim()) {
              if (isToMien) {
                userMessage = `Please translate the following text into Mien using IuMiNR (Iu Mien New Romanization) script:

${documentContent}`;
              } else if (isToOtherLanguage) {
                const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
                userMessage = `Translate the following text into ${langName}. Your entire response must be in ${langName} only:

${documentContent}`;
              } else {
                userMessage = `Please translate the following Mien text to English:

${documentContent}`;
              }
            } else {
              userMessage = `Document extraction failed. Please copy and paste the text from your document for translation.`;
            }
          }
        } else if (documentContent && documentContent.trim()) {
          if (isToMien) {
            userMessage = `Please translate the following text into Mien using IuMiNR (Iu Mien New Romanization) script:

${documentContent}`;
          } else if (isToOtherLanguage) {
            const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
            userMessage = `Translate the following text into ${langName}. Your entire response must be in ${langName} only:

${documentContent}`;
          } else {
            userMessage = `Please translate the following Mien text to English:

${documentContent}`;
          }
        } else {
          userMessage = `Please provide document content for translation. You can copy and paste the text from your document.`;
        }
      } else {
        if (isToMien) {
          userMessage = `Please translate the following text into Mien using IuMiNR (Iu Mien New Romanization) script:

${content}`;
        } else if (isToOtherLanguage) {
          const langName = OTHER_LANGUAGE_NAMES[targetLanguage];
          userMessage = `Translate the following text into ${langName}. Your entire response must be in ${langName} only:

${content}`;
        } else {
          userMessage = `Please translate the following Mien text to English:

${content}`;
        }
      }
      const modelAck = isToMien ? "I understand. I will translate text into Mien using the IuMiNR romanization system, preserving cultural context." : isToOtherLanguage ? `I understand. I will translate the text into ${OTHER_LANGUAGE_NAMES[targetLanguage]} only. My response will be entirely in ${OTHER_LANGUAGE_NAMES[targetLanguage]}.` : "I understand. I will translate Mien text to English following your guidelines, providing cultural context where relevant.";
      const response = await ai.models.generateContent({
        model: translationModel,
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: modelAck }] },
          { role: "user", parts: [{ text: userMessage }] }
        ]
      });
      const translation = response.text || "Translation could not be generated. Please try again.";
      const inputContent = content || documentContent || "";
      const contentLength = typeof inputContent === "string" ? inputContent.length : 0;
      const outputLength = translation.length;
      res.json({ translation });
      awardXp(req.user.id, "ai_translation").catch(() => {
      });
      logFeatureUsage({
        userId: req.user.id,
        category: "ai_translation",
        featureName: isToMien ? "translate_to_mien" : isToOtherLanguage ? `translate_to_${targetLanguage}` : "translate_to_english",
        subFeature: sourceType || "text",
        creditsUsed: 1,
        metadata: {
          sourceType: sourceType || "text",
          targetLanguage,
          inputContentLength: contentLength,
          outputContentLength: outputLength,
          documentMimeType: req.body.documentMimeType || null,
          modelUsed: translationModel,
          hasDocumentData: !!req.body.documentData
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      const originalText = (inputContent || "").substring(0, 5e3);
      db.insert(translationHistory).values({
        userId: req.user.id,
        originalText,
        translatedText: translation.substring(0, 1e4),
        direction: isToMien ? "to_mien" : isToOtherLanguage ? `to_${targetLanguage}` : "to_english",
        sourceType: sourceType || "text",
        creditsUsed: 1
      }).catch((historyError) => {
        console.error("Failed to save translation to history (non-blocking):", historyError);
      });
    } catch (error) {
      console.error("Translation error:", error);
      const inputContent = req.body.content || req.body.documentContent || "";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_translation",
        featureName: req.body.targetLanguage === "mien" ? "translate_to_mien" : "translate_to_english",
        subFeature: req.body.sourceType || "text",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          sourceType: req.body.sourceType || "text",
          targetLanguage: req.body.targetLanguage,
          inputContentLength: typeof inputContent === "string" ? inputContent.length : 0,
          documentMimeType: req.body.documentMimeType || null
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.status(500).json({ error: "Translation failed. Please try again." });
    }
  });
  app2.get("/api/translation-history", requireAuth, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = parseInt(req.query.offset) || 0;
      const history = await db.select().from(translationHistory).where(eq13(translationHistory.userId, req.user.id)).orderBy(desc3(translationHistory.createdAt)).limit(limit).offset(offset);
      const [{ count: totalCount }] = await db.select({ count: count2() }).from(translationHistory).where(eq13(translationHistory.userId, req.user.id));
      res.json({
        history,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + history.length < totalCount
        }
      });
    } catch (error) {
      console.error("Error fetching translation history:", error);
      res.status(500).json({ error: "Failed to fetch translation history" });
    }
  });
  app2.delete("/api/translation-history/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(translationHistory).where(and5(
        eq13(translationHistory.id, id),
        eq13(translationHistory.userId, req.user.id)
      )).returning();
      if (!deleted) {
        return res.status(404).json({ error: "Translation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting translation:", error);
      res.status(500).json({ error: "Failed to delete translation" });
    }
  });
  app2.delete("/api/translation-history", requireAuth, async (req, res) => {
    try {
      await db.delete(translationHistory).where(eq13(translationHistory.userId, req.user.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing translation history:", error);
      res.status(500).json({ error: "Failed to clear translation history" });
    }
  });
  app2.post("/api/recipe-it", requireAuth, requireCredits(2, "recipe"), async (req, res) => {
    try {
      const { imageData, mimeType, dishDescription } = req.body;
      if (!imageData && !dishDescription) {
        return res.status(400).json({ error: "Either an image or dish description is required" });
      }
      console.log("Analyzing food with Gemini...", dishDescription ? "(text mode)" : "(image mode)");
      const inputDescription = dishDescription ? `the dish: "${dishDescription}"` : "this image of food";
      const recipePrompt = `You are a professional chef and food expert with deep knowledge of Mien (Yao/Iu Mien) cuisine and culture. Analyze ${inputDescription} and provide a complete recipe with the following information. Return ONLY valid JSON without any markdown formatting or code blocks.

IMPORTANT: The Mien people (also known as Yao or Iu Mien) are an ethnic group from Southeast Asia with a rich culinary tradition. Common Mien dishes include:
- Laab/Larb (spiced minced meat salad)
- Khao poon/Khao pun (rice noodle soup)
- Jeow/Jaew (spicy dipping sauces)
- Sticky rice dishes (khao niew)
- Grilled meats with herbs (ping)
- Fresh spring rolls (poh pia)
- Fermented fish/meat dishes
- Dishes with lemongrass, galangal, fish sauce, and fresh herbs
- Papaya salad (som tam)
- Various soups and curries

If this IS a traditional Mien dish:
- Set "isMienDish" to true
- In "mienHighlights", provide interesting highlights, cultural background, and fascinating facts about this dish and/or its ingredients. Include any traditional significance, when it's typically served, and its cultural importance to the Mien people.
- Set "mienModifications" to null
- Set "similarMienDish" to null

If this is NOT a traditional Mien dish:
- Set "isMienDish" to false
- Set "mienHighlights" to null
- In "mienModifications", kindly let the user know this is not a traditional Mien dish and provide creative suggestions on how they could modify the dish to make it more Mien-inspired (e.g., adding fish sauce, fresh herbs, making it spicier, serving with sticky rice, etc.)
- In "similarMienDish", recommend the name of a traditional Mien dish that is most similar to what the user submitted, and briefly explain the similarity

IMPORTANT: Still provide the full recipe details for the dish the user submitted, regardless of whether it's Mien or not.

Return this exact JSON structure:
{
  "recipeName": "Name of the dish",
  "description": "Brief description of the dish (2-3 sentences)",
  "servings": "Number of servings (e.g., 'Serves 4')",
  "prepTime": "Preparation time (e.g., '15 minutes')",
  "cookTime": "Cooking time (e.g., '30 minutes')",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "instructions": ["Step 1 instruction", "Step 2 instruction", ...],
  "shoppingList": [
    {"category": "Produce", "items": ["item1", "item2"]},
    {"category": "Proteins", "items": ["item1"]},
    {"category": "Dairy", "items": ["item1"]},
    {"category": "Pantry", "items": ["item1", "item2"]}
  ],
  "isMienDish": true or false,
  "mienHighlights": "Cultural highlights and interesting facts (only if isMienDish is true, otherwise null)",
  "mienModifications": "Suggestions to make it more Mien (only if isMienDish is false, otherwise null)",
  "similarMienDish": "Name and brief explanation of a similar Mien dish (only if isMienDish is false, otherwise null)"
}

If you cannot identify the food clearly, make your best guess based on what you can see or the description provided.`;
      const contentParts = [{ text: recipePrompt }];
      if (imageData) {
        contentParts.push({
          inlineData: {
            data: imageData,
            mimeType: mimeType || "image/jpeg"
          }
        });
      }
      const dressMeAI = getDressMeAI();
      const response = await dressMeAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: contentParts
          }
        ]
      });
      const responseText = response.text || "";
      console.log("Recipe analysis complete, parsing response...");
      let recipe;
      try {
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();
        const jsonStartIndex = cleanedText.indexOf("{");
        const jsonEndIndex = cleanedText.lastIndexOf("}");
        if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex <= jsonStartIndex) {
          throw new Error("No valid JSON object found in response");
        }
        const jsonString = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
        recipe = JSON.parse(jsonString);
        if (!recipe.recipeName || !recipe.ingredients || !recipe.instructions) {
          throw new Error("Missing required recipe fields");
        }
      } catch (parseError) {
        console.error("Failed to parse recipe JSON:", parseError);
        console.log("Raw response:", responseText.substring(0, 1e3));
        const inputType2 = imageData && dishDescription ? "hybrid" : imageData ? "image" : "text";
        logFeatureUsage({
          userId: req.user?.id,
          category: "ai_assistant",
          featureName: "recipe_it",
          subFeature: inputType2,
          status: "failed",
          errorMessage: "Failed to parse recipe JSON",
          creditsUsed: 2,
          metadata: {
            inputType: inputType2,
            hasImage: !!imageData,
            hasTextDescription: !!dishDescription,
            imageMimeType: mimeType || null,
            descriptionLength: dishDescription?.length || 0
          },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent")
        });
        return res.status(422).json({ error: "Could not parse recipe. Please try another image." });
      }
      const inputType = imageData && dishDescription ? "hybrid" : imageData ? "image" : "text";
      const ingredientCount = Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;
      const instructionCount = Array.isArray(recipe.instructions) ? recipe.instructions.length : 0;
      const shoppingListCategories = Array.isArray(recipe.shoppingList) ? recipe.shoppingList.length : 0;
      logFeatureUsage({
        userId: req.user.id,
        category: "ai_assistant",
        featureName: "recipe_it",
        subFeature: inputType,
        creditsUsed: 2,
        metadata: {
          inputType,
          hasImage: !!imageData,
          hasTextDescription: !!dishDescription,
          imageMimeType: mimeType || null,
          descriptionLength: dishDescription?.length || 0,
          recipeName: recipe.recipeName,
          isMienDish: recipe.isMienDish,
          hasMienHighlights: !!recipe.mienHighlights,
          hasMienModifications: !!recipe.mienModifications,
          hasSimilarMienDish: !!recipe.similarMienDish,
          ingredientCount,
          instructionCount,
          shoppingListCategories,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.json({ recipe });
    } catch (error) {
      console.error("Recipe analysis error:", error);
      const { imageData, mimeType, dishDescription } = req.body;
      const inputType = imageData && dishDescription ? "hybrid" : imageData ? "image" : "text";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_assistant",
        featureName: "recipe_it",
        subFeature: inputType,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          inputType,
          hasImage: !!imageData,
          hasTextDescription: !!dishDescription,
          imageMimeType: mimeType || null,
          descriptionLength: dishDescription?.length || 0
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.status(500).json({ error: "Recipe analysis failed. Please try again." });
    }
  });
  app2.post("/api/dress-me", requireAuth, requireCredits(5, "dress_me"), async (req, res) => {
    try {
      const { imageBase64, additionalInstructions } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "An image is required" });
      }
      const wavespeedConfig = await getServiceConfigWithApiKey(AI_SERVICES.WAVESPEED);
      if (!wavespeedConfig || !wavespeedConfig.apiKey) {
        console.error("WaveSpeed API key not configured");
        return res.status(500).json({ error: "WaveSpeed AI is not configured. Please ask an admin to set the API key in AI Services settings." });
      }
      console.log("Generating Mien wedding attire image with WaveSpeed qwen-image-max...");
      const referenceImage = getMienAttireReference();
      let prompt = `Transform the subject in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. Use the reference image showing authentic Mien male and female traditional attire as your visual guide. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE:
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Keep the subject's pose and background the same.
Upscale the image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.`;
      const userTier = req.user?.tierSlug || "free";
      if (userTier === "free") {
        prompt += "\n\nCreate a watermark on the image at the bottom center with small fonts that reads 'Created by Mien Kingdom'.";
      }
      if (additionalInstructions && additionalInstructions.trim()) {
        prompt += `

Additional user instructions: ${additionalInstructions}`;
      }
      const generationStartTime = Date.now();
      const wavespeedApiKey = wavespeedConfig.apiKey;
      const wavespeedEndpoint = wavespeedConfig.endpointUrl;
      const images = [
        `data:image/jpeg;base64,${imageBase64}`
      ];
      if (referenceImage) {
        images.push(`data:image/png;base64,${referenceImage}`);
      }
      const submitResponse = await fetch(`${wavespeedEndpoint}/wavespeed-ai/qwen-image-max/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${wavespeedApiKey}`
        },
        body: JSON.stringify({
          prompt,
          images,
          size: "1024*1024",
          output_format: "png"
        })
      });
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        console.error("WaveSpeed submit error:", errorData);
        throw new Error(errorData?.message || `WaveSpeed API error: ${submitResponse.status}`);
      }
      const submitData = await submitResponse.json();
      const predictionId = submitData?.data?.id;
      const resultUrl = submitData?.data?.urls?.get;
      if (!predictionId || !resultUrl) {
        console.error("No prediction ID from WaveSpeed:", submitData);
        throw new Error("Failed to start image generation");
      }
      console.log(`WaveSpeed prediction started: ${predictionId}`);
      const maxPollAttempts = 60;
      const pollInterval = 2e3;
      let imageUrl = null;
      for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
        await new Promise((resolve2) => setTimeout(resolve2, pollInterval));
        const pollResponse = await fetch(resultUrl, {
          headers: {
            "Authorization": `Bearer ${wavespeedApiKey}`
          }
        });
        if (!pollResponse.ok) {
          console.error(`WaveSpeed poll error (attempt ${attempt + 1}):`, pollResponse.status);
          continue;
        }
        const pollData = await pollResponse.json();
        const status = pollData?.data?.status;
        if (status === "completed") {
          const outputs = pollData?.data?.outputs;
          if (outputs && outputs.length > 0) {
            imageUrl = outputs[0];
          }
          break;
        } else if (status === "failed") {
          console.error("WaveSpeed generation failed:", pollData);
          throw new Error("Image generation failed on WaveSpeed");
        }
        console.log(`WaveSpeed polling (attempt ${attempt + 1}): status=${status}`);
      }
      if (!imageUrl) {
        throw new Error("Image generation timed out. Please try again.");
      }
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image");
      }
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const imageBase64Result = imageBuffer.toString("base64");
      const generationDuration = Date.now() - generationStartTime;
      console.log("Mien attire image generated successfully via WaveSpeed qwen-image-max");
      logFeatureUsage({
        userId: req.user.id,
        category: "ai_generation",
        featureName: "dress_me",
        subFeature: "mien_wedding_attire",
        creditsUsed: 5,
        durationMs: generationDuration,
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "wavespeed-ai/qwen-image-max/edit",
          hasReferenceImage: !!referenceImage,
          outputSize: "1024x1024"
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.json({
        b64_json: imageBase64Result,
        mimeType: "image/png"
      });
      awardXp(req.user.id, "ai_image_dress_me").catch(() => {
      });
    } catch (error) {
      console.error("Dress Me error:", error);
      const { additionalInstructions } = req.body;
      const userTier = req.user?.tierSlug || "free";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_generation",
        featureName: "dress_me",
        subFeature: "mien_wedding_attire",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "wavespeed-ai/qwen-image-max/edit"
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.status(500).json({ error: "Image generation failed. Please try again." });
    }
  });
  app2.post("/api/restore-photo", requireAuth, requireCredits(5, "restore_photo"), async (req, res) => {
    try {
      const { imageBase64, additionalInstructions } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "An image is required" });
      }
      console.log("Restoring photo with Gemini 3 Pro Image...");
      let prompt = "Restore this photo to fully restored vintage photograph, colorized, incredibly detailed, sharp focus, 8k, realistic skin texture, natural lighting, vibrant colors, and clean photo. Upscale this image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.";
      const userTier = req.user?.tierSlug || "free";
      if (userTier === "free") {
        prompt += "\n\nCreate a watermark on the image at the bottom center with small fonts that reads 'Created by Mien Kingdom'.";
      }
      if (additionalInstructions && additionalInstructions.trim()) {
        prompt += `

Additional user instructions: ${additionalInstructions}`;
      }
      const dressMeAI = getDressMeAI();
      const generationStartTime = Date.now();
      const response = await dressMeAI.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: "image/jpeg"
                }
              }
            ]
          }
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            imageSize: "2K"
          }
        }
      });
      const generationDuration = Date.now() - generationStartTime;
      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part) => part.inlineData);
      if (!imagePart?.inlineData?.data) {
        console.error("No image data in response");
        return res.status(500).json({ error: "Failed to restore image. Please try again." });
      }
      const mimeType = imagePart.inlineData.mimeType || "image/png";
      console.log("Photo restored successfully");
      logFeatureUsage({
        userId: req.user.id,
        category: "ai_generation",
        featureName: "restore_photo",
        subFeature: "vintage_colorization",
        creditsUsed: 5,
        durationMs: generationDuration,
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "gemini-3-pro-image-preview",
          outputSize: "2K",
          outputMimeType: mimeType,
          inputImageSize: imageBase64.length
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.json({
        b64_json: imagePart.inlineData.data,
        mimeType
      });
      awardXp(req.user.id, "ai_image_restore_photo").catch(() => {
      });
    } catch (error) {
      console.error("Photo restoration error:", error);
      const { imageBase64, additionalInstructions } = req.body;
      const userTier = req.user?.tierSlug || "free";
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_generation",
        featureName: "restore_photo",
        subFeature: "vintage_colorization",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          hasAdditionalInstructions: !!additionalInstructions,
          additionalInstructionsLength: additionalInstructions?.length || 0,
          userTier,
          hasWatermark: userTier === "free",
          modelUsed: "gemini-3-pro-image-preview",
          inputImageSize: imageBase64?.length || 0
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.status(500).json({ error: "Photo restoration failed. Please try again." });
    }
  });
  app2.post("/api/movie-star", requireAuth, async (req, res) => {
    const MOVIE_STAR_CREDIT_COST = 160;
    const userId = req.user.id;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const sendSSE = (event, data) => {
      res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
    };
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        sendSSE("error", { error: "An image is required" });
        return res.end();
      }
      const userResult = await db.select().from(users).where(eq13(users.id, userId));
      if (!userResult.length || userResult[0].credits < MOVIE_STAR_CREDIT_COST) {
        sendSSE("error", {
          error: "Insufficient credits",
          required: MOVIE_STAR_CREDIT_COST,
          available: userResult[0]?.credits || 0,
          redirect_url: "/subscription",
          status: 402
        });
        return res.end();
      }
      const deductResult = await db.execute(
        sql6`UPDATE users SET credits = credits - ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId} AND credits >= ${MOVIE_STAR_CREDIT_COST} RETURNING credits`
      );
      if (!deductResult.rows?.length) {
        sendSSE("error", { error: "Failed to deduct credits", redirect_url: "/subscription", status: 402 });
        return res.end();
      }
      const newBalance = deductResult.rows[0].credits;
      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -MOVIE_STAR_CREDIT_COST,
        balanceAfter: newBalance,
        feature: "movie_star",
        description: "Mien Movie Star video generation"
      });
      console.log("Starting Mien Movie Star generation...");
      sendSSE("progress", { step: 1, message: "Creating your portrait..." });
      const step1StartTime = Date.now();
      let step1Duration2 = 0;
      let step2Duration2 = 0;
      const userTier = req.user?.tierSlug || "free";
      console.log("Step 1: Generating Mien wedding portrait...");
      const referenceImage = getMienAttireReference();
      const imagePrompt = `Generate a 16:9 widescreen cinematic image. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. Use the attached reference image showing authentic Mien male and female traditional attire as your visual guide. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image (but no turban for this cinematic scene). He is in his prime athletic tone body. The shot will be a medium shot of a rugged action hero walking confidently towards the camera, away from a massive, fiery explosion in the background. The subject is wearing sunglasses looking calm and indifferent, not looking back. Debris and sparks flying in the air, dynamic lighting, orange and teal color grading, cinematic composition, depth of field, 8k resolution, hyper-realistic, volumetric lighting, smoke and fire engulfing the sides.

If a female subject is present, dress her in attire matching the RIGHT side of the reference image (but no head jewelry for this scene). She has a toned athletic body. The character(s) is in a vast rice field with towering scenic mountain somewhere in the forests of Vietnam. The rice plants are at the height of the character's waist, covering portions of the feet and below. The character is walking towards the camera with both hands stretched towards each side touching the plants. The character is feeling the sensation of the plants on the skin of the fingertips as the hands are brushing through the leaf of the plant without grabbing on the plants. Character looks at the camera with intent and purpose with the hair flowing by the breeze of the wind. The head is uplifted a bit, with a look of confidence. Golden hour lighting, warm sun-drenched atmosphere with strong backlighting and lens flare. Ethereal glow, dreamlike quality. Shallow depth of field. Ridley Scott style, 35mm film grain, anamorphic lens, epic, emotional, masterpiece, 8k resolution.

If there are female and male characters present, dress both in their respective attire from the reference image (but no headpieces on for this scene). A wide photographic shot of a young couple recreating the famous "Titanic" pose at the bow of a massive ocean liner at sunset. The female character with her arms extended wide, looking at the horizon. The man holds her securely from behind. Both are now toned and more athletic. The sun is a fiery orb setting over the sea, casting a warm golden glow on everything. The ocean is calm. Romantic, emotional atmosphere.`;
      const dressMeAI = getDressMeAI();
      const movieStarContentParts = [
        { text: imagePrompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg"
          }
        }
      ];
      if (referenceImage) {
        movieStarContentParts.push({
          inlineData: {
            data: referenceImage,
            mimeType: "image/png"
          }
        });
      }
      let generatedImageBase64;
      try {
        const imageResponse = await dressMeAI.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [
            {
              role: "user",
              parts: movieStarContentParts
            }
          ],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              imageSize: "2K"
            }
          }
        });
        const candidate = imageResponse.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((part) => part.inlineData);
        if (!imagePart?.inlineData?.data) {
          throw new Error("No image generated in step 1");
        }
        generatedImageBase64 = imagePart.inlineData.data;
        console.log("Step 1 complete: Image generated successfully");
        sendSSE("image", { imageBase64: generatedImageBase64 });
        sendSSE("progress", { step: 2, message: "Filming your scene..." });
      } catch (imageError) {
        console.error("Step 1 failed:", imageError);
        await db.execute(sql6`UPDATE users SET credits = credits + ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: MOVIE_STAR_CREDIT_COST,
          balanceAfter: newBalance + MOVIE_STAR_CREDIT_COST,
          feature: "movie_star",
          description: "Refund: Image generation failed"
        });
        sendSSE("error", { error: "Step 1 failed: Unable to generate image. Credits have been refunded." });
        return res.end();
      }
      step1Duration2 = Date.now() - step1StartTime;
      const step2StartTime = Date.now();
      console.log("Step 2: Generating cinematic video with Veo 3.1 Fast via Vertex AI...");
      const videoPrompt = `If it's only one female character, she walks forward with a tracking camera of the subject. Audio: Ethereal and haunting piano soundtrack.

If it's only one male character, he walks forward with a tracking camera of the subject, explosions seen and heard from back and sides. Music is fast electric guitar soundtrack.

If there are female and male characters present, camera will pan around subjects. Music is a romantic piano soundtrack.`;
      let videoBase64 = null;
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        if (!projectId) {
          throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured for video generation");
        }
        const accessToken = await getVertexAIAccessToken();
        const location = "us-central1";
        const modelId = "veo-3.1-fast-generate-001";
        const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
        console.log("Calling Vertex AI endpoint:", vertexEndpoint);
        const veoResponse = await fetch(vertexEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            instances: [{
              prompt: videoPrompt,
              image: {
                bytesBase64Encoded: generatedImageBase64,
                mimeType: "image/png"
              }
            }],
            parameters: {
              durationSeconds: 4,
              resolution: "1080p",
              aspectRatio: "16:9"
            }
          })
        });
        if (!veoResponse.ok) {
          console.error("Vertex AI Veo API error:", veoResponse.status);
          throw new Error(`Vertex AI Veo API error: ${veoResponse.status}`);
        }
        const veoResult = await veoResponse.json();
        console.log("Vertex AI initial response:", JSON.stringify(veoResult, null, 2).substring(0, 1e3));
        let operationName = veoResult.name;
        if (!operationName) {
          throw new Error("No operation name returned from Vertex AI");
        }
        let videoData = null;
        let attempts = 0;
        const maxAttempts = 180;
        console.log("Polling operation:", operationName);
        const fetchOperationUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
        console.log("Fetch operation URL:", fetchOperationUrl);
        console.log("Waiting 5 seconds before starting to poll...");
        await new Promise((resolve2) => setTimeout(resolve2, 5e3));
        while (attempts < maxAttempts) {
          await new Promise((resolve2) => setTimeout(resolve2, 5e3));
          const pollResponse = await fetch(fetchOperationUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              operationName
            })
          });
          if (!pollResponse.ok) {
            const errorText = await pollResponse.text();
            console.error("Poll request failed:", pollResponse.status);
            attempts++;
            continue;
          }
          const pollResult = await pollResponse.json();
          if (pollResult.done) {
            if (pollResult.error) {
              console.error("Video generation error:", pollResult.error);
              throw new Error(pollResult.error.message || "Video generation failed");
            }
            videoData = pollResult.response;
            console.log("Veo poll complete, response structure:", JSON.stringify(videoData, null, 2).substring(0, 2e3));
            break;
          }
          if (attempts % 10 === 0) {
            console.log(`Still polling... attempt ${attempts}/${maxAttempts}`);
          }
          attempts++;
        }
        if (!videoData) {
          throw new Error("Video generation timed out");
        }
        console.log("Attempting to extract video data from response...");
        let generatedVideo = videoData.predictions?.[0];
        if (!generatedVideo) {
          generatedVideo = videoData.generateVideoResponse?.generatedSamples?.[0]?.video;
        }
        if (!generatedVideo) {
          generatedVideo = videoData.generatedSamples?.[0]?.video;
        }
        if (!generatedVideo) {
          generatedVideo = videoData.videos?.[0];
        }
        console.log("Found video object:", generatedVideo ? "yes" : "no");
        if (generatedVideo?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.bytesBase64Encoded;
          console.log("Got video as bytesBase64Encoded, size:", videoBase64?.length);
        } else if (generatedVideo?.video?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.video.bytesBase64Encoded;
          console.log("Got video from nested structure, size:", videoBase64?.length);
        } else if (generatedVideo?.gcsUri || generatedVideo?.video?.gcsUri) {
          const gcsUri = generatedVideo.gcsUri || generatedVideo.video.gcsUri;
          console.log("Video stored at GCS URI:", gcsUri);
          const bucketPath = gcsUri.replace("gs://", "");
          const downloadUrl = `https://storage.googleapis.com/${bucketPath}`;
          const videoFetch = await fetch(downloadUrl, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (!videoFetch.ok) {
            console.error("Video download from GCS failed:", videoFetch.status);
            throw new Error(`Video download failed: ${videoFetch.status}`);
          }
          const videoBuffer2 = await videoFetch.arrayBuffer();
          videoBase64 = Buffer.from(videoBuffer2).toString("base64");
          console.log("Got video from GCS, size:", videoBase64.length, "bytes");
        } else if (typeof generatedVideo === "string" && generatedVideo.length > 1e4) {
          videoBase64 = generatedVideo;
          console.log("Got video as direct base64 string, size:", videoBase64.length);
        }
        if (!videoBase64) {
          console.error("Could not extract video. Full response:", JSON.stringify(videoData, null, 2));
          throw new Error("No video data in response");
        }
        if (videoBase64.length < 1e4) {
          console.error("Video file too small, likely an error response");
          throw new Error("Video file too small - download may have failed");
        }
        console.log("Step 2 complete: Video generated successfully, final size:", videoBase64.length);
      } catch (videoError) {
        console.error("Step 2 failed:", videoError);
        await db.execute(sql6`UPDATE users SET credits = credits + ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: MOVIE_STAR_CREDIT_COST,
          balanceAfter: newBalance + MOVIE_STAR_CREDIT_COST,
          feature: "movie_star",
          description: "Refund: Video generation failed"
        });
        sendSSE("error", {
          error: "Step 2 failed: Unable to generate video. Credits have been refunded.",
          imageGenerated: true
        });
        return res.end();
      }
      const videoBuffer = Buffer.from(videoBase64, "base64");
      const imageBuffer = Buffer.from(generatedImageBase64, "base64");
      let videoUrl;
      let imageUrl;
      if (isR2Configured()) {
        const [videoResult, imageResult] = await Promise.all([
          uploadToR2(videoBuffer, { folder: "videos/movie-star", contentType: "video/mp4" }),
          uploadToR2(imageBuffer, { folder: "images/movie-star", contentType: "image/png" })
        ]);
        videoUrl = videoResult.url;
        imageUrl = imageResult.url;
        console.log("Movie Star saved to R2:", { videoUrl, imageUrl });
      } else {
        const videoFilename = `movie-star-${crypto4.randomUUID()}.mp4`;
        const imageFilename = `movie-star-${crypto4.randomUUID()}.png`;
        const videoDir = path2.join(process.cwd(), "public", "generated");
        if (!fs2.existsSync(videoDir)) {
          fs2.mkdirSync(videoDir, { recursive: true });
        }
        fs2.writeFileSync(path2.join(videoDir, videoFilename), videoBuffer);
        fs2.writeFileSync(path2.join(videoDir, imageFilename), imageBuffer);
        videoUrl = `/generated/${videoFilename}`;
        imageUrl = `/generated/${imageFilename}`;
        console.log("Movie Star saved locally:", { videoUrl, imageUrl });
      }
      await db.insert(artGenerations).values({
        userId,
        type: "movie_star",
        imageUrl,
        videoUrl,
        prompt: imagePrompt.substring(0, 500),
        creditsUsed: MOVIE_STAR_CREDIT_COST
      });
      step2Duration2 = Date.now() - step2StartTime;
      const totalDuration = step1Duration2 + step2Duration2;
      console.log("Mien Movie Star generation complete!");
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "movie_star",
        subFeature: "cinematic_mien_video",
        creditsUsed: MOVIE_STAR_CREDIT_COST,
        durationMs: totalDuration,
        metadata: {
          videoUrl,
          imageUrl,
          step1DurationMs: step1Duration2,
          step2DurationMs: step2Duration2,
          totalDurationMs: totalDuration,
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast",
          userTier,
          outputAspectRatio: "16:9",
          videoDurationSeconds: 4,
          videoResolution: "1080p",
          step1Success: true,
          step2Success: true
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      sendSSE("video", { videoUrl });
      sendSSE("complete", {
        success: true,
        creditsUsed: MOVIE_STAR_CREDIT_COST
      });
      res.end();
      awardXp(userId, "ai_video_movie_star").catch(() => {
      });
    } catch (error) {
      console.error("Movie Star error:", error);
      const userTier = req.user?.tierSlug || "free";
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "movie_star",
        subFeature: "cinematic_mien_video",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          userTier,
          step1DurationMs: step1Duration || 0,
          step2DurationMs: step2Duration || 0,
          outputAspectRatio: "16:9",
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast"
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      try {
        await db.execute(sql6`UPDATE users SET credits = credits + ${MOVIE_STAR_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: MOVIE_STAR_CREDIT_COST,
          balanceAfter: 0,
          // Will be recalculated
          feature: "movie_star",
          description: "Refund: Unexpected error"
        });
      } catch (refundError) {
        console.error("Refund failed:", refundError);
      }
      sendSSE("error", { error: "Movie Star generation failed. Credits have been refunded." });
      res.end();
    }
  });
  app2.post("/api/tiktok-dance", requireAuth, async (req, res) => {
    const TIKTOK_DANCE_CREDIT_COST = 160;
    const userId = req.user.id;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const sendSSE = (event, data) => {
      res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
    };
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        sendSSE("error", { error: "An image is required" });
        return res.end();
      }
      const userResult = await db.select().from(users).where(eq13(users.id, userId));
      if (!userResult.length || userResult[0].credits < TIKTOK_DANCE_CREDIT_COST) {
        sendSSE("error", {
          error: "Insufficient credits",
          required: TIKTOK_DANCE_CREDIT_COST,
          available: userResult[0]?.credits || 0,
          redirect_url: "/subscription",
          status: 402
        });
        return res.end();
      }
      const deductResult = await db.execute(
        sql6`UPDATE users SET credits = credits - ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId} AND credits >= ${TIKTOK_DANCE_CREDIT_COST} RETURNING credits`
      );
      if (!deductResult.rows?.length) {
        sendSSE("error", { error: "Failed to deduct credits", redirect_url: "/subscription", status: 402 });
        return res.end();
      }
      const newBalance = deductResult.rows[0].credits;
      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -TIKTOK_DANCE_CREDIT_COST,
        balanceAfter: newBalance,
        feature: "tiktok_dance",
        description: "TikTok Dance video generation"
      });
      console.log("Starting TikTok Dance generation...");
      sendSSE("progress", { step: 1, message: "Creating your dance portrait..." });
      const step1StartTime = Date.now();
      let step1Duration2 = 0;
      let step2Duration2 = 0;
      const userTier = req.user?.tierSlug || "free";
      console.log("Step 1: Generating TikTok dance portrait...");
      const referenceImage = getMienAttireReference();
      const imagePrompt = `Generate a 9:16 vertical still. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. Use the attached reference image showing authentic Mien male and female traditional attire as your visual guide. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image (but no turban for this dance scene). He is in his prime athletic tone body. The shot will be on a Brooklyn rooftop at golden hour. The character is performing a hip hop dance move.

If a female subject is present, dress her in attire matching the RIGHT side of the reference image (but no head jewelry for this scene). She has a toned athletic body. The character(s) is on top of the cliff of a towering scenic mountain in north Vietnam. She is performing a hip hop dance move.

If there are female and male characters present, dress both in their respective attire from the reference image (but no headpieces on for this scene). The characters will be in a futuristic Y2K-inspired dance scene inside a sleek, minimalist dance studio performing a synchronized dance.`;
      const dressMeAI = getDressMeAI();
      const tiktokContentParts = [
        { text: imagePrompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg"
          }
        }
      ];
      if (referenceImage) {
        tiktokContentParts.push({
          inlineData: {
            data: referenceImage,
            mimeType: "image/png"
          }
        });
      }
      let generatedImageBase64;
      try {
        const imageResponse = await dressMeAI.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [
            {
              role: "user",
              parts: tiktokContentParts
            }
          ],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              imageSize: "2K"
            }
          }
        });
        const candidate = imageResponse.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((part) => part.inlineData);
        if (!imagePart?.inlineData?.data) {
          throw new Error("No image generated in step 1");
        }
        generatedImageBase64 = imagePart.inlineData.data;
        console.log("Step 1 complete: TikTok dance image generated successfully");
        sendSSE("image", { imageBase64: generatedImageBase64 });
        sendSSE("progress", { step: 2, message: "Creating your dance video..." });
      } catch (imageError) {
        console.error("Step 1 failed:", imageError);
        await db.execute(sql6`UPDATE users SET credits = credits + ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: TIKTOK_DANCE_CREDIT_COST,
          balanceAfter: newBalance + TIKTOK_DANCE_CREDIT_COST,
          feature: "tiktok_dance",
          description: "Refund: Image generation failed"
        });
        sendSSE("error", { error: "Step 1 failed: Unable to generate image. Credits have been refunded." });
        return res.end();
      }
      step1Duration2 = Date.now() - step1StartTime;
      const step2StartTime = Date.now();
      console.log("Step 2: Generating TikTok dance video with Veo 3.1 Fast via Vertex AI...");
      const videoPrompt = `The camera pans zooms and pans with a kpop soundtrack as the subject(s) perform synchronized tiktok dance.`;
      let videoBase64 = null;
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        if (!projectId) {
          throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured for video generation");
        }
        const accessToken = await getVertexAIAccessToken();
        const location = "us-central1";
        const modelId = "veo-3.1-fast-generate-001";
        const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
        console.log("Calling Vertex AI endpoint for TikTok Dance:", vertexEndpoint);
        const veoResponse = await fetch(vertexEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            instances: [{
              prompt: videoPrompt,
              image: {
                bytesBase64Encoded: generatedImageBase64,
                mimeType: "image/png"
              }
            }],
            parameters: {
              durationSeconds: 4,
              resolution: "1080p",
              aspectRatio: "9:16"
            }
          })
        });
        if (!veoResponse.ok) {
          console.error("Vertex AI Veo API error:", veoResponse.status);
          throw new Error(`Vertex AI Veo API error: ${veoResponse.status}`);
        }
        const veoResult = await veoResponse.json();
        console.log("Vertex AI initial response:", JSON.stringify(veoResult, null, 2).substring(0, 1e3));
        let operationName = veoResult.name;
        if (!operationName) {
          throw new Error("No operation name returned from Vertex AI");
        }
        let videoData = null;
        let attempts = 0;
        const maxAttempts = 180;
        console.log("Polling operation:", operationName);
        const fetchOperationUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
        console.log("Fetch operation URL:", fetchOperationUrl);
        console.log("Waiting 5 seconds before starting to poll...");
        await new Promise((resolve2) => setTimeout(resolve2, 5e3));
        while (attempts < maxAttempts) {
          await new Promise((resolve2) => setTimeout(resolve2, 5e3));
          const pollResponse = await fetch(fetchOperationUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              operationName
            })
          });
          if (!pollResponse.ok) {
            const errorText = await pollResponse.text();
            console.error("Poll request failed:", pollResponse.status);
            attempts++;
            continue;
          }
          const pollResult = await pollResponse.json();
          if (pollResult.done) {
            if (pollResult.error) {
              console.error("Video generation error:", pollResult.error);
              throw new Error(pollResult.error.message || "Video generation failed");
            }
            videoData = pollResult.response;
            console.log("Veo poll complete, response structure:", JSON.stringify(videoData, null, 2).substring(0, 2e3));
            break;
          }
          if (attempts % 10 === 0) {
            console.log(`Still polling... attempt ${attempts}/${maxAttempts}`);
          }
          attempts++;
        }
        if (!videoData) {
          throw new Error("Video generation timed out");
        }
        console.log("Attempting to extract video data from response...");
        let generatedVideo = videoData.predictions?.[0];
        if (!generatedVideo) {
          generatedVideo = videoData.generateVideoResponse?.generatedSamples?.[0]?.video;
        }
        if (!generatedVideo) {
          generatedVideo = videoData.generatedSamples?.[0]?.video;
        }
        if (!generatedVideo) {
          generatedVideo = videoData.videos?.[0];
        }
        console.log("Found video object:", generatedVideo ? "yes" : "no");
        if (generatedVideo?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.bytesBase64Encoded;
          console.log("Got video as bytesBase64Encoded, size:", videoBase64?.length);
        } else if (generatedVideo?.video?.bytesBase64Encoded) {
          videoBase64 = generatedVideo.video.bytesBase64Encoded;
          console.log("Got video from nested structure, size:", videoBase64?.length);
        } else if (generatedVideo?.gcsUri || generatedVideo?.video?.gcsUri) {
          const gcsUri = generatedVideo.gcsUri || generatedVideo.video.gcsUri;
          console.log("Video stored at GCS URI:", gcsUri);
          const bucketPath = gcsUri.replace("gs://", "");
          const downloadUrl = `https://storage.googleapis.com/${bucketPath}`;
          const videoFetch = await fetch(downloadUrl, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (!videoFetch.ok) {
            console.error("Video download from GCS failed:", videoFetch.status);
            throw new Error(`Video download failed: ${videoFetch.status}`);
          }
          const videoBuffer2 = await videoFetch.arrayBuffer();
          videoBase64 = Buffer.from(videoBuffer2).toString("base64");
          console.log("Got video from GCS, size:", videoBase64.length, "bytes");
        } else if (typeof generatedVideo === "string" && generatedVideo.length > 1e4) {
          videoBase64 = generatedVideo;
          console.log("Got video as direct base64 string, size:", videoBase64.length);
        }
        if (!videoBase64) {
          console.error("Could not extract video. Full response:", JSON.stringify(videoData, null, 2));
          throw new Error("No video data in response");
        }
        if (videoBase64.length < 1e4) {
          console.error("Video file too small, likely an error response");
          throw new Error("Video file too small - download may have failed");
        }
        console.log("Step 2 complete: TikTok dance video generated successfully, final size:", videoBase64.length);
      } catch (videoError) {
        console.error("Step 2 failed:", videoError);
        await db.execute(sql6`UPDATE users SET credits = credits + ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: TIKTOK_DANCE_CREDIT_COST,
          balanceAfter: newBalance + TIKTOK_DANCE_CREDIT_COST,
          feature: "tiktok_dance",
          description: "Refund: Video generation failed"
        });
        sendSSE("error", {
          error: "Step 2 failed: Unable to generate video. Credits have been refunded.",
          imageGenerated: true
        });
        return res.end();
      }
      const videoBuffer = Buffer.from(videoBase64, "base64");
      const imageBuffer = Buffer.from(generatedImageBase64, "base64");
      let videoUrl;
      let imageUrl;
      if (isR2Configured()) {
        const [videoResult, imageResult] = await Promise.all([
          uploadToR2(videoBuffer, { folder: "videos/tiktok-dance", contentType: "video/mp4" }),
          uploadToR2(imageBuffer, { folder: "images/tiktok-dance", contentType: "image/png" })
        ]);
        videoUrl = videoResult.url;
        imageUrl = imageResult.url;
        console.log("TikTok Dance saved to R2:", { videoUrl, imageUrl });
      } else {
        const videoFilename = `tiktok-dance-${crypto4.randomUUID()}.mp4`;
        const imageFilename = `tiktok-dance-${crypto4.randomUUID()}.png`;
        const videoDir = path2.join(process.cwd(), "public", "generated");
        if (!fs2.existsSync(videoDir)) {
          fs2.mkdirSync(videoDir, { recursive: true });
        }
        fs2.writeFileSync(path2.join(videoDir, videoFilename), videoBuffer);
        fs2.writeFileSync(path2.join(videoDir, imageFilename), imageBuffer);
        videoUrl = `/generated/${videoFilename}`;
        imageUrl = `/generated/${imageFilename}`;
        console.log("TikTok Dance saved locally:", { videoUrl, imageUrl });
      }
      await db.insert(artGenerations).values({
        userId,
        type: "tiktok_dance",
        imageUrl,
        videoUrl,
        prompt: imagePrompt.substring(0, 500),
        creditsUsed: TIKTOK_DANCE_CREDIT_COST
      });
      step2Duration2 = Date.now() - step2StartTime;
      const totalDuration = step1Duration2 + step2Duration2;
      console.log("TikTok Dance generation complete!");
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "tiktok_dance",
        subFeature: "vertical_dance_video",
        creditsUsed: TIKTOK_DANCE_CREDIT_COST,
        durationMs: totalDuration,
        metadata: {
          videoUrl,
          imageUrl,
          step1DurationMs: step1Duration2,
          step2DurationMs: step2Duration2,
          totalDurationMs: totalDuration,
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast",
          userTier,
          outputAspectRatio: "9:16",
          videoDurationSeconds: 4,
          videoResolution: "1080p",
          step1Success: true,
          step2Success: true
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      sendSSE("video", { videoUrl });
      sendSSE("complete", {
        success: true,
        creditsUsed: TIKTOK_DANCE_CREDIT_COST
      });
      res.end();
      awardXp(userId, "ai_video_tiktok_dance").catch(() => {
      });
    } catch (error) {
      console.error("TikTok Dance error:", error);
      const userTier = req.user?.tierSlug || "free";
      logFeatureUsage({
        userId,
        category: "ai_generation",
        featureName: "tiktok_dance",
        subFeature: "vertical_dance_video",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          userTier,
          step1DurationMs: step1Duration || 0,
          step2DurationMs: step2Duration || 0,
          outputAspectRatio: "9:16",
          step1Model: "gemini-3-pro-image-preview",
          step2Model: "veo-3.1-fast"
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      try {
        await db.execute(sql6`UPDATE users SET credits = credits + ${TIKTOK_DANCE_CREDIT_COST} WHERE id = ${userId}`);
        await db.insert(creditTransactions).values({
          userId,
          type: "adjustment",
          amount: TIKTOK_DANCE_CREDIT_COST,
          balanceAfter: 0,
          feature: "tiktok_dance",
          description: "Refund: Unexpected error"
        });
      } catch (refundError) {
        console.error("Refund failed:", refundError);
      }
      sendSSE("error", { error: "TikTok Dance generation failed. Credits have been refunded." });
      res.end();
    }
  });
  app2.get("/api/art-generations", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const generations = await db.select().from(artGenerations).where(eq13(artGenerations.userId, userId)).orderBy(desc3(artGenerations.createdAt));
      res.json(generations);
    } catch (error) {
      console.error("Error fetching art generations:", error);
      res.status(500).json({ error: "Failed to fetch art generations" });
    }
  });
  app2.get("/api/system-prompt", requireAuth, (req, res) => {
    res.json({
      systemPromptToEnglish,
      systemPromptToMien,
      videoExtractionPrompt
    });
  });
  app2.post("/api/transcribe-audio", requireAuth, async (req, res) => {
    try {
      const { audioData, mimeType } = req.body;
      if (!audioData) {
        return res.status(400).json({ error: "Audio data is required" });
      }
      console.log("Transcribing audio with Gemini 2.5 Flash...");
      const rawResponse = await transcribeAudio(audioData, mimeType || "audio/m4a");
      console.log("Audio transcription complete, length:", rawResponse.length);
      let summary = "";
      let transcription = rawResponse;
      const summaryMatch = rawResponse.match(/SUMMARY:\s*(.+?)(?=TRANSCRIPTION:|$)/si);
      const transcriptionMatch = rawResponse.match(/TRANSCRIPTION:\s*(.+)/si);
      if (summaryMatch) {
        summary = summaryMatch[1].trim();
      }
      if (transcriptionMatch) {
        transcription = transcriptionMatch[1].trim();
      }
      res.json({ summary, transcription });
    } catch (error) {
      console.error("Audio transcription error:", error);
      res.status(500).json({ error: "Audio transcription failed. Please try again." });
    }
  });
  const oauthStateStore = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [state, entry] of oauthStateStore.entries()) {
      if (now - entry.createdAt > 10 * 60 * 1e3) oauthStateStore.delete(state);
    }
  }, 5 * 60 * 1e3);
  app2.get("/api/auth/config/:provider", (req, res) => {
    const { provider } = req.params;
    const config = getOAuthConfig(provider);
    if (!config) {
      return res.status(400).json({ error: "Invalid provider" });
    }
    const state = crypto4.randomBytes(32).toString("hex");
    oauthStateStore.set(state, { provider, createdAt: Date.now() });
    res.json({
      clientId: config.clientId,
      hasCredentials: !!(config.clientId && config.clientSecret),
      state
    });
  });
  app2.post("/api/auth/callback/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      const { code, redirectUri, codeVerifier, state } = req.body;
      if (state) {
        const storedState = oauthStateStore.get(state);
        if (!storedState || storedState.provider !== provider) {
          return res.status(400).json({ error: "Invalid OAuth state parameter" });
        }
        oauthStateStore.delete(state);
        if (Date.now() - storedState.createdAt > 10 * 60 * 1e3) {
          return res.status(400).json({ error: "OAuth state expired, please try again" });
        }
      }
      const config = getOAuthConfig(provider);
      if (!config || !config.clientId || !config.clientSecret) {
        return res.status(400).json({ error: `${provider} OAuth not configured. Please add API credentials.` });
      }
      let tokenResponse;
      let userInfo;
      if (provider === "google") {
        const tokenParams = new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: codeVerifier || ""
        });
        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenParams
        });
        tokenResponse = await tokenRes.json();
        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error_description || tokenResponse.error });
        }
        const userRes = await fetch(config.userInfoUrl, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        userInfo = await userRes.json();
        const user = await findOrCreateUser(
          "google",
          userInfo.id,
          userInfo.email || "",
          userInfo.name || "User",
          userInfo.picture || ""
        );
        const fullUser = await db.select().from(users).where(eq13(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }
        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "google" });
        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: userInfo.email || "", connected: true },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: "", connected: false }
            ]
          }
        });
      }
      if (provider === "facebook") {
        const tokenUrl = `${config.tokenUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${config.clientSecret}&code=${code}`;
        const tokenRes = await fetch(tokenUrl);
        tokenResponse = await tokenRes.json();
        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error.message || "Facebook auth failed" });
        }
        const userRes = await fetch(`${config.userInfoUrl}&access_token=${tokenResponse.access_token}`);
        userInfo = await userRes.json();
        const user = await findOrCreateUser(
          "facebook",
          userInfo.id,
          userInfo.email || "",
          userInfo.name || "User",
          userInfo.picture?.data?.url || ""
        );
        const fullUser = await db.select().from(users).where(eq13(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }
        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "facebook" });
        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: userInfo.name || "", connected: true },
              { provider: "twitter", username: "", connected: false }
            ]
          }
        });
      }
      if (provider === "twitter") {
        const tokenParams = new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: config.clientId,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier || ""
        });
        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`
          },
          body: tokenParams
        });
        tokenResponse = await tokenRes.json();
        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error_description || tokenResponse.error });
        }
        const userRes = await fetch(config.userInfoUrl, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        userInfo = await userRes.json();
        const user = await findOrCreateUser(
          "twitter",
          userInfo.data.id,
          "",
          userInfo.data.name || userInfo.data.username || "User",
          userInfo.data.profile_image_url || ""
        );
        const fullUser = await db.select().from(users).where(eq13(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }
        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "twitter" });
        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: `@${userInfo.data.username}`, connected: true }
            ]
          }
        });
      }
      if (provider === "instagram") {
        const formData = new URLSearchParams();
        formData.append("client_id", config.clientId);
        formData.append("client_secret", config.clientSecret);
        formData.append("grant_type", "authorization_code");
        formData.append("redirect_uri", redirectUri);
        formData.append("code", code);
        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData
        });
        tokenResponse = await tokenRes.json();
        if (tokenResponse.error_message) {
          return res.status(400).json({ error: tokenResponse.error_message || "Instagram auth failed" });
        }
        const userRes = await fetch(`${config.userInfoUrl}&access_token=${tokenResponse.access_token}`);
        userInfo = await userRes.json();
        const user = await findOrCreateUser(
          "instagram",
          userInfo.id,
          "",
          userInfo.username || "User",
          ""
        );
        const fullUser = await db.select().from(users).where(eq13(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }
        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "instagram" });
        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: "", connected: false },
              { provider: "instagram", username: `@${userInfo.username}`, connected: true },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: "", connected: false }
            ]
          }
        });
      }
      if (provider === "tiktok") {
        const tokenParams = new URLSearchParams({
          client_key: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code_verifier: codeVerifier || ""
        });
        const tokenRes = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenParams
        });
        tokenResponse = await tokenRes.json();
        if (tokenResponse.error) {
          return res.status(400).json({ error: tokenResponse.error_description || tokenResponse.error });
        }
        const userRes = await fetch(`${config.userInfoUrl}?fields=open_id,display_name,avatar_url`, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        userInfo = await userRes.json();
        const userData = userInfo.data?.user || {};
        const user = await findOrCreateUser(
          "tiktok",
          userData.open_id,
          "",
          userData.display_name || "User",
          userData.avatar_url || ""
        );
        const fullUser = await db.select().from(users).where(eq13(users.id, user.id)).limit(1);
        if (fullUser.length > 0 && fullUser[0].isDisabled) {
          return res.status(403).json({ error: "Account disabled. Please contact support." });
        }
        const sessionToken = await createSession(user.id);
        await logActivity(user.id, "user_login", { provider: "tiktok" });
        return res.json({
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role,
            connectedAccounts: [
              { provider: "google", username: "", connected: false },
              { provider: "youtube", username: "", connected: false },
              { provider: "tiktok", username: userData.display_name || "", connected: true },
              { provider: "instagram", username: "", connected: false },
              { provider: "facebook", username: "", connected: false },
              { provider: "twitter", username: "", connected: false }
            ]
          }
        });
      }
      return res.status(400).json({ error: `Provider ${provider} is not supported` });
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Authentication failed. Please try again." });
    }
  });
  app2.get("/api/auth/session", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.substring(7);
    try {
      const sessionResults = await db.select().from(sessions).where(and5(eq13(sessions.token, token), gt4(sessions.expiresAt, /* @__PURE__ */ new Date()))).limit(1);
      if (sessionResults.length === 0) {
        return res.status(401).json({ error: "Invalid session" });
      }
      const session = sessionResults[0];
      const userResults = await db.select().from(users).where(eq13(users.id, session.userId)).limit(1);
      if (userResults.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }
      const user = userResults[0];
      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          provider: user.provider,
          role: user.role,
          connectedAccounts: [
            { provider: "google", username: user.provider === "google" ? user.email : "", connected: user.provider === "google" },
            { provider: "youtube", username: "", connected: false },
            { provider: "tiktok", username: user.provider === "tiktok" ? user.displayName : "", connected: user.provider === "tiktok" },
            { provider: "instagram", username: user.provider === "instagram" ? user.displayName : "", connected: user.provider === "instagram" },
            { provider: "facebook", username: user.provider === "facebook" ? user.displayName : "", connected: user.provider === "facebook" },
            { provider: "twitter", username: user.provider === "twitter" ? user.displayName : "", connected: user.provider === "twitter" }
          ],
          totalXp: user.totalXp ?? 0,
          level: user.level ?? 1
        }
      });
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ error: "Failed to check session" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        await db.delete(sessions).where(eq13(sessions.token, token));
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    res.json({ success: true });
  });
  app2.get("/api/admin/users", requireAuth, requireModerator, async (req, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc3(users.createdAt));
      res.json({ users: allUsers });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (role && !["user", "moderator", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const updatedUser = await db.update(users).set({ role }).where(eq13(users.id, id)).returning();
      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      await logActivity(req.user.id, "admin_update_user_role", {
        targetUserId: id,
        newRole: role
      });
      pushUserUpdated({
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        displayName: updatedUser[0].displayName,
        avatar: updatedUser[0].avatar,
        provider: updatedUser[0].provider,
        role: updatedUser[0].role,
        createdAt: updatedUser[0].createdAt.toISOString(),
        lastLoginAt: updatedUser[0].lastLoginAt.toISOString()
      });
      res.json({ user: updatedUser[0] });
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.get("/api/admin/metrics", requireAuth, requireModerator, async (req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
      const [totalUsersResult] = await db.select({ count: count2() }).from(users);
      const [activeSessionsResult] = await db.select({ count: count2() }).from(sessions).where(gt4(sessions.expiresAt, now));
      const [dauResult] = await db.select({ count: count2() }).from(users).where(gte2(users.lastLoginAt, oneDayAgo));
      const [adminCountResult] = await db.select({ count: count2() }).from(users).where(eq13(users.role, "admin"));
      const [modCountResult] = await db.select({ count: count2() }).from(users).where(eq13(users.role, "moderator"));
      const [groupsCountResult] = await db.select({ count: count2() }).from(groups);
      const [postsCountResult] = await db.select({ count: count2() }).from(posts);
      res.json({
        metrics: {
          totalUsers: totalUsersResult.count,
          activeSessions: activeSessionsResult.count,
          dailyActiveUsers: dauResult.count,
          groupsCount: groupsCountResult.count,
          postsCount: postsCountResult.count,
          adminCount: adminCountResult.count,
          moderatorCount: modCountResult.count
        }
      });
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });
  app2.get("/api/admin/groups", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allGroups = await db.select().from(groups).orderBy(desc3(groups.createdAt));
      res.json({ groups: allGroups });
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });
  app2.post("/api/admin/groups", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Group name is required" });
      }
      const newGroup = await db.insert(groups).values({ name, description }).returning();
      await logActivity(req.user.id, "admin_create_group", {
        groupId: newGroup[0].id,
        groupName: name
      });
      pushGroupCreated({
        id: newGroup[0].id,
        name: newGroup[0].name,
        description: newGroup[0].description,
        memberCount: 0,
        createdAt: newGroup[0].createdAt.toISOString()
      });
      res.json({ group: newGroup[0] });
    } catch (error) {
      console.error("Failed to create group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });
  app2.patch("/api/admin/groups/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const updatedGroup = await db.update(groups).set({ name, description }).where(eq13(groups.id, id)).returning();
      if (updatedGroup.length === 0) {
        return res.status(404).json({ error: "Group not found" });
      }
      await logActivity(req.user.id, "admin_update_group", {
        groupId: id,
        newName: name
      });
      const [memberCountResult] = await db.select({ count: count2() }).from(groupMembers).where(eq13(groupMembers.groupId, id));
      pushGroupUpdated({
        id: updatedGroup[0].id,
        name: updatedGroup[0].name,
        description: updatedGroup[0].description,
        memberCount: memberCountResult.count,
        createdAt: updatedGroup[0].createdAt.toISOString()
      });
      res.json({ group: updatedGroup[0] });
    } catch (error) {
      console.error("Failed to update group:", error);
      res.status(500).json({ error: "Failed to update group" });
    }
  });
  app2.delete("/api/admin/groups/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deletedGroup = await db.delete(groups).where(eq13(groups.id, id)).returning();
      if (deletedGroup.length === 0) {
        return res.status(404).json({ error: "Group not found" });
      }
      await logActivity(req.user.id, "admin_delete_group", {
        groupId: id,
        groupName: deletedGroup[0].name
      });
      pushGroupDeleted(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete group:", error);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });
  app2.post("/api/admin/groups/:id/members", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, role = "user" } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const groupExists = await db.select().from(groups).where(eq13(groups.id, id)).limit(1);
      if (groupExists.length === 0) {
        return res.status(404).json({ error: "Group not found" });
      }
      const userExists = await db.select().from(users).where(eq13(users.id, userId)).limit(1);
      if (userExists.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const existingMember = await db.select().from(groupMembers).where(and5(eq13(groupMembers.groupId, id), eq13(groupMembers.userId, userId))).limit(1);
      if (existingMember.length > 0) {
        return res.status(400).json({ error: "User is already a member of this group" });
      }
      const newMember = await db.insert(groupMembers).values({ groupId: id, userId, role }).returning();
      await logActivity(req.user.id, "admin_add_group_member", {
        groupId: id,
        memberId: userId,
        role
      });
      res.json({ member: newMember[0] });
    } catch (error) {
      console.error("Failed to add group member:", error);
      res.status(500).json({ error: "Failed to add group member" });
    }
  });
  app2.delete("/api/admin/groups/:id/members/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id, userId } = req.params;
      const deletedMember = await db.delete(groupMembers).where(and5(eq13(groupMembers.groupId, id), eq13(groupMembers.userId, userId))).returning();
      if (deletedMember.length === 0) {
        return res.status(404).json({ error: "Member not found in group" });
      }
      await logActivity(req.user.id, "admin_remove_group_member", {
        groupId: id,
        memberId: userId
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove group member:", error);
      res.status(500).json({ error: "Failed to remove group member" });
    }
  });
  const searchRateLimitStore = /* @__PURE__ */ new Map();
  app2.get("/api/users/search", (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = searchRateLimitStore.get(ip);
    if (!entry || now > entry.resetAt) {
      searchRateLimitStore.set(ip, { count: 1, resetAt: now + 6e4 });
      return next();
    }
    if (entry.count >= 15) {
      return res.status(429).json({ error: "Too many search requests" });
    }
    entry.count++;
    next();
  }, async (req, res) => {
    try {
      const { q, limit: queryLimit = "20", offset: queryOffset = "0" } = req.query;
      const searchQuery = String(q || "").trim().toLowerCase();
      if (!searchQuery || searchQuery.length < 2) {
        return res.json({ users: [], total: 0 });
      }
      const searchResults = await db.select({
        id: users.id,
        displayName: users.displayName,
        avatar: users.avatar,
        bio: users.bio
      }).from(users).where(sql6`LOWER(${users.displayName}) LIKE ${"%" + searchQuery + "%"}`).limit(Number(queryLimit)).offset(Number(queryOffset));
      const formattedUsers = searchResults.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        avatar: u.avatar,
        bio: u.bio,
        username: u.displayName?.toLowerCase().replace(/\s+/g, "") || "user"
      }));
      res.json({ users: formattedUsers });
    } catch (error) {
      console.error("Failed to search users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });
  app2.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const { displayName, avatar, bio } = req.body;
      const updateData = {};
      if (displayName !== void 0) {
        if (typeof displayName !== "string" || displayName.trim().length < 1 || displayName.trim().length > 100) {
          return res.status(400).json({ error: "Display name must be 1-100 characters" });
        }
        updateData.displayName = displayName.trim();
      }
      if (bio !== void 0) {
        if (bio !== null && typeof bio === "string") {
          if (bio.length > 500) {
            return res.status(400).json({ error: "Bio must be 500 characters or less" });
          }
          updateData.bio = bio.trim() || null;
        } else if (bio === null) {
          updateData.bio = null;
        }
      }
      if (avatar !== void 0) {
        if (avatar !== null && typeof avatar === "string" && avatar.trim()) {
          updateData.avatar = avatar.trim();
        } else if (avatar === null) {
          updateData.avatar = null;
        }
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      const updatedUser = await db.update(users).set(updateData).where(eq13(users.id, req.user.id)).returning();
      res.json({
        user: {
          id: updatedUser[0].id,
          displayName: updatedUser[0].displayName,
          avatar: updatedUser[0].avatar,
          bio: updatedUser[0].bio,
          email: updatedUser[0].email
        }
      });
    } catch (error) {
      console.error("Failed to update user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.post("/api/users/me/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const filename = `avatar-${req.user.id}-${Date.now()}.webp`;
      const filepath = path2.join(UPLOAD_DIR, filename);
      await sharp(req.file.buffer).resize(400, 400, { fit: "cover" }).webp({ quality: 85 }).toFile(filepath);
      const avatarUrl = `/uploads/images/${filename}`;
      await db.update(users).set({ avatar: avatarUrl }).where(eq13(users.id, req.user.id));
      res.json({ avatar: avatarUrl });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });
  app2.get("/api/users/me/privacy", requireAuth, async (req, res) => {
    try {
      const user = await db.select({ defaultPostVisibility: users.defaultPostVisibility }).from(users).where(eq13(users.id, req.user.id)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ defaultPostVisibility: user[0].defaultPostVisibility });
    } catch (error) {
      console.error("Failed to get privacy settings:", error);
      res.status(500).json({ error: "Failed to get privacy settings" });
    }
  });
  app2.patch("/api/users/me/privacy", requireAuth, async (req, res) => {
    try {
      const { defaultPostVisibility } = req.body;
      const validVisibilities = ["public", "followers", "private"];
      if (!validVisibilities.includes(defaultPostVisibility)) {
        return res.status(400).json({ error: "Invalid visibility option. Must be: public, followers, or private" });
      }
      await db.update(users).set({ defaultPostVisibility }).where(eq13(users.id, req.user.id));
      res.json({ defaultPostVisibility });
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
      res.status(500).json({ error: "Failed to update privacy settings" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      let currentUserId = null;
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const session = await db.select().from(sessions).where(eq13(sessions.token, token)).limit(1);
        if (session.length > 0) {
          currentUserId = session[0].userId;
        }
      }
      const user = await db.select().from(users).where(eq13(users.id, id)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const [followerCount] = await db.select({ count: count2() }).from(follows).where(eq13(follows.followeeId, id));
      const [followingCount] = await db.select({ count: count2() }).from(follows).where(eq13(follows.followerId, id));
      let isFollowing = false;
      let isFriend = false;
      let isMuted = false;
      let isBlocked = false;
      let isBlockedBy = false;
      if (currentUserId && currentUserId !== id) {
        const followCheck = await db.select().from(follows).where(and5(eq13(follows.followerId, currentUserId), eq13(follows.followeeId, id))).limit(1);
        isFollowing = followCheck.length > 0;
        if (isFollowing) {
          const followBackCheck = await db.select().from(follows).where(and5(eq13(follows.followerId, id), eq13(follows.followeeId, currentUserId))).limit(1);
          isFriend = followBackCheck.length > 0;
        }
        const [muteCheck] = await db.select().from(userMutes).where(and5(eq13(userMutes.muterId, currentUserId), eq13(userMutes.mutedId, id))).limit(1);
        const [blockCheck] = await db.select().from(userBlocks).where(and5(eq13(userBlocks.blockerId, currentUserId), eq13(userBlocks.blockedId, id))).limit(1);
        const [blockedByCheck] = await db.select().from(userBlocks).where(and5(eq13(userBlocks.blockerId, id), eq13(userBlocks.blockedId, currentUserId))).limit(1);
        isMuted = !!muteCheck;
        isBlocked = !!blockCheck;
        isBlockedBy = !!blockedByCheck;
      }
      const [postCount] = await db.select({ count: count2() }).from(posts).where(eq13(posts.userId, id));
      res.json({
        user: {
          id: user[0].id,
          displayName: user[0].displayName,
          avatar: user[0].avatar,
          bio: user[0].bio,
          role: user[0].role,
          createdAt: user[0].createdAt,
          followersCount: followerCount.count,
          followingCount: followingCount.count,
          postsCount: postCount.count,
          isFollowing,
          isFriend,
          isMuted,
          isBlocked,
          isBlockedBy,
          totalXp: user[0].totalXp ?? 0,
          level: user[0].level ?? 1,
          tierSlug: user[0].tierSlug
        }
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.get("/api/users/:id/posts", async (req, res) => {
    try {
      const { id: userId } = req.params;
      const authHeader = req.headers.authorization;
      let currentUserId = null;
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const session = await db.select().from(sessions).where(eq13(sessions.token, token)).limit(1);
        if (session.length > 0) {
          currentUserId = session[0].userId;
        }
      }
      if (currentUserId && currentUserId !== userId) {
        const blockCheck = await db.select().from(userBlocks).where(or3(
          and5(eq13(userBlocks.blockerId, currentUserId), eq13(userBlocks.blockedId, userId)),
          and5(eq13(userBlocks.blockerId, userId), eq13(userBlocks.blockedId, currentUserId))
        )).limit(1);
        if (blockCheck.length > 0) {
          return res.json({ posts: [], blocked: true });
        }
      }
      let visibilityFilter;
      if (currentUserId === userId) {
        visibilityFilter = eq13(posts.userId, userId);
      } else if (currentUserId) {
        const isFollower = await db.select().from(follows).where(and5(eq13(follows.followerId, currentUserId), eq13(follows.followeeId, userId))).limit(1);
        if (isFollower.length > 0) {
          visibilityFilter = and5(
            eq13(posts.userId, userId),
            or3(eq13(posts.visibility, "public"), eq13(posts.visibility, "followers"))
          );
        } else {
          visibilityFilter = and5(eq13(posts.userId, userId), eq13(posts.visibility, "public"));
        }
      } else {
        visibilityFilter = and5(eq13(posts.userId, userId), eq13(posts.visibility, "public"));
      }
      const userPosts = await db.select({
        post: posts,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          tierSlug: users.tierSlug,
          level: users.level,
          role: users.role
        },
        video: uploadedVideos
      }).from(posts).leftJoin(users, eq13(posts.userId, users.id)).leftJoin(uploadedVideos, eq13(posts.videoId, uploadedVideos.id)).where(visibilityFilter).orderBy(desc3(posts.createdAt));
      let likedPostIds = /* @__PURE__ */ new Set();
      if (currentUserId) {
        const userLikes = await db.select({ postId: likes.postId }).from(likes).where(eq13(likes.userId, currentUserId));
        likedPostIds = new Set(userLikes.map((l) => l.postId));
      }
      const formattedPosts = userPosts.map((row) => ({
        id: row.post.id,
        userId: row.post.userId,
        user: row.user ? {
          ...row.user,
          username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user"
        } : null,
        platform: row.post.platform,
        mediaUrl: row.post.mediaUrl,
        embedCode: row.post.embedCode,
        caption: row.post.caption,
        captionRich: row.post.captionRich,
        images: row.post.images || [],
        video: row.video ? {
          id: row.video.id,
          bunnyVideoId: row.video.bunnyVideoId,
          title: row.video.title,
          duration: row.video.duration,
          width: row.video.width,
          height: row.video.height,
          playbackUrl: row.video.playbackUrl,
          thumbnailUrl: row.video.thumbnailUrl,
          previewUrl: row.video.previewUrl,
          status: row.video.status,
          encodingProgress: row.video.encodingProgress,
          failureReason: row.video.failureReason,
          createdAt: row.video.createdAt,
          readyAt: row.video.readyAt
        } : null,
        videoId: row.post.videoId,
        visibility: row.post.visibility,
        likesCount: parseInt(row.post.likesCount || "0"),
        commentsCount: parseInt(row.post.commentsCount || "0"),
        isLiked: likedPostIds.has(row.post.id),
        createdAt: row.post.createdAt
      }));
      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });
  app2.get("/api/users/active", async (req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
      const activeUsers = await db.select({
        id: users.id,
        displayName: users.displayName,
        avatar: users.avatar
      }).from(users).where(gte2(users.lastLoginAt, thirtyDaysAgo)).limit(50);
      const formattedUsers = activeUsers.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        avatar: u.avatar,
        username: u.displayName?.toLowerCase().replace(/\s+/g, "") || "user"
      }));
      res.json({ users: formattedUsers });
    } catch (error) {
      console.error("Failed to fetch active users:", error);
      res.status(500).json({ error: "Failed to fetch active users" });
    }
  });
  app2.get("/api/posts/trending", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let currentUserId = null;
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const session = await db.select().from(sessions).where(eq13(sessions.token, token)).limit(1);
        if (session.length > 0) {
          currentUserId = session[0].userId;
        }
      }
      let blockedUserIds = /* @__PURE__ */ new Set();
      let mutedUserIds = /* @__PURE__ */ new Set();
      if (currentUserId) {
        const blockedByMe = await db.select({ blockedId: userBlocks.blockedId }).from(userBlocks).where(eq13(userBlocks.blockerId, currentUserId));
        const blockedMe = await db.select({ blockerId: userBlocks.blockerId }).from(userBlocks).where(eq13(userBlocks.blockedId, currentUserId));
        blockedByMe.forEach((b) => blockedUserIds.add(b.blockedId));
        blockedMe.forEach((b) => blockedUserIds.add(b.blockerId));
        const mutedByMe = await db.select({ mutedId: userMutes.mutedId }).from(userMutes).where(eq13(userMutes.muterId, currentUserId));
        mutedByMe.forEach((m) => mutedUserIds.add(m.mutedId));
      }
      let whereClause = eq13(posts.visibility, "public");
      if (blockedUserIds.size > 0) {
        const blockedArray = Array.from(blockedUserIds);
        whereClause = and5(
          eq13(posts.visibility, "public"),
          not(inArray3(posts.userId, blockedArray))
        );
      }
      const allPosts = await db.select({
        post: posts,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          tierSlug: users.tierSlug,
          level: users.level,
          role: users.role
        },
        video: uploadedVideos
      }).from(posts).leftJoin(users, eq13(posts.userId, users.id)).leftJoin(uploadedVideos, eq13(posts.videoId, uploadedVideos.id)).where(whereClause);
      let likedPostIds = /* @__PURE__ */ new Set();
      if (currentUserId) {
        const userLikes = await db.select({ postId: likes.postId }).from(likes).where(eq13(likes.userId, currentUserId));
        likedPostIds = new Set(userLikes.map((l) => l.postId));
      }
      const now = Date.now();
      const HOUR = 36e5;
      const scoredPosts = allPosts.map((row) => {
        const likesCount = parseInt(row.post.likesCount || "0");
        const commentsCount = parseInt(row.post.commentsCount || "0");
        const ageHours = (now - new Date(row.post.createdAt).getTime()) / HOUR;
        const recencyDecay = Math.max(0, 1 - ageHours / 168);
        const trendingScore = (likesCount * 2 + commentsCount * 3) * (0.5 + recencyDecay * 0.5);
        return {
          id: row.post.id,
          userId: row.post.userId,
          user: row.user ? {
            ...row.user,
            username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user"
          } : null,
          platform: row.post.platform,
          mediaUrl: row.post.mediaUrl,
          embedCode: row.post.embedCode,
          caption: row.post.caption,
          captionRich: row.post.captionRich,
          images: row.post.images || [],
          video: row.video ? {
            id: row.video.id,
            bunnyVideoId: row.video.bunnyVideoId,
            title: row.video.title,
            duration: row.video.duration,
            width: row.video.width,
            height: row.video.height,
            playbackUrl: row.video.playbackUrl,
            thumbnailUrl: row.video.thumbnailUrl,
            previewUrl: row.video.previewUrl,
            status: row.video.status,
            encodingProgress: row.video.encodingProgress,
            failureReason: row.video.failureReason,
            createdAt: row.video.createdAt,
            readyAt: row.video.readyAt
          } : null,
          videoId: row.post.videoId,
          visibility: row.post.visibility,
          likesCount,
          commentsCount,
          isLiked: likedPostIds.has(row.post.id),
          createdAt: row.post.createdAt,
          trendingScore
        };
      });
      const filteredPosts = scoredPosts.filter((post) => !mutedUserIds.has(post.userId));
      filteredPosts.sort((a, b) => {
        const tierDiff = getTierPriority(b.user?.tierSlug ?? void 0) - getTierPriority(a.user?.tierSlug ?? void 0);
        if (tierDiff !== 0) return tierDiff;
        return b.trendingScore - a.trendingScore;
      });
      res.json({ posts: filteredPosts.slice(0, 50) });
    } catch (error) {
      console.error("Failed to fetch trending posts:", error);
      res.status(500).json({ error: "Failed to fetch trending posts" });
    }
  });
  app2.get("/api/posts/following", requireAuth, async (req, res) => {
    try {
      const userFollows = await db.select({ followeeId: follows.followeeId }).from(follows).where(eq13(follows.followerId, req.user.id));
      let followeeIds = userFollows.map((f) => f.followeeId);
      if (followeeIds.length === 0) {
        return res.json({ posts: [] });
      }
      const blockedByMe = await db.select({ blockedId: userBlocks.blockedId }).from(userBlocks).where(eq13(userBlocks.blockerId, req.user.id));
      const blockedMe = await db.select({ blockerId: userBlocks.blockerId }).from(userBlocks).where(eq13(userBlocks.blockedId, req.user.id));
      const blockedUserIds = /* @__PURE__ */ new Set([
        ...blockedByMe.map((b) => b.blockedId),
        ...blockedMe.map((b) => b.blockerId)
      ]);
      followeeIds = followeeIds.filter((id) => !blockedUserIds.has(id));
      if (followeeIds.length === 0) {
        return res.json({ posts: [] });
      }
      const followingPosts = await db.select({
        post: posts,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          tierSlug: users.tierSlug,
          level: users.level,
          role: users.role
        },
        video: uploadedVideos
      }).from(posts).leftJoin(users, eq13(posts.userId, users.id)).leftJoin(uploadedVideos, eq13(posts.videoId, uploadedVideos.id)).where(and5(
        inArray3(posts.userId, followeeIds),
        or3(eq13(posts.visibility, "public"), eq13(posts.visibility, "followers"))
      )).orderBy(desc3(posts.createdAt));
      const userLikes = await db.select({ postId: likes.postId }).from(likes).where(eq13(likes.userId, req.user.id));
      const likedPostIds = new Set(userLikes.map((l) => l.postId));
      const formattedPosts = followingPosts.map((row) => ({
        id: row.post.id,
        userId: row.post.userId,
        user: row.user ? {
          ...row.user,
          username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user"
        } : null,
        platform: row.post.platform,
        mediaUrl: row.post.mediaUrl,
        embedCode: row.post.embedCode,
        caption: row.post.caption,
        captionRich: row.post.captionRich,
        images: row.post.images || [],
        video: row.video ? {
          id: row.video.id,
          bunnyVideoId: row.video.bunnyVideoId,
          title: row.video.title,
          duration: row.video.duration,
          width: row.video.width,
          height: row.video.height,
          playbackUrl: row.video.playbackUrl,
          thumbnailUrl: row.video.thumbnailUrl,
          previewUrl: row.video.previewUrl,
          status: row.video.status,
          encodingProgress: row.video.encodingProgress,
          failureReason: row.video.failureReason,
          createdAt: row.video.createdAt,
          readyAt: row.video.readyAt
        } : null,
        videoId: row.post.videoId,
        visibility: row.post.visibility,
        likesCount: parseInt(row.post.likesCount || "0"),
        commentsCount: parseInt(row.post.commentsCount || "0"),
        isLiked: likedPostIds.has(row.post.id),
        createdAt: row.post.createdAt
      }));
      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error("Failed to fetch following posts:", error);
      res.status(500).json({ error: "Failed to fetch following posts" });
    }
  });
  app2.post("/api/users/:userId/follow", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      const existingFollow = await db.select().from(follows).where(and5(eq13(follows.followerId, req.user.id), eq13(follows.followeeId, userId))).limit(1);
      if (existingFollow.length > 0) {
        await db.delete(follows).where(
          and5(eq13(follows.followerId, req.user.id), eq13(follows.followeeId, userId))
        );
        res.json({ following: false });
      } else {
        await db.insert(follows).values({
          followerId: req.user.id,
          followeeId: userId
        });
        sendNewFollowerNotification(userId, req.user.id).catch((err) => {
          console.error("Failed to send follow notification:", err);
        });
        res.json({ following: true });
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      res.status(500).json({ error: "Failed to toggle follow" });
    }
  });
  app2.get("/api/users/:userId/following", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const existingFollow = await db.select().from(follows).where(and5(eq13(follows.followerId, req.user.id), eq13(follows.followeeId, userId))).limit(1);
      res.json({ following: existingFollow.length > 0 });
    } catch (error) {
      console.error("Failed to check follow status:", error);
      res.status(500).json({ error: "Failed to check follow status" });
    }
  });
  app2.post("/api/users/:userId/mute", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot mute yourself" });
      }
      const targetUser = await db.select().from(users).where(eq13(users.id, userId)).limit(1);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      if (targetUser[0].role === "admin") {
        return res.status(403).json({ error: "Cannot mute administrators" });
      }
      const existingMute = await db.select().from(userMutes).where(and5(eq13(userMutes.muterId, req.user.id), eq13(userMutes.mutedId, userId))).limit(1);
      if (existingMute.length > 0) {
        await db.delete(userMutes).where(eq13(userMutes.id, existingMute[0].id));
        res.json({ muted: false, message: "User unmuted" });
      } else {
        await db.insert(userMutes).values({
          muterId: req.user.id,
          mutedId: userId
        });
        res.json({ muted: true, message: "User muted" });
      }
    } catch (error) {
      console.error("Failed to toggle mute:", error);
      res.status(500).json({ error: "Failed to update mute status" });
    }
  });
  app2.post("/api/users/:userId/block", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot block yourself" });
      }
      const targetUser = await db.select().from(users).where(eq13(users.id, userId)).limit(1);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      if (targetUser[0].role === "admin") {
        return res.status(403).json({ error: "Cannot block administrators" });
      }
      const existingBlock = await db.select().from(userBlocks).where(and5(eq13(userBlocks.blockerId, req.user.id), eq13(userBlocks.blockedId, userId))).limit(1);
      if (existingBlock.length > 0) {
        await db.delete(userBlocks).where(eq13(userBlocks.id, existingBlock[0].id));
        res.json({ blocked: false, message: "User unblocked" });
      } else {
        await db.delete(follows).where(
          or3(
            and5(eq13(follows.followerId, req.user.id), eq13(follows.followeeId, userId)),
            and5(eq13(follows.followerId, userId), eq13(follows.followeeId, req.user.id))
          )
        );
        await db.delete(userMutes).where(
          or3(
            and5(eq13(userMutes.muterId, req.user.id), eq13(userMutes.mutedId, userId)),
            and5(eq13(userMutes.muterId, userId), eq13(userMutes.mutedId, req.user.id))
          )
        );
        await db.insert(userBlocks).values({
          blockerId: req.user.id,
          blockedId: userId
        });
        res.json({ blocked: true, message: "User blocked" });
      }
    } catch (error) {
      console.error("Failed to toggle block:", error);
      res.status(500).json({ error: "Failed to update block status" });
    }
  });
  app2.get("/api/users/me/muted", requireAuth, async (req, res) => {
    try {
      const mutedUsers = await db.select({
        id: users.id,
        displayName: users.displayName,
        avatar: users.avatar,
        mutedAt: userMutes.createdAt
      }).from(userMutes).innerJoin(users, eq13(userMutes.mutedId, users.id)).where(eq13(userMutes.muterId, req.user.id)).orderBy(desc3(userMutes.createdAt));
      res.json({ mutedUsers });
    } catch (error) {
      console.error("Failed to fetch muted users:", error);
      res.status(500).json({ error: "Failed to fetch muted users" });
    }
  });
  app2.get("/api/users/me/blocked", requireAuth, async (req, res) => {
    try {
      const blockedUsers = await db.select({
        id: users.id,
        displayName: users.displayName,
        avatar: users.avatar,
        blockedAt: userBlocks.createdAt
      }).from(userBlocks).innerJoin(users, eq13(userBlocks.blockedId, users.id)).where(eq13(userBlocks.blockerId, req.user.id)).orderBy(desc3(userBlocks.createdAt));
      res.json({ blockedUsers });
    } catch (error) {
      console.error("Failed to fetch blocked users:", error);
      res.status(500).json({ error: "Failed to fetch blocked users" });
    }
  });
  app2.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const allPosts = await db.select({
        post: posts,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      }).from(posts).leftJoin(users, eq13(posts.userId, users.id)).orderBy(desc3(posts.createdAt));
      const userLikes = await db.select({ postId: likes.postId }).from(likes).where(eq13(likes.userId, req.user.id));
      const likedPostIds = new Set(userLikes.map((l) => l.postId));
      const formattedPosts = allPosts.map((row) => ({
        id: row.post.id,
        userId: row.post.userId,
        user: row.user ? {
          ...row.user,
          username: row.user.displayName?.toLowerCase().replace(/\s+/g, "") || "user"
        } : null,
        platform: row.post.platform,
        mediaUrl: row.post.mediaUrl,
        embedCode: row.post.embedCode,
        caption: row.post.caption,
        captionRich: row.post.captionRich,
        images: row.post.images || [],
        likesCount: parseInt(row.post.likesCount || "0"),
        commentsCount: parseInt(row.post.commentsCount || "0"),
        isLiked: likedPostIds.has(row.post.id),
        createdAt: row.post.createdAt
      }));
      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });
  app2.post("/api/upload/images-base64", requireAuth, async (req, res) => {
    try {
      const { images: base64Images } = req.body;
      if (!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }
      if (base64Images.length > 10) {
        return res.status(400).json({ error: "Maximum 10 images allowed" });
      }
      const uploadedImages = [];
      const useR2 = isR2Configured();
      for (let base64Data of base64Images) {
        if (base64Data.includes("base64,")) {
          base64Data = base64Data.split("base64,")[1];
        }
        const buffer = Buffer.from(base64Data, "base64");
        const processedBuffer = await sharp(buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        if (useR2) {
          const result = await uploadToR2(processedBuffer, {
            folder: "images",
            contentType: "image/webp"
          });
          uploadedImages.push(`/api/images/${result.key}`);
        } else {
          const filename = `${Date.now()}-${crypto4.randomBytes(8).toString("hex")}.webp`;
          const filepath = path2.join(UPLOAD_DIR, filename);
          await sharp(processedBuffer).toFile(filepath);
          uploadedImages.push(`/uploads/images/${filename}`);
        }
      }
      res.json({ images: uploadedImages });
    } catch (error) {
      console.error("Failed to upload base64 images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  });
  app2.post("/api/upload/images", requireAuth, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }
      const uploadedImages = [];
      const useR2 = isR2Configured();
      for (const file of files) {
        const processedBuffer = await sharp(file.buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        if (useR2) {
          const result = await uploadToR2(processedBuffer, {
            folder: "images",
            contentType: "image/webp"
          });
          uploadedImages.push(`/api/images/${result.key}`);
        } else {
          const filename = `${Date.now()}-${crypto4.randomBytes(8).toString("hex")}.webp`;
          const filepath = path2.join(UPLOAD_DIR, filename);
          await sharp(processedBuffer).toFile(filepath);
          uploadedImages.push(`/uploads/images/${filename}`);
        }
      }
      res.json({ images: uploadedImages });
    } catch (error) {
      console.error("Failed to upload images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  });
  app2.get("/api/images/:folder/:filename", async (req, res) => {
    try {
      const { folder, filename } = req.params;
      const key = `${folder}/${filename}`;
      const result = await getObjectFromR2(key);
      if (!result) {
        return res.status(404).json({ error: "Image not found" });
      }
      res.set("Content-Type", result.contentType);
      res.set("Cache-Control", "public, max-age=31536000");
      res.send(result.body);
    } catch (error) {
      console.error("Failed to serve image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });
  app2.post("/api/videos/create", requireAuth, async (req, res) => {
    try {
      const { filename, title, fileSize, mimeType } = req.body;
      if (!filename) {
        return res.status(400).json({ error: "Filename is required" });
      }
      if (fileSize && fileSize > VIDEO_MAX_SIZE_BYTES) {
        return res.status(400).json({
          error: `File too large. Maximum size is ${VIDEO_MAX_SIZE_BYTES / (1024 * 1024)}MB`
        });
      }
      if (mimeType && !VIDEO_ALLOWED_TYPES.includes(mimeType)) {
        return res.status(400).json({
          error: "Invalid video format. Supported: MP4, MOV, AVI, WebM, MKV"
        });
      }
      const result = await createVideoUpload(req.user.id, filename, title);
      res.json({
        videoId: result.videoId,
        maxSizeBytes: VIDEO_MAX_SIZE_BYTES
      });
    } catch (error) {
      console.error("[Video] Create failed:", error);
      res.status(500).json({ error: "Failed to create video upload" });
    }
  });
  app2.put("/api/videos/:id/upload", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const chunks = [];
      req.on("data", (chunk) => {
        chunks.push(chunk);
      });
      req.on("end", async () => {
        const videoBuffer = Buffer.concat(chunks);
        if (videoBuffer.length > VIDEO_MAX_SIZE_BYTES) {
          return res.status(413).json({ error: "File too large" });
        }
        const result = await proxyVideoUpload(id, req.user.id, videoBuffer);
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        res.json({ success: true });
      });
      req.on("error", (error) => {
        console.error("[Video] Upload stream error:", error);
        res.status(500).json({ error: "Upload failed" });
      });
    } catch (error) {
      console.error("[Video] Proxy upload failed:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });
  app2.get("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const video = await getVideoById(id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      const isOwner = video.userId === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isAdmin && video.status !== "ready") {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json({ video });
    } catch (error) {
      console.error("[Video] Get failed:", error);
      res.status(500).json({ error: "Failed to get video" });
    }
  });
  app2.get("/api/videos/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const status = await getVideoStatus(id);
      if (!status) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(status);
    } catch (error) {
      console.error("[Video] Status check failed:", error);
      res.status(500).json({ error: "Failed to get video status" });
    }
  });
  app2.delete("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteVideo(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ error: "Video not found or access denied" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("[Video] Delete failed:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });
  app2.post("/webhooks/bunny/video", async (req, res) => {
    try {
      const webhookSecret = process.env.BUNNY_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers["x-bunny-webhook-secret"] || req.headers["authorization"];
        if (signature !== webhookSecret) {
          console.warn("[Bunny Webhook] Invalid webhook secret");
          return res.status(401).json({ error: "Unauthorized" });
        }
      }
      const { VideoLibraryId, VideoGuid, Status } = req.body;
      console.log("[Bunny Webhook] Received:", { VideoLibraryId, VideoGuid, Status });
      if (!VideoLibraryId || !VideoGuid || Status === void 0) {
        console.warn("[Bunny Webhook] Invalid payload:", req.body);
        return res.status(400).json({ error: "Invalid webhook payload" });
      }
      const expectedLibraryId = parseInt(process.env.BUNNY_LIBRARY_ID || "0");
      if (expectedLibraryId && VideoLibraryId !== expectedLibraryId) {
        console.warn(
          `[Bunny Webhook] Library ID mismatch: expected ${expectedLibraryId}, got ${VideoLibraryId}`
        );
        return res.status(200).json({ received: true, processed: false });
      }
      await updateVideoFromWebhook(VideoGuid, VideoLibraryId, Status);
      console.log(
        `[Bunny Webhook] Processed: VideoGuid=${VideoGuid}, Status=${Status}`
      );
      res.status(200).json({ received: true, processed: true });
    } catch (error) {
      console.error("[Bunny Webhook] Processing error:", error);
      res.status(200).json({ received: true, processed: false, error: "Internal error" });
    }
  });
  app2.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const { platform, mediaUrl, embedCode, caption, captionRich, images, visibility, videoId } = req.body;
      const hasContent = caption?.trim() || mediaUrl?.trim() || images && images.length > 0 || videoId;
      if (!hasContent) {
        return res.status(400).json({ error: "Please add some text, images, or a video" });
      }
      if (videoId) {
        const video = await getVideoById(videoId, req.user.id);
        if (!video) {
          return res.status(400).json({ error: "Video not found or not owned by you" });
        }
        if (video.status !== "ready") {
          return res.status(400).json({
            error: "Video is still processing. Please wait until encoding is complete.",
            videoStatus: video.status
          });
        }
      }
      const validPlatforms = ["youtube", "tiktok", "instagram", "facebook", "twitter", null];
      if (platform && !validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }
      const validVisibilities = ["public", "followers", "private"];
      const postVisibility = validVisibilities.includes(visibility) ? visibility : "public";
      const newPost = await db.insert(posts).values({
        userId: req.user.id,
        platform: mediaUrl?.trim() ? platform || "youtube" : null,
        mediaUrl: mediaUrl?.trim() || null,
        embedCode: embedCode || null,
        caption: caption?.trim() || null,
        captionRich: captionRich || null,
        images: images || [],
        videoId: videoId || null,
        visibility: postVisibility
      }).returning();
      if (postVisibility !== "private") {
        sendNewPostNotifications(req.user.id, newPost[0].id).catch((err) => {
          console.error("Failed to send new post notifications:", err);
        });
      }
      res.json({ post: newPost[0] });
      awardXp(req.user.id, "post_created").catch(() => {
      });
    } catch (error) {
      console.error("Failed to create post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });
  app2.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await db.select().from(posts).where(eq13(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post[0].userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to delete this post" });
      }
      await db.delete(posts).where(eq13(posts.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });
  app2.patch("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { caption, captionRich, mediaUrl, platform, images, visibility } = req.body;
      const post = await db.select().from(posts).where(eq13(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post[0].userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to edit this post" });
      }
      const validPlatforms = ["youtube", "tiktok", "instagram", "facebook", "twitter"];
      if (platform !== void 0 && platform !== null && !validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }
      const updateData = {};
      if (caption !== void 0) updateData.caption = caption?.trim() || null;
      if (captionRich !== void 0) updateData.captionRich = captionRich || null;
      if (mediaUrl !== void 0) updateData.mediaUrl = mediaUrl?.trim() || null;
      if (platform !== void 0) updateData.platform = mediaUrl?.trim() ? platform || "youtube" : null;
      if (images !== void 0) updateData.images = images || [];
      if (visibility !== void 0) {
        const validVisibilities = ["public", "followers", "private"];
        if (validVisibilities.includes(visibility)) {
          updateData.visibility = visibility;
        }
      }
      const updatedPost = await db.update(posts).set(updateData).where(eq13(posts.id, id)).returning();
      res.json({ post: updatedPost[0] });
    } catch (error) {
      console.error("Failed to update post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });
  app2.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await db.select().from(posts).where(eq13(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }
      const existingLike = await db.select().from(likes).where(and5(eq13(likes.postId, id), eq13(likes.userId, req.user.id))).limit(1);
      if (existingLike.length > 0) {
        await db.delete(likes).where(eq13(likes.id, existingLike[0].id));
        await db.update(posts).set({ likesCount: String(Math.max(0, parseInt(post[0].likesCount || "0") - 1)) }).where(eq13(posts.id, id));
        res.json({ liked: false });
      } else {
        await db.insert(likes).values({ userId: req.user.id, postId: id });
        await db.update(posts).set({ likesCount: String(parseInt(post[0].likesCount || "0") + 1) }).where(eq13(posts.id, id));
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });
  app2.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const allComments = await db.select().from(comments).leftJoin(users, eq13(comments.userId, users.id)).where(eq13(comments.postId, id)).orderBy(desc3(comments.createdAt));
      const formattedComments = allComments.map((row) => ({
        id: row.comments.id,
        content: row.comments.content,
        createdAt: row.comments.createdAt,
        user: row.users ? {
          id: row.users.id,
          displayName: row.users.displayName,
          avatar: row.users.avatar
        } : null
      }));
      res.json({ comments: formattedComments });
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });
  app2.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Comment cannot be empty" });
      }
      const post = await db.select().from(posts).where(eq13(posts.id, id)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }
      const newComment = await db.insert(comments).values({ userId: req.user.id, postId: id, content: content.trim() }).returning();
      await db.update(posts).set({ commentsCount: String(parseInt(post[0].commentsCount || "0") + 1) }).where(eq13(posts.id, id));
      res.json({
        comment: {
          ...newComment[0],
          user: {
            id: req.user.id,
            displayName: req.user.displayName,
            avatar: req.user.avatar
          }
        }
      });
      awardXp(req.user.id, "comment_created").catch(() => {
      });
    } catch (error) {
      console.error("Failed to create comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });
  app2.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await db.select().from(comments).where(eq13(comments.id, id)).limit(1);
      if (comment.length === 0) {
        return res.status(404).json({ error: "Comment not found" });
      }
      if (comment[0].userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to delete this comment" });
      }
      await db.delete(comments).where(eq13(comments.id, id));
      const post = await db.select().from(posts).where(eq13(posts.id, comment[0].postId)).limit(1);
      if (post.length > 0) {
        await db.update(posts).set({ commentsCount: String(Math.max(0, parseInt(post[0].commentsCount || "0") - 1)) }).where(eq13(posts.id, comment[0].postId));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });
  app2.post("/api/admin/impersonate/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const targetUser = await db.select().from(users).where(eq13(users.id, userId)).limit(1);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "impersonate_user",
        metadata: { targetUserId: userId, targetEmail: targetUser[0].email }
      });
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await db.insert(sessions).values({
        userId: targetUser[0].id,
        token,
        expiresAt
      });
      res.json({
        token,
        user: {
          id: targetUser[0].id,
          email: targetUser[0].email,
          displayName: targetUser[0].displayName,
          avatar: targetUser[0].avatar,
          role: targetUser[0].role
        },
        impersonated: true
      });
    } catch (error) {
      console.error("Failed to impersonate user:", error);
      res.status(500).json({ error: "Failed to impersonate user" });
    }
  });
  app2.post("/api/admin/seed-demo-users", requireAdmin, async (req, res) => {
    try {
      const demoUsers = [
        { email: "mienliu@demo.com", displayName: "Mien Liu", provider: "demo", providerUserId: "demo-1", avatar: null },
        { email: "saeyang@demo.com", displayName: "Sae Yang", provider: "demo", providerUserId: "demo-2", avatar: null },
        { email: "waaneng@demo.com", displayName: "Waa Neng", provider: "demo", providerUserId: "demo-3", avatar: null },
        { email: "fongmeng@demo.com", displayName: "Fong Meng", provider: "demo", providerUserId: "demo-4", avatar: null },
        { email: "lauzanh@demo.com", displayName: "Lau Zanh", provider: "demo", providerUserId: "demo-5", avatar: null }
      ];
      const createdUsers = [];
      for (const demo of demoUsers) {
        const existing = await db.select().from(users).where(eq13(users.email, demo.email)).limit(1);
        if (existing.length === 0) {
          const newUser = await db.insert(users).values(demo).returning();
          createdUsers.push(newUser[0]);
        } else {
          createdUsers.push(existing[0]);
        }
      }
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "seed_demo_users",
        metadata: { count: createdUsers.length }
      });
      res.json({ users: createdUsers, message: `Created/found ${createdUsers.length} demo users` });
    } catch (error) {
      console.error("Failed to seed demo users:", error);
      res.status(500).json({ error: "Failed to seed demo users" });
    }
  });
  app2.post("/api/admin/seed-ai-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      let promptsSeeded = 0;
      let promptsSkipped = 0;
      let servicesSeeded = 0;
      let servicesSkipped = 0;
      let avatarSeeded = false;
      for (const [key, promptData] of Object.entries(DEFAULT_PROMPTS)) {
        const existing = await db.select().from(aiPrompts).where(eq13(aiPrompts.key, key)).limit(1);
        if (existing.length === 0) {
          await db.insert(aiPrompts).values({
            key,
            name: promptData.name,
            description: promptData.description,
            category: promptData.category,
            prompt: promptData.prompt
          });
          promptsSeeded++;
        } else {
          promptsSkipped++;
        }
      }
      for (const [serviceKey, config] of Object.entries(DEFAULT_SERVICE_CONFIGS)) {
        const existing = await db.select().from(aiServiceConfigs).where(eq13(aiServiceConfigs.serviceKey, serviceKey)).limit(1);
        if (existing.length === 0) {
          await db.insert(aiServiceConfigs).values({
            serviceKey,
            displayName: config.displayName,
            modelName: config.defaultModel,
            endpointUrl: config.endpointUrl,
            isEnabled: false,
            sourceType: "local"
          });
          servicesSeeded++;
        } else {
          servicesSkipped++;
        }
      }
      const existingAvatar = await db.select().from(avatarSettings).where(eq13(avatarSettings.id, "default")).limit(1);
      if (existingAvatar.length === 0) {
        await db.insert(avatarSettings).values({ id: "default" });
        avatarSeeded = true;
      }
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "seed_ai_settings",
        metadata: { promptsSeeded, promptsSkipped, servicesSeeded, servicesSkipped, avatarSeeded }
      });
      res.json({
        message: "AI settings seeded successfully",
        prompts: { seeded: promptsSeeded, skipped: promptsSkipped },
        services: { seeded: servicesSeeded, skipped: servicesSkipped },
        avatar: { seeded: avatarSeeded }
      });
    } catch (error) {
      console.error("Failed to seed AI settings:", error);
      res.status(500).json({ error: "Failed to seed AI settings" });
    }
  });
  app2.get("/api/admin/integration-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings2 = await getIntegrationSettings();
      res.json(settings2);
    } catch (error) {
      console.error("Failed to get integration settings:", error);
      res.status(500).json({ error: "Failed to get integration settings" });
    }
  });
  app2.put("/api/admin/integration-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { baseUrl, enrollmentSecret } = req.body;
      if (baseUrl) {
        await setIntegrationSetting("three_tears_base_url", baseUrl);
        resetJwksClient();
      }
      if (enrollmentSecret) {
        await setIntegrationSetting("three_tears_enrollment_secret", enrollmentSecret);
      }
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "update_integration_settings",
        metadata: {
          baseUrl: baseUrl ? "updated" : "unchanged",
          enrollmentSecret: enrollmentSecret ? "updated" : "unchanged"
        }
      });
      const updatedSettings = await getIntegrationSettings();
      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      console.error("Failed to update integration settings:", error);
      res.status(500).json({ error: "Failed to update integration settings" });
    }
  });
  app2.post("/api/admin/integration/register", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { forceReregister } = req.body;
      const result = await registerWithThreeTears(forceReregister === true);
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "manual_registration_attempt",
        metadata: { result, forceReregister: forceReregister === true }
      });
      res.json(result);
    } catch (error) {
      console.error("Failed to register with Three Tears:", error);
      res.status(500).json({ success: false, message: `Registration failed: ${error.message}` });
    }
  });
  app2.delete("/api/admin/integration/app-id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(settings).where(eq13(settings.key, "registered_app_id"));
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "clear_app_id",
        metadata: {}
      });
      res.json({ success: true, message: "App ID cleared. You can now re-register." });
    } catch (error) {
      console.error("Failed to clear app ID:", error);
      res.status(500).json({ error: "Failed to clear app ID" });
    }
  });
  app2.get("/api/admin/billing-providers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const providers = await getBillingProviders();
      res.json(providers);
    } catch (error) {
      console.error("Failed to get billing providers:", error);
      res.status(500).json({ error: "Failed to get billing providers" });
    }
  });
  app2.put("/api/admin/billing-providers/:provider", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      if (provider !== "stripe" && provider !== "revenuecat") {
        return res.status(400).json({ error: "Invalid billing provider. Must be 'stripe' or 'revenuecat'" });
      }
      const { apiKey, publicKey, webhookSecret, config, isEnabled } = req.body;
      const updated = await updateBillingProvider(provider, {
        apiKey,
        publicKey,
        webhookSecret,
        config,
        isEnabled,
        sourceType: "local"
      });
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "update_billing_provider",
        metadata: {
          provider,
          apiKeyUpdated: !!apiKey,
          publicKeyUpdated: !!publicKey,
          webhookSecretUpdated: !!webhookSecret,
          configUpdated: !!config,
          isEnabledUpdated: isEnabled !== void 0
        }
      });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update billing provider:", error);
      res.status(500).json({ error: "Failed to update billing provider" });
    }
  });
  app2.post("/api/admin/billing-providers/:provider/test", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      let result;
      if (provider === "stripe") {
        result = await testStripeConnection();
      } else if (provider === "revenuecat") {
        result = await testRevenueCatConnection();
      } else {
        return res.status(400).json({ error: "Invalid billing provider" });
      }
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "test_billing_provider",
        metadata: { provider, result }
      });
      res.json(result);
    } catch (error) {
      console.error("Failed to test billing provider:", error);
      res.status(500).json({ success: false, message: "Test failed" });
    }
  });
  app2.post("/api/billing/push-credentials", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }
      const token = authHeader.substring(7);
      const verification = await verifyJwt(token);
      if (!verification.valid) {
        console.warn("[Billing Push] JWT verification failed:", verification.error);
        return res.status(401).json({ error: verification.error || "Invalid token" });
      }
      const { stripe, revenuecat } = req.body;
      if (!stripe && !revenuecat) {
        return res.status(400).json({ error: "At least one billing provider configuration must be provided" });
      }
      const result = await updateBillingCredentialsFromThreeTears({ stripe, revenuecat });
      await db.insert(activityLogs).values({
        userId: null,
        action: "three_tears_push_billing_credentials",
        metadata: {
          stripeUpdated: stripe ? true : false,
          revenuecatUpdated: revenuecat ? true : false,
          result
        }
      });
      console.log("[Billing Push] Credentials updated from Three Tears:", result);
      if (result.success) {
        res.json({
          success: true,
          message: "Billing credentials updated successfully",
          updated: result.updated
        });
      } else {
        res.status(207).json({
          success: false,
          message: "Some credentials failed to update",
          updated: result.updated,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error("[Billing Push] Error processing credential push:", error);
      res.status(500).json({ error: "Failed to process credential push" });
    }
  });
  app2.get("/api/billing/config", async (req, res) => {
    try {
      const platform = req.query.platform || "web";
      const validPlatforms = ["web", "ios", "android"];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform. Must be 'web', 'ios', or 'android'" });
      }
      const providers = await getBillingProviders();
      const stripeProvider = providers.find((p) => p.provider === "stripe");
      const revenuecatProvider = providers.find((p) => p.provider === "revenuecat");
      const recommendedProvider = getBillingProviderForPlatform(platform);
      res.json({
        platform,
        recommendedProvider,
        stripe: stripeProvider ? {
          isEnabled: stripeProvider.isEnabled,
          publicKey: stripeProvider.publicKey,
          isConfigured: stripeProvider.hasApiKey
        } : { isEnabled: false, publicKey: null, isConfigured: false },
        revenuecat: revenuecatProvider ? {
          isEnabled: revenuecatProvider.isEnabled,
          publicKey: revenuecatProvider.publicKey,
          isConfigured: revenuecatProvider.hasApiKey,
          appAppleId: revenuecatProvider.config?.appAppleId || null,
          appGoogleId: revenuecatProvider.config?.appGoogleId || null,
          entitlementId: revenuecatProvider.config?.entitlementId || null
        } : { isEnabled: false, publicKey: null, isConfigured: false }
      });
    } catch (error) {
      console.error("Failed to get billing config:", error);
      res.status(500).json({ error: "Failed to get billing config" });
    }
  });
  app2.get("/api/admin/prompts", requireAuth, requireAdmin, async (req, res) => {
    try {
      const prompts = await getAllPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Failed to get prompts:", error);
      res.status(500).json({ error: "Failed to get prompts" });
    }
  });
  app2.get("/api/admin/prompts/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const prompt = await getPrompt(key);
      const defaultData = DEFAULT_PROMPTS[key];
      if (!prompt && !defaultData) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      res.json({
        key,
        name: defaultData?.name || key,
        description: defaultData?.description || "",
        category: defaultData?.category || "custom",
        prompt,
        isDefault: !prompt || prompt === defaultData?.prompt
      });
    } catch (error) {
      console.error("Failed to get prompt:", error);
      res.status(500).json({ error: "Failed to get prompt" });
    }
  });
  app2.put("/api/admin/prompts/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { prompt, name, description, category } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt text is required" });
      }
      await setPrompt(key, prompt, name, description, category);
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "update_ai_prompt",
        metadata: { key, promptLength: prompt.length }
      });
      res.json({ success: true, message: `Prompt '${key}' updated successfully` });
    } catch (error) {
      console.error("Failed to update prompt:", error);
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });
  app2.post("/api/admin/prompts/:key/reset", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const success = await resetPrompt(key);
      if (!success) {
        return res.status(404).json({ error: "No default prompt found for this key" });
      }
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "reset_ai_prompt",
        metadata: { key }
      });
      res.json({ success: true, message: `Prompt '${key}' reset to default` });
    } catch (error) {
      console.error("Failed to reset prompt:", error);
      res.status(500).json({ error: "Failed to reset prompt" });
    }
  });
  app2.get("/api/admin/ai-services", requireAuth, requireAdmin, async (req, res) => {
    try {
      const configs = await getAllServiceConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Failed to get AI service configs:", error);
      res.status(500).json({ error: "Failed to get AI service configurations" });
    }
  });
  app2.put("/api/admin/ai-services/:serviceKey", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { serviceKey } = req.params;
      const { modelName, apiKey, credentialsJson, projectId, region, endpointUrl, isEnabled } = req.body;
      if (!DEFAULT_SERVICE_CONFIGS[serviceKey]) {
        return res.status(404).json({ error: `Unknown service: ${serviceKey}` });
      }
      const config = await updateServiceConfig(serviceKey, {
        modelName,
        apiKey,
        credentialsJson,
        projectId,
        region,
        endpointUrl,
        isEnabled
      });
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "update_ai_service_config",
        metadata: { serviceKey, updates: Object.keys(req.body).filter((k) => k !== "apiKey" && k !== "credentialsJson") }
      });
      res.json(config);
    } catch (error) {
      console.error("Failed to update AI service config:", error);
      res.status(500).json({ error: "Failed to update AI service configuration" });
    }
  });
  app2.post("/api/admin/ai-services/:serviceKey/test", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { serviceKey } = req.params;
      if (!DEFAULT_SERVICE_CONFIGS[serviceKey]) {
        return res.status(404).json({ error: `Unknown service: ${serviceKey}` });
      }
      console.log(`[AI Service Test] Testing connection for ${serviceKey}...`);
      const result = await testServiceConnection(serviceKey);
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "test_ai_service_connection",
        metadata: { serviceKey, success: result.success }
      });
      console.log(`[AI Service Test] ${serviceKey}: ${result.success ? "SUCCESS" : "FAILED"}`);
      res.json(result);
    } catch (error) {
      console.error("Failed to test AI service connection");
      res.status(500).json({
        success: false,
        message: "Test failed unexpectedly"
      });
    }
  });
  const AVATAR_VOICE_OPTIONS = [
    { value: "Charon", label: "Charon", description: "Male, deeper/mature tone" },
    { value: "Puck", label: "Puck", description: "Male, lighter tone" },
    { value: "Fenrir", label: "Fenrir", description: "Male" },
    { value: "Kore", label: "Kore", description: "Female" },
    { value: "Aoede", label: "Aoede", description: "Female, warm tone" }
  ];
  app2.get("/api/admin/avatar-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [settings2] = await db.select().from(avatarSettings).where(eq13(avatarSettings.id, "default"));
      const result = settings2 || {
        id: "default",
        voice: "Charon",
        prompt: `You are Ong, a friendly AI companion for the Mien Kingdom community.

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

Remember: You represent the Mien Kingdom community - be welcoming and inclusive!`
      };
      res.json({
        ...result,
        voiceOptions: AVATAR_VOICE_OPTIONS
      });
    } catch (error) {
      log(`Error fetching avatar settings: ${error}`);
      res.status(500).json({ error: "Failed to fetch avatar settings" });
    }
  });
  app2.put("/api/admin/avatar-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { voice, prompt } = req.body;
      if (voice && !AVATAR_VOICE_OPTIONS.find((v) => v.value === voice)) {
        return res.status(400).json({ error: "Invalid voice option" });
      }
      const [existing] = await db.select().from(avatarSettings).where(eq13(avatarSettings.id, "default"));
      if (existing) {
        await db.update(avatarSettings).set({
          ...voice && { voice },
          ...prompt && { prompt },
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq13(avatarSettings.id, "default"));
      } else {
        await db.insert(avatarSettings).values({
          id: "default",
          voice: voice || "Charon",
          prompt: prompt || existing?.prompt || ""
        });
      }
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "update_avatar_settings",
        metadata: { voice, promptLength: prompt?.length }
      });
      const [updated] = await db.select().from(avatarSettings).where(eq13(avatarSettings.id, "default"));
      res.json({
        ...updated,
        voiceOptions: AVATAR_VOICE_OPTIONS
      });
    } catch (error) {
      log(`Error updating avatar settings: ${error}`);
      res.status(500).json({ error: "Failed to update avatar settings" });
    }
  });
  app2.get("/api/avatar/settings", async (req, res) => {
    try {
      const [settings2] = await db.select().from(avatarSettings).where(eq13(avatarSettings.id, "default"));
      const result = settings2 || {
        voice: "Charon",
        prompt: `You are Ong, a friendly AI companion for the Mien Kingdom community.

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

Remember: You represent the Mien Kingdom community - be welcoming and inclusive!`
      };
      res.json({
        voice: result.voice,
        prompt: result.prompt
      });
    } catch (error) {
      log(`Error fetching avatar settings for agent: ${error}`);
      res.status(500).json({ error: "Failed to fetch avatar settings" });
    }
  });
  app2.get("/api/admin/avatar-agent/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = getAvatarAgentStatus();
      res.json(status);
    } catch (error) {
      log(`Error getting avatar agent status: ${error}`);
      res.status(500).json({ error: "Failed to get avatar agent status" });
    }
  });
  app2.post("/api/admin/avatar-agent/restart", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = restartAvatarAgent();
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "restart_avatar_agent",
        category: "system",
        metadata: JSON.stringify({ result }),
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null
      });
      res.json(result);
    } catch (error) {
      log(`Error restarting avatar agent: ${error}`);
      res.status(500).json({ error: "Failed to restart avatar agent" });
    }
  });
  app2.post("/api/admin/avatar-agent/stop", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stopped = stopAvatarAgent();
      await db.insert(activityLogs).values({
        userId: req.user.id,
        action: "stop_avatar_agent",
        category: "system",
        metadata: JSON.stringify({ stopped }),
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null
      });
      res.json({
        success: true,
        message: stopped ? "Avatar agent is stopping..." : "Avatar agent was not running"
      });
    } catch (error) {
      log(`Error stopping avatar agent: ${error}`);
      res.status(500).json({ error: "Failed to stop avatar agent" });
    }
  });
  app2.post("/api/admin/test-veo-connection", requireAuth, requireAdmin, async (req, res) => {
    const steps = [];
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (!projectId) {
        steps.push({
          step: "Configuration",
          status: "error",
          message: "GOOGLE_CLOUD_PROJECT_ID is NOT set"
        });
        return res.json({ success: false, steps, summary: "Missing GOOGLE_CLOUD_PROJECT_ID" });
      }
      if (!serviceAccountJson) {
        steps.push({
          step: "Configuration",
          status: "error",
          message: "GOOGLE_SERVICE_ACCOUNT_JSON is NOT set"
        });
        return res.json({ success: false, steps, summary: "Missing GOOGLE_SERVICE_ACCOUNT_JSON" });
      }
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        const keyProjectId = serviceAccount.project_id;
        const clientEmail = serviceAccount.client_email;
        steps.push({
          step: "Load Credentials",
          status: "success",
          message: `Service Account: ${clientEmail}`
        });
        if (keyProjectId !== projectId) {
          steps.push({
            step: "Project Verification",
            status: "error",
            message: `Key is for '${keyProjectId}', but you're targeting '${projectId}' - MISMATCH!`
          });
          steps.push({
            step: "Solution",
            status: "warning",
            message: `Download the JSON key from the '${projectId}' Google Cloud project (Service Accounts page)`
          });
          return res.json({
            success: false,
            steps,
            summary: "Service account key project ID mismatch"
          });
        }
        steps.push({
          step: "Project Verification",
          status: "success",
          message: `Key matches target project '${projectId}'`
        });
      } catch (parseError) {
        steps.push({
          step: "Load Credentials",
          status: "error",
          message: `Invalid JSON: ${parseError.message}`
        });
        return res.json({ success: false, steps, summary: "Invalid service account JSON" });
      }
      let accessToken;
      try {
        accessToken = await getVertexAIAccessToken();
        steps.push({
          step: "Authentication",
          status: "success",
          message: "Access token generated successfully"
        });
      } catch (authError) {
        steps.push({
          step: "Authentication",
          status: "error",
          message: `Failed to generate token: ${authError.message}`
        });
        return res.json({
          success: false,
          steps,
          summary: "Authentication failed"
        });
      }
      const projectCheckUrl = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`;
      try {
        const projectResp = await fetch(projectCheckUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (projectResp.status === 200) {
          const projData = await projectResp.json();
          steps.push({
            step: "Project Visibility",
            status: "success",
            message: `Project '${projectId}' is ACTIVE (${projData.lifecycleState || "ACTIVE"})`
          });
        } else if (projectResp.status === 403) {
          steps.push({
            step: "Project Visibility",
            status: "error",
            message: `403 Forbidden - Service account lacks 'Viewer' or 'Vertex AI User' role on project`
          });
          steps.push({
            step: "Solution",
            status: "warning",
            message: `In Google Cloud Console: Go to IAM -> Grant role 'Vertex AI User' to ${serviceAccount.client_email}`
          });
          return res.json({
            success: false,
            steps,
            summary: "Service account lacks required permissions"
          });
        } else if (projectResp.status === 404) {
          steps.push({
            step: "Project Visibility",
            status: "error",
            message: `404 Not Found - Project '${projectId}' doesn't exist or has been deleted`
          });
          return res.json({ success: false, steps, summary: "Project not found" });
        } else {
          steps.push({
            step: "Project Visibility",
            status: "warning",
            message: `Unexpected response ${projectResp.status} - proceeding with model check`
          });
        }
      } catch (projError) {
        steps.push({
          step: "Project Visibility",
          status: "warning",
          message: `Could not verify project: ${projError.message} - proceeding with model check`
        });
      }
      const location = "us-central1";
      const modelId = "veo-3.1-fast-generate-001";
      const modelUrlV1 = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}`;
      let modelFound = false;
      let usedEndpoint = "v1";
      try {
        const modelResp = await fetch(modelUrlV1, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        if (modelResp.status === 200) {
          const modelData = await modelResp.json();
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "success",
            message: `Model '${modelId}' is AVAILABLE on v1 endpoint`
          });
          modelFound = true;
        } else if (modelResp.status === 404) {
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "warning",
            message: `Model not found on v1 endpoint. Checking v1beta1...`
          });
          const modelUrlBeta = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/veo-3.1-fast-generate-preview`;
          const betaResp = await fetch(modelUrlBeta, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            }
          });
          if (betaResp.status === 200) {
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "success",
              message: `Model 'veo-3.1-fast-generate-preview' found on v1beta1 endpoint`
            });
            steps.push({
              step: "Note",
              status: "info",
              message: `Movie Star feature should use 'v1beta1' endpoint with model 'veo-3.1-fast-generate-preview'`
            });
            modelFound = true;
            usedEndpoint = "v1beta1";
          } else if (betaResp.status === 403) {
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "error",
              message: `403 Forbidden - Vertex AI API may not be enabled or model access denied`
            });
            steps.push({
              step: "Solution",
              status: "warning",
              message: `1. Go to Google Cloud Console
2. Search for 'Vertex AI API' and click ENABLE
3. Ensure your service account has 'Vertex AI User' role`
            });
          } else if (betaResp.status === 404) {
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "error",
              message: `Model not found on v1beta1 - model may not be available in your region or project`
            });
          } else {
            const errorText = await betaResp.text();
            steps.push({
              step: "Veo 3.1 Model (v1beta1)",
              status: "error",
              message: `Unexpected error ${betaResp.status}: ${errorText.substring(0, 150)}`
            });
          }
        } else if (modelResp.status === 403) {
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "error",
            message: `403 Forbidden - Vertex AI API may not be enabled or permissions denied`
          });
          steps.push({
            step: "Solution",
            status: "warning",
            message: `1. Enable Vertex AI API in Google Cloud Console
2. Ensure service account has 'Vertex AI User' role`
          });
        } else {
          const errorText = await modelResp.text();
          steps.push({
            step: "Veo 3.1 Model (v1)",
            status: "error",
            message: `Error ${modelResp.status}: ${errorText.substring(0, 150)}`
          });
        }
      } catch (fetchError) {
        steps.push({
          step: "Veo 3.1 Model",
          status: "error",
          message: `Network error: ${fetchError.message}`
        });
      }
      if (modelFound) {
        await db.insert(activityLogs).values({
          userId: req.user.id,
          action: "test_veo_connection",
          metadata: { success: true, projectId, endpoint: usedEndpoint }
        });
        return res.json({
          success: true,
          steps,
          summary: `Success! Veo 3.1 is accessible on ${usedEndpoint} endpoint.`
        });
      } else {
        await db.insert(activityLogs).values({
          userId: req.user.id,
          action: "test_veo_connection",
          metadata: { success: false, projectId, error: "Model not accessible" }
        });
        return res.json({
          success: false,
          steps,
          summary: "Veo 3.1 model is not accessible - see diagnostic steps above"
        });
      }
    } catch (error) {
      steps.push({
        step: "Unexpected Error",
        status: "error",
        message: error.message || "Unknown error occurred"
      });
      return res.json({
        success: false,
        steps,
        summary: "Test failed with unexpected error"
      });
    }
  });
  app2.post("/api/admin/command", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }
      const token = authHeader.substring(7);
      const verification = await verifyJwt(token);
      if (!verification.valid) {
        return res.status(401).json({ error: verification.error || "Invalid token" });
      }
      const { action, params, data } = req.body;
      if (!action) {
        return res.status(400).json({ error: "action is required" });
      }
      const commandParams = data || params || {};
      const result = await handleAdminCommand(action, commandParams);
      await db.insert(activityLogs).values({
        userId: null,
        action: `three_tears_command:${action}`,
        metadata: { params: commandParams, result, tokenPayload: verification.payload }
      });
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Admin command error:", error);
      res.status(500).json({ error: "Command execution failed" });
    }
  });
  app2.post("/api/support/ticket", requireAuth, async (req, res) => {
    try {
      const { message, subject } = req.body;
      const appId = await getAppId();
      if (!appId) {
        return res.status(503).json({ error: "Support system not available" });
      }
      const mainAppBaseUrl = await getMainAppBaseUrl();
      const ticketResponse = await fetch(`${mainAppBaseUrl}/api/ingest/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          app_id: appId,
          user_email: req.user.email,
          user_name: req.user.displayName,
          subject: subject || "Support Request",
          message
        })
      });
      if (ticketResponse.ok) {
        const data = await ticketResponse.json();
        res.json({ success: true, ticketId: data.ticket_id });
      } else {
        res.status(500).json({ error: "Failed to submit ticket" });
      }
    } catch (error) {
      console.error("Support ticket error:", error);
      res.status(500).json({ error: "Failed to submit support ticket" });
    }
  });
  function generateTicketNumber() {
    const timestamp2 = Date.now().toString(36).toUpperCase();
    const random = crypto4.randomBytes(3).toString("hex").toUpperCase();
    return `MK-${timestamp2}-${random}`;
  }
  app2.post("/api/support/chat", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      const user = req.user;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const ticketNumber = generateTicketNumber();
      const appId = await getAppId();
      await db.insert(activityLogs).values({
        userId: user.id,
        action: "support_chat_request",
        metadata: { ticketNumber, userEmail: user.email, userName: user.displayName, message: message.substring(0, 500) }
      });
      try {
        const mainAppBaseUrl = await getMainAppBaseUrl();
        const chatResponse = await fetch(`${mainAppBaseUrl}/api/support/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            app_id: appId,
            ticket_number: ticketNumber,
            user_email: user.email,
            user_name: user.displayName,
            user_id: user.id,
            message
          })
        });
        if (chatResponse.ok) {
          console.log(`[Support] Chat ticket ${ticketNumber} forwarded to Three Tears`);
        } else {
          console.warn(`[Support] Failed to forward chat to Three Tears: ${chatResponse.status}`);
        }
      } catch (forwardError) {
        console.warn("[Support] Could not forward to Three Tears:", forwardError);
      }
      res.json({ success: true, ticketNumber });
    } catch (error) {
      console.error("Support chat error:", error);
      res.status(500).json({ error: "Failed to initiate chat" });
    }
  });
  app2.post("/api/support/email", requireAuth, async (req, res) => {
    try {
      const { subject, message } = req.body;
      const user = req.user;
      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }
      const ticketNumber = generateTicketNumber();
      const appId = await getAppId();
      await db.insert(activityLogs).values({
        userId: user.id,
        action: "support_email_request",
        metadata: {
          ticketNumber,
          userEmail: user.email,
          userName: user.displayName,
          subject,
          message: message.substring(0, 500),
          recipient: "support@mienkingdom.com"
        }
      });
      try {
        const mainAppBaseUrl = await getMainAppBaseUrl();
        const emailResponse = await fetch(`${mainAppBaseUrl}/api/support/email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            app_id: appId,
            ticket_number: ticketNumber,
            user_email: user.email,
            user_name: user.displayName,
            user_id: user.id,
            subject,
            message,
            recipient: "support@mienkingdom.com"
          })
        });
        if (emailResponse.ok) {
          console.log(`[Support] Email ticket ${ticketNumber} forwarded to Three Tears`);
        } else {
          console.warn(`[Support] Failed to forward email to Three Tears: ${emailResponse.status}`);
        }
      } catch (forwardError) {
        console.warn("[Support] Could not forward to Three Tears:", forwardError);
      }
      res.json({ success: true, ticketNumber });
    } catch (error) {
      console.error("Support email error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });
  const requirePaidTier = async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const fullUser = await db.select().from(users).where(eq13(users.id, user.id)).limit(1);
      if (fullUser.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }
      const tierSlug = fullUser[0].tierSlug || "free";
      const userRole = fullUser[0].role || "user";
      const isAdminOrModerator = userRole === "admin" || userRole === "moderator";
      if (tierSlug === "free" && !isAdminOrModerator) {
        return res.status(403).json({
          error: "This feature is only available to paid subscribers",
          redirect_url: "/subscription"
        });
      }
      next();
    } catch (error) {
      console.error("Paid tier check error:", error);
      return res.status(500).json({ error: "Failed to verify subscription status" });
    }
  };
  app2.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const tickets = await getUserTickets(user.id, user.email);
      res.json(tickets);
    } catch (error) {
      console.error("[Tickets] Fetch tickets error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });
  app2.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const { subject, body, category = "general" } = req.body;
      const user = req.user;
      if (!subject || !body) {
        return res.status(400).json({ error: "Subject and body are required" });
      }
      const ticket = await createTicket(user.id, user.email, subject, body, category);
      await db.insert(activityLogs).values({
        userId: user.id,
        action: "ticket_created",
        metadata: { ticketId: ticket.id, subject, category }
      });
      res.json(ticket);
    } catch (error) {
      console.error("[Tickets] Create ticket error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });
  app2.get("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const ticket = await getTicketDetails(user.id, id, user.email);
      res.json(ticket);
    } catch (error) {
      console.error("[Tickets] Fetch ticket error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });
  app2.post("/api/tickets/:id/reply", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const user = req.user;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const reply = await replyToTicket(user.id, id, message, user.email);
      await db.insert(activityLogs).values({
        userId: user.id,
        action: "ticket_reply",
        metadata: { ticketId: id }
      });
      res.json(reply);
    } catch (error) {
      console.error("[Tickets] Reply error:", error);
      if (error.message?.includes("not registered")) {
        return res.status(503).json({ error: "Support system not available" });
      }
      res.status(500).json({ error: "Failed to send reply" });
    }
  });
  app2.get("/.well-known/jwks.json", async (req, res) => {
    try {
      const jwks = await getAppJwks();
      res.json(jwks);
    } catch (error) {
      console.error("[JWKS] Error getting app JWKS:", error);
      res.json({ keys: [] });
    }
  });
  app2.get("/api/sync/snapshot", async (req, res) => {
    try {
      const authResult = await verifySyncAuth(req.headers.authorization);
      if (!authResult.valid) {
        return res.status(401).json({ error: authResult.error });
      }
      const snapshot = await generateSnapshot();
      await logActivity(null, "sync_snapshot_requested", {
        generatedAt: snapshot.generatedAt,
        usersCount: snapshot.users.total,
        groupsCount: snapshot.groups.total
      });
      res.json(snapshot);
    } catch (error) {
      console.error("[Sync] Snapshot generation error:", error);
      res.status(500).json({ error: "Failed to generate snapshot" });
    }
  });
  app2.post("/webhooks/billing", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const payload = req.body;
      const isValid = await verifyJwt(authHeader?.replace("Bearer ", "") || "");
      if (!isValid.valid) {
        console.error("[Billing] Invalid JWT signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const { event, user_id, tier_slug, credits_refill, subscription_end } = payload;
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      console.log(`[Billing] Received ${event} for user ${user_id}`);
      if (event === "subscription.updated" || event === "subscription.renewed") {
        const creditsToSet = credits_refill || getCreditsForTier(tier_slug || "free");
        const subEnd = subscription_end ? new Date(subscription_end) : null;
        await db.update(users).set({
          tierSlug: tier_slug || "free",
          credits: creditsToSet,
          subscriptionActive: tier_slug !== "free",
          subscriptionExpiresAt: subEnd,
          lastCreditReset: /* @__PURE__ */ new Date()
        }).where(eq13(users.id, user_id));
        await db.insert(creditTransactions).values({
          userId: user_id,
          type: "refill",
          amount: creditsToSet,
          balanceAfter: creditsToSet,
          feature: null,
          description: event === "subscription.renewed" ? `Subscription refill: ${creditsToSet} credits for ${tier_slug || "free"} tier` : `Upgraded to ${tier_slug || "free"}: ${creditsToSet} credits`
        });
        await logActivity(user_id, "subscription_updated", {
          event,
          tierSlug: tier_slug,
          credits: creditsToSet,
          subscriptionExpiresAt: subEnd?.toISOString()
        });
        const [updatedUser] = await db.select().from(users).where(eq13(users.id, user_id));
        if (updatedUser) {
          pushUserUpdated({
            id: updatedUser.id,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            role: updatedUser.role,
            provider: updatedUser.provider,
            createdAt: updatedUser.createdAt.toISOString(),
            lastLoginAt: updatedUser.lastLoginAt.toISOString()
          });
        }
        console.log(`[Billing] Updated subscription for user ${user_id}: tier=${tier_slug}, credits=${creditsToSet}`);
      }
      if (event === "subscription.cancelled" || event === "subscription.expired") {
        await db.update(users).set({
          tierSlug: "free",
          subscriptionActive: false,
          credits: 0
        }).where(eq13(users.id, user_id));
        console.log(`[Billing] Subscription cancelled for user ${user_id}`);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("[Billing] Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.post("/webhooks/stripe", async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      const stripeConfig = await getBillingProviderWithKeys("stripe");
      if (!stripeConfig || !stripeConfig.isEnabled) {
        console.warn("[Stripe Webhook] Stripe is not enabled");
        return res.status(400).json({ error: "Stripe is not enabled" });
      }
      let event;
      if (!stripeConfig.webhookSecret) {
        console.error("[Stripe Webhook] No webhook secret configured - rejecting");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }
      if (!sig) {
        console.warn("[Stripe Webhook] No signature provided - rejecting");
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }
      try {
        const timestamp2 = sig.split(",").find((s) => s.startsWith("t="))?.split("=")[1];
        const signatures = sig.split(",").filter((s) => s.startsWith("v1=")).map((s) => s.split("=")[1]);
        if (!timestamp2 || signatures.length === 0) {
          return res.status(400).json({ error: "Invalid signature format" });
        }
        const webhookAge = Math.floor(Date.now() / 1e3) - parseInt(timestamp2);
        if (webhookAge > 300) {
          console.warn("[Stripe Webhook] Timestamp too old:", webhookAge, "seconds");
          return res.status(400).json({ error: "Webhook timestamp too old" });
        }
        const rawBody = req.rawBody;
        if (!rawBody) {
          console.error("[Stripe Webhook] No raw body available for signature verification");
          return res.status(500).json({ error: "Raw body not available" });
        }
        const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody);
        const signedPayload = `${timestamp2}.${bodyString}`;
        const expectedSignature = crypto4.createHmac("sha256", stripeConfig.webhookSecret).update(signedPayload).digest("hex");
        const isValid = signatures.some((s) => {
          try {
            return crypto4.timingSafeEqual(Buffer.from(s, "hex"), Buffer.from(expectedSignature, "hex"));
          } catch {
            return false;
          }
        });
        if (!isValid) {
          console.warn("[Stripe Webhook] Invalid signature");
          return res.status(400).json({ error: "Invalid signature" });
        }
        event = req.body;
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification error:", err);
        return res.status(400).json({ error: "Signature verification failed" });
      }
      console.log("[Stripe Webhook] Received event:", event.type);
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.client_reference_id || session.metadata?.user_id;
          const tierSlug = session.metadata?.tier_slug;
          if (userId && tierSlug) {
            const credits = getCreditsForTier(tierSlug);
            const subscriptionExpiresAt = /* @__PURE__ */ new Date();
            subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
            await handleSubscriptionUpdate({
              userId,
              tierSlug,
              credits,
              subscriptionExpiresAt,
              source: "stripe",
              transactionId: session.id
            });
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.renewed": {
          const subscription = event.data.object;
          const userId = subscription.metadata?.user_id;
          const tierSlug = subscription.metadata?.tier_slug;
          if (userId && tierSlug) {
            const credits = getCreditsForTier(tierSlug);
            const subscriptionExpiresAt = subscription.current_period_end ? new Date(subscription.current_period_end * 1e3) : void 0;
            await handleSubscriptionUpdate({
              userId,
              tierSlug,
              credits,
              subscriptionExpiresAt,
              source: "stripe",
              transactionId: subscription.id
            });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const userId = subscription.metadata?.user_id;
          if (userId) {
            await handleSubscriptionUpdate({
              userId,
              tierSlug: "free",
              credits: getCreditsForTier("free"),
              source: "stripe",
              transactionId: subscription.id
            });
          }
          break;
        }
      }
      await db.insert(activityLogs).values({
        userId: null,
        action: "stripe_webhook",
        metadata: { eventType: event.type, eventId: event.id }
      });
      res.json({ received: true });
    } catch (error) {
      console.error("[Stripe Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.post("/webhooks/revenuecat", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const revenuecatConfig = await getBillingProviderWithKeys("revenuecat");
      if (!revenuecatConfig || !revenuecatConfig.isEnabled) {
        console.warn("[RevenueCat Webhook] RevenueCat is not enabled");
        return res.status(400).json({ error: "RevenueCat is not enabled" });
      }
      if (!revenuecatConfig.webhookSecret) {
        console.error("[RevenueCat Webhook] No webhook secret configured - rejecting");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }
      if (!authHeader) {
        console.warn("[RevenueCat Webhook] No authorization header - rejecting");
        return res.status(401).json({ error: "Missing authorization" });
      }
      const expectedAuth = `Bearer ${revenuecatConfig.webhookSecret}`;
      const authMatch = authHeader.length === expectedAuth.length && crypto4.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth));
      if (!authMatch) {
        console.warn("[RevenueCat Webhook] Invalid authorization header");
        return res.status(401).json({ error: "Invalid authorization" });
      }
      const event = req.body;
      console.log("[RevenueCat Webhook] Received event:", event.event?.type || event.type);
      const eventData = event.event || event;
      const eventType = eventData.type;
      const appUserId = eventData.app_user_id;
      const productId = eventData.product_id;
      const entitlementIds = eventData.entitlement_ids || [];
      const productToTier = {
        "tier_5": "tier_5",
        "tier_15": "tier_15",
        "tier_30": "tier_30",
        "tier_60": "tier_60",
        "mien_kingdom_tier_5": "tier_5",
        "mien_kingdom_tier_15": "tier_15",
        "mien_kingdom_tier_30": "tier_30",
        "mien_kingdom_tier_60": "tier_60"
      };
      const productToCredits = {
        "pack_500": 500,
        "pack_1000": 1e3,
        "pack_2000": 2e3,
        "pack_4000": 4e3,
        "mien_kingdom_pack_500": 500,
        "mien_kingdom_pack_1000": 1e3,
        "mien_kingdom_pack_2000": 2e3,
        "mien_kingdom_pack_4000": 4e3
      };
      switch (eventType) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "PRODUCT_CHANGE": {
          const tierSlug = productToTier[productId];
          if (appUserId && tierSlug) {
            const credits = getCreditsForTier(tierSlug);
            const expirationDate = eventData.expiration_at_ms ? new Date(eventData.expiration_at_ms) : void 0;
            await handleSubscriptionUpdate({
              userId: appUserId,
              tierSlug,
              credits,
              subscriptionExpiresAt: expirationDate,
              source: "revenuecat",
              transactionId: eventData.id || eventData.transaction_id
            });
          }
          break;
        }
        case "CANCELLATION":
        case "EXPIRATION": {
          if (appUserId) {
            await handleSubscriptionCancellation({
              userId: appUserId,
              source: "revenuecat",
              transactionId: eventData.id || eventData.transaction_id
            });
          }
          break;
        }
        case "BILLING_ISSUE": {
          console.warn(`[RevenueCat Webhook] Billing issue for user ${appUserId}`);
          break;
        }
      }
      await db.insert(activityLogs).values({
        userId: appUserId || null,
        action: "revenuecat_webhook",
        metadata: { eventType, productId, appUserId }
      });
      res.json({ received: true });
    } catch (error) {
      console.error("[RevenueCat Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.get("/api/billing/get-checkout-url", requireAuth, async (req, res) => {
    try {
      const { tier, platform } = req.query;
      const userId = req.user?.id;
      const clientPlatform = platform || "web";
      if (!tier || typeof tier !== "string") {
        return res.status(400).json({ error: "tier is required" });
      }
      if (!TIER_CONFIG[tier]) {
        return res.status(400).json({ error: "Invalid tier" });
      }
      const isLocalhost = process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost") || process.env.EXPO_PUBLIC_DOMAIN?.includes("127.0.0.1");
      if (isLocalhost) {
        console.log("[Billing] Local dev mode - returning mock checkout URL for tier:", tier);
        await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, mock: true });
        const mockCheckoutUrl = `http://localhost:3000/api/billing/mock-checkout?tier=${tier}&user_id=${userId}`;
        return res.json({ checkout_url: mockCheckoutUrl, mock: true, provider: "mock" });
      }
      const billingProvider = getBillingProviderForPlatform(clientPlatform);
      const providerReady = await isBillingProviderReady(billingProvider);
      if (clientPlatform === "ios" || clientPlatform === "android") {
        if (!providerReady) {
          console.warn(`[Billing] RevenueCat not configured, falling back to Three Tears`);
        } else {
          const productIdPrefix = "mien_kingdom_";
          const productId = `${productIdPrefix}${tier}`;
          await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, provider: "revenuecat" });
          return res.json({
            provider: "revenuecat",
            productId,
            tier,
            platform: clientPlatform
            // Client should use RevenueCat SDK to initiate purchase
          });
        }
      }
      if (clientPlatform === "web" && providerReady) {
        const stripeConfig = await getBillingProviderWithKeys("stripe");
        if (stripeConfig && stripeConfig.apiKey) {
          try {
            const tierConfig = TIER_CONFIG[tier];
            const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${stripeConfig.apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: new URLSearchParams({
                "mode": "subscription",
                "success_url": `https://mienkingdom.com/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
                "cancel_url": `https://mienkingdom.com/subscription?cancelled=true`,
                "client_reference_id": userId || "",
                "line_items[0][price_data][currency]": stripeConfig.config?.currency || "usd",
                "line_items[0][price_data][product_data][name]": `Mien Kingdom ${tierConfig.name}`,
                "line_items[0][price_data][unit_amount]": String(tierConfig.priceUsd * 100),
                "line_items[0][price_data][recurring][interval]": "month",
                "line_items[0][quantity]": "1",
                "metadata[user_id]": userId || "",
                "metadata[tier_slug]": tier
              })
            });
            if (response.ok) {
              const session = await response.json();
              await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, provider: "stripe" });
              return res.json({
                checkout_url: session.url,
                provider: "stripe",
                sessionId: session.id
              });
            } else {
              const error = await response.json();
              console.error("[Billing] Stripe checkout session creation failed:", error);
            }
          } catch (stripeError) {
            console.error("[Billing] Stripe error:", stripeError);
          }
        }
      }
      const mainAppUrl = await getMainAppBaseUrl();
      const appId = await getAppId();
      const params = new URLSearchParams({
        user_id: userId || "",
        target_tier_slug: tier,
        app_id: appId,
        return_url: `https://mienkingdom.com/subscription?success=true`,
        cancel_url: `https://mienkingdom.com/subscription?cancelled=true`
      });
      const checkoutResponse = await fetch(`${mainAppUrl}/api/billing/checkout-url?${params.toString()}`, {
        method: "GET"
      });
      const responseText = await checkoutResponse.text();
      const contentType = checkoutResponse.headers.get("content-type") || "";
      if (!checkoutResponse.ok) {
        console.error(`[Billing] Failed to get checkout URL: status=${checkoutResponse.status}, content-type=${contentType}, body=${responseText.substring(0, 500)}`);
        return res.status(500).json({ error: "Failed to get checkout URL" });
      }
      if (!contentType.includes("application/json")) {
        console.error(`[Billing] Expected JSON but got ${contentType}. URL: ${mainAppUrl}/api/billing/checkout-url`);
        return res.status(500).json({ error: "Billing service returned invalid response" });
      }
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Billing] JSON parse error. Response was: ${responseText.substring(0, 500)}`);
        return res.status(500).json({ error: "Failed to parse billing response" });
      }
      const { checkout_url } = data;
      if (!checkout_url) {
        console.error(`[Billing] No checkout_url in response:`, data);
        return res.status(500).json({ error: "Billing service did not return checkout URL" });
      }
      await logActivity(userId || null, "checkout_initiated", { tier, platform: clientPlatform, provider: "three_tears" });
      res.json({ checkout_url, provider: "three_tears" });
    } catch (error) {
      console.error("[Billing] Checkout URL error:", error);
      res.status(500).json({ error: "Failed to get checkout URL" });
    }
  });
  app2.get("/api/billing/mock-checkout", requireAuth, async (req, res) => {
    const isDev = process.env.NODE_ENV === "development";
    const isLocalhost = process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost") || process.env.EXPO_PUBLIC_DOMAIN?.includes("127.0.0.1");
    if (!isDev || !isLocalhost) {
      return res.status(404).json({ error: "Not found" });
    }
    const { tier } = req.query;
    const user_id = req.user.id;
    const wantsJson = req.headers.accept?.includes("application/json");
    try {
      if (tier && typeof tier === "string") {
        const tierConfig = TIER_CONFIG[tier];
        if (!tierConfig) {
          return wantsJson ? res.status(400).json({ error: "Invalid tier" }) : res.status(400).send("Invalid tier");
        }
        const tierCredits = getCreditsForTier(tier);
        const subscriptionExpiresAt = /* @__PURE__ */ new Date();
        subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
        await db.update(users).set({
          tierSlug: tier,
          credits: tierCredits,
          subscriptionActive: tier !== "free",
          subscriptionExpiresAt,
          lastCreditReset: /* @__PURE__ */ new Date()
        }).where(eq13(users.id, user_id));
        console.log(`[Mock Billing] Upgraded user ${user_id} to tier ${tier} with ${tierCredits} credits`);
        await logActivity(user_id, "mock_tier_upgrade", { tier, credits: tierCredits });
        if (wantsJson) {
          return res.json({
            success: true,
            type: "tier_upgrade",
            tier,
            credits: tierCredits,
            subscriptionExpiresAt: subscriptionExpiresAt.toISOString()
          });
        }
        return res.redirect("http://localhost:3000/subscription?success=true");
      }
      return wantsJson ? res.status(400).json({ error: "Invalid parameters" }) : res.status(400).send("Invalid parameters");
    } catch (error) {
      console.error("[Mock Billing] Error:", error);
      return wantsJson ? res.status(500).json({ error: "Mock checkout failed" }) : res.status(500).send("Mock checkout failed");
    }
  });
  app2.get("/api/subscription", requireAuth, async (req, res) => {
    try {
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store"
      });
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select({
        tierSlug: users.tierSlug,
        credits: users.credits,
        subscriptionActive: users.subscriptionActive,
        subscriptionExpiresAt: users.subscriptionExpiresAt
      }).from(users).where(eq13(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        tierSlug: user.tierSlug,
        credits: user.credits,
        subscriptionActive: user.subscriptionActive,
        subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() || null,
        tiers: TIER_ORDER.map((slug) => TIER_CONFIG[slug])
      });
    } catch (error) {
      console.error("[Subscription] Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });
  app2.get("/api/credits/history", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;
      const transactions = await db.select().from(creditTransactions).where(eq13(creditTransactions.userId, userId)).orderBy(desc3(creditTransactions.createdAt)).limit(limit).offset(offset);
      const [{ total }] = await db.select({ total: count2() }).from(creditTransactions).where(eq13(creditTransactions.userId, userId));
      const featureStats = await db.select({
        feature: creditTransactions.feature,
        totalUsed: count2()
      }).from(creditTransactions).where(and5(
        eq13(creditTransactions.userId, userId),
        eq13(creditTransactions.type, "deduction")
      )).groupBy(creditTransactions.feature);
      res.json({
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          feature: t.feature,
          description: t.description,
          createdAt: t.createdAt.toISOString()
        })),
        total,
        featureStats: featureStats.reduce((acc, stat) => {
          if (stat.feature) acc[stat.feature] = Number(stat.totalUsed);
          return acc;
        }, {})
      });
    } catch (error) {
      console.error("[Credits] Error fetching credit history:", error);
      res.status(500).json({ error: "Failed to fetch credit history" });
    }
  });
  app2.get("/api/help/query-count", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const [result] = await db.select({ count: count2() }).from(helpQueries).where(and5(
        eq13(helpQueries.userId, user.id),
        gte2(helpQueries.createdAt, today)
      ));
      res.json({ count: result?.count || 0, limit: 30 });
    } catch (error) {
      console.error("[Help] Error fetching query count:", error);
      res.status(500).json({ error: "Failed to fetch query count" });
    }
  });
  app2.post("/api/help/chat", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const { message, context } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const [queryCount] = await db.select({ count: count2() }).from(helpQueries).where(and5(
        eq13(helpQueries.userId, user.id),
        gte2(helpQueries.createdAt, today)
      ));
      if ((queryCount?.count || 0) >= 30) {
        return res.status(429).json({
          error: "Daily query limit reached",
          response: "You've reached your daily limit of 30 questions. Please try again tomorrow or contact support for urgent issues."
        });
      }
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "AI service not configured" });
      }
      const genAI = new GoogleGenAI({ apiKey });
      const systemPrompt = `You are a helpful assistant for Mien Kingdom, a social app for the Mien ethnic community. 
Answer questions based on the following help articles. Be concise and helpful. 
If you don't know the answer or the question is not covered in the articles, say "I'm not sure about that. Would you like to contact our support team for more help?"

Help Articles Context:
${context || "No context provided"}

User Question: ${message}`;
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: systemPrompt
      });
      const responseText = result.text || "I apologize, I couldn't generate a response. Please try again.";
      await db.insert(helpQueries).values({
        userId: user.id,
        query: message,
        response: responseText
      });
      await logActivity(user.id, "help_chat_query", { query: message.substring(0, 100) });
      logFeatureUsage({
        userId: user.id,
        category: "ai_assistant",
        featureName: "help_chat",
        metadata: { queryLength: message.length },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.json({ response: responseText });
    } catch (error) {
      console.error("[Help] Chat error:", error);
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_assistant",
        featureName: "help_chat",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.status(500).json({ error: "Failed to process question", response: "Sorry, something went wrong. Please try again." });
    }
  });
  const requireSyncAuth = (req, res, next) => {
    const syncSecret = process.env.THREE_TEARS_ENROLLMENT_SECRET;
    if (!syncSecret) {
      return res.status(500).json({ error: "Sync not configured" });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${syncSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };
  app2.post("/api/sync/tickets", requireSyncAuth, async (req, res) => {
    try {
      const { tickets } = req.body;
      console.log("[Sync] Received tickets sync request");
      await logActivity(null, "sync_tickets_received", { count: tickets?.length || 0 });
      res.json({ success: true });
    } catch (error) {
      console.error("[Sync] Tickets sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });
  app2.post("/api/sync/users", requireSyncAuth, async (req, res) => {
    try {
      const { users: syncUsers } = req.body;
      console.log("[Sync] Received users sync request");
      await logActivity(null, "sync_users_received", { count: syncUsers?.length || 0 });
      res.json({ success: true });
    } catch (error) {
      console.error("[Sync] Users sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });
  app2.get("/api/messages/friends", requireAuth, async (req, res) => {
    try {
      const isAdmin = req.user.role === "admin";
      if (isAdmin) {
        const allUsers = await db.select({
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }).from(users).where(sql6`${users.id} != ${req.user.id}`).orderBy(users.displayName).limit(500);
        res.json({ friends: allUsers });
      } else {
        const friends = await getFriendsList(req.user.id);
        res.json({ friends });
      }
    } catch (error) {
      console.error("[Messages] Get friends error:", error);
      res.status(500).json({ error: "Failed to get friends list" });
    }
  });
  app2.get("/api/messages/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await getUserConversations(req.user.id);
      res.json({ conversations });
    } catch (error) {
      console.error("[Messages] Get conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });
  app2.post("/api/messages/conversations", requireAuth, async (req, res) => {
    try {
      const { participantId } = req.body;
      if (!participantId) {
        return res.status(400).json({ error: "Participant ID is required" });
      }
      if (participantId === req.user.id) {
        return res.status(400).json({ error: "Cannot create conversation with yourself" });
      }
      const isAdmin = req.user.role === "admin";
      if (!isAdmin) {
        const areFriends = await areMutualFollowers(req.user.id, participantId);
        if (!areFriends) {
          return res.status(403).json({ error: "You can only message friends (mutual followers)" });
        }
      }
      const conversation = await getOrCreateConversation(req.user.id, participantId);
      const [participant] = await db.select({
        id: users.id,
        displayName: users.displayName,
        avatar: users.avatar
      }).from(users).where(eq13(users.id, participantId));
      res.json({
        conversation: {
          ...conversation,
          participant
        }
      });
    } catch (error) {
      console.error("[Messages] Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });
  app2.get("/api/messages/conversations/:conversationId/messages", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { before, limit } = req.query;
      const isParticipant = await isConversationParticipant(conversationId, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized to view this conversation" });
      }
      const messages = await getConversationMessages(
        conversationId,
        limit ? parseInt(limit) : 50,
        before
      );
      res.json({ messages });
    } catch (error) {
      console.error("[Messages] Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });
  app2.post("/api/messages/conversations/:conversationId/messages", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { encryptedContent, encryptedContentIv, messageType } = req.body;
      if (!encryptedContent || !encryptedContentIv) {
        return res.status(400).json({ error: "Encrypted content and IV are required" });
      }
      const isParticipant = await isConversationParticipant(conversationId, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized to send messages in this conversation" });
      }
      const message = await sendEncryptedMessage(
        conversationId,
        req.user.id,
        encryptedContent,
        encryptedContentIv,
        messageType || "text"
      );
      const conversation = await getConversation(conversationId);
      if (conversation) {
        broadcastNewMessage(conversationId, [conversation.participant1Id, conversation.participant2Id], {
          id: message.id,
          senderId: message.senderId,
          encryptedContent: message.encryptedContent,
          encryptedContentIv: message.encryptedContentIv,
          messageType: message.messageType,
          createdAt: message.createdAt.toISOString()
        });
      }
      res.json({ message });
    } catch (error) {
      console.error("[Messages] Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.post("/api/messages/conversations/:conversationId/read", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { messageIds } = req.body;
      const isParticipant = await isConversationParticipant(conversationId, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }
      await markMessagesAsRead(conversationId, req.user.id, messageIds);
      res.json({ success: true });
    } catch (error) {
      console.error("[Messages] Mark read error:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });
  app2.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      const count3 = await getUnreadMessageCount(req.user.id);
      res.json({ count: count3 });
    } catch (error) {
      console.error("[Messages] Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });
  app2.get("/api/messages/keys/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const keys = await getUserPublicKeys(userId);
      if (!keys) {
        return res.status(404).json({ error: "User has not set up encryption keys" });
      }
      res.json({
        publicKey: keys.publicKey,
        identityPublicKey: keys.identityPublicKey,
        signedPreKey: keys.signedPreKey,
        preKeySignature: keys.preKeySignature
      });
    } catch (error) {
      console.error("[Messages] Get public keys error:", error);
      res.status(500).json({ error: "Failed to get public keys" });
    }
  });
  app2.post("/api/messages/keys", requireAuth, async (req, res) => {
    try {
      const { publicKey, identityPublicKey, signedPreKey, preKeySignature } = req.body;
      if (!publicKey || !identityPublicKey || !signedPreKey || !preKeySignature) {
        return res.status(400).json({ error: "All key fields are required" });
      }
      const keys = await saveUserPublicKeys(
        req.user.id,
        publicKey,
        identityPublicKey,
        signedPreKey,
        preKeySignature
      );
      res.json({ success: true, keys });
    } catch (error) {
      console.error("[Messages] Save public keys error:", error);
      res.status(500).json({ error: "Failed to save public keys" });
    }
  });
  app2.get("/api/messages/keys", requireAuth, async (req, res) => {
    try {
      const keys = await getUserPublicKeys(req.user.id);
      res.json({ keys });
    } catch (error) {
      console.error("[Messages] Get own keys error:", error);
      res.status(500).json({ error: "Failed to get keys" });
    }
  });
  app2.post("/api/messages/conversations/:conversationId/key", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { encryptedSharedKey, encryptedSharedKeyIv } = req.body;
      const isParticipant = await isConversationParticipant(conversationId, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const key = await saveConversationKey(
        conversationId,
        req.user.id,
        encryptedSharedKey,
        encryptedSharedKeyIv
      );
      res.json({ success: true, key });
    } catch (error) {
      console.error("[Messages] Save conversation key error:", error);
      res.status(500).json({ error: "Failed to save conversation key" });
    }
  });
  app2.get("/api/messages/conversations/:conversationId/key", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const isParticipant = await isConversationParticipant(conversationId, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const key = await getConversationKey(conversationId, req.user.id);
      res.json({ key });
    } catch (error) {
      console.error("[Messages] Get conversation key error:", error);
      res.status(500).json({ error: "Failed to get conversation key" });
    }
  });
  const avatarLastDeduction = /* @__PURE__ */ new Map();
  const AVATAR_MIN_DEDUCTION_INTERVAL_MS = 55e3;
  const AVATAR_CREDITS_PER_MINUTE = 20;
  app2.post("/api/avatar/deduct-credits", requireAuth, async (req, res) => {
    try {
      const { credits } = req.body;
      const userId = req.user.id;
      const lastDeduction = avatarLastDeduction.get(userId);
      const now = Date.now();
      if (lastDeduction && now - lastDeduction < AVATAR_MIN_DEDUCTION_INTERVAL_MS) {
        return res.status(429).json({
          error: "Too many requests",
          message: "Credit deduction rate limit exceeded",
          retryAfter: Math.ceil((AVATAR_MIN_DEDUCTION_INTERVAL_MS - (now - lastDeduction)) / 1e3)
        });
      }
      if (credits !== AVATAR_CREDITS_PER_MINUTE) {
        return res.status(400).json({
          error: "Invalid credits amount",
          message: `Avatar session requires exactly ${AVATAR_CREDITS_PER_MINUTE} credits per minute`
        });
      }
      const [user] = await db.select({
        subscriptionCredits: users.credits,
        packCredits: users.packCredits,
        tierSlug: users.tierSlug
      }).from(users).where(eq13(users.id, userId));
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const totalCredits = user.subscriptionCredits + user.packCredits;
      if (totalCredits < credits) {
        await db.insert(activityLogs).values({
          userId,
          action: "avatar_insufficient_credits",
          metadata: {
            required: credits,
            subscriptionCredits: user.subscriptionCredits,
            packCredits: user.packCredits,
            totalCredits
          }
        });
        return res.status(402).json({
          error: "Insufficient credits",
          message: "You don't have enough credits to continue the avatar session",
          required: credits,
          available: totalCredits
        });
      }
      let remainingCost = credits;
      let newSubscriptionCredits = user.subscriptionCredits;
      let newPackCredits = user.packCredits;
      if (newSubscriptionCredits >= remainingCost) {
        newSubscriptionCredits -= remainingCost;
        remainingCost = 0;
      } else {
        remainingCost -= newSubscriptionCredits;
        newSubscriptionCredits = 0;
        newPackCredits -= remainingCost;
        remainingCost = 0;
      }
      await db.update(users).set({
        credits: newSubscriptionCredits,
        packCredits: newPackCredits
      }).where(eq13(users.id, userId));
      const newTotalCredits = newSubscriptionCredits + newPackCredits;
      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -credits,
        balanceAfter: newTotalCredits,
        feature: "avatar_talk_to_ong",
        description: `Used ${credits} credits for AI avatar conversation`
      });
      await db.insert(activityLogs).values({
        userId,
        action: "avatar_credits_deducted",
        metadata: {
          cost: credits,
          subscriptionCredits: newSubscriptionCredits,
          packCredits: newPackCredits,
          totalRemaining: newTotalCredits
        }
      });
      avatarLastDeduction.set(userId, Date.now());
      res.json({
        success: true,
        remainingCredits: newTotalCredits,
        subscriptionCredits: newSubscriptionCredits,
        packCredits: newPackCredits
      });
    } catch (error) {
      console.error("[Avatar] Credit deduction error:", error);
      res.status(500).json({ error: "Failed to deduct credits" });
    }
  });
  app2.get("/api/avatar/status", async (req, res) => {
    try {
      const agentStatus = getAvatarAgentStatus();
      const isAvailable = agentStatus.running && !agentStatus.disabled;
      res.json({
        available: isAvailable,
        disabled: agentStatus.disabled,
        disabledReason: agentStatus.disabledReason
      });
    } catch (error) {
      res.json({
        available: false,
        disabled: true,
        disabledReason: "Unable to check agent status"
      });
    }
  });
  app2.post("/api/avatar/session/start", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      if (!isGeminiConfigured()) {
        return res.status(503).json({
          error: "Avatar service not configured",
          message: "The AI avatar service is not available at this time"
        });
      }
      const livekitUrl = process.env.LIVEKIT_URL;
      const livekitApiKey = process.env.LIVEKIT_API_KEY;
      const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
      const simliApiKey = process.env.SIMLI_API_KEY;
      const simliFaceId = process.env.SIMLI_FACE_ID;
      if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
        return res.status(503).json({
          error: "LiveKit not configured",
          message: "The real-time communication service is not available"
        });
      }
      if (!simliApiKey || !simliFaceId) {
        return res.status(503).json({
          error: "Avatar rendering not configured",
          message: "The avatar rendering service is not available"
        });
      }
      const sessionId = `avatar_${userId}_${Date.now()}`;
      const roomName = `ong-room-${userId}-${Date.now()}`;
      const apiKey = getNextGeminiApiKey(sessionId);
      if (!apiKey) {
        return res.status(503).json({
          error: "No API keys available",
          message: "Unable to start avatar session. Please try again later."
        });
      }
      const geminiKeyIndex = getGeminiKeyForSession(sessionId);
      const { AccessToken, RoomServiceClient } = await import("livekit-server-sdk");
      const at = new AccessToken(livekitApiKey, livekitApiSecret, {
        identity: userId,
        name: `User ${userId}`,
        ttl: "1h"
      });
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      });
      const token = await at.toJwt();
      const roomService = new RoomServiceClient(livekitUrl, livekitApiKey, livekitApiSecret);
      try {
        await roomService.createRoom({
          name: roomName,
          metadata: JSON.stringify({
            geminiKeyIndex,
            sessionId,
            userId
          })
        });
        console.log(`[Avatar] Created LiveKit room: ${roomName}`);
      } catch (roomError) {
        console.log(`[Avatar] Room may already exist or creation skipped: ${roomError}`);
      }
      console.log(`[Avatar] Room ${roomName} ready for Python agent connection`);
      await db.insert(activityLogs).values({
        userId,
        action: "avatar_session_started",
        metadata: { sessionId, roomName, geminiKeyIndex }
      });
      const avatarSessionId = await createAvatarSession(userId, "ong", void 0, req.get("User-Agent")?.includes("Mobile") ? "mobile" : "web");
      logFeatureUsage({
        userId,
        category: "avatar",
        featureName: "avatar_session",
        subFeature: "ong",
        metadata: { sessionId, roomName, avatarSessionId },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.json({
        success: true,
        sessionId,
        roomName,
        token,
        livekitUrl,
        avatarSessionId,
        simliConfig: {
          faceId: simliFaceId
        }
      });
    } catch (error) {
      console.error("[Avatar] Session start error:", error);
      logFeatureUsage({
        userId: req.user?.id,
        category: "avatar",
        featureName: "avatar_session",
        subFeature: "ong",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.status(500).json({ error: "Failed to start avatar session" });
    }
  });
  app2.post("/api/avatar/session/end", requireAuth, async (req, res) => {
    try {
      const { sessionId, avatarSessionId, messageCount, userMessageCount, avatarResponseCount } = req.body;
      const userId = req.user.id;
      if (sessionId) {
        releaseGeminiApiKey(sessionId);
      }
      if (avatarSessionId) {
        await endAvatarSession(avatarSessionId, messageCount, userMessageCount, avatarResponseCount, "completed");
      }
      avatarLastDeduction.delete(userId);
      await db.insert(activityLogs).values({
        userId,
        action: "avatar_session_ended",
        metadata: { sessionId, avatarSessionId, messageCount }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("[Avatar] Session end error:", error);
      res.status(500).json({ error: "Failed to end avatar session" });
    }
  });
  app2.get("/api/avatar/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const keyStatus = getKeyStatus();
      res.json({
        configured: isGeminiConfigured(),
        geminiKeys: keyStatus,
        livekitConfigured: !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY),
        simliConfigured: !!(process.env.SIMLI_API_KEY && process.env.SIMLI_FACE_ID)
      });
    } catch (error) {
      console.error("[Avatar] Status check error:", error);
      res.status(500).json({ error: "Failed to get avatar status" });
    }
  });
  app2.get("/api/admin/usage/summary", requireAuth, requireModerator, async (req, res) => {
    try {
      const { startDate, endDate, category } = req.query;
      const now = /* @__PURE__ */ new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : now;
      const conditions = [
        gte2(featureUsage.createdAt, start),
        gte2(end, featureUsage.createdAt)
      ];
      if (category && category !== "all") {
        conditions.push(eq13(featureUsage.category, category));
      }
      const usageByFeature = await db.select({
        category: featureUsage.category,
        featureName: featureUsage.featureName,
        totalCount: count2(),
        successCount: sql6`COUNT(*) FILTER (WHERE ${featureUsage.status} = 'success')`,
        failedCount: sql6`COUNT(*) FILTER (WHERE ${featureUsage.status} = 'failed')`,
        totalCredits: sql6`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
        uniqueUsers: sql6`COUNT(DISTINCT ${featureUsage.userId})`
      }).from(featureUsage).where(and5(...conditions)).groupBy(featureUsage.category, featureUsage.featureName).orderBy(desc3(sql6`COUNT(*)`));
      const usageBySubFeature = await db.select({
        category: featureUsage.category,
        featureName: featureUsage.featureName,
        subFeature: featureUsage.subFeature,
        totalCount: count2(),
        uniqueUsers: sql6`COUNT(DISTINCT ${featureUsage.userId})`
      }).from(featureUsage).where(and5(...conditions, sql6`${featureUsage.subFeature} IS NOT NULL`)).groupBy(featureUsage.category, featureUsage.featureName, featureUsage.subFeature).orderBy(desc3(sql6`COUNT(*)`));
      const dailyTrends = await db.select({
        date: sql6`DATE(${featureUsage.createdAt})`,
        totalCount: count2(),
        uniqueUsers: sql6`COUNT(DISTINCT ${featureUsage.userId})`
      }).from(featureUsage).where(and5(...conditions)).groupBy(sql6`DATE(${featureUsage.createdAt})`).orderBy(sql6`DATE(${featureUsage.createdAt})`);
      const [totals] = await db.select({
        totalUsage: count2(),
        totalCreditsUsed: sql6`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
        uniqueUsers: sql6`COUNT(DISTINCT ${featureUsage.userId})`,
        successRate: sql6`ROUND(100.0 * COUNT(*) FILTER (WHERE ${featureUsage.status} = 'success') / NULLIF(COUNT(*), 0), 1)`
      }).from(featureUsage).where(and5(...conditions));
      res.json({
        summary: {
          totalUsage: totals?.totalUsage || 0,
          totalCreditsUsed: totals?.totalCreditsUsed || 0,
          uniqueUsers: totals?.uniqueUsers || 0,
          successRate: totals?.successRate || 0,
          dateRange: { start, end }
        },
        byFeature: usageByFeature,
        bySubFeature: usageBySubFeature,
        dailyTrends
      });
    } catch (error) {
      console.error("Failed to fetch usage summary:", error);
      res.status(500).json({ error: "Failed to fetch usage summary" });
    }
  });
  app2.get("/api/admin/usage/ai-features", requireAuth, requireModerator, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const now = /* @__PURE__ */ new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : now;
      const aiGenerationUsage = await db.select({
        featureName: featureUsage.featureName,
        subFeature: featureUsage.subFeature,
        totalCount: count2(),
        successCount: sql6`COUNT(*) FILTER (WHERE ${featureUsage.status} = 'success')`,
        totalCredits: sql6`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
        uniqueUsers: sql6`COUNT(DISTINCT ${featureUsage.userId})`,
        avgDuration: sql6`ROUND(AVG(${featureUsage.durationMs}))`
      }).from(featureUsage).where(and5(
        gte2(featureUsage.createdAt, start),
        gte2(end, featureUsage.createdAt),
        inArray3(featureUsage.category, ["ai_generation", "ai_translation", "ai_assistant"])
      )).groupBy(featureUsage.featureName, featureUsage.subFeature).orderBy(desc3(sql6`COUNT(*)`));
      const artGenerationsUsage = await db.select({
        type: artGenerations.type,
        totalCount: count2(),
        totalCredits: sql6`COALESCE(SUM(${artGenerations.creditsUsed}), 0)`,
        uniqueUsers: sql6`COUNT(DISTINCT ${artGenerations.userId})`
      }).from(artGenerations).where(and5(
        gte2(artGenerations.createdAt, start),
        gte2(end, artGenerations.createdAt)
      )).groupBy(artGenerations.type).orderBy(desc3(sql6`COUNT(*)`));
      const helpChatUsage = await db.select({
        totalCount: count2(),
        uniqueUsers: sql6`COUNT(DISTINCT ${helpQueries.userId})`
      }).from(helpQueries).where(and5(
        gte2(helpQueries.createdAt, start),
        gte2(end, helpQueries.createdAt)
      ));
      res.json({
        aiFeatures: aiGenerationUsage,
        artGenerations: artGenerationsUsage,
        helpChat: helpChatUsage[0] || { totalCount: 0, uniqueUsers: 0 },
        dateRange: { start, end }
      });
    } catch (error) {
      console.error("Failed to fetch AI feature usage:", error);
      res.status(500).json({ error: "Failed to fetch AI feature usage" });
    }
  });
  app2.get("/api/admin/usage/avatar-sessions", requireAuth, requireModerator, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const now = /* @__PURE__ */ new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : now;
      const sessionStats = await db.select({
        avatarType: avatarSessions.avatarType,
        voiceUsed: avatarSessions.voiceUsed,
        totalSessions: count2(),
        completedSessions: sql6`COUNT(*) FILTER (WHERE ${avatarSessions.status} = 'completed')`,
        failedSessions: sql6`COUNT(*) FILTER (WHERE ${avatarSessions.status} = 'failed')`,
        totalDurationSeconds: sql6`COALESCE(SUM(${avatarSessions.durationSeconds}), 0)`,
        avgDurationSeconds: sql6`ROUND(AVG(${avatarSessions.durationSeconds}))`,
        totalMessages: sql6`COALESCE(SUM(${avatarSessions.messageCount}), 0)`,
        avgMessagesPerSession: sql6`ROUND(AVG(${avatarSessions.messageCount}))`,
        uniqueUsers: sql6`COUNT(DISTINCT ${avatarSessions.userId})`
      }).from(avatarSessions).where(and5(
        gte2(avatarSessions.createdAt, start),
        gte2(end, avatarSessions.createdAt)
      )).groupBy(avatarSessions.avatarType, avatarSessions.voiceUsed).orderBy(desc3(sql6`COUNT(*)`));
      const dailyTrends = await db.select({
        date: sql6`DATE(${avatarSessions.createdAt})`,
        totalSessions: count2(),
        uniqueUsers: sql6`COUNT(DISTINCT ${avatarSessions.userId})`,
        avgDurationSeconds: sql6`ROUND(AVG(${avatarSessions.durationSeconds}))`
      }).from(avatarSessions).where(and5(
        gte2(avatarSessions.createdAt, start),
        gte2(end, avatarSessions.createdAt)
      )).groupBy(sql6`DATE(${avatarSessions.createdAt})`).orderBy(sql6`DATE(${avatarSessions.createdAt})`);
      const platformStats = await db.select({
        platform: avatarSessions.platform,
        totalSessions: count2(),
        uniqueUsers: sql6`COUNT(DISTINCT ${avatarSessions.userId})`
      }).from(avatarSessions).where(and5(
        gte2(avatarSessions.createdAt, start),
        gte2(end, avatarSessions.createdAt)
      )).groupBy(avatarSessions.platform).orderBy(desc3(sql6`COUNT(*)`));
      const [totals] = await db.select({
        totalSessions: count2(),
        uniqueUsers: sql6`COUNT(DISTINCT ${avatarSessions.userId})`,
        totalDurationHours: sql6`ROUND(COALESCE(SUM(${avatarSessions.durationSeconds}), 0) / 3600.0, 1)`,
        avgSessionDuration: sql6`ROUND(AVG(${avatarSessions.durationSeconds}))`,
        successRate: sql6`ROUND(100.0 * COUNT(*) FILTER (WHERE ${avatarSessions.status} = 'completed') / NULLIF(COUNT(*), 0), 1)`
      }).from(avatarSessions).where(and5(
        gte2(avatarSessions.createdAt, start),
        gte2(end, avatarSessions.createdAt)
      ));
      res.json({
        summary: {
          totalSessions: totals?.totalSessions || 0,
          uniqueUsers: totals?.uniqueUsers || 0,
          totalDurationHours: totals?.totalDurationHours || 0,
          avgSessionDuration: totals?.avgSessionDuration || 0,
          successRate: totals?.successRate || 0
        },
        byAvatarType: sessionStats,
        byPlatform: platformStats,
        dailyTrends,
        dateRange: { start, end }
      });
    } catch (error) {
      console.error("Failed to fetch avatar session analytics:", error);
      res.status(500).json({ error: "Failed to fetch avatar session analytics" });
    }
  });
  app2.get("/api/admin/usage/logs", requireAuth, requireModerator, async (req, res) => {
    try {
      const { page = "1", limit = "50", category, featureName, status } = req.query;
      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit), 100);
      const offset = (pageNum - 1) * limitNum;
      const conditions = [];
      if (category && category !== "all") {
        conditions.push(eq13(featureUsage.category, category));
      }
      if (featureName && featureName !== "all") {
        conditions.push(eq13(featureUsage.featureName, featureName));
      }
      if (status && status !== "all") {
        conditions.push(eq13(featureUsage.status, status));
      }
      const [logs, totalResult] = await Promise.all([
        db.select({
          id: featureUsage.id,
          userId: featureUsage.userId,
          category: featureUsage.category,
          featureName: featureUsage.featureName,
          subFeature: featureUsage.subFeature,
          status: featureUsage.status,
          creditsUsed: featureUsage.creditsUsed,
          durationMs: featureUsage.durationMs,
          createdAt: featureUsage.createdAt,
          userDisplayName: users.displayName,
          userEmail: users.email
        }).from(featureUsage).leftJoin(users, eq13(featureUsage.userId, users.id)).where(conditions.length > 0 ? and5(...conditions) : void 0).orderBy(desc3(featureUsage.createdAt)).limit(limitNum).offset(offset),
        db.select({ count: count2() }).from(featureUsage).where(conditions.length > 0 ? and5(...conditions) : void 0)
      ]);
      res.json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResult[0]?.count || 0,
          totalPages: Math.ceil((totalResult[0]?.count || 0) / limitNum)
        }
      });
    } catch (error) {
      console.error("Failed to fetch usage logs:", error);
      res.status(500).json({ error: "Failed to fetch usage logs" });
    }
  });
  app2.get("/api/admin/usage/top-users", requireAuth, requireModerator, async (req, res) => {
    try {
      const { startDate, endDate, limit = "10" } = req.query;
      const now = /* @__PURE__ */ new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : now;
      const limitNum = Math.min(parseInt(limit), 50);
      const topUsers = await db.select({
        userId: featureUsage.userId,
        displayName: users.displayName,
        email: users.email,
        avatar: users.avatar,
        totalUsage: count2(),
        totalCreditsUsed: sql6`COALESCE(SUM(${featureUsage.creditsUsed}), 0)`,
        featuresUsed: sql6`COUNT(DISTINCT ${featureUsage.featureName})`
      }).from(featureUsage).innerJoin(users, eq13(featureUsage.userId, users.id)).where(and5(
        gte2(featureUsage.createdAt, start),
        gte2(end, featureUsage.createdAt)
      )).groupBy(featureUsage.userId, users.displayName, users.email, users.avatar).orderBy(desc3(sql6`COUNT(*)`)).limit(limitNum);
      res.json({
        topUsers,
        dateRange: { start, end }
      });
    } catch (error) {
      console.error("Failed to fetch top users:", error);
      res.status(500).json({ error: "Failed to fetch top users" });
    }
  });
  async function initializeDefaultCategories(userId) {
    const existingCategories = await db.select().from(recipeCategories).where(eq13(recipeCategories.userId, userId)).limit(1);
    if (existingCategories.length === 0) {
      const categoriesToInsert = DEFAULT_RECIPE_CATEGORIES.map((cat) => ({
        userId,
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isDefault: true
      }));
      await db.insert(recipeCategories).values(categoriesToInsert);
    }
  }
  app2.get("/api/recipe-categories", requireAuth, async (req, res) => {
    try {
      await initializeDefaultCategories(req.user.id);
      const categories = await db.select({
        id: recipeCategories.id,
        name: recipeCategories.name,
        description: recipeCategories.description,
        thumbnailUrl: recipeCategories.thumbnailUrl,
        thumbnailRecipeId: recipeCategories.thumbnailRecipeId,
        displayOrder: recipeCategories.displayOrder,
        isDefault: recipeCategories.isDefault,
        createdAt: recipeCategories.createdAt,
        recipeCount: sql6`(SELECT COUNT(*) FROM saved_recipes WHERE category_id = ${recipeCategories.id})`
      }).from(recipeCategories).where(eq13(recipeCategories.userId, req.user.id)).orderBy(recipeCategories.displayOrder);
      res.json({ categories });
    } catch (error) {
      console.error("Failed to fetch recipe categories:", error);
      res.status(500).json({ error: "Failed to fetch recipe categories" });
    }
  });
  app2.post("/api/recipe-categories", requireAuth, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      const maxOrder = await db.select({ maxOrder: sql6`COALESCE(MAX(display_order), 0)` }).from(recipeCategories).where(eq13(recipeCategories.userId, req.user.id));
      const newCategory = await db.insert(recipeCategories).values({
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        displayOrder: (maxOrder[0]?.maxOrder || 0) + 1,
        isDefault: false
      }).returning();
      res.json({ category: newCategory[0] });
    } catch (error) {
      console.error("Failed to create recipe category:", error);
      res.status(500).json({ error: "Failed to create recipe category" });
    }
  });
  app2.patch("/api/recipe-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, displayOrder } = req.body;
      const category = await db.select().from(recipeCategories).where(and5(eq13(recipeCategories.id, id), eq13(recipeCategories.userId, req.user.id))).limit(1);
      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (name !== void 0) updateData.name = name.trim();
      if (description !== void 0) updateData.description = description?.trim() || null;
      if (displayOrder !== void 0) updateData.displayOrder = displayOrder;
      const updatedCategory = await db.update(recipeCategories).set(updateData).where(eq13(recipeCategories.id, id)).returning();
      res.json({ category: updatedCategory[0] });
    } catch (error) {
      console.error("Failed to update recipe category:", error);
      res.status(500).json({ error: "Failed to update recipe category" });
    }
  });
  app2.delete("/api/recipe-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await db.select().from(recipeCategories).where(and5(eq13(recipeCategories.id, id), eq13(recipeCategories.userId, req.user.id))).limit(1);
      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      await db.delete(recipeCategories).where(eq13(recipeCategories.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete recipe category:", error);
      res.status(500).json({ error: "Failed to delete recipe category" });
    }
  });
  app2.patch("/api/recipe-categories/:id/thumbnail", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { recipeId } = req.body;
      const category = await db.select().from(recipeCategories).where(and5(eq13(recipeCategories.id, id), eq13(recipeCategories.userId, req.user.id))).limit(1);
      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      let thumbnailUrl = null;
      let thumbnailRecipeId = null;
      if (recipeId) {
        const recipe = await db.select().from(savedRecipes).where(and5(eq13(savedRecipes.id, recipeId), eq13(savedRecipes.userId, req.user.id))).limit(1);
        if (recipe.length === 0) {
          return res.status(404).json({ error: "Recipe not found" });
        }
        thumbnailUrl = recipe[0].primaryPhotoUrl;
        thumbnailRecipeId = recipe[0].id;
      }
      const updatedCategory = await db.update(recipeCategories).set({
        thumbnailUrl,
        thumbnailRecipeId,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq13(recipeCategories.id, id)).returning();
      res.json({ category: updatedCategory[0] });
    } catch (error) {
      console.error("Failed to update category thumbnail:", error);
      res.status(500).json({ error: "Failed to update category thumbnail" });
    }
  });
  app2.get("/api/saved-recipes", requireAuth, async (req, res) => {
    try {
      const { categoryId, isFavorite, isMienDish, limit = "50", offset = "0" } = req.query;
      const conditions = [eq13(savedRecipes.userId, req.user.id)];
      if (categoryId) {
        conditions.push(eq13(savedRecipes.categoryId, categoryId));
      }
      if (isFavorite === "true") {
        conditions.push(eq13(savedRecipes.isFavorite, true));
      }
      if (isMienDish === "true") {
        conditions.push(eq13(savedRecipes.isMienDish, true));
      }
      const recipes = await db.select({
        id: savedRecipes.id,
        recipeName: savedRecipes.recipeName,
        description: savedRecipes.description,
        prepTime: savedRecipes.prepTime,
        cookTime: savedRecipes.cookTime,
        isMienDish: savedRecipes.isMienDish,
        primaryPhotoUrl: savedRecipes.primaryPhotoUrl,
        isFavorite: savedRecipes.isFavorite,
        categoryId: savedRecipes.categoryId,
        createdAt: savedRecipes.createdAt
      }).from(savedRecipes).where(and5(...conditions)).orderBy(desc3(savedRecipes.createdAt)).limit(parseInt(limit)).offset(parseInt(offset));
      res.json({ recipes });
    } catch (error) {
      console.error("Failed to fetch saved recipes:", error);
      res.status(500).json({ error: "Failed to fetch saved recipes" });
    }
  });
  app2.get("/api/saved-recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await db.select().from(savedRecipes).where(and5(eq13(savedRecipes.id, id), eq13(savedRecipes.userId, req.user.id))).limit(1);
      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json({ recipe: recipe[0] });
    } catch (error) {
      console.error("Failed to fetch recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });
  app2.post("/api/saved-recipes", requireAuth, async (req, res) => {
    try {
      const { categoryId, recipe, photos, sourceImageUrl } = req.body;
      if (!categoryId) {
        return res.status(400).json({ error: "Category ID is required" });
      }
      if (!recipe?.recipeName) {
        return res.status(400).json({ error: "Recipe name is required" });
      }
      const category = await db.select().from(recipeCategories).where(and5(eq13(recipeCategories.id, categoryId), eq13(recipeCategories.userId, req.user.id))).limit(1);
      if (category.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      const uploadedPhotoUrls = [];
      if (photos && Array.isArray(photos) && photos.length > 0) {
        for (const photo of photos) {
          try {
            if (isR2Configured()) {
              const result = await uploadBase64ToR2(photo, {
                folder: `recipes/${req.user.id}`
              });
              uploadedPhotoUrls.push(`/api/images/${result.key}`);
            }
          } catch (uploadErr) {
            console.error("Failed to upload recipe photo:", uploadErr);
          }
        }
      }
      const newRecipe = await db.insert(savedRecipes).values({
        userId: req.user.id,
        categoryId,
        recipeName: recipe.recipeName,
        description: recipe.description || null,
        servings: recipe.servings || null,
        prepTime: recipe.prepTime || null,
        cookTime: recipe.cookTime || null,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        shoppingList: recipe.shoppingList || [],
        isMienDish: recipe.isMienDish || false,
        mienHighlights: recipe.mienHighlights || null,
        mienModifications: recipe.mienModifications || null,
        similarMienDish: recipe.similarMienDish || null,
        photos: uploadedPhotoUrls,
        primaryPhotoUrl: uploadedPhotoUrls[0] || null,
        sourceImageUrl: sourceImageUrl || null
      }).returning();
      const recipeCount = await db.select({ count: sql6`count(*)` }).from(savedRecipes).where(eq13(savedRecipes.categoryId, categoryId));
      if (parseInt(String(recipeCount[0].count)) === 1 && uploadedPhotoUrls[0]) {
        await db.update(recipeCategories).set({
          thumbnailUrl: uploadedPhotoUrls[0],
          thumbnailRecipeId: newRecipe[0].id,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq13(recipeCategories.id, categoryId));
      }
      res.json({ recipe: newRecipe[0] });
    } catch (error) {
      console.error("Failed to save recipe:", error);
      res.status(500).json({ error: "Failed to save recipe" });
    }
  });
  app2.patch("/api/saved-recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { categoryId, notes, isFavorite, primaryPhotoUrl } = req.body;
      const recipe = await db.select().from(savedRecipes).where(and5(eq13(savedRecipes.id, id), eq13(savedRecipes.userId, req.user.id))).limit(1);
      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (categoryId !== void 0) {
        const category = await db.select().from(recipeCategories).where(and5(eq13(recipeCategories.id, categoryId), eq13(recipeCategories.userId, req.user.id))).limit(1);
        if (category.length === 0) {
          return res.status(404).json({ error: "Category not found" });
        }
        updateData.categoryId = categoryId;
      }
      if (notes !== void 0) updateData.notes = notes;
      if (isFavorite !== void 0) updateData.isFavorite = isFavorite;
      if (primaryPhotoUrl !== void 0) updateData.primaryPhotoUrl = primaryPhotoUrl;
      const updatedRecipe = await db.update(savedRecipes).set(updateData).where(eq13(savedRecipes.id, id)).returning();
      res.json({ recipe: updatedRecipe[0] });
    } catch (error) {
      console.error("Failed to update recipe:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });
  app2.delete("/api/saved-recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await db.select().from(savedRecipes).where(and5(eq13(savedRecipes.id, id), eq13(savedRecipes.userId, req.user.id))).limit(1);
      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      const categoryId = recipe[0].categoryId;
      await db.delete(savedRecipes).where(eq13(savedRecipes.id, id));
      const category = await db.select().from(recipeCategories).where(eq13(recipeCategories.id, categoryId)).limit(1);
      if (category[0]?.thumbnailRecipeId === id) {
        const nextRecipe = await db.select().from(savedRecipes).where(eq13(savedRecipes.categoryId, categoryId)).orderBy(savedRecipes.createdAt).limit(1);
        await db.update(recipeCategories).set({
          thumbnailUrl: nextRecipe[0]?.primaryPhotoUrl || null,
          thumbnailRecipeId: nextRecipe[0]?.id || null,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq13(recipeCategories.id, categoryId));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });
  app2.post("/api/saved-recipes/:id/share", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { visibility = "public", caption } = req.body;
      const recipe = await db.select().from(savedRecipes).where(and5(eq13(savedRecipes.id, id), eq13(savedRecipes.userId, req.user.id))).limit(1);
      if (recipe.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      const r = recipe[0];
      if (r.sharedPostId) {
        return res.status(400).json({
          error: "Recipe already shared",
          postId: r.sharedPostId
        });
      }
      let postCaption = caption;
      if (!postCaption) {
        postCaption = `${r.recipeName}`;
        if (r.isMienDish) {
          postCaption += ` - A traditional Mien dish!`;
        }
        if (r.description) {
          postCaption += `

${r.description}`;
        }
        postCaption += `

#MienKingdom #Recipe`;
        if (r.isMienDish) {
          postCaption += ` #MienCuisine #TraditionalMien`;
        }
      }
      const validVisibilities = ["public", "followers", "private"];
      const postVisibility = validVisibilities.includes(visibility) ? visibility : "public";
      const newPost = await db.insert(posts).values({
        userId: req.user.id,
        caption: postCaption,
        images: r.photos || [],
        visibility: postVisibility
      }).returning();
      await db.update(savedRecipes).set({
        sharedPostId: newPost[0].id,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq13(savedRecipes.id, id));
      res.json({
        post: newPost[0],
        recipe: { ...r, sharedPostId: newPost[0].id }
      });
    } catch (error) {
      console.error("Failed to share recipe:", error);
      res.status(500).json({ error: "Failed to share recipe" });
    }
  });
  app2.post("/api/push-tokens", requireAuth, async (req, res) => {
    try {
      const { token, platform, deviceId } = req.body;
      if (!token || !platform) {
        return res.status(400).json({ error: "Token and platform are required" });
      }
      if (!["web", "ios", "android"].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }
      const result = await registerPushToken(req.user.id, token, platform, deviceId);
      res.json({ success: true, token: result[0] });
    } catch (error) {
      console.error("Failed to register push token:", error);
      res.status(500).json({ error: "Failed to register push token" });
    }
  });
  app2.delete("/api/push-tokens", requireAuth, async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }
      await deactivatePushToken(req.user.id, token);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove push token:", error);
      res.status(500).json({ error: "Failed to remove push token" });
    }
  });
  app2.get("/api/notification-settings", requireAuth, async (req, res) => {
    try {
      const settings2 = await getOrCreateUserNotificationSettings(req.user.id);
      res.json({ settings: settings2 });
    } catch (error) {
      console.error("Failed to get notification settings:", error);
      res.status(500).json({ error: "Failed to get notification settings" });
    }
  });
  app2.patch("/api/notification-settings", requireAuth, async (req, res) => {
    try {
      const { pushEnabled, newFollowerNotifications, newPostNotifications } = req.body;
      await getOrCreateUserNotificationSettings(req.user.id);
      const [updated] = await db.update(userNotificationSettings).set({
        ...pushEnabled !== void 0 && { pushEnabled },
        ...newFollowerNotifications !== void 0 && { newFollowerNotifications },
        ...newPostNotifications !== void 0 && { newPostNotifications },
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq13(userNotificationSettings.userId, req.user.id)).returning();
      res.json({ settings: updated });
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });
  app2.get("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const following = await db.select({
        followeeId: follows.followeeId,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      }).from(follows).leftJoin(users, eq13(follows.followeeId, users.id)).where(eq13(follows.followerId, req.user.id));
      const followeeIds = following.map((f) => f.followeeId);
      const preferences = followeeIds.length > 0 ? await db.select().from(notificationPreferences).where(
        and5(
          eq13(notificationPreferences.userId, req.user.id),
          inArray3(notificationPreferences.followeeId, followeeIds)
        )
      ) : [];
      const prefMap = new Map(preferences.map((p) => [p.followeeId, p]));
      const result = following.map((f) => ({
        followee: f.user,
        preferences: prefMap.get(f.followeeId) || {
          notifyOnNewPost: true
        }
      }));
      res.json({ preferences: result });
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      res.status(500).json({ error: "Failed to get notification preferences" });
    }
  });
  app2.patch("/api/notification-preferences/:followeeId", requireAuth, async (req, res) => {
    try {
      const { followeeId } = req.params;
      const { notifyOnNewPost } = req.body;
      const [existing] = await db.select().from(notificationPreferences).where(
        and5(
          eq13(notificationPreferences.userId, req.user.id),
          eq13(notificationPreferences.followeeId, followeeId)
        )
      );
      if (existing) {
        const [updated] = await db.update(notificationPreferences).set({
          notifyOnNewPost: notifyOnNewPost ?? existing.notifyOnNewPost,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq13(notificationPreferences.id, existing.id)).returning();
        return res.json({ preference: updated });
      }
      const [created] = await db.insert(notificationPreferences).values({
        userId: req.user.id,
        followeeId,
        notifyOnNewPost: notifyOnNewPost ?? true
      }).returning();
      res.json({ preference: created });
    } catch (error) {
      console.error("Failed to update notification preference:", error);
      res.status(500).json({ error: "Failed to update notification preference" });
    }
  });
  app2.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;
      const notificationsList = await db.select({
        notification: notifications,
        actor: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar
        }
      }).from(notifications).leftJoin(users, eq13(notifications.actorId, users.id)).where(eq13(notifications.userId, req.user.id)).orderBy(desc3(notifications.createdAt)).limit(limit).offset(offset);
      res.json({ notifications: notificationsList });
    } catch (error) {
      console.error("Failed to get notifications:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });
  app2.patch("/api/notifications/read", requireAuth, async (req, res) => {
    try {
      const { notificationIds } = req.body;
      if (notificationIds && notificationIds.length > 0) {
        await db.update(notifications).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(
          and5(
            eq13(notifications.userId, req.user.id),
            inArray3(notifications.id, notificationIds)
          )
        );
      } else {
        await db.update(notifications).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(
          and5(
            eq13(notifications.userId, req.user.id),
            eq13(notifications.isRead, false)
          )
        );
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });
  app2.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const [result] = await db.select({ count: sql6`count(*)` }).from(notifications).where(
        and5(
          eq13(notifications.userId, req.user.id),
          eq13(notifications.isRead, false)
        )
      );
      res.json({ count: Number(result?.count || 0) });
    } catch (error) {
      console.error("Failed to get unread count:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });
  function parseCsvLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  }
  function cleanMienText(text2) {
    return text2.replace(/(\w)\.(\w)/g, "$1 $2");
  }
  app2.get("/api/insights/today", async (req, res) => {
    try {
      const csvPath = path2.join(process.cwd(), "server", "data", "mien_insights.csv");
      if (!fs2.existsSync(csvPath)) {
        return res.json({ insight: null });
      }
      const csvContent = fs2.readFileSync(csvPath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);
      const insights = dataLines.map((line) => {
        const fields = parseCsvLine(line);
        if (fields.length < 4 || !fields[1] || !fields[2]) return null;
        const mien = cleanMienText(fields[1]);
        if (mien.split(/\s+/).length < 2) return null;
        return {
          id: fields[0],
          mien,
          english: fields[2],
          category: fields[3],
          source: fields[4] || "An Iu Mien Grammar by Dr. Tatsuro Daniel Arisawa"
        };
      }).filter(Boolean);
      if (insights.length === 0) {
        return res.json({ insight: null });
      }
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 864e5);
      const index = dayOfYear % insights.length;
      res.json({
        insight: insights[index],
        totalInsights: insights.length,
        dayIndex: index
      });
    } catch (error) {
      console.error("Failed to get insight:", error);
      res.status(500).json({ error: "Failed to get insight" });
    }
  });
  app2.get("/api/insights", async (req, res) => {
    try {
      const csvPath = path2.join(process.cwd(), "server", "data", "mien_insights.csv");
      if (!fs2.existsSync(csvPath)) {
        return res.json({ insights: [], total: 0 });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const category = req.query.category;
      const csvContent = fs2.readFileSync(csvPath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);
      const allInsights = dataLines.map((line) => {
        const fields = parseCsvLine(line);
        if (fields.length < 4 || !fields[1] || !fields[2]) return null;
        return {
          id: fields[0],
          mien: cleanMienText(fields[1]),
          english: fields[2],
          category: fields[3],
          source: fields[4] || ""
        };
      }).filter(Boolean);
      const filtered = category ? allInsights.filter((i) => i.category === category) : allInsights;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      res.json({
        insights: paginated,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit)
      });
    } catch (error) {
      console.error("Failed to get insights:", error);
      res.status(500).json({ error: "Failed to get insights" });
    }
  });
  const GRAMMAR_CACHE_DIR = path2.join(process.cwd(), ".cache", "grammar-book-pages");
  let grammarBookDoc = null;
  let grammarBookTotalPages = 0;
  let grammarSplitPromise = null;
  async function loadGrammarBookDoc() {
    if (grammarBookDoc) return;
    const pdfPath = path2.join(process.cwd(), "assets", "grammar_book.pdf");
    const pdfBytes = fs2.readFileSync(pdfPath);
    grammarBookDoc = await PDFDocument.load(pdfBytes);
    grammarBookTotalPages = grammarBookDoc.getPageCount();
    fs2.mkdirSync(GRAMMAR_CACHE_DIR, { recursive: true });
    fs2.writeFileSync(
      path2.join(GRAMMAR_CACHE_DIR, "info.json"),
      JSON.stringify({ totalPages: grammarBookTotalPages })
    );
  }
  async function getGrammarPagePdf(pageNum) {
    const cachedPath = path2.join(GRAMMAR_CACHE_DIR, `page-${pageNum}.pdf`);
    if (fs2.existsSync(cachedPath)) {
      return fs2.readFileSync(cachedPath);
    }
    await loadGrammarBookDoc();
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(grammarBookDoc, [pageNum - 1]);
    newDoc.addPage(copiedPage);
    const pageBytes = Buffer.from(await newDoc.save());
    fs2.writeFileSync(cachedPath, pageBytes);
    return pageBytes;
  }
  async function splitAllPagesBackground() {
    if (grammarSplitPromise) return grammarSplitPromise;
    grammarSplitPromise = (async () => {
      try {
        await loadGrammarBookDoc();
        for (let i = 1; i <= grammarBookTotalPages; i++) {
          const cachedPath = path2.join(GRAMMAR_CACHE_DIR, `page-${i}.pdf`);
          if (!fs2.existsSync(cachedPath)) {
            const newDoc = await PDFDocument.create();
            const [copiedPage] = await newDoc.copyPages(grammarBookDoc, [i - 1]);
            newDoc.addPage(copiedPage);
            fs2.writeFileSync(cachedPath, Buffer.from(await newDoc.save()));
          }
        }
        grammarBookDoc = null;
      } catch (err) {
        console.error("Grammar book background split error:", err);
      }
    })();
    return grammarSplitPromise;
  }
  app2.get("/api/literature/grammar-book/info", async (_req, res) => {
    try {
      const infoPath = path2.join(GRAMMAR_CACHE_DIR, "info.json");
      if (fs2.existsSync(infoPath)) {
        const info = JSON.parse(fs2.readFileSync(infoPath, "utf-8"));
        return res.json(info);
      }
      await loadGrammarBookDoc();
      res.json({ totalPages: grammarBookTotalPages });
    } catch (err) {
      console.error("Grammar book info error:", err);
      res.status(500).json({ error: "Failed to load grammar book info" });
    }
  });
  app2.get("/api/literature/grammar-book/page/:num", async (req, res) => {
    try {
      const pageNum = parseInt(req.params.num, 10);
      const infoPath = path2.join(GRAMMAR_CACHE_DIR, "info.json");
      let total = grammarBookTotalPages;
      if (!total && fs2.existsSync(infoPath)) {
        total = JSON.parse(fs2.readFileSync(infoPath, "utf-8")).totalPages;
      }
      if (!total) {
        await loadGrammarBookDoc();
        total = grammarBookTotalPages;
      }
      if (isNaN(pageNum) || pageNum < 1 || pageNum > total) {
        return res.status(400).json({ error: `Invalid page number. Must be 1-${total}` });
      }
      const pageBytes = await getGrammarPagePdf(pageNum);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pageBytes.length);
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.send(pageBytes);
      splitAllPagesBackground().catch(() => {
      });
    } catch (err) {
      console.error("Grammar book page error:", err);
      res.status(500).json({ error: "Failed to load page" });
    }
  });
  app2.get("/api/literature/grammar-book", (req, res) => {
    const pdfPath = path2.join(process.cwd(), "assets", "grammar_book.pdf");
    if (!fs2.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Grammar book not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="An_Iu_Mien_Grammar_Arisawa.pdf"');
    const stream = fs2.createReadStream(pdfPath);
    stream.pipe(res);
  });
  app2.get("/api/literature/grammar-book/viewer", (_req, res) => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch}
body{background:var(--bg,#F5EDD8);display:flex;justify-content:center;font-family:system-ui,-apple-system,sans-serif}
body.dark{--bg:#1a1a1a}
#page-container{width:100%;max-width:800px;display:flex;justify-content:center;padding:8px}
canvas{width:100%;height:auto;display:none;background:#fff;border-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
body.dark canvas{background:#262626;box-shadow:0 1px 4px rgba(0,0,0,0.3)}
#loading{position:fixed;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;background:var(--bg,#F5EDD8);color:#9CA3AF;font-size:14px;transition:opacity 0.3s ease}
#loading.fade{opacity:0;pointer-events:none}
.spinner{width:28px;height:28px;border:2.5px solid rgba(156,163,175,0.3);border-top-color:#9CA3AF;border-radius:50%;animation:spin 0.7s linear infinite;margin-bottom:10px}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head>
<body>
<div id="loading"><div class="spinner"></div><span>Loading page...</span></div>
<div id="page-container"><canvas id="pdf-canvas"></canvas></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
var params=new URLSearchParams(location.search);
if(params.get('dark')==='1')document.body.classList.add('dark');
var canvas=document.getElementById('pdf-canvas');
var ctx=canvas.getContext('2d');
var loadingEl=document.getElementById('loading');
var totalPages=0,currentPage=1,rendering=false,pendingPage=null;
var prefetched={};
function notify(d){var m=JSON.stringify(d);try{window.parent.postMessage(m,'*')}catch(e){}try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(m)}catch(e){}}
function prefetchNearby(page){
for(var i=1;i<=5;i++){var p=page+i;if(p<=totalPages&&!prefetched[p]){prefetched[p]=true;
var link=document.createElement('link');link.rel='prefetch';link.as='fetch';
link.href='/api/literature/grammar-book/page/'+p;document.head.appendChild(link)}}
for(var j=1;j<=2;j++){var pb=page-j;if(pb>=1&&!prefetched[pb]){prefetched[pb]=true;
var lb=document.createElement('link');lb.rel='prefetch';lb.as='fetch';
lb.href='/api/literature/grammar-book/page/'+pb;document.head.appendChild(lb)}}}
function renderPage(num){
if(num<1||num>totalPages)return;
if(rendering){pendingPage=num;return}
rendering=true;currentPage=num;
loadingEl.classList.remove('fade');
pdfjsLib.getDocument('/api/literature/grammar-book/page/'+num).promise
.then(function(pdf){return pdf.getPage(1).then(function(page){
var dpr=Math.min(window.devicePixelRatio||2,3);
var viewport=page.getViewport({scale:dpr});
canvas.width=viewport.width;canvas.height=viewport.height;
return page.render({canvasContext:ctx,viewport:viewport}).promise.then(function(){pdf.destroy()})})})
.then(function(){
canvas.style.display='block';loadingEl.classList.add('fade');
window.scrollTo(0,0);
notify({type:'pageRendered',currentPage:currentPage,totalPages:totalPages});
rendering=false;prefetchNearby(currentPage);
if(pendingPage!==null){var p=pendingPage;pendingPage=null;renderPage(p)}
}).catch(function(err){rendering=false;notify({type:'error',message:err.message})})}
var resizeTimer;window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(function(){if(totalPages)renderPage(currentPage)},300)});
function handleMsg(data){if(typeof data==='string'){try{data=JSON.parse(data)}catch(e){return}}
if(data&&data.type==='goToPage'&&data.page)renderPage(data.page);
if(data&&data.type==='setTheme'){if(data.dark)document.body.classList.add('dark');else document.body.classList.remove('dark')}}
window.addEventListener('message',function(e){handleMsg(e.data)});
document.addEventListener('message',function(e){handleMsg(e.data)});
fetch('/api/literature/grammar-book/info').then(function(r){return r.json()})
.then(function(info){totalPages=info.totalPages;notify({type:'pdfLoaded',totalPages:totalPages});renderPage(1)})
.catch(function(err){loadingEl.innerHTML='<span style="color:#EF4444">Failed to load document</span>';notify({type:'error',message:err.message})});
</script></body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(html);
  });
  app2.get("/api/dictionary/search", async (req, res) => {
    try {
      const query = (req.query.q || "").trim();
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = (page - 1) * limit;
      if (!query || query.length < 1) {
        return res.json({ entries: [], total: 0, page, limit });
      }
      const searchTerm = `%${query.toLowerCase()}%`;
      const [entries, countResult] = await Promise.all([
        db.select().from(dictionaryEntries).where(
          or3(
            sql6`LOWER(${dictionaryEntries.mienWord}) LIKE ${searchTerm}`,
            sql6`LOWER(${dictionaryEntries.englishDefinition}) LIKE ${searchTerm}`
          )
        ).orderBy(
          sql6`CASE WHEN LOWER(${dictionaryEntries.mienWord}) = ${query.toLowerCase()} THEN 0
                      WHEN LOWER(${dictionaryEntries.mienWord}) LIKE ${query.toLowerCase() + "%"} THEN 1
                      WHEN LOWER(${dictionaryEntries.mienWord}) LIKE ${searchTerm} THEN 2
                      ELSE 3 END`,
          dictionaryEntries.mienWord
        ).limit(limit).offset(offset),
        db.select({ count: count2() }).from(dictionaryEntries).where(
          or3(
            sql6`LOWER(${dictionaryEntries.mienWord}) LIKE ${searchTerm}`,
            sql6`LOWER(${dictionaryEntries.englishDefinition}) LIKE ${searchTerm}`
          )
        )
      ]);
      res.json({
        entries,
        total: Number(countResult[0]?.count || 0),
        page,
        limit
      });
    } catch (err) {
      console.error("Dictionary search error:", err);
      res.status(500).json({ error: "Failed to search dictionary" });
    }
  });
  app2.get("/api/dictionary/count", async (_req, res) => {
    try {
      const result = await db.select({ count: count2() }).from(dictionaryEntries);
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (err) {
      console.error("Dictionary count error:", err);
      res.status(500).json({ error: "Failed to get dictionary count" });
    }
  });
  app2.post("/api/stories/generate-cover", requireAuth, requireCredits(3, "story_cover"), async (req, res) => {
    try {
      const { storyId, prompt } = req.body;
      if (!storyId || !prompt) {
        return res.status(400).json({ error: "Story ID and prompt are required" });
      }
      console.log(`Generating story cover for: ${storyId}`);
      const coverPrompt = `Create a beautiful book cover illustration. ${prompt}. The art style should be vivid, detailed, and culturally respectful. No text or lettering on the image. High quality digital painting suitable for a book cover.`;
      const coverAI = getDressMeAI();
      const generationStartTime = Date.now();
      const response = await coverAI.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: coverPrompt }]
          }
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      });
      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part) => part.inlineData);
      if (!imagePart?.inlineData?.data) {
        console.error("No cover image generated by Gemini");
        return res.status(500).json({ error: "Failed to generate cover image. Please try again." });
      }
      const generationDuration = Date.now() - generationStartTime;
      console.log(`Story cover generated for ${storyId} in ${generationDuration}ms`);
      let imageUrl = null;
      if (isR2Configured()) {
        try {
          const result = await uploadBase64ToR2(imagePart.inlineData.data, {
            folder: `story-covers`,
            contentType: imagePart.inlineData.mimeType || "image/png"
          });
          imageUrl = result.url;
        } catch (r2Error) {
          console.error("R2 upload failed for story cover:", r2Error);
        }
      }
      if (!imageUrl) {
        const mimeType = imagePart.inlineData.mimeType || "image/png";
        imageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
      }
      logFeatureUsage({
        userId: req.user.id,
        category: "ai_generation",
        featureName: "story_cover",
        subFeature: storyId,
        creditsUsed: 3,
        durationMs: generationDuration,
        metadata: {
          storyId,
          modelUsed: "gemini-3-pro-image-preview",
          uploadedToR2: imageUrl.startsWith("http")
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.json({ imageUrl });
      awardXp(req.user.id, "ai_image_story_cover").catch(() => {
      });
    } catch (error) {
      console.error("Story cover generation error:", error);
      logFeatureUsage({
        userId: req.user?.id,
        category: "ai_generation",
        featureName: "story_cover",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      res.status(500).json({ error: "Cover generation failed. Please try again." });
    }
  });
  app2.post("/api/stories/:storyId/complete", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const result = await awardXp(req.user.id, "story_completed", { storyId });
      res.json({
        success: result.awarded,
        xp: result.xpAwarded || 0,
        leveledUp: result.leveledUp || false,
        newLevel: result.level,
        reason: result.reason
      });
    } catch (error) {
      console.error("Story completion XP error:", error);
      res.json({ success: false, xp: 0, leveledUp: false });
    }
  });
  app2.get("/api/game/phrases", requireAuth, async (req, res) => {
    try {
      const count3 = Math.min(parseInt(req.query.count) || 5, 10);
      const csvPath = path2.join(process.cwd(), "server", "data", "mien_insights.csv");
      if (!fs2.existsSync(csvPath)) {
        return res.status(404).json({ error: "Phrase data not found" });
      }
      const csvContent = fs2.readFileSync(csvPath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);
      const phrases = dataLines.map((line) => {
        const fields = parseCsvLine(line);
        if (fields.length < 4 || !fields[1] || !fields[2]) return null;
        const mien = cleanMienText(fields[1]);
        const wordCount = mien.split(/\s+/).length;
        if (wordCount < 3 || wordCount > 7) return null;
        return { mien, english: fields[2], category: fields[3] };
      }).filter(Boolean);
      if (phrases.length === 0) {
        return res.json({ phrases: [] });
      }
      const shuffled = [...phrases].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count3);
      res.json({ phrases: selected });
    } catch (error) {
      console.error("Failed to get game phrases:", error);
      res.status(500).json({ error: "Failed to get game phrases" });
    }
  });
  app2.post("/api/game/scores", requireAuth, async (req, res) => {
    try {
      const { score, phrasesCompleted, gameType } = req.body;
      if (typeof score !== "number" || typeof phrasesCompleted !== "number") {
        return res.status(400).json({ error: "score and phrasesCompleted are required" });
      }
      const resolvedGameType = gameType || "wheel_of_fortune";
      const [newScore] = await db.insert(gameScores).values({
        userId: req.user.id,
        score,
        phrasesCompleted,
        gameType: resolvedGameType
      }).returning();
      const gameXpType = `game_${resolvedGameType}`;
      const xpResult = await awardXp(req.user.id, gameXpType, { gameType: resolvedGameType, score });
      const top3 = await db.select({ score: gameScores.score }).from(gameScores).where(eq13(gameScores.gameType, resolvedGameType)).orderBy(desc3(gameScores.score)).limit(3);
      const isTop3 = top3.length < 3 || score >= (top3[top3.length - 1]?.score ?? 0);
      let leaderboardXp = { awarded: false };
      if (isTop3) {
        leaderboardXp = await awardXp(req.user.id, "game_leaderboard_top3", { gameType: resolvedGameType, score });
      }
      res.json({
        score: newScore,
        xp: {
          completion: xpResult.awarded ? xpResult.xpAwarded : 0,
          leaderboard: leaderboardXp.awarded ? leaderboardXp.xpAwarded : 0,
          totalXp: xpResult.totalXp,
          level: xpResult.level,
          leveledUp: xpResult.leveledUp
        }
      });
    } catch (error) {
      console.error("Failed to save game score:", error);
      res.status(500).json({ error: "Failed to save score" });
    }
  });
  app2.get("/api/game/leaderboard", async (req, res) => {
    try {
      const gameType = req.query.gameType || "wheel_of_fortune";
      const results = await db.select({
        id: gameScores.id,
        score: gameScores.score,
        phrasesCompleted: gameScores.phrasesCompleted,
        createdAt: gameScores.createdAt,
        userId: gameScores.userId,
        displayName: users.displayName,
        avatar: users.avatar
      }).from(gameScores).innerJoin(users, eq13(gameScores.userId, users.id)).where(eq13(gameScores.gameType, gameType)).orderBy(desc3(gameScores.score)).limit(20);
      res.json({ leaderboard: results });
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });
  app2.get("/api/game/my-scores", requireAuth, async (req, res) => {
    try {
      const gameType = req.query.gameType || "wheel_of_fortune";
      const results = await db.select().from(gameScores).where(and5(eq13(gameScores.userId, req.user.id), eq13(gameScores.gameType, gameType))).orderBy(desc3(gameScores.score)).limit(5);
      res.json({ scores: results });
    } catch (error) {
      console.error("Failed to get user scores:", error);
      res.status(500).json({ error: "Failed to get scores" });
    }
  });
  const GAME_BG_DIR = path2.resolve(process.cwd(), "public/generated/game-backgrounds");
  const GAME_BG_PROMPTS = {
    wheel_of_fortune: "A vibrant, mystical game background for a Wheel of Fortune word-guessing game. Features a glowing golden spinning wheel with ornate Southeast Asian patterns, floating letters scattered in the air, and a rich deep purple and gold color scheme. Magical sparkles and light rays emanate from the wheel. The style is polished mobile game art, 1024x1024, no text or words.",
    vocab_match: "A colorful, playful game background for a vocabulary matching game. Features an open enchanted book with pictures and words floating out of it, surrounded by nature elements like trees, animals, and household items in a whimsical illustrated style. Warm greens, oranges, and teals with a soft gradient sky. Mobile game art style, 1024x1024, no text or words.",
    mien_wordle: "A sleek, modern game background for a word puzzle game. Features a grid of letter tiles floating in a cosmic deep blue space with glowing neon green and yellow highlights. Abstract geometric patterns and subtle circuit-like designs. Clean, minimalist mobile game aesthetic with depth and dimension, 1024x1024, no text or words."
  };
  app2.get("/api/game/backgrounds", async (_req, res) => {
    try {
      if (!fs2.existsSync(GAME_BG_DIR)) {
        fs2.mkdirSync(GAME_BG_DIR, { recursive: true });
      }
      const backgrounds = {};
      for (const gameType of Object.keys(GAME_BG_PROMPTS)) {
        const filePath = path2.join(GAME_BG_DIR, `${gameType}.png`);
        if (fs2.existsSync(filePath)) {
          backgrounds[gameType] = `/generated/game-backgrounds/${gameType}.png`;
        }
      }
      res.json({ backgrounds });
    } catch (error) {
      console.error("Failed to get game backgrounds:", error);
      res.status(500).json({ error: "Failed to get game backgrounds" });
    }
  });
  app2.post("/api/game/backgrounds/generate", requireAuth, requireAdmin, async (req, res) => {
    try {
      const xaiKey = process.env.XAI_API;
      if (!xaiKey) {
        return res.status(500).json({ error: "XAI_API key not configured" });
      }
      if (!fs2.existsSync(GAME_BG_DIR)) {
        fs2.mkdirSync(GAME_BG_DIR, { recursive: true });
      }
      const results = {};
      const gameTypes = Object.keys(GAME_BG_PROMPTS);
      for (const gameType of gameTypes) {
        const filePath = path2.join(GAME_BG_DIR, `${gameType}.png`);
        if (fs2.existsSync(filePath) && !req.body?.force) {
          results[gameType] = `/generated/game-backgrounds/${gameType}.png`;
          continue;
        }
        console.log(`Generating background for ${gameType}...`);
        const response = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${xaiKey}`
          },
          body: JSON.stringify({
            model: "grok-2-image",
            prompt: GAME_BG_PROMPTS[gameType],
            n: 1,
            response_format: "b64_json"
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          console.error(`xAI image generation failed for ${gameType}:`, errText);
          continue;
        }
        const data = await response.json();
        const base64Image = data.data?.[0]?.b64_json;
        if (base64Image) {
          const imageBuffer = Buffer.from(base64Image, "base64");
          fs2.writeFileSync(filePath, imageBuffer);
          results[gameType] = `/generated/game-backgrounds/${gameType}.png`;
          console.log(`Background generated for ${gameType}`);
        }
      }
      res.json({ backgrounds: results });
    } catch (error) {
      console.error("Failed to generate game backgrounds:", error);
      res.status(500).json({ error: "Failed to generate game backgrounds" });
    }
  });
  app2.get("/api/game/wordle/words", requireAuth, async (req, res) => {
    try {
      const count3 = Math.min(Math.max(parseInt(req.query.count) || 5, 1), 10);
      const allEntries = await db.select({
        mienWord: dictionaryEntries.mienWord,
        englishDefinition: dictionaryEntries.englishDefinition,
        partOfSpeech: dictionaryEntries.partOfSpeech
      }).from(dictionaryEntries);
      const validEntries = allEntries.filter((entry) => {
        const alphaOnly = entry.mienWord.replace(/[^a-zA-Z]/g, "");
        return alphaOnly.length >= 2 && alphaOnly.length <= 15;
      });
      const shuffled = [...validEntries].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count3);
      res.json({ words: selected });
    } catch (error) {
      console.error("Failed to get wordle words:", error);
      res.status(500).json({ error: "Failed to get wordle words" });
    }
  });
  const httpServer = createServer(app2);
  setupWebSocket(httpServer);
  return httpServer;
}

// server/index.ts
init_three_tears();
init_db();
init_schema();
import * as fs3 from "fs";
import * as path3 from "path";
import { lt as lt2 } from "drizzle-orm";
var app = express();
var log3 = console.log;
function setupSecurityHeaders(app2) {
  app2.use((req, res, next) => {
    const isAuthCallback = req.path === "/auth" || req.path.startsWith("/auth?");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.removeHeader("X-Powered-By");
    if (!isAuthCallback) {
      res.setHeader("Content-Security-Policy", [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://graph.facebook.com https://api.twitter.com https://api.instagram.com https://open.tiktokapis.com wss: ws:",
        "frame-src 'self' https://www.youtube.com",
        "media-src 'self' blob: https:",
        "object-src 'none'",
        "base-uri 'self'"
      ].join("; "));
    }
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
}
var rateLimitStore = /* @__PURE__ */ new Map();
function rateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxRequests) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1e3).toString());
      return res.status(429).json({ error: "Too many requests, please try again later" });
    }
    entry.count++;
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1e3);
var authRateLimit = rateLimit(15 * 60 * 1e3, 20);
var apiRateLimit = rateLimit(60 * 1e3, 100);
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:8081");
    origins.add("http://127.0.0.1:8081");
    origins.add("http://localhost:9081");
    origins.add("http://127.0.0.1:9081");
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false, limit: "1mb" }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path4 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path4.startsWith("/api")) return;
      if (req.method === "OPTIONS") return;
      const noisyEndpoints = [
        "/api/messages/unread-count",
        "/api/admin/avatar-agent/status",
        "/api/avatar/status",
        "/api/posts/trending"
      ];
      const isNoisy = noisyEndpoints.some((ep) => path4 === ep || path4.startsWith(ep + "?"));
      if (isNoisy && (res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 401)) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const safeResponse = { ...capturedJsonResponse };
        for (const key of ["sessionToken", "token", "apiKey", "secret", "password"]) {
          if (key in safeResponse) safeResponse[key] = "[REDACTED]";
        }
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log3(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path3.resolve(process.cwd(), "app.json");
    const appJsonContent = fs3.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path3.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs3.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs3.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
async function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log3(`baseUrl`, baseUrl);
  log3(`expsUrl`, expsUrl);
  let threTearsAppId = "";
  try {
    const { getAppId: getAppId2 } = await Promise.resolve().then(() => (init_three_tears(), three_tears_exports));
    threTearsAppId = await getAppId2() || "";
  } catch (error) {
    log3("Could not fetch Three Tears app ID:", error);
  }
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName).replace(/THREE_TEARS_APP_ID_PLACEHOLDER/g, threTearsAppId);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path3.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs3.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  const webBuildPath = path3.resolve(process.cwd(), "dist");
  const webIndexPath = path3.resolve(webBuildPath, "index.html");
  log3("Serving static Expo files with dynamic manifest routing");
  const distAssetsPath = path3.resolve(process.cwd(), "dist", "assets");
  const rootAssetsPath = path3.resolve(process.cwd(), "assets");
  const clientAssetsPath = path3.resolve(process.cwd(), "client", "assets");
  const distClientAssetsPath = path3.resolve(process.cwd(), "dist", "client", "assets");
  const nodeModulesPath = path3.resolve(process.cwd(), "node_modules");
  app2.use("/assets", (req, res, next) => {
    const unstablePath = req.query.unstable_path;
    if (unstablePath) {
      const decodedPath = decodeURIComponent(unstablePath);
      if (decodedPath.includes("..") || decodedPath.includes("\\")) {
        return res.status(403).send("Forbidden");
      }
      let filePath;
      let altFilePath = null;
      if (decodedPath.startsWith("./client/assets/")) {
        const filename = decodedPath.replace("./client/assets/", "");
        filePath = path3.join(distClientAssetsPath, filename);
        altFilePath = path3.join(clientAssetsPath, filename);
      } else if (decodedPath.startsWith("./node_modules/")) {
        const relativePath = decodedPath.replace("./node_modules/", "");
        filePath = path3.join(nodeModulesPath, relativePath);
      } else if (decodedPath.startsWith("./assets/")) {
        const filename = decodedPath.replace("./assets/", "");
        filePath = path3.join(distAssetsPath, filename);
        altFilePath = path3.join(rootAssetsPath, filename);
      } else {
        return res.status(403).send("Forbidden");
      }
      if (fs3.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      if (altFilePath && fs3.existsSync(altFilePath)) {
        return res.sendFile(altFilePath);
      }
      return res.status(404).send("Asset not found");
    }
    if (req.path === "/" || req.path === "") {
      return res.status(404).send("Asset not found");
    }
    if (req.path.includes("..") || req.path.includes("\\")) {
      return res.status(403).send("Forbidden");
    }
    const distFilePath = path3.join(distAssetsPath, req.path);
    const rootFilePath = path3.join(rootAssetsPath, req.path);
    const clientFilePath = path3.join(clientAssetsPath, req.path);
    const distClientFilePath = path3.join(distClientAssetsPath, req.path);
    if (fs3.existsSync(distFilePath)) {
      return res.sendFile(distFilePath);
    } else if (fs3.existsSync(rootFilePath)) {
      return res.sendFile(rootFilePath);
    } else if (fs3.existsSync(distClientFilePath)) {
      return res.sendFile(distClientFilePath);
    } else if (fs3.existsSync(clientFilePath)) {
      return res.sendFile(clientFilePath);
    }
    return res.status(404).send("Asset not found");
  });
  app2.use("/uploads", express.static(path3.resolve(process.cwd(), "uploads")));
  app2.use("/generated", express.static(path3.resolve(process.cwd(), "public/generated")));
  app2.use(express.static(path3.resolve(process.cwd(), "static-build")));
  if (fs3.existsSync(webBuildPath)) {
    app2.use(express.static(webBuildPath));
  }
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      if (req.path === "/" || req.path === "/manifest") {
        return serveExpoManifest(platform, res);
      }
    }
    if (fs3.existsSync(webIndexPath)) {
      const extname2 = path3.extname(req.path);
      if (!extname2 || req.path === "/") {
        return res.sendFile(webIndexPath);
      }
    } else {
      if (req.path === "/") {
        serveLandingPage({
          req,
          res,
          landingPageTemplate,
          appName
        });
        return;
      }
    }
    next();
  });
  log3("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = status === 500 && process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message || "Internal Server Error";
    console.error("Unhandled error:", err);
    res.status(status).json({ message });
  });
}
async function runCreditMigration() {
  try {
    const result = await db.update(users).set({ credits: 30 }).where(lt2(users.credits, 30)).returning({ id: users.id });
    if (result.length > 0) {
      log3(`[Migration] Updated ${result.length} users to 30 credits`);
    }
  } catch (error) {
    console.error("[Migration] Failed to update credits:", error);
  }
}
process.on("SIGTERM", () => {
  killAvatarAgentOnShutdown();
  process.exit(0);
});
process.on("SIGINT", () => {
  killAvatarAgentOnShutdown();
  process.exit(0);
});
(async () => {
  setupSecurityHeaders(app);
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  app.use("/api/auth", authRateLimit);
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth")) return next();
    return apiRateLimit(req, res, next);
  });
  configureExpoAndLanding(app);
  await runCreditMigration();
  await ensureTablesExist();
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(
    port,
    () => {
      log3(`express server serving on port ${port}`);
      registerWithThreeTears().catch((error) => {
        console.error("[Three Tears] Registration failed:", error);
      });
      startAvatarAgent();
    }
  );
})();
