import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { MIEN_STORIES } from "./StoryCatalogScreen";
import { useXp } from "@/lib/XpContext";
import { getApiUrl } from "@/lib/query-client";
import { storyTranslations, StoryTranslations } from "@/data/storyTranslations";

type StoryReaderRoute = RouteProp<HomeStackParamList, "StoryReader">;

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

const PROGRESS_KEY = "mien_story_progress_v1";
const LANG_PREF_KEY = "mien_story_language_pref";

export default function StoryReaderScreen() {
  const route = useRoute<StoryReaderRoute>();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const { notifyXpGain } = useXp();
  const story = MIEN_STORIES.find((s) => s.id === route.params.storyId);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showTOC, setShowTOC] = useState(false);
  const [storyCompletedXp, setStoryCompletedXp] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Language toggle state
  const [language, setLanguage] = useState<"english" | "mien">("english");

  // Save reading progress
  React.useEffect(() => {
    if (!story) return;
    AsyncStorage.getItem(PROGRESS_KEY)
      .then((data) => {
        const progress = data ? JSON.parse(data) : {};
        progress[story.id] = { chapter: currentChapter, timestamp: Date.now() };
        return AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      })
      .catch(() => {});
  }, [story?.id, currentChapter]);

  // Load saved progress
  React.useEffect(() => {
    if (!story) return;
    AsyncStorage.getItem(PROGRESS_KEY)
      .then((data) => {
        if (data) {
          const progress = JSON.parse(data);
          if (progress[story.id]?.chapter) {
            setCurrentChapter(progress[story.id].chapter);
          }
        }
      })
      .catch(() => {});
  }, [story?.id]);

  // Load language preference
  React.useEffect(() => {
    AsyncStorage.getItem(LANG_PREF_KEY)
      .then((pref) => {
        if (pref === "mien") setLanguage("mien");
      })
      .catch(() => {});
  }, []);

  const toggleLanguage = useCallback(() => {
    const next = language === "english" ? "mien" : "english";
    setLanguage(next);
    AsyncStorage.setItem(LANG_PREF_KEY, next).catch(() => {});
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [language]);

  const animateTransition = useCallback(
    (nextChapter: number) => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setCurrentChapter(nextChapter);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 150);
    },
    [fadeAnim]
  );

  const goToNextChapter = () => {
    if (!story || currentChapter >= story.chapters.length - 1) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition(currentChapter + 1);
  };

  const goToPrevChapter = () => {
    if (currentChapter <= 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition(currentChapter - 1);
  };

  const goToChapter = (index: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTOC(false);
    animateTransition(index);
  };

  if (!story) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
            Story not found
          </ThemedText>
        </View>
      </View>
    );
  }

  const englishChapter = story.chapters[currentChapter];
  const mienChapter =
    language === "mien" && storyTranslations?.[story.id]?.chapters?.[currentChapter]
      ? storyTranslations[story.id].chapters[currentChapter]
      : null;
  const chapter = mienChapter || englishChapter;
  const isFirst = currentChapter === 0;
  const isLast = currentChapter === story.chapters.length - 1;
  const progress = ((currentChapter + 1) / story.chapters.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />

      {/* Progress Bar */}
      <View style={[styles.progressBar, { top: headerHeight, backgroundColor: theme.surface }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold,
            },
          ]}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + 8,
          paddingBottom: tabBarHeight + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Section */}
        <View style={[styles.coverSection, { backgroundColor: story.coverColor }]}>
          <Image
            source={story.coverImage}
            style={styles.coverImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.coverTextOverlay}
          >
            <ThemedText style={styles.coverStoryTitle}>{story.title}</ThemedText>
            <ThemedText style={styles.coverMienTitle}>{story.mienTitle}</ThemedText>
            <View style={styles.coverMeta}>
              <View style={styles.coverMetaItem}>
                <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                <ThemedText style={styles.coverMetaText}>{story.readTime}</ThemedText>
              </View>
              <View style={styles.coverMetaItem}>
                <Feather name="book-open" size={12} color="rgba(255,255,255,0.7)" />
                <ThemedText style={styles.coverMetaText}>
                  {story.chapters.length} chapters
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Language Toggle */}
        <View style={styles.langToggleRow}>
          <Pressable style={styles.langToggle} onPress={toggleLanguage}>
            <View
              style={[
                styles.langOption,
                language === "english" && {
                  backgroundColor: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.langOptionText,
                  { color: language === "english" ? "#FFF" : theme.textSecondary },
                ]}
              >
                EN
              </ThemedText>
            </View>
            <View
              style={[
                styles.langOption,
                language === "mien" && {
                  backgroundColor: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.langOptionText,
                  { color: language === "mien" ? "#FFF" : theme.textSecondary },
                ]}
              >
                Mien
              </ThemedText>
            </View>
          </Pressable>
          {language === "mien" && !storyTranslations?.[story?.id ?? ""] && (
            <ThemedText style={[styles.translatingText, { color: theme.textSecondary }]}>
              Translation not yet available
            </ThemedText>
          )}
        </View>

        {/* Chapter Content */}
        <Animated.View style={[styles.chapterContent, { opacity: fadeAnim }]}>
          {/* Chapter Header */}
          <View style={styles.chapterHeader}>
            <ThemedText style={[styles.chapterNumber, { color: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold }]}>
              Chapter {currentChapter + 1} of {story.chapters.length}
            </ThemedText>
            <ThemedText style={[styles.chapterTitle, { color: theme.text }]}>
              {chapter.title}
            </ThemedText>
          </View>

          {/* Chapter Text */}
          <View style={[styles.textContainer, { backgroundColor: theme.surface }]}>
            {chapter.content.split("\n\n").map((paragraph, idx) => (
              <ThemedText
                key={idx}
                style={[
                  styles.paragraph,
                  { color: theme.text },
                  idx === 0 && styles.firstParagraph,
                ]}
              >
                {paragraph}
              </ThemedText>
            ))}
          </View>

          {/* End of Story */}
          {isLast && (
            <View style={[styles.endOfStory, { backgroundColor: theme.surface }]}>
              <Feather
                name="bookmark"
                size={24}
                color={isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold}
              />
              <ThemedText style={[styles.endOfStoryTitle, { color: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold }]}>
                End of Story
              </ThemedText>
              <ThemedText style={[styles.endOfStoryText, { color: theme.textSecondary }]}>
                You have finished reading "{story.title}." This story is part of the rich oral tradition of the Iu Mien people.
              </ThemedText>
              <Pressable
                style={[styles.backToCatalogBtn, { backgroundColor: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold }]}
                onPress={async () => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Award story completion XP (only once per viewing)
                  if (!storyCompletedXp && story) {
                    setStoryCompletedXp(true);
                    try {
                      const token = await AsyncStorage.getItem("@mien_kingdom_session");
                      if (token) {
                        const resp = await fetch(
                          new URL(`/api/stories/${story.id}/complete`, getApiUrl()).toString(),
                          { method: "POST", headers: { Authorization: `Bearer ${token}` } }
                        );
                        const data = await resp.json();
                        if (data.success && data.xp > 0) {
                          notifyXpGain(data.xp, data.leveledUp, data.newLevel);
                        }
                      }
                    } catch {}
                  }
                  navigation.goBack();
                }}
              >
                <Feather name="grid" size={16} color="#FFF" />
                <ThemedText style={styles.backToCatalogText}>Back to Stories</ThemedText>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.surface, bottom: tabBarHeight, paddingBottom: Spacing.sm }]}>
        <Pressable
          style={[styles.navButton, isFirst && styles.navButtonDisabled]}
          onPress={goToPrevChapter}
          disabled={isFirst}
        >
          <Feather name="chevron-left" size={20} color={isFirst ? theme.textSecondary + "40" : theme.text} />
          <ThemedText style={[styles.navButtonText, { color: isFirst ? theme.textSecondary + "40" : theme.text }]}>
            Previous
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.tocButton}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowTOC(true);
          }}
        >
          <Feather name="list" size={18} color={isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold} />
        </Pressable>

        <Pressable
          style={[styles.navButton, styles.navButtonRight, isLast && styles.navButtonDisabled]}
          onPress={goToNextChapter}
          disabled={isLast}
        >
          <ThemedText style={[styles.navButtonText, { color: isLast ? theme.textSecondary + "40" : theme.text }]}>
            Next
          </ThemedText>
          <Feather name="chevron-right" size={20} color={isLast ? theme.textSecondary + "40" : theme.text} />
        </Pressable>
      </View>

      {/* Table of Contents Overlay */}
      {showTOC && (
        <Pressable
          style={[styles.tocOverlay, { bottom: tabBarHeight }]}
          onPress={() => setShowTOC(false)}
        >
          <Pressable
            style={[styles.tocPanel, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.tocHeader}>
              <ThemedText style={[styles.tocTitle, { color: theme.text }]}>
                Chapters
              </ThemedText>
              <Pressable onPress={() => setShowTOC(false)}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.tocList}>
              {story.chapters.map((ch, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.tocItem,
                    idx === currentChapter && {
                      backgroundColor: (isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold) + "15",
                    },
                  ]}
                  onPress={() => goToChapter(idx)}
                >
                  <View style={[
                    styles.tocDot,
                    {
                      backgroundColor: idx === currentChapter
                        ? (isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold)
                        : idx < currentChapter
                        ? theme.textSecondary
                        : theme.textSecondary + "40",
                    },
                  ]} />
                  <View style={styles.tocItemContent}>
                    <ThemedText style={[styles.tocChapterNum, { color: theme.textSecondary }]}>
                      Chapter {idx + 1}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.tocChapterTitle,
                        {
                          color: idx === currentChapter
                            ? (isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold)
                            : theme.text,
                        },
                      ]}
                    >
                      {ch.title}
                    </ThemedText>
                  </View>
                  {idx === currentChapter && (
                    <Feather
                      name="book-open"
                      size={14}
                      color={isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      )}
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  coverSection: {
    width: "100%",
    height: 220,
    position: "relative",
    marginBottom: Spacing.lg,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverTextOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingTop: 60,
  },
  coverStoryTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  coverMienTitle: {
    fontSize: 14,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.75)",
    marginBottom: Spacing.sm,
  },
  coverMeta: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  coverMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coverMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  langToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  langToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  langOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  langOptionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  translatingText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  chapterContent: {
    paddingHorizontal: Spacing.lg,
  },
  chapterHeader: {
    marginBottom: Spacing.lg,
  },
  chapterNumber: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  chapterTitle: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  textContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  firstParagraph: {
    fontSize: 16,
    lineHeight: 26,
  },
  endOfStory: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  endOfStoryTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  endOfStoryText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  backToCatalogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  backToCatalogText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
    zIndex: 5,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    flex: 1,
  },
  navButtonRight: {
    justifyContent: "flex-end",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tocButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tocOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 20,
    justifyContent: "flex-end",
  },
  tocPanel: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "60%",
    paddingTop: Spacing.lg,
  },
  tocHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tocTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tocList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  tocItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  tocDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tocItemContent: {
    flex: 1,
  },
  tocChapterNum: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tocChapterTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
});
