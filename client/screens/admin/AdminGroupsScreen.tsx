import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Modal, TextInput, ActivityIndicator, Alert, ImageBackground } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getApiUrl } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

const fetchGroups = async (): Promise<Group[]> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/groups", getApiUrl()).toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }
  const data = await response.json();
  return data.groups.map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description || "",
    memberCount: 0,
  }));
};

const createGroup = async (data: { name: string; description: string }): Promise<Group> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/groups", getApiUrl()).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create group");
  }
  return response.json();
};

const updateGroup = async ({ id, ...data }: { id: string; name: string; description: string }): Promise<Group> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/groups/${id}`, getApiUrl()).toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update group");
  }
  return response.json();
};

const deleteGroup = async (id: string): Promise<void> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/groups/${id}`, getApiUrl()).toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete group");
  }
};

export default function AdminGroupsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: groups, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/groups"],
    queryFn: fetchGroups,
  });

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      closeModal();
    },
    onError: () => {
      Alert.alert("Error", "Failed to create group");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      closeModal();
    },
    onError: () => {
      Alert.alert("Error", "Failed to update group");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete group");
    },
  });

  const openCreateModal = () => {
    setEditingGroup(null);
    setName("");
    setDescription("");
    setModalVisible(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingGroup(null);
    setName("");
    setDescription("");
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, name: name.trim(), description: description.trim() });
    } else {
      createMutation.mutate({ name: name.trim(), description: description.trim() });
    }
  };

  const handleDelete = (group: Group) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(group.id),
        },
      ]
    );
  };

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const renderGroup = ({ item }: { item: Group }) => (
    <Pressable
      style={({ pressed }) => [
        styles.groupCard,
        { backgroundColor: theme.surface, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => openEditModal(item)}
    >
      <View style={[styles.groupIcon, { backgroundColor: primaryColor + "20" }]}>
        <Feather name="folder" size={24} color={primaryColor} />
      </View>
      <View style={styles.groupInfo}>
        <ThemedText style={styles.groupName}>{item.name}</ThemedText>
        <ThemedText style={[styles.groupDescription, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.description || "No description"}
        </ThemedText>
        <ThemedText style={[styles.memberCount, { color: theme.textSecondary }]}>
          {item.memberCount} {item.memberCount === 1 ? "member" : "members"}
        </ThemedText>
      </View>
      <Pressable
        style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}
        onPress={() => handleDelete(item)}
      >
        <Feather name="trash-2" size={20} color={theme.error} />
      </Pressable>
    </Pressable>
  );

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <View style={[styles.container, { backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }]}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={[styles.errorText, { color: theme.error }]}>Failed to load groups</ThemedText>
          <Pressable style={[styles.retryButton, { backgroundColor: primaryColor }]} onPress={() => refetch()}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 60,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="folder" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No groups yet</ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Create your first group to get started
              </ThemedText>
            </View>
          }
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1, bottom: tabBarHeight + Spacing.xl },
        ]}
        onPress={openCreateModal}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <ThemedText style={styles.modalTitle}>
              {editingGroup ? "Edit Group" : "Create Group"}
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter group name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter group description"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={closeModal}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: primaryColor }]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={{ color: "#FFFFFF" }}>{editingGroup ? "Save" : "Create"}</ThemedText>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
  },
  groupDescription: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  memberCount: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: Spacing["3xl"],
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
