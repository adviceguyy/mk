import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest, createAuthQueryFn } from "@/lib/query-client";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General Inquiry",
  technical: "Technical Support",
  billing: "Billing & Payments",
  feedback: "Feedback & Suggestions",
  bug: "Bug Report",
  account: "Account Issue",
};

interface Message {
  id: string;
  content: string;
  message?: string; // Legacy field
  senderType: "user" | "support" | "agent" | "system";
  senderEmail?: string;
  createdAt: string;
}

interface TicketDetails {
  id: string;
  subject: string;
  body?: string;
  status: string;
  priority: string;
  category: string;
  messages: Message[];
  createdAt: string;
  updatedAt?: string;
}

export default function TicketDetailScreen() {
  const route = useRoute<RouteProp<ProfileStackParamList, "TicketDetail">>();
  const { ticketId } = route.params;

  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [replyText, setReplyText] = useState("");

  const { data: ticketData, isLoading, refetch, isRefetching } = useQuery<TicketDetails>({
    queryKey: ["/api/tickets", ticketId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}`, undefined, { token: sessionToken });
      return response.json();
    },
    enabled: !!sessionToken,
    refetchInterval: 30000,
  });

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/reply`, { message }, { token: sessionToken });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      setReplyText("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: () => {
      Alert.alert("Error", "Failed to send reply. Please try again.");
    },
  });

  const handleSendReply = () => {
    if (!replyText.trim()) {
      return;
    }
    replyMutation.mutate(replyText.trim());
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Compare dates in Pacific time
    const dateInPT = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const todayInPT = new Date(today.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const yesterdayInPT = new Date(yesterday.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));

    if (dateInPT.toDateString() === todayInPT.toDateString()) {
      return "Today";
    } else if (dateInPT.toDateString() === yesterdayInPT.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return Colors.light.success;
      case "resolved":
      case "closed":
        return theme.textSecondary;
      case "pending":
        return "#F59E0B";
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "resolved":
        return "Resolved";
      case "closed":
        return "Closed";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "#EF4444";
      case "high":
        return "#F97316";
      case "medium":
        return "#F59E0B";
      case "low":
      default:
        return theme.textSecondary;
    }
  };

  const messages = ticketData?.messages || [];

  const renderTicketHeader = () => {
    if (!ticketData) return null;

    return (
      <View style={[styles.ticketHeader, { backgroundColor: theme.surface }]}>
        <View style={styles.ticketHeaderTop}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(ticketData.status) + "20" },
            ]}
          >
            <ThemedText
              style={[styles.statusText, { color: getStatusColor(ticketData.status) }]}
            >
              {getStatusLabel(ticketData.status)}
            </ThemedText>
          </View>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.categoryText, { color: theme.textSecondary }]}>
              {CATEGORY_LABELS[ticketData.category] || ticketData.category}
            </ThemedText>
          </View>
        </View>

        {ticketData.body ? (
          <View style={styles.ticketBodyContainer}>
            <ThemedText style={[styles.ticketBodyLabel, { color: theme.textSecondary }]}>
              Description
            </ThemedText>
            <ThemedText style={[styles.ticketBody, { color: theme.text }]}>
              {ticketData.body}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.ticketMeta}>
          <View style={styles.ticketMetaItem}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.ticketMetaText, { color: theme.textSecondary }]}>
              Created {formatFullDate(ticketData.createdAt)}
            </ThemedText>
          </View>
          {ticketData.priority && ticketData.priority !== "low" && (
            <View style={styles.ticketMetaItem}>
              <Feather name="flag" size={14} color={getPriorityColor(ticketData.priority)} />
              <ThemedText
                style={[styles.ticketMetaText, { color: getPriorityColor(ticketData.priority) }]}
              >
                {ticketData.priority.charAt(0).toUpperCase() + ticketData.priority.slice(1)} Priority
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.senderType === "user";
    const isSupport = item.senderType === "support" || item.senderType === "agent";
    const isSystem = item.senderType === "system";
    const messageContent = item.content || item.message || "";
    const showDateHeader =
      index === 0 ||
      formatDate(messages[index - 1].createdAt) !== formatDate(item.createdAt);

    if (isSystem) {
      return (
        <View>
          {showDateHeader ? (
            <View style={styles.dateHeader}>
              <ThemedText style={[styles.dateHeaderText, { color: theme.textSecondary }]}>
                {formatDate(item.createdAt)}
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.systemMessageContainer}>
            <ThemedText style={[styles.systemMessageText, { color: theme.textSecondary }]}>
              {messageContent}
            </ThemedText>
          </View>
        </View>
      );
    }

    return (
      <View>
        {showDateHeader ? (
          <View style={styles.dateHeader}>
            <ThemedText style={[styles.dateHeaderText, { color: theme.textSecondary }]}>
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
        ) : null}
        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessageContainer : styles.supportMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isUser
                ? [styles.userBubble, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]
                : [styles.supportBubble, { backgroundColor: theme.surface }],
            ]}
          >
            {isSupport ? (
              <ThemedText style={[styles.senderName, { color: theme.textSecondary }]}>
                Support
              </ThemedText>
            ) : null}
            <ThemedText
              style={[
                styles.messageText,
                { color: isUser ? "#FFFFFF" : theme.text },
              ]}
            >
              {messageContent}
            </ThemedText>
            <ThemedText
              style={[
                styles.messageTime,
                { color: isUser ? "rgba(255,255,255,0.7)" : theme.textSecondary },
              ]}
            >
              {formatTime(item.createdAt)}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyMessages = () => (
    <View style={styles.emptyMessagesContainer}>
      <View
        style={[
          styles.emptyMessagesIcon,
          { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20" },
        ]}
      >
        <Feather
          name="message-circle"
          size={28}
          color={isDark ? Colors.dark.primary : Colors.light.primary}
        />
      </View>
      <ThemedText style={styles.emptyMessagesTitle}>No replies yet</ThemedText>
      <ThemedText style={[styles.emptyMessagesDescription, { color: theme.textSecondary }]}>
        Our support team will respond to your ticket soon.
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
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + 100,
          paddingHorizontal: Spacing.md,
          flexGrow: 1,
        }}
        ListHeaderComponent={renderTicketHeader}
        ListEmptyComponent={renderEmptyMessages}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? Colors.dark.primary : Colors.light.primary}
          />
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: tabBarHeight + Spacing.md,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="Type your reply..."
          placeholderTextColor={theme.textSecondary}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: replyText.trim()
                ? isDark
                  ? Colors.dark.primary
                  : Colors.light.primary
                : theme.backgroundSecondary,
              opacity: pressed && replyText.trim() ? 0.9 : 1,
            },
          ]}
          onPress={handleSendReply}
          disabled={!replyText.trim() || replyMutation.isPending}
        >
          {replyMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Feather
              name="send"
              size={20}
              color={replyText.trim() ? "#FFFFFF" : theme.textSecondary}
            />
          )}
        </Pressable>
      </View>
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
  ticketHeader: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  ticketHeaderTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  ticketBodyContainer: {
    marginBottom: Spacing.md,
  },
  ticketBodyLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  ticketMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  ticketMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ticketMetaText: {
    fontSize: 12,
  },
  emptyMessagesContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyMessagesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyMessagesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  emptyMessagesDescription: {
    fontSize: 14,
    textAlign: "center",
  },
  dateHeader: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: "500",
  },
  messageContainer: {
    marginBottom: Spacing.sm,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  supportMessageContainer: {
    alignItems: "flex-start",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  systemMessageText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
