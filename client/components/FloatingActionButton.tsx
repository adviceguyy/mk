import React, { memo } from "react";
import { StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, Shadows, Colors } from "@/constants/theme";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  bottom?: number;
}

export const FloatingActionButton = memo(function FloatingActionButton({
  onPress,
  icon = "plus",
  bottom = 100,
}: FloatingActionButtonProps) {
  const { isDark } = useTheme();
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    rotate.value = withSpring(90, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    rotate.value = withSpring(0, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={[styles.container, { bottom }, animatedStyle]}>
      {/* Shadow layer */}
      <Animated.View style={[styles.shadow, { backgroundColor: "rgba(0,0,0,0.15)" }]} />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, { backgroundColor: primaryColor }]}
      >
        <Feather name={icon} size={26} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
});

const FAB_SIZE = 60;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: Spacing.lg,
    zIndex: 100,
  },
  shadow: {
    position: "absolute",
    top: 4,
    left: 4,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
  },
  button: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.large,
  },
});

export default FloatingActionButton;
