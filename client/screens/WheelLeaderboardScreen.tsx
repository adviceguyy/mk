import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { getQueryFn } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

interface LeaderboardEntry {
  id: string;
  score: number;
  phrasesCompleted: number;
  createdAt: string;
  userId: string;
  displayName: string;
  avatar: string | null;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export default function WheelLeaderboardScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useQuery<LeaderboardResponse>({
    queryKey: ["/api/game/leaderboard"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const leaderboard = data?.leaderboard || [];

  const getMedalColor = (rank: number) => {
    if (rank === 0) return "#FFD700";
    if (rank === 1) return "#C0C0C0";
    if (rank === 2) return "#CD7F32";
    return null;
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = user?.id === item.userId;
    const medalColor = getMedalColor(index);

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: isCurrentUser
              ? "rgba(196, 148, 42, 0.1)"
              : theme.surface,
            borderColor: isCurrentUser ? "#C4942A" : theme.border,
          },
        ]}
      >
        {/* Rank */}
        <View style={styles.rankContainer}>
          {medalColor ? (
            <View style={[styles.medal, { backgroundColor: medalColor }]}>
              <ThemedText style={styles.medalText}>{index + 1}</ThemedText>
            </View>
          ) : (
            <ThemedText style={[styles.rankText, { color: theme.textSecondary }]}>
              {index + 1}
            </ThemedText>
          )}
        </View>

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Feather name="user" size={20} color={theme.textSecondary} />
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <ThemedText
            style={[styles.name, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.displayName || "Player"}
            {isCurrentUser ? " (You)" : ""}
          </ThemedText>
          <ThemedText style={[styles.meta, { color: theme.textSecondary }]}>
            {item.phrasesCompleted} phrases
          </ThemedText>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <ThemedText style={[styles.score, { color: "#C4942A" }]}>
            {item.score.toLocaleString()}
          </ThemedText>
          <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            pts
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C4942A" />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingTop: headerHeight + 8, paddingBottom: tabBarHeight + 16 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#C4942A"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="award" size={48} color={theme.textTertiary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No scores yet. Be the first!
              </ThemedText>
            </View>
          }
          ListHeaderComponent={
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
              <Feather name="award" size={24} color="#C4942A" />
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                Top Players
              </ThemedText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  list: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 12,
  },
  rankContainer: {
    width: 32,
    alignItems: "center",
  },
  medal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  medalText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  rankText: {
    fontSize: 16,
    fontWeight: "600",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  score: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
