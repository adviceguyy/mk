import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
  Platform,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getQueryFn } from "@/lib/query-client";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

interface DictionaryEntry {
  id: string;
  mienWord: string;
  englishDefinition: string;
  partOfSpeech: string | null;
}

interface SearchResult {
  entries: DictionaryEntry[];
  total: number;
  page: number;
  limit: number;
}

export default function DictionaryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(text.trim());
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/dictionary/count"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 60 * 60 * 1000,
  });

  const { data: searchData, isLoading, isFetching } = useQuery<SearchResult>({
    queryKey: [`/api/dictionary/search?q=${encodeURIComponent(debouncedQuery)}&limit=50`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30 * 1000,
  });

  const entries = searchData?.entries || [];
  const totalResults = searchData?.total || 0;
  const totalEntries = countData?.count || 0;

  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 1) return [{ text, highlight: false }];
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const parts: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;

    let index = lowerText.indexOf(lowerQuery);
    while (index !== -1) {
      if (index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, index), highlight: false });
      }
      parts.push({
        text: text.slice(index, index + query.length),
        highlight: true,
      });
      lastIndex = index + query.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlight: false });
    }
    return parts.length > 0 ? parts : [{ text, highlight: false }];
  };

  const renderEntry = ({ item }: { item: DictionaryEntry }) => {
    const mienParts = highlightMatch(item.mienWord, debouncedQuery);
    const engParts = highlightMatch(item.englishDefinition, debouncedQuery);
    const highlightColor = isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold;

    return (
      <View style={[styles.entryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.entryHeader}>
          <View style={styles.mienWordRow}>
            <ThemedText style={[styles.mienWord, { color: isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold }]}>
              {mienParts.map((part, i) =>
                part.highlight ? (
                  <ThemedText key={i} style={[styles.mienWord, { backgroundColor: highlightColor + "30", color: highlightColor }]}>
                    {part.text}
                  </ThemedText>
                ) : (
                  <ThemedText key={i} style={styles.mienWord}>{part.text}</ThemedText>
                )
              )}
            </ThemedText>
            {item.partOfSpeech && (
              <ThemedText style={[styles.partOfSpeech, { color: theme.textTertiary }]}>
                {item.partOfSpeech}
              </ThemedText>
            )}
          </View>
        </View>
        <ThemedText style={[styles.englishDef, { color: theme.text }]}>
          {engParts.map((part, i) =>
            part.highlight ? (
              <ThemedText key={i} style={[styles.englishDef, { backgroundColor: highlightColor + "20", fontWeight: "600" }]}>
                {part.text}
              </ThemedText>
            ) : (
              <ThemedText key={i} style={styles.englishDef}>{part.text}</ThemedText>
            )
          )}
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading || isFetching) return null;
    if (!debouncedQuery) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: (isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal) + "20" }]}>
            <Feather name="book-open" size={40} color={isDark ? Colors.dark.heritage.teal : Colors.light.heritage.teal} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            Mien Dictionary
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Search for Mien or English words to find translations.{"\n"}
            {totalEntries > 0 ? `${totalEntries.toLocaleString()} entries available.` : ""}
          </ThemedText>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Feather name="search" size={36} color={theme.textTertiary} />
        <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
          No results found
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Try a different spelling or search term.
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />

      <View style={[styles.content, { paddingTop: headerHeight + Spacing.md }]}>
        {/* Subtitle credit */}
        <View style={styles.creditRow}>
          <ThemedText style={[styles.creditText, { color: theme.textSecondary }]}>
            By Sumeth Prasertsud (Bienh, Zoih Daqv)
          </ThemedText>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search Mien or English words..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <Feather name="x-circle" size={18} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Results count */}
        {debouncedQuery.length > 0 && !isLoading && (
          <ThemedText style={[styles.resultCount, { color: theme.textSecondary }]}>
            {totalResults} {totalResults === 1 ? "result" : "results"} found
          </ThemedText>
        )}

        {/* Loading indicator */}
        {(isLoading || isFetching) && debouncedQuery.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold} />
          </View>
        )}

        {/* Results List */}
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
            flexGrow: entries.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
        />
      </View>
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
  content: {
    flex: 1,
    zIndex: 1,
  },
  creditRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  creditText: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? Spacing.sm + 2 : Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 4 : 2,
  },
  resultCount: {
    fontSize: 13,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  loadingContainer: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  entryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  entryHeader: {
    marginBottom: 4,
  },
  mienWordRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  mienWord: {
    fontSize: 17,
    fontWeight: "700",
  },
  partOfSpeech: {
    fontSize: 13,
    fontStyle: "italic",
  },
  englishDef: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
