import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, ImageBackground, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute, useNavigation, RouteProp, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { ScrollView } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useCredits } from "@/lib/CreditContext";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

const mienPatternBg = require("@/assets/mien-pattern.png");

type TikTokDanceRouteProp = RouteProp<HomeStackParamList, "TikTokDance">;

export default function TikTokDanceScreen() {
  const route = useRoute<TikTokDanceRouteProp>();
  const passedImage = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const { checkCreditError } = useCredits();
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();

  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(
    passedImage?.imageUri ? { uri: passedImage.imageUri, base64: passedImage.imageBase64 } : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<1 | 2 | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const autoTriggerRef = React.useRef(false);

  // Calculate available video count based on credits
  const totalCredits = (user?.credits ?? 0) + (user?.packCredits ?? 0);
  const videoCount = Math.floor(totalCredits / 160);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        if (!permissionResult.canAskAgain && Platform.OS !== "web") {
          setError("Photo permission denied. Please enable it in Settings.");
        } else {
          setError("Permission to access photos is required");
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({ uri: asset.uri, base64: asset.base64 || undefined });
        setGeneratedImage(null);
        setGeneratedVideo(null);
        setError(null);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (err) {
      console.error("Error picking image:", err);
      setError("Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        if (!permissionResult.canAskAgain && Platform.OS !== "web") {
          setError("Camera permission denied. Please enable it in Settings.");
        } else {
          setError("Permission to access camera is required");
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({ uri: asset.uri, base64: asset.base64 || undefined });
        setGeneratedImage(null);
        setGeneratedVideo(null);
        setError(null);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      setError("Failed to take photo. Please try again.");
    }
  };

  const generateTikTokDance = async (overrideBase64?: string) => {
    const imageBase64 = overrideBase64 || selectedImage?.base64;
    
    if (!imageBase64) {
      setError("Please select an image first");
      return;
    }

    if (!sessionToken) {
      setError("Please sign in to use this feature");
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);

    try {
      const response = await fetch(new URL("/api/tiktok-dance", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          imageBase64: imageBase64,
        }),
      });

      if (!response.body) {
        throw new Error("Streaming not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processSSEEvent = (eventType: string, dataStr: string) => {
        console.log("[SSE] Processing event:", eventType, "data length:", dataStr.length);
        
        const trimmedData = dataStr.trim();
        if (!trimmedData) {
          console.log("[SSE] Empty data, skipping");
          return;
        }
        
        if (!trimmedData.startsWith("{") && !trimmedData.startsWith("[")) {
          console.log("[SSE] Not JSON (starts with):", trimmedData.substring(0, 20));
          return;
        }
        
        let data: any;
        try {
          data = JSON.parse(trimmedData);
        } catch (parseError) {
          console.log("[SSE] JSON parse failed:", trimmedData.substring(0, 50));
          return;
        }
        
        console.log("[SSE] Parsed successfully, event:", eventType);
        
        if (eventType === "progress") {
          console.log("[SSE] Progress step:", data.step, data.message);
          setGenerationStep(data.step);
        } else if (eventType === "image") {
          console.log("[SSE] Image received, base64 length:", data.imageBase64?.length || 0);
          if (data.imageBase64) {
            setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
            console.log("[SSE] Image state updated");
          } else if (data.imageUrl) {
            setGeneratedImage(data.imageUrl);
          }
          setSelectedImage(null);
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        } else if (eventType === "video") {
          console.log("[SSE] Video received");
          if (data.videoUrl) {
            const fullUrl = data.videoUrl.startsWith("http") 
              ? data.videoUrl 
              : `${getApiUrl()}${data.videoUrl}`;
            console.log("[SSE] Video URL:", fullUrl);
            setGeneratedVideo(fullUrl);
            console.log("[SSE] Video state updated with URL");
          } else if (data.videoBase64) {
            console.log("[SSE] Video base64 length:", data.videoBase64?.length || 0);
            setGeneratedVideo(`data:video/mp4;base64,${data.videoBase64}`);
            console.log("[SSE] Video state updated with base64");
          }
        } else if (eventType === "error") {
          console.log("[SSE] Error event:", data.error);
          if (data.status === 402) {
            checkCreditError(data);
          }
          throw new Error(data.error || "Generation failed");
        } else if (eventType === "complete") {
          console.log("[SSE] Complete event received");
          queryClient.invalidateQueries({ queryKey: ["/api/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/art-generations"] });
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      };

      console.log("[SSE] Starting to read stream...");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[SSE] Stream ended");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log("[SSE] Received chunk, buffer size:", buffer.length);
        
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";
        
        console.log("[SSE] Found", messages.length, "complete messages");
        
        for (const message of messages) {
          if (!message.trim()) continue;
          
          const lines = message.split("\n");
          let eventType = "";
          let dataStr = "";
          
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr += line.slice(6);
            }
          }
          
          console.log("[SSE] Extracted event:", eventType, "has data:", !!dataStr);
          
          if (eventType && dataStr) {
            try {
              processSSEEvent(eventType, dataStr);
            } catch (eventError: any) {
              console.error("[SSE] Error processing event:", eventType, eventError);
            }
          }
        }
      }

      console.log("[SSE] Stream processing complete, buffer remaining:", buffer.length);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/art-generations"] });
    } catch (err: any) {
      console.error("TikTok Dance generation error:", err);
      console.error("Error stack:", err?.stack);
      console.error("Error name:", err?.name);
      console.error("Error cause:", err?.cause);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      
      let detailedError = "";
      
      if (err?.message) {
        detailedError = err.message;
      } else if (err?.status === 402) {
        detailedError = "Insufficient credits. Please upgrade your subscription.";
      } else if (err?.status === 401) {
        detailedError = "Authentication failed. Please sign in again.";
      } else if (err?.status >= 500) {
        detailedError = "Server error. Please try again later.";
      } else if (err?.type === "SyntaxError") {
        detailedError = "Data parsing error: Invalid response from server. Check console for details.";
      } else if (!err) {
        detailedError = "Unknown error occurred. Check console logs.";
      } else {
        detailedError = "Failed to generate dance video. Please try again.";
      }
      
      if (generationStep) {
        detailedError += ` (Failed at step ${generationStep})`;
      }
      
      console.error("[FINAL ERROR]", detailedError);
      setError(detailedError);
    } finally {
      setIsGenerating(false);
      setGenerationStep(null);
    }
  };

  useEffect(() => {
    if (passedImage?.imageBase64 && sessionToken && !autoTriggerRef.current && !isGenerating) {
      autoTriggerRef.current = true;
      setHasAutoTriggered(true);
      const timer = setTimeout(() => {
        generateTikTokDance(passedImage.imageBase64);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [passedImage?.imageBase64, sessionToken, isGenerating]);

  const downloadImage = async () => {
    if (!generatedImage) return;

    setIsDownloadingImage(true);
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = generatedImage;
        link.download = `tiktok-dance-${Date.now()}.png`;
        link.click();
      } else {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          setError("Permission to save photos is required");
          return;
        }

        const base64Data = generatedImage.split(",")[1];
        const fileUri = FileSystem.cacheDirectory + `tiktok-dance-${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: "base64",
        });

        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert("Success", "Image saved to your photo library!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error("Error downloading image:", err);
      console.error("Download error details:", err?.message, err?.stack);
      setError(`Failed to save image: ${err?.message || "Unknown error"}. Check console for details.`);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const downloadVideo = async () => {
    if (!generatedVideo) return;

    setIsDownloadingVideo(true);
    try {
      const isBase64 = generatedVideo.startsWith("data:");
      
      if (Platform.OS === "web") {
        // Handle data URIs by converting to Blob
        if (isBase64) {
          const base64Data = generatedVideo.split(",")[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "video/mp4" });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = url;
          link.download = `tiktok-dance-${Date.now()}.mp4`;
          link.click();
          
          // Clean up the object URL
          setTimeout(() => URL.revokeObjectURL(url), 100);
        } else {
          // For regular URLs, fetch as blob first (download attribute doesn't work cross-origin)
          const response = await fetch(generatedVideo);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = url;
          link.download = `tiktok-dance-${Date.now()}.mp4`;
          link.click();
          
          // Clean up the object URL
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      } else {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          setError("Permission to save videos is required");
          return;
        }

        const fileUri = FileSystem.cacheDirectory + `tiktok-dance-${Date.now()}.mp4`;
        
        if (isBase64) {
          const base64Data = generatedVideo.split(",")[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: "base64",
          });
        } else {
          console.log("Downloading video from URL:", generatedVideo);
          const downloadResult = await FileSystem.downloadAsync(generatedVideo, fileUri);
          console.log("Download result:", downloadResult);
          if (downloadResult.status !== 200) {
            throw new Error(`Download failed with status ${downloadResult.status}`);
          }
        }

        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert("Success", "Video saved to your photo library!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error("Error downloading video:", err);
      console.error("Download error details:", err?.message, err?.stack);
      setError(`Failed to save video: ${err?.message || "Unknown error"}. Check console for details.`);
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setError(null);
  };

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat" imageStyle={{ opacity: 0.05 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>TikTok Dance</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Transform your photo into a vertical TikTok-style dance video in traditional Mien attire.
        </ThemedText>

        <View style={[styles.costBadge, { backgroundColor: isDark ? "#E91E6320" : "#E91E6315" }]}>
          <Feather name="music" size={16} color="#E91E63" />
          <ThemedText style={[styles.costText, { color: "#E91E63" }]}>Available: {videoCount} {videoCount === 1 ? "video" : "videos"}</ThemedText>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.collectionsLink,
            { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => navigation.navigate("Collections")}
        >
          <View style={styles.collectionsContent}>
            <Feather name="folder" size={20} color="#E91E63" />
            <ThemedText style={styles.collectionsText}>My Creations</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        {isGenerating ? (
          <View style={[styles.statusContainer, { backgroundColor: isDark ? "#1E3A5F" : "#FCE4EC" }]}>
            <ActivityIndicator color="#E91E63" size="small" />
            <View style={styles.statusTextContainer}>
              <ThemedText style={[styles.statusTitle, { color: "#E91E63" }]}>
                {generationStep === 1 ? "Step 1: Creating Dance Portrait..." : "Step 2: Generating Video..."}
              </ThemedText>
              <ThemedText style={[styles.statusSubtitle, { color: theme.textSecondary }]}>
                {generationStep === 1 
                  ? "Transforming your photo with Mien wedding attire" 
                  : "This takes about 2 minutes. You can download your portrait below!"}
              </ThemedText>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + "20" }]}>
            <Feather name="alert-circle" size={18} color={theme.error} />
            <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
          </View>
        ) : null}

        {selectedImage && !isGenerating && !generatedImage && !generatedVideo ? (
          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              {
                backgroundColor: "#E91E63",
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={() => generateTikTokDance()}
          >
            <Feather name="music" size={20} color="#FFFFFF" />
            <ThemedText style={styles.generateText}>Create Dance Video ({videoCount})</ThemedText>
          </Pressable>
        ) : null}

        <View style={[styles.uploadContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} contentFit="cover" />
              <Pressable style={styles.removeButton} onPress={clearAll}>
                <Feather name="x" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickOptionsContainer}>
              <Pressable style={({ pressed }) => [styles.pickOption, { opacity: pressed ? 0.8 : 1 }]} onPress={pickImage}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                  <Feather name="image" size={28} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.pickOptionText}>Photo Library</ThemedText>
              </Pressable>

              <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />

              <Pressable style={({ pressed }) => [styles.pickOption, { opacity: pressed ? 0.8 : 1 }]} onPress={takePhoto}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                  <Feather name="camera" size={28} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.pickOptionText}>Take Photo</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {generatedImage ? (
          <View style={styles.resultSection}>
            <ThemedText style={styles.resultTitle}>Your Dance Portrait</ThemedText>

            <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
              <Image source={{ uri: generatedImage }} style={styles.resultImage} contentFit="contain" />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.downloadButton,
                { backgroundColor: isDark ? "#2563EB" : "#3B82F6", opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={downloadImage}
              disabled={isDownloadingImage}
            >
              {isDownloadingImage ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather name="download" size={20} color="#FFFFFF" />
              )}
              <ThemedText style={styles.downloadButtonText}>
                {isDownloadingImage ? "Saving..." : "Download Photo"}
              </ThemedText>
            </Pressable>

            {isGenerating && generationStep === 2 && !generatedVideo ? (
              <View style={[styles.videoGeneratingBanner, { backgroundColor: isDark ? "#1E3A5F" : "#FCE4EC" }]}>
                <ActivityIndicator color="#E91E63" size="small" />
                <View style={styles.videoGeneratingTextContainer}>
                  <ThemedText style={[styles.videoGeneratingTitle, { color: "#E91E63" }]}>
                    Creating Your Dance Video
                  </ThemedText>
                  <ThemedText style={[styles.videoGeneratingSubtitle, { color: theme.textSecondary }]}>
                    This takes about 2 minutes. Feel free to download your portrait above while you wait!
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {generatedVideo ? (
          <View style={styles.resultSection}>
            <View style={[styles.successBanner, { backgroundColor: isDark ? "#16A34A20" : "#22C55E15" }]}>
              <Feather name="check-circle" size={24} color="#22C55E" />
              <View style={styles.successTextContainer}>
                <ThemedText style={[styles.successTitle, { color: "#22C55E" }]}>
                  Video Created Successfully!
                </ThemedText>
                <ThemedText style={[styles.successSubtitle, { color: theme.textSecondary }]}>
                  Your TikTok dance video has been saved to My Creations.
                </ThemedText>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.collectionsButton,
                { backgroundColor: isDark ? "#E91E63" : "#E91E63", opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => navigation.navigate("Collections")}
            >
              <Feather name="folder" size={20} color="#FFFFFF" />
              <ThemedText style={styles.collectionsButtonText}>View in My Creations</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {(generatedImage || generatedVideo) ? (
          <Pressable
            style={({ pressed }) => [
              styles.newImageButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={clearAll}
          >
            <Feather name="plus" size={18} color={theme.text} />
            <ThemedText style={styles.newImageText}>Start with New Photo</ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  costText: {
    fontSize: 14,
    fontWeight: "600",
  },
  collectionsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  collectionsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  collectionsText: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  uploadContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 9 / 16,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickOptionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  pickOption: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  pickOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  optionDivider: {
    width: 1,
    height: 80,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  generateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  resultSection: {
    marginBottom: Spacing.lg,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  resultCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  resultImage: {
    width: "100%",
    aspectRatio: 9 / 16,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  downloadButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  videoGeneratingBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  videoGeneratingTextContainer: {
    flex: 1,
  },
  videoGeneratingTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  videoGeneratingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  videoCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  videoPlayer: {
    width: "100%",
    aspectRatio: 9 / 16,
  },
  newImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  newImageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  collectionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  collectionsButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
