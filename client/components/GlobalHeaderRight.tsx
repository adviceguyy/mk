import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { apiRequest } from "@/lib/query-client";

const iconSearch = require("@/assets/icon-search.png");

export function GlobalHeaderRight() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, sessionToken } = useAuth();

  // Fetch unread message count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/unread-count", undefined, {
        token: sessionToken,
      });
      return response.json();
    },
    enabled: !!sessionToken && !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadData?.count || 0;

  const isAdminOrModerator = user?.role === "admin" || user?.role === "moderator";

  const handleAdminPress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.dispatch(
      CommonActions.navigate({
        name: "AdminTab",
      })
    );
  };

  const handleSearchPress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.dispatch(
      CommonActions.navigate({
        name: "CommunityTab",
        params: {
          screen: "Search",
        },
      })
    );
  };

  const handleMessagesPress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!user) {
      navigation.dispatch(
        CommonActions.navigate({
          name: "Welcome",
        })
      );
      return;
    }
    navigation.dispatch(
      CommonActions.navigate({
        name: "MessagesTab",
      })
    );
  };

  return (
    <View style={styles.container}>
      {isAdminOrModerator && (
        <Pressable
          onPress={handleAdminPress}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="shield" size={22} color={theme.text} />
        </Pressable>
      )}

      <Pressable
        onPress={handleSearchPress}
        style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Image source={iconSearch} style={styles.searchIcon} contentFit="contain" />
      </Pressable>

      <Pressable
        onPress={handleMessagesPress}
        style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View>
          <Feather name="inbox" size={22} color={theme.text} />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  searchIcon: {
    width: 28,
    height: 28,
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
