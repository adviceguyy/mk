import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, TextInput, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";

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

export default function PhotoRestorationScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const { checkCreditError } = useCredits();

  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ uri: string; base64: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const totalCredits = (user?.credits ?? 0) + (user?.packCredits ?? 0);
  const photoCount = Math.floor(totalCredits / 5);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setError("Permission to access photos is required");
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
        setError(null);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (err) {
      setError("Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        setError("Permission to access camera is required");
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
        setError(null);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (err) {
      setError("Failed to take photo. Please try again.");
    }
  };

  const restorePhoto = async () => {
    const imageToUse = selectedImage?.base64;
    if (!imageToUse) {
      setError("Please select an image first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const response = await fetch(new URL("/api/restore-photo", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: imageToUse,
          additionalInstructions: additionalInstructions.trim(),
        }),
      });

      if (await checkCreditError(response)) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to restore photo");
      }

      const data = await response.json();
      const imageUri = `data:${data.mimeType};base64,${data.b64_json}`;
      setGeneratedImage({ uri: imageUri, base64: data.b64_json });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setError(err.message || "Failed to restore photo. Please try again.");
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
        link.download = `mien-restored-photo-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow access to save photos.");
          return;
        }

        const filename = `mien-restored-photo-${Date.now()}.png`;
        const fileUri = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, generatedImage.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await MediaLibrary.createAssetAsync(fileUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved", "Image saved to your photo library!");
      }
    } catch (err) {
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

      if (!uploadResponse.ok) throw new Error("Failed to upload image");
      const uploadData = await uploadResponse.json();

      const postResponse = await fetch(new URL("/api/posts", baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          caption: "Check out my restored photo!",
          images: uploadData.images,
        }),
      });

      if (!postResponse.ok) throw new Error("Failed to create post");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Posted", "Your restored photo has been shared to your feed!");
    } catch (err) {
      Alert.alert("Error", "Failed to share to feed. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setAdditionalInstructions("");
    setGeneratedImage(null);
    setError(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
      <ScrollView
        style={{ zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
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
                <View style={[styles.iconCircle, { backgroundColor: isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal }]}>
                  <Feather name="image" size={28} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.pickOptionText}>Photo Library</ThemedText>
              </Pressable>

              <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />

              <Pressable style={({ pressed }) => [styles.pickOption, { opacity: pressed ? 0.8 : 1 }]} onPress={takePhoto}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal }]}>
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
                placeholder="e.g., enhance colors, fix scratches..."
                placeholderTextColor={theme.textSecondary}
                value={additionalInstructions}
                onChangeText={setAdditionalInstructions}
                multiline
                numberOfLines={3}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.restoreButton,
                {
                  backgroundColor: isGenerating ? theme.backgroundSecondary : (isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal),
                  opacity: pressed && !isGenerating ? 0.9 : 1,
                },
              ]}
              onPress={restorePhoto}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText style={styles.restoreButtonText}>Restoring...</ThemedText>
                </>
              ) : (
                <>
                  <Feather name="image" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.restoreButtonText}>Restore Photo ({photoCount})</ThemedText>
                </>
              )}
            </Pressable>
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
            <ThemedText style={[styles.resultTitle, { color: theme.text }]}>
              Your Restored Photo
            </ThemedText>

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
            </View>

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
  headerSection: {
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: Spacing.xs,
  },
  pageDescription: {
    fontSize: 15,
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
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  restoreButtonText: {
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
  resultTitle: {
    fontSize: 20,
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
});
