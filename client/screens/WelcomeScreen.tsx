import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/AuthContext";
import { AuthUser } from "@/lib/types";
import { SimpleDivider } from "@/components/MienPattern";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Provider = AuthUser["provider"];

// Google button with proper branding
function GoogleButton({ onPress, isLoading, disabled }: {
  onPress: () => void;
  isLoading: boolean;
  disabled: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.googleButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed || disabled ? 0.9 : 1,
          },
        ]}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {/* Google "G" icon */}
        <View style={styles.googleIconContainer}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <Path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <Path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <Path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </Svg>
        </View>

        <ThemedText style={[styles.googleButtonText, { color: theme.text }]}>
          Continue with Google
        </ThemedText>

        {isLoading && (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={styles.loader}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login, isLoading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const backgroundColor = isDark ? Colors.dark.backgroundRoot : Colors.light.backgroundRoot;

  const handleLogin = async (provider: Provider) => {
    setLoadingProvider(provider);
    setError(null);
    try {
      await login(provider);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Main Content */}
      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>

        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.symbolSection}
        >
          <Image
            source={require("@/assets/mien-kingdom-logo.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
        </Animated.View>

        {/* Brand Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.brandSection}
        >
          <View style={styles.dividerContainer}>
            <SimpleDivider width={120} color={primaryColor} />
          </View>

          <ThemedText style={[styles.tagline, { color: theme.textSecondary }]}>
            Connect with your community
          </ThemedText>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Login Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.loginSection}
        >
          {/* Error message */}
          {error && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[
                styles.errorContainer,
                { backgroundColor: isDark ? "#3B1818" : "#FEE2E2" },
              ]}
            >
              <Feather name="alert-circle" size={18} color={primaryColor} />
              <ThemedText style={[styles.errorText, { color: primaryColor }]}>
                {error}
              </ThemedText>
            </Animated.View>
          )}

          {/* Google Sign-in Button */}
          <GoogleButton
            onPress={() => handleLogin("google")}
            isLoading={loadingProvider === "google"}
            disabled={isLoading}
          />
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(600).duration(600)}
          style={styles.footer}
        >
          <ThemedText style={[styles.termsText, { color: theme.textSecondary }]}>
            By continuing, you agree to our
          </ThemedText>
          <View style={styles.termsLinks}>
            <Pressable>
              <ThemedText style={[styles.termsLink, { color: primaryColor }]}>
                Terms of Service
              </ThemedText>
            </Pressable>
            <ThemedText style={[styles.termsDot, { color: theme.textSecondary }]}>
              {" & "}
            </ThemedText>
            <Pressable>
              <ThemedText style={[styles.termsLink, { color: primaryColor }]}>
                Privacy Policy
              </ThemedText>
            </Pressable>
          </View>
          <Pressable
            style={styles.aboutLink}
            onPress={() => navigation.navigate("About")}
          >
            <ThemedText style={[styles.termsLink, { color: primaryColor }]}>
              About Mien Kingdom
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },

  // Logo
  symbolSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoImage: {
    width: 500,
    height: 200,
  },

  // Brand
  brandSection: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "Georgia, 'Times New Roman', serif",
    }),
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  dividerContainer: {
    marginBottom: Spacing.lg,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0.5,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Login
  loginSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 320,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    ...Shadows.small,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    marginRight: Spacing.md,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  loader: {
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    width: "100%",
    maxWidth: 320,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },

  // Footer
  footer: {
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    marginBottom: 4,
  },
  termsLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  termsLink: {
    fontSize: 12,
    fontWeight: "500",
  },
  termsDot: {
    fontSize: 12,
  },
  aboutLink: {
    marginTop: Spacing.md,
  },
});
