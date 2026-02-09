import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, ImageBackground, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface DiagnosticResult {
  success: boolean;
  steps: {
    step: string;
    status: "success" | "error" | "warning" | "info";
    message: string;
  }[];
  summary: string;
}

export default function AdminUtilitiesScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [isTestingVeo, setIsTestingVeo] = useState(false);
  const [veoResult, setVeoResult] = useState<DiagnosticResult | null>(null);

  const testVeoConnection = async () => {
    setIsTestingVeo(true);
    setVeoResult(null);

    try {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      const response = await fetch(new URL("/api/admin/test-veo-connection", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setVeoResult(data);
    } catch (error: any) {
      setVeoResult({
        success: false,
        steps: [
          {
            step: "Connection",
            status: "error",
            message: error.message || "Failed to connect to test endpoint",
          },
        ],
        summary: "Connection test failed",
      });
    } finally {
      setIsTestingVeo(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Feather name="check-circle" size={18} color="#22C55E" />;
      case "error":
        return <Feather name="x-circle" size={18} color="#EF4444" />;
      case "warning":
        return <Feather name="alert-triangle" size={18} color="#F59E0B" />;
      default:
        return <Feather name="info" size={18} color="#3B82F6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#22C55E";
      case "error":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      default:
        return "#3B82F6";
    }
  };

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <ThemedText style={styles.title}>Utilities</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          System diagnostics and connection tests
        </ThemedText>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? "#7C3AED" : "#8B5CF6" }]}>
              <Feather name="video" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.cardHeaderText}>
              <ThemedText style={styles.cardTitle}>Veo 3.1 Connection Test</ThemedText>
              <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
                Tests Google Vertex AI Veo 3.1 video generation API connection
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.testButton,
              {
                backgroundColor: isTestingVeo ? "#4B5563" : "#7C3AED",
                opacity: pressed && !isTestingVeo ? 0.9 : 1,
              },
            ]}
            onPress={testVeoConnection}
            disabled={isTestingVeo}
          >
            {isTestingVeo ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <ThemedText style={styles.testButtonText}>Running Diagnostics...</ThemedText>
              </>
            ) : (
              <>
                <Feather name="zap" size={18} color="#FFFFFF" />
                <ThemedText style={styles.testButtonText}>Test Veo 3 Connection</ThemedText>
              </>
            )}
          </Pressable>

          {veoResult ? (
            <View style={[styles.resultContainer, { borderColor: theme.border }]}>
              <View style={[styles.summaryBanner, { 
                backgroundColor: veoResult.success ? "#22C55E20" : "#EF444420" 
              }]}>
                {veoResult.success ? (
                  <Feather name="check-circle" size={20} color="#22C55E" />
                ) : (
                  <Feather name="x-circle" size={20} color="#EF4444" />
                )}
                <ThemedText style={[styles.summaryText, { 
                  color: veoResult.success ? "#22C55E" : "#EF4444" 
                }]}>
                  {veoResult.summary}
                </ThemedText>
              </View>

              <ThemedText style={[styles.stepsTitle, { color: theme.textSecondary }]}>
                Diagnostic Steps:
              </ThemedText>

              {veoResult.steps.map((step, index) => (
                <View key={index} style={[styles.stepRow, { borderBottomColor: theme.border }]}>
                  {getStatusIcon(step.status)}
                  <View style={styles.stepContent}>
                    <ThemedText style={styles.stepName}>{step.step}</ThemedText>
                    <ThemedText style={[styles.stepMessage, { color: getStatusColor(step.status) }]}>
                      {step.message}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Feather name="info" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            This test verifies your Google Cloud Project ID, service account credentials, and Veo 3.1 API access.
          </ThemedText>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
