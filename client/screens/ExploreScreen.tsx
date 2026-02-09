import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TextInput, FlatList, Pressable, ImageBackground, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Post } from "@/lib/types";
import { getApiUrl } from "@/lib/query-client";
import { PostCard } from "@/components/PostCard";
import { CommunityStackParamList } from "@/navigation/CommunityStackNavigator";

const mienPatternBg = require("@/assets/mien-pattern.png");

type ExploreScreenNavigationProp = NativeStackNavigationProp<CommunityStackParamList>;

interface SearchUser {
  id: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  username: string;
}

const fetchTrendingPosts = async () => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/posts/trending", getApiUrl()).toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) return { posts: [] };
  return response.json();
};

const searchUsers = async (query: string): Promise<{ users: SearchUser[] }> => {
  if (!query || query.length < 2) return { users: [] };

  const response = await fetch(
    new URL(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`, getApiUrl()).toString()
  );
  if (!response.ok) return { users: [] };
  return response.json();
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<ExploreScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts/trending"],
    queryFn: fetchTrendingPosts,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/users/search", debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  const posts = postsData?.posts || [];
  const searchResults = searchData?.users || [];
  const isSearching = debouncedSearch.length >= 2;

  // Filter posts by search query when not doing user search
  const filteredPosts = isSearching
    ? []
    : posts.filter(
        (p: Post) =>
          !searchQuery ||
          p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user?.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleUserPress = (userId: string, displayName: string) => {
    (navigation as any).navigate("UserPosts", { userId, userName: displayName });
  };

  const handleLike = () => {};
  const handleComment = () => {};
  const handleShare = () => {};
  const handleDelete = () => {};
  const handleEdit = () => {};

  const renderSearchResult = ({ item }: { item: SearchUser }) => (
    <Pressable
      style={({ pressed }) => [
        styles.userCard,
        { backgroundColor: theme.surface, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => handleUserPress(item.id, item.displayName)}
    >
      <Image
        source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.displayName}</ThemedText>
        <ThemedText style={[styles.userHandle, { color: theme.textSecondary }]}>
          @{item.username}
        </ThemedText>
        {item.bio && (
          <ThemedText style={[styles.userBio, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.bio}
          </ThemedText>
        )}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onUserPress={(userId) => handleUserPress(userId, "")}
      onDelete={handleDelete}
      onEdit={handleEdit}
      currentUserId={user?.id}
      isAdmin={user?.role === "admin"}
    />
  );

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <View style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}>
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          ListHeaderComponent={
            <View>
              <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Feather name="search" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search users and posts..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <Feather name="x" size={18} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>

              {isSearching && searchResults.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>People</ThemedText>
                </View>
              )}

              {!isSearching && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Explore Posts</ThemedText>
                </View>
              )}
            </View>
          }
          data={isSearching ? searchResults : filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={isSearching ? renderSearchResult : renderPost}
          ListEmptyComponent={
            postsLoading || searchLoading ? (
              <View style={{ paddingVertical: Spacing.xl, alignItems: "center" }}>
                <ActivityIndicator color={theme.text} />
              </View>
            ) : (
              <View style={{ paddingVertical: Spacing.xl, alignItems: "center" }}>
                <Feather
                  name={isSearching ? "users" : "file-text"}
                  size={48}
                  color={theme.textSecondary}
                  style={{ marginBottom: Spacing.md }}
                />
                <ThemedText style={{ color: theme.textSecondary }}>
                  {isSearching
                    ? searchQuery.length < 2
                      ? "Type at least 2 characters to search"
                      : "No users found"
                    : searchQuery
                    ? "No posts found"
                    : "No posts available"}
                </ThemedText>
              </View>
            )
          }
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
  },
  userHandle: {
    fontSize: 13,
  },
  userBio: {
    fontSize: 12,
    marginTop: 2,
  },
});
