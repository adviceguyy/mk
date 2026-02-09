import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest } from "@/lib/query-client";
import type { MessagingStackParamList } from "@/navigation/MessagingStackNavigator";

interface Participant {
  id: string;
  displayName: string;
  avatar: string | null;
}

interface LastMessage {
  id: string;
  senderId: string;
  encryptedContent: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string | null;
  createdAt: string;
  participant: Participant;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface Friend {
  id: string;
  displayName: string;
  avatar: string | null;
}

type NavigationProp = NativeStackNavigationProp<MessagingStackParamList, "Conversations">;

export default function ConversationListScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { sessionToken, user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["/api/messages/conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/conversations", undefined, {
        token: sessionToken,
      });
      return response.json();
    },
    enabled: !!sessionToken,
    refetchInterval: 30000,
  });

  // Fetch friends for new chat modal
  const { data: friendsData, isLoading: friendsLoading } = useQuery<{ friends: Friend[] }>({
    queryKey: ["/api/messages/friends"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/friends", undefined, {
        token: sessionToken,
      });
      return response.json();
    },
    enabled: !!sessionToken && showNewChatModal,
  });

  const conversations = conversationsData?.conversations || [];
  const friends = friendsData?.friends || [];

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleConversationPress = async (conversation: Conversation) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Chat", {
      conversationId: conversation.id,
      participantName: conversation.participant.displayName,
      participantId: conversation.participant.id,
      participantAvatar: conversation.participant.avatar || undefined,
    });
  };

  const handleNewChatPress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowNewChatModal(true);
  };

  const handleSelectFriend = async (friend: Friend) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowNewChatModal(false);

    // Create or get existing conversation
    try {
      const response = await apiRequest(
        "POST",
        "/api/messages/conversations",
        { participantId: friend.id },
        { token: sessionToken }
      );
      const data = await response.json();

      // Navigate to chat
      navigation.navigate("Chat", {
        conversationId: data.conversation.id,
        participantName: friend.displayName,
        participantId: friend.id,
        participantAvatar: friend.avatar || undefined,
      });

      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      style={({ pressed }) => [
        styles.conversationItem,
        { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
      ]}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatarContainer}>
        {item.participant.avatar ? (
          <Image
            source={{ uri: item.participant.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="user" size={24} color={theme.textSecondary} />
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: Colors.light.primary }]}>
            <ThemedText style={styles.unreadText}>
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <ThemedText
            style={[
              styles.participantName,
              item.unreadCount > 0 && styles.unreadName,
            ]}
            numberOfLines={1}
          >
            {item.participant.displayName}
          </ThemedText>
          {item.lastMessageAt && (
            <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
              {formatTime(item.lastMessageAt)}
            </ThemedText>
          )}
        </View>

        <ThemedText
          style={[
            styles.lastMessage,
            { color: item.unreadCount > 0 ? theme.text : theme.textSecondary },
            item.unreadCount > 0 && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage ? "[Encrypted message]" : "Start a conversation"}
        </ThemedText>
      </View>

      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  const renderFriend = ({ item }: { item: Friend }) => (
    <Pressable
      style={({ pressed }) => [
        styles.friendItem,
        { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
      ]}
      onPress={() => handleSelectFriend(item)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.friendAvatar} contentFit="cover" />
      ) : (
        <View style={[styles.friendAvatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="user" size={20} color={theme.textSecondary} />
        </View>
      )}
      <ThemedText style={styles.friendName}>{item.displayName}</ThemedText>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20" },
        ]}
      >
        <Feather
          name="message-circle"
          size={32}
          color={isDark ? Colors.dark.primary : Colors.light.primary}
        />
      </View>
      <ThemedText style={styles.emptyTitle}>No messages yet</ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        Start chatting with your friends by tapping the + button below
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + 80,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? Colors.dark.primary : Colors.light.primary}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
      />

      {/* Floating Action Button */}
      <Pressable
        style={[styles.fab, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
        onPress={handleNewChatPress}
      >
        <Feather name="edit" size={24} color="#FFFFFF" />
      </Pressable>

      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowNewChatModal(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>New Message</ThemedText>
              <Pressable onPress={() => setShowNewChatModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {friendsLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={isDark ? Colors.dark.primary : Colors.light.primary} />
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.noFriendsContainer}>
                <Feather name="users" size={48} color={theme.textSecondary} />
                <ThemedText style={[styles.noFriendsText, { color: theme.textSecondary }]}>
                  No friends yet. Follow people and have them follow you back to start messaging!
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={friends}
                renderItem={renderFriend}
                keyExtractor={(item) => item.id}
                style={styles.friendsList}
                ItemSeparatorComponent={() => (
                  <View style={[styles.separator, { backgroundColor: theme.border }]} />
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  unreadName: {
    fontWeight: "700",
  },
  timeText: {
    fontSize: 13,
    marginLeft: Spacing.sm,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginLeft: 88,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalLoading: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  friendAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
  },
  noFriendsContainer: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  noFriendsText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
