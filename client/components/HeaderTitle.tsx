import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const mienKingdomIcon = require("@/assets/mien-kingdom-logo.png");
const iconLanguage = require("@/assets/icon-language.png");
const iconArts = require("@/assets/icon-arts.png");
const iconFood = require("@/assets/icon-food.png");
const iconMenu = require("@/assets/icon-menu.png");

interface HeaderTitleProps {
  title: string;
  showIcon?: boolean;
  themed?: boolean;
}

const FEATURE_ICONS: Record<string, any> = {
  "Language": iconLanguage,
  "Mien Attire and Photo Restorations": iconArts,
  "Arts": iconArts,
  "Recipe": iconFood,
  "Food": iconFood,
  "Menu": iconMenu,
};

export function HeaderTitle({ title, showIcon = true, themed = false }: HeaderTitleProps) {
  const { theme, isDark } = useTheme();

  // Use Mien Kingdom icon for "Mien Kingdom" title or empty title (home screen)
  if (title === "Mien Kingdom" || title === "") {
    return (
      <View style={styles.container}>
        <Image
          source={mienKingdomIcon}
          style={styles.mienKingdomIcon}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Use feature icons for feature pages
  const featureIcon = FEATURE_ICONS[title];
  if (featureIcon) {
    return (
      <View style={styles.container}>
        <Image
          source={featureIcon}
          style={styles.featureIcon}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showIcon && (
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      )}
      <ThemedText style={[styles.title, { color: themed ? (isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold) : theme.text }]}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  mienKingdomIcon: {
    width: 320,
    height: 80,
  },
  featureIcon: {
    width: 78,
    height: 78,
  },
});
