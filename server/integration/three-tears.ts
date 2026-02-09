import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { db } from "../db";
import { settings, users } from "../db/schema";
import { eq, or } from "drizzle-orm";
import { getCreditsForTier } from "../../shared/tier-config";
import { getServiceConfigsForSync, updateServiceConfig, AI_SERVICES } from "../services/ai-providers";

const APP_NAME = "Mien Kingdom";
const APP_DESCRIPTION = "A hybrid social community app for the Mien people featuring translation, cultural attire transformation, and recipe discovery.";
const AI_SERVICE_NAME = "Mien Kingdom AI";
const AI_SERVICE_DESCRIPTION = "AI-powered features for translation, image generation, and content analysis";

async function getSettingValue(key: string): Promise<string | null> {
  try {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    return null;
  }
}

export async function getMainAppBaseUrl(): Promise<string> {
  const dbValue = await getSettingValue("three_tears_base_url");
  if (dbValue) return dbValue;
  if (process.env.THREE_TEARS_BASE_URL) return process.env.THREE_TEARS_BASE_URL;

  // Default to localhost:9081 for local development
  const isLocalhost = process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost") ||
                      process.env.EXPO_PUBLIC_DOMAIN?.includes("127.0.0.1");
  if (isLocalhost) {
    return "http://localhost:9081";
  }
  return "https://threetears.net";
}

export async function getEnrollmentSecret(): Promise<string> {
  const dbValue = await getSettingValue("three_tears_enrollment_secret");
  return dbValue || process.env.THREE_TEARS_ENROLLMENT_SECRET || "";
}

export async function setIntegrationSetting(key: string, value: string): Promise<void> {
  try {
    await db.insert(settings).values({
      key,
      value,
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
    throw error;
  }
}

export async function getIntegrationSettings(): Promise<{
  baseUrl: string;
  enrollmentSecret: string;
  appId: string | null;
  lastRegistrationStatus: string | null;
}> {
  const baseUrl = await getMainAppBaseUrl();
  const enrollmentSecret = await getEnrollmentSecret();
  const appId = await getAppId();
  const lastStatus = await getSettingValue("three_tears_last_status");
  
  return {
    baseUrl,
    enrollmentSecret: enrollmentSecret ? "***configured***" : "",
    appId,
    lastRegistrationStatus: lastStatus,
  };
}

let jwksClient: jwksRsa.JwksClient | null = null;

async function getJwksClient(): Promise<jwksRsa.JwksClient> {
  const baseUrl = await getMainAppBaseUrl();
  if (!jwksClient) {
    jwksClient = jwksRsa({
      jwksUri: `${baseUrl}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 3600000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return jwksClient;
}

export function resetJwksClient(): void {
  jwksClient = null;
}

export async function getAppId(): Promise<string | null> {
  try {
    const result = await db.select().from(settings).where(eq(settings.key, "registered_app_id"));
    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    console.error("Failed to get app_id from settings:", error);
    return null;
  }
}

async function setAppId(appId: string): Promise<void> {
  try {
    await db.insert(settings).values({
      key: "registered_app_id",
      value: appId,
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: appId, updatedAt: new Date() },
    });
  } catch (error) {
    console.error("Failed to save app_id to settings:", error);
  }
}

function getAppBaseUrl(): string {
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

function getClientOrigin(): string {
  // The Expo/React Native web client runs on port 8081 in development
  if (process.env.NODE_ENV === "development" || process.env.EXPO_PUBLIC_DOMAIN?.includes("localhost")) {
    return "http://localhost:8081";
  }
  // In production, client is served from the same domain
  return getAppBaseUrl();
}

export async function registerWithThreeTears(forceReregister: boolean = false): Promise<{ success: boolean; message: string; appId?: string }> {
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
            "X-Enrollment-Key": enrollmentSecret,
          },
          body: JSON.stringify({ url: appUrl }),
        });
        if (heartbeatResponse.ok) {
          console.log("[Three Tears] Heartbeat sent successfully");
          await setIntegrationSetting("three_tears_last_status", `Heartbeat OK - ${new Date().toISOString()}`);
          return { success: true, message: "Heartbeat sent successfully", appId: existingAppId };
        } else {
          const status = `Heartbeat failed with status: ${heartbeatResponse.status}`;
          console.warn(`[Three Tears] ${status}`);
          await setIntegrationSetting("three_tears_last_status", `${status} - ${new Date().toISOString()}`);
          return { success: false, message: status };
        }
      } catch (error: any) {
        const status = `Heartbeat request failed: ${error.message}`;
        console.warn("[Three Tears]", status);
        await setIntegrationSetting("three_tears_last_status", `${status} - ${new Date().toISOString()}`);
        return { success: false, message: status };
      }
    }

    console.log("[Three Tears] Registering with main app...");
    const clientOrigin = getClientOrigin();
    console.log(`[Three Tears] API Base URL: ${appUrl}, Client Origin: ${clientOrigin}`);

    try {
      // Get AI service configs for registration
      const aiServicesInfo = await getServiceConfigsForSync();

      const registerResponse = await fetch(`${mainAppBaseUrl}/api/discovery/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Enrollment-Key": enrollmentSecret,
        },
        body: JSON.stringify({
          apiBaseUrl: appUrl,
          appJwksUrl: `${appUrl}/.well-known/jwks.json`,
          clientOrigin: clientOrigin,
          capabilities: {
            tickets: true,
            users: true,
            groups: true,
            snapshot: true,
            knowledge: false,
            aiConfig: true,
          },
          syncEndpoints: {
            tickets: `${appUrl}/api/sync/tickets`,
            users: `${appUrl}/api/sync/users`,
            snapshot: `${appUrl}/api/sync/snapshot`,
          },
          commandEndpoint: `${appUrl}/api/admin/command`,
          aiService: {
            name: AI_SERVICE_NAME,
            description: AI_SERVICE_DESCRIPTION,
            services: aiServicesInfo,
            configurable: true,
          },
        }),
      });

      if (registerResponse.ok) {
        const data = await registerResponse.json();
        if (data.app_id) {
          await setAppId(data.app_id);
          await setIntegrationSetting("three_tears_last_status", `Registered successfully - ${new Date().toISOString()}`);
          console.log(`[Three Tears] Successfully registered with app_id: ${data.app_id}`);
          return { success: true, message: "Successfully registered", appId: data.app_id };
        }
        return { success: false, message: "Registration response missing app_id" };
      } else {
        const status = `Registration failed with status: ${registerResponse.status}`;
        console.warn(`[Three Tears] ${status}`);
        await setIntegrationSetting("three_tears_last_status", `${status} - ${new Date().toISOString()}`);
        return { success: false, message: status };
      }
    } catch (error: any) {
      const status = `Registration request failed: ${error.message}`;
      console.warn("[Three Tears]", status);
      await setIntegrationSetting("three_tears_last_status", `${status} - ${new Date().toISOString()}`);
      return { success: false, message: status };
    }
  } catch (error: any) {
    console.error("[Three Tears] Error during registration:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  const client = await getJwksClient();
  return new Promise((resolve, reject) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      if (signingKey) {
        resolve(signingKey);
      } else {
        reject(new Error("No signing key found"));
      }
    });
  });
}

export async function verifyJwt(token: string): Promise<{ valid: boolean; payload?: any; error?: string }> {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header) {
      return { valid: false, error: "Invalid token format" };
    }

    const signingKey = await getSigningKey(decoded.header);
    
    const payload = jwt.verify(token, signingKey, {
      issuer: "Three Tears",
      algorithms: ["RS256", "RS384", "RS512"],
    });

    return { valid: true, payload };
  } catch (error: any) {
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

export async function broadcastEvent(eventName: string, data: Record<string, any>): Promise<void> {
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
        "X-Enrollment-Key": enrollmentSecret,
      },
      body: JSON.stringify({
        app_id: appId,
        event: eventName,
        data,
        timestamp: new Date().toISOString(),
      }),
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

export async function handleAdminCommand(action: string, params: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (action) {
      case "get_user_details": {
        const { userId, email } = params;
        let user;
        if (userId) {
          const result = await db.select().from(users).where(eq(users.id, userId));
          user = result[0];
        } else if (email) {
          const result = await db.select().from(users).where(eq(users.email, email));
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

        // Resolve target user if userId isn't provided but email or displayName (username) is
        if (!targetUserId) {
          if (email) {
            const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
            if (u) targetUserId = u.id;
          } else if (displayName) {
            // Check displayName (often used as username in external systems)
            const [u] = await db.select().from(users).where(or(eq(users.displayName, displayName), eq(users.id, displayName))).limit(1);
            if (u) targetUserId = u.id;
          }
        }

        if (!targetUserId) {
          return { success: false, error: "User not found or userId/email/displayName missing" };
        }

        const updateData: {
          tierSlug?: string;
          subscriptionActive?: boolean;
          subscriptionExpiresAt?: Date | null;
          credits?: number;
          lastCreditReset?: Date;
        } = {};

        if (tierSlug !== undefined) updateData.tierSlug = tierSlug;

        // Handle subscription active status
        if (subscriptionActive !== undefined) {
          updateData.subscriptionActive = subscriptionActive;
        } else if (tierSlug !== undefined) {
          // Infer from tier - active if not free
          updateData.subscriptionActive = tierSlug !== 'free';
        }

        // Handle subscription expiration
        if (subscriptionExpiresAt !== undefined) {
          updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
        }

        // If subscription is being activated, grant credits based on tier
        if (updateData.subscriptionActive && tierSlug) {
          const creditsToGrant = getCreditsForTier(tierSlug);
          updateData.credits = creditsToGrant;
          updateData.lastCreditReset = new Date();
        }

        if (Object.keys(updateData).length === 0) {
          return { success: false, error: "tierSlug or subscription status must be provided" };
        }

        const result = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, targetUserId))
          .returning();

        if (result.length === 0) {
          return { success: false, error: "User not found" };
        }
        return { success: true, data: { message: "Subscription updated", user: result[0] } };
      }

      case "license_update": {
        // Handle license updates from threetears.net
        const { user_id, tier_slug, subscription_active, expiration_date, status } = params;

        if (!user_id) {
          return { success: false, error: "user_id is required" };
        }

        // Find user by external ID or email
        let targetUser;
        const [u] = await db.select().from(users).where(
          or(eq(users.id, user_id), eq(users.email, user_id))
        ).limit(1);
        targetUser = u;

        if (!targetUser) {
          return { success: false, error: "User not found" };
        }

        const isActive = subscription_active ?? (status === 'active');
        const updateData: {
          tierSlug?: string;
          subscriptionActive: boolean;
          subscriptionExpiresAt?: Date | null;
          credits?: number;
          lastCreditReset?: Date;
        } = {
          subscriptionActive: isActive,
        };

        if (tier_slug) updateData.tierSlug = tier_slug;
        if (expiration_date) updateData.subscriptionExpiresAt = new Date(expiration_date);

        // If subscription is being activated, grant credits
        if (isActive && tier_slug) {
          const creditsToGrant = getCreditsForTier(tier_slug);
          updateData.credits = creditsToGrant;
          updateData.lastCreditReset = new Date();
        } else if (!isActive) {
          // Downgrade to free tier
          updateData.tierSlug = 'free';
          updateData.credits = 0;
        }

        const result = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, targetUser.id))
          .returning();

        return { success: true, data: { message: "License updated", user: result[0] } };
      }

      case "disable_user": {
        const { userId } = params;
        if (!userId) {
          return { success: false, error: "userId is required" };
        }
        const result = await db
          .update(users)
          .set({ isDisabled: true })
          .where(eq(users.id, userId))
          .returning();
        
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
        const result = await db
          .update(users)
          .set({ isDisabled: false })
          .where(eq(users.id, userId))
          .returning();
        
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
        const { services } = params as { services: Array<{ serviceKey: string; modelName?: string; apiKey?: string; endpointUrl?: string; isEnabled?: boolean }> };
        if (!services || !Array.isArray(services)) {
          return { success: false, error: "services array is required" };
        }

        let updated = 0;
        const errors: string[] = [];

        for (const service of services) {
          if (!service.serviceKey || !AI_SERVICES[service.serviceKey.toUpperCase() as keyof typeof AI_SERVICES]) {
            errors.push(`Unknown service: ${service.serviceKey}`);
            continue;
          }

          try {
            await updateServiceConfig(service.serviceKey, {
              modelName: service.modelName,
              apiKey: service.apiKey,
              endpointUrl: service.endpointUrl,
              isEnabled: service.isEnabled,
            });
            updated++;
          } catch (error: any) {
            errors.push(`Failed to update ${service.serviceKey}: ${error.message}`);
          }
        }

        return {
          success: errors.length === 0,
          data: {
            message: `AI config updated: ${updated} services updated`,
            updated,
            errors,
          },
        };
      }

      case "get_ai_config": {
        const aiServicesInfo = await getServiceConfigsForSync();
        return {
          success: true,
          data: {
            serviceName: AI_SERVICE_NAME,
            description: AI_SERVICE_DESCRIPTION,
            services: aiServicesInfo,
          },
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

export async function getChatWidgetScript(): Promise<string> {
  const appId = await getAppId();
  const mainAppBaseUrl = await getMainAppBaseUrl();
  return `<script src="${mainAppBaseUrl}/widget.js" data-app-id="${appId || "pending"}"></script>`;
}

