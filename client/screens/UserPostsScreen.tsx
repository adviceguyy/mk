import React, { useState } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator, Pressable, ImageBackground, Modal, TextInput, ScrollView, Platform, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PostCard } from "@/components/PostCard";
import { getApiUrl } from "@/lib/query-client";
import { Post, PostVisibility } from "@/lib/types";
import { AnimatedAvatar } from "@/components/AnimatedAvatar";
import { LevelBadge } from "@/components/LevelBadge";
import { XpProgressBar } from "@/components/XpProgressBar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const mienPatternBg = require("@/assets/mien-pattern.png");

type UserPostsParams = { userId: string; userName: string };
type UserPostsRouteProp = RouteProp<{ UserPosts: UserPostsParams }, "UserPosts">;
type UserPostsNavigationProp = NativeStackNavigationProp<{ UserPosts: UserPostsParams }>;

interface ProfileData {
  id: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  role: "user" | "moderator" | "admin";
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isFriend: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  isBlockedBy: boolean;
  totalXp: number;
  level: number;
  tierSlug?: string;
}

const fetchUserPosts = async (userId: string) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/users/${userId}/posts`, getApiUrl()).toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user posts");
  }
  return response.json();
};

const fetchUserProfile = async (userId: string): Promise<{ user: ProfileData }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/users/${userId}`, getApiUrl()).toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
};

const toggleFollow = async (userId: string) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/users/${userId}/follow`, getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to toggle follow");
  }
  return response.json();
};

const toggleMute = async (userId: string) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/users/${userId}/mute`, getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to toggle mute");
  }
  return response.json();
};

const toggleBlock = async (userId: string) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/users/${userId}/block`, getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to toggle block");
  }
  return response.json();
};

export default function UserPostsScreen() {
  const route = useRoute<UserPostsRouteProp>();
  const navigation = useNavigation<UserPostsNavigationProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { userId, userName } = route.params;

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/users", userId, "posts"],
    queryFn: () => fetchUserPosts(userId),
  });

  const { data: profileData } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: () => fetchUserProfile(userId),
  });

  const followMutation = useMutation({
    mutationFn: () => toggleFollow(userId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/users", userId] });
      const previousData = queryClient.getQueryData(["/api/users", userId]);
      queryClient.setQueryData(["/api/users", userId], (old: any) => {
        if (!old?.user) return old;
        return {
          ...old,
          user: {
            ...old.user,
            isFollowing: !old.user.isFollowing,
            followersCount: old.user.isFollowing
              ? old.user.followersCount - 1
              : old.user.followersCount + 1,
          },
        };
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/users", userId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
    },
  });

  // Mute/Block state
  const [showActionMenu, setShowActionMenu] = useState(false);

  const muteMutation = useMutation({
    mutationFn: () => toggleMute(userId),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/users", userId], (old: any) => {
        if (!old?.user) return old;
        return {
          ...old,
          user: { ...old.user, isMuted: data.muted },
        };
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => toggleBlock(userId),
    onSuccess: (data) => {
      if (data.blocked) {
        // Navigate away when blocking
        navigation.goBack();
      } else {
        queryClient.setQueryData(["/api/users", userId], (old: any) => {
          if (!old?.user) return old;
          return {
            ...old,
            user: { ...old.user, isBlocked: false },
          };
        });
      }
    },
  });

  const handleMutePress = () => {
    setShowActionMenu(false);
    const confirmMute = () => muteMutation.mutate();

    if (Platform.OS === "web") {
      if (window.confirm(profile?.isMuted ? "Unmute this user?" : "Mute this user? Their posts won't appear in your trending feed.")) {
        confirmMute();
      }
    } else {
      Alert.alert(
        profile?.isMuted ? "Unmute User" : "Mute User",
        profile?.isMuted ? "Unmute this user?" : "Their posts won't appear in your trending feed.",
        [
          { text: "Cancel", style: "cancel" },
          { text: profile?.isMuted ? "Unmute" : "Mute", onPress: confirmMute },
        ]
      );
    }
  };

  const handleBlockPress = () => {
    setShowActionMenu(false);
    const confirmBlock = () => blockMutation.mutate();

    if (Platform.OS === "web") {
      if (window.confirm(profile?.isBlocked ? "Unblock this user?" : "Block this user? You won't see each other's posts.")) {
        confirmBlock();
      }
    } else {
      Alert.alert(
        profile?.isBlocked ? "Unblock User" : "Block User",
        profile?.isBlocked ? "Unblock this user?" : "You won't see each other's posts.",
        [
          { text: "Cancel", style: "cancel" },
          { text: profile?.isBlocked ? "Unblock" : "Block", style: "destructive", onPress: confirmBlock },
        ]
      );
    }
  };

  const posts = postsData?.posts || [];
  const profile = profileData?.user;

  const handleLike = async (postId: string) => {
    queryClient.setQueryData(["/api/users", userId, "posts"], (oldData: any) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "posts"] });
    }
  };

  const handleComment = (postId: string) => {
    console.log("Comment on post:", postId);
  };

  const handleShare = (postId: string) => {
    console.log("Share post:", postId);
  };

  const handleDelete = async (postId: string) => {
    const deletePost = async () => {
      try {
        const token = await AsyncStorage.getItem("@mien_kingdom_session");
        const response = await fetch(new URL(`/api/posts/${postId}`, getApiUrl()).toString(), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "posts"] });
          queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
        } else {
          if (Platform.OS === "web") {
            window.alert("Failed to delete post");
          } else {
            Alert.alert("Error", "Failed to delete post");
          }
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        if (Platform.OS === "web") {
          window.alert("Failed to delete post");
        } else {
          Alert.alert("Error", "Failed to delete post");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this post?")) {
        deletePost();
      }
    } else {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: deletePost },
        ]
      );
    }
  };

  // Edit post state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editVisibility, setEditVisibility] = useState<PostVisibility>("public");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setEditCaption(post.caption || "");
    setEditUrl(post.mediaUrl || "");
    setEditVisibility(post.visibility || "public");
    setEditError(null);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditCaption("");
    setEditUrl("");
    setEditVisibility("public");
    setEditError(null);
    setIsEditSubmitting(false);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    const hasContent = editCaption.trim() || editUrl.trim() || (editingPost.images && editingPost.images.length > 0);
    if (!hasContent) {
      setEditError("Please add some text, images, or a video link");
      return;
    }
    setEditError(null);
    setIsEditSubmitting(true);

    try {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      const response = await fetch(new URL(`/api/posts/${editingPost.id}`, getApiUrl()).toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caption: editCaption.trim(),
          mediaUrl: editUrl.trim() || "",
          visibility: editVisibility,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update post");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
      handleCloseEditModal();

      if (Platform.OS === "web") {
        window.alert("Post updated successfully");
      } else {
        Alert.alert("Success", "Post updated successfully");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      setEditError(error instanceof Error ? error.message : "Failed to update post");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleUserPress = (pressedUserId: string) => {
    if (pressedUserId !== userId) {
      navigation.push("UserPosts", { userId: pressedUserId, userName: "" });
    }
  };

  const handleFollowPress = () => {
    if (!user) return;
    followMutation.mutate();
  };

  const handleMessagePress = () => {
    if (!user || !profile) return;
    navigation.dispatch(
      CommonActions.navigate({
        name: "MessagesTab",
        params: {
          screen: "Chat",
          params: {
            conversationId: "", // Will create new conversation
            participantName: profile.displayName,
            participantId: userId,
            participantAvatar: profile.avatar || undefined,
          },
        },
      })
    );
  };

  const isOwnProfile = user?.id === userId;

  const renderHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)" }]}>
      <AnimatedAvatar
        uri={profile?.avatar || undefined}
        size={100}
        level={profile?.level ?? 1}
        style={{ marginBottom: Spacing.md }}
      />
      <View style={styles.nameWithBadge}>
        <ThemedText style={styles.displayName}>{profile?.displayName || userName}</ThemedText>
        <VerifiedBadge tierSlug={profile?.tierSlug} size={18} />
        <LevelBadge level={profile?.level ?? 1} size="medium" />
      </View>

      {profile?.bio && (
        <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>
          {profile.bio}
        </ThemedText>
      )}

      <View style={styles.xpBarSection}>
        <XpProgressBar totalXp={profile?.totalXp ?? 0} level={profile?.level ?? 1} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{profile?.postsCount || posts.length}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{profile?.followersCount || 0}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{profile?.followingCount || 0}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Following</ThemedText>
        </View>
      </View>

      {user && !isOwnProfile && (
        <View style={styles.actionButtonsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.followButton,
              {
                backgroundColor: profile?.isFollowing
                  ? theme.backgroundSecondary
                  : (isDark ? Colors.dark.primary : Colors.light.primary),
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleFollowPress}
            disabled={followMutation.isPending}
          >
            {followMutation.isPending ? (
              <ActivityIndicator size="small" color={profile?.isFollowing ? theme.text : "#FFFFFF"} />
            ) : (
              <>
                <Feather
                  name={profile?.isFollowing ? "user-check" : "user-plus"}
                  size={16}
                  color={profile?.isFollowing ? theme.text : "#FFFFFF"}
                />
                <ThemedText
                  style={[
                    styles.followButtonText,
                    { color: profile?.isFollowing ? theme.text : "#FFFFFF" },
                  ]}
                >
                  {profile?.isFollowing ? "Following" : "Follow"}
                </ThemedText>
              </>
            )}
          </Pressable>

          {profile?.isFriend && (
            <Pressable
              style={({ pressed }) => [
                styles.messageButton,
                {
                  backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleMessagePress}
            >
              <Feather name="mail" size={16} color="#FFFFFF" />
              <ThemedText style={styles.messageButtonText}>Message</ThemedText>
            </Pressable>
          )}

          {/* Show mute/block only if not viewing an admin */}
          {profile?.role !== "admin" && (
            <Pressable
              style={({ pressed }) => [
                styles.moreButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => setShowActionMenu(true)}
            >
              <Feather name="more-horizontal" size={20} color={theme.text} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  if (postsLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
      </ThemedView>
    );
  }

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <View style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onUserPress={handleUserPress}
            onDelete={handleDelete}
            onEdit={handleEdit}
            currentUserId={user?.id}
            isAdmin={user?.role === "admin"}
          />
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No posts yet
            </ThemedText>
          </View>
        }
      />

      {/* Edit Post Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseEditModal}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Post</ThemedText>
              <Pressable onPress={handleCloseEditModal}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {editError ? (
                <View style={[styles.errorContainer, { backgroundColor: "rgba(220, 38, 38, 0.1)" }]}>
                  <Feather name="alert-circle" size={18} color={Colors.light.primary} />
                  <ThemedText style={[styles.errorText, { color: Colors.light.primary }]}>{editError}</ThemedText>
                </View>
              ) : null}

              {editingPost?.images && editingPost.images.length > 0 ? (
                <View style={styles.imagePreviewContainer}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Current Images</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {editingPost.images.map((image, index) => (
                      <View key={index} style={styles.imagePreviewWrapper}>
                        <Image source={{ uri: image.startsWith("http") ? image : new URL(image, getApiUrl()).toString() }} style={styles.imagePreview} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <TextInput
                style={[
                  styles.textInput,
                  styles.captionInput,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.textSecondary}
                value={editCaption}
                onChangeText={setEditCaption}
                multiline
              />

              {editingPost?.mediaUrl ? (
                <View style={styles.mediaSection}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Video URL</ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Paste video URL..."
                    placeholderTextColor={theme.textSecondary}
                    value={editUrl}
                    onChangeText={setEditUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              ) : null}

              <View style={styles.visibilitySection}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Who can see this?</ThemedText>
                <View style={styles.visibilityOptions}>
                  {[
                    { key: "public" as PostVisibility, label: "Everyone", icon: "globe" as const },
                    { key: "followers" as PostVisibility, label: "Followers", icon: "users" as const },
                    { key: "private" as PostVisibility, label: "Only Me", icon: "lock" as const },
                  ].map((option) => (
                    <Pressable
                      key={option.key}
                      style={[
                        styles.visibilityOption,
                        {
                          backgroundColor: editVisibility === option.key
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : theme.backgroundSecondary,
                        },
                      ]}
                      onPress={() => setEditVisibility(option.key)}
                    >
                      <Feather
                        name={option.icon}
                        size={14}
                        color={editVisibility === option.key ? "#FFFFFF" : theme.text}
                      />
                      <ThemedText
                        style={[
                          styles.visibilityOptionText,
                          { color: editVisibility === option.key ? "#FFFFFF" : theme.text },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={[
                styles.submitButton,
                {
                  backgroundColor: isEditSubmitting
                    ? (isDark ? "rgba(220, 38, 38, 0.5)" : "rgba(220, 38, 38, 0.5)")
                    : (isDark ? Colors.dark.primary : Colors.light.primary)
                },
              ]}
              onPress={handleUpdatePost}
              disabled={isEditSubmitting}
            >
              {isEditSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={[styles.submitButtonText, { marginLeft: Spacing.sm }]}>Updating...</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.submitButtonText}>Update Post</ThemedText>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Mute/Block Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <Pressable style={styles.actionMenuOverlay} onPress={() => setShowActionMenu(false)}>
          <View style={[styles.actionMenuContent, { backgroundColor: theme.surface }]}>
            <Pressable
              style={[styles.actionMenuItem, { borderBottomColor: theme.border }]}
              onPress={handleMutePress}
            >
              <Feather name="volume-x" size={20} color={theme.text} />
              <ThemedText style={styles.actionMenuText}>
                {profile?.isMuted ? "Unmute" : "Mute"}
              </ThemedText>
            </Pressable>
            <Pressable
              style={styles.actionMenuItem}
              onPress={handleBlockPress}
            >
              <Feather name="slash" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
              <ThemedText style={[styles.actionMenuText, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                {profile?.isBlocked ? "Unblock" : "Block"}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  nameWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  xpBarSection: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing["2xl"],
    marginVertical: Spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    minWidth: 120,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    minWidth: 120,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenuContent: {
    borderRadius: BorderRadius.md,
    width: 250,
    overflow: "hidden",
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  actionMenuText: {
    fontSize: 16,
    fontWeight: "500",
  },
  postsCount: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalScroll: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  captionInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  mediaSection: {
    marginBottom: Spacing.sm,
  },
  imagePreviewContainer: {
    marginBottom: Spacing.md,
  },
  imagePreviewWrapper: {
    marginRight: Spacing.sm,
    position: "relative",
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  visibilitySection: {
    marginBottom: Spacing.md,
  },
  visibilityOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  visibilityOptionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
