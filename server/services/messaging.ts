import { db } from "../db";
import {
  directConversations,
  encryptedMessages,
  userPublicKeys,
  conversationKeys,
  users,
  follows,
  type DirectConversation,
  type EncryptedMessage,
  type UserPublicKey,
  type MessageType,
} from "../db/schema";
import { eq, and, or, desc, lt, sql, inArray } from "drizzle-orm";

// Check if two users are mutual followers (friends)
export async function areMutualFollowers(userId1: string, userId2: string): Promise<boolean> {
  const [follow1to2] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId1), eq(follows.followeeId, userId2)));

  const [follow2to1] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId2), eq(follows.followeeId, userId1)));

  return !!(follow1to2 && follow2to1);
}

// Get or create a conversation between two users
export async function getOrCreateConversation(
  userId1: string,
  userId2: string
): Promise<DirectConversation> {
  // Check existing conversation (could be in either order)
  const [existing] = await db
    .select()
    .from(directConversations)
    .where(
      or(
        and(
          eq(directConversations.participant1Id, userId1),
          eq(directConversations.participant2Id, userId2)
        ),
        and(
          eq(directConversations.participant1Id, userId2),
          eq(directConversations.participant2Id, userId1)
        )
      )
    );

  if (existing) {
    return existing;
  }

  // Create new conversation
  const [conversation] = await db
    .insert(directConversations)
    .values({
      participant1Id: userId1,
      participant2Id: userId2,
    })
    .returning();

  return conversation;
}

// Get all conversations for a user with last message and other participant info
export async function getUserConversations(userId: string) {
  const conversations = await db
    .select()
    .from(directConversations)
    .where(
      or(
        eq(directConversations.participant1Id, userId),
        eq(directConversations.participant2Id, userId)
      )
    )
    .orderBy(desc(directConversations.lastMessageAt));

  // Enrich with participant info and last message
  const enrichedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const otherParticipantId =
        conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;

      const [otherUser] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
        })
        .from(users)
        .where(eq(users.id, otherParticipantId));

      // Get last message
      const [lastMessage] = await db
        .select()
        .from(encryptedMessages)
        .where(eq(encryptedMessages.conversationId, conv.id))
        .orderBy(desc(encryptedMessages.createdAt))
        .limit(1);

      // Count unread messages
      const [unreadCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(encryptedMessages)
        .where(
          and(
            eq(encryptedMessages.conversationId, conv.id),
            eq(encryptedMessages.isRead, false),
            sql`${encryptedMessages.senderId} != ${userId}`
          )
        );

      return {
        ...conv,
        participant: otherUser,
        lastMessage: lastMessage || null,
        unreadCount: Number(unreadCount?.count || 0),
      };
    })
  );

  return enrichedConversations;
}

// Get messages in a conversation with pagination
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  before?: string
) {
  let query = db
    .select()
    .from(encryptedMessages)
    .where(eq(encryptedMessages.conversationId, conversationId));

  if (before) {
    const [beforeMessage] = await db
      .select()
      .from(encryptedMessages)
      .where(eq(encryptedMessages.id, before));

    if (beforeMessage) {
      query = db
        .select()
        .from(encryptedMessages)
        .where(
          and(
            eq(encryptedMessages.conversationId, conversationId),
            lt(encryptedMessages.createdAt, beforeMessage.createdAt)
          )
        );
    }
  }

  const messages = await query
    .orderBy(desc(encryptedMessages.createdAt))
    .limit(limit);

  // Return in chronological order
  return messages.reverse();
}

// Send an encrypted message
export async function sendEncryptedMessage(
  conversationId: string,
  senderId: string,
  encryptedContent: string,
  encryptedContentIv: string,
  messageType: MessageType = "text"
): Promise<EncryptedMessage> {
  const [message] = await db
    .insert(encryptedMessages)
    .values({
      conversationId,
      senderId,
      encryptedContent,
      encryptedContentIv,
      messageType,
    })
    .returning();

  // Update conversation's lastMessageAt
  await db
    .update(directConversations)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(directConversations.id, conversationId));

  return message;
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
  messageIds?: string[]
) {
  const now = new Date();

  if (messageIds && messageIds.length > 0) {
    await db
      .update(encryptedMessages)
      .set({ isRead: true, readAt: now })
      .where(
        and(
          eq(encryptedMessages.conversationId, conversationId),
          sql`${encryptedMessages.senderId} != ${userId}`,
          inArray(encryptedMessages.id, messageIds)
        )
      );
  } else {
    // Mark all unread messages in conversation as read
    await db
      .update(encryptedMessages)
      .set({ isRead: true, readAt: now })
      .where(
        and(
          eq(encryptedMessages.conversationId, conversationId),
          sql`${encryptedMessages.senderId} != ${userId}`,
          eq(encryptedMessages.isRead, false)
        )
      );
  }
}

// Get total unread message count for a user
export async function getUnreadMessageCount(userId: string): Promise<number> {
  // Get all conversation IDs for this user
  const conversations = await db
    .select({ id: directConversations.id })
    .from(directConversations)
    .where(
      or(
        eq(directConversations.participant1Id, userId),
        eq(directConversations.participant2Id, userId)
      )
    );

  if (conversations.length === 0) return 0;

  const conversationIds = conversations.map((c) => c.id);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(encryptedMessages)
    .where(
      and(
        inArray(encryptedMessages.conversationId, conversationIds),
        sql`${encryptedMessages.senderId} != ${userId}`,
        eq(encryptedMessages.isRead, false)
      )
    );

  return Number(result?.count || 0);
}

// Save or update user's public keys
export async function saveUserPublicKeys(
  userId: string,
  publicKey: string,
  identityPublicKey: string,
  signedPreKey: string,
  preKeySignature: string
): Promise<UserPublicKey> {
  // Check if user already has keys
  const [existing] = await db
    .select()
    .from(userPublicKeys)
    .where(eq(userPublicKeys.userId, userId));

  if (existing) {
    const [updated] = await db
      .update(userPublicKeys)
      .set({
        publicKey,
        identityPublicKey,
        signedPreKey,
        preKeySignature,
        updatedAt: new Date(),
      })
      .where(eq(userPublicKeys.userId, userId))
      .returning();
    return updated;
  }

  const [newKeys] = await db
    .insert(userPublicKeys)
    .values({
      userId,
      publicKey,
      identityPublicKey,
      signedPreKey,
      preKeySignature,
    })
    .returning();

  return newKeys;
}

// Get user's public key bundle
export async function getUserPublicKeys(userId: string): Promise<UserPublicKey | null> {
  const [keys] = await db
    .select()
    .from(userPublicKeys)
    .where(eq(userPublicKeys.userId, userId));

  return keys || null;
}

// Save conversation key for a user
export async function saveConversationKey(
  conversationId: string,
  userId: string,
  encryptedSharedKey: string,
  encryptedSharedKeyIv: string
) {
  // Check if key already exists
  const [existing] = await db
    .select()
    .from(conversationKeys)
    .where(
      and(
        eq(conversationKeys.conversationId, conversationId),
        eq(conversationKeys.userId, userId)
      )
    );

  if (existing) {
    const [updated] = await db
      .update(conversationKeys)
      .set({
        encryptedSharedKey,
        encryptedSharedKeyIv,
      })
      .where(eq(conversationKeys.id, existing.id))
      .returning();
    return updated;
  }

  const [newKey] = await db
    .insert(conversationKeys)
    .values({
      conversationId,
      userId,
      encryptedSharedKey,
      encryptedSharedKeyIv,
    })
    .returning();

  return newKey;
}

// Get conversation key for a user
export async function getConversationKey(conversationId: string, userId: string) {
  const [key] = await db
    .select()
    .from(conversationKeys)
    .where(
      and(
        eq(conversationKeys.conversationId, conversationId),
        eq(conversationKeys.userId, userId)
      )
    );

  return key || null;
}

// Verify user is participant in conversation
export async function isConversationParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const [conversation] = await db
    .select()
    .from(directConversations)
    .where(eq(directConversations.id, conversationId));

  if (!conversation) return false;

  return (
    conversation.participant1Id === userId || conversation.participant2Id === userId
  );
}

// Get conversation by ID
export async function getConversation(conversationId: string) {
  const [conversation] = await db
    .select()
    .from(directConversations)
    .where(eq(directConversations.id, conversationId));

  return conversation || null;
}

// Get friends list (mutual followers)
export async function getFriendsList(userId: string) {
  // Get users that this user follows
  const following = await db
    .select({ followeeId: follows.followeeId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  if (following.length === 0) return [];

  const followingIds = following.map((f) => f.followeeId);

  // Filter to only those who follow back
  const mutualFollows = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(
      and(
        eq(follows.followeeId, userId),
        inArray(follows.followerId, followingIds)
      )
    );

  if (mutualFollows.length === 0) return [];

  const friendIds = mutualFollows.map((f) => f.followerId);

  // Get friend user info
  const friends = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatar: users.avatar,
    })
    .from(users)
    .where(inArray(users.id, friendIds));

  return friends;
}
