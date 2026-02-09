import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Switch,
  Platform,
  ImageBackground,
  FlatList,
  Alert,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface NotificationSettings {
  pushEnabled: boolean;
  newFollowerNotifications: boolean;
  newPostNotifications: boolean;
}

interface FolloweePreference {
  followee: {
    id: string;
    displayName: string;
    avatar: string | null;
  };
  preferences: {
    notifyOnNewPost: boolean;
  };
}

export default function NotificationSettingsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const { permissionStatus, requestPermissions } = usePushNotifications();

  // Fetch global notification settings
  const { data: settings, isLoading: settingsLoading } = useQuery<{ settings: NotificationSettings }>({
    queryKey: ["/api/notification-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notification-settings", undefined, {
        token: sessionToken,
      });
      return response.json();
    },
    enabled: !!sessionToken,
  });

  // Fetch per-follower preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<{ preferences: FolloweePreference[] }>({
    queryKey: ["/api/notification-preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notification-preferences", undefined, {
        token: sessionToken,
      });
      return response.json();
    },
    enabled: !!sessionToken,
  });

  // Update global settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      const response = await apiRequest("PATCH", "/api/notification-settings", updates, {
        token: sessionToken,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
    },
  });

  // Update per-follower preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ followeeId, notifyOnNewPost }: { followeeId: string; notifyOnNewPost: boolean }) => {
      const response = await apiRequest("PATCH", `/api/notification-preferences/${followeeId}`, { notifyOnNewPost }, {
        token: sessionToken,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
    },
  });

  const handleToggleSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleToggleFolloweeNotification = async (followeeId: string, currentValue: boolean) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updatePreferenceMutation.mutate({ followeeId, notifyOnNewPost: !currentValue });
  };

  const handleRequestPermission = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const token = await requestPermissions();
    if (!token) {
      if (Platform.OS === "web") {
        alert("Push notifications are not available on web or permission was denied.");
      } else {
        Alert.alert(
          "Permission Required",
          "To receive push notifications, please enable them in your device settings.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const isLoading = settingsLoading || preferencesLoading;
  const globalSettings = settings?.settings;
  const followeeList = preferences?.preferences || [];

  const renderFolloweeItem = ({ item }: { item: FolloweePreference }) => (
    <View style={[styles.followeeRow, { borderBottomColor: theme.border }]}>
      <View style={styles.followeeInfo}>
        {item.followee.avatar ? (
          <Image
            source={{ uri: item.followee.avatar }}
            style={styles.followeeAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.followeeAvatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="user" size={16} color={theme.textSecondary} />
          </View>
        )}
        <ThemedText style={styles.followeeName} numberOfLines={1}>
          {item.followee.displayName}
        </ThemedText>
      </View>
      <Switch
        value={item.preferences.notifyOnNewPost}
        onValueChange={() => handleToggleFolloweeNotification(item.followee.id, item.preferences.notifyOnNewPost)}
        trackColor={{
          false: theme.backgroundSecondary,
          true: isDark ? Colors.dark.primary : Colors.light.primary,
        }}
        thumbColor="#FFFFFF"
        disabled={updatePreferenceMutation.isPending}
      />
    </View>
  );

  return (
    <ImageBackground source={mienPatternBg} style={styles.background} resizeMode="repeat">
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: theme.background + "E6" }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + insets.bottom + Spacing.xl,
          },
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
          </View>
        ) : (
          <>
            {/* Permission Status */}
            {permissionStatus !== "granted" && (
              <View style={[styles.permissionBanner, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="alert-circle" size={20} color={theme.warning} />
                <View style={styles.permissionBannerContent}>
                  <ThemedText style={styles.permissionBannerText}>
                    Push notifications are not enabled
                  </ThemedText>
                  <Pressable
                    onPress={handleRequestPermission}
                    style={({ pressed }) => [
                      styles.permissionButton,
                      { backgroundColor: theme.warning, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <ThemedText style={styles.permissionButtonText}>Enable</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Master Toggle */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Push Notifications</ThemedText>
              <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Feather name="bell" size={20} color={theme.text} />
                    <ThemedText style={styles.settingLabel}>Enable Push Notifications</ThemedText>
                  </View>
                  <Switch
                    value={globalSettings?.pushEnabled ?? true}
                    onValueChange={(value) => handleToggleSetting("pushEnabled", value)}
                    trackColor={{
                      false: theme.backgroundSecondary,
                      true: isDark ? Colors.dark.primary : Colors.light.primary,
                    }}
                    thumbColor="#FFFFFF"
                    disabled={updateSettingsMutation.isPending}
                  />
                </View>
              </View>
            </View>

            {/* Notification Types */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Notify Me When...</ThemedText>
              <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                  <View style={styles.settingInfo}>
                    <Feather name="user-plus" size={20} color={theme.text} />
                    <ThemedText style={styles.settingLabel}>Someone follows me</ThemedText>
                  </View>
                  <Switch
                    value={globalSettings?.newFollowerNotifications ?? true}
                    onValueChange={(value) => handleToggleSetting("newFollowerNotifications", value)}
                    trackColor={{
                      false: theme.backgroundSecondary,
                      true: isDark ? Colors.dark.primary : Colors.light.primary,
                    }}
                    thumbColor="#FFFFFF"
                    disabled={updateSettingsMutation.isPending || !globalSettings?.pushEnabled}
                  />
                </View>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Feather name="file-plus" size={20} color={theme.text} />
                    <ThemedText style={styles.settingLabel}>Followed users post</ThemedText>
                  </View>
                  <Switch
                    value={globalSettings?.newPostNotifications ?? true}
                    onValueChange={(value) => handleToggleSetting("newPostNotifications", value)}
                    trackColor={{
                      false: theme.backgroundSecondary,
                      true: isDark ? Colors.dark.primary : Colors.light.primary,
                    }}
                    thumbColor="#FFFFFF"
                    disabled={updateSettingsMutation.isPending || !globalSettings?.pushEnabled}
                  />
                </View>
              </View>
            </View>

            {/* Per-Follower Preferences */}
            {followeeList.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Per-User Notifications</ThemedText>
                <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Toggle notifications for individual users you follow
                </ThemedText>
                <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                  <FlatList
                    data={followeeList}
                    keyExtractor={(item) => item.followee.id}
                    renderItem={renderFolloweeItem}
                    scrollEnabled={false}
                  />
                </View>
              </View>
            )}

            {followeeList.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Feather name="users" size={48} color={theme.textSecondary} />
                <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  You're not following anyone yet.
                </ThemedText>
                <ThemedText style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                  Follow users to customize notifications for their posts.
                </ThemedText>
              </View>
            )}
          </>
        )}
      </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  permissionBannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  permissionBannerText: {
    flex: 1,
    fontSize: 14,
  },
  permissionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  settingsCard: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
  },
  followeeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  followeeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  followeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  followeeAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  followeeName: {
    fontSize: 15,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
