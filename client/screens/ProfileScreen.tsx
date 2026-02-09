import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/lib/AuthContext";
import { SocialPlatform } from "@/lib/types";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { AnimatedAvatar } from "@/components/AnimatedAvatar";
import { LevelBadge } from "@/components/LevelBadge";
import { XpProgressBar } from "@/components/XpProgressBar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

const platformConfig: Record<string, { name: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  google: { name: "Google", icon: "mail", color: Colors.light.google },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, logout, connectAccount, disconnectAccount } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handleNavigateToMyProfile = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("MyProfile", { userId: user!.id, userName: user!.displayName });
  };

  const handleNavigateToEditProfile = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("EditProfile");
  };

  const handleNavigateToHelp = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Help");
  };

  const handleNavigateToSupport = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Support");
  };

  const handleNavigateToPrivacy = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Privacy");
  };

  const handleNavigateToNotifications = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("NotificationSettings");
  };

  const handleNavigateToSubscription = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Subscription");
  };

  const handleNavigateToAbout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("About");
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      setShowLogoutModal(true);
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logout();
          },
        },
      ]);
    }
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    logout();
  };

  const handleConnectToggle = async (provider: string, connected: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (connected) {
      Alert.alert(`Disconnect ${platformConfig[provider].name}`, "Are you sure you want to disconnect this account?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => disconnectAccount(provider as SocialPlatform),
        },
      ]);
    } else {
      connectAccount(provider as SocialPlatform);
    }
  };

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }}>
    <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
    <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, zIndex: 1 }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={handleNavigateToMyProfile}
          style={({ pressed }) => [styles.profileClickable, { opacity: pressed ? 0.8 : 1 }]}
        >
          <AnimatedAvatar uri={user.avatar} size={100} level={user.level ?? 1} style={{ marginBottom: Spacing.md }} />
          <View style={styles.nameRow}>
            <ThemedText style={styles.displayName}>{user.displayName}</ThemedText>
            <VerifiedBadge tierSlug={user.tierSlug} size={18} />
            <LevelBadge level={user.level ?? 1} size="medium" />
          </View>
          <ThemedText style={[styles.viewProfileHint, { color: theme.primary }]}>
            View Profile & Stats
          </ThemedText>
        </Pressable>
        <View style={styles.xpBarContainer}>
          <XpProgressBar totalXp={user.totalXp ?? 0} level={user.level ?? 1} />
        </View>
        <ThemedText style={[styles.email, { color: theme.textSecondary }]}>{user.email}</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleNavigateToEditProfile}
        >
          <Feather name="edit-2" size={16} color={theme.text} />
          <ThemedText style={styles.editText}>Edit Profile</ThemedText>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Connected Accounts</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Link your social accounts to syndicate content
        </ThemedText>
        <View style={[styles.accountsList, { backgroundColor: theme.surface }]}>
          {user.connectedAccounts.filter((account) => account.provider === "google").map((account) => {
            const config = platformConfig[account.provider];
            return (
              <View
                key={account.provider}
                style={[styles.accountRow, { borderBottomColor: theme.border }]}
              >
                <View style={[styles.accountIcon, { backgroundColor: config.color }]}>
                  <Feather name={config.icon} size={18} color="#FFFFFF" />
                </View>
                <View style={styles.accountInfo}>
                  <ThemedText style={styles.accountName}>{config.name}</ThemedText>
                  {account.connected && (
                    <ThemedText style={[styles.accountUsername, { color: theme.textSecondary }]}>
                      {account.username}
                    </ThemedText>
                  )}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.connectButton,
                    {
                      backgroundColor: account.connected
                        ? theme.backgroundSecondary
                        : (isDark ? Colors.dark.primary : Colors.light.primary),
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => handleConnectToggle(account.provider, account.connected)}
                >
                  <ThemedText
                    style={[
                      styles.connectButtonText,
                      { color: account.connected ? theme.text : "#FFFFFF" },
                    ]}
                  >
                    {account.connected ? "Connected" : "Connect"}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>


      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.subscriptionCard,
            { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleNavigateToSubscription}
        >
          <View style={styles.subscriptionLeft}>
            <Feather name="zap" size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <View style={styles.subscriptionInfo}>
              <ThemedText style={styles.subscriptionTier}>{user.tierSlug === "free" || !user.tierSlug ? "Free" : user.tierSlug === "tier_5" ? "Starter" : user.tierSlug === "tier_15" ? "Plus" : user.tierSlug === "tier_30" ? "Pro" : "Enterprise"}</ThemedText>
              <ThemedText style={[styles.subscriptionCredits, { color: theme.textSecondary }]}>
                {user.credits ?? 10} credits available
              </ThemedText>
            </View>
          </View>
          <View style={[styles.creditsBadge, { backgroundColor: (isDark ? Colors.dark.primary : Colors.light.primary) + "20" }]}>
            <ThemedText style={[styles.creditsBadgeText, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
              {user.credits ?? 10}
            </ThemedText>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
        <View style={[styles.settingsList, { backgroundColor: theme.surface }]}>
          <Pressable
            style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleNavigateToNotifications}
          >
            <Feather name="bell" size={20} color={theme.text} />
            <ThemedText style={styles.settingText}>Notifications</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleNavigateToPrivacy}
          >
            <Feather name="lock" size={20} color={theme.text} />
            <ThemedText style={styles.settingText}>Privacy</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleNavigateToHelp}
          >
            <Feather name="book-open" size={20} color={theme.text} />
            <ThemedText style={styles.settingText}>Help</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleNavigateToSupport}
          >
            <Feather name="headphones" size={20} color={theme.text} />
            <ThemedText style={styles.settingText}>Contact Us</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.settingRow, { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleNavigateToAbout}
          >
            <Feather name="info" size={20} color={theme.text} />
            <ThemedText style={styles.settingText}>About</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          { backgroundColor: theme.error + "15", opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color={theme.error} />
        <ThemedText style={[styles.logoutText, { color: theme.error }]}>Log Out</ThemedText>
      </Pressable>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.modalTitle}>Log Out</ThemedText>
            <ThemedText style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Are you sure you want to log out?
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.error }]}
                onPress={confirmLogout}
              >
                <ThemedText style={[styles.modalButtonText, { color: "#FFFFFF" }]}>Log Out</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 180,
    zIndex: 0,
  },
  backgroundBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 160,
    zIndex: 0,
  },
  profileCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  xpBarContainer: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
  },
  profileClickable: {
    alignItems: "center",
  },
  viewProfileHint: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  editText: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  accountsList: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  accountName: {
    fontSize: 15,
    fontWeight: "500",
  },
  accountUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  connectButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  exploreButtonContent: {
    flex: 1,
  },
  exploreButtonTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  exploreButtonSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  settingsList: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  subscriptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  subscriptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  subscriptionInfo: {
    gap: 2,
  },
  subscriptionTier: {
    fontSize: 17,
    fontWeight: "600",
  },
  subscriptionCredits: {
    fontSize: 13,
  },
  creditsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  creditsBadgeText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
