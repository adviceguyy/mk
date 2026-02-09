import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

export function CreditIndicator() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();

  if (!user) return null;

  const totalCredits = (user.credits ?? 0) + (user.packCredits ?? 0);
  const isUnlimited = totalCredits >= 99999;

  const handlePress = () => {
    navigation.navigate("ProfileTab" as never, {
      screen: "Subscription",
    } as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          bottom: tabBarHeight + insets.bottom + Spacing.md,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name="zap" size={16} color="#F59E0B" />
      <ThemedText style={styles.creditText}>
        {isUnlimited ? "Unlimited" : totalCredits}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creditText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
