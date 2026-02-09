export interface TierAllocation {
  imageGenerations: number;    // Image generation (Make Me Mien, etc.)
  translationCredits: number;  // Mien translation credits
  foodAnalysis: number;        // Food/recipe analysis
  audioMinutes: number;        // Companion audio minutes
  videoWorkflows: number;      // Video related (movie star, tiktok)
}

export interface TierConfig {
  slug: string;
  name: string;
  price: number;
  billingPeriod: "week" | "month" | "year";
  allocation: TierAllocation;
  features: string[];
  popular?: boolean;
}

export interface TierCheckmark {
  color: string;
  label: string;
  priority: number;
}

export const TIER_CHECKMARK_CONFIG: Record<string, TierCheckmark | null> = {
  free: null,
  tier_weekly: { color: "#3B82F6", label: "Blue verified", priority: 1 },
  tier_monthly: { color: "#8B5CF6", label: "Purple verified", priority: 2 },
  tier_yearly: { color: "#F59E0B", label: "Gold verified", priority: 3 },
};

export function getCheckmarkForTier(slug: string | undefined): TierCheckmark | null {
  if (!slug) return null;
  return TIER_CHECKMARK_CONFIG[slug] ?? null;
}

export function getTierPriority(slug: string | undefined): number {
  if (!slug) return 0;
  return TIER_CHECKMARK_CONFIG[slug]?.priority ?? 0;
}

// Weekly allocation
const WEEKLY_ALLOCATION: TierAllocation = {
  imageGenerations: 10,
  translationCredits: 20,
  foodAnalysis: 20,
  audioMinutes: 20,
  videoWorkflows: 3,
};

// Monthly = Weekly x 4
const MONTHLY_ALLOCATION: TierAllocation = {
  imageGenerations: 40,
  translationCredits: 80,
  foodAnalysis: 80,
  audioMinutes: 80,
  videoWorkflows: 12,
};

// Yearly = Monthly x 5
const YEARLY_ALLOCATION: TierAllocation = {
  imageGenerations: 200,
  translationCredits: 400,
  foodAnalysis: 400,
  audioMinutes: 400,
  videoWorkflows: 60,
};

export const TIER_CONFIG: Record<string, TierConfig> = {
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
      videoWorkflows: 0,
    },
    features: [
      "5 translation credits (renews monthly)",
      "1 food analysis",
      "2 image generations",
      "2 minutes companion",
      "Free access to non-AI features",
      "Community access",
    ],
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
      "Blue verified checkmark",
    ],
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
      "Purple verified checkmark",
    ],
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
      "Trending feed priority",
    ],
  },
};

// Credits per tier (used for local credit tracking)
export const TIER_CREDITS: Record<string, number> = {
  free: 0,
  tier_weekly: 100,
  tier_monthly: 500,
  tier_yearly: 2500,
};

export const TIER_ORDER = ["free", "tier_weekly", "tier_monthly", "tier_yearly"];

export function getTierBySlug(slug: string): TierConfig {
  return TIER_CONFIG[slug] || TIER_CONFIG.free;
}

export function getAllocationForTier(slug: string): TierAllocation {
  return getTierBySlug(slug).allocation;
}

// Returns credits for tier from TIER_CREDITS config
export function getCreditsForTier(slug: string): number {
  return TIER_CREDITS[slug] || 0;
}

// Get billing period duration in days
export function getBillingPeriodDays(billingPeriod: "week" | "month" | "year"): number {
  switch (billingPeriod) {
    case "week": return 7;
    case "month": return 30;
    case "year": return 365;
    default: return 30;
  }
}

// Check if credits should be reset based on last reset date and tier
export function shouldResetCredits(lastResetDate: Date | null, tierSlug: string): boolean {
  if (!lastResetDate) return true;

  const tier = getTierBySlug(tierSlug);
  const periodDays = getBillingPeriodDays(tier.billingPeriod);
  const daysSinceReset = Math.floor((Date.now() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24));

  return daysSinceReset >= periodDays;
}
