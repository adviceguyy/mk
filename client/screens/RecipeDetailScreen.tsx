import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type Props = NativeStackScreenProps<HomeStackParamList, "RecipeDetail">;

interface FullRecipe {
  id: string;
  recipeName: string;
  description: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  ingredients: string[];
  instructions: string[];
  shoppingList: { category: string; items: string[] }[];
  isMienDish: boolean;
  mienHighlights: string | null;
  mienModifications: string | null;
  similarMienDish: string | null;
  photos: string[];
  primaryPhotoUrl: string | null;
  notes: string | null;
  isFavorite: boolean;
  sharedPostId: string | null;
  createdAt: string;
}

const { width: screenWidth } = Dimensions.get("window");

export default function RecipeDetailScreen({ navigation, route }: Props) {
  const { recipeId } = route.params;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { sessionToken } = useAuth();

  const [recipe, setRecipe] = useState<FullRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    shoppingList: false,
  });

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(
        new URL(`/api/saved-recipes/${recipeId}`, getApiUrl()).toString(),
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
      }
    } catch (error) {
      console.error("Failed to fetch recipe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
        setRecipe((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;

    if (recipe.sharedPostId) {
      Alert.alert("Already Shared", "This recipe has already been shared as a post.");
      return;
    }

    Alert.alert(
      "Share Recipe",
      "Share this recipe as a post to your profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share",
          onPress: async () => {
            setIsSharing(true);
            try {
              const response = await fetch(
                new URL(`/api/saved-recipes/${recipe.id}/share`, getApiUrl()).toString(),
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                  },
                  body: JSON.stringify({
                    visibility: "public",
                  }),
                }
              );

              if (response.ok) {
                const data = await response.json();
                setRecipe((prev) => prev ? { ...prev, sharedPostId: data.post.id } : null);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Recipe shared to your profile!");
              } else {
                const errorData = await response.json();
                Alert.alert("Error", errorData.error || "Failed to share recipe");
              }
            } catch (error) {
              console.error("Failed to share recipe:", error);
              Alert.alert("Error", "Failed to share recipe");
            } finally {
              setIsSharing(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!recipe) return;

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
                navigation.goBack();
              }
            } catch (error) {
              console.error("Failed to delete recipe:", error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="alert-circle" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          Recipe not found
        </ThemedText>
      </View>
    );
  }

  const photos = recipe.photos && recipe.photos.length > 0 ? recipe.photos : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
    >
      {photos.length > 0 && (
        <View style={styles.imageCarousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setCurrentPhotoIndex(index);
            }}
          >
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo.startsWith("/") ? getApiUrl() + photo : photo }}
                style={styles.carouselImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          {photos.length > 1 && (
            <View style={styles.pagination}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: index === currentPhotoIndex
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.5)",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.recipeName}>{recipe.recipeName}</ThemedText>
          <View style={styles.actionButtons}>
            <Pressable onPress={handleToggleFavorite} style={styles.actionButton}>
              <Feather
                name="heart"
                size={22}
                color={recipe.isFavorite ? "#FF6B6B" : theme.textSecondary}
              />
            </Pressable>
            <Pressable onPress={handleShare} style={styles.actionButton} disabled={isSharing}>
              {isSharing ? (
                <ActivityIndicator size="small" color={theme.textSecondary} />
              ) : (
                <Feather
                  name="share"
                  size={22}
                  color={recipe.sharedPostId ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary}
                />
              )}
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.actionButton}>
              <Feather name="trash-2" size={22} color={theme.error} />
            </Pressable>
          </View>
        </View>

        {recipe.description && (
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {recipe.description}
          </ThemedText>
        )}

        {recipe.isMienDish && recipe.mienHighlights ? (
          <View style={[styles.mienSection, { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "15" }]}>
            <View style={styles.mienHeader}>
              <Feather name="star" size={18} color={isDark ? Colors.dark.primary : Colors.light.primary} />
              <ThemedText style={[styles.mienTitle, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                Traditional Mien Dish
              </ThemedText>
            </View>
            <ThemedText style={[styles.mienText, { color: theme.text }]}>
              {recipe.mienHighlights}
            </ThemedText>
          </View>
        ) : recipe.mienModifications ? (
          <View style={[styles.mienSection, { backgroundColor: "#FFA50015" }]}>
            <View style={styles.mienHeader}>
              <Feather name="info" size={18} color="#FFA500" />
              <ThemedText style={[styles.mienTitle, { color: "#FFA500" }]}>
                Make It Mien
              </ThemedText>
            </View>
            <ThemedText style={[styles.mienText, { color: theme.text }]}>
              {recipe.mienModifications}
            </ThemedText>
            {recipe.similarMienDish && (
              <View style={styles.similarDish}>
                <Feather name="arrow-right" size={14} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <ThemedText style={[styles.similarDishText, { color: theme.text }]}>
                  Try: {recipe.similarMienDish}
                </ThemedText>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.metaRow}>
          {recipe.servings && (
            <View style={[styles.metaCard, { backgroundColor: theme.surface }]}>
              <Feather name="users" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.metaValue, { color: theme.text }]}>{recipe.servings}</ThemedText>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Servings</ThemedText>
            </View>
          )}
          {recipe.prepTime && (
            <View style={[styles.metaCard, { backgroundColor: theme.surface }]}>
              <Feather name="clock" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.metaValue, { color: theme.text }]}>{recipe.prepTime}</ThemedText>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Prep</ThemedText>
            </View>
          )}
          {recipe.cookTime && (
            <View style={[styles.metaCard, { backgroundColor: theme.surface }]}>
              <Feather name="thermometer" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.metaValue, { color: theme.text }]}>{recipe.cookTime}</ThemedText>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Cook</ThemedText>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Ingredients</ThemedText>
          {(recipe.ingredients || []).map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]} />
              <ThemedText style={styles.listText}>{ingredient}</ThemedText>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Instructions</ThemedText>
          {(recipe.instructions || []).map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>{step}</ThemedText>
            </View>
          ))}
        </View>

        {recipe.shoppingList && recipe.shoppingList.length > 0 && (
          <Pressable
            style={[styles.section, { backgroundColor: theme.surface }]}
            onPress={() => setExpandedSections((prev) => ({ ...prev, shoppingList: !prev.shoppingList }))}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="shopping-cart" size={18} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <ThemedText style={styles.sectionTitle}>Shopping List</ThemedText>
              </View>
              <Feather
                name={expandedSections.shoppingList ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </View>
            {expandedSections.shoppingList && recipe.shoppingList.map((category, catIndex) => (
              <View key={catIndex} style={styles.categorySection}>
                <ThemedText style={[styles.categoryTitle, { color: theme.textSecondary }]}>
                  {category.category}
                </ThemedText>
                {(category.items || []).map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.listItem}>
                    <View style={[styles.checkbox, { borderColor: theme.border }]} />
                    <ThemedText style={styles.listText}>{item}</ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </Pressable>
        )}

        {recipe.notes && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            <ThemedText style={[styles.notesText, { color: theme.textSecondary }]}>
              {recipe.notes}
            </ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
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
  errorText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  imageCarousel: {
    width: screenWidth,
    height: 250,
    position: "relative",
  },
  carouselImage: {
    width: screenWidth,
    height: 250,
  },
  pagination: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
    marginRight: Spacing.sm,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  mienSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  mienHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  mienTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  mienText: {
    fontSize: 14,
    lineHeight: 20,
  },
  similarDish: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  similarDishText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 12,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  listText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  categorySection: {
    marginTop: Spacing.sm,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
