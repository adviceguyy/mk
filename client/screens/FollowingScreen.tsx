import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Spacing, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { PostCard } from "@/components/PostCard";
import { Post } from "@/lib/types";
import { getApiUrl } from "@/lib/query-client";
import { CommunityStackParamList } from "@/navigation/CommunityStackNavigator";

const mienPatternBg = require("@/assets/mien-pattern.png");

type FollowingScreenNavigationProp = NativeStackNavigationProp<CommunityStackParamList, "Following">;

const fetchFollowingPosts = async () => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/posts/following", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return { posts: [] };
  const data = await response.json();
  return data;
};

export default function FollowingScreen() {
  const navigation = useNavigation<FollowingScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["/api/posts/following"],
    queryFn: fetchFollowingPosts,
  });

  const posts = postsData?.posts || [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["/api/posts/following"] });
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, [queryClient]);

  const handleUserPress = (userId: string) => {
    const postUser = posts.find((p: Post) => p.userId === userId)?.user;
    navigation.navigate("UserPosts", { userId, userName: postUser?.displayName || "" });
  };

  const handleLike = async (postId: string) => {
    queryClient.setQueryData(["/api/posts/following"], (oldData: any) => {
      if (!oldData?.posts) return oldData;
      return {
        ...oldData,
        posts: oldData.posts.map((p: any) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
            : p
        ),
      };
    });

    try {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      await fetch(new URL(`/api/posts/${postId}/like`, getApiUrl()).toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error liking post:", error);
      queryClient.invalidateQueries({ queryKey: ["/api/posts/following"] });
    }
  };

  const handleComment = (postId: string) => {
    console.log("Comment on post:", postId);
  };

  const handleShare = (postId: string) => {
    console.log("Share post:", postId);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="users" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Follow some people to see their posts here
      </ThemedText>
    </View>
  );

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.9)" }}>
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing["3xl"] + 60,
            paddingHorizontal: Spacing.lg,
            flexGrow: 1,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onUserPress={handleUserPress}
              currentUserId={user?.id}
              isAdmin={user?.role === "admin"}
            />
          )}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.textSecondary}
              progressViewOffset={headerHeight}
            />
          }
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
