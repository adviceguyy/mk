import { db } from "../db";
import { users, groups, groupMembers, sessions, posts, activityLogs } from "../db/schema";
import { count, gte, gt, eq, desc, sql } from "drizzle-orm";
import { getAppId, getMainAppBaseUrl, getEnrollmentSecret, verifyJwt } from "./three-tears";
import { getServiceConfigsForSync } from "../services/ai-providers";

export interface UserSyncPayload {
  id: string;
  email: string;
  displayName: string;
  avatar?: string | null;
  provider: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface GroupSyncPayload {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

interface SyncEvent {
  type: "user.created" | "user.updated" | "group.created" | "group.updated" | "group.deleted";
  data: UserSyncPayload | GroupSyncPayload | { id: string };
  timestamp: string;
}

async function pushToThreeTears(event: SyncEvent): Promise<boolean> {
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
        "X-Enrollment-Key": enrollmentSecret,
      },
      body: JSON.stringify({
        app_id: appId,
        event: event.type,
        data: event.data,
        timestamp: event.timestamp,
      }),
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

export function pushUserCreated(user: UserSyncPayload): void {
  setImmediate(async () => {
    try {
      const event: SyncEvent = {
        type: "user.created",
        data: user,
        timestamp: new Date().toISOString(),
      };
      
      const success = await pushToThreeTears(event);
      
      try {
        await db.insert(activityLogs).values({
          userId: user.id,
          action: "sync_push_user_created",
          metadata: { success, userId: user.id },
        });
      } catch (logError) {
        console.error("[Sync] Failed to log user.created activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushUserCreated:", error);
    }
  });
}

export function pushUserUpdated(user: UserSyncPayload): void {
  setImmediate(async () => {
    try {
      const event: SyncEvent = {
        type: "user.updated",
        data: user,
        timestamp: new Date().toISOString(),
      };
      
      const success = await pushToThreeTears(event);
      
      try {
        await db.insert(activityLogs).values({
          userId: user.id,
          action: "sync_push_user_updated",
          metadata: { success, userId: user.id },
        });
      } catch (logError) {
        console.error("[Sync] Failed to log user.updated activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushUserUpdated:", error);
    }
  });
}

export function pushGroupCreated(group: GroupSyncPayload): void {
  setImmediate(async () => {
    try {
      const event: SyncEvent = {
        type: "group.created",
        data: group,
        timestamp: new Date().toISOString(),
      };
      
      const success = await pushToThreeTears(event);
      
      try {
        await db.insert(activityLogs).values({
          userId: null,
          action: "sync_push_group_created",
          metadata: { success, groupId: group.id },
        });
      } catch (logError) {
        console.error("[Sync] Failed to log group.created activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushGroupCreated:", error);
    }
  });
}

export function pushGroupUpdated(group: GroupSyncPayload): void {
  setImmediate(async () => {
    try {
      const event: SyncEvent = {
        type: "group.updated",
        data: group,
        timestamp: new Date().toISOString(),
      };
      
      const success = await pushToThreeTears(event);
      
      try {
        await db.insert(activityLogs).values({
          userId: null,
          action: "sync_push_group_updated",
          metadata: { success, groupId: group.id },
        });
      } catch (logError) {
        console.error("[Sync] Failed to log group.updated activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushGroupUpdated:", error);
    }
  });
}

export function pushGroupDeleted(groupId: string): void {
  setImmediate(async () => {
    try {
      const event: SyncEvent = {
        type: "group.deleted",
        data: { id: groupId },
        timestamp: new Date().toISOString(),
      };
      
      const success = await pushToThreeTears(event);
      
      try {
        await db.insert(activityLogs).values({
          userId: null,
          action: "sync_push_group_deleted",
          metadata: { success, groupId },
        });
      } catch (logError) {
        console.error("[Sync] Failed to log group.deleted activity:", logError);
      }
    } catch (error) {
      console.error("[Sync] Unhandled error in pushGroupDeleted:", error);
    }
  });
}

export async function generateSnapshot(): Promise<{
  generatedAt: string;
  users: {
    total: number;
    byRole: { user: number; moderator: number; admin: number };
    list: Array<{
      id: string;
      email: string;
      displayName: string;
      avatar: string | null;
      role: string;
      provider: string;
      tierSlug: string;
      credits: number;
      isDisabled: boolean;
      createdAt: Date;
      lastLoginAt: Date;
    }>;
  };
  groups: {
    total: number;
    list: Array<{
      id: string;
      name: string;
      description: string | null;
      memberCount: number;
      createdAt: Date;
    }>;
  };
  metrics: {
    totalUsers: number;
    activeUsers24h: number;
    activeUsers7d: number;
    totalSessions: number;
    activeSessions: number;
    totalPosts: number;
    totalGroups: number;
  };
  trends: {
    signupsLast30Days: Array<{ date: string; count: number }>;
    postsLast30Days: Array<{ date: string; count: number }>;
  };
  aiService: {
    name: string;
    description: string;
    services: Array<{
      serviceKey: string;
      displayName: string;
      modelName: string;
      isEnabled: boolean;
      hasApiKey: boolean;
    }>;
    configurable: boolean;
  };
}> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
    [adminRoleResult],
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
      lastLoginAt: users.lastLoginAt,
    }).from(users).orderBy(desc(users.createdAt)),

    db.select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt,
    }).from(groups).orderBy(desc(groups.createdAt)),

    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(gte(users.lastLoginAt, oneDayAgo)),
    db.select({ count: count() }).from(users).where(gte(users.lastLoginAt, sevenDaysAgo)),
    db.select({ count: count() }).from(sessions),
    db.select({ count: count() }).from(sessions).where(gt(sessions.expiresAt, now)),
    db.select({ count: count() }).from(posts),
    db.select({ count: count() }).from(users).where(eq(users.role, "user")),
    db.select({ count: count() }).from(users).where(eq(users.role, "moderator")),
    db.select({ count: count() }).from(users).where(eq(users.role, "admin")),
  ]);

  const groupMemberCounts = await Promise.all(
    allGroups.map(async (group) => {
      const [result] = await db.select({ count: count() }).from(groupMembers).where(eq(groupMembers.groupId, group.id));
      return { groupId: group.id, memberCount: result.count };
    })
  );

  const memberCountMap = new Map(groupMemberCounts.map((g) => [g.groupId, g.memberCount]));

  const signupsLast30Days = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})`.as("date"),
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  const postsLast30Days = await db
    .select({
      date: sql<string>`DATE(${posts.createdAt})`.as("date"),
      count: count(),
    })
    .from(posts)
    .where(gte(posts.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${posts.createdAt})`)
    .orderBy(sql`DATE(${posts.createdAt})`);

  return {
    generatedAt: now.toISOString(),
    users: {
      total: totalUsersResult.count,
      byRole: {
        user: userRoleResult.count,
        moderator: modRoleResult.count,
        admin: adminRoleResult.count,
      },
      list: allUsers,
    },
    groups: {
      total: allGroups.length,
      list: allGroups.map((group) => ({
        ...group,
        memberCount: memberCountMap.get(group.id) || 0,
      })),
    },
    metrics: {
      totalUsers: totalUsersResult.count,
      activeUsers24h: activeUsers24hResult.count,
      activeUsers7d: activeUsers7dResult.count,
      totalSessions: totalSessionsResult.count,
      activeSessions: activeSessionsResult.count,
      totalPosts: totalPostsResult.count,
      totalGroups: allGroups.length,
    },
    trends: {
      signupsLast30Days: signupsLast30Days.map((row) => ({
        date: row.date,
        count: row.count,
      })),
      postsLast30Days: postsLast30Days.map((row) => ({
        date: row.date,
        count: row.count,
      })),
    },
    aiService: {
      name: "Mien Kingdom AI",
      description: "AI-powered features for translation, image generation, and content analysis",
      services: await getServiceConfigsForSync(),
      configurable: true,
    },
  };
}

export async function verifySyncAuth(authHeader: string | undefined): Promise<{ valid: boolean; error?: string }> {
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
