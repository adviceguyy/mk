import React from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { SimpleDivider } from "@/components/MienPattern";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: primaryColor + "20" },
            ]}
          >
            <Feather name="heart" size={32} color={primaryColor} />
          </View>
          <ThemedText style={styles.headerTitle}>About Mien Kingdom</ThemedText>
          <SimpleDivider width={80} color={primaryColor} />
          <ThemedText
            style={[styles.headerSubtitle, { color: theme.textSecondary }]}
          >
            Preserving heritage, empowering community
          </ThemedText>
        </View>

        <View style={[styles.contentCard, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>The Mien People</ThemedText>
          <ThemedText
            style={[styles.bodyText, { color: theme.textSecondary }]}
          >
            The Iu Mien (also known as Yao) are an ethnic group with a rich
            history spanning thousands of years across the mountainous regions of
            China, Laos, Thailand, Vietnam, and beyond. Known for their
            intricate cross-stitch embroidery, vibrant ceremonial traditions, and
            a deeply rooted spiritual heritage, the Mien people carry a legacy
            of resilience and cultural richness that is unmatched. After the
            aftermath of the Vietnam War, many Mien families were displaced and
            resettled across the United States, France, Canada, and other
            nations, carrying their traditions with them into a new world.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>
            A Language and Culture at Risk
          </ThemedText>
          <ThemedText
            style={[styles.bodyText, { color: theme.textSecondary }]}
          >
            Today, the Mien language is considered endangered. As younger
            generations assimilate into the dominant cultures of their adopted
            countries, fewer and fewer children grow up speaking Mien at home.
            The oral traditions, folk stories, ceremonial chants, and everyday
            expressions that once defined Mien identity are fading with each
            passing generation. Without deliberate action, the world risks
            losing not just a language, but an entire way of understanding life,
            community, and the sacred bonds between past and present.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>Our Mission</ThemedText>
          <ThemedText
            style={[styles.bodyText, { color: theme.textSecondary }]}
          >
            Mien Kingdom was created with a singular purpose: to preserve,
            celebrate, and enrich Mien culture for current and future
            generations. This app serves as a digital home for the Mien
            community, a place where our people can connect with one another,
            share stories and traditions, learn and practice the Mien language,
            explore our culinary heritage, and express themselves freely. We
            believe that culture thrives when people have the tools and spaces to
            keep it alive, and Mien Kingdom aims to be exactly that.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>
            AI as an Enabling Technology
          </ThemedText>
          <ThemedText
            style={[styles.bodyText, { color: theme.textSecondary }]}
          >
            What makes Mien Kingdom unique is our commitment to harnessing the
            power of artificial intelligence as a force for cultural
            preservation. For underrepresented and minority communities, AI is
            more than just a convenience; it is an enabling technology that
            levels the playing field. Through AI-powered translation, language
            learning tools, recipe analysis, photo restoration, and interactive
            avatars, we are building bridges between generations and making it
            easier than ever for Mien people to engage with their heritage.
            Technology that was once only accessible to large, well-funded
            organizations is now in the hands of our community, empowering us to
            tell our own stories in our own way.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>
            A Place for Our People
          </ThemedText>
          <ThemedText
            style={[styles.bodyText, { color: theme.textSecondary }]}
          >
            Beyond tools and technology, Mien Kingdom is a community. It is a
            space where Mien people from around the world can come together to
            share their experiences, celebrate their identity, and inspire one
            another. Whether you are an elder keeping traditions alive, a young
            person reconnecting with your roots, or simply someone who loves
            Mien culture, this platform is for you. Every post, every
            translation, every recipe shared is a thread woven into the fabric
            of our living heritage.
          </ThemedText>
        </View>

        <View style={[styles.footerCard, { backgroundColor: theme.surface }]}>
          <SimpleDivider width={60} color={primaryColor} />
          <ThemedText
            style={[styles.builtByText, { color: theme.textSecondary }]}
          >
            Built by
          </ThemedText>
          <ThemedText style={[styles.companyName, { color: primaryColor }]}>
            Three Tears LLC
          </ThemedText>
          <ThemedText
            style={[styles.companyTagline, { color: theme.textSecondary }]}
          >
            A team of Mien people, for the Mien people.
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  headerCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  contentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
  },
  footerCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  builtByText: {
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "700",
  },
  companyTagline: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
});
