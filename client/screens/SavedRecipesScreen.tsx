import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type Props = NativeStackScreenProps<HomeStackParamList, "SavedRecipes">;

interface RecipeCategory {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  recipeCount: number;
  isDefault: boolean;
}

export default function SavedRecipesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { sessionToken } = useAuth();

  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        new URL("/api/recipe-categories", getApiUrl()).toString(),
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [sessionToken])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCategories();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(
        new URL("/api/recipe-categories", getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim() || null,
          }),
        }
      );

      if (response.ok) {
        setShowCreateModal(false);
        setNewCategoryName("");
        setNewCategoryDescription("");
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = (category: RecipeCategory) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"? This will also delete all ${category.recipeCount} recipes in this category.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                new URL(`/api/recipe-categories/${category.id}`, getApiUrl()).toString(),
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${sessionToken}`,
                  },
                }
              );

              if (response.ok) {
                fetchCategories();
              }
            } catch (error) {
              console.error("Failed to delete category:", error);
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: RecipeCategory }) => (
    <Pressable
      style={({ pressed }) => [
        styles.categoryCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={() =>
        navigation.navigate("CategoryRecipes", {
          categoryId: item.id,
          categoryName: item.name,
        })
      }
      onLongPress={() => !item.isDefault && handleDeleteCategory(item)}
    >
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl.startsWith("/") ? getApiUrl() + item.thumbnailUrl : item.thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.placeholderThumbnail, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="book-open" size={32} color={theme.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.categoryInfo}>
        <ThemedText style={styles.categoryName} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={[styles.recipeCount, { color: theme.textSecondary }]}>
          {item.recipeCount} {item.recipeCount === 1 ? "recipe" : "recipes"}
        </ThemedText>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.lg },
        ]}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? Colors.dark.primary : Colors.light.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No recipe categories yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Save a recipe from the Food tab to get started
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.modalTitle}>New Category</ThemedText>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Category name"
              placeholderTextColor={theme.textSecondary}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textSecondary}
              value={newCategoryDescription}
              onChangeText={setNewCategoryDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewCategoryName("");
                  setNewCategoryDescription("");
                }}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                    opacity: newCategoryName.trim() && !isCreating ? 1 : 0.5,
                  },
                ]}
                onPress={handleCreateCategory}
                disabled={!newCategoryName.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={{ color: "#FFFFFF" }}>Create</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.md,
  },
  row: {
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  thumbnailContainer: {
    width: "100%",
    aspectRatio: 1,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  placeholderThumbnail: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    padding: Spacing.sm,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  recipeCount: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
});
