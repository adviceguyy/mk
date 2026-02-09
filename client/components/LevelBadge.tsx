import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { getLevelBadgeColor } from "../../shared/xp-config";

interface LevelBadgeProps {
  level: number;
  size?: "small" | "medium" | "large";
}

const SIZES = {
  small: { height: 20, fontSize: 10, paddingH: 6 },
  medium: { height: 28, fontSize: 13, paddingH: 8 },
  large: { height: 36, fontSize: 16, paddingH: 10 },
};

export function LevelBadge({ level, size = "small" }: LevelBadgeProps) {
  const { bg, text } = getLevelBadgeColor(level);
  const dims = SIZES[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          height: dims.height,
          borderRadius: dims.height / 2,
          paddingHorizontal: dims.paddingH,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          { color: text, fontSize: dims.fontSize },
        ]}
      >
        Lv.{level}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
  },
});
