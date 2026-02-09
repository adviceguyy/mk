import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { MessagingStackParamList } from "@/navigation/MessagingStackNavigator";
import {
  encryptMessageForConversation,
  decryptMessageFromConversation,
  initializeEncryption,
  generateKeyBundle,
  setupConversationEncryption,
  getConversationKey,
} from "@/lib/encryption";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  encryptedContent: string;
  encryptedContentIv: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  // Decrypted content (client-side only)
  decryptedContent?: string;
}

type RouteProps = RouteProp<MessagingStackParamList, "Chat">;

export default function ChatScreen() {
  const route = useRoute<RouteProps>();
  const { conversationId, participantName, participantId, participantAvatar } = route.params;

  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [messageText, setMessageText] = useState("");
  const [peerPublicKey, setPeerPublicKey] = useState<string | null>(null);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);
  const [encryptionError, setEncryptionError] = useState<string | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize encryption and fetch peer's public key
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const maxRetries = 10;

    const setupEncryption = async () => {
      try {
        setEncryptionError(null);

        // Initialize our keys
        const myKeys = await initializeEncryption();

        // Upload our keys if needed
        const existingKeysRes = await apiRequest("GET", "/api/messages/keys", undefined, {
          token: sessionToken,
        });
        const existingKeysData = await existingKeysRes.json();

        if (!existingKeysData.keys) {
          const keyBundle = await generateKeyBundle();
          await apiRequest("POST", "/api/messages/keys", keyBundle, { token: sessionToken });
        }

        // Fetch peer's public key
        const peerKeysRes = await apiRequest(
          "GET",
          `/api/messages/keys/${participantId}`,
          undefined,
          { token: sessionToken }
        );

        if (peerKeysRes.ok) {
          const peerKeysData = await peerKeysRes.json();
          setPeerPublicKey(peerKeysData.publicKey);

          // Setup conversation encryption
          await setupConversationEncryption(conversationId, peerKeysData.publicKey);
          setIsEncryptionReady(true);
          setEncryptionError(null);
        } else {
          console.log("Peer has not set up encryption keys yet, retrying...");
          setIsEncryptionReady(false);

          // Retry with exponential backoff
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.min(2000 * retryCount, 10000); // Max 10 seconds
            setEncryptionError(`Waiting for ${participantName} to set up encryption...`);
            retryTimeout = setTimeout(setupEncryption, delay);
          } else {
            setEncryptionError(`${participantName} hasn't set up messaging yet. They need to open their messages first.`);
          }
        }
      } catch (error) {
        console.error("Failed to setup encryption:", error);
        setEncryptionError("Failed to set up encryption. Please try again.");
      }
    };

    setupEncryption();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [conversationId, participantId, participantName, sessionToken]);

  // Setup WebSocket connection
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      if (!token) return;

      const wsProtocol = getApiUrl().startsWith("https") ? "wss" : "ws";
      const wsUrl = `${wsProtocol}://${getApiUrl().replace(/^https?:\/\//, "")}/ws/messages?token=${token}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "new_message" && data.conversationId === conversationId) {
            // Refresh messages when we receive a new one
            queryClient.invalidateQueries({
              queryKey: ["/api/messages/conversations", conversationId, "messages"],
            });
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversationId, queryClient]);

  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<{ messages: Message[] }>({
    queryKey: ["/api/messages/conversations", conversationId, "messages"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/messages/conversations/${conversationId}/messages`,
        undefined,
        { token: sessionToken }
      );
      return response.json();
    },
    enabled: !!sessionToken,
    refetchInterval: 10000,
  });

  // Decrypt messages when they load
  useEffect(() => {
    const decryptMessages = async () => {
      if (!messagesData?.messages || !isEncryptionReady || !peerPublicKey) return;

      const newDecrypted = new Map(decryptedMessages);

      for (const msg of messagesData.messages) {
        if (!newDecrypted.has(msg.id)) {
          try {
            const decrypted = await decryptMessageFromConversation(
              conversationId,
              {
                ciphertext: msg.encryptedContent,
                iv: msg.encryptedContentIv,
              },
              peerPublicKey
            );
            newDecrypted.set(msg.id, decrypted);
          } catch (error) {
            console.error("Failed to decrypt message:", msg.id, error);
            newDecrypted.set(msg.id, "[Unable to decrypt]");
          }
        }
      }

      setDecryptedMessages(newDecrypted);
    };

    decryptMessages();
  }, [messagesData, isEncryptionReady, peerPublicKey, conversationId]);

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!messagesData?.messages || messagesData.messages.length === 0) return;

      const unreadFromOther = messagesData.messages.filter(
        (m) => !m.isRead && m.senderId !== user?.id
      );

      if (unreadFromOther.length > 0) {
        try {
          await apiRequest(
            "POST",
            `/api/messages/conversations/${conversationId}/read`,
            { messageIds: unreadFromOther.map((m) => m.id) },
            { token: sessionToken }
          );
          // Refresh unread count
          queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      }
    };

    markAsRead();
  }, [messagesData, conversationId, user?.id, sessionToken, queryClient]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!peerPublicKey) {
        throw new Error("Encryption not ready");
      }

      // Encrypt the message
      const encrypted = await encryptMessageForConversation(
        conversationId,
        content,
        peerPublicKey
      );

      const response = await apiRequest(
        "POST",
        `/api/messages/conversations/${conversationId}/messages`,
        {
          encryptedContent: encrypted.ciphertext,
          encryptedContentIv: encrypted.iv,
          messageType: "text",
        },
        { token: sessionToken }
      );

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/conversations", conversationId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setMessageText("");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Scroll to end
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  const handleSend = () => {
    const text = messageText.trim();
    if (!text || !isEncryptionReady) return;
    sendMutation.mutate(text);
  };

  const messages = messagesData?.messages || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const showDateHeader =
      index === 0 ||
      formatDate(messages[index - 1].createdAt) !== formatDate(item.createdAt);

    const decryptedContent = decryptedMessages.get(item.id) || "[Decrypting...]";

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <ThemedText style={[styles.dateHeaderText, { color: theme.textSecondary }]}>
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
        )}

        <View
          style={[
            styles.messageContainer,
            isMe ? styles.myMessageContainer : styles.theirMessageContainer,
          ]}
        >
          {!isMe && (
            <View style={styles.messageAvatarContainer}>
              {participantAvatar ? (
                <Image
                  source={{ uri: participantAvatar }}
                  style={styles.messageAvatar}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.messageAvatarPlaceholder,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <Feather name="user" size={12} color={theme.textSecondary} />
                </View>
              )}
            </View>
          )}

          <View
            style={[
              styles.messageBubble,
              isMe
                ? [
                    styles.myBubble,
                    { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary },
                  ]
                : [styles.theirBubble, { backgroundColor: theme.surface }],
            ]}
          >
            <ThemedText
              style={[
                styles.messageText,
                { color: isMe ? "#FFFFFF" : theme.text },
              ]}
            >
              {decryptedContent}
            </ThemedText>
            <View style={styles.messageFooter}>
              <ThemedText
                style={[
                  styles.messageTime,
                  { color: isMe ? "rgba(255,255,255,0.7)" : theme.textSecondary },
                ]}
              >
                {formatTime(item.createdAt)}
              </ThemedText>
              {isMe && (
                <Feather
                  name={item.isRead ? "check-circle" : "check"}
                  size={12}
                  color={item.isRead ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"}
                  style={styles.readIcon}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEncryptionBanner = () => (
    <View style={[styles.encryptionBanner, { backgroundColor: theme.surface }]}>
      <Feather
        name="lock"
        size={14}
        color={isDark ? Colors.dark.primary : Colors.light.primary}
      />
      <ThemedText style={[styles.encryptionText, { color: theme.textSecondary }]}>
        Messages are end-to-end encrypted
      </ThemedText>
    </View>
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
          size={28}
          color={isDark ? Colors.dark.primary : Colors.light.primary}
        />
      </View>
      <ThemedText style={styles.emptyTitle}>Start the conversation</ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        Send a message to {participantName}
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator
          size="large"
          color={isDark ? Colors.dark.primary : Colors.light.primary}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: Spacing.md,
          paddingHorizontal: Spacing.md,
          flexGrow: 1,
        }}
        ListHeaderComponent={renderEncryptionBanner}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? Colors.dark.primary : Colors.light.primary}
          />
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Input Bar */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: tabBarHeight + Spacing.sm,
            borderTopColor: theme.border,
          },
        ]}
      >
        {!isEncryptionReady ? (
          <View style={styles.encryptionPending}>
            {!encryptionError?.includes("hasn't set up") && (
              <ActivityIndicator
                size="small"
                color={isDark ? Colors.dark.primary : Colors.light.primary}
              />
            )}
            {encryptionError?.includes("hasn't set up") && (
              <Feather
                name="alert-circle"
                size={18}
                color={theme.textSecondary}
              />
            )}
            <ThemedText style={[styles.encryptionPendingText, { color: theme.textSecondary }]}>
              {encryptionError || "Setting up encryption..."}
            </ThemedText>
          </View>
        ) : (
          <>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={2000}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: messageText.trim()
                    ? isDark
                      ? Colors.dark.primary
                      : Colors.light.primary
                    : theme.backgroundSecondary,
                  opacity: pressed && messageText.trim() ? 0.9 : 1,
                },
              ]}
              onPress={handleSend}
              disabled={!messageText.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather
                  name="send"
                  size={20}
                  color={messageText.trim() ? "#FFFFFF" : theme.textSecondary}
                />
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
  encryptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  encryptionText: {
    fontSize: 12,
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
    flexDirection: "row",
    marginBottom: Spacing.sm,
    maxWidth: "85%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  theirMessageContainer: {
    alignSelf: "flex-start",
  },
  messageAvatarContainer: {
    marginRight: Spacing.xs,
    alignSelf: "flex-end",
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  messageAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  readIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    fontSize: 14,
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
    borderRadius: BorderRadius.lg,
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
  encryptionPending: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  encryptionPendingText: {
    fontSize: 14,
  },
});
