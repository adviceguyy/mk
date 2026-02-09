import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ScrollView, Platform, ImageBackground, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

const mienVillage = require("../../assets/images/mien-village.png");
const mienKingdomLogo = require("../../assets/images/mien-kingdom-logo.png");
const translationButton = require("../../assets/images/mien-translation-button.png");
const literatureButton = require("../../assets/images/mien-literature-button.png");
const makeMeMienButton = require("../../assets/images/make-me-mien-button.png");
const mienFoodButton = require("../../assets/images/mien-food-button.png");
const photoRestorationButton = require("../../assets/images/photo-restoration-button.png");
const entertainmentButton = require("../../assets/images/entertainment-button.png");
const companionsImage = require("../../assets/images/ai-companions.png");
const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, "Home">;

interface InsightOfTheDay {
  mien: string;
  english: string;
  category: string;
}

const FALLBACK_INSIGHTS: InsightOfTheDay[] = [
  { mien: "Mienh waac se mbuo nyei gorn-ndoqv", english: "'The Mien language is our heritage.' This proverb captures the Iu Mien belief that language is the living vessel of their identity. For the Mien people, every word carries generations of mountain wisdom, ceremonial knowledge, and ancestral memory.", category: "proverb" },
  { mien: "Hoqc waac se hoqc maengc", english: "'Learning language is learning life.' The Mien believe language is not merely a communication tool but the very essence of existence. To learn Mien is to absorb thousands of years of cultural wisdom passed down from the highlands of southern China.", category: "proverb" },
  { mien: "Ih hnoi maaih maengc yiem, njang hnoi yaac mv hiuv duqv daic fai maiv", english: "'Even if today we are alive, tomorrow we may not know whether we will live or die.' This proverb teaches the Mien to live fully in the present, treasure family bonds, and pass on knowledge without delay.", category: "proverb" },
  { mien: "Mbuo oix zuqc goux mbuo nyei waac weic zuqc waac se mbuo nyei maengc", english: "'We must preserve our language because language is our life.' This saying reflects the urgency felt by Mien elders as younger generations in the diaspora increasingly speak only English, risking the loss of ceremonial language and oral traditions.", category: "cultural" },
  { mien: "Mienh maaih ziepc nyeic fingx", english: "'The Mien have twelve clans.' The twelve-clan system (fingx) is the foundation of Mien social organization. Every Mien person inherits their father's clan name, which determines marriage customs, ceremonial duties, and community bonds across borders.", category: "cultural" },
  { mien: "Nzung nyei waac ndo haic", english: "'The song language is so profound.' Nzung-waac is a special literary register of Mien used in ceremonies and traditional songs, borrowed from ancient Chinese poetic forms. Only trained ritual practitioners (sai mienh) can recite its hundreds of verses.", category: "music_poetry" },
  { mien: "Jiex Sen Borngv se Mienh nyei gorn-ndoqv sou", english: "'The Mountain Crossing Passport is the Mien foundational document.' This sacred text describes the covenant between Emperor Ping Huang and the Mien people, granting them the right to live freely in the mountains without paying taxes. It remains central to Mien identity worldwide.", category: "history" },
  { mien: "Mienh nyei hnyouv oix zuqc hnamv Mienh nyei waac", english: "'The Mien heart must love the Mien language.' The word hnyouv (heart/spirit) is central to Mien philosophy. This saying teaches that true cultural preservation begins with an emotional connection to one's mother tongue.", category: "proverb" },
  { mien: "Maiv maaih waac nor maiv maaih mienh", english: "'Without language there are no people.' This stark proverb reflects the Mien understanding that a people cease to exist when their language dies. It is often quoted by elders urging families to teach children Mien at home.", category: "proverb" },
  { mien: "Mienh hnamv mienh nor mienh duqv yiem", english: "'When people love people, people can live.' This proverb emphasizes mutual care and community solidarity, a core value for the Mien who have survived centuries of migration by supporting one another.", category: "proverb" },
  { mien: "Naaiv nyei dorn-jueiv oix zuqc hiuv ninh mbuo nyei gorn-ndoqv", english: "'The children of this generation must know their heritage.' Gorn-ndoqv (heritage/origin) is a sacred concept for the Mien. This phrase is commonly spoken at gatherings to remind parents of their duty to pass down stories, language, and traditions.", category: "cultural" },
  { mien: "Daux gaux se gorngv taux hnyouv nyei waac", english: "'Praying is speaking from the heart.' In Mien spiritual practice, prayer (daux gaux) is a heartfelt petition to ancestors and the dragon spirit. It uses everyday language, unlike the specialized ritual language (ziec-waac) of formal ceremonies.", category: "spiritual" },
  { mien: "Mienh yiem mbong gu'nguaaic buo cin hnyangx", english: "'The Mien have lived in the high mountains for three thousand years.' The Mien are traditionally highland dwellers who practiced swidden agriculture across southern China and Southeast Asia. Their mountain identity shapes everything from their farming methods to their spiritual practices.", category: "history" },
  { mien: "Mbuo oix zuqc njaaux mbuo nyei fu'jueiv hoqc waac", english: "'We must teach our children to learn language.' Fu'jueiv (children) represent the future of Mien culture. With many Mien youth in America and France growing up speaking only English or French, this phrase has become a rallying cry for language revitalization.", category: "cultural" },
  { mien: "Mienh zaangc ong-taaix weic zuqc oix zuqc jangx jienv", english: "'The Mien worship ancestors because we must remember.' Ancestor veneration (zaangc ong-taaix) is central to Mien spiritual life. Through ceremonies held three times a year, the Mien honor their forebears and maintain the spiritual bond between the living and the departed.", category: "spiritual" },
  { mien: "Bingz Wangz bun Mienh duqv yiem mbong gu'nguaaic", english: "'Emperor Ping Huang granted the Mien to live in the mountains.' According to Mien oral tradition, this ancient covenant exempted the Mien from imperial taxes and allowed self-governance. The story is preserved in the Jiex Sen Borngv and retold at major ceremonies.", category: "story" },
  { mien: "Mienh maaih buo nyungc waac: mienh waac, nzung-waac, caux ziec-waac", english: "'The Mien have three types of language.' Mienh waac is everyday vernacular speech. Nzung-waac is the literary song language used in ceremonies, borrowed from Chinese poetic traditions. Ziec-waac is the sacred ritual language spoken only by practitioners during sacrificial rites.", category: "cultural" },
  { mien: "Mienh nyei gueix-sieqv longc ziec-waac gorngv", english: "'Mien ceremonies use ritual language.' Ziec-waac is a specialized sacred register that only trained sai mienh (ritual practitioners) can speak. During ceremonies lasting up to three days, practitioners chant hundreds of verses to communicate with ancestral spirits.", category: "spiritual" },
  { mien: "Hoqc yaac maiv maaih setv mueiz", english: "'Learning has no end.' This concise proverb encourages lifelong pursuit of knowledge. For the Mien, learning extends beyond books to include oral traditions, ceremonial practices, farming wisdom, and the three registers of the Mien language.", category: "proverb" },
  { mien: "Yie hnamv yie nyei biauv-mienh", english: "'I love my family.' Biauv-mienh (household/family) is the foundation of Mien society. The extended family unit traditionally lived together, sharing meals, farming duties, and ceremonial responsibilities under one roof in the mountain villages.", category: "daily_life" },
];

function getInsightOfTheDay(insights?: InsightOfTheDay[]): InsightOfTheDay {
  const pool = insights && insights.length > 0 ? insights : FALLBACK_INSIGHTS;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return pool[dayOfYear % pool.length];
}

interface FeatureButtonProps {
  image: any;
  onPress: () => void;
  isWide?: boolean;
}

function FeatureButton({ image, onPress, isWide }: FeatureButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.featureButton,
        isWide && styles.featureButtonWide,
        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
    >
      <Image
        source={image}
        style={[styles.featureButtonImage, isWide && styles.featureButtonImageWide]}
        contentFit="cover"
      />
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightOfTheDay[]>([]);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await fetch(new URL("/api/insights/today", getApiUrl()).toString());
        if (response.ok) {
          const data = await response.json();
          if (data.insight) {
            setInsights([data.insight]);
          }
        }
      } catch {
        // Use fallback insights
      }
    };
    loadInsights();
  }, []);

  const todayInsight = getInsightOfTheDay(insights.length > 0 ? insights : undefined);

  const handleSearchPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Search");
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      {/* Top decorative background pattern */}
      <Image
        source={backgroundTop}
        style={styles.backgroundTop}
        contentFit="cover"
      />
      {/* Bottom decorative background pattern */}
      <Image
        source={backgroundBottom}
        style={styles.backgroundBottom}
        contentFit="cover"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Insight of the Day Card */}
        <View style={styles.wordOfDayContainer}>
          <ImageBackground
            source={mienVillage}
            style={styles.wordOfDayBg}
            imageStyle={styles.wordOfDayBgImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={isDark ? ["rgba(0,0,0,0.3)", "rgba(0,0,0,0.75)"] : ["rgba(0,0,0,0.15)", "rgba(0,0,0,0.65)"]}
              style={styles.wordOfDayOverlay}
            >
              <ThemedText style={[styles.wordOfDayLabel, { color: isDark ? "#FFD700" : "#FFD700" }]}>
                Insight of the Day
              </ThemedText>
              <ThemedText style={[styles.wordOfDayWord, { color: "#FFFFFF" }]}>
                {todayInsight.mien}
              </ThemedText>
              <ThemedText style={[styles.wordOfDayMeaning, { color: "#F0E6D0", marginTop: 8 }]}>
                {todayInsight.english}
              </ThemedText>
              <View style={styles.insightCategoryBadge}>
                <ThemedText style={styles.insightCategoryText}>
                  {todayInsight.category.replace(/_/g, " ")}
                </ThemedText>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Feature Buttons Grid */}
        <View style={styles.featureGrid}>
          {/* Row 1 */}
          <View style={styles.featureRow}>
            <FeatureButton
              image={translationButton}
              onPress={() => navigation.navigate("Translate")}
            />
            <FeatureButton
              image={literatureButton}
              onPress={() => navigation.navigate("Literature")}
            />
          </View>

          {/* Row 2 */}
          <View style={styles.featureRow}>
            <FeatureButton
              image={makeMeMienButton}
              onPress={() => navigation.navigate("MakeMeMien")}
            />
            <FeatureButton
              image={mienFoodButton}
              onPress={() => navigation.navigate("MienFood")}
            />
          </View>

          {/* Row 3 */}
          <View style={styles.featureRow}>
            <FeatureButton
              image={photoRestorationButton}
              onPress={() => navigation.navigate("PhotoRestoration")}
            />
            <FeatureButton
              image={entertainmentButton}
              onPress={() => navigation.navigate("Entertainment")}
            />
          </View>
        </View>

        {/* Companions Section */}
        <Pressable
          style={({ pressed }) => [
            styles.companionsContainer,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate("TalkToOng");
          }}
        >
          <Image
            source={companionsImage}
            style={styles.companionsImage}
            contentFit="cover"
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;
const buttonPadding = Spacing.lg * 2 + Spacing.md; // horizontal padding + gap
const buttonWidth = (screenWidth - buttonPadding) / 2;

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
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  // Word of the Day
  wordOfDayContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordOfDayBg: {
    width: "100%",
    minHeight: 280,
  },
  wordOfDayBgImage: {
    borderRadius: BorderRadius.lg,
    top: "-20%",
    opacity: 0.8,
  },
  wordOfDayOverlay: {
    padding: Spacing.lg,
    minHeight: 280,
    justifyContent: "flex-end",
    borderRadius: BorderRadius.lg,
  },
  wordOfDayLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  wordOfDayWord: {
    fontSize: 18,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 4,
    lineHeight: 26,
  },
  wordOfDayMeaning: {
    fontSize: 13,
    lineHeight: 20,
  },
  insightCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 215, 0, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  insightCategoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFD700",
    textTransform: "capitalize",
  },
  // Feature Buttons Grid
  featureGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  featureButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  featureButtonWide: {
    flex: 1,
  },
  featureButtonImage: {
    width: "100%",
    aspectRatio: 1.7,
    borderRadius: BorderRadius.lg,
  },
  featureButtonImageWide: {
    aspectRatio: 3.5,
  },
  // Companions Section
  companionsContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  companionsImage: {
    width: "100%",
    aspectRatio: 4.5,
    borderRadius: BorderRadius.lg,
  },
});
