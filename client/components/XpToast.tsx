import React, { useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";

interface XpToastProps {
  visible: boolean;
  xpAmount: number;
  leveledUp: boolean;
  newLevel?: number;
  onHide: () => void;
}

export function XpToast({ visible, xpAmount, leveledUp, newLevel, onHide }: XpToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(60, { duration: 300 }),
        withDelay(2200, withTiming(-100, { duration: 300 }))
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(2200, withTiming(0, { duration: 300 }, () => {
          runOnJS(onHide)();
        }))
      );

      if (leveledUp && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        leveledUp ? styles.levelUpContainer : styles.xpContainer,
        animatedStyle,
      ]}
    >
      <ThemedText style={styles.text}>
        {leveledUp
          ? `Level Up! Level ${newLevel}`
          : `+${xpAmount} XP`}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 60,
    alignItems: "center",
  },
  xpContainer: {
    backgroundColor: "rgba(0, 150, 100, 0.9)",
  },
  levelUpContainer: {
    backgroundColor: "rgba(220, 160, 0, 0.95)",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
