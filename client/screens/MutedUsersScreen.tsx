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

interface MutedUser {
  id: string;
  displayName: string;
  avatar: string | null;
  mutedAt: string;
}

const fetchMutedUsers = async (): Promise<{ mutedUsers: MutedUser[] }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/users/me/muted", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch muted users");
  }
  return response.json();
};

const unmutUser = async (userId: string) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/users/${userId}/mute`, getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to unmute user");
  }
  return response.json();
};

export default function MutedUsersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/users/me/muted"],
    queryFn: fetchMutedUsers,
  });

  const unmuteMutation = useMutation({
    mutationFn: unmutUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/muted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
    },
  });

  const handleUnmute = (userId: string, displayName: string) => {
    const confirmUnmute = () => unmuteMutation.mutate(userId);

    if (Platform.OS === "web") {
      if (window.confirm(`Unmute ${displayName}?`)) {
        confirmUnmute();
      }
    } else {
      Alert.alert(
        "Unmute User",
        `Unmute ${displayName}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Unmute", onPress: confirmUnmute },
        ]
      );
    }
  };

  const mutedUsers = data?.mutedUsers || [];

  const renderItem = ({ item }: { item: MutedUser }) => (
    <View style={[styles.userCard, { backgroundColor: theme.surface }]}>
      <Image
        source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.displayName}</ThemedText>
        <ThemedText style={[styles.mutedDate, { color: theme.textSecondary }]}>
          Muted {new Date(item.mutedAt).toLocaleDateString()}
        </ThemedText>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.unmuteButton,
          {
            backgroundColor: theme.backgroundSecondary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => handleUnmute(item.id, item.displayName)}
        disabled={unmuteMutation.isPending}
      >
        {unmuteMutation.isPending ? (
          <ActivityIndicator size="small" color={theme.text} />
        ) : (
          <>
            <Feather name="volume-2" size={16} color={theme.text} />
            <ThemedText style={styles.unmuteButtonText}>Unmute</ThemedText>
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
          data={mutedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="volume-x" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No muted users
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Users you mute won't appear in your trending feed
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
  mutedDate: {
    fontSize: 12,
    marginTop: 2,
  },
  unmuteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  unmuteButtonText: {
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
