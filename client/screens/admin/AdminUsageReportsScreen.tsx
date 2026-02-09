import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface UsageSummary {
  totalUsage: number;
  totalCreditsUsed: number;
  uniqueUsers: number;
  successRate: number;
  dateRange: { start: string; end: string };
}

interface FeatureUsage {
  category: string;
  featureName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalCredits: number;
  uniqueUsers: number;
}

interface SubFeatureUsage {
  category: string;
  featureName: string;
  subFeature: string;
  totalCount: number;
  uniqueUsers: number;
}

interface DailyTrend {
  date: string;
  totalCount: number;
  uniqueUsers: number;
}

interface UsageSummaryResponse {
  summary: UsageSummary;
  byFeature: FeatureUsage[];
  bySubFeature: SubFeatureUsage[];
  dailyTrends: DailyTrend[];
}

interface AvatarSessionStats {
  avatarType: string;
  voiceUsed: string | null;
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  uniqueUsers: number;
}

interface AvatarSessionsResponse {
  summary: {
    totalSessions: number;
    uniqueUsers: number;
    totalDurationHours: number;
    avgSessionDuration: number;
    successRate: number;
  };
  byAvatarType: AvatarSessionStats[];
  byPlatform: { platform: string; totalSessions: number; uniqueUsers: number }[];
  dailyTrends: { date: string; totalSessions: number; uniqueUsers: number; avgDurationSeconds: number }[];
}

interface TopUser {
  userId: string;
  displayName: string;
  email: string;
  avatar: string | null;
  totalUsage: number;
  totalCreditsUsed: number;
  featuresUsed: number;
}

type DateRange = "7d" | "30d" | "90d";

const fetchUsageSummary = async (dateRange: DateRange): Promise<UsageSummaryResponse> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const now = new Date();
  const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    new URL(`/api/admin/usage/summary?startDate=${startDate}`, getApiUrl()).toString(),
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch usage summary");
  return response.json();
};

const fetchAvatarSessions = async (dateRange: DateRange): Promise<AvatarSessionsResponse> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const now = new Date();
  const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    new URL(`/api/admin/usage/avatar-sessions?startDate=${startDate}`, getApiUrl()).toString(),
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch avatar sessions");
  return response.json();
};

const fetchTopUsers = async (dateRange: DateRange): Promise<{ topUsers: TopUser[] }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const now = new Date();
  const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    new URL(`/api/admin/usage/top-users?startDate=${startDate}&limit=10`, getApiUrl()).toString(),
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch top users");
  return response.json();
};

const FEATURE_LABELS: Record<string, string> = {
  movie_star: "Movie Star",
  dress_me: "Dress Me",
  restore_photo: "Restore Photo",
  tiktok_dance: "TikTok Dance",
  translate_to_english: "Translate to English",
  translate_to_mien: "Translate to Mien",
  recipe_it: "Recipe It",
  help_chat: "Help Chat",
  transcribe_audio: "Transcribe Audio",
  avatar_session: "Avatar Session",
  create_post: "Create Post",
  like_post: "Like Post",
  comment_post: "Comment",
  follow_user: "Follow",
  send_message: "Message",
  upload_video: "Upload Video",
  upload_image: "Upload Image",
  login: "Login",
  signup: "Signup",
};

// Sub-feature labels for detailed breakdown
const SUB_FEATURE_LABELS: Record<string, string> = {
  // Translation sub-features
  text: "Text Input",
  document: "Document Upload",
  video: "Video Content",
  audio: "Audio Recording",
  // Recipe sub-features
  image: "Photo Analysis",
  hybrid: "Photo + Text",
  // Dress Me sub-features
  mien_wedding_attire: "Mien Wedding Attire",
  // Restore Photo sub-features
  vintage_colorization: "Vintage Colorization",
  // Movie Star sub-features
  cinematic_mien_video: "Cinematic Video (16:9)",
  mien_attire_video: "Mien Attire Video",
  // TikTok Dance sub-features
  vertical_dance_video: "Dance Video (9:16)",
  mien_dance_video: "Mien Dance Video",
  // Avatar sub-features
  ong: "Ong Avatar",
  custom: "Custom Avatar",
};

const CATEGORY_LABELS: Record<string, string> = {
  ai_generation: "AI Generation",
  ai_translation: "AI Translation",
  ai_assistant: "AI Assistant",
  avatar: "Avatar",
  social: "Social",
  messaging: "Messaging",
  media: "Media",
  account: "Account",
};

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  ai_generation: "image",
  ai_translation: "globe",
  ai_assistant: "message-circle",
  avatar: "user",
  social: "heart",
  messaging: "mail",
  media: "film",
  account: "user-check",
};

export default function AdminUsageReportsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  const { data: usageData, isLoading: usageLoading, error: usageError } = useQuery({
    queryKey: ["/api/admin/usage/summary", dateRange],
    queryFn: () => fetchUsageSummary(dateRange),
  });

  const { data: avatarData, isLoading: avatarLoading } = useQuery({
    queryKey: ["/api/admin/usage/avatar-sessions", dateRange],
    queryFn: () => fetchAvatarSessions(dateRange),
  });

  const { data: topUsersData, isLoading: topUsersLoading } = useQuery({
    queryKey: ["/api/admin/usage/top-users", dateRange],
    queryFn: () => fetchTopUsers(dateRange),
  });

  const isLoading = usageLoading || avatarLoading || topUsersLoading;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`;
    if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
    return `${seconds}s`;
  };

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
        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          {(["7d", "30d", "90d"] as DateRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.dateRangeButton,
                { backgroundColor: dateRange === range ? primaryColor : theme.surface },
              ]}
              onPress={() => setDateRange(range)}
            >
              <ThemedText
                style={[
                  styles.dateRangeText,
                  { color: dateRange === range ? "#fff" : theme.text },
                ]}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: Spacing.xl }} />
        ) : usageError ? (
          <View style={[styles.errorCard, { backgroundColor: theme.error + "15" }]}>
            <Feather name="alert-circle" size={24} color={theme.error} />
            <ThemedText style={[styles.errorText, { color: theme.error }]}>
              Failed to load usage data
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Overview Summary */}
            <ThemedText style={styles.sectionTitle}>Usage Overview</ThemedText>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.metricIconContainer, { backgroundColor: primaryColor + "20" }]}>
                  <Feather name="activity" size={24} color={primaryColor} />
                </View>
                <ThemedText style={styles.metricValue}>
                  {formatNumber(usageData?.summary.totalUsage || 0)}
                </ThemedText>
                <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Total Actions
                </ThemedText>
              </View>

              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.metricIconContainer, { backgroundColor: Colors.light.success + "20" }]}>
                  <Feather name="zap" size={24} color={Colors.light.success} />
                </View>
                <ThemedText style={styles.metricValue}>
                  {formatNumber(usageData?.summary.totalCreditsUsed || 0)}
                </ThemedText>
                <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Credits Used
                </ThemedText>
              </View>

              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.metricIconContainer, { backgroundColor: Colors.light.warning + "20" }]}>
                  <Feather name="users" size={24} color={Colors.light.warning} />
                </View>
                <ThemedText style={styles.metricValue}>
                  {formatNumber(usageData?.summary.uniqueUsers || 0)}
                </ThemedText>
                <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Unique Users
                </ThemedText>
              </View>

              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.metricIconContainer, { backgroundColor: Colors.light.info + "20" }]}>
                  <Feather name="check-circle" size={24} color={Colors.light.info} />
                </View>
                <ThemedText style={styles.metricValue}>
                  {usageData?.summary.successRate || 0}%
                </ThemedText>
                <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Success Rate
                </ThemedText>
              </View>
            </View>

            {/* Feature Breakdown */}
            <ThemedText style={styles.sectionTitle}>Feature Usage</ThemedText>
            <View style={[styles.featureList, { backgroundColor: theme.surface }]}>
              {usageData?.byFeature.map((feature, index) => (
                <View key={`${feature.category}-${feature.featureName}`}>
                  {index > 0 && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
                  <View style={styles.featureRow}>
                    <View style={styles.featureInfo}>
                      <View style={[styles.featureIconContainer, { backgroundColor: primaryColor + "20" }]}>
                        <Feather
                          name={CATEGORY_ICONS[feature.category] || "box"}
                          size={16}
                          color={primaryColor}
                        />
                      </View>
                      <View style={styles.featureTextContainer}>
                        <ThemedText style={styles.featureName}>
                          {FEATURE_LABELS[feature.featureName] || feature.featureName}
                        </ThemedText>
                        <ThemedText style={[styles.featureCategory, { color: theme.textSecondary }]}>
                          {CATEGORY_LABELS[feature.category] || feature.category}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.featureStats}>
                      <ThemedText style={styles.featureCount}>{formatNumber(feature.totalCount)}</ThemedText>
                      <ThemedText style={[styles.featureUsers, { color: theme.textSecondary }]}>
                        {feature.uniqueUsers} users
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
              {(!usageData?.byFeature || usageData.byFeature.length === 0) && (
                <View style={styles.emptyState}>
                  <Feather name="inbox" size={32} color={theme.textSecondary} />
                  <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No usage data yet
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Sub-Feature Breakdown */}
            {usageData?.bySubFeature && usageData.bySubFeature.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Input Types & Variants</ThemedText>
                <View style={[styles.featureList, { backgroundColor: theme.surface }]}>
                  {usageData.bySubFeature.slice(0, 15).map((subFeature, index) => (
                    <View key={`${subFeature.featureName}-${subFeature.subFeature}`}>
                      {index > 0 && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
                      <View style={styles.featureRow}>
                        <View style={styles.featureInfo}>
                          <View style={[styles.subFeatureIconContainer, { backgroundColor: primaryColor + "15" }]}>
                            <Feather
                              name={CATEGORY_ICONS[subFeature.category] || "box"}
                              size={14}
                              color={primaryColor}
                            />
                          </View>
                          <View style={styles.featureTextContainer}>
                            <ThemedText style={styles.featureName}>
                              {SUB_FEATURE_LABELS[subFeature.subFeature] || subFeature.subFeature}
                            </ThemedText>
                            <ThemedText style={[styles.featureCategory, { color: theme.textSecondary }]}>
                              {FEATURE_LABELS[subFeature.featureName] || subFeature.featureName}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.featureStats}>
                          <ThemedText style={styles.featureCount}>{formatNumber(subFeature.totalCount)}</ThemedText>
                          <ThemedText style={[styles.featureUsers, { color: theme.textSecondary }]}>
                            {subFeature.uniqueUsers} users
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Avatar Sessions */}
            {avatarData && (
              <>
                <ThemedText style={styles.sectionTitle}>Avatar Sessions (Talk to Ong)</ThemedText>
                <View style={styles.metricsGrid}>
                  <View style={[styles.metricCard, styles.metricCardSmall, { backgroundColor: theme.surface }]}>
                    <ThemedText style={styles.metricValueSmall}>
                      {formatNumber(avatarData.summary.totalSessions)}
                    </ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      Total Sessions
                    </ThemedText>
                  </View>

                  <View style={[styles.metricCard, styles.metricCardSmall, { backgroundColor: theme.surface }]}>
                    <ThemedText style={styles.metricValueSmall}>
                      {formatNumber(avatarData.summary.uniqueUsers)}
                    </ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      Unique Users
                    </ThemedText>
                  </View>

                  <View style={[styles.metricCard, styles.metricCardSmall, { backgroundColor: theme.surface }]}>
                    <ThemedText style={styles.metricValueSmall}>
                      {avatarData.summary.totalDurationHours}h
                    </ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      Total Time
                    </ThemedText>
                  </View>

                  <View style={[styles.metricCard, styles.metricCardSmall, { backgroundColor: theme.surface }]}>
                    <ThemedText style={styles.metricValueSmall}>
                      {formatDuration(avatarData.summary.avgSessionDuration || 0)}
                    </ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      Avg Duration
                    </ThemedText>
                  </View>
                </View>

                {/* Avatar Type Breakdown */}
                {avatarData.byAvatarType.length > 0 && (
                  <View style={[styles.featureList, { backgroundColor: theme.surface, marginTop: Spacing.md }]}>
                    {avatarData.byAvatarType.map((stat, index) => (
                      <View key={`${stat.avatarType}-${stat.voiceUsed}`}>
                        {index > 0 && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
                        <View style={styles.featureRow}>
                          <View style={styles.featureInfo}>
                            <View style={[styles.featureIconContainer, { backgroundColor: primaryColor + "20" }]}>
                              <Feather name="user" size={16} color={primaryColor} />
                            </View>
                            <View style={styles.featureTextContainer}>
                              <ThemedText style={styles.featureName}>
                                {stat.avatarType === "ong" ? "Ong Avatar" : stat.avatarType}
                              </ThemedText>
                              <ThemedText style={[styles.featureCategory, { color: theme.textSecondary }]}>
                                Voice: {stat.voiceUsed || "Default"} | Avg msgs: {stat.avgMessagesPerSession}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.featureStats}>
                            <ThemedText style={styles.featureCount}>{formatNumber(stat.totalSessions)}</ThemedText>
                            <ThemedText style={[styles.featureUsers, { color: theme.textSecondary }]}>
                              {stat.uniqueUsers} users
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Top Users */}
            {topUsersData?.topUsers && topUsersData.topUsers.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>Top Users</ThemedText>
                <View style={[styles.featureList, { backgroundColor: theme.surface }]}>
                  {topUsersData.topUsers.map((user, index) => (
                    <View key={user.userId}>
                      {index > 0 && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
                      <View style={styles.featureRow}>
                        <View style={styles.featureInfo}>
                          <View style={[styles.rankBadge, { backgroundColor: index < 3 ? primaryColor : theme.border }]}>
                            <ThemedText style={[styles.rankText, { color: index < 3 ? "#fff" : theme.text }]}>
                              {index + 1}
                            </ThemedText>
                          </View>
                          <View style={styles.featureTextContainer}>
                            <ThemedText style={styles.featureName}>{user.displayName}</ThemedText>
                            <ThemedText style={[styles.featureCategory, { color: theme.textSecondary }]}>
                              {user.featuresUsed} features | {formatNumber(user.totalCreditsUsed)} credits
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.featureStats}>
                          <ThemedText style={styles.featureCount}>{formatNumber(user.totalUsage)}</ThemedText>
                          <ThemedText style={[styles.featureUsers, { color: theme.textSecondary }]}>
                            actions
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  dateRangeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateRangeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metricCard: {
    width: "48%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  metricCardSmall: {
    padding: Spacing.md,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  metricValueSmall: {
    fontSize: 24,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  featureList: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  featureInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  subFeatureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureName: {
    fontSize: 14,
    fontWeight: "500",
  },
  featureCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  featureStats: {
    alignItems: "flex-end",
  },
  featureCount: {
    fontSize: 16,
    fontWeight: "600",
  },
  featureUsers: {
    fontSize: 12,
  },
  separator: {
    height: 1,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 14,
  },
});
