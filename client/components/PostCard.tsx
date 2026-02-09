import React, { useState } from "react";
import { View, StyleSheet, Pressable, Linking, ScrollView, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AnimatedAvatar } from "@/components/AnimatedAvatar";
import { LevelBadge } from "@/components/LevelBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Post, SocialPlatform } from "@/lib/types";
import { getApiUrl } from "@/lib/query-client";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onUserPress: (userId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const platformColors: Record<SocialPlatform, string> = {
  youtube: Colors.light.youtube,
  tiktok: Colors.light.tiktok,
  instagram: Colors.light.instagram,
  facebook: Colors.light.facebook,
  twitter: Colors.light.twitter,
};

const platformNames: Record<SocialPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  // If it's a relative path, join with API URL
  try {
    return new URL(imagePath, getApiUrl()).toString();
  } catch (e) {
    console.warn("Invalid image URL:", imagePath);
    return imagePath;
  }
}

export function PostCard({ post, onLike, onComment, onShare, onUserPress, onDelete, onEdit, currentUserId, isAdmin }: PostCardProps) {
  const { theme, isDark } = useTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const canDelete = onDelete && (post.userId === currentUserId || isAdmin);
  const canEdit = onEdit && post.userId === currentUserId;

  const handleLike = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onLike(post.id);
  };

  const handleOpenExternal = async () => {
    if (post.mediaUrl && (post.mediaUrl.includes("youtube.com") || post.mediaUrl.includes("youtu.be"))) {
      await Linking.openURL(post.mediaUrl);
    } else if (post.mediaUrl) {
      await Linking.openURL(post.mediaUrl);
    }
  };

  const hasImages = post.images && post.images.length > 0;
  const hasVideo = post.video && post.video.status;
  const hasExternalMedia = post.mediaUrl && post.platform;
  const isVideoUrl = post.mediaUrl && (post.mediaUrl.includes("youtube.com") || post.mediaUrl.includes("youtu.be"));

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : "dQw4w9WgXcQ";
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)" }]}>
      <Pressable
        style={styles.header}
        onPress={() => onUserPress(post.user.id)}
      >
        <AnimatedAvatar
          uri={post.user.avatar}
          size={44}
          level={post.user.level || 1}
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.displayName} numberOfLines={1}>{post.user.displayName}</ThemedText>
            <VerifiedBadge tierSlug={post.user.tierSlug} size={14} />
            {post.user.role === "admin" ? (
              <View style={styles.adminBadge}>
                <ThemedText style={styles.adminBadgeText}>Admin</ThemedText>
              </View>
            ) : null}
            <LevelBadge level={post.user.level || 1} size="small" />
            {post.platform ? (
              <View style={[styles.platformBadge, { backgroundColor: platformColors[post.platform] }]}>
                <Feather name="play-circle" size={10} color="#FFFFFF" />
              </View>
            ) : null}
          </View>
          <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
            @{post.user.username} · {formatTimeAgo(post.createdAt)}
          </ThemedText>
        </View>
      </Pressable>

      {post.caption ? (
        <View style={[styles.captionContainer, post.captionRich?.style?.backgroundColor ? { backgroundColor: post.captionRich.style.backgroundColor } : undefined]}>
          <ThemedText style={[
            styles.caption,
            post.captionRich?.style?.fontSize === "small" && { fontSize: 14 },
            post.captionRich?.style?.fontSize === "large" && { fontSize: 20 },
            post.captionRich?.style?.fontWeight === "bold" && { fontWeight: "bold" as const },
            post.captionRich?.style?.fontStyle === "italic" && { fontStyle: "italic" as const },
            post.captionRich?.style?.textColor ? { color: post.captionRich.style.textColor } : undefined,
          ]}>{post.caption}</ThemedText>
        </View>
      ) : null}

      {hasImages ? (
        <View style={styles.imagesContainer}>
          {post.images!.length === 1 ? (
            <Image
              source={{ uri: getImageUrl(post.images![0]) }}
              style={styles.singleImage}
              contentFit="cover"
            />
          ) : (
            <View>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                  setActiveImageIndex(index);
                }}
              >
                {post.images!.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: getImageUrl(image) }}
                    style={styles.carouselImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
              {post.images!.length > 1 ? (
                <View style={styles.imageIndicators}>
                  {post.images!.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.imageIndicator,
                        {
                          backgroundColor: index === activeImageIndex
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : theme.textSecondary,
                          opacity: index === activeImageIndex ? 1 : 0.4,
                        },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {hasVideo ? (
        <View style={styles.videoContainer}>
          <VideoPlayer video={post.video!} />
        </View>
      ) : null}

      {hasExternalMedia ? (
        <View>
          <Pressable
            style={styles.mediaContainer}
            onPress={handleOpenExternal}
          >
            <Image
              source={{ uri: isVideoUrl ? getYouTubeThumbnail(post.mediaUrl!) : post.mediaUrl! }}
              style={styles.media}
              contentFit="cover"
            />
            {isVideoUrl ? (
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Feather name="play" size={32} color="#FFFFFF" />
                </View>
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={handleOpenExternal} style={styles.viewOnContainer}>
            <ThemedText style={[styles.viewOn, { color: platformColors[post.platform!] }]}>
              View on {platformNames[post.platform!]}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.6 : 1 }]}
          onPress={handleLike}
        >
          <Feather
            name="heart"
            size={20}
            color={post.isLiked ? Colors.light.instagram : theme.textSecondary}
          />
          <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
            {formatCount(post.likesCount)}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => onComment(post.id)}
        >
          <Feather name="message-circle" size={20} color={theme.textSecondary} />
          <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
            {formatCount(post.commentsCount)}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => onShare(post.id)}
        >
          <Feather name="share" size={20} color={theme.textSecondary} />
        </Pressable>

        {canEdit ? (
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.editButton, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => onEdit(post)}
          >
            <Feather name="edit-2" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}

        {canDelete ? (
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => onDelete(post.id)}
          >
            <Feather name="trash-2" size={18} color={Colors.light.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    padding: Spacing.md,
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  displayName: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  adminBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  platformBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  captionContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
  },
  imagesContainer: {
    marginBottom: Spacing.sm,
  },
  videoContainer: {
    marginBottom: Spacing.sm,
  },
  singleImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  carouselImage: {
    width: 320,
    aspectRatio: 4 / 3,
  },
  imageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  imageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mediaContainer: {
    position: "relative",
    aspectRatio: 16 / 9,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewOnContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewOn: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  actionText: {
    fontSize: 13,
    marginLeft: Spacing.xs,
  },
  editButton: {
    marginLeft: "auto",
  },
  deleteButton: {
    marginRight: 0,
  },
});
