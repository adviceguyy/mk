import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert, Platform, ImageBackground } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/lib/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { AdminStackParamList } from "@/navigation/AdminStackNavigator";

const mienPatternBg = require("@/assets/mien-pattern.png");

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;

interface AdminMetrics {
  totalUsers: number;
  activeSessions: number;
  groupsCount: number;
  postsCount: number;
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

const seedDemoUsers = async (): Promise<{ users: any[]; message: string }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/seed-demo-users", getApiUrl()).toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to seed demo users");
  }
  return response.json();
};

export default function AdminDashboardScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["/api/admin/metrics"],
    queryFn: fetchAdminMetrics,
  });

  const seedMutation = useMutation({
    mutationFn: seedDemoUsers,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      if (Platform.OS === "web") {
        window.alert(data.message);
      } else {
        Alert.alert("Success", data.message);
      }
    },
    onError: () => {
      if (Platform.OS === "web") {
        window.alert("Failed to seed demo users");
      } else {
        Alert.alert("Error", "Failed to seed demo users");
      }
    },
  });

  const userRole = user?.role?.toLowerCase() || "";
  const isAdmin = userRole === "admin" || userRole === "super_admin" || userRole.includes("admin");
  const roleDisplay = isAdmin ? "Admin" : "Moderator";

  const navCards = [
    {
      title: "Users",
      description: "Manage user accounts and roles",
      icon: "users" as const,
      route: "AdminUsers" as const,
      visible: true,
    },
    {
      title: "Reports",
      description: "View analytics and metrics",
      icon: "bar-chart-2" as const,
      route: "AdminReports" as const,
      visible: true,
    },
    {
      title: "Usage Analytics",
      description: "Track AI features, avatar sessions & credits",
      icon: "pie-chart" as const,
      route: "AdminUsageReports" as const,
      visible: true,
    },
    {
      title: "Groups",
      description: "Manage user groups",
      icon: "folder" as const,
      route: "AdminGroups" as const,
      visible: isAdmin,
    },
    {
      title: "Integration",
      description: "Configure Three Tears connection",
      icon: "link" as const,
      route: "IntegrationSettings" as const,
      visible: isAdmin,
    },
    {
      title: "Billing",
      description: "Configure Stripe & RevenueCat payments",
      icon: "credit-card" as const,
      route: "BillingSettings" as const,
      visible: isAdmin,
    },
    {
      title: "AI Settings",
      description: "Configure AI services, models, and prompts",
      icon: "cpu" as const,
      route: "PromptsSettings" as const,
      visible: isAdmin,
    },
    {
      title: "Utilities",
      description: "System diagnostics and connection tests",
      icon: "tool" as const,
      route: "AdminUtilities" as const,
      visible: isAdmin,
    },
  ];

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
      <View style={[styles.welcomeCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.roleIcon, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
          <Feather name="shield" size={24} color="#FFFFFF" />
        </View>
        <ThemedText style={styles.welcomeTitle}>Welcome, {user?.displayName}</ThemedText>
        <ThemedText style={[styles.roleText, { color: theme.textSecondary }]}>
          You are logged in as {roleDisplay}
        </ThemedText>
      </View>

      <ThemedText style={styles.sectionTitle}>Quick Stats</ThemedText>
      {isLoading ? (
        <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
      ) : error ? (
        <ThemedText style={[styles.errorText, { color: theme.error }]}>Failed to load metrics</ThemedText>
      ) : (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Feather name="users" size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={styles.statValue}>{metrics?.totalUsers ?? 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Users</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Feather name="activity" size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={styles.statValue}>{metrics?.activeSessions ?? 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active Sessions</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Feather name="edit-3" size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={styles.statValue}>{metrics?.postsCount ?? 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Feather name="folder" size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={styles.statValue}>{metrics?.groupsCount ?? 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Groups</ThemedText>
          </View>
        </View>
      )}

      <ThemedText style={styles.sectionTitle}>Administration</ThemedText>
      {navCards.filter(card => card.visible).map((card) => (
        <Pressable
          key={card.route}
          style={({ pressed }) => [
            styles.navCard,
            { backgroundColor: theme.surface, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => navigation.navigate(card.route)}
        >
          <View style={[styles.navIcon, { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20" }]}>
            <Feather name={card.icon} size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
          </View>
          <View style={styles.navContent}>
            <ThemedText style={styles.navTitle}>{card.title}</ThemedText>
            <ThemedText style={[styles.navDescription, { color: theme.textSecondary }]}>{card.description}</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      ))}

      {isAdmin ? (
        <>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="user-plus" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
                <ThemedText style={styles.actionButtonText}>Seed Demo Users</ThemedText>
              </>
            )}
          </Pressable>
        </>
      ) : null}
    </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  roleText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  navIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  navDescription: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  errorText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
