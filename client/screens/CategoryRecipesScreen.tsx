import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

type Props = NativeStackScreenProps<HomeStackParamList, "CategoryRecipes">;

interface SavedRecipe {
  id: string;
  recipeName: string;
  description: string | null;
  prepTime: string | null;
  cookTime: string | null;
  isMienDish: boolean;
  primaryPhotoUrl: string | null;
  isFavorite: boolean;
  createdAt: string;
}

export default function CategoryRecipesScreen({ navigation, route }: Props) {
  const { categoryId, categoryName } = route.params;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { sessionToken } = useAuth();

  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites" | "mien">("all");

  const fetchRecipes = async () => {
    try {
      let url = `/api/saved-recipes?categoryId=${categoryId}`;
      if (filter === "favorites") url += "&isFavorite=true";
      if (filter === "mien") url += "&isMienDish=true";

      const response = await fetch(
        new URL(url, getApiUrl()).toString(),
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [sessionToken, categoryId, filter])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRecipes();
  };

  const handleToggleFavorite = async (recipe: SavedRecipe) => {
    try {
      const response = await fetch(
        new URL(`/api/saved-recipes/${recipe.id}`, getApiUrl()).toString(),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            isFavorite: !recipe.isFavorite,
          }),
        }
      );

      if (response.ok) {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleDeleteRecipe = (recipe: SavedRecipe) => {
    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${recipe.recipeName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                new URL(`/api/saved-recipes/${recipe.id}`, getApiUrl()).toString(),
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${sessionToken}`,
                  },
                }
              );

              if (response.ok) {
                setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
              }
            } catch (error) {
              console.error("Failed to delete recipe:", error);
            }
          },
        },
      ]
    );
  };

  const renderRecipe = ({ item }: { item: SavedRecipe }) => (
    <Pressable
      style={({ pressed }) => [
        styles.recipeCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={() => navigation.navigate("RecipeDetail", { recipeId: item.id })}
      onLongPress={() => handleDeleteRecipe(item)}
    >
      <View style={styles.thumbnailContainer}>
        {item.primaryPhotoUrl ? (
          <Image
            source={{ uri: item.primaryPhotoUrl.startsWith("/") ? getApiUrl() + item.primaryPhotoUrl : item.primaryPhotoUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.placeholderThumbnail, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="image" size={24} color={theme.textSecondary} />
          </View>
        )}
        {item.isMienDish && (
          <View style={[styles.mienBadge, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
            <Feather name="star" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.recipeInfo}>
        <View style={styles.recipeHeader}>
          <ThemedText style={styles.recipeName} numberOfLines={2}>
            {item.recipeName}
          </ThemedText>
          <Pressable onPress={() => handleToggleFavorite(item)} hitSlop={8}>
            <Feather
              name={item.isFavorite ? "heart" : "heart"}
              size={20}
              color={item.isFavorite ? "#FF6B6B" : theme.textSecondary}
              style={{ opacity: item.isFavorite ? 1 : 0.5 }}
            />
          </Pressable>
        </View>

        {item.description && (
          <ThemedText style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}

        <View style={styles.metaRow}>
          {item.prepTime && (
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {item.prepTime}
              </ThemedText>
            </View>
          )}
          {item.cookTime && (
            <View style={styles.metaItem}>
              <Feather name="thermometer" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {item.cookTime}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  const FilterButton = ({ type, label }: { type: "all" | "favorites" | "mien"; label: string }) => (
    <Pressable
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === type
            ? (isDark ? Colors.dark.primary : Colors.light.primary)
            : theme.surface,
          borderColor: filter === type
            ? (isDark ? Colors.dark.primary : Colors.light.primary)
            : theme.border,
        },
      ]}
      onPress={() => setFilter(type)}
    >
      <ThemedText
        style={[
          styles.filterText,
          { color: filter === type ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
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
      <View style={styles.filterRow}>
        <FilterButton type="all" label="All" />
        <FilterButton type="favorites" label="Favorites" />
        <FilterButton type="mien" label="Mien" />
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.lg },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? Colors.dark.primary : Colors.light.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No recipes in this category
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Generate a recipe and save it here
            </ThemedText>
          </View>
        }
      />
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
  filterRow: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  recipeCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  thumbnailContainer: {
    width: 100,
    height: 100,
    position: "relative",
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
  mienBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  recipeInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: "center",
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  description: {
    fontSize: 13,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
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
});
