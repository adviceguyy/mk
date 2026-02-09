import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, ImageBackground, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

type VisibilityOption = "public" | "followers" | "private";

interface VisibilityConfig {
  value: VisibilityOption;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const VISIBILITY_OPTIONS: VisibilityConfig[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can see your posts",
    icon: "globe",
  },
  {
    value: "followers",
    label: "Friends",
    description: "Only people who follow you can see your posts",
    icon: "users",
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can see your posts",
    icon: "lock",
  },
];

type PrivacyScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Privacy">;

export default function PrivacySettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<PrivacyScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityOption>("public");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      const response = await fetch(new URL("/api/users/me/privacy", getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load privacy settings");
      }

      const data = await response.json();
      setSelectedVisibility(data.defaultPostVisibility);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVisibility = async (visibility: VisibilityOption) => {
    if (visibility === selectedVisibility || isSaving) return;

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      const response = await fetch(new URL("/api/users/me/privacy", getApiUrl()).toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultPostVisibility: visibility }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update privacy settings");
      }

      setSelectedVisibility(visibility);

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setSuccessMessage("Privacy settings updated");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="eye" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={styles.sectionTitle}>Default Post Visibility</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Choose who can see your new posts by default. You can still change visibility for individual posts.
          </ThemedText>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.optionsList}>
              {VISIBILITY_OPTIONS.map((option) => {
                const isSelected = selectedVisibility === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? Colors.dark.primary : Colors.light.primary) + "15"
                          : theme.backgroundSecondary,
                        borderColor: isSelected
                          ? (isDark ? Colors.dark.primary : Colors.light.primary)
                          : theme.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => handleSelectVisibility(option.value)}
                    disabled={isSaving}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : theme.border,
                        },
                      ]}
                    >
                      <Feather
                        name={option.icon}
                        size={20}
                        color={isSelected ? "#FFFFFF" : theme.textSecondary}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                      <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
                        {option.description}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : theme.border,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary },
                          ]}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Muted & Blocked Users Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={styles.sectionTitle}>Manage Users</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Control which users can see your content and appear in your feeds.
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.navItem,
              { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => navigation.navigate("MutedUsers")}
          >
            <View style={[styles.navIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="volume-x" size={18} color={theme.text} />
            </View>
            <View style={styles.navItemContent}>
              <ThemedText style={styles.navItemTitle}>Muted Users</ThemedText>
              <ThemedText style={[styles.navItemDescription, { color: theme.textSecondary }]}>
                Muted users won't appear in your trending feed
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.navItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => navigation.navigate("BlockedUsers")}
          >
            <View style={[styles.navIconContainer, { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20" }]}>
              <Feather name="slash" size={18} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            </View>
            <View style={styles.navItemContent}>
              <ThemedText style={styles.navItemTitle}>Blocked Users</ThemedText>
              <ThemedText style={[styles.navItemDescription, { color: theme.textSecondary }]}>
                Blocked users can't see your posts and vice versa
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {error && (
          <View style={[styles.messageContainer, { backgroundColor: theme.error + "15" }]}>
            <Feather name="alert-circle" size={16} color={theme.error} />
            <ThemedText style={[styles.messageText, { color: theme.error }]}>{error}</ThemedText>
          </View>
        )}

        {successMessage && (
          <View style={[styles.messageContainer, { backgroundColor: "#22C55E15" }]}>
            <Feather name="check-circle" size={16} color="#22C55E" />
            <ThemedText style={[styles.messageText, { color: "#22C55E" }]}>{successMessage}</ThemedText>
          </View>
        )}

        {isSaving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="small" color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={[styles.savingText, { color: theme.textSecondary }]}>Saving...</ThemedText>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  optionsList: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  messageText: {
    fontSize: 14,
    flex: 1,
  },
  savingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  savingText: {
    fontSize: 14,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemContent: {
    flex: 1,
  },
  navItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  navItemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
});
