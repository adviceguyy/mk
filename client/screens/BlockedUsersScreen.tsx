import React from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, ImageBackground, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface BlockedUser {
  id: string;
  displayName: string;
  avatar: string | null;
  blockedAt: string;
}

const fetchBlockedUsers = async (): Promise<{ blockedUsers: BlockedUser[] }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/users/me/blocked", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch blocked users");
  }
  return response.json();
};

const unblockUser = async (userId: string) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/users/${userId}/block`, getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to unblock user");
  }
  return response.json();
};

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/users/me/blocked"],
    queryFn: fetchBlockedUsers,
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/blocked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/following"] });
    },
  });

  const handleUnblock = (userId: string, displayName: string) => {
    const confirmUnblock = () => unblockMutation.mutate(userId);

    if (Platform.OS === "web") {
      if (window.confirm(`Unblock ${displayName}?`)) {
        confirmUnblock();
      }
    } else {
      Alert.alert(
        "Unblock User",
        `Unblock ${displayName}? You will be able to see each other's posts again.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Unblock", onPress: confirmUnblock },
        ]
      );
    }
  };

  const blockedUsers = data?.blockedUsers || [];

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userCard, { backgroundColor: theme.surface }]}>
      <Image
        source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.displayName}</ThemedText>
        <ThemedText style={[styles.blockedDate, { color: theme.textSecondary }]}>
          Blocked {new Date(item.blockedAt).toLocaleDateString()}
        </ThemedText>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.unblockButton,
          {
            backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20",
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => handleUnblock(item.id, item.displayName)}
        disabled={unblockMutation.isPending}
      >
        {unblockMutation.isPending ? (
          <ActivityIndicator size="small" color={isDark ? Colors.dark.primary : Colors.light.primary} />
        ) : (
          <>
            <Feather name="user-check" size={16} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={[styles.unblockButtonText, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
              Unblock
            </ThemedText>
          </>
        )}
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
        <View style={[styles.centered, { backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }]}>
          <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <View style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}>
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="slash" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No blocked users
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Blocked users can't see your posts and you can't see theirs
              </ThemedText>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  blockedDate: {
    fontSize: 12,
    marginTop: 2,
  },
  unblockButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: "center",
  },
});
