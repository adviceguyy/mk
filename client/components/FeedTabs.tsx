import React, { memo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

export type FeedTab = "forYou" | "following" | "trending";

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton = memo(function TabButton({ label, isActive, onPress }: TabButtonProps) {
  const { theme, isDark } = useTheme();
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? primaryColor : "transparent",
            borderColor: isActive ? primaryColor : theme.border,
            borderWidth: isActive ? 0 : 1,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.tabLabel,
            { color: isActive ? "#FFFFFF" : theme.textSecondary },
          ]}
        >
          {label}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
});

export const FeedTabs = memo(function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  const tabs: { key: FeedTab; label: string }[] = [
    { key: "forYou", label: "For You" },
    { key: "following", label: "Following" },
    { key: "trending", label: "Trending" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          label={tab.label}
          isActive={activeTab === tab.key}
          onPress={() => onTabChange(tab.key)}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tabButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 90,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default FeedTabs;
