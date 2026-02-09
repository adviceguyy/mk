import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ANIMATED_GRADIENT_LEVEL, getLevelBadgeColor } from "../../shared/xp-config";

interface AnimatedAvatarProps {
  uri: string | null | undefined;
  size: number;
  level: number;
  style?: ViewStyle;
}

export function AnimatedAvatar({ uri, size, level, style }: AnimatedAvatarProps) {
  const rotation = useSharedValue(0);
  const showGradient = level >= ANIMATED_GRADIENT_LEVEL;
  const badgeColor = getLevelBadgeColor(level);

  useEffect(() => {
    if (showGradient) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [showGradient]);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!showGradient) {
    return (
      <View style={style}>
        <Image
          source={{ uri: uri || undefined }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      </View>
    );
  }

  const ringWidth = 3;
  const outerSize = size + ringWidth * 2;

  return (
    <View style={[{ width: outerSize, height: outerSize, alignItems: "center", justifyContent: "center" }, style]}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            overflow: "hidden",
          },
          animatedGradientStyle,
        ]}
      >
        <LinearGradient
          colors={badgeColor.gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Image
        source={{ uri: uri || undefined }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        contentFit="cover"
      />
    </View>
  );
}
