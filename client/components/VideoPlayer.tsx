import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { UploadedVideo } from "@/lib/types";

interface VideoPlayerProps {
  video: UploadedVideo;
  autoPlay?: boolean;
  showControls?: boolean;
  aspectRatio?: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  video,
  autoPlay = false,
  showControls = true,
  aspectRatio = 16 / 9,
}: VideoPlayerProps) {
  const { theme, isDark } = useTheme();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(!autoPlay);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const togglePlayback = async () => {
    if (showThumbnail) {
      // Just hide thumbnail - Video component will auto-play via shouldPlay prop
      setShowThumbnail(false);
      setIsLoading(true);
      return;
    }

    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  // Handle video not ready yet
  if (video.status !== "ready") {
    return (
      <View style={[styles.container, { aspectRatio }]}>
        <View style={[styles.placeholder, { backgroundColor: theme.backgroundSecondary }]}>
          {video.status === "failed" ? (
            <>
              <Feather name="alert-circle" size={32} color={theme.error} />
              <ThemedText style={[styles.statusText, { color: theme.error }]}>
                Video processing failed
              </ThemedText>
              {video.failureReason && (
                <ThemedText style={[styles.reasonText, { color: theme.textSecondary }]}>
                  {video.failureReason}
                </ThemedText>
              )}
            </>
          ) : (
            <>
              <ActivityIndicator color={isDark ? Colors.dark.primary : Colors.light.primary} />
              <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
                {video.status === "encoding" ? "Encoding video..." :
                 video.status === "processing" ? "Processing..." :
                 video.status === "uploading" ? "Uploading..." :
                 "Queued..."}
              </ThemedText>
              {video.encodingProgress !== undefined && video.encodingProgress > 0 && (
                <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
                  {video.encodingProgress}%
                </ThemedText>
              )}
            </>
          )}
        </View>
      </View>
    );
  }

  // No playback URL available
  if (!video.playbackUrl) {
    return (
      <View style={[styles.container, { aspectRatio }]}>
        <View style={[styles.placeholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="video-off" size={32} color={theme.textSecondary} />
          <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
            Video unavailable
          </ThemedText>
        </View>
      </View>
    );
  }

  // For web, use MP4 instead of HLS (.m3u8) since HLS requires extra libraries
  // Bunny.net provides MP4 at resolution-specific URLs
  const getPlaybackUrl = (): string => {
    const url = video.playbackUrl || "";
    if (!url) return "";
    if (Platform.OS === "web" && url.endsWith(".m3u8")) {
      // Convert HLS URL to MP4 URL for web compatibility
      // Use 480p which is generated for most videos (360p is fallback)
      const baseUrl = url.replace("/playlist.m3u8", "");
      // If we know the video height, pick appropriate resolution, otherwise use 480p
      if (video.height && video.height >= 720) {
        return `${baseUrl}/play_720p.mp4`;
      }
      return `${baseUrl}/play_480p.mp4`;
    }
    return url;
  };

  return (
    <View style={[styles.container, { aspectRatio }]}>
      {showThumbnail && video.thumbnailUrl ? (
        <Pressable style={styles.thumbnailContainer} onPress={togglePlayback}>
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Feather name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          </View>
          {video.duration !== undefined && video.duration > 0 && (
            <View style={styles.durationBadge}>
              <ThemedText style={styles.durationText}>
                {formatDuration(video.duration)}
              </ThemedText>
            </View>
          )}
        </Pressable>
      ) : (
        <>
          <Video
            ref={videoRef}
            source={{ uri: getPlaybackUrl() }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!showThumbnail}
            isLooping={false}
            useNativeControls={Platform.OS !== "web"}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={(e) => handleError(e || "Playback error")}
          />

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FFFFFF" size="large" />
            </View>
          )}

          {error && (
            <View style={styles.errorOverlay}>
              <Feather name="alert-circle" size={24} color="#FFFFFF" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {showControls && !isLoading && !error && Platform.OS === "web" && (
            <Pressable style={styles.controlsOverlay} onPress={togglePlayback}>
              {!isPlaying && (
                <View style={styles.playButton}>
                  <Feather name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </View>
              )}
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  statusText: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: "center",
  },
  reasonText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    textAlign: "center",
  },
  progressText: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  thumbnailContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  thumbnail: {
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
  durationBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  errorText: {
    color: "#FFFFFF",
    marginTop: Spacing.sm,
    textAlign: "center",
    fontSize: 14,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
