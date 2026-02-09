import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

const DEV_ADMIN_ID = "dev-admin-1";

async function ensureDevAdminExists(): Promise<void> {
  const existing = await db.select().from(users).where(eq(users.id, DEV_ADMIN_ID)).limit(1);
  if (existing.length === 0) {
    await db.execute(sql`
      INSERT INTO users (id, email, display_name, avatar, provider, provider_user_id, role, tier_slug, credits)
      VALUES (${DEV_ADMIN_ID}, ${'dev-admin@mien.local'}, ${'Dev Admin'}, ${null}, ${'google'}, ${'dev-admin-provider-id'}, ${'admin'}, ${'free'}, ${30})
      ON CONFLICT (id) DO NOTHING
    `);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    avatar: string | null;
    provider: string;
    role: "user" | "moderator" | "admin";
  };
  session?: {
    id: string;
    token: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);
    
    // Dev bypass: only accept dev tokens in explicit development environment on localhost
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
        role: "admin",
      };
      req.session = {
        id: "dev-session-1",
        token: token,
      };
      return next();
    }
    
    const sessionResults = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (sessionResults.length === 0) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const session = sessionResults[0];
    
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

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
      role: user.role,
    };
    req.session = {
      id: session.id,
      token: session.token,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

export function requireModerator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role !== "admin" && req.user.role !== "moderator") {
    return res.status(403).json({ error: "Moderator or admin access required" });
  }

  next();
}
