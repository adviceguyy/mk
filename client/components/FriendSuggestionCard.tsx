import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { User, SocialPlatform } from "@/lib/types";

interface FriendSuggestionCardProps {
  user: User;
  onFollow: (userId: string) => void;
  onPress: (userId: string) => void;
}

const platformColors: Record<SocialPlatform, string> = {
  youtube: Colors.light.youtube,
  tiktok: Colors.light.tiktok,
  instagram: Colors.light.instagram,
  facebook: Colors.light.facebook,
  twitter: Colors.light.twitter,
};

const platformIcons: Record<SocialPlatform, string> = {
  youtube: "youtube",
  tiktok: "music",
  instagram: "instagram",
  facebook: "facebook",
  twitter: "twitter",
};

export function FriendSuggestionCard({ user, onFollow, onPress }: FriendSuggestionCardProps) {
  const { theme, isDark } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => onPress(user.id)}
    >
      <Image
        source={{ uri: user.avatar }}
        style={styles.avatar}
        contentFit="cover"
      />
      <ThemedText style={styles.name} numberOfLines={1}>
        {user.displayName}
      </ThemedText>
      <ThemedText style={[styles.username, { color: theme.textSecondary }]} numberOfLines={1}>
        @{user.username}
      </ThemedText>
      <View style={styles.platforms}>
        {user.connectedPlatforms.slice(0, 3).map((platform) => (
          <View
            key={platform}
            style={[styles.platformBadge, { backgroundColor: platformColors[platform] }]}
          >
            <Feather
              name={platformIcons[platform] as any}
              size={10}
              color="#FFFFFF"
            />
          </View>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.followButton,
          {
            backgroundColor: user.isFollowing ? theme.backgroundSecondary : isDark ? Colors.dark.primary : Colors.light.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => onFollow(user.id)}
      >
        <ThemedText
          style={[
            styles.followText,
            { color: user.isFollowing ? theme.text : "#FFFFFF" },
          ]}
        >
          {user.isFollowing ? "Following" : "Follow"}
        </ThemedText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  username: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  platforms: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    gap: 4,
  },
  platformBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  followText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
