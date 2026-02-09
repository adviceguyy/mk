import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, FlatList, Alert, Modal, WebView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface ArtGeneration {
  id: string;
  type: "movie_star" | "dress_me" | "restore_photo";
  imageUrl: string | null;
  videoUrl: string | null;
  prompt: string | null;
  creditsUsed: number;
  createdAt: string;
}

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { sessionToken } = useAuth();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const { data: generations, isLoading, error, refetch } = useQuery<ArtGeneration[]>({
    queryKey: ["/api/art-generations"],
    enabled: !!sessionToken,
    queryFn: async () => {
      const { getApiUrl } = await import("@/lib/query-client");
      const response = await fetch(new URL("/api/art-generations", getApiUrl()).href, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch art generations");
      }
      return response.json();
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie_star":
        return "Movie Star";
      case "tiktok_dance":
        return "TikTok Dance";
      case "dress_me":
        return "Dress Me";
      case "restore_photo":
        return "Photo Restore";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "movie_star":
        return "#F59E0B";
      case "tiktok_dance":
        return "#E91E63";
      case "dress_me":
        return Colors.light.primary;
      case "restore_photo":
        return "#8B5CF6";
      default:
        return theme.text;
    }
  };

  const hasValidData = (url: string | null) => {
    if (!url) return false;
    // Check for base64 data URLs or server-hosted URLs
    if (url.startsWith("data:") && url.length > 100) return true;
    if (url.startsWith("/generated/") || url.startsWith("http")) return true;
    return false;
  };

  const isUrlBased = (url: string | null) => {
    return url && (url.startsWith("/generated/") || url.startsWith("http"));
  };

  const downloadImage = async (id: string, imageUrl: string | null) => {
    if (!imageUrl || !hasValidData(imageUrl)) {
      Alert.alert("Not Available", "Image data is not available for download.");
      return;
    }

    setDownloadingId(id + "-image");
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `mien-creation-${Date.now()}.png`;
        link.click();
        Alert.alert("Success", "Download started!");
      } else {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission Required", "Permission to save photos is required");
          return;
        }

        const base64Data = imageUrl.split(",")[1];
        if (!base64Data) {
          Alert.alert("Error", "Image data format error");
          return;
        }

        const fileUri = FileSystem.cacheDirectory + `mien-creation-${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert("Success", "Image saved to your photo library!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Error downloading image:", err);
      Alert.alert("Error", "Failed to save image. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadVideo = async (id: string, videoUrl: string | null) => {
    if (!videoUrl || !hasValidData(videoUrl)) {
      Alert.alert("Not Available", "Video data is not available for download.");
      return;
    }

    setDownloadingId(id + "-video");
    try {
      if (Platform.OS === "web") {
        // For URL-based videos, construct full URL
        let downloadUrl = videoUrl;
        if (isUrlBased(videoUrl) && !videoUrl.startsWith("http")) {
          const { getApiUrl } = await import("@/lib/query-client");
          downloadUrl = `${getApiUrl()}${videoUrl}`;
        }
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `mien-creation-${Date.now()}.mp4`;
        link.click();
        Alert.alert("Success", "Download started!");
      } else {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission Required", "Permission to save videos is required");
          return;
        }

        const fileUri = FileSystem.cacheDirectory + `mien-creation-${Date.now()}.mp4`;

        if (isUrlBased(videoUrl)) {
          // URL-based video - download it
          const { getApiUrl } = await import("@/lib/query-client");
          const fullUrl = videoUrl.startsWith("http") ? videoUrl : `${getApiUrl()}${videoUrl}`;
          const downloadResult = await FileSystem.downloadAsync(fullUrl, fileUri);
          if (downloadResult.status !== 200) {
            throw new Error(`Download failed with status ${downloadResult.status}`);
          }
        } else {
          // Base64 video
          const base64Data = videoUrl.split(",")[1];
          if (!base64Data) {
            Alert.alert("Error", "Video data format error");
            return;
          }
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert("Success", "Video saved to your photo library!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Error downloading video:", err);
      Alert.alert("Error", "Failed to save video. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const shareToFeed = async (item: ArtGeneration) => {
    Alert.alert(
      "Share to Feed",
      "This will create a new post with your creation. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Share", 
          onPress: async () => {
            try {
              const { getApiUrl } = await import("@/lib/query-client");
              
              const typeLabels: Record<string, string> = {
                movie_star: "Movie Star",
                tiktok_dance: "TikTok Dance",
                dress_me: "Dress Me",
                restore_photo: "Photo Restore",
              };

              const media = item.videoUrl || item.imageUrl;
              const caption = `Check out my ${typeLabels[item.type]} creation! #MienKingdom`;
              
              const imageArray = !item.videoUrl && item.imageUrl ? [item.imageUrl] : [];
              
              const response = await fetch(new URL("/api/posts", getApiUrl()).href, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                  caption,
                  images: imageArray,
                  mediaUrl: item.videoUrl || null,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to create post");
              }

              Alert.alert("Success", "Posted to your timeline!");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("Error sharing to feed:", error);
              Alert.alert("Error", "Failed to share. Please try again.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: ArtGeneration }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + "20" }]}>
          <ThemedText style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </ThemedText>
        </View>
        <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
          {formatDate(item.createdAt)}
        </ThemedText>
      </View>

      <Pressable
        onPress={() => {
          if (hasValidData(item.videoUrl)) {
            setPlayingVideoId(item.id);
            setPlayingVideoUrl(item.videoUrl);
          }
        }}
        style={styles.imageContainer}
      >
        {hasValidData(item.imageUrl) ? (
          <Image
            source={{ uri: item.imageUrl! }}
            style={styles.generatedImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.placeholderContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="image" size={40} color={theme.textSecondary} />
            <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
              Preview not available
            </ThemedText>
          </View>
        )}
        {hasValidData(item.videoUrl) ? (
          <>
            <View style={styles.videoIndicator}>
              <Feather name="film" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.playButtonOverlay}>
              <View style={styles.playButton}>
                <Feather name="play" size={24} color="#FFFFFF" />
              </View>
            </View>
          </>
        ) : null}
      </Pressable>

      <View style={styles.cardFooter}>
        <View style={styles.creditsInfo}>
          <Feather name="zap" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.creditsText, { color: theme.textSecondary }]}>
            {item.creditsUsed} Credits Used
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        {hasValidData(item.imageUrl) ? (
          <Pressable
            style={[styles.actionButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
            onPress={() => downloadImage(item.id, item.imageUrl)}
            disabled={downloadingId === item.id + "-image"}
          >
            {downloadingId === item.id + "-image" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="download" size={16} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Download Photo</ThemedText>
              </>
            )}
          </Pressable>
        ) : null}
        {hasValidData(item.videoUrl) ? (
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#16A34A" }]}
            onPress={() => downloadVideo(item.id, item.videoUrl)}
            disabled={downloadingId === item.id + "-video"}
          >
            {downloadingId === item.id + "-video" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="download" size={16} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Download Video</ThemedText>
              </>
            )}
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}
          onPress={() => shareToFeed(item)}
        >
          <Feather name="share-2" size={16} color="#FFFFFF" />
          <ThemedText style={styles.actionButtonText}>Share</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="image" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Creations Yet</ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Your AI-generated images and videos will appear here after you create them in the Arts tab.
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your creations...
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: headerHeight }]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText style={[styles.errorTitle, { color: theme.text }]}>
          Could not load collections
        </ThemedText>
        <Pressable
          style={[styles.retryButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
          onPress={() => refetch()}
        >
          <Feather name="refresh-cw" size={18} color="#FFFFFF" />
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={generations || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />

      <Modal
        visible={!!playingVideoId}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPlayingVideoId(null);
          setPlayingVideoUrl(null);
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.95)" }]}>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              setPlayingVideoId(null);
              setPlayingVideoUrl(null);
            }}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>

          {playingVideoUrl && (
            <View style={styles.videoPlayerContainer}>
              {Platform.OS === "web" ? (
                <video
                  src={playingVideoUrl}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  controls
                  autoPlay
                />
              ) : (
                <WebView
                  source={{
                    html: `
                      <html>
                        <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body { margin: 0; padding: 0; background: #000; display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
                            video { max-width: 100%; max-height: 100%; }
                          </style>
                        </head>
                        <body>
                          <video controls autoplay style="max-width: 100%; max-height: 100%;">
                            <source src="${playingVideoUrl}" type="video/mp4">
                            Your browser does not support the video tag.
                          </video>
                        </body>
                      </html>
                    `,
                  }}
                  style={styles.videoPlayer}
                  scrollEnabled={false}
                  javaScriptEnabled
                />
              )}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  generatedImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  placeholderText: {
    fontSize: 14,
  },
  videoIndicator: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "#16A34A",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  creditsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  creditsText: {
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
});
