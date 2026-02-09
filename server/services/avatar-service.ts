import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { getGeminiKeyForSession, releaseGeminiKeyForSession } from "./gemini-keys";

const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const SIMLI_API_KEY = process.env.SIMLI_API_KEY || "";
const SIMLI_FACE_ID = process.env.SIMLI_FACE_ID || "";

interface AvatarSession {
  sessionId: string;
  roomName: string;
  userId: string;
  geminiKeyIndex: number;
  createdAt: Date;
  lastActivity: Date;
}

const activeSessions = new Map<string, AvatarSession>();

export function validateAvatarConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!LIVEKIT_URL) missing.push("LIVEKIT_URL");
  if (!LIVEKIT_API_KEY) missing.push("LIVEKIT_API_KEY");
  if (!LIVEKIT_API_SECRET) missing.push("LIVEKIT_API_SECRET");
  if (!SIMLI_API_KEY) missing.push("SIMLI_API_KEY");
  if (!SIMLI_FACE_ID) missing.push("SIMLI_FACE_ID");
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

export async function createAvatarSession(userId: string): Promise<{
  sessionId: string;
  roomName: string;
  token: string;
  livekitUrl: string;
  simliConfig: {
    apiKey: string;
    faceId: string;
  };
}> {
  const config = validateAvatarConfig();
  if (!config.valid) {
    throw new Error(`Avatar service not configured. Missing: ${config.missing.join(", ")}`);
  }

  const sessionId = `avatar_${userId}_${Date.now()}`;
  const roomName = `ong-room-${userId}-${Date.now()}`;

  const geminiKeyIndex = getGeminiKeyForSession(sessionId);

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name: `User ${userId}`,
    ttl: "1h",
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  const session: AvatarSession = {
    sessionId,
    roomName,
    userId,
    geminiKeyIndex,
    createdAt: new Date(),
    lastActivity: new Date(),
  };
  activeSessions.set(sessionId, session);

  console.log(`[Avatar] Session created: ${sessionId} for user ${userId}`);

  return {
    sessionId,
    roomName,
    token,
    livekitUrl: LIVEKIT_URL,
    simliConfig: {
      apiKey: SIMLI_API_KEY,
      faceId: SIMLI_FACE_ID,
    },
  };
}

export async function endAvatarSession(sessionId: string): Promise<boolean> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    console.log(`[Avatar] Session not found: ${sessionId}`);
    return false;
  }

  releaseGeminiKeyForSession(sessionId);
  activeSessions.delete(sessionId);

  try {
    const roomService = new RoomServiceClient(
      LIVEKIT_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );
    await roomService.deleteRoom(session.roomName);
    console.log(`[Avatar] Room deleted: ${session.roomName}`);
  } catch (error) {
    console.error(`[Avatar] Failed to delete room: ${session.roomName}`, error);
  }

  console.log(`[Avatar] Session ended: ${sessionId}`);
  return true;
}

export function getActiveSession(sessionId: string): AvatarSession | undefined {
  return activeSessions.get(sessionId);
}

export function updateSessionActivity(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
}

export function cleanupInactiveSessions(maxIdleMinutes: number = 10): void {
  const now = new Date();
  const maxIdleMs = maxIdleMinutes * 60 * 1000;

  for (const [sessionId, session] of activeSessions.entries()) {
    const idleTime = now.getTime() - session.lastActivity.getTime();
    if (idleTime > maxIdleMs) {
      console.log(`[Avatar] Cleaning up inactive session: ${sessionId}`);
      endAvatarSession(sessionId);
    }
  }
}

setInterval(() => cleanupInactiveSessions(10), 60000);

export function getSessionStats(): {
  activeSessions: number;
  sessions: Array<{
    sessionId: string;
    userId: string;
    createdAt: Date;
    lastActivity: Date;
  }>;
} {
  const sessions = Array.from(activeSessions.values()).map((s) => ({
    sessionId: s.sessionId,
    userId: s.userId,
    createdAt: s.createdAt,
    lastActivity: s.lastActivity,
  }));

  return {
    activeSessions: activeSessions.size,
    sessions,
  };
}
