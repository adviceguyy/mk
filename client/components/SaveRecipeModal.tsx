import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";

interface RecipeResult {
  recipeName: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  shoppingList: { category: string; items: string[] }[];
  isMienDish: boolean;
  mienHighlights?: string;
  mienModifications?: string;
  similarMienDish?: string;
}

interface RecipeCategory {
  id: string;
  name: string;
  description: string | null;
  recipeCount: number;
}

interface SaveRecipeModalProps {
  visible: boolean;
  recipe: RecipeResult;
  sourceImageBase64?: string;
  onClose: () => void;
  onSaved: (savedRecipe: { id: string; recipeName: string }) => void;
}

export function SaveRecipeModal({
  visible,
  recipe,
  sourceImageBase64,
  onClose,
  onSaved,
}: SaveRecipeModalProps) {
  const { theme, isDark } = useTheme();
  const { sessionToken } = useAuth();

  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
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
        // Pre-select appropriate category based on recipe type
        if (data.categories.length > 0) {
          const mienCategory = data.categories.find((c: RecipeCategory) => c.name === "Traditional Mien");
          const mainCourse = data.categories.find((c: RecipeCategory) => c.name === "Main Course");
          if (recipe.isMienDish && mienCategory) {
            setSelectedCategoryId(mienCategory.id);
          } else if (mainCourse) {
            setSelectedCategoryId(mainCourse.id);
          } else {
            setSelectedCategoryId(data.categories[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

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
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories((prev) => [...prev, { ...data.category, recipeCount: 0 }]);
        setSelectedCategoryId(data.category.id);
        setNewCategoryName("");
        setShowNewCategory(false);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedCategoryId) {
      Alert.alert("Select Category", "Please select a category to save your recipe.");
      return;
    }

    setIsSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photos: string[] = [];
      if (sourceImageBase64) {
        photos.push(sourceImageBase64);
      }

      const response = await fetch(
        new URL("/api/saved-recipes", getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            categoryId: selectedCategoryId,
            recipe: {
              recipeName: recipe.recipeName,
              description: recipe.description,
              servings: recipe.servings,
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              ingredients: recipe.ingredients,
              instructions: recipe.instructions,
              shoppingList: recipe.shoppingList,
              isMienDish: recipe.isMienDish,
              mienHighlights: recipe.mienHighlights,
              mienModifications: recipe.mienModifications,
              similarMienDish: recipe.similarMienDish,
            },
            photos,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSaved({ id: data.recipe.id, recipeName: data.recipe.recipeName });
        onClose();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to save recipe");
      }
    } catch (error) {
      console.error("Failed to save recipe:", error);
      Alert.alert("Error", "Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Save Recipe</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText style={[styles.recipeName, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
            {recipe.recipeName}
          </ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Choose a category
          </ThemedText>

          {isLoadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={isDark ? Colors.dark.primary : Colors.light.primary} />
            </View>
          ) : (
            <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: selectedCategoryId === category.id
                        ? (isDark ? Colors.dark.primary + "20" : Colors.light.primary + "15")
                        : theme.backgroundDefault,
                      borderColor: selectedCategoryId === category.id
                        ? (isDark ? Colors.dark.primary : Colors.light.primary)
                        : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <View style={styles.categoryInfo}>
                    <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                    <ThemedText style={[styles.categoryCount, { color: theme.textSecondary }]}>
                      {category.recipeCount} {category.recipeCount === 1 ? "recipe" : "recipes"}
                    </ThemedText>
                  </View>
                  {selectedCategoryId === category.id && (
                    <Feather name="check" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                  )}
                </Pressable>
              ))}

              {showNewCategory ? (
                <View style={[styles.newCategoryInput, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Category name"
                    placeholderTextColor={theme.textSecondary}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus
                  />
                  <View style={styles.newCategoryButtons}>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() => {
                        setShowNewCategory(false);
                        setNewCategoryName("");
                      }}
                    >
                      <Feather name="x" size={20} color={theme.textSecondary} />
                    </Pressable>
                    <Pressable
                      style={[styles.iconButton, { opacity: newCategoryName.trim() ? 1 : 0.5 }]}
                      onPress={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      <Feather name="check" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  style={[styles.addCategoryButton, { borderColor: theme.border }]}
                  onPress={() => setShowNewCategory(true)}
                >
                  <Feather name="plus" size={18} color={theme.textSecondary} />
                  <ThemedText style={[styles.addCategoryText, { color: theme.textSecondary }]}>
                    New Category
                  </ThemedText>
                </Pressable>
              )}
            </ScrollView>
          )}

          <Pressable
            style={[
              styles.saveButton,
              {
                backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                opacity: selectedCategoryId && !isSaving ? 1 : 0.5,
              },
            ]}
            onPress={handleSave}
            disabled={!selectedCategoryId || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="bookmark" size={18} color="#FFFFFF" />
                <ThemedText style={styles.saveButtonText}>Save Recipe</ThemedText>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  categoriesContainer: {
    maxHeight: 300,
    marginBottom: Spacing.md,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.xs,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
  },
  categoryCount: {
    fontSize: 13,
    marginTop: 2,
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.xs,
  },
  addCategoryText: {
    fontSize: 14,
  },
  newCategoryInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: Spacing.xs,
  },
  newCategoryButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
