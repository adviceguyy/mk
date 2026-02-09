import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
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
import { CreditIndicator } from "@/components/CreditIndicator";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useCredits } from "@/lib/CreditContext";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function DressMeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const { checkCreditError } = useCredits();
  const navigation = useNavigation<NavigationProp>();

  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [refinementInstructions, setRefinementInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ uri: string; base64: string } | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<1 | 2 | null>(null);
  const [iterationCount, setIterationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [mode, setMode] = useState<"dress" | "movie_star" | null>(null);

  // Calculate available counts based on credits
  const totalCredits = (user?.credits ?? 0) + (user?.packCredits ?? 0);
  const photoCount = Math.floor(totalCredits / 5);
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
        setIterationCount(0);
        setRefinementInstructions("");
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
        setIterationCount(0);
        setRefinementInstructions("");
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

  const saveImageToDevice = async (base64Data: string) => {
    try {
      if (Platform.OS === "web") return;
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;
      const filename = `mien-creation-${Date.now()}.png`;
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await MediaLibrary.createAssetAsync(fileUri);
    } catch (err) {
      console.error("Auto-save to device failed:", err);
    }
  };

  const generateImage = async (isRefinement = false) => {
    const imageToUse = isRefinement && generatedImage ? generatedImage.base64 : selectedImage?.base64;
    const instructions = isRefinement ? refinementInstructions : additionalInstructions;

    if (!imageToUse) {
      setError("Please select an image first");
      return;
    }

    setMode("dress");
    setIsGenerating(true);
    setError(null);

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const response = await fetch(new URL("/api/dress-me", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: imageToUse,
          additionalInstructions: instructions.trim(),
        }),
      });

      if (await checkCreditError(response)) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      const imageUri = `data:${data.mimeType};base64,${data.b64_json}`;
      setGeneratedImage({ uri: imageUri, base64: data.b64_json });
      setSelectedImage(null);
      setIterationCount((prev) => prev + 1);
      setRefinementInstructions("");

      // Auto-save generated image to device
      await saveImageToDevice(data.b64_json);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error("Error generating image:", err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    setIsDownloading(true);
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = generatedImage.uri;
        link.download = `mien-wedding-attire-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow access to save photos to your gallery.");
          return;
        }

        const filename = `mien-wedding-attire-${Date.now()}.png`;
        const fileUri = FileSystem.cacheDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, generatedImage.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.createAssetAsync(fileUri);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved", "Image saved to your photo library!");
      }
    } catch (err) {
      console.error("Error downloading image:", err);
      Alert.alert("Error", "Failed to save image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const shareToFeed = async () => {
    if (!generatedImage || !user || !sessionToken) {
      Alert.alert("Sign In Required", "Please sign in to share to your feed.");
      return;
    }

    setIsPosting(true);
    try {
      const baseUrl = getApiUrl();
      
      const uploadResponse = await fetch(new URL("/api/upload/images-base64", baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          images: [`data:image/png;base64,${generatedImage.base64}`],
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("Upload error:", errorData);
        throw new Error("Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      const imageUrls = uploadData.images;

      const postResponse = await fetch(new URL("/api/posts", baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          caption: "Check out my traditional Mien wedding attire transformation!",
          images: imageUrls,
        }),
      });

      if (!postResponse.ok) {
        throw new Error("Failed to create post");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Posted", "Your Mien attire photo has been shared to your feed!");
    } catch (err) {
      console.error("Error posting to feed:", err);
      Alert.alert("Error", "Failed to share to feed. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const generateMovieStar = async () => {
    if (!selectedImage?.base64) {
      setError("Please select an image first");
      return;
    }

    if (!sessionToken) {
      setError("Please sign in to use this feature");
      return;
    }

    setMode("movie_star");
    setIsGenerating(true);
    setGenerationStep(1);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);

    let stepTimer: NodeJS.Timeout | null = null;

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      stepTimer = setTimeout(() => {
        setGenerationStep(2);
      }, 18000);

      const response = await fetch(new URL("/api/movie-star", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          imageBase64: selectedImage.base64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          checkCreditError(data);
          throw new Error(data.error || "Insufficient credits");
        }
        // Check if Step 1 succeeded but Step 2 failed
        if (data.imageGenerated && data.imageBase64) {
          setGeneratedImage({ uri: `data:image/png;base64,${data.imageBase64}`, base64: data.imageBase64 });
          setError("Video generation failed, but your image was saved. Credits have been refunded.");
          queryClient.invalidateQueries({ queryKey: ["/api/me"] });
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      if (data.imageBase64) {
        setGeneratedImage({ uri: `data:image/png;base64,${data.imageBase64}`, base64: data.imageBase64 });
        // Auto-save generated image to device
        await saveImageToDevice(data.imageBase64);
      }

      if (data.videoBase64) {
        setGeneratedVideo(`data:video/mp4;base64,${data.videoBase64}`);
        // Auto-save generated video to device
        try {
          if (Platform.OS !== "web") {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === "granted") {
              const videoUri = FileSystem.cacheDirectory + `mien-movie-star-${Date.now()}.mp4`;
              await FileSystem.writeAsStringAsync(videoUri, data.videoBase64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              await MediaLibrary.saveToLibraryAsync(videoUri);
            }
          }
        } catch (err) {
          console.error("Auto-save video to device failed:", err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/art-generations"] });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error("Movie Star generation error:", err);
      setError(err.message || "Failed to generate. Please try again.");
    } finally {
      if (stepTimer) {
        clearTimeout(stepTimer);
      }
      setIsGenerating(false);
      setGenerationStep(null);
    }
  };

  const downloadVideo = async () => {
    if (!generatedVideo) return;

    setIsDownloadingVideo(true);
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = generatedVideo;
        link.download = `mien-movie-star-${Date.now()}.mp4`;
        link.click();
        Alert.alert("Success", "Download started!");
      } else {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          setError("Permission to save videos is required");
          return;
        }

        const base64Data = generatedVideo.split(",")[1];
        const fileUri = FileSystem.cacheDirectory + `mien-movie-star-${Date.now()}.mp4`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert("Success", "Video saved to your photo library!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Error downloading video:", err);
      setError("Failed to save video. Please try again.");
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setAdditionalInstructions("");
    setRefinementInstructions("");
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setGenerationStep(null);
    setIterationCount(0);
    setError(null);
    setMode(null);
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      {/* Top decorative background pattern */}
      <Image
        source={backgroundTop}
        style={styles.backgroundTop}
        contentFit="cover"
      />
      {/* Bottom decorative background pattern */}
      <Image
        source={backgroundBottom}
        style={styles.backgroundBottom}
        contentFit="cover"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Pressable
          style={({ pressed }) => [
            styles.collectionsButton,
            { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => navigation.navigate("Collections")}
        >
          <View style={styles.collectionsContent}>
            <Feather name="folder" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText style={styles.collectionsText}>My Creations</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={styles.summaryTitle}>How to Use</ThemedText>
          <ThemedText style={[styles.summaryText, { color: theme.textSecondary }]}>
            Upload a photo, then choose "Make Me Mien" to dress in traditional Mien wedding attire. You can refine results with additional instructions.
          </ThemedText>
        </View>

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

        {selectedImage && !generatedImage ? (
          <>
            <View style={[styles.instructionsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ThemedText style={[styles.instructionsLabel, { color: theme.textSecondary }]}>
                Additional Instructions (optional)
              </ThemedText>
              <TextInput
                style={[styles.instructionsInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="e.g., add gold jewelry, make the turban red..."
                placeholderTextColor={theme.textSecondary}
                value={additionalInstructions}
                onChangeText={setAdditionalInstructions}
                multiline
                numberOfLines={3}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.makeMeMienButton,
                {
                  backgroundColor: isGenerating ? theme.backgroundSecondary : (isDark ? Colors.dark.primary : Colors.light.primary),
                  opacity: pressed && !isGenerating ? 0.9 : 1,
                },
              ]}
              onPress={() => generateImage(false)}
              disabled={isGenerating}
            >
              {isGenerating && mode === "dress" ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText style={styles.generateText}>Generating...</ThemedText>
                </>
              ) : (
                <>
                  <Feather name="user" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.generateText}>Make Me Mien! ({photoCount})</ThemedText>
                </>
              )}
            </Pressable>

            <View style={styles.videoButtonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.videoButton,
                  { 
                    backgroundColor: "#F59E0B", 
                    opacity: pressed ? 0.9 : 1 
                  },
                ]}
                onPress={() => navigation.navigate("MovieStar", { imageUri: selectedImage?.uri, imageBase64: selectedImage?.base64 })}
                disabled={isGenerating}
              >
                <Feather name="film" size={20} color="#FFFFFF" />
                <ThemedText style={styles.videoButtonTitle}>Movie Star</ThemedText>
                <ThemedText style={styles.videoButtonSubtitle}>Cinematic scene</ThemedText>
                <View style={[styles.videoBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <ThemedText style={styles.videoBadgeText}>{videoCount}</ThemedText>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.videoButton,
                  {
                    backgroundColor: "#E91E63",
                    opacity: pressed ? 0.9 : 1
                  },
                ]}
                onPress={() => navigation.navigate("TikTokDance", { imageUri: selectedImage?.uri, imageBase64: selectedImage?.base64 })}
                disabled={isGenerating}
              >
                <Feather name="music" size={20} color="#FFFFFF" />
                <ThemedText style={styles.videoButtonTitle}>TikTok Dance</ThemedText>
                <ThemedText style={styles.videoButtonSubtitle}>Dance video</ThemedText>
                <View style={[styles.videoBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <ThemedText style={styles.videoBadgeText}>{videoCount}</ThemedText>
                </View>
              </Pressable>
            </View>
          </>
        ) : null}

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + "20" }]}>
            <Feather name="alert-circle" size={18} color={theme.error} />
            <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
          </View>
        ) : null}

        {generatedImage ? (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <ThemedText style={styles.resultTitle}>
                {mode === "movie_star" ? "Your Mien Movie Star" : "Your Mien Wedding Attire"}
              </ThemedText>
              {iterationCount > 1 ? (
                <View style={[styles.iterationBadge, { backgroundColor: isDark ? Colors.dark.primary + "30" : Colors.light.primary + "20" }]}>
                  <ThemedText style={[styles.iterationText, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                    Iteration {iterationCount}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
              <Image source={{ uri: generatedImage.uri }} style={styles.resultImage} contentFit="contain" />
            </View>

            <View style={styles.actionButtonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: isDark ? "#2563EB" : "#3B82F6", opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={downloadImage}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Feather name="download" size={20} color="#FFFFFF" />
                )}
                <ThemedText style={styles.actionButtonText}>
                  {isDownloading ? "Saving..." : "Save Image"}
                </ThemedText>
              </Pressable>

              {mode === "movie_star" && generatedVideo ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: "#F59E0B", opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={downloadVideo}
                  disabled={isDownloadingVideo}
                >
                  {isDownloadingVideo ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Feather name="film" size={20} color="#FFFFFF" />
                  )}
                  <ThemedText style={styles.actionButtonText}>
                    {isDownloadingVideo ? "Saving..." : "Save Video"}
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: isDark ? "#16A34A" : "#22C55E", opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={shareToFeed}
                  disabled={isPosting}
                >
                  {isPosting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Feather name="share-2" size={20} color="#FFFFFF" />
                  )}
                  <ThemedText style={styles.actionButtonText}>
                    {isPosting ? "Posting..." : "Share to Feed"}
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {mode !== "movie_star" ? (
            <View style={[styles.refinementContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.refinementHeader}>
                <Feather name="edit-2" size={18} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <ThemedText style={[styles.refinementTitle, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                  Refine This Image
                </ThemedText>
              </View>
              <ThemedText style={[styles.refinementHint, { color: theme.textSecondary }]}>
                Not satisfied? Describe what changes you'd like and we'll iterate on this result.
              </ThemedText>
              <TextInput
                style={[styles.refinementInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="e.g., make jewelry more detailed, add more embroidery..."
                placeholderTextColor={theme.textSecondary}
                value={refinementInstructions}
                onChangeText={setRefinementInstructions}
                multiline
                numberOfLines={3}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.refineButton,
                  {
                    backgroundColor: isGenerating 
                      ? theme.backgroundSecondary 
                      : (refinementInstructions.trim() ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.backgroundSecondary),
                    opacity: pressed && !isGenerating && refinementInstructions.trim() ? 0.9 : 1,
                  },
                ]}
                onPress={() => generateImage(true)}
                disabled={isGenerating || !refinementInstructions.trim()}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <ThemedText style={styles.refineButtonText}>Refining...</ThemedText>
                  </>
                ) : (
                  <>
                    <Feather name="refresh-cw" size={18} color={refinementInstructions.trim() ? "#FFFFFF" : theme.textSecondary} />
                    <ThemedText style={[styles.refineButtonText, { color: refinementInstructions.trim() ? "#FFFFFF" : theme.textSecondary }]}>
                      Apply Refinements
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>
            ) : null}

            {mode !== "movie_star" ? (
            <View style={[styles.infoCard, { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "15" }]}>
              <View style={styles.infoHeader}>
                <Feather name="star" size={18} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <ThemedText style={[styles.infoTitle, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                  Traditional Mien Wedding Attire
                </ThemedText>
              </View>
              <ThemedText style={[styles.infoText, { color: theme.text }]}>
                The ceremonial wedding attire features elaborate embroidery, intricate silver jewelry, and a distinctive turban. These elements represent the rich cultural heritage of the Mien people.
              </ThemedText>
            </View>
            ) : null}

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
          </View>
        ) : null}
      </ScrollView>
      <CreditIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
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
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  uploadContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  imagePreview: {
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 300,
  },
  removeButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: Spacing.sm,
  },
  pickOptionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.lg,
  },
  pickOption: {
    alignItems: "center",
    flex: 1,
  },
  optionDivider: {
    width: 1,
    height: 80,
    marginHorizontal: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  pickOptionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  instructionsContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  instructionsInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  makeMeMienButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
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
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  resultSection: {
    marginTop: Spacing.xl,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  iterationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  iterationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  resultCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  resultImage: {
    width: "100%",
    height: 400,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  refinementContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  refinementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  refinementTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  refinementHint: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  refinementInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  refineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  refineButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
  },
  newImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  newImageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  movieStarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    alignSelf: "center",
    width: "80%",
  },
  movieStarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  movieStarTextContainer: {
    flex: 1,
  },
  movieStarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  movieStarSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  movieStarBadge: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  movieStarBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  collectionsButton: {
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
    fontWeight: "600",
  },
  videoButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  videoButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  videoButtonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  videoButtonSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  videoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  videoBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
