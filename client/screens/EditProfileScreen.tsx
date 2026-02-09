import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform, ActivityIndicator, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

const mienPatternBg = require("@/assets/mien-pattern.png");

type EditProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, "EditProfile">;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<EditProfileNavigationProp>();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUri, setAvatarUri] = useState(user?.avatar || "");
  const [newAvatarFile, setNewAvatarFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to change your avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewAvatarFile(result.assets[0]);
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error picking image:", err);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!newAvatarFile) return null;

    const token = await AsyncStorage.getItem("@mien_kingdom_session");
    const formData = new FormData();

    const filename = newAvatarFile.uri.split("/").pop() || `avatar-${Date.now()}.jpg`;

    if (Platform.OS === "web") {
      const response = await fetch(newAvatarFile.uri);
      const blob = await response.blob();
      formData.append("avatar", blob, filename);
    } else {
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("avatar", {
        uri: newAvatarFile.uri,
        name: filename,
        type,
      } as unknown as Blob);
    }

    const response = await fetch(new URL("/api/users/me/avatar", getApiUrl()).toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to upload avatar");
    }

    const data = await response.json();
    return data.avatar;
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (displayName.trim().length > 100) {
      setError("Display name must be 100 characters or less");
      return;
    }

    if (bio.length > 500) {
      setError("Bio must be 500 characters or less");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Upload avatar first if changed
      let newAvatarUrl = null;
      if (newAvatarFile) {
        newAvatarUrl = await uploadAvatar();
      }

      // Update profile
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      const updateData: Record<string, string | null> = {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
      };

      if (newAvatarUrl) {
        updateData.avatar = newAvatarUrl;
      }

      const response = await fetch(new URL("/api/users/me", getApiUrl()).toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await response.json();

      // Update local auth context
      await updateUser({
        displayName: data.user.displayName,
        avatar: data.user.avatar || user?.avatar,
        bio: data.user.bio,
      });

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={[styles.avatarSection, { backgroundColor: theme.surface }]}>
          <Pressable onPress={handlePickImage} style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUri || "https://via.placeholder.com/120" }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={[styles.avatarOverlay, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
              <Feather name="camera" size={24} color="#FFFFFF" />
            </View>
          </Pressable>
          <ThemedText style={[styles.avatarHint, { color: theme.textSecondary }]}>
            Tap to change photo
          </ThemedText>
        </View>

        <View style={[styles.formSection, { backgroundColor: theme.surface }]}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Display Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor={theme.textSecondary}
              maxLength={100}
            />
            <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
              {displayName.length}/100
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Bio</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
              {bio.length}/500
            </ThemedText>
          </View>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + "15" }]}>
            <Feather name="alert-circle" size={16} color={theme.error} />
            <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
              opacity: pressed || isSubmitting ? 0.8 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={20} color="#FFFFFF" />
              <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
            </>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  formSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
