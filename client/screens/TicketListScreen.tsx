import React, { useState, useCallback } from "react";
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
  Modal,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest, createAuthQueryFn } from "@/lib/query-client";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const TICKET_CATEGORIES = [
  { value: "general", label: "General Inquiry" },
  { value: "technical", label: "Technical Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "bug", label: "Bug Report" },
  { value: "account", label: "Account Issue" },
];

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "resolved" | "pending";
  createdAt: string;
  updatedAt: string;
}

export default function TicketListScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");

  const { data: tickets, isLoading, refetch, isRefetching } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    queryFn: createAuthQueryFn<Ticket[]>(sessionToken),
    enabled: !!sessionToken,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; body: string; category: string }) => {
      const response = await apiRequest("POST", "/api/tickets", data, { token: sessionToken });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setShowCreateModal(false);
      setSubject("");
      setDescription("");
      setCategory("general");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Your ticket has been created.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create ticket. Please try again.");
    },
  });

  const handleCreateTicket = () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert("Required Fields", "Please fill in both subject and description.");
      return;
    }
    createTicketMutation.mutate({
      subject: subject.trim(),
      body: description.trim(),
      category,
    });
  };

  const handleOpenTicket = async (ticket: Ticket) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("TicketDetail", { ticketId: ticket.id, subject: ticket.subject });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return Colors.light.success;
      case "resolved":
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
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    });
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <Pressable
      style={({ pressed }) => [
        styles.ticketCard,
        { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => handleOpenTicket(item)}
    >
      <View style={styles.ticketHeader}>
        <ThemedText style={styles.ticketSubject} numberOfLines={1}>
          {item.subject}
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <ThemedText
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.ticketFooter}>
        <ThemedText style={[styles.ticketDate, { color: theme.textSecondary }]}>
          Created {formatDate(item.createdAt)}
        </ThemedText>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20" },
        ]}
      >
        <Feather
          name="inbox"
          size={48}
          color={isDark ? Colors.dark.primary : Colors.light.primary}
        />
      </View>
      <ThemedText style={styles.emptyTitle}>No tickets yet</ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        Create a new support ticket to get help from our team.
      </ThemedText>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>New Ticket</ThemedText>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <KeyboardAwareScrollViewCompat
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalFormContainer}
          >
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Category
            </ThemedText>
            <View style={styles.categoryContainer}>
              {TICKET_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === cat.value
                          ? (isDark ? Colors.dark.primary : Colors.light.primary)
                          : theme.backgroundSecondary,
                      borderColor:
                        category === cat.value
                          ? (isDark ? Colors.dark.primary : Colors.light.primary)
                          : theme.border,
                    },
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <ThemedText
                    style={[
                      styles.categoryChipText,
                      {
                        color: category === cat.value ? "#FFFFFF" : theme.text,
                      },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Subject
            </ThemedText>
            <TextInput
              style={[
                styles.subjectInput,
                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Brief summary of your issue"
              placeholderTextColor={theme.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />

            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Description
            </ThemedText>
            <TextInput
              style={[
                styles.descriptionInput,
                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                {
                  backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={handleCreateTicket}
              disabled={createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.createButtonText}>Submit Ticket</ThemedText>
                </>
              )}
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
      </View>
    );
  }

  const ticketList = tickets || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={ticketList}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? Colors.dark.primary : Colors.light.primary}
          />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
            bottom: tabBarHeight + Spacing.lg,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          setShowCreateModal(true);
        }}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      {renderCreateModal()}
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
  ticketCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: Spacing.sm,
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
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDate: {
    fontSize: 13,
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
  fab: {
    position: "absolute",
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
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalScrollView: {
    flex: 1,
  },
  modalFormContainer: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  subjectInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  descriptionInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 150,
    marginBottom: Spacing.lg,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
