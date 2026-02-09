import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, TextInput, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { File } from "expo-file-system";

import { ScrollView } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { CreditIndicator } from "@/components/CreditIndicator";
import { SaveRecipeModal } from "@/components/SaveRecipeModal";
import { YouTubePlayerModal } from "@/components/YouTubePlayerModal";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";
import { useCredits } from "@/lib/CreditContext";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

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

// --- Explore tab types and data ---

type FoodCategory = "soups" | "traditional" | "stir_fry" | "bbq" | "snacks" | "sauces";

interface FoodVideoItem {
  id: string;
  title: string;
  creator: string;
  youtubeId: string;
  category: FoodCategory;
}

const FOOD_CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "soups", label: "Soups & Noodles" },
  { key: "traditional", label: "Traditional" },
  { key: "stir_fry", label: "Stir Fry" },
  { key: "bbq", label: "BBQ & Grilling" },
  { key: "snacks", label: "Snacks & Desserts" },
  { key: "sauces", label: "Sauces" },
];

const FOOD_CATEGORY_COLORS: Record<string, string> = {
  soups: "#EF4444",
  traditional: "#D4A84B",
  stir_fry: "#22C55E",
  bbq: "#F59E0B",
  snacks: "#EC4899",
  sauces: "#8B5CF6",
};

const CURATED_FOOD_VIDEOS: FoodVideoItem[] = [
  // Soups & Noodles
  { id: "s1", title: "How to Make Kasoy - Mien/Lao Noodle Soup", creator: "ggs__kitchen", youtubeId: "9OV5uCcdHAk", category: "soups" },
  { id: "s2", title: "How to Make KaSoy Noodles Soup", creator: "Chefin With Manha", youtubeId: "E9qlPDNG8vQ", category: "soups" },
  { id: "s3", title: "How to Make Kasoy Meat Sauce", creator: "Cook with Harris Panyanouvong", youtubeId: "3Ik7Rzc8EEE", category: "soups" },
  { id: "s4", title: "Mien Food: Noodle Ka Soi, Kasoy", creator: "The Mien Kitchen", youtubeId: "g07OisxYRDA", category: "soups" },
  { id: "s5", title: "How to Make Kasoy", creator: "Volcano Production", youtubeId: "jtnpZhrxdKc", category: "soups" },
  { id: "s6", title: "Iu Mien Ways of Making Delicious Broth", creator: "Mien A'Gouh", youtubeId: "bQLRhHaX56U", category: "soups" },
  { id: "s7", title: "Homemade Noodles Soup Iu Mien Style", creator: "Mien A'Gouh", youtubeId: "PeA647gwvOU", category: "soups" },
  { id: "s8", title: "Iu Mien USA Making Delicious Kao Piek", creator: "Mien A'Gouh", youtubeId: "PRaujeKGnCg", category: "soups" },
  // Traditional
  { id: "t1", title: "Iu Mien Poor People Foods - Three Courses", creator: "Mien A'Gouh", youtubeId: "3m0uiS3EY0M", category: "traditional" },
  { id: "t2", title: "Iu Mien Way of Cooking Fish", creator: "Mien A'Gouh", youtubeId: "-JmOAaCI2pA", category: "traditional" },
  { id: "t3", title: "Iu Mien Traditional Chicken Soup with Gingers", creator: "Mien A'Gouh", youtubeId: "2VKFAv_krGk", category: "traditional" },
  { id: "t4", title: "Iu Mien Traditional Eggplant & Meat Soup", creator: "Mien A'Gouh", youtubeId: "E9xI6PTWjH0", category: "traditional" },
  { id: "t5", title: "Iu Mien Cooking Pork Stomach & Intestines", creator: "Mien A'Gouh", youtubeId: "5LEcAIPNEcA", category: "traditional" },
  { id: "t6", title: "Iu Mien Popular Tofu With Minced Meats Soup", creator: "Mien A'Gouh", youtubeId: "-wQs28xWop0", category: "traditional" },
  { id: "t7", title: "Iu Mien USA Cooking Three Courses of Meal", creator: "Mien A'Gouh", youtubeId: "ftG4xFK3Go0", category: "traditional" },
  { id: "t8", title: "Iu Mien Smoke Meat Soup", creator: "Mien A'Gouh", youtubeId: "97ebjQ0zHU4", category: "traditional" },
  // Stir Fry & Vegetables
  { id: "f1", title: "Iu Mien USA Stir Fry Green Beans", creator: "Mien A'Gouh", youtubeId: "ZZSj_8B1HLw", category: "stir_fry" },
  { id: "f2", title: "Iu Mien Stir Fry Bitter Melons", creator: "Mien A'Gouh", youtubeId: "zCtr_slzkAc", category: "stir_fry" },
  { id: "f3", title: "Iu Mien USA Cooking Soul Foods", creator: "Mien A'Gouh", youtubeId: "eEaEj82JJR0", category: "stir_fry" },
  { id: "f4", title: "Iu Mien Cooking Daikon's Pods & Vegetables", creator: "Mien A'Gouh", youtubeId: "Cb9KOCLj0jo", category: "stir_fry" },
  { id: "f5", title: "Laix-Jaaix (Lai Chai) Mien Dish", creator: "The Mien Kitchen", youtubeId: "D5pk5TA7was", category: "stir_fry" },
  { id: "f6", title: "Mien Food: Iu Mienh Zouv Ndie Nyanc", creator: "Iu Mienh Mien Food", youtubeId: "4_eZMf6VdME", category: "stir_fry" },
  // BBQ & Grilling
  { id: "b1", title: "Iu-Mienh Cooking: Grilling & Steaming Chicken", creator: "La'Dangc-Sui Mienh", youtubeId: "LwHVKStA-C8", category: "bbq" },
  { id: "b2", title: "Iu-Mienh Cooking: Grilling Spareribs", creator: "La'Dangc-Sui Mienh", youtubeId: "MqPPdMuBEBs", category: "bbq" },
  { id: "b3", title: "Iu Mien Style Sausages", creator: "Mien A'Gouh", youtubeId: "FFeJeC0maDw", category: "bbq" },
  { id: "b4", title: "Wagyu & Hotpot IU MIEN Style", creator: "The Saechao Fam", youtubeId: "wf9C3Nv1qyw", category: "bbq" },
  { id: "b5", title: "IU MIEN Catch & Cook MIEN Style!", creator: "The Saechao Fam", youtubeId: "DNwPpZsEWHk", category: "bbq" },
  // Snacks & Desserts
  { id: "n1", title: "Iu Mien Sweet Rice Dumplings", creator: "vidalbum", youtubeId: "purZvbD9DfM", category: "snacks" },
  { id: "n2", title: "Mien Food: Corn Bread", creator: "Iu Mienh Mien Food", youtubeId: "vuyBfeP-r_U", category: "snacks" },
  { id: "n3", title: "Iu Mien Sweet Corn Pancakes", creator: "Mien A'Gouh", youtubeId: "O-tW2-p_xMY", category: "snacks" },
  { id: "n4", title: "How to Make Khao Lang Feun", creator: "Cook with Harris Panyanouvong", youtubeId: "z-YOndbbFG8", category: "snacks" },
  { id: "n5", title: "Iu Mien Making Kao Laing Fen (KLF)", creator: "Mien A'Gouh", youtubeId: "q5l-j-8eV_Y", category: "snacks" },
  // Sauces & Condiments
  { id: "c1", title: "Iu Mien Chilies Sauce (Funz Ciev)", creator: "Mien A'Gouh", youtubeId: "DVK_iZs154c", category: "sauces" },
  { id: "c2", title: "Meat Sauce Iu Mien Styles", creator: "Mien A'Gouh", youtubeId: "ogrw9vHoWlw", category: "sauces" },
  { id: "c3", title: "Iu Mien Cooking Ground Pork in Aluminum Foil", creator: "Mien A'Gouh", youtubeId: "FDjZiMggf2I", category: "sauces" },
];

const RECIPE_TABS: { key: "explore" | "analysis"; label: string; icon: string }[] = [
  { key: "analysis", label: "Food Recipe Analysis", icon: "search" },
  { key: "explore", label: "Explore", icon: "compass" },
];

const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - Spacing.lg * 2 - Spacing.md) / 2;

function getThumbnailUrl(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export default function RecipeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, sessionToken } = useAuth();
  const { checkCreditError } = useCredits();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const goldColor = isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold;

  const [selectedTab, setSelectedTab] = useState<"explore" | "analysis">("analysis");
  const [selectedFoodCategory, setSelectedFoodCategory] = useState("all");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [dishText, setDishText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RecipeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);

  // Calculate available recipe count based on credits (2 credits per recipe)
  const totalCredits = (user?.credits ?? 0) + (user?.packCredits ?? 0);
  const recipeCount = Math.floor(totalCredits / 2);

  const filteredFoodVideos = selectedFoodCategory === "all"
    ? CURATED_FOOD_VIDEOS
    : CURATED_FOOD_VIDEOS.filter((v) => v.category === selectedFoodCategory);

  const handlePlayVideo = (youtubeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPlayingVideoId(youtubeId);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        if (!permissionResult.canAskAgain && Platform.OS !== "web") {
          setError("Photo permission denied. Please enable it in Settings.");
        } else {
          setError("Permission to access photos is required");
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({ uri: asset.uri, base64: asset.base64 || undefined });
        setResult(null);
        setError(null);
      }
    } catch (err) {
      console.error("Image picker error:", err);
      setError("Failed to select image");
    }
  };

  const analyzeRecipe = async () => {
    if (!selectedImage && !dishText.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let base64Data: string | undefined;

      if (selectedImage) {
        base64Data = selectedImage.base64;

        if (!base64Data) {
          if (Platform.OS === "web") {
            const response = await fetch(selectedImage.uri);
            const blob = await response.blob();
            base64Data = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.split(",")[1] || result;
                resolve(base64);
              };
              reader.readAsDataURL(blob);
            });
          } else {
            const file = new File(selectedImage.uri);
            base64Data = await file.base64();
          }
        }
      }

      const response = await fetch(new URL("/api/recipe-it", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: selectedImage ? "image/jpeg" : undefined,
          dishDescription: dishText.trim() || undefined,
        }),
      });

      if (await checkCreditError(response)) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze");
      }

      const data = await response.json();
      if (data.recipe) {
        setResult(data.recipe);
      } else {
        setError("Could not get recipe. Please try again with more details.");
      }
    } catch (err: any) {
      console.error("Recipe analysis error:", err);
      setError(err.message || "Failed to get recipe. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setDishText("");
    setResult(null);
    setError(null);
    setSavedRecipeId(null);
  };

  const handleRecipeSaved = (savedRecipe: { id: string; recipeName: string }) => {
    setSavedRecipeId(savedRecipe.id);
    Alert.alert(
      "Recipe Saved!",
      `"${savedRecipe.recipeName}" has been saved to your recipes.`,
      [
        { text: "View Recipes", onPress: () => navigation.navigate("SavedRecipes") },
        { text: "Continue", style: "cancel" },
      ]
    );
  };

  const renderExploreSection = () => (
    <>
      {/* Food Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {FOOD_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.foodCategoryChip,
              {
                backgroundColor: selectedFoodCategory === cat.key
                  ? (cat.key === "all"
                      ? goldColor
                      : FOOD_CATEGORY_COLORS[cat.key] || Colors.light.heritage.gold)
                  : theme.surface,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedFoodCategory(selectedFoodCategory === cat.key && cat.key !== "all" ? "all" : cat.key);
            }}
          >
            <ThemedText
              style={[
                styles.foodCategoryText,
                {
                  color: selectedFoodCategory === cat.key ? "#FFFFFF" : theme.textSecondary,
                },
              ]}
            >
              {cat.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Video Count */}
      <ThemedText style={[styles.foodVideoCount, { color: theme.textSecondary }]}>
        {filteredFoodVideos.length} {filteredFoodVideos.length === 1 ? "video" : "videos"}
      </ThemedText>

      {/* Video Cards Grid */}
      <View style={styles.foodGridContainer}>
        {filteredFoodVideos.map((video) => {
          const catColor = FOOD_CATEGORY_COLORS[video.category] || Colors.light.heritage.gold;
          const catLabel = FOOD_CATEGORIES.find((c) => c.key === video.category)?.label || video.category;
          return (
            <View key={video.id} style={[styles.foodVideoCard, { backgroundColor: theme.surface, width: cardWidth }]}>
              <Pressable
                style={({ pressed }) => [styles.foodVideoThumbnail, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => handlePlayVideo(video.youtubeId)}
              >
                <Image
                  source={{ uri: getThumbnailUrl(video.youtubeId) }}
                  style={styles.foodThumbnailImage}
                  contentFit="cover"
                />
                <View style={styles.foodPlayOverlay}>
                  <View style={[styles.foodPlayButton, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                    <Feather name="play" size={22} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>

              <View style={styles.foodVideoInfo}>
                <ThemedText style={[styles.foodVideoTitle, { color: theme.text }]} numberOfLines={2}>
                  {video.title}
                </ThemedText>
                <ThemedText style={[styles.foodVideoCreator, { color: theme.textSecondary }]} numberOfLines={1}>
                  {video.creator}
                </ThemedText>
                <View style={[styles.foodCategoryBadge, { backgroundColor: catColor + "20" }]}>
                  <ThemedText style={[styles.foodCategoryBadgeText, { color: catColor }]}>
                    {catLabel}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  const renderAnalysisSection = () => (
    <>
      <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText style={styles.summaryTitle}>How to Use</ThemedText>
        <ThemedText style={[styles.summaryText, { color: theme.textSecondary }]}>
          Take a photo of any dish or type its name to get a full recipe with ingredients, step-by-step instructions, shopping list, and video tutorial. Mien dishes get special cultural highlights!
        </ThemedText>
      </View>

      <View style={[styles.uploadContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {selectedImage ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} contentFit="cover" />
            <Pressable style={styles.removeButton} onPress={clearAll}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable style={({ pressed }) => [styles.pickButton, { opacity: pressed ? 0.8 : 1 }]} onPress={pickImage}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
              <Feather name="camera" size={32} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.pickText}>Upload or Take a Photo</ThemedText>
            <ThemedText style={[styles.pickHint, { color: theme.textSecondary }]}>
              Choose from your photo library
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.orDivider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <ThemedText style={[styles.orText, { color: theme.textSecondary }]}>OR</ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      <View style={[styles.textInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Feather name="edit-3" size={20} color={theme.textSecondary} style={{ marginRight: Spacing.sm }} />
        <TextInput
          style={[styles.dishTextInput, { color: theme.text }]}
          placeholder="Enter dish name or description..."
          placeholderTextColor={theme.textSecondary}
          value={dishText}
          onChangeText={setDishText}
          multiline
          numberOfLines={2}
        />
      </View>

      {(selectedImage || dishText.trim()) && !result && (
        <Pressable
          style={({ pressed }) => [
            styles.analyzeButton,
            {
              backgroundColor: isAnalyzing ? theme.backgroundSecondary : (isDark ? Colors.dark.primary : Colors.light.primary),
              opacity: pressed && !isAnalyzing ? 0.9 : 1,
            },
          ]}
          onPress={analyzeRecipe}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ThemedText style={styles.analyzeText}>Analyzing...</ThemedText>
            </>
          ) : (
            <>
              <Feather name="search" size={20} color="#FFFFFF" />
              <ThemedText style={styles.analyzeText}>Get Recipe ({recipeCount})</ThemedText>
            </>
          )}
        </Pressable>
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.error + "20" }]}>
          <Feather name="alert-circle" size={18} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
        </View>
      )}

      {result && (
        <View style={styles.resultSection}>
          <View style={[styles.recipeCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.recipeName}>{result.recipeName}</ThemedText>
            <ThemedText style={[styles.recipeDescription, { color: theme.textSecondary }]}>
              {result.description}
            </ThemedText>

            {result.isMienDish && result.mienHighlights ? (
              <View style={[styles.mienSection, { backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "15" }]}>
                <View style={styles.mienHeader}>
                  <Feather name="star" size={18} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                  <ThemedText style={[styles.mienTitle, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                    Traditional Mien Dish
                  </ThemedText>
                </View>
                <ThemedText style={[styles.mienText, { color: theme.text }]}>
                  {result.mienHighlights}
                </ThemedText>
              </View>
            ) : result.mienModifications ? (
              <View style={[styles.mienSection, { backgroundColor: isDark ? "#FFA50020" : "#FFA50015" }]}>
                <View style={styles.mienHeader}>
                  <Feather name="info" size={18} color="#FFA500" />
                  <ThemedText style={[styles.mienTitle, { color: "#FFA500" }]}>
                    Make It Mien
                  </ThemedText>
                </View>
                <ThemedText style={[styles.mienText, { color: theme.text }]}>
                  {result.mienModifications}
                </ThemedText>
                {result.similarMienDish ? (
                  <View style={styles.similarDishContainer}>
                    <View style={styles.similarDishHeader}>
                      <Feather name="arrow-right" size={16} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                      <ThemedText style={[styles.similarDishLabel, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                        Try This Mien Dish Instead:
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.similarDishText, { color: theme.text }]}>
                      {result.similarMienDish}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Feather name="users" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>{result.servings}</ThemedText>
              </View>
              <View style={styles.metaItem}>
                <Feather name="clock" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                  Prep: {result.prepTime}
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <Feather name="thermometer" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                  Cook: {result.cookTime}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.sectionTitle}>Ingredients</ThemedText>
            {result.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]} />
                <ThemedText style={styles.listText}>{ingredient}</ThemedText>
              </View>
            ))}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.sectionTitle}>Instructions</ThemedText>
            {result.instructions.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                  <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
                </View>
                <ThemedText style={[styles.stepText, { flex: 1 }]}>{step}</ThemedText>
              </View>
            ))}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Feather name="shopping-cart" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
              <ThemedText style={styles.sectionTitle}>Shopping List</ThemedText>
            </View>
            {result.shoppingList.map((category, catIndex) => (
              <View key={catIndex} style={styles.categorySection}>
                <ThemedText style={[styles.categoryTitle, { color: theme.textSecondary }]}>
                  {category.category}
                </ThemedText>
                {category.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.shoppingItem}>
                    <Feather name="check-square" size={16} color={theme.textSecondary} />
                    <ThemedText style={styles.shoppingText}>{item}</ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.actionButtonsRow}>
            {!savedRecipeId ? (
              <Pressable
                style={({ pressed }) => [
                  styles.saveRecipeButton,
                  {
                    backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => setShowSaveModal(true)}
              >
                <Feather name="bookmark" size={18} color="#FFFFFF" />
                <ThemedText style={styles.saveRecipeText}>Save Recipe</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.savedBadge, { backgroundColor: "#4CAF5020" }]}>
                <Feather name="check-circle" size={18} color="#4CAF50" />
                <ThemedText style={[styles.savedBadgeText, { color: "#4CAF50" }]}>Saved</ThemedText>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.myRecipesButton,
                { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => navigation.navigate("SavedRecipes")}
            >
              <Feather name="book-open" size={18} color={theme.text} />
              <ThemedText style={styles.myRecipesText}>My Recipes</ThemedText>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.newRecipeButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={clearAll}
          >
            <Feather name="refresh-cw" size={18} color={theme.text} />
            <ThemedText style={styles.newRecipeText}>Analyze Another Dish</ThemedText>
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Switcher */}
        <View style={styles.sectionTabs}>
          {RECIPE_TABS.map((tab) => {
            const isActive = selectedTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.sectionTab,
                  {
                    backgroundColor: isActive ? goldColor : theme.surface,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedTab(tab.key);
                }}
              >
                <Feather
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? "#FFFFFF" : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.sectionTabText,
                    { color: isActive ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Tab Content */}
        {selectedTab === "explore" && renderExploreSection()}
        {selectedTab === "analysis" && renderAnalysisSection()}
      </ScrollView>
      <CreditIndicator />

      {result && (
        <SaveRecipeModal
          visible={showSaveModal}
          recipe={result}
          sourceImageBase64={selectedImage?.base64 ? `data:image/jpeg;base64,${selectedImage.base64}` : undefined}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleRecipeSaved}
        />
      )}

      <YouTubePlayerModal
        visible={!!playingVideoId}
        youtubeId={playingVideoId}
        onClose={() => setPlayingVideoId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 180,
    zIndex: 0,
  },
  backgroundBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 160,
    zIndex: 0,
  },
  sectionTabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesScroll: {
    marginBottom: Spacing.sm,
    marginHorizontal: -Spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  foodCategoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  foodCategoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  foodVideoCount: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  foodGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  foodVideoCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  foodVideoThumbnail: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  foodThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  foodPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  foodPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  foodVideoInfo: {
    padding: Spacing.sm,
  },
  foodVideoTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    lineHeight: 16,
  },
  foodVideoCreator: {
    fontSize: 11,
    marginBottom: Spacing.xs,
  },
  foodCategoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  foodCategoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  uploadContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  imagePreview: {
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 250,
  },
  removeButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: Spacing.sm,
  },
  pickButton: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  pickText: {
    fontSize: 18,
    fontWeight: "600",
  },
  pickHint: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: Spacing.md,
    fontSize: 14,
    fontWeight: "500",
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  dishTextInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    textAlignVertical: "top",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  analyzeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  resultSection: {
    marginTop: Spacing.xl,
    gap: Spacing.lg,
  },
  recipeCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  recipeDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  mienSection: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  mienHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  mienTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  mienText: {
    fontSize: 14,
    lineHeight: 21,
  },
  similarDishContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  similarDishHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  similarDishLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  similarDishText: {
    fontSize: 14,
    lineHeight: 21,
    marginLeft: Spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 13,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  listText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
  },
  categorySection: {
    marginBottom: Spacing.md,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shoppingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  shoppingText: {
    fontSize: 15,
  },
  newRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  newRecipeText: {
    fontSize: 15,
    fontWeight: "500",
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  saveRecipeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  saveRecipeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  savedBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  savedBadgeText: {
    fontSize: 15,
    fontWeight: "600",
  },
  myRecipesButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  myRecipesText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
