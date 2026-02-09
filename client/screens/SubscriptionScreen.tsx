import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/lib/AuthContext";
import { getApiUrl } from "@/lib/query-client";

interface CreditTransaction {
  id: string;
  type: "deduction" | "refill" | "bonus" | "adjustment";
  amount: number;
  balanceAfter: number;
  feature: string | null;
  description: string | null;
  createdAt: string;
}

interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
  featureStats: Record<string, number>;
}

interface TierAllocation {
  imageGenerations: number;
  translationCredits: number;
  foodAnalysis: number;
  audioMinutes: number;
  videoWorkflows: number;
}

interface TierConfig {
  slug: string;
  name: string;
  price: number;
  billingPeriod: "week" | "month" | "year";
  allocation: TierAllocation;
  features: string[];
  popular?: boolean;
}

const WEEKLY_ALLOCATION: TierAllocation = {
  imageGenerations: 10,
  translationCredits: 20,
  foodAnalysis: 20,
  audioMinutes: 20,
  videoWorkflows: 3,
};

const MONTHLY_ALLOCATION: TierAllocation = {
  imageGenerations: 40,
  translationCredits: 80,
  foodAnalysis: 80,
  audioMinutes: 80,
  videoWorkflows: 12,
};

const YEARLY_ALLOCATION: TierAllocation = {
  imageGenerations: 200,
  translationCredits: 400,
  foodAnalysis: 400,
  audioMinutes: 400,
  videoWorkflows: 60,
};

const TIERS: TierConfig[] = [
  {
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
  {
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
      "Blue verified checkmark on your profile",
    ],
  },
  {
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
      "Purple verified checkmark on your profile",
    ],
  },
  {
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
      "Gold verified checkmark on your profile",
      "Trending feed priority",
    ],
  },
];


const FEATURE_LABELS: Record<string, string> = {
  translation: "Translation",
  recipe: "Food Analysis",
  dress_me: "Image Generation",
  talk_to_avatar: "Companion",
  movie_star: "Movie Star",
  tiktok_dance: "TikTok Dance",
};

const FEATURE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  translation: "globe",
  recipe: "book-open",
  dress_me: "image",
  talk_to_avatar: "mic",
  movie_star: "film",
  tiktok_dance: "music",
};

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const { user, sessionToken, updateUser } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [historyData, setHistoryData] = useState<CreditHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartItem, setCartItem] = useState<{ type: "tier"; item: TierConfig } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ title: string; description: string } | null>(null);

  const currentTier = user?.tierSlug || "free";
  const currentTierConfig = TIERS.find(t => t.slug === currentTier) || TIERS[0];

  useEffect(() => {
    if (historyExpanded && !historyData && sessionToken) {
      fetchCreditHistory();
    }
  }, [historyExpanded, sessionToken]);

  const fetchCreditHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(
        new URL("/api/credits/history?limit=20", getApiUrl()).toString(),
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      }
    } catch (error) {
      console.error("Failed to fetch credit history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleSelectTier = (tier: TierConfig) => {
    if (tier.slug === currentTier) return;
    if (tier.slug === "free") return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Show cart confirmation modal
    setCartItem({ type: "tier", item: tier });
    setCheckoutError(null);
    setShowCartModal(true);
  };

  const handleConfirmCheckout = async () => {
    if (!cartItem) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setCheckoutError(null);

    const tier = cartItem.item;
    setLoadingTier(tier.slug);
    try {
      const response = await fetch(
        new URL(`/api/billing/get-checkout-url?tier=${tier.slug}`, getApiUrl()).toString(),
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get checkout URL");
      }

      const data = await response.json();
      const { checkout_url, mock } = data;

      // For mock checkout (local dev), process inline
      if (mock && checkout_url) {
        const mockResponse = await fetch(checkout_url, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!mockResponse.ok) {
          const errorData = await mockResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Mock checkout failed");
        }

        const mockResult = await mockResponse.json();

        // Update local user state
        if (mockResult.success) {
          await updateUser({
            tierSlug: tier.slug,
            credits: mockResult.credits,
          });

          setShowCartModal(false);
          setCartItem(null);
          setSuccessMessage({
            title: "Subscription Upgraded!",
            description: `You're now on the ${tier.name} plan.`,
          });
          setShowSuccessModal(true);
        }
      } else {
        // Production: open external checkout
        setShowCartModal(false);
        setCartItem(null);

        if (Platform.OS === "web") {
          window.open(checkout_url, "_blank");
        } else {
          await WebBrowser.openBrowserAsync(checkout_url);
        }
      }
    } catch (error) {
      console.error("Failed to start checkout:", error);
      setCheckoutError(error instanceof Error ? error.message : "Checkout service unavailable. Please try again later.");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleCancelCheckout = () => {
    setShowCartModal(false);
    setCartItem(null);
    setCheckoutError(null);
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundDefault }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>Choose Your Plan</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Unlock AI features with credits that renew each billing period
        </ThemedText>
      </View>

      <View style={[styles.creditsCard, { backgroundColor: theme.surface }]}>
        <View style={styles.creditsInfo}>
          <Feather name="zap" size={24} color={Colors.light.primary} />
          <View style={styles.creditsText}>
            <ThemedText style={styles.creditsLabel}>Current Plan</ThemedText>
            <ThemedText style={styles.creditsValue}>{currentTierConfig.name}</ThemedText>
          </View>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: Colors.light.primary + "20" }]}>
          <ThemedText style={[styles.tierBadgeText, { color: Colors.light.primary }]}>
            {currentTierConfig.price === 0 ? "Free" : `$${currentTierConfig.price}/${currentTierConfig.billingPeriod}`}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.creditBreakdown, { backgroundColor: theme.surface }]}>
        <ThemedText style={[styles.allocationTitle, { color: theme.textSecondary }]}>
          Your Allocation (per {currentTierConfig.billingPeriod})
        </ThemedText>
        <View style={styles.allocationGrid}>
          <View style={styles.allocationItem}>
            <Feather name="globe" size={18} color={Colors.light.primary} />
            <ThemedText style={styles.allocationValue}>{currentTierConfig.allocation.translationCredits}</ThemedText>
            <ThemedText style={[styles.allocationLabel, { color: theme.textSecondary }]}>Translations</ThemedText>
          </View>
          <View style={styles.allocationItem}>
            <Feather name="book-open" size={18} color={Colors.light.primary} />
            <ThemedText style={styles.allocationValue}>{currentTierConfig.allocation.foodAnalysis}</ThemedText>
            <ThemedText style={[styles.allocationLabel, { color: theme.textSecondary }]}>Food</ThemedText>
          </View>
          <View style={styles.allocationItem}>
            <Feather name="image" size={18} color={Colors.light.primary} />
            <ThemedText style={styles.allocationValue}>{currentTierConfig.allocation.imageGenerations}</ThemedText>
            <ThemedText style={[styles.allocationLabel, { color: theme.textSecondary }]}>Images</ThemedText>
          </View>
          <View style={styles.allocationItem}>
            <Feather name="mic" size={18} color={Colors.light.primary} />
            <ThemedText style={styles.allocationValue}>{currentTierConfig.allocation.audioMinutes}</ThemedText>
            <ThemedText style={[styles.allocationLabel, { color: theme.textSecondary }]}>Companion</ThemedText>
          </View>
          <View style={styles.allocationItem}>
            <Feather name="video" size={18} color={Colors.light.primary} />
            <ThemedText style={styles.allocationValue}>{currentTierConfig.allocation.videoWorkflows}</ThemedText>
            <ThemedText style={[styles.allocationLabel, { color: theme.textSecondary }]}>Videos</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.tiersContainer}>
        {TIERS.map((tier) => {
          const isCurrentTier = tier.slug === currentTier;
          const isLoading = loadingTier === tier.slug;
          
          return (
            <Pressable
              key={tier.slug}
              style={({ pressed }) => [
                styles.tierCard,
                { 
                  backgroundColor: theme.surface,
                  borderColor: isCurrentTier ? Colors.light.primary : (tier.popular ? Colors.light.primary + "50" : theme.border),
                  borderWidth: isCurrentTier || tier.popular ? 2 : 1,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={() => handleSelectTier(tier)}
              disabled={isCurrentTier || isLoading}
            >
              {tier.popular && !isCurrentTier ? (
                <View style={[styles.popularBadge, { backgroundColor: Colors.light.primary }]}>
                  <ThemedText style={styles.popularText}>Most Popular</ThemedText>
                </View>
              ) : null}
              
              {isCurrentTier ? (
                <View style={[styles.currentBadge, { backgroundColor: Colors.light.success }]}>
                  <ThemedText style={styles.currentText}>Current Plan</ThemedText>
                </View>
              ) : null}

              <View style={styles.tierHeader}>
                <ThemedText style={styles.tierName}>{tier.name}</ThemedText>
                <View style={styles.priceRow}>
                  <ThemedText style={styles.price}>
                    {tier.price === 0 ? "Free" : `$${tier.price}`}
                  </ThemedText>
                  {tier.price > 0 ? (
                    <ThemedText style={[styles.priceUnit, { color: theme.textSecondary }]}>/{tier.billingPeriod}</ThemedText>
                  ) : null}
                </View>
              </View>

              <View style={styles.allocationPreview}>
                <View style={styles.allocationPreviewItem}>
                  <Feather name="globe" size={14} color={Colors.light.primary} />
                  <ThemedText style={[styles.allocationPreviewText, { color: theme.text }]}>
                    {tier.allocation.translationCredits} translations
                  </ThemedText>
                </View>
                <View style={styles.allocationPreviewItem}>
                  <Feather name="book-open" size={14} color={Colors.light.primary} />
                  <ThemedText style={[styles.allocationPreviewText, { color: theme.text }]}>
                    {tier.allocation.foodAnalysis} food
                  </ThemedText>
                </View>
                <View style={styles.allocationPreviewItem}>
                  <Feather name="image" size={14} color={Colors.light.primary} />
                  <ThemedText style={[styles.allocationPreviewText, { color: theme.text }]}>
                    {tier.allocation.imageGenerations} images
                  </ThemedText>
                </View>
                <View style={styles.allocationPreviewItem}>
                  <Feather name="mic" size={14} color={Colors.light.primary} />
                  <ThemedText style={[styles.allocationPreviewText, { color: theme.text }]}>
                    {tier.allocation.audioMinutes} min companion
                  </ThemedText>
                </View>
                <View style={styles.allocationPreviewItem}>
                  <Feather name="video" size={14} color={Colors.light.primary} />
                  <ThemedText style={[styles.allocationPreviewText, { color: theme.text }]}>
                    {tier.allocation.videoWorkflows} videos
                  </ThemedText>
                </View>
              </View>

              <View style={styles.features}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color={Colors.light.success} />
                    <ThemedText style={[styles.featureText, { color: theme.textSecondary }]}>
                      {feature}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {!isCurrentTier && tier.price > 0 ? (
                <View style={[styles.selectButton, { backgroundColor: tier.popular ? Colors.light.primary : theme.backgroundSecondary }]}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={tier.popular ? "#fff" : theme.text} />
                  ) : (
                    <ThemedText style={[styles.selectText, { color: tier.popular ? "#fff" : theme.text }]}>
                      Upgrade
                    </ThemedText>
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.creditCosts}>
        <ThemedText style={[styles.creditCostsTitle, { color: theme.textSecondary }]}>
          What Counts As Usage
        </ThemedText>
        <View style={[styles.costRow, { backgroundColor: theme.surface }]}>
          <View style={styles.costRowLeft}>
            <Feather name="globe" size={16} color={Colors.light.primary} />
            <ThemedText style={{ color: theme.text }}>Translation</ThemedText>
          </View>
          <ThemedText style={{ color: theme.textSecondary }}>1 translation credit</ThemedText>
        </View>
        <View style={[styles.costRow, { backgroundColor: theme.surface }]}>
          <View style={styles.costRowLeft}>
            <Feather name="book-open" size={16} color={Colors.light.primary} />
            <ThemedText style={{ color: theme.text }}>Food Analysis</ThemedText>
          </View>
          <ThemedText style={{ color: theme.textSecondary }}>1 food credit</ThemedText>
        </View>
        <View style={[styles.costRow, { backgroundColor: theme.surface }]}>
          <View style={styles.costRowLeft}>
            <Feather name="image" size={16} color={Colors.light.primary} />
            <ThemedText style={{ color: theme.text }}>Image Generation</ThemedText>
          </View>
          <ThemedText style={{ color: theme.textSecondary }}>1 image credit</ThemedText>
        </View>
        <View style={[styles.costRow, { backgroundColor: theme.surface }]}>
          <View style={styles.costRowLeft}>
            <Feather name="mic" size={16} color={Colors.light.primary} />
            <ThemedText style={{ color: theme.text }}>Companion</ThemedText>
          </View>
          <ThemedText style={{ color: theme.textSecondary }}>per minute</ThemedText>
        </View>
        <View style={[styles.costRow, { backgroundColor: theme.surface }]}>
          <View style={styles.costRowLeft}>
            <Feather name="video" size={16} color={Colors.light.primary} />
            <ThemedText style={{ color: theme.text }}>Video Workflows (Movie Star, TikTok)</ThemedText>
          </View>
          <ThemedText style={{ color: theme.textSecondary }}>1 video credit</ThemedText>
        </View>
      </View>

      <View style={styles.historySection}>
        <Pressable
          style={[styles.historyHeader, { backgroundColor: theme.surface }]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setHistoryExpanded(!historyExpanded);
          }}
        >
          <View style={styles.historyHeaderLeft}>
            <Feather name="clock" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.historyTitle}>Credit History</ThemedText>
          </View>
          <Feather
            name={historyExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>

        {historyExpanded ? (
          <View style={[styles.historyContent, { backgroundColor: theme.surface }]}>
            {loadingHistory ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <ThemedText style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                  Loading history...
                </ThemedText>
              </View>
            ) : historyData ? (
              <>
                {Object.keys(historyData.featureStats).length > 0 ? (
                  <View style={styles.usageStats}>
                    <ThemedText style={[styles.usageStatsTitle, { color: theme.textSecondary }]}>
                      Usage by Feature
                    </ThemedText>
                    <View style={styles.statsGrid}>
                      {Object.entries(historyData.featureStats).map(([feature, count]) => (
                        <View key={feature} style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
                          <Feather
                            name={FEATURE_ICONS[feature] || "zap"}
                            size={18}
                            color={Colors.light.primary}
                          />
                          <ThemedText style={styles.statCount}>{count}</ThemedText>
                          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                            {FEATURE_LABELS[feature] || feature}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.transactionsList}>
                  <ThemedText style={[styles.transactionsTitle, { color: theme.textSecondary }]}>
                    Recent Transactions
                  </ThemedText>
                  {historyData.transactions.length > 0 ? (
                    historyData.transactions.map((tx) => (
                      <View key={tx.id} style={[styles.transactionRow, { borderBottomColor: theme.border }]}>
                        <View style={styles.txLeft}>
                          <View style={[
                            styles.txIcon,
                            { backgroundColor: tx.type === "deduction" ? Colors.light.error + "20" : Colors.light.success + "20" }
                          ]}>
                            <Feather
                              name={tx.type === "deduction" ? "minus" : "plus"}
                              size={14}
                              color={tx.type === "deduction" ? Colors.light.error : Colors.light.success}
                            />
                          </View>
                          <View>
                            <ThemedText style={styles.txDescription}>
                              {tx.description || (tx.feature ? FEATURE_LABELS[tx.feature] : tx.type)}
                            </ThemedText>
                            <ThemedText style={[styles.txDate, { color: theme.textSecondary }]}>
                              {formatDate(tx.createdAt)}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.txRight}>
                          <ThemedText style={[
                            styles.txAmount,
                            { color: tx.type === "deduction" ? Colors.light.error : Colors.light.success }
                          ]}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount}
                          </ThemedText>
                          <ThemedText style={[styles.txBalance, { color: theme.textSecondary }]}>
                            bal: {tx.balanceAfter}
                          </ThemedText>
                        </View>
                      </View>
                    ))
                  ) : (
                    <ThemedText style={[styles.noHistory, { color: theme.textSecondary }]}>
                      No credit transactions yet
                    </ThemedText>
                  )}
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Shopping Cart Confirmation Modal */}
      <Modal
        visible={showCartModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCheckout}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelCheckout}>
          <View style={[styles.cartModal, { backgroundColor: theme.surface }]}>
            <View style={styles.cartHeader}>
              <Feather name="shopping-cart" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.cartTitle}>Confirm Your Purchase</ThemedText>
            </View>

            {cartItem ? (
              <View style={styles.cartContent}>
                <View style={[styles.cartItemCard, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={styles.cartItemHeader}>
                    <Feather name="star" size={20} color={Colors.light.primary} />
                    <ThemedText style={styles.cartItemName}>
                      {cartItem.item.name} Plan
                    </ThemedText>
                  </View>
                  <View style={styles.cartItemDetails}>
                    <View style={styles.cartItemRow}>
                      <ThemedText style={[styles.cartItemLabel, { color: theme.textSecondary }]}>
                        Allocation
                      </ThemedText>
                      <ThemedText style={styles.cartItemValue}>
                        {cartItem.item.allocation.translationCredits} translations, {cartItem.item.allocation.foodAnalysis} food, {cartItem.item.allocation.imageGenerations} images, {cartItem.item.allocation.audioMinutes} min companion, {cartItem.item.allocation.videoWorkflows} videos
                      </ThemedText>
                    </View>
                    <View style={styles.cartItemRow}>
                      <ThemedText style={[styles.cartItemLabel, { color: theme.textSecondary }]}>
                        Billing
                      </ThemedText>
                      <ThemedText style={styles.cartItemValue}>
                        {cartItem.item.billingPeriod === "week" ? "Weekly" : cartItem.item.billingPeriod === "month" ? "Monthly" : "Yearly"} subscription
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={[styles.cartTotal, { borderTopColor: theme.border }]}>
                  <ThemedText style={styles.cartTotalLabel}>Total</ThemedText>
                  <ThemedText style={styles.cartTotalValue}>
                    ${cartItem.item.price.toFixed(2)}/{cartItem.item.billingPeriod}
                  </ThemedText>
                </View>

                {checkoutError ? (
                  <View style={[styles.checkoutError, { backgroundColor: Colors.light.error + "15" }]}>
                    <Feather name="alert-circle" size={18} color={Colors.light.error} />
                    <ThemedText style={[styles.checkoutErrorText, { color: Colors.light.error }]}>
                      {checkoutError}
                    </ThemedText>
                  </View>
                ) : null}

                <View style={styles.cartActions}>
                  <Pressable
                    style={[styles.cartCancelButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={handleCancelCheckout}
                  >
                    <ThemedText style={[styles.cartCancelText, { color: theme.text }]}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.cartConfirmButton, { backgroundColor: Colors.light.primary }]}
                    onPress={handleConfirmCheckout}
                    disabled={loadingTier !== null}
                  >
                    {loadingTier ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Feather name="credit-card" size={18} color="#fff" />
                        <ThemedText style={styles.cartConfirmText}>Proceed to Checkout</ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>

                <ThemedText style={[styles.checkoutNote, { color: theme.textSecondary }]}>
                  You will be redirected to our secure payment provider to complete your purchase.
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Modal>

      {/* Success Confirmation Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSuccessModal(false)}>
          <View style={[styles.successModal, { backgroundColor: theme.surface }]}>
            <View style={[styles.successIconContainer, { backgroundColor: Colors.light.success + "20" }]}>
              <Feather name="check-circle" size={48} color={Colors.light.success} />
            </View>
            <ThemedText style={styles.successTitle}>
              {successMessage?.title || "Success!"}
            </ThemedText>
            <ThemedText style={[styles.successDescription, { color: theme.textSecondary }]}>
              {successMessage?.description || "Your purchase was successful."}
            </ThemedText>
            <Pressable
              style={[styles.successButton, { backgroundColor: Colors.light.primary }]}
              onPress={() => {
                setShowSuccessModal(false);
                setSuccessMessage(null);
              }}
            >
              <ThemedText style={styles.successButtonText}>Done</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  creditsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  creditsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  creditsText: {
    gap: 2,
  },
  creditsLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  creditsValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  tierBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tierBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tiersContainer: {
    gap: Spacing.md,
  },
  tierCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    position: "relative",
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
  },
  popularText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  currentBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
  },
  currentText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  tierHeader: {
    marginBottom: Spacing.md,
  },
  tierName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
  },
  priceUnit: {
    fontSize: 14,
  },
  creditsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  creditsAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  features: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
  },
  selectButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  selectText: {
    fontSize: 16,
    fontWeight: "600",
  },
  creditCosts: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  creditCostsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  historySection: {
    marginTop: Spacing.xl,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  historyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyContent: {
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  historyLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  usageStats: {
    marginBottom: Spacing.lg,
  },
  usageStatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
  statCount: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionsList: {
    gap: Spacing.sm,
  },
  transactionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  txIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  txDescription: {
    fontSize: 14,
    fontWeight: "500",
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  txBalance: {
    fontSize: 11,
    marginTop: 2,
  },
  noHistory: {
    textAlign: "center",
    paddingVertical: Spacing.xl,
    fontSize: 14,
  },
  creditBreakdown: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  creditBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  creditBreakdownItem: {
    flex: 1,
    alignItems: "center",
  },
  creditBreakdownLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  creditBreakdownValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  creditBreakdownNote: {
    fontSize: 10,
    marginTop: 2,
  },
  creditBreakdownDivider: {
    width: 1,
    height: 50,
    marginHorizontal: Spacing.lg,
  },
  allocationTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  allocationGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  allocationItem: {
    alignItems: "center",
    gap: 4,
  },
  allocationValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  allocationLabel: {
    fontSize: 11,
  },
  allocationPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  allocationPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  allocationPreviewText: {
    fontSize: 13,
  },
  costRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  cartModal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  cartContent: {
    gap: Spacing.lg,
  },
  cartItemCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  cartItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cartItemName: {
    fontSize: 18,
    fontWeight: "600",
  },
  cartItemDetails: {
    gap: Spacing.sm,
  },
  cartItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartItemLabel: {
    fontSize: 14,
  },
  cartItemValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  cartTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  cartTotalValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  checkoutError: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkoutErrorText: {
    flex: 1,
    fontSize: 14,
  },
  cartActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cartCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  cartCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cartConfirmButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  cartConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  checkoutNote: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  successModal: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  successDescription: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  successButton: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
