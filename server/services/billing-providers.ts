import { db } from "../db";
import { billingProviders, BillingProviderType, ClientPlatform, users, creditTransactions } from "../db/schema";
import { eq } from "drizzle-orm";
import { encryptApiKey, decryptApiKeyFromFields, maskApiKey } from "../utils/encryption";

// Provider display names
const PROVIDER_DISPLAY_NAMES: Record<BillingProviderType, string> = {
  stripe: "Stripe",
  revenuecat: "RevenueCat",
};

// Default RevenueCat config structure
interface RevenueCatConfig {
  appAppleId?: string;       // RevenueCat App ID for iOS
  appGoogleId?: string;      // RevenueCat App ID for Android
  projectId?: string;        // RevenueCat Project ID
  entitlementId?: string;    // The entitlement identifier for premium access
}

// Default Stripe config structure
interface StripeConfig {
  accountId?: string;        // Stripe account ID
  currency?: string;         // Default currency (e.g., "usd")
  webhookEndpointId?: string; // Webhook endpoint ID for reference
}

export interface BillingProviderInfo {
  provider: BillingProviderType;
  displayName: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string;
  publicKey: string | null;
  hasWebhookSecret: boolean;
  config: RevenueCatConfig | StripeConfig | null;
  sourceType: string;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
}

/**
 * Get all billing provider configurations (masked for UI display)
 */
export async function getBillingProviders(): Promise<BillingProviderInfo[]> {
  const providers = await db.select().from(billingProviders);

  // Ensure we have entries for both providers
  const providerMap = new Map(providers.map((p) => [p.provider, p]));

  const result: BillingProviderInfo[] = [];

  for (const providerType of ["stripe", "revenuecat"] as BillingProviderType[]) {
    const existing = providerMap.get(providerType);

    if (existing) {
      // Decrypt API key just to check if it exists and mask it
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
        config: existing.config as RevenueCatConfig | StripeConfig | null,
        sourceType: existing.sourceType,
        lastTestedAt: existing.lastTestedAt,
        lastTestStatus: existing.lastTestStatus,
      });
    } else {
      // Return default empty config
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
        lastTestStatus: null,
      });
    }
  }

  return result;
}

/**
 * Get a specific billing provider's full configuration (with decrypted keys)
 */
export async function getBillingProviderWithKeys(
  providerType: BillingProviderType
): Promise<{
  apiKey: string | null;
  webhookSecret: string | null;
  publicKey: string | null;
  config: RevenueCatConfig | StripeConfig | null;
  isEnabled: boolean;
} | null> {
  const [provider] = await db
    .select()
    .from(billingProviders)
    .where(eq(billingProviders.provider, providerType));

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
    config: provider.config as RevenueCatConfig | StripeConfig | null,
    isEnabled: provider.isEnabled,
  };
}

/**
 * Update billing provider configuration
 */
export async function updateBillingProvider(
  providerType: BillingProviderType,
  updates: {
    apiKey?: string;
    publicKey?: string;
    webhookSecret?: string;
    config?: RevenueCatConfig | StripeConfig;
    isEnabled?: boolean;
    sourceType?: "local" | "three_tears";
  }
): Promise<BillingProviderInfo> {
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (updates.apiKey !== undefined) {
    if (updates.apiKey) {
      const encrypted = encryptApiKey(updates.apiKey);
      updateData.apiKeyEncrypted = encrypted.encrypted;
      updateData.apiKeyIv = encrypted.iv;
      updateData.apiKeyAuthTag = encrypted.authTag;
    } else {
      // Clear the API key
      updateData.apiKeyEncrypted = null;
      updateData.apiKeyIv = null;
      updateData.apiKeyAuthTag = null;
    }
  }

  if (updates.publicKey !== undefined) {
    updateData.publicKey = updates.publicKey || null;
  }

  if (updates.webhookSecret !== undefined) {
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

  if (updates.config !== undefined) {
    updateData.config = updates.config;
  }

  if (updates.isEnabled !== undefined) {
    updateData.isEnabled = updates.isEnabled;
  }

  if (updates.sourceType !== undefined) {
    updateData.sourceType = updates.sourceType;
    if (updates.sourceType === "three_tears") {
      updateData.threeTearsSyncedAt = new Date();
    }
  }

  // Upsert the provider configuration
  await db
    .insert(billingProviders)
    .values({
      provider: providerType,
      displayName: PROVIDER_DISPLAY_NAMES[providerType],
      ...updateData,
    })
    .onConflictDoUpdate({
      target: billingProviders.provider,
      set: updateData,
    });

  // Return the updated provider info
  const providers = await getBillingProviders();
  return providers.find((p) => p.provider === providerType)!;
}

/**
 * Test Stripe connection
 */
export async function testStripeConnection(): Promise<{ success: boolean; message: string }> {
  const provider = await getBillingProviderWithKeys("stripe");

  if (!provider || !provider.apiKey) {
    return { success: false, message: "Stripe API key not configured" };
  }

  try {
    // Simple API call to verify the key works
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
    });

    if (response.ok) {
      // Update test status
      await db
        .update(billingProviders)
        .set({
          lastTestedAt: new Date(),
          lastTestStatus: "success",
        })
        .where(eq(billingProviders.provider, "stripe"));

      return { success: true, message: "Stripe connection successful" };
    } else {
      const error = await response.json();
      const errorMessage = error.error?.message || "Unknown error";

      await db
        .update(billingProviders)
        .set({
          lastTestedAt: new Date(),
          lastTestStatus: `error: ${errorMessage}`,
        })
        .where(eq(billingProviders.provider, "stripe"));

      return { success: false, message: errorMessage };
    }
  } catch (error: any) {
    await db
      .update(billingProviders)
      .set({
        lastTestedAt: new Date(),
        lastTestStatus: `error: ${error.message}`,
      })
      .where(eq(billingProviders.provider, "stripe"));

    return { success: false, message: error.message };
  }
}

/**
 * Test RevenueCat connection
 */
export async function testRevenueCatConnection(): Promise<{ success: boolean; message: string }> {
  const provider = await getBillingProviderWithKeys("revenuecat");

  if (!provider || !provider.apiKey) {
    return { success: false, message: "RevenueCat API key not configured" };
  }

  try {
    // RevenueCat API v1 endpoint to verify API key
    // Using a simple subscribers endpoint with a non-existent user to test auth
    const response = await fetch(
      "https://api.revenuecat.com/v1/subscribers/$RCAnonymousID:test-connection",
      {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 404 is expected (user doesn't exist), but means auth worked
    // 401/403 means auth failed
    if (response.ok || response.status === 404) {
      await db
        .update(billingProviders)
        .set({
          lastTestedAt: new Date(),
          lastTestStatus: "success",
        })
        .where(eq(billingProviders.provider, "revenuecat"));

      return { success: true, message: "RevenueCat connection successful" };
    } else {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      const errorMessage = error.message || `HTTP ${response.status}`;

      await db
        .update(billingProviders)
        .set({
          lastTestedAt: new Date(),
          lastTestStatus: `error: ${errorMessage}`,
        })
        .where(eq(billingProviders.provider, "revenuecat"));

      return { success: false, message: errorMessage };
    }
  } catch (error: any) {
    await db
      .update(billingProviders)
      .set({
        lastTestedAt: new Date(),
        lastTestStatus: `error: ${error.message}`,
      })
      .where(eq(billingProviders.provider, "revenuecat"));

    return { success: false, message: error.message };
  }
}

/**
 * Determine which billing provider to use based on client platform
 */
export function getBillingProviderForPlatform(platform: ClientPlatform): BillingProviderType {
  switch (platform) {
    case "web":
      return "stripe";
    case "ios":
    case "android":
      return "revenuecat";
    default:
      return "stripe"; // Default to Stripe for unknown platforms
  }
}

/**
 * Check if a billing provider is properly configured and enabled
 */
export async function isBillingProviderReady(
  providerType: BillingProviderType
): Promise<boolean> {
  const provider = await getBillingProviderWithKeys(providerType);
  return !!(provider && provider.isEnabled && provider.apiKey);
}

/**
 * Handle subscription update from billing provider
 * This is called by webhooks from both Stripe and RevenueCat
 */
export async function handleSubscriptionUpdate(params: {
  userId: string;
  tierSlug: string;
  credits: number;
  subscriptionExpiresAt?: Date;
  source: "stripe" | "revenuecat";
  transactionId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, tierSlug, credits, subscriptionExpiresAt, source, transactionId } = params;

  try {
    // Get current user
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update user subscription
    await db
      .update(users)
      .set({
        tierSlug,
        credits,
        subscriptionActive: tierSlug !== "free",
        subscriptionExpiresAt: subscriptionExpiresAt || null,
        lastCreditReset: new Date(),
      })
      .where(eq(users.id, userId));

    // Log the transaction
    await db.insert(creditTransactions).values({
      userId,
      type: "refill",
      amount: credits,
      balanceAfter: credits,
      feature: null,
      description: `Subscription ${tierSlug} via ${source}${transactionId ? ` (${transactionId})` : ""}`,
    });

    console.log(`[Billing] Updated subscription for user ${userId}: ${tierSlug} with ${credits} credits via ${source}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[Billing] Failed to update subscription for user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionCancellation(params: {
  userId: string;
  source: "stripe" | "revenuecat";
  transactionId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, source, transactionId } = params;

  try {
    // Get current user
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Downgrade to free tier
    await db
      .update(users)
      .set({
        tierSlug: "free",
        subscriptionActive: false,
        credits: 0,
      })
      .where(eq(users.id, userId));

    console.log(`[Billing] Cancelled subscription for user ${userId} via ${source}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[Billing] Failed to cancel subscription for user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk update billing credentials from Three Tears
 */
export async function updateBillingCredentialsFromThreeTears(credentials: {
  stripe?: {
    apiKey?: string;
    publicKey?: string;
    webhookSecret?: string;
    config?: StripeConfig;
    isEnabled?: boolean;
  };
  revenuecat?: {
    apiKey?: string;
    publicKey?: string;
    webhookSecret?: string;
    config?: RevenueCatConfig;
    isEnabled?: boolean;
  };
}): Promise<{ success: boolean; updated: string[]; errors: string[] }> {
  const updated: string[] = [];
  const errors: string[] = [];

  if (credentials.stripe) {
    try {
      await updateBillingProvider("stripe", {
        ...credentials.stripe,
        sourceType: "three_tears",
      });
      updated.push("stripe");
    } catch (error: any) {
      errors.push(`stripe: ${error.message}`);
    }
  }

  if (credentials.revenuecat) {
    try {
      await updateBillingProvider("revenuecat", {
        ...credentials.revenuecat,
        sourceType: "three_tears",
      });
      updated.push("revenuecat");
    } catch (error: any) {
      errors.push(`revenuecat: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    updated,
    errors,
  };
}
