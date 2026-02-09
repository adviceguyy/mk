import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ImageBackground,
  TextInput,
  Switch,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface BillingProviderInfo {
  provider: "stripe" | "revenuecat";
  displayName: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string;
  publicKey: string | null;
  hasWebhookSecret: boolean;
  config: Record<string, any> | null;
  sourceType: string;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
}

const fetchBillingProviders = async (): Promise<BillingProviderInfo[]> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/billing-providers", getApiUrl()).toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch billing providers");
  }
  return response.json();
};

const updateBillingProvider = async (
  provider: string,
  data: Record<string, any>
): Promise<BillingProviderInfo> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(
    new URL(`/api/admin/billing-providers/${provider}`, getApiUrl()).toString(),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to update billing provider");
  }
  return response.json();
};

const testBillingProvider = async (provider: string): Promise<{ success: boolean; message: string }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(
    new URL(`/api/admin/billing-providers/${provider}/test`, getApiUrl()).toString(),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to test connection");
  }
  return response.json();
};

export default function BillingSettingsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  // State for editing each provider
  const [stripeEdits, setStripeEdits] = useState<{
    apiKey: string;
    publicKey: string;
    webhookSecret: string;
    currency: string;
  }>({
    apiKey: "",
    publicKey: "",
    webhookSecret: "",
    currency: "usd",
  });

  const [revenuecatEdits, setRevenuecatEdits] = useState<{
    apiKey: string;
    publicKey: string;
    webhookSecret: string;
    appAppleId: string;
    appGoogleId: string;
    projectId: string;
    entitlementId: string;
  }>({
    apiKey: "",
    publicKey: "",
    webhookSecret: "",
    appAppleId: "",
    appGoogleId: "",
    projectId: "",
    entitlementId: "",
  });

  const [expandedProvider, setExpandedProvider] = useState<"stripe" | "revenuecat" | null>(null);

  const { data: providers, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/billing-providers"],
    queryFn: fetchBillingProviders,
  });

  const updateMutation = useMutation({
    mutationFn: ({ provider, data }: { provider: string; data: Record<string, any> }) =>
      updateBillingProvider(provider, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing-providers"] });
      showAlert("Success", "Billing provider updated successfully");
    },
    onError: (error: any) => {
      showAlert("Error", error.message || "Failed to update billing provider");
    },
  });

  const testMutation = useMutation({
    mutationFn: testBillingProvider,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing-providers"] });
      showAlert(data.success ? "Success" : "Failed", data.message);
    },
    onError: (error: any) => {
      showAlert("Error", error.message || "Connection test failed");
    },
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSaveStripe = () => {
    const data: Record<string, any> = {};
    if (stripeEdits.apiKey) data.apiKey = stripeEdits.apiKey;
    if (stripeEdits.publicKey) data.publicKey = stripeEdits.publicKey;
    if (stripeEdits.webhookSecret) data.webhookSecret = stripeEdits.webhookSecret;
    if (stripeEdits.currency) {
      data.config = { currency: stripeEdits.currency };
    }
    if (Object.keys(data).length > 0) {
      updateMutation.mutate({ provider: "stripe", data });
    } else {
      showAlert("Info", "No changes to save");
    }
  };

  const handleSaveRevenuecat = () => {
    const data: Record<string, any> = {};
    if (revenuecatEdits.apiKey) data.apiKey = revenuecatEdits.apiKey;
    if (revenuecatEdits.publicKey) data.publicKey = revenuecatEdits.publicKey;
    if (revenuecatEdits.webhookSecret) data.webhookSecret = revenuecatEdits.webhookSecret;

    const config: Record<string, any> = {};
    if (revenuecatEdits.appAppleId) config.appAppleId = revenuecatEdits.appAppleId;
    if (revenuecatEdits.appGoogleId) config.appGoogleId = revenuecatEdits.appGoogleId;
    if (revenuecatEdits.projectId) config.projectId = revenuecatEdits.projectId;
    if (revenuecatEdits.entitlementId) config.entitlementId = revenuecatEdits.entitlementId;

    if (Object.keys(config).length > 0) {
      data.config = config;
    }

    if (Object.keys(data).length > 0) {
      updateMutation.mutate({ provider: "revenuecat", data });
    } else {
      showAlert("Info", "No changes to save");
    }
  };

  const handleToggleEnabled = (provider: "stripe" | "revenuecat", currentEnabled: boolean) => {
    updateMutation.mutate({
      provider,
      data: { isEnabled: !currentEnabled },
    });
  };

  const stripeProvider = providers?.find((p) => p.provider === "stripe");
  const revenuecatProvider = providers?.find((p) => p.provider === "revenuecat");

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={{ color: Colors.light.primary }}>Failed to load billing settings</ThemedText>
        <Pressable
          style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md }]}
          onPress={() => refetch()}
        >
          <ThemedText style={styles.buttonText}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Billing Architecture</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Configure payment providers for different platforms
          </ThemedText>

          <View style={styles.platformRow}>
            <View style={[styles.platformCard, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="globe" size={20} color={theme.primary} />
              <ThemedText style={styles.platformLabel}>Web</ThemedText>
              <ThemedText style={[styles.platformProvider, { color: theme.textSecondary }]}>
                Stripe
              </ThemedText>
            </View>
            <View style={[styles.platformCard, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="smartphone" size={20} color={theme.primary} />
              <ThemedText style={styles.platformLabel}>iOS</ThemedText>
              <ThemedText style={[styles.platformProvider, { color: theme.textSecondary }]}>
                RevenueCat
              </ThemedText>
            </View>
            <View style={[styles.platformCard, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="smartphone" size={20} color={theme.primary} />
              <ThemedText style={styles.platformLabel}>Android</ThemedText>
              <ThemedText style={[styles.platformProvider, { color: theme.textSecondary }]}>
                RevenueCat
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Stripe Configuration */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Pressable
            style={styles.providerHeader}
            onPress={() => setExpandedProvider(expandedProvider === "stripe" ? null : "stripe")}
          >
            <View style={styles.providerTitleRow}>
              <View style={[styles.providerIcon, { backgroundColor: "#635BFF20" }]}>
                <ThemedText style={{ fontSize: 16, fontWeight: "700", color: "#635BFF" }}>S</ThemedText>
              </View>
              <View style={styles.providerInfo}>
                <ThemedText style={styles.providerTitle}>Stripe</ThemedText>
                <ThemedText style={[styles.providerSubtitle, { color: theme.textSecondary }]}>
                  Web payments
                </ThemedText>
              </View>
            </View>
            <View style={styles.providerStatus}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: stripeProvider?.isEnabled ? "#22C55E" : "#EF4444" },
                ]}
              >
                <ThemedText style={styles.statusText}>
                  {stripeProvider?.isEnabled ? "Enabled" : "Disabled"}
                </ThemedText>
              </View>
              <Feather
                name={expandedProvider === "stripe" ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </View>
          </Pressable>

          {expandedProvider === "stripe" && (
            <View style={styles.providerDetails}>
              <View style={styles.toggleRow}>
                <ThemedText style={styles.label}>Enabled</ThemedText>
                <Switch
                  value={stripeProvider?.isEnabled ?? false}
                  onValueChange={() => handleToggleEnabled("stripe", stripeProvider?.isEnabled ?? false)}
                />
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Current API Key:</ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>
                  {stripeProvider?.apiKeyMasked || "(not set)"}
                </ThemedText>
              </View>

              {stripeProvider?.sourceType === "three_tears" && (
                <View style={[styles.syncBadge, { backgroundColor: "#3B82F620" }]}>
                  <Feather name="cloud" size={14} color="#3B82F6" />
                  <ThemedText style={[styles.syncText, { color: "#3B82F6" }]}>
                    Synced from Three Tears
                  </ThemedText>
                </View>
              )}

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Secret Key</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={stripeEdits.apiKey}
                onChangeText={(text) => setStripeEdits((prev) => ({ ...prev, apiKey: text }))}
                placeholder="sk_live_..."
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Publishable Key</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={stripeEdits.publicKey}
                onChangeText={(text) => setStripeEdits((prev) => ({ ...prev, publicKey: text }))}
                placeholder={stripeProvider?.publicKey || "pk_live_..."}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Webhook Secret</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={stripeEdits.webhookSecret}
                onChangeText={(text) => setStripeEdits((prev) => ({ ...prev, webhookSecret: text }))}
                placeholder="whsec_..."
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Currency</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={stripeEdits.currency}
                onChangeText={(text) => setStripeEdits((prev) => ({ ...prev, currency: text.toLowerCase() }))}
                placeholder="usd"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: theme.primary, opacity: pressed || updateMutation.isPending ? 0.7 : 1, flex: 1 },
                  ]}
                  onPress={handleSaveStripe}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="save" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.buttonText}>Save</ThemedText>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: "#22C55E", opacity: pressed || testMutation.isPending ? 0.7 : 1 },
                  ]}
                  onPress={() => testMutation.mutate("stripe")}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="zap" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.buttonText}>Test</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>

              {stripeProvider?.lastTestedAt && (
                <ThemedText style={[styles.testStatus, { color: theme.textSecondary }]}>
                  Last test: {stripeProvider.lastTestStatus} ({new Date(stripeProvider.lastTestedAt).toLocaleString()})
                </ThemedText>
              )}
            </View>
          )}
        </View>

        {/* RevenueCat Configuration */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Pressable
            style={styles.providerHeader}
            onPress={() => setExpandedProvider(expandedProvider === "revenuecat" ? null : "revenuecat")}
          >
            <View style={styles.providerTitleRow}>
              <View style={[styles.providerIcon, { backgroundColor: "#F2545B20" }]}>
                <ThemedText style={{ fontSize: 16, fontWeight: "700", color: "#F2545B" }}>R</ThemedText>
              </View>
              <View style={styles.providerInfo}>
                <ThemedText style={styles.providerTitle}>RevenueCat</ThemedText>
                <ThemedText style={[styles.providerSubtitle, { color: theme.textSecondary }]}>
                  iOS & Android in-app purchases
                </ThemedText>
              </View>
            </View>
            <View style={styles.providerStatus}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: revenuecatProvider?.isEnabled ? "#22C55E" : "#EF4444" },
                ]}
              >
                <ThemedText style={styles.statusText}>
                  {revenuecatProvider?.isEnabled ? "Enabled" : "Disabled"}
                </ThemedText>
              </View>
              <Feather
                name={expandedProvider === "revenuecat" ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </View>
          </Pressable>

          {expandedProvider === "revenuecat" && (
            <View style={styles.providerDetails}>
              <View style={styles.toggleRow}>
                <ThemedText style={styles.label}>Enabled</ThemedText>
                <Switch
                  value={revenuecatProvider?.isEnabled ?? false}
                  onValueChange={() => handleToggleEnabled("revenuecat", revenuecatProvider?.isEnabled ?? false)}
                />
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Current API Key:</ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>
                  {revenuecatProvider?.apiKeyMasked || "(not set)"}
                </ThemedText>
              </View>

              {revenuecatProvider?.sourceType === "three_tears" && (
                <View style={[styles.syncBadge, { backgroundColor: "#3B82F620" }]}>
                  <Feather name="cloud" size={14} color="#3B82F6" />
                  <ThemedText style={[styles.syncText, { color: "#3B82F6" }]}>
                    Synced from Three Tears
                  </ThemedText>
                </View>
              )}

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>API Key (Server)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={revenuecatEdits.apiKey}
                onChangeText={(text) => setRevenuecatEdits((prev) => ({ ...prev, apiKey: text }))}
                placeholder="sk_..."
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Public API Key (Client)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={revenuecatEdits.publicKey}
                onChangeText={(text) => setRevenuecatEdits((prev) => ({ ...prev, publicKey: text }))}
                placeholder={revenuecatProvider?.publicKey || "appl_..."}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Webhook Auth Key</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={revenuecatEdits.webhookSecret}
                onChangeText={(text) => setRevenuecatEdits((prev) => ({ ...prev, webhookSecret: text }))}
                placeholder="Enter webhook auth key..."
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                App Configuration
              </ThemedText>

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Project ID</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={revenuecatEdits.projectId}
                onChangeText={(text) => setRevenuecatEdits((prev) => ({ ...prev, projectId: text }))}
                placeholder={(revenuecatProvider?.config as any)?.projectId || "Enter project ID..."}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>iOS App ID</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={revenuecatEdits.appAppleId}
                onChangeText={(text) => setRevenuecatEdits((prev) => ({ ...prev, appAppleId: text }))}
                placeholder={(revenuecatProvider?.config as any)?.appAppleId || "app_..."}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Android App ID</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={revenuecatEdits.appGoogleId}
                onChangeText={(text) => setRevenuecatEdits((prev) => ({ ...prev, appGoogleId: text }))}
                placeholder={(revenuecatProvider?.config as any)?.appGoogleId || "goog_..."}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Entitlement ID</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={revenuecatEdits.entitlementId}
                onChangeText={(text) => setRevenuecatEdits((prev) => ({ ...prev, entitlementId: text }))}
                placeholder={(revenuecatProvider?.config as any)?.entitlementId || "premium"}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: theme.primary, opacity: pressed || updateMutation.isPending ? 0.7 : 1, flex: 1 },
                  ]}
                  onPress={handleSaveRevenuecat}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="save" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.buttonText}>Save</ThemedText>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: "#22C55E", opacity: pressed || testMutation.isPending ? 0.7 : 1 },
                  ]}
                  onPress={() => testMutation.mutate("revenuecat")}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="zap" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.buttonText}>Test</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>

              {revenuecatProvider?.lastTestedAt && (
                <ThemedText style={[styles.testStatus, { color: theme.textSecondary }]}>
                  Last test: {revenuecatProvider.lastTestStatus} ({new Date(revenuecatProvider.lastTestedAt).toLocaleString()})
                </ThemedText>
              )}
            </View>
          )}
        </View>

        {/* Webhook URLs Info */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Webhook Endpoints</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Configure these URLs in your provider dashboards
          </ThemedText>

          <View style={styles.webhookRow}>
            <ThemedText style={styles.webhookLabel}>Stripe Webhook:</ThemedText>
            <ThemedText style={[styles.webhookUrl, { color: theme.primary }]} selectable>
              https://mienkingdom.com/webhooks/stripe
            </ThemedText>
          </View>

          <View style={styles.webhookRow}>
            <ThemedText style={styles.webhookLabel}>RevenueCat Webhook:</ThemedText>
            <ThemedText style={[styles.webhookUrl, { color: theme.primary }]} selectable>
              https://mienkingdom.com/webhooks/revenuecat
            </ThemedText>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  platformRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  platformCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  platformLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  platformProvider: {
    fontSize: 12,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  providerInfo: {
    gap: 2,
  },
  providerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  providerSubtitle: {
    fontSize: 12,
  },
  providerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  providerDetails: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  infoRow: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  syncText: {
    fontSize: 12,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  testStatus: {
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  webhookRow: {
    marginBottom: Spacing.md,
  },
  webhookLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  webhookUrl: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
