import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, Linking, ImageBackground } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type LiteratureNavigationProp = NativeStackNavigationProp<HomeStackParamList, "Literature">;

interface BookItem {
  id: string;
  title: string;
  author: string;
  description: string;
  type: "online" | "purchase" | "reader";
  url?: string;
  route?: string;
  backgroundImage?: any;
}

const FEATURED_BOOKS: BookItem[] = [
  {
    id: "2",
    title: "Traditional Mien Stories",
    author: "Community Collection",
    description: "The Iu Mien possess a rich oral and written tradition of stories passed through generations. Central to Mien identity is the Jiex Sen Borngv (Mountain Crossing Passport), a foundational document describing the covenant between the Mien people and Emperor Ping Huang, granting them the right to live freely in the mountains. The Piu-Yiuh Jiex Koiv (Sea Crossing Odyssey) recounts the Mien ancestors' perilous journey across the sea, where they petitioned the dragon spirit for protection during a great storm. These narratives preserve the origins of the twelve Mien clans and the lost thirteenth clan, the Ziangx, who perished by drowning.",
    type: "reader",
    route: "StoryCatalog",
    backgroundImage: require("../../assets/images/literature/lit-stories.png"),
  },
  {
    id: "grammar",
    title: "Mien Grammar Book",
    author: "Dr. Tatsuro Daniel Arisawa",
    description: "An Iu Mien Grammar: A Tool for Language Documentation and Revitalisation. A comprehensive grammar of the Iu Mien language covering phonology, morphology, syntax, and discourse, with hundreds of example sentences in Mien and English.",
    type: "reader",
    route: "GrammarBook",
    backgroundImage: require("../../assets/images/literature/lit-grammar-book.png"),
  },
  {
    id: "dictionary",
    title: "Mien Dictionary",
    author: "Sumeth Prasertsud (Bienh, Zoih Daqv)",
    description: "An Iu Mien – English dictionary, the first of its kind, with thousands of entries covering everyday vocabulary, cultural terms, and traditional expressions. Search and discover the rich vocabulary of the Iu Mien language.",
    type: "reader",
    route: "Dictionary",
    backgroundImage: require("../../assets/images/literature/lit-dictionary.png"),
  },
];

export default function LiteratureScreen() {
  const navigation = useNavigation<LiteratureNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const handleOpenBook = (book: BookItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (book.route) {
      navigation.navigate(book.route as any);
    } else if (book.url) {
      Linking.openURL(book.url);
    }
  };

  const getBookIcon = (book: BookItem) => {
    if (book.type === "reader") return "book";
    if (book.type === "online") return "book-open";
    return "shopping-bag";
  };

  const getBookBadge = (book: BookItem) => {
    if (book.type === "reader") return { label: "Read in App", color: "#8B5CF6" };
    if (book.type === "online") return { label: "Read Online", color: "#22C55E" };
    return { label: "Available for Purchase", color: "#F59E0B" };
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
      <ScrollView
        style={{ zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Library Banner */}
        <View style={[styles.comingSoonBanner, { backgroundColor: theme.surface }]}>
          <Feather name="book-open" size={24} color={isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold} />
          <View style={styles.comingSoonContent}>
            <ThemedText style={[styles.comingSoonTitle, { color: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold }]}>
              Mien Digital Library
            </ThemedText>
            <ThemedText style={[styles.comingSoonText, { color: theme.text }]}>
              Explore the Iu Mien Grammar Book by Dr. Tatsuro Daniel Arisawa, traditional stories, and cultural texts preserving the rich heritage of the Mien people.
            </ThemedText>
          </View>
        </View>

        {/* Featured Books */}
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Featured Collection
        </ThemedText>

        {FEATURED_BOOKS.map((book) => {
          const badge = getBookBadge(book);
          return (
            <Pressable
              key={book.id}
              style={({ pressed }) => [
                styles.bookCard,
                {
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => handleOpenBook(book)}
            >
              {book.backgroundImage ? (
                <ImageBackground
                  source={book.backgroundImage}
                  style={styles.bookCardBg}
                  imageStyle={styles.bookCardBgImage}
                >
                  <LinearGradient
                    colors={isDark ? ["rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"] : ["rgba(255,255,255,0.5)", "rgba(255,255,255,0.88)"]}
                    style={styles.bookCardOverlay}
                  >
                    <View style={[styles.bookIcon, { backgroundColor: (isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal) + "30" }]}>
                      <Feather
                        name={getBookIcon(book) as any}
                        size={24}
                        color={isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal}
                      />
                    </View>
                    <View style={styles.bookInfo}>
                      <ThemedText style={[styles.bookTitle, { color: theme.text }]}>
                        {book.title}
                      </ThemedText>
                      <ThemedText style={[styles.bookAuthor, { color: theme.textSecondary }]}>
                        {book.author}
                      </ThemedText>
                      <ThemedText style={[styles.bookDescription, { color: theme.textSecondary }]} numberOfLines={book.type === "reader" ? 3 : 4}>
                        {book.description}
                      </ThemedText>
                      <View style={[styles.bookTypeBadge, { backgroundColor: badge.color + (isDark ? "30" : "20") }]}>
                        <ThemedText style={[styles.bookTypeText, { color: badge.color }]}>
                          {badge.label}
                        </ThemedText>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </LinearGradient>
                </ImageBackground>
              ) : (
                <View style={[styles.bookCardOverlay, { backgroundColor: theme.surface }]}>
                  <View style={[styles.bookIcon, { backgroundColor: (isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal) + "20" }]}>
                    <Feather
                      name={getBookIcon(book) as any}
                      size={24}
                      color={isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal}
                    />
                  </View>
                  <View style={styles.bookInfo}>
                    <ThemedText style={[styles.bookTitle, { color: theme.text }]}>
                      {book.title}
                    </ThemedText>
                    <ThemedText style={[styles.bookAuthor, { color: theme.textSecondary }]}>
                      {book.author}
                    </ThemedText>
                    <ThemedText style={[styles.bookDescription, { color: theme.textSecondary }]} numberOfLines={4}>
                      {book.description}
                    </ThemedText>
                    <View style={[styles.bookTypeBadge, { backgroundColor: badge.color + (isDark ? "20" : "15") }]}>
                      <ThemedText style={[styles.bookTypeText, { color: badge.color }]}>
                        {badge.label}
                      </ThemedText>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerSection: {
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: Spacing.xs,
  },
  pageDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  comingSoonBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  comingSoonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  bookCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  bookCardBg: {
    width: "100%",
  },
  bookCardBgImage: {
    borderRadius: BorderRadius.lg,
  },
  bookCardOverlay: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  bookIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  bookDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  bookTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  bookTypeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
