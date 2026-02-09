import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  isAlive: boolean;
}

// Map of userId -> Set of connected WebSocket clients
const clients = new Map<string, Set<AuthenticatedWebSocket>>();

// Verify session token and return user
async function verifySessionToken(token: string | null): Promise<{ id: string } | null> {
  if (!token) return null;

  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

    if (!session) return null;

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, session.userId));

    return user || null;
  } catch {
    return null;
  }
}

// Remove client from tracking
function removeClient(ws: AuthenticatedWebSocket) {
  if (!ws.userId) return;

  const userClients = clients.get(ws.userId);
  if (userClients) {
    userClients.delete(ws);
    if (userClients.size === 0) {
      clients.delete(ws.userId);
    }
  }
}

// Handle incoming WebSocket messages
function handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
  try {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;

      case "typing":
        // Broadcast typing indicator to the other participant
        if (message.conversationId && message.recipientId) {
          sendToUser(message.recipientId, {
            type: "typing",
            conversationId: message.conversationId,
            userId: ws.userId,
            isTyping: message.isTyping,
          });
        }
        break;

      case "read_receipt":
        // Broadcast read receipt to sender
        if (message.conversationId && message.senderId) {
          sendToUser(message.senderId, {
            type: "read_receipt",
            conversationId: message.conversationId,
            messageIds: message.messageIds,
            readBy: ws.userId,
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

// Send payload to a specific user (all their connected clients)
export function sendToUser(userId: string, payload: object) {
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

// Broadcast new message to conversation participants
export function broadcastNewMessage(
  conversationId: string,
  participantIds: string[],
  message: {
    id: string;
    senderId: string;
    encryptedContent: string;
    encryptedContentIv: string;
    messageType: string;
    createdAt: string;
  }
) {
  participantIds.forEach((userId) => {
    sendToUser(userId, {
      type: "new_message",
      conversationId,
      message,
    });
  });
}

// Setup WebSocket server
export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/messages" });

  wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
    // Authenticate via query param token
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    const user = await verifySessionToken(token);

    if (!user) {
      ws.close(4001, "Unauthorized");
      return;
    }

    ws.userId = user.id;
    ws.isAlive = true;

    // Add to connected clients
    if (!clients.has(user.id)) {
      clients.set(user.id, new Set());
    }
    clients.get(user.id)!.add(ws);

    console.log(`WebSocket connected: user ${user.id}`);

    // Send connection success
    ws.send(JSON.stringify({ type: "connected", userId: user.id }));

    // Handle messages
    ws.on("message", (data: Buffer) => handleMessage(ws, data));

    // Handle pong for keepalive
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Handle close
    ws.on("close", () => {
      console.log(`WebSocket disconnected: user ${ws.userId}`);
      removeClient(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${ws.userId}:`, error);
      removeClient(ws);
    });
  });

  // Heartbeat interval to detect broken connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;
      if (!authWs.isAlive) {
        removeClient(authWs);
        return authWs.terminate();
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  console.log("WebSocket server initialized on /ws/messages");

  return wss;
}

// Get online status for users
export function getOnlineUsers(userIds: string[]): string[] {
  return userIds.filter((id) => clients.has(id) && clients.get(id)!.size > 0);
}

// Check if a specific user is online
export function isUserOnline(userId: string): boolean {
  return clients.has(userId) && clients.get(userId)!.size > 0;
}
