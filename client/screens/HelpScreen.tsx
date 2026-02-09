import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface Article {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

const HELP_ARTICLES: Article[] = [
  {
    id: "credits",
    title: "How Credits Work",
    icon: "zap",
    description: "Learn about the credit system and how AI features use credits",
  },
  {
    id: "features",
    title: "App Features",
    icon: "star",
    description: "Discover all the features available in Mien Kingdom",
  },
  {
    id: "account",
    title: "Account FAQs",
    icon: "user",
    description: "Common questions about your account and settings",
  },
  {
    id: "terms",
    title: "Terms of Service",
    icon: "file-text",
    description: "Read our terms of service and privacy policy",
  },
];

const ARTICLE_CONTENT: Record<string, string> = {
  credits: `# How Credits Work

Credits are used to access AI-powered features in Mien Kingdom. Here's what you need to know:

## Credit Costs
- Translation: 1 credit per translation
- Recipe Analysis: 2 credits per analysis
- Dress Me (AI transformation): 5 credits
- Photo Restore: 5 credits
- Talk to Avatar: 16 credits per minute

## Talk to Avatar Feature
Talk to Avatar lets you have real-time voice conversations with an AI-powered avatar. This interactive feature uses advanced AI technology for natural conversations, making it perfect for language practice, cultural questions, or just friendly chat. Credits are deducted per minute of conversation.

## Subscription Plans (Monthly Credits)
- Free: 30 credits per month
- Starter ($5/mo): 500 credits per month
- Plus ($15/mo): 1,000 credits per month
- Pro ($30/mo): 2,000 credits per month
- Max ($60/mo): 4,000 credits per month

Subscription credits reset to your plan amount each month.

## Credit Packs (One-Time Purchase)
- 500 Credits: $5.99
- 1,000 Credits: $17.99
- 2,000 Credits: $34.99
- 4,000 Credits: $69.99

Credit pack credits never expire and carry over indefinitely.

## How Credits Are Used
Your subscription credits are used first. Once those are depleted, pack credits are used. This ensures your pack credits are preserved for when you need them most.

## Tips
- Subscription credits reset each billing cycle
- Pack credits never expire
- Talk to Avatar sessions can be ended anytime to conserve credits
- Upgrade your subscription for better monthly value`,

  features: `# App Features

Mien Kingdom offers several unique features for the Mien community:

## Talk to Avatar
Have real-time voice conversations with an AI-powered avatar! Perfect for:
- Practicing Mien language
- Asking cultural questions
- Getting information and assistance
- Friendly conversation and companionship
Uses 16 credits per minute of conversation.

## Translation
Translate Mien language content to English using AI. Supports IuMiNR script.

## Food & Recipes
- Upload a photo of food or describe a dish
- Get AI-generated recipes and ingredients
- Find YouTube tutorials
- Mien dishes get cultural highlights

## Arts
- Dress Me: Transform yourself into traditional Mien wedding attire
- Photo Restore: Colorize and restore vintage photographs

## Social Feed
- Post text, images, and videos
- Rich text formatting with colors and styles
- Follow other Mien community members
- Trending posts based on engagement`,

  account: `# Account FAQs

## How do I change my profile?
Tap "Edit Profile" on the Menu screen to update your display name and photo.

## How do I upgrade my subscription?
Go to Menu > Subscription to view and upgrade your plan.

## Can I connect multiple social accounts?
Currently, we support Google authentication. More providers coming soon.

## How do I contact support?
Go to Menu > Contact Us to ask AI or create a support ticket (paid subscribers).

## Is my data secure?
Yes, we use industry-standard encryption and never share your personal data.

## How does Talk to Avatar work?
Talk to Avatar uses real-time AI voice technology. Simply tap the call button to start a conversation. Credits are deducted per minute while the session is active.`,

  terms: `# Terms of Service

Last Updated: January 2026

Welcome to Mien Kingdom. By accessing or using our application, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.

## 1. Acceptance of Terms

By creating an account or using Mien Kingdom, you agree to these Terms, our Privacy Policy, and our Community Guidelines. If you do not agree, please do not use our services.

## 2. Eligibility

You must be at least 13 years old to use Mien Kingdom. By using our services, you represent that you meet this requirement. Users under 18 must have parental consent.

## 3. Your Account

You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate information and keep it updated. We reserve the right to suspend or terminate accounts that violate these Terms.

## 4. User Content

You retain ownership of content you create and post. By posting content, you grant Mien Kingdom a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your content in connection with our services. You represent that you have the right to post such content.

## 5. Prohibited Conduct

You agree NOT to:
- Post illegal, harmful, threatening, abusive, harassing, defamatory, or obscene content
- Impersonate others or misrepresent your affiliation
- Upload viruses or malicious code
- Collect user information without consent
- Use automated systems to access our services without permission
- Interfere with or disrupt our services
- Violate any applicable laws or regulations
- Engage in hate speech, bullying, or discrimination
- Post sexually explicit content involving minors
- Spam, advertise, or solicit without authorization

## 6. AI-Powered Features & Third-Party Services

IMPORTANT NOTICE: Our AI features (including Talk to Avatar, Translation, Recipe Analysis, Dress Me, and Photo Restore) use third-party AI foundation model providers to deliver services.

- RESULTS MAY VARY: AI-generated content is provided "as is." Results may be inaccurate, incomplete, or vary significantly between uses. AI responses should not be relied upon for medical, legal, financial, or other professional advice.

- THIRD-PARTY AI TRAINING: Content you submit to AI features may be processed by third-party AI providers (such as OpenAI, Google, Meta, Anthropic, and others). These providers may use such data for improving and training their AI models according to their own terms and policies, which we do not control. We recommend reviewing the privacy policies of these third-party providers.

- NO WARRANTY: We make no guarantees regarding the accuracy, reliability, or appropriateness of AI-generated content. Use AI features at your own discretion.

## 7. Credits and Payments

- Credits are required for AI-powered features
- Subscription credits reset monthly; unused credits do not roll over
- Credit pack purchases are final and non-refundable
- We reserve the right to modify credit costs and pricing
- Subscriptions auto-renew unless cancelled before the renewal date

## 8. Intellectual Property

Mien Kingdom and its original content, features, and functionality are owned by us and protected by international copyright, trademark, and other intellectual property laws. Our trademarks may not be used without prior written permission.

## 9. Privacy and Data

Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and share your information. By using our services, you consent to our data practices.

## 10. Content Moderation

We reserve the right to remove any content that violates these Terms or our Community Guidelines. We may also suspend or terminate accounts of repeat offenders. We are not obligated to monitor all content but may do so at our discretion.

## 11. Third-Party Links and Services

Our app may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third parties. You access third-party services at your own risk.

## 12. Disclaimers

MIEN KINGDOM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.

## 13. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, MIEN KINGDOM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OUR SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

## 14. Indemnification

You agree to indemnify and hold harmless Mien Kingdom, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services or violation of these Terms.

## 15. Termination

We may terminate or suspend your account at any time for any reason, including violation of these Terms. Upon termination, your right to use our services ceases immediately. Provisions that should survive termination will remain in effect.

## 16. Changes to Terms

We reserve the right to modify these Terms at any time. We will notify users of material changes through the app or by email. Your continued use after changes constitutes acceptance of the new Terms.

## 17. Governing Law

These Terms are governed by the laws of the United States. Any disputes shall be resolved in the courts of competent jurisdiction.

## 18. Contact Us

If you have questions about these Terms, please contact us through the app's Contact Us feature or email support@mienkingdom.com.

By using Mien Kingdom, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`,
};

export default function HelpScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const handleSelectArticle = (articleId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedArticle(articleId);
  };

  const handleBackToArticles = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedArticle(null);
  };

  const renderArticlesList = () => (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.headerCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: (isDark ? Colors.dark.primary : Colors.light.primary) + "20" }]}>
          <Feather name="book-open" size={32} color={isDark ? Colors.dark.primary : Colors.light.primary} />
        </View>
        <ThemedText style={styles.headerTitle}>Help Center</ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Find answers to common questions
        </ThemedText>
      </View>

      <View style={styles.articlesContainer}>
        {HELP_ARTICLES.map((article) => (
          <Pressable
            key={article.id}
            style={({ pressed }) => [
              styles.articleCard,
              { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => handleSelectArticle(article.id)}
          >
            <View style={[styles.articleIcon, { backgroundColor: (isDark ? Colors.dark.primary : Colors.light.primary) + "20" }]}>
              <Feather name={article.icon} size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            </View>
            <View style={styles.articleContent}>
              <ThemedText style={styles.articleTitle}>{article.title}</ThemedText>
              <ThemedText style={[styles.articleDescription, { color: theme.textSecondary }]}>
                {article.description}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderArticleDetail = () => {
    const article = HELP_ARTICLES.find((a) => a.id === selectedArticle);
    if (!article) return null;

    const content = ARTICLE_CONTENT[selectedArticle!] || "";
    const lines = content.split("\n");

    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backButton} onPress={handleBackToArticles}>
          <Feather name="arrow-left" size={20} color={theme.text} />
          <ThemedText style={styles.backButtonText}>Back to Articles</ThemedText>
        </Pressable>

        <View style={[styles.articleDetailCard, { backgroundColor: theme.surface }]}>
          {lines.map((line, index) => {
            if (line.startsWith("# ")) {
              return (
                <ThemedText key={index} style={styles.h1}>
                  {line.substring(2)}
                </ThemedText>
              );
            } else if (line.startsWith("## ")) {
              return (
                <ThemedText key={index} style={styles.h2}>
                  {line.substring(3)}
                </ThemedText>
              );
            } else if (line.startsWith("- ")) {
              return (
                <View key={index} style={styles.bulletRow}>
                  <ThemedText style={styles.bullet}>•</ThemedText>
                  <ThemedText style={[styles.bodyText, { color: theme.textSecondary }]}>{line.substring(2)}</ThemedText>
                </View>
              );
            } else if (line.trim()) {
              return (
                <ThemedText key={index} style={[styles.bodyText, { color: theme.textSecondary }]}>
                  {line}
                </ThemedText>
              );
            }
            return <View key={index} style={{ height: Spacing.sm }} />;
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.md,
        },
      ]}
    >
      {selectedArticle ? renderArticleDetail() : renderArticlesList()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.lg,
  },
  headerCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  articlesContainer: {
    gap: Spacing.md,
  },
  articleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  articleDescription: {
    fontSize: 13,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  articleDetailCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  h1: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  h2: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  bullet: {
    fontSize: 15,
  },
});
