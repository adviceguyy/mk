import { db } from "../db";
import {
  pushTokens,
  notifications,
  notificationPreferences,
  userNotificationSettings,
  users,
  follows,
  type ClientPlatform,
  type NotificationType,
} from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

// Helper to chunk array for Expo's 100-message limit
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Send push notifications via Expo API
export async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  const chunks = chunkArray(messages, 100);
  const results: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const data = await response.json();
      results.push(...(data.data || []));
    } catch (error) {
      console.error("Failed to send push notifications:", error);
    }
  }

  return results;
}

// Register or update a push token for a user
export async function registerPushToken(
  userId: string,
  token: string,
  platform: ClientPlatform,
  deviceId?: string
) {
  // Check if token already exists for this user
  const [existing] = await db
    .select()
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));

  if (existing) {
    // Update existing token
    return db
      .update(pushTokens)
      .set({
        isActive: true,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pushTokens.id, existing.id))
      .returning();
  }

  // Insert new token
  return db
    .insert(pushTokens)
    .values({
      userId,
      token,
      platform,
      deviceId,
      isActive: true,
    })
    .returning();
}

// Deactivate a push token
export async function deactivatePushToken(userId: string, token: string) {
  return db
    .update(pushTokens)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
}

// Get active push tokens for a user
export async function getUserPushTokens(userId: string) {
  return db
    .select()
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));
}

// Get or create user notification settings
export async function getOrCreateUserNotificationSettings(userId: string) {
  const [existing] = await db
    .select()
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId));

  if (existing) return existing;

  const [created] = await db
    .insert(userNotificationSettings)
    .values({ userId })
    .returning();

  return created;
}

// Send notification when someone follows a user
export async function sendNewFollowerNotification(
  followeeId: string,
  followerId: string
) {
  // Check global settings
  const settings = await getOrCreateUserNotificationSettings(followeeId);

  if (!settings.pushEnabled || !settings.newFollowerNotifications) {
    return null;
  }

  // Get follower info
  const [follower] = await db
    .select({ displayName: users.displayName, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, followerId));

  if (!follower) return null;

  // Get push tokens
  const tokens = await getUserPushTokens(followeeId);
  if (tokens.length === 0) return null;

  const title = "New Follower";
  const body = `${follower.displayName} started following you`;

  // Save notification to database
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: followeeId,
      actorId: followerId,
      type: "new_follower" as NotificationType,
      title,
      body,
      data: { followerId },
      pushSentAt: new Date(),
    })
    .returning();

  // Send push notifications
  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data: {
      type: "new_follower",
      followerId,
      notificationId: notification.id,
    },
    sound: "default",
  }));

  const results = await sendPushNotifications(messages);
  return { notification, results };
}

// Send notifications to followers when a user creates a new post
export async function sendNewPostNotifications(
  posterId: string,
  postId: string
) {
  // Get poster info
  const [poster] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, posterId));

  if (!poster) return [];

  // Get all followers of this poster
  const followersList = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(eq(follows.followeeId, posterId));

  if (followersList.length === 0) return [];

  const followerIds = followersList.map((f) => f.followerId);

  // Get notification preferences for each follower
  const preferences = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        inArray(notificationPreferences.userId, followerIds),
        eq(notificationPreferences.followeeId, posterId)
      )
    );

  // Create preference map (default is true if no preference exists)
  const prefMap = new Map(preferences.map((p) => [p.userId, p.notifyOnNewPost]));

  // Get global settings for each follower
  const globalSettings = await db
    .select()
    .from(userNotificationSettings)
    .where(inArray(userNotificationSettings.userId, followerIds));

  const globalMap = new Map(globalSettings.map((s) => [s.userId, s]));

  // Filter to followers who should receive notification
  const eligibleFollowers = followerIds.filter((fId) => {
    const global = globalMap.get(fId);
    if (global && (!global.pushEnabled || !global.newPostNotifications)) {
      return false;
    }
    // Per-follower preference (default true if not set)
    return prefMap.get(fId) !== false;
  });

  if (eligibleFollowers.length === 0) return [];

  // Get push tokens for eligible followers
  const tokens = await db
    .select()
    .from(pushTokens)
    .where(
      and(
        inArray(pushTokens.userId, eligibleFollowers),
        eq(pushTokens.isActive, true)
      )
    );

  if (tokens.length === 0) return [];

  const title = "New Post";
  const body = `${poster.displayName} shared a new post`;

  // Save notifications and prepare messages
  const results = [];
  const messages: ExpoPushMessage[] = [];

  for (const token of tokens) {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: token.userId,
        actorId: posterId,
        type: "new_post" as NotificationType,
        title,
        body,
        data: { postId, posterId },
        pushSentAt: new Date(),
      })
      .returning();

    results.push({
      userId: token.userId,
      notification,
    });

    messages.push({
      to: token.token,
      title,
      body,
      data: {
        type: "new_post",
        postId,
        posterId,
        notificationId: notification.id,
      },
      sound: "default",
    });
  }

  // Send all push notifications
  await sendPushNotifications(messages);
  return results;
}
