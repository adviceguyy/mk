import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { getQueryFn, getApiUrl } from "@/lib/query-client";
import { YouTubePlayerModal } from "@/components/YouTubePlayerModal";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type EntertainmentSection = "movies" | "music" | "games";

type MusicCategory = "modern" | "hiphop" | "contemporary" | "lao_thai" | "chinese" | "vietnamese" | "traditional";

interface VideoItem {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  category: MusicCategory;
}

const CURATED_VIDEOS: VideoItem[] = [
  // Modern
  { id: "m1", title: "Mbuox Liuz Meih Maiv Muangx", artist: "Sheena Leiz", youtubeId: "1fNA_QMlg9Y", category: "modern" },
  { id: "m2", title: "Born To Be Poor", artist: "Kumbaung", youtubeId: "e30Up3x-ykw", category: "modern" },
  { id: "m3", title: "Don't Look Me Down (Maiv Dungx Mangc Faix Yie)", artist: "Kumbaung", youtubeId: "_cxq6f1sSLg", category: "modern" },
  { id: "m4", title: "Mbiung Jieqv (Black Rain) - Without You", artist: "YaoKaao Lee", youtubeId: "Ahy0ayR0w1o", category: "modern" },
  { id: "m5", title: "Mbiung Jieqv (Black Rain) - Lomh Zoic Oix", artist: "YaoKaao Lee", youtubeId: "SJshoA2Vwa0", category: "modern" },
  { id: "m6", title: "Wait 4 U - Sugar Cane (Gaam Ziex Band)", artist: "Rushchao", youtubeId: "fOlBIQgX-h0", category: "modern" },
  { id: "m7", title: "Longc Jienv Ngox", artist: "Lindsey Saetern", youtubeId: "D1hzE7dAPY0", category: "modern" },
  { id: "m8", title: "Ih Jaaz Mienh Band", artist: "Ih Jaaz Mienh Band", youtubeId: "f62EXeBqE5c", category: "modern" },
  // Hip Hop / Rap
  { id: "h1", title: "M.I.E.N", artist: "Sirena", youtubeId: "iQky1_3WKHU", category: "hiphop" },
  { id: "h2", title: "Mien Rap", artist: "Kuay Saelee", youtubeId: "xbSCCcToCn4", category: "hiphop" },
  { id: "h3", title: "NAI CHIEM CHAO - Yie Oix Mbuo Dangx Meih", artist: "LYL Mien", youtubeId: "Yp_wla34PWc", category: "hiphop" },
  { id: "h4", title: "Mien Anthem", artist: "flexiflow ft. fahm", youtubeId: "_AkcOcFu5ZQ", category: "hiphop" },
  { id: "h5", title: "MienXCrew - Mien Rap", artist: "ChanMann", youtubeId: "DZk1pU7dzKo", category: "hiphop" },
  // Adult Contemporary
  { id: "a1", title: "Bingx Jienv Hnamv", artist: "IME Iu-Mienh Entertainment", youtubeId: "_8-52Cm1Oow", category: "contemporary" },
  { id: "a2", title: "Strawberry Girl", artist: "USAson Mien", youtubeId: "6oOo6NQtTr8", category: "contemporary" },
  { id: "a3", title: "Muangx Domh Mienh", artist: "Chan Chow Saechao", youtubeId: "ltoTEQCbXuk", category: "contemporary" },
  { id: "a4", title: "KaoChiem & Mouang Chiew", artist: "Iu Mien Media", youtubeId: "h1P2xfVyiqM", category: "contemporary" },
  { id: "a5", title: "Lum Maiv Dungx Gaengh Nzauh", artist: "NAI & CHAI", youtubeId: "t42tXEvXJOE", category: "contemporary" },
  { id: "a6", title: "Wedding Mienh Song", artist: "Iu Mien Artists", youtubeId: "U99RL4hIU1o", category: "contemporary" },
  { id: "a7", title: "Sien Nin Nzung (New Year Song)", artist: "Iu Mien High-5 Band ft. Meuy Fin", youtubeId: "U3cZho8JjdM", category: "contemporary" },
  { id: "a8", title: "Buatc Liuz Meih - Seattle Domh Nziaaux", artist: "ft. Sheena Leiz", youtubeId: "Xvp0rD4M6kk", category: "contemporary" },
  { id: "a9", title: "Meih Gorngv Oix Yie", artist: "Muang & Lai", youtubeId: "qJfA6lceL2s", category: "contemporary" },
  { id: "a10", title: "Squirrel Song", artist: "Lindsey Saetern", youtubeId: "DcQ80j8lARU", category: "contemporary" },
  // Lao/Thai-Iu Mien
  { id: "l1", title: "Hnamv Meih Nduqc Dauh", artist: "Kaolee Saechao", youtubeId: "8L1ieBJ9qnU", category: "lao_thai" },
  { id: "l2", title: "Iu-mienh Sieqv - Ngingpuv", artist: "Ngingpuv", youtubeId: "aT9CWjmIOw0", category: "lao_thai" },
  { id: "l3", title: "Juv Putv Laai", artist: "Liam Piandai", youtubeId: "geSV2bEP3GI", category: "lao_thai" },
  { id: "l4", title: "Horh Norh Eix", artist: "Jiouv Guangv Dangc", youtubeId: "4vdunxKkPx0", category: "lao_thai" },
  { id: "l5", title: "If Only - MienThun 2018", artist: "Mien Thun", youtubeId: "ao_oKp5BNYo", category: "lao_thai" },
  { id: "l6", title: "Moey Mai Eia - Su Pangprik", artist: "Su Pangprik", youtubeId: "zVq9jwM48UQ", category: "lao_thai" },
  // Chinese-Iu Mien
  { id: "c1", title: "Waiting for You in This Life", artist: "Huang Chenggang & Zhao Jinxian", youtubeId: "mi37R0-EYVA", category: "chinese" },
  { id: "c2", title: "Meih Hnangv Haih Zoux Yie La'kuqv", artist: "Li Yinmei", youtubeId: "Q05XZz_rzUU", category: "chinese" },
  // Vietnamese-Iu Mien
  { id: "v1", title: "VietNam Iu Mienh Nzung", artist: "Vietnam Iu Mien", youtubeId: "dEA6hGq3le8", category: "vietnamese" },
  { id: "v2", title: "Tin-Hungh Ceix Liepc Daaih Nyei Jiu-bang", artist: "Mienh Nzung Studio", youtubeId: "kNxAVDdrGUk", category: "vietnamese" },
  // Traditional/Folk
  { id: "t1", title: "Loh Hnoi Nzung: Gorngv Taux Ziouh Dingh Wuonh Baengc", artist: "Iu Mien Media", youtubeId: "MaJok1EEzic", category: "traditional" },
  { id: "t2", title: "Iu Mien Traditional Wedding Song", artist: "Herbal Medicinal Viet Nam", youtubeId: "fdvny2YqG5A", category: "traditional" },
  { id: "t3", title: "Without You (Black Rain)", artist: "Saefong Film", youtubeId: "jhuab2zqN8Y", category: "traditional" },
];

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "modern", label: "Modern" },
  { key: "hiphop", label: "Hip Hop/Rap" },
  { key: "contemporary", label: "Contemporary" },
  { key: "lao_thai", label: "Lao/Thai" },
  { key: "chinese", label: "Chinese" },
  { key: "vietnamese", label: "Vietnamese" },
  { key: "traditional", label: "Traditional" },
];

const CATEGORY_COLORS: Record<string, string> = {
  modern: "#8B5CF6",
  hiphop: "#EF4444",
  contemporary: "#EC4899",
  lao_thai: "#14B8A6",
  chinese: "#F59E0B",
  vietnamese: "#22C55E",
  traditional: "#D4A84B",
};

type MovieCategory = "documentary" | "movie" | "cultural";

interface MovieItem {
  id: string;
  title: string;
  creator: string;
  youtubeId: string;
  category: MovieCategory;
}

const CURATED_MOVIES: MovieItem[] = [
  // Documentaries
  { id: "d1", title: "Discover the Hidden Stories of the Iu Mien People", creator: "Travel Information Channel", youtubeId: "HOtPIW-4NQY", category: "documentary" },
  { id: "d2", title: "Voices From The Mountains", creator: "adviceguyy", youtubeId: "5J4SNim6MHA", category: "documentary" },
  { id: "d3", title: "The Price You Pay - 1983 Southeast Asian Refugees Resettlement", creator: "IU MIEN 12 Clans Channel", youtubeId: "D_KrBXBcypQ", category: "documentary" },
{ id: "d5", title: "Qianjiadong: The Lost Homeland of the Mien People", creator: "SaeternBros", youtubeId: "QgOR1jISToU", category: "documentary" },
  { id: "d6", title: "Qianjiadong, the Lost Paradise of The Iu-Mien People", creator: "BAONG", youtubeId: "yPpdLwaQdeU", category: "documentary" },
  { id: "d7", title: "Searching for Qianjiadong Part II - Yao History Story", creator: "Mr. Hella Good!", youtubeId: "kUtfip3_1w8", category: "documentary" },
  // Movies
  { id: "f1", title: "The Love of Drum (2015)", creator: "IU MIEN 12 Clans Channel", youtubeId: "5AI9jIfzEK8", category: "movie" },
  { id: "f2", title: "The Misfortune of the Stupid Girl", creator: "IU MIEN SH", youtubeId: "tz1dqKCy5DU", category: "movie" },
  { id: "f3", title: "Grandma And Chicken Thighs - Part 1", creator: "IU MIEN SH", youtubeId: "Df6nvvjlZLo", category: "movie" },
  { id: "f4", title: "Mienh Movie", creator: "IME Iu-Mienh Entertainment", youtubeId: "ViYiyHTXC4A", category: "movie" },
  { id: "f5", title: "Siang-caaux Mienh (Full Movie)", creator: "SJ SEA Media", youtubeId: "Dc8hZbKiUKI", category: "movie" },
  { id: "f6", title: "Mborqv Jaax Ciangv (Full Movie)", creator: "SJ SEA Media", youtubeId: "h46fq2yT5MY", category: "movie" },
  // Cultural
  { id: "cu1", title: "Traditional Buddha Ceremony", creator: "Saefong Film", youtubeId: "SfGPKJ0-dcQ", category: "cultural" },
  { id: "cu2", title: "Zoux Daqc Nyei Nzunc Sin - Second Ceremony", creator: "Saefong Film", youtubeId: "Rw6ftHv2CGI", category: "cultural" },
];

const MOVIE_CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "documentary", label: "Documentary" },
  { key: "movie", label: "Movies" },
  { key: "cultural", label: "Cultural" },
];

const MOVIE_CATEGORY_COLORS: Record<string, string> = {
  documentary: "#3B82F6",
  movie: "#EF4444",
  cultural: "#D4A84B",
};

const SECTION_TABS: { key: EntertainmentSection; label: string; icon: string }[] = [
  { key: "games", label: "Games", icon: "play" },
  { key: "movies", label: "Movies", icon: "film" },
  { key: "music", label: "Music", icon: "music" },
];

const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - Spacing.lg * 2 - Spacing.md) / 2;

function getThumbnailUrl(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export default function EntertainmentScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [selectedSection, setSelectedSection] = useState<EntertainmentSection>("games");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMovieCategory, setSelectedMovieCategory] = useState("all");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const goldColor = isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold;

  // Game background images
  const { data: bgData } = useQuery<{ backgrounds: Record<string, string> }>({
    queryKey: ["/api/game/backgrounds"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 60, // cache 1 hour
  });

  const getGameBgUri = (gameType: string) => {
    const path = bgData?.backgrounds?.[gameType];
    if (!path) return null;
    const base = getApiUrl().replace(/\/$/, "");
    return `${base}${path}`;
  };

  const { data: leaderboardData } = useQuery<{
    leaderboard: {
      id: string;
      score: number;
      phrasesCompleted: number;
      userId: string;
      displayName: string;
      avatar: string | null;
    }[];
  }>({
    queryKey: ["/api/game/leaderboard?gameType=wheel_of_fortune"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const top3 = (leaderboardData?.leaderboard || []).slice(0, 3);

  const { data: vocabLeaderboardData } = useQuery<{
    leaderboard: {
      id: string;
      score: number;
      phrasesCompleted: number;
      userId: string;
      displayName: string;
      avatar: string | null;
    }[];
  }>({
    queryKey: ["/api/game/leaderboard?gameType=vocab_match"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const vocabTop3 = (vocabLeaderboardData?.leaderboard || []).slice(0, 3);

  const { data: wordleLeaderboardData } = useQuery<{
    leaderboard: {
      id: string;
      score: number;
      phrasesCompleted: number;
      userId: string;
      displayName: string;
      avatar: string | null;
    }[];
  }>({
    queryKey: ["/api/game/leaderboard?gameType=mien_wordle"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const wordleTop3 = (wordleLeaderboardData?.leaderboard || []).slice(0, 3);

  const filteredVideos = selectedCategory === "all"
    ? CURATED_VIDEOS
    : CURATED_VIDEOS.filter((v) => v.category === selectedCategory);

  const filteredMovies = selectedMovieCategory === "all"
    ? CURATED_MOVIES
    : CURATED_MOVIES.filter((m) => m.category === selectedMovieCategory);

  const handlePlayVideo = (youtubeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPlayingVideoId(youtubeId);
  };

  const renderComingSoon = (icon: string, title: string, description: string) => (
    <View style={[styles.comingSoonContainer, { backgroundColor: theme.surface }]}>
      <View style={[styles.comingSoonIconWrapper, { backgroundColor: goldColor + "15" }]}>
        <Feather name={icon as any} size={40} color={goldColor} />
      </View>
      <ThemedText style={[styles.comingSoonTitle, { color: theme.text }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.comingSoonText, { color: theme.textSecondary }]}>
        {description}
      </ThemedText>
    </View>
  );

  const renderMoviesSection = () => (
    <>
      {/* Movie Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {MOVIE_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedMovieCategory === cat.key
                  ? (cat.key === "all"
                      ? goldColor
                      : MOVIE_CATEGORY_COLORS[cat.key] || Colors.light.heritage.gold)
                  : theme.surface,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedMovieCategory(selectedMovieCategory === cat.key && cat.key !== "all" ? "all" : cat.key);
            }}
          >
            <ThemedText
              style={[
                styles.categoryText,
                {
                  color: selectedMovieCategory === cat.key ? "#FFFFFF" : theme.textSecondary,
                },
              ]}
            >
              {cat.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Movie Count */}
      <ThemedText style={[styles.videoCount, { color: theme.textSecondary }]}>
        {filteredMovies.length} {filteredMovies.length === 1 ? "video" : "videos"}
      </ThemedText>

      {/* Movie Cards Grid */}
      <View style={styles.gridContainer}>
        {filteredMovies.map((movie) => {
          const catColor = MOVIE_CATEGORY_COLORS[movie.category] || Colors.light.heritage.gold;
          const catLabel = MOVIE_CATEGORIES.find((c) => c.key === movie.category)?.label || movie.category;
          return (
            <View key={movie.id} style={[styles.videoCard, { backgroundColor: theme.surface, width: cardWidth }]}>
              <Pressable
                style={({ pressed }) => [styles.videoThumbnail, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => handlePlayVideo(movie.youtubeId)}
              >
                <Image
                  source={{ uri: getThumbnailUrl(movie.youtubeId) }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
                <View style={styles.playOverlay}>
                  <View style={[styles.playButton, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                    <Feather name="play" size={22} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>

              <View style={styles.videoInfo}>
                <ThemedText style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
                  {movie.title}
                </ThemedText>
                <ThemedText style={[styles.videoArtist, { color: theme.textSecondary }]} numberOfLines={1}>
                  {movie.creator}
                </ThemedText>
                <View style={[styles.categoryBadge, { backgroundColor: catColor + "20" }]}>
                  <ThemedText style={[styles.categoryBadgeText, { color: catColor }]}>
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

  const renderMusicSection = () => (
    <>
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === cat.key
                  ? (cat.key === "all"
                      ? goldColor
                      : CATEGORY_COLORS[cat.key] || Colors.light.heritage.gold)
                  : theme.surface,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedCategory(selectedCategory === cat.key && cat.key !== "all" ? "all" : cat.key);
            }}
          >
            <ThemedText
              style={[
                styles.categoryText,
                {
                  color: selectedCategory === cat.key ? "#FFFFFF" : theme.textSecondary,
                },
              ]}
            >
              {cat.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Video Count */}
      <ThemedText style={[styles.videoCount, { color: theme.textSecondary }]}>
        {filteredVideos.length} {filteredVideos.length === 1 ? "video" : "videos"}
      </ThemedText>

      {/* Video Cards Grid */}
      <View style={styles.gridContainer}>
        {filteredVideos.map((video) => {
          const catColor = CATEGORY_COLORS[video.category] || Colors.light.heritage.gold;
          const catLabel = CATEGORIES.find((c) => c.key === video.category)?.label || video.category;
          return (
            <View key={video.id} style={[styles.videoCard, { backgroundColor: theme.surface, width: cardWidth }]}>
              <Pressable
                style={({ pressed }) => [styles.videoThumbnail, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => handlePlayVideo(video.youtubeId)}
              >
                <Image
                  source={{ uri: getThumbnailUrl(video.youtubeId) }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
                <View style={styles.playOverlay}>
                  <View style={[styles.playButton, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                    <Feather name="play" size={22} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>

              {/* Video Info */}
              <View style={styles.videoInfo}>
                <ThemedText style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
                  {video.title}
                </ThemedText>
                <ThemedText style={[styles.videoArtist, { color: theme.textSecondary }]} numberOfLines={1}>
                  {video.artist}
                </ThemedText>
                <View style={[styles.categoryBadge, { backgroundColor: catColor + "20" }]}>
                  <ThemedText style={[styles.categoryBadgeText, { color: catColor }]}>
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
      <ScrollView
        style={{ zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          {SECTION_TABS.map((tab) => {
            const isActive = selectedSection === tab.key;
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
                  setSelectedSection(tab.key);
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

        {/* Section Content */}
        {selectedSection === "music" && renderMusicSection()}

        {selectedSection === "movies" && renderMoviesSection()}

        {selectedSection === "games" && (
          <View style={styles.gamesContainer}>
            {/* Wheel of Fortune Game Card */}
            <View style={[styles.gameCard, { borderColor: "#8B5CF620" }]}>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  navigation.navigate("WheelOfFortune");
                }}
              >
                <View style={styles.gameCardHero}>
                  {getGameBgUri("wheel_of_fortune") ? (
                    <Image
                      source={{ uri: getGameBgUri("wheel_of_fortune")! }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#4C1D95" }]} />
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(30, 10, 60, 0.85)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.gameHeroContent}>
                    <View style={[styles.gameIconBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                      <Feather name="target" size={28} color="#FFD700" />
                    </View>
                    <ThemedText style={styles.gameHeroTitle}>
                      Wheel of Fortune
                    </ThemedText>
                    <ThemedText style={styles.gameHeroDescription}>
                      Spin the wheel, guess Mien phrases letter by letter, and compete on the leaderboard!
                    </ThemedText>
                    <View style={[styles.gamePlayButton, { backgroundColor: "#FFD700" }]}>
                      <Feather name="play" size={16} color="#1a1a2e" />
                      <ThemedText style={[styles.gamePlayText, { color: "#1a1a2e" }]}>Play Now</ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>

              <View style={[styles.gameLeaderboard, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <Pressable
                  style={styles.leaderboardHeader}
                  onPress={() => navigation.navigate("WheelLeaderboard")}
                >
                  <View style={styles.leaderboardHeaderLeft}>
                    <Feather name="award" size={16} color={goldColor} />
                    <ThemedText style={[styles.leaderboardTitle, { color: theme.text }]}>
                      Top Players
                    </ThemedText>
                  </View>
                  <View style={styles.leaderboardHeaderRight}>
                    <ThemedText style={[styles.leaderboardSeeAll, { color: goldColor }]}>
                      See All
                    </ThemedText>
                    <Feather name="chevron-right" size={14} color={goldColor} />
                  </View>
                </Pressable>

                {top3.length > 0 ? (
                  top3.map((entry, index) => {
                    const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                    return (
                      <View key={entry.id} style={[styles.leaderboardRow, index < top3.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                        <View style={[styles.leaderboardMedal, { backgroundColor: medalColors[index] }]}>
                          <ThemedText style={styles.leaderboardMedalText}>{index + 1}</ThemedText>
                        </View>
                        {entry.avatar ? (
                          <Image
                            source={{ uri: entry.avatar }}
                            style={styles.leaderboardAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.leaderboardAvatar, { backgroundColor: theme.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
                            <Feather name="user" size={14} color={theme.textSecondary} />
                          </View>
                        )}
                        <ThemedText style={[styles.leaderboardName, { color: theme.text }]} numberOfLines={1}>
                          {entry.displayName || "Player"}
                        </ThemedText>
                        <ThemedText style={[styles.leaderboardScore, { color: goldColor }]}>
                          {entry.score.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.leaderboardEmpty}>
                    <Feather name="award" size={24} color={theme.textTertiary} />
                    <ThemedText style={[styles.leaderboardEmptyText, { color: theme.textSecondary }]}>
                      No scores yet. Play to be the first!
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Vocab Match Game Card */}
            <View style={[styles.gameCard, { borderColor: "#14B8A620" }]}>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  navigation.navigate("VocabMatch");
                }}
              >
                <View style={styles.gameCardHero}>
                  {getGameBgUri("vocab_match") ? (
                    <Image
                      source={{ uri: getGameBgUri("vocab_match")! }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#064E3B" }]} />
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(6, 40, 30, 0.85)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.gameHeroContent}>
                    <View style={[styles.gameIconBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                      <Feather name="book-open" size={28} color="#34D399" />
                    </View>
                    <ThemedText style={styles.gameHeroTitle}>
                      Vocab Match
                    </ThemedText>
                    <ThemedText style={styles.gameHeroDescription}>
                      Match Mien words to pictures! Tap the correct object before time runs out.
                    </ThemedText>
                    <View style={[styles.gamePlayButton, { backgroundColor: "#34D399" }]}>
                      <Feather name="play" size={16} color="#064E3B" />
                      <ThemedText style={[styles.gamePlayText, { color: "#064E3B" }]}>Play Now</ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>

              <View style={[styles.gameLeaderboard, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <Pressable
                  style={styles.leaderboardHeader}
                  onPress={() => navigation.navigate("VocabMatchLeaderboard")}
                >
                  <View style={styles.leaderboardHeaderLeft}>
                    <Feather name="award" size={16} color={goldColor} />
                    <ThemedText style={[styles.leaderboardTitle, { color: theme.text }]}>
                      Top Players
                    </ThemedText>
                  </View>
                  <View style={styles.leaderboardHeaderRight}>
                    <ThemedText style={[styles.leaderboardSeeAll, { color: goldColor }]}>
                      See All
                    </ThemedText>
                    <Feather name="chevron-right" size={14} color={goldColor} />
                  </View>
                </Pressable>

                {vocabTop3.length > 0 ? (
                  vocabTop3.map((entry, index) => {
                    const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                    return (
                      <View key={entry.id} style={[styles.leaderboardRow, index < vocabTop3.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                        <View style={[styles.leaderboardMedal, { backgroundColor: medalColors[index] }]}>
                          <ThemedText style={styles.leaderboardMedalText}>{index + 1}</ThemedText>
                        </View>
                        {entry.avatar ? (
                          <Image
                            source={{ uri: entry.avatar }}
                            style={styles.leaderboardAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.leaderboardAvatar, { backgroundColor: theme.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
                            <Feather name="user" size={14} color={theme.textSecondary} />
                          </View>
                        )}
                        <ThemedText style={[styles.leaderboardName, { color: theme.text }]} numberOfLines={1}>
                          {entry.displayName || "Player"}
                        </ThemedText>
                        <ThemedText style={[styles.leaderboardScore, { color: goldColor }]}>
                          {entry.score.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.leaderboardEmpty}>
                    <Feather name="award" size={24} color={theme.textTertiary} />
                    <ThemedText style={[styles.leaderboardEmptyText, { color: theme.textSecondary }]}>
                      No scores yet. Play to be the first!
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Mien Wordle Game Card */}
            <View style={[styles.gameCard, { borderColor: "#3B82F620" }]}>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  navigation.navigate("MienWordle");
                }}
              >
                <View style={styles.gameCardHero}>
                  {getGameBgUri("mien_wordle") ? (
                    <Image
                      source={{ uri: getGameBgUri("mien_wordle")! }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#1E3A5F" }]} />
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(10, 20, 50, 0.85)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.gameHeroContent}>
                    <View style={[styles.gameIconBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                      <Feather name="type" size={28} color="#60A5FA" />
                    </View>
                    <ThemedText style={styles.gameHeroTitle}>
                      Mien Wordle
                    </ThemedText>
                    <ThemedText style={styles.gameHeroDescription}>
                      Guess the Mien word from its English definition. Solve it fast for bonus points!
                    </ThemedText>
                    <View style={[styles.gamePlayButton, { backgroundColor: "#60A5FA" }]}>
                      <Feather name="play" size={16} color="#1E3A5F" />
                      <ThemedText style={[styles.gamePlayText, { color: "#1E3A5F" }]}>Play Now</ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>

              <View style={[styles.gameLeaderboard, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <Pressable
                  style={styles.leaderboardHeader}
                  onPress={() => navigation.navigate("MienWordleLeaderboard")}
                >
                  <View style={styles.leaderboardHeaderLeft}>
                    <Feather name="award" size={16} color={goldColor} />
                    <ThemedText style={[styles.leaderboardTitle, { color: theme.text }]}>
                      Top Players
                    </ThemedText>
                  </View>
                  <View style={styles.leaderboardHeaderRight}>
                    <ThemedText style={[styles.leaderboardSeeAll, { color: goldColor }]}>
                      See All
                    </ThemedText>
                    <Feather name="chevron-right" size={14} color={goldColor} />
                  </View>
                </Pressable>

                {wordleTop3.length > 0 ? (
                  wordleTop3.map((entry, index) => {
                    const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                    return (
                      <View key={entry.id} style={[styles.leaderboardRow, index < wordleTop3.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                        <View style={[styles.leaderboardMedal, { backgroundColor: medalColors[index] }]}>
                          <ThemedText style={styles.leaderboardMedalText}>{index + 1}</ThemedText>
                        </View>
                        {entry.avatar ? (
                          <Image
                            source={{ uri: entry.avatar }}
                            style={styles.leaderboardAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.leaderboardAvatar, { backgroundColor: theme.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
                            <Feather name="user" size={14} color={theme.textSecondary} />
                          </View>
                        )}
                        <ThemedText style={[styles.leaderboardName, { color: theme.text }]} numberOfLines={1}>
                          {entry.displayName || "Player"}
                        </ThemedText>
                        <ThemedText style={[styles.leaderboardScore, { color: goldColor }]}>
                          {entry.score.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.leaderboardEmpty}>
                    <Feather name="award" size={24} color={theme.textTertiary} />
                    <ThemedText style={[styles.leaderboardEmptyText, { color: theme.textSecondary }]}>
                      No scores yet. Play to be the first!
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <YouTubePlayerModal
        visible={!!playingVideoId}
        youtubeId={playingVideoId}
        onClose={() => setPlayingVideoId(null)}
      />
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
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  videoCount: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  videoCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  videoThumbnail: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    padding: Spacing.sm,
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    lineHeight: 16,
  },
  videoArtist: {
    fontSize: 11,
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  comingSoonContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  comingSoonIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  gamesContainer: {
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  gameCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gameCardHero: {
    height: 220,
    position: "relative",
    overflow: "hidden",
  },
  gameHeroContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: 6,
  },
  gameIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gameHeroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gameHeroDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
    paddingHorizontal: Spacing.md,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gamePlayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gamePlayText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  gameLeaderboard: {
    borderTopWidth: 1,
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  leaderboardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leaderboardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  leaderboardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  leaderboardSeeAll: {
    fontSize: 13,
    fontWeight: "700",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  leaderboardMedal: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardMedalText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  leaderboardAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
  },
  leaderboardName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  leaderboardScore: {
    fontSize: 14,
    fontWeight: "bold",
  },
  leaderboardEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6,
  },
  leaderboardEmptyText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
