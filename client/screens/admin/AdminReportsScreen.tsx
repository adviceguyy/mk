import React from "react";
import { View, StyleSheet, ActivityIndicator, ImageBackground } from "react-native";
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

interface AdminMetrics {
  totalUsers: number;
  activeSessions: number;
  groupsCount: number;
  dailyActiveUsers: number;
  adminCount: number;
  moderatorCount: number;
}

const fetchAdminMetrics = async (): Promise<AdminMetrics> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/metrics", getApiUrl()).toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch metrics");
  }
  const data = await response.json();
  return data.metrics;
};

export default function AdminReportsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["/api/admin/metrics"],
    queryFn: fetchAdminMetrics,
  });

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

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
      <ThemedText style={styles.sectionTitle}>Overview</ThemedText>

      {isLoading ? (
        <ActivityIndicator size="large" color={primaryColor} />
      ) : error ? (
        <View style={[styles.errorCard, { backgroundColor: theme.error + "15" }]}>
          <Feather name="alert-circle" size={24} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>Failed to load metrics</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: primaryColor + "20" }]}>
                <Feather name="trending-up" size={24} color={primaryColor} />
              </View>
              <ThemedText style={styles.metricValue}>{metrics?.dailyActiveUsers ?? 0}</ThemedText>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Daily Active Users</ThemedText>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: primaryColor + "20" }]}>
                <Feather name="users" size={24} color={primaryColor} />
              </View>
              <ThemedText style={styles.metricValue}>{metrics?.totalUsers ?? 0}</ThemedText>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Users</ThemedText>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: primaryColor + "20" }]}>
                <Feather name="activity" size={24} color={primaryColor} />
              </View>
              <ThemedText style={styles.metricValue}>{metrics?.activeSessions ?? 0}</ThemedText>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Active Sessions</ThemedText>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: primaryColor + "20" }]}>
                <Feather name="folder" size={24} color={primaryColor} />
              </View>
              <ThemedText style={styles.metricValue}>{metrics?.groupsCount ?? 0}</ThemedText>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>Groups</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.sectionTitle}>Users by Role</ThemedText>
          <View style={[styles.roleBreakdownCard, { backgroundColor: theme.surface }]}>
            <View style={styles.roleRow}>
              <View style={styles.roleInfo}>
                <View style={[styles.roleDot, { backgroundColor: theme.textSecondary }]} />
                <ThemedText style={styles.roleLabel}>Users</ThemedText>
              </View>
              <ThemedText style={styles.roleCount}>{(metrics?.totalUsers ?? 0) - (metrics?.adminCount ?? 0) - (metrics?.moderatorCount ?? 0)}</ThemedText>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.border }]} />

            <View style={styles.roleRow}>
              <View style={styles.roleInfo}>
                <View style={[styles.roleDot, { backgroundColor: primaryColor }]} />
                <ThemedText style={styles.roleLabel}>Moderators</ThemedText>
              </View>
              <ThemedText style={styles.roleCount}>{metrics?.moderatorCount ?? 0}</ThemedText>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.border }]} />

            <View style={styles.roleRow}>
              <View style={styles.roleInfo}>
                <View style={[styles.roleDot, { backgroundColor: Colors.light.error }]} />
                <ThemedText style={styles.roleLabel}>Admins</ThemedText>
              </View>
              <ThemedText style={styles.roleCount}>{metrics?.adminCount ?? 0}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <Feather name="info" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.summaryText, { color: theme.textSecondary }]}>
              {metrics?.totalUsers ?? 0} total users across {metrics?.groupsCount ?? 0} groups with{" "}
              {metrics?.activeSessions ?? 0} active sessions today.
            </ThemedText>
          </View>
        </>
      )}
    </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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
  metricLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  roleBreakdownCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  roleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  roleLabel: {
    fontSize: 16,
  },
  roleCount: {
    fontSize: 18,
    fontWeight: "600",
  },
  separator: {
    height: 1,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
