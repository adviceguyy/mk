import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, Platform, ActivityIndicator, FlatList } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type SupportMode = "select" | "askAI";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const HELP_CONTEXT = `# How Credits Work
Credits are used to access AI-powered features in Mien Kingdom.
Credit Costs: Translation 1 credit, Recipe Analysis 2 credits, Dress Me 3 credits, Photo Restore 3 credits.
Tiers: Free 30 credits, Starter $5/mo 50 credits, Plus $15/mo 200 credits, Pro $30/mo 500 credits, Enterprise $60/mo Unlimited.

# App Features
Translation: Translate Mien language to English with IuMiNR script support.
Food & Recipes: Upload food photos or describe dishes for AI recipes.
Arts: Dress Me transforms you into Mien wedding attire, Photo Restore colorizes vintage photos.
Social Feed: Post text, images, videos with rich formatting.

# Account FAQs
Edit Profile: Menu > Edit Profile. Upgrade subscription: Menu > Subscription.
Google authentication supported. Contact support via Menu > Contact Us.

# Terms of Service
Be respectful, don't post offensive content, don't spam.
You retain content ownership. AI features use third-party services.`;

export default function SupportScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const flatListRef = useRef<FlatList>(null);

  const isPaidTier = user?.tierSlug && user.tierSlug !== "free";
  const isAdminOrModerator = user?.role === "admin" || user?.role === "moderator";
  const canAccessTickets = isPaidTier || isAdminOrModerator;

  const [mode, setMode] = useState<SupportMode>("select");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queriesRemaining, setQueriesRemaining] = useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (mode === "askAI") {
      fetchQueryCount();
    }
  }, [mode]);

  const fetchQueryCount = async () => {
    try {
      const response = await apiRequest("GET", "/api/help/query-count");
      const data = await response.json();
      setQueriesRemaining(30 - (data.count || 0));
    } catch (error) {
      setQueriesRemaining(30);
    }
  };

  const handleNavigateToTickets = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("TicketList");
  };

  const handleSelectMode = async (selectedMode: SupportMode) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMode(selectedMode);
  };

  const handleBackToSelect = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMode("select");
    setChatMessages([]);
    setInputText("");
    setFailedAttempts(0);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    if (queriesRemaining !== null && queriesRemaining <= 0) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "You've reached your daily limit of 30 questions. Please try again tomorrow or create a support ticket for urgent issues.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/help/chat", {
        message: inputText.trim(),
        context: HELP_CONTEXT,
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, I couldn't find a helpful answer. Would you like to create a support ticket?",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
      setQueriesRemaining((prev) => (prev !== null ? prev - 1 : null));

      if (data.response?.includes("couldn't find") || data.response?.includes("not sure")) {
        setFailedAttempts((prev) => prev + 1);
      } else {
        setFailedAttempts(0);
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again or create a support ticket.",
          timestamp: new Date(),
        },
      ]);
      setFailedAttempts((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate("TicketList");
  };

  const renderAskAIMode = () => (
    <View style={styles.chatContainer}>
      <View style={[styles.chatHeader, { backgroundColor: theme.surface }]}>
        <Pressable onPress={handleBackToSelect} style={styles.backArrow}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.chatHeaderContent}>
          <ThemedText style={styles.chatHeaderTitle}>Chat</ThemedText>
          {queriesRemaining !== null && (
            <ThemedText style={[styles.queryCountText, { color: theme.textSecondary }]}>
              {queriesRemaining} questions remaining today
            </ThemedText>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Feather name="message-circle" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyChatTitle, { color: theme.textSecondary }]}>
              Ask me anything
            </ThemedText>
            <ThemedText style={[styles.emptyChatSubtitle, { color: theme.textSecondary }]}>
              I can help with questions about credits, features, your account, and more.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === "user"
                ? [styles.userBubble, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]
                : [styles.assistantBubble, { backgroundColor: theme.surface }],
            ]}
          >
            <ThemedText
              style={[
                styles.messageText,
                item.role === "user" ? { color: "#FFF" } : { color: theme.text },
              ]}
            >
              {item.content}
            </ThemedText>
          </View>
        )}
      />

      {failedAttempts >= 2 && canAccessTickets && (
        <Pressable
          style={[styles.ticketPrompt, { backgroundColor: "#F59E0B20", marginHorizontal: Spacing.lg }]}
          onPress={handleCreateTicket}
        >
          <Feather name="alert-circle" size={20} color="#F59E0B" />
          <View style={styles.ticketPromptContent}>
            <ThemedText style={styles.ticketPromptTitle}>Still need help?</ThemedText>
            <ThemedText style={[styles.ticketPromptSubtitle, { color: theme.textSecondary }]}>
              Create a support ticket for personalized assistance
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color="#F59E0B" />
        </Pressable>
      )}

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          style={[styles.textInput, { color: theme.text }]}
          placeholder="Type your question..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
          editable={!isLoading}
        />
        <Pressable
          style={[
            styles.sendButton,
            { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary },
            (!inputText.trim() || isLoading) && { opacity: 0.5 },
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Feather name="send" size={18} color="#FFF" />
          )}
        </Pressable>
      </View>
    </View>
  );

  const renderSelectMode = () => (
    <View style={styles.selectContainer}>
      <View style={[styles.headerCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20" }]}>
          <Feather name="headphones" size={32} color={isDark ? Colors.dark.primary : Colors.light.primary} />
        </View>
        <ThemedText style={styles.headerTitle}>How can we help?</ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Choose how you'd like to get support
        </ThemedText>
      </View>

      <View style={styles.optionsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => handleSelectMode("askAI")}
        >
          <View style={[styles.optionIcon, { backgroundColor: "#10B98120" }]}>
            <Feather name="cpu" size={28} color="#10B981" />
          </View>
          <View style={styles.optionContent}>
            <ThemedText style={styles.optionTitle}>Chat</ThemedText>
            <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
              Get instant answers powered by AI
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        {canAccessTickets ? (
          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleNavigateToTickets}
          >
            <View style={[styles.optionIcon, { backgroundColor: "#8B5CF620" }]}>
              <Feather name="file-text" size={28} color="#8B5CF6" />
            </View>
            <View style={styles.optionContent}>
              <ThemedText style={styles.optionTitle}>My Tickets</ThemedText>
              <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
                View and manage your support tickets
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="info" size={20} color={theme.textSecondary} />
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
          {canAccessTickets 
            ? "Chat with AI for quick answers or create a ticket for personalized support"
            : "Chat with AI for quick answers. Upgrade to access ticket support."}
        </ThemedText>
      </View>

      {!canAccessTickets ? (
        <View style={[styles.upgradeCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.upgradeIconContainer, { backgroundColor: "#F59E0B20" }]}>
            <Feather name="star" size={24} color="#F59E0B" />
          </View>
          <View style={styles.upgradeContent}>
            <ThemedText style={styles.upgradeTitle}>Upgrade for Ticket Support</ThemedText>
            <ThemedText style={[styles.upgradeDescription, { color: theme.textSecondary }]}>
              Paid subscribers get access to a dedicated ticket system with faster response times
            </ThemedText>
          </View>
        </View>
      ) : null}
    </View>
  );

  if (mode === "askAI") {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: headerHeight,
            paddingBottom: tabBarHeight + Spacing.md,
          },
        ]}
      >
        {renderAskAIMode()}
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      {renderSelectMode()}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  selectContainer: {
    gap: Spacing.lg,
  },
  headerCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  upgradeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 13,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  backArrow: {
    padding: Spacing.xs,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  queryCountText: {
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
  },
  emptyChat: {
    alignItems: "center",
    paddingTop: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyChatSubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  ticketPrompt: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  ticketPromptContent: {
    flex: 1,
  },
  ticketPromptTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  ticketPromptSubtitle: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
