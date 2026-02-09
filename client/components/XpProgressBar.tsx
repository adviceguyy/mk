import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { xpToNextLevel, getLevelBadgeColor } from "../../shared/xp-config";

interface XpProgressBarProps {
  totalXp: number;
  level: number;
}

export function XpProgressBar({ totalXp, level }: XpProgressBarProps) {
  const { theme } = useTheme();
  const progress = xpToNextLevel(totalXp);
  const badgeColor = getLevelBadgeColor(level);
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progress.progressPercent, { duration: 600 });
  }, [progress.progressPercent]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%` as any,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.levelText, { color: badgeColor.bg }]}>
          Level {level}
        </ThemedText>
        <ThemedText style={[styles.xpText, { color: theme.textSecondary }]}>
          {progress.xpIntoLevel}/{progress.xpNeededForLevel} XP
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSecondary }]}>
        <Animated.View style={[styles.fill, animatedStyle]}>
          <LinearGradient
            colors={[badgeColor.gradient[0], badgeColor.gradient[1]] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: "600",
  },
  xpText: {
    fontSize: 12,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
});
