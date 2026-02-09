import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Modal, ActivityIndicator, Alert, Platform, ImageBackground } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/lib/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { UserRole } from "@/lib/types";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  role: UserRole;
  lastLogin: string | null;
}

const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/users", getApiUrl()).toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await response.json();
  return data.users.map((u: any) => ({
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    avatar: u.avatar || "",
    role: u.role,
    lastLogin: u.lastLoginAt,
  }));
};

const updateUserRole = async ({ userId, role }: { userId: string; role: UserRole }): Promise<void> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/users/${userId}`, getApiUrl()).toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    throw new Error("Failed to update user role");
  }
};

const impersonateUser = async (userId: string): Promise<{ token: string; user: any }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/impersonate/${userId}`, getApiUrl()).toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to impersonate user");
  }
  return response.json();
};

export default function AdminUsersScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isAdmin = user?.role === "admin";

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: fetchAdminUsers,
  });

  const mutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setModalVisible(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update user role");
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: impersonateUser,
    onSuccess: async (data) => {
      await AsyncStorage.setItem("@mien_kingdom_session", data.token);
      if (Platform.OS === "web") {
        window.alert(`Now logged in as ${data.user.displayName}. Refresh the app to see changes.`);
        window.location.reload();
      } else {
        Alert.alert(
          "Impersonation Active",
          `Now logged in as ${data.user.displayName}. Please restart the app to see the changes.`
        );
      }
      setModalVisible(false);
      setSelectedUser(null);
    },
    onError: () => {
      if (Platform.OS === "web") {
        window.alert("Failed to impersonate user");
      } else {
        Alert.alert("Error", "Failed to impersonate user");
      }
    },
  });

  const handleImpersonate = () => {
    if (!selectedUser) return;
    impersonateMutation.mutate(selectedUser.id);
  };

  const handleUserPress = (adminUser: AdminUser) => {
    if (!isAdmin) return;
    setSelectedUser(adminUser);
    setModalVisible(true);
  };

  const handleRoleChange = (role: UserRole) => {
    if (selectedUser) {
      mutation.mutate({ userId: selectedUser.id, role });
    }
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    return date.toLocaleDateString();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return Colors.light.error;
      case "moderator":
        return Colors.light.primary;
      default:
        return theme.textSecondary;
    }
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <Pressable
      style={({ pressed }) => [
        styles.userCard,
        { backgroundColor: theme.surface, opacity: pressed && isAdmin ? 0.8 : 1 },
      ]}
      onPress={() => handleUserPress(item)}
      disabled={!isAdmin}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.displayName}</ThemedText>
        <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]}>{item.email}</ThemedText>
        <ThemedText style={[styles.lastLogin, { color: theme.textSecondary }]}>
          Last login: {formatLastLogin(item.lastLogin)}
        </ThemedText>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) + "20" }]}>
        <ThemedText style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
        </ThemedText>
      </View>
      {isAdmin ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );

  const roles: UserRole[] = ["user", "moderator", "admin"];

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <View style={[styles.container, { backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }]}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={[styles.errorText, { color: theme.error }]}>Failed to load users</ThemedText>
          <Pressable style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={() => refetch()}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <ThemedText style={{ color: theme.textSecondary }}>No users found</ThemedText>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <ThemedText style={styles.modalTitle}>Change Role</ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Select a new role for {selectedUser?.displayName}
            </ThemedText>

            {roles.map((role) => (
              <Pressable
                key={role}
                style={({ pressed }) => [
                  styles.roleOption,
                  {
                    backgroundColor: selectedUser?.role === role ? (isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20") : theme.backgroundSecondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handleRoleChange(role)}
                disabled={mutation.isPending}
              >
                <ThemedText style={[
                  styles.roleOptionText,
                  selectedUser?.role === role && { color: isDark ? Colors.dark.primary : Colors.light.primary },
                ]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </ThemedText>
                {selectedUser?.role === role ? (
                  <Feather name="check" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                ) : null}
              </Pressable>
            ))}

            {mutation.isPending || impersonateMutation.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.lg }} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            ) : null}

            <Pressable
              style={[styles.impersonateButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
              onPress={handleImpersonate}
              disabled={impersonateMutation.isPending}
            >
              <Feather name="user-check" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              <ThemedText style={styles.impersonateText}>Login as this user</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText>Cancel</ThemedText>
            </Pressable>
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
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  lastLogin: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  roleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  impersonateButton: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  impersonateText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
