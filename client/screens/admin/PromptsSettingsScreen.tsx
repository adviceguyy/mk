import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ImageBackground,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface Prompt {
  key: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  isCustom: boolean;
  serviceKey: string | null;
}

interface AiServiceConfig {
  serviceKey: string;
  displayName: string;
  modelName: string;
  availableModels: string[];
  endpointUrl: string | null;
  defaultEndpointUrl: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  sourceType: string;
}

interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  details?: string;
  modelUsed?: string;
}

interface VoiceOption {
  value: string;
  label: string;
  description: string;
}

interface AvatarSettings {
  id: string;
  voice: string;
  prompt: string;
  voiceOptions: VoiceOption[];
}

interface AvatarAgentStatus {
  running: boolean;
  pid: number | null;
  restartCount: number;
  managedByServer: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  translation: "Translation",
  recipe: "Recipe",
  image_generation: "Image Generation",
  video_generation: "Video Generation",
  assistant: "Assistant",
  settings: "Settings",
  custom: "Custom",
};

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  translation: "globe",
  recipe: "book-open",
  image_generation: "image",
  video_generation: "video",
  assistant: "message-circle",
  settings: "settings",
  custom: "code",
};

const SERVICE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  google_gemini: "zap",
  openai: "cpu",
  anthropic: "message-circle",
  grok: "star",
  wavespeed: "image",
};

const fetchPrompts = async (): Promise<Prompt[]> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/prompts", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch prompts");
  return response.json();
};

const fetchAiServices = async (): Promise<AiServiceConfig[]> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/ai-services", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch AI services");
  return response.json();
};

const updatePrompt = async (data: { key: string; prompt: string }): Promise<any> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/prompts/${data.key}`, getApiUrl()).toString(), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt: data.prompt }),
  });
  if (!response.ok) throw new Error("Failed to update prompt");
  return response.json();
};

const resetPromptToDefault = async (key: string): Promise<any> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/prompts/${key}/reset`, getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to reset prompt");
  return response.json();
};

const updateAiService = async (data: { serviceKey: string; modelName?: string; apiKey?: string; isEnabled?: boolean }): Promise<any> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/ai-services/${data.serviceKey}`, getApiUrl()).toString(), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update AI service");
  return response.json();
};

const testAiService = async (serviceKey: string): Promise<TestResult> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/admin/ai-services/${serviceKey}/test`, getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to test AI service");
  return response.json();
};

const fetchAvatarSettings = async (): Promise<AvatarSettings> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/avatar-settings", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch avatar settings");
  return response.json();
};

const updateAvatarSettings = async (data: { voice?: string; prompt?: string }): Promise<AvatarSettings> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/avatar-settings", getApiUrl()).toString(), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update avatar settings");
  return response.json();
};

const fetchAvatarAgentStatus = async (): Promise<AvatarAgentStatus> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/avatar-agent/status", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch avatar agent status");
  return response.json();
};

const restartAvatarAgent = async (): Promise<{ success: boolean; message: string }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/avatar-agent/restart", getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to restart avatar agent");
  return response.json();
};

const stopAvatarAgent = async (): Promise<{ success: boolean; message: string }> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/avatar-agent/stop", getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to stop avatar agent");
  return response.json();
};

const seedAiSettings = async (): Promise<{
  message: string;
  prompts: { seeded: number; skipped: number };
  services: { seeded: number; skipped: number };
  avatar: { seeded: boolean };
}> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/seed-ai-settings", getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to seed AI settings");
  return response.json();
};

export default function PromptsSettingsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"services" | "prompts" | "avatar">("services");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<AiServiceConfig | null>(null);
  const [serviceFormData, setServiceFormData] = useState({ modelName: "", apiKey: "", isEnabled: true });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [avatarVoice, setAvatarVoice] = useState("");
  const [avatarPrompt, setAvatarPrompt] = useState("");

  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["/api/admin/prompts"],
    queryFn: fetchPrompts,
  });

  const { data: aiServices, isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ["/api/admin/ai-services"],
    queryFn: fetchAiServices,
  });

  const { data: avatarSettings, isLoading: avatarLoading } = useQuery({
    queryKey: ["/api/admin/avatar-settings"],
    queryFn: fetchAvatarSettings,
  });

  const updatePromptMutation = useMutation({
    mutationFn: updatePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
      setSelectedPrompt(null);
      showAlert("Success", "Prompt updated successfully");
    },
    onError: (error: any) => showAlert("Error", error.message || "Failed to update prompt"),
  });

  const resetMutation = useMutation({
    mutationFn: resetPromptToDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
      setSelectedPrompt(null);
      showAlert("Success", "Prompt reset to default");
    },
    onError: (error: any) => showAlert("Error", error.message || "Failed to reset prompt"),
  });

  const updateServiceMutation = useMutation({
    mutationFn: updateAiService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-services"] });
      setSelectedService(null);
      showAlert("Success", "AI service updated successfully");
    },
    onError: (error: any) => showAlert("Error", error.message || "Failed to update AI service"),
  });

  const updateAvatarMutation = useMutation({
    mutationFn: updateAvatarSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/avatar-settings"] });
      setAvatarVoice(data.voice);
      setAvatarPrompt(data.prompt);
      showAlert("Success", "Avatar settings updated successfully");
    },
    onError: (error: any) => showAlert("Error", error.message || "Failed to update avatar settings"),
  });

  const { data: agentStatus, refetch: refetchAgentStatus } = useQuery({
    queryKey: ["/api/admin/avatar-agent/status"],
    queryFn: fetchAvatarAgentStatus,
    refetchInterval: 5000, // Poll every 5 seconds when on avatar tab
    enabled: activeTab === "avatar",
  });

  const restartAgentMutation = useMutation({
    mutationFn: restartAvatarAgent,
    onSuccess: (data) => {
      showAlert("Success", data.message);
      // Refetch status after a short delay
      setTimeout(() => refetchAgentStatus(), 2000);
    },
    onError: (error: any) => showAlert("Error", error.message || "Failed to restart avatar agent"),
  });

  const stopAgentMutation = useMutation({
    mutationFn: stopAvatarAgent,
    onSuccess: (data) => {
      showAlert("Success", data.message);
      // Refetch status after a short delay
      setTimeout(() => refetchAgentStatus(), 2000);
    },
    onError: (error: any) => showAlert("Error", error.message || "Failed to stop avatar agent"),
  });

  const seedMutation = useMutation({
    mutationFn: seedAiSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/avatar-settings"] });
      showAlert(
        "Success",
        `Seeded ${data.prompts.seeded} prompts, ${data.services.seeded} services${data.avatar.seeded ? ", and avatar defaults" : ""}.${data.prompts.skipped + data.services.skipped > 0 ? ` Skipped ${data.prompts.skipped + data.services.skipped} existing entries.` : ""}`
      );
    },
    onError: (error: any) => showAlert("Error", error.message || "Failed to seed AI settings"),
  });

  // Initialize avatar form when data loads
  React.useEffect(() => {
    if (avatarSettings) {
      setAvatarVoice(avatarSettings.voice);
      setAvatarPrompt(avatarSettings.prompt);
    }
  }, [avatarSettings]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditedPrompt(prompt.prompt);
  };

  const handleSavePrompt = () => {
    if (!selectedPrompt) return;
    updatePromptMutation.mutate({ key: selectedPrompt.key, prompt: editedPrompt });
  };

  const handleResetPrompt = () => {
    if (!selectedPrompt) return;
    if (Platform.OS === "web") {
      if (window.confirm("Reset this prompt to its default value?")) {
        resetMutation.mutate(selectedPrompt.key);
      }
    } else {
      Alert.alert("Reset Prompt", "Reset this prompt to its default value?", [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => resetMutation.mutate(selectedPrompt.key) },
      ]);
    }
  };

  const handleEditService = (service: AiServiceConfig) => {
    setSelectedService(service);
    setServiceFormData({
      modelName: service.modelName,
      apiKey: "",
      isEnabled: service.isEnabled,
    });
    setTestResult(null);
  };

  const handleSaveService = () => {
    if (!selectedService) return;
    updateServiceMutation.mutate({
      serviceKey: selectedService.serviceKey,
      modelName: serviceFormData.modelName,
      apiKey: serviceFormData.apiKey || undefined,
      isEnabled: serviceFormData.isEnabled,
    });
  };

  const handleTestService = async () => {
    if (!selectedService) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testAiService(selectedService.serviceKey);
      setTestResult(result);
      refetchServices();
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const categories = prompts ? Array.from(new Set(prompts.map((p) => p.category))).sort() : [];
  const filteredPrompts = prompts
    ? filterCategory ? prompts.filter((p) => p.category === filterCategory) : prompts
    : [];
  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) acc[prompt.category] = [];
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);

  const isLoading = promptsLoading || servicesLoading || avatarLoading;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ImageBackground source={mienPatternBg} style={{ flex: 1 }} resizeMode="repeat">
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {/* Header */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.sectionTitle}>AI Configuration</ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Configure AI services and customize prompts. Three Tears can push updates to override these settings.
              </ThemedText>
            </View>
            <Pressable
              style={[styles.seedButton, { backgroundColor: theme.primary, opacity: seedMutation.isPending ? 0.6 : 1 }]}
              onPress={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="download" size={14} color="#FFFFFF" />
                  <ThemedText style={styles.seedButtonText}>Seed Defaults</ThemedText>
                </>
              )}
            </Pressable>
          </View>
          {user && (
            <View style={[styles.userInfoRow, { borderTopColor: theme.border }]}>
              <Feather name="user" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.userInfoText, { color: theme.textSecondary }]}>
                Logged in as {user.displayName} ({user.email})
              </ThemedText>
            </View>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
          <Pressable
            style={[styles.tab, activeTab === "services" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("services")}
          >
            <Feather name="cpu" size={16} color={activeTab === "services" ? "#FFFFFF" : theme.text} />
            <ThemedText style={[styles.tabText, { color: activeTab === "services" ? "#FFFFFF" : theme.text }]}>
              AI Services
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "prompts" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("prompts")}
          >
            <Feather name="edit-3" size={16} color={activeTab === "prompts" ? "#FFFFFF" : theme.text} />
            <ThemedText style={[styles.tabText, { color: activeTab === "prompts" ? "#FFFFFF" : theme.text }]}>
              Prompts
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "avatar" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("avatar")}
          >
            <Feather name="user" size={16} color={activeTab === "avatar" ? "#FFFFFF" : theme.text} />
            <ThemedText style={[styles.tabText, { color: activeTab === "avatar" ? "#FFFFFF" : theme.text }]}>
              AI Avatar
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "services" ? (
          <>
            {/* AI Services List */}
            {aiServices?.map((service) => (
              <Pressable
                key={service.serviceKey}
                style={[styles.serviceCard, { backgroundColor: theme.surface }]}
                onPress={() => handleEditService(service)}
              >
                <View style={styles.serviceHeader}>
                  <View style={[styles.serviceIcon, { backgroundColor: service.isEnabled ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }]}>
                    <Feather
                      name={SERVICE_ICONS[service.serviceKey] || "cpu"}
                      size={24}
                      color={service.isEnabled ? "#10B981" : "#EF4444"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.serviceName}>{service.displayName}</ThemedText>
                    <ThemedText style={[styles.serviceModel, { color: theme.textSecondary }]}>
                      Model: {service.modelName}
                    </ThemedText>
                  </View>
                  <View style={styles.serviceBadges}>
                    {service.hasApiKey ? (
                      <View style={[styles.badge, { backgroundColor: "#10B981" }]}>
                        <ThemedText style={styles.badgeText}>API Key Set</ThemedText>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                        <ThemedText style={styles.badgeText}>No API Key</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.serviceDetails}>
                  <View style={styles.detailRow}>
                    <Feather name="key" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                      {service.apiKeyMasked}
                    </ThemedText>
                  </View>
                  {service.lastTestStatus && (
                    <View style={styles.detailRow}>
                      <Feather
                        name={service.lastTestStatus === "success" ? "check-circle" : "alert-circle"}
                        size={14}
                        color={service.lastTestStatus === "success" ? "#10B981" : "#EF4444"}
                      />
                      <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                        Last test: {service.lastTestStatus === "success" ? "Passed" : service.lastTestStatus}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </>
        ) : activeTab === "prompts" ? (
          <>
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
              <Pressable
                style={[styles.filterChip, { backgroundColor: filterCategory === null ? theme.primary : theme.surface }]}
                onPress={() => setFilterCategory(null)}
              >
                <Feather name="layers" size={14} color={filterCategory === null ? "#FFFFFF" : theme.text} />
                <ThemedText style={[styles.filterChipText, { color: filterCategory === null ? "#FFFFFF" : theme.text }]}>All</ThemedText>
              </Pressable>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={[styles.filterChip, { backgroundColor: filterCategory === category ? theme.primary : theme.surface }]}
                  onPress={() => setFilterCategory(category)}
                >
                  <Feather name={CATEGORY_ICONS[category] || "file-text"} size={14} color={filterCategory === category ? "#FFFFFF" : theme.text} />
                  <ThemedText style={[styles.filterChipText, { color: filterCategory === category ? "#FFFFFF" : theme.text }]}>
                    {CATEGORY_LABELS[category] || category}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            {/* Prompts List */}
            {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
              <View key={category} style={{ marginBottom: Spacing.lg }}>
                <View style={styles.categoryHeader}>
                  <Feather name={CATEGORY_ICONS[category] || "file-text"} size={18} color={theme.primary} />
                  <ThemedText style={[styles.categoryTitle, { color: theme.text }]}>{CATEGORY_LABELS[category] || category}</ThemedText>
                  <ThemedText style={[styles.categoryCount, { color: theme.textSecondary }]}>({categoryPrompts.length})</ThemedText>
                </View>
                {categoryPrompts.map((prompt) => (
                  <Pressable key={prompt.key} style={[styles.promptCard, { backgroundColor: theme.surface }]} onPress={() => handleEditPrompt(prompt)}>
                    <View style={styles.promptHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.promptName}>{prompt.name}</ThemedText>
                        <ThemedText style={[styles.promptKey, { color: theme.textSecondary }]}>{prompt.key}</ThemedText>
                      </View>
                      <View style={styles.promptBadges}>
                        {prompt.isCustom && (
                          <View style={[styles.badge, { backgroundColor: "#F59E0B" }]}>
                            <ThemedText style={styles.badgeText}>Custom</ThemedText>
                          </View>
                        )}
                        <Feather name="edit-2" size={16} color={theme.textSecondary} />
                      </View>
                    </View>
                    <ThemedText style={[styles.promptDescription, { color: theme.textSecondary }]} numberOfLines={2}>{prompt.description}</ThemedText>
                    <ThemedText style={[styles.promptPreview, { color: theme.textSecondary }]} numberOfLines={2}>{prompt.prompt.substring(0, 150)}...</ThemedText>
                  </Pressable>
                ))}
              </View>
            ))}
          </>
        ) : activeTab === "avatar" ? (
          <>
            {/* AI Avatar Settings */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.avatarHeader}>
                <View style={[styles.avatarIcon, { backgroundColor: "rgba(139, 92, 246, 0.1)" }]}>
                  <Feather name="user" size={32} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.sectionTitle}>Talk to Ong</ThemedText>
                  <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Configure the AI avatar voice and personality
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Agent Process Status */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.agentStatusRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.modalLabel, { color: theme.textSecondary, marginBottom: Spacing.xs }]}>
                    Avatar Agent Process
                  </ThemedText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: agentStatus?.running ? "#22C55E" : "#EF4444" },
                      ]}
                    />
                    <ThemedText style={{ color: theme.text }}>
                      {agentStatus?.running ? "Running" : "Stopped"}
                      {agentStatus?.pid && ` (PID: ${agentStatus.pid})`}
                    </ThemedText>
                    {agentStatus?.running && !agentStatus?.managedByServer && (
                      <View style={[styles.badge, { backgroundColor: "#6366F1" }]}>
                        <ThemedText style={styles.badgeText}>External</ThemedText>
                      </View>
                    )}
                  </View>
                  {(agentStatus?.restartCount ?? 0) > 0 && (
                    <ThemedText style={[styles.subtitle, { color: theme.textSecondary, marginTop: Spacing.xs }]}>
                      Restart count: {agentStatus?.restartCount}
                    </ThemedText>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  {agentStatus?.running && (
                    <Pressable
                      style={[
                        styles.restartButton,
                        {
                          backgroundColor: "#EF4444",
                          opacity: stopAgentMutation.isPending ? 0.6 : 1,
                        },
                      ]}
                      onPress={() => stopAgentMutation.mutate()}
                      disabled={stopAgentMutation.isPending}
                    >
                      {stopAgentMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Feather name="square" size={16} color="#FFFFFF" />
                          <ThemedText style={styles.restartButtonText}>Stop</ThemedText>
                        </>
                      )}
                    </Pressable>
                  )}
                  <Pressable
                    style={[
                      styles.restartButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: restartAgentMutation.isPending ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => restartAgentMutation.mutate()}
                    disabled={restartAgentMutation.isPending}
                  >
                    {restartAgentMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                        <ThemedText style={styles.restartButtonText}>Restart</ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Voice Selection */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
                Voice
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
                Select the voice for the AI avatar (powered by Google Gemini)
              </ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <Picker
                  selectedValue={avatarVoice}
                  onValueChange={(value) => setAvatarVoice(value)}
                  style={{ color: theme.text }}
                >
                  {avatarSettings?.voiceOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={`${option.label} - ${option.description}`}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Avatar Prompt */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
                Avatar Personality & Instructions
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
                Define how Ong should behave and respond to users
              </ThemedText>
              <TextInput
                style={[styles.promptInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={avatarPrompt}
                onChangeText={setAvatarPrompt}
                multiline
                numberOfLines={15}
                textAlignVertical="top"
                placeholder="Enter avatar instructions..."
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Save Button */}
            <Pressable
              style={[styles.saveAvatarButton, { backgroundColor: theme.primary, opacity: updateAvatarMutation.isPending ? 0.6 : 1 }]}
              onPress={() => updateAvatarMutation.mutate({ voice: avatarVoice, prompt: avatarPrompt })}
              disabled={updateAvatarMutation.isPending}
            >
              {updateAvatarMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.saveAvatarButtonText}>Save Avatar Settings</ThemedText>
                </>
              )}
            </Pressable>

            <ThemedText style={[styles.avatarNote, { color: theme.textSecondary }]}>
              Note: Changes will take effect for new avatar sessions. Active sessions will continue with their current settings.
            </ThemedText>
          </>
        ) : null}
      </KeyboardAwareScrollViewCompat>

      {/* Prompt Edit Modal */}
      <Modal visible={!!selectedPrompt} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedPrompt(null)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setSelectedPrompt(null)} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.modalTitle}>{selectedPrompt?.name || "Edit Prompt"}</ThemedText>
            <Pressable onPress={handleSavePrompt} disabled={updatePromptMutation.isPending} style={[styles.modalSaveButton, { opacity: updatePromptMutation.isPending ? 0.5 : 1 }]}>
              {updatePromptMutation.isPending ? <ActivityIndicator size="small" color={theme.primary} /> : <ThemedText style={[styles.modalSaveText, { color: theme.primary }]}>Save</ThemedText>}
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: Spacing["3xl"] }}>
            {selectedPrompt && (
              <>
                <View style={styles.modalSection}>
                  <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Key</ThemedText>
                  <ThemedText style={[styles.modalValue, { color: theme.text }]}>{selectedPrompt.key}</ThemedText>
                </View>
                <View style={styles.modalSection}>
                  <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Description</ThemedText>
                  <ThemedText style={[styles.modalValue, { color: theme.text }]}>{selectedPrompt.description}</ThemedText>
                </View>
                <View style={styles.modalSection}>
                  <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Prompt Text</ThemedText>
                  <TextInput
                    style={[styles.promptInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                    value={editedPrompt}
                    onChangeText={setEditedPrompt}
                    multiline
                    numberOfLines={20}
                    textAlignVertical="top"
                    placeholder="Enter prompt text..."
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                {selectedPrompt.isCustom && (
                  <Pressable style={({ pressed }) => [styles.resetButton, { backgroundColor: "#EF4444", opacity: pressed ? 0.8 : 1 }]} onPress={handleResetPrompt} disabled={resetMutation.isPending}>
                    {resetMutation.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Feather name="rotate-ccw" size={18} color="#FFFFFF" /><ThemedText style={styles.resetButtonText}>Reset to Default</ThemedText></>}
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Service Edit Modal */}
      <Modal visible={!!selectedService} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedService(null)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setSelectedService(null)} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.modalTitle}>{selectedService?.displayName || "Edit Service"}</ThemedText>
            <Pressable onPress={handleSaveService} disabled={updateServiceMutation.isPending} style={[styles.modalSaveButton, { opacity: updateServiceMutation.isPending ? 0.5 : 1 }]}>
              {updateServiceMutation.isPending ? <ActivityIndicator size="small" color={theme.primary} /> : <ThemedText style={[styles.modalSaveText, { color: theme.primary }]}>Save</ThemedText>}
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: Spacing["3xl"] }}>
            {selectedService && (
              <>
                <View style={styles.modalSection}>
                  <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Model</ThemedText>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={serviceFormData.modelName}
                      onValueChange={(value) => setServiceFormData({ ...serviceFormData, modelName: value })}
                      style={{ color: theme.text }}
                    >
                      {selectedService.availableModels.map((model) => (
                        <Picker.Item key={model} label={model} value={model} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.modalSection}>
                  <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>
                    API Key {selectedService.hasApiKey && "(leave blank to keep current)"}
                  </ThemedText>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                    value={serviceFormData.apiKey}
                    onChangeText={(text) => setServiceFormData({ ...serviceFormData, apiKey: text })}
                    placeholder={selectedService.hasApiKey ? "••••••••" : "Enter API key"}
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                  />
                  {selectedService.hasApiKey && (
                    <ThemedText style={[styles.formHint, { color: theme.textSecondary }]}>Current: {selectedService.apiKeyMasked}</ThemedText>
                  )}
                </View>
                <Pressable
                  style={[styles.testButton, { backgroundColor: isTesting ? theme.border : theme.primary }]}
                  onPress={handleTestService}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="zap" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.testButtonText}>Test Connection</ThemedText>
                    </>
                  )}
                </Pressable>
                {testResult && (
                  <View style={[styles.testResultContainer, { backgroundColor: testResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", borderColor: testResult.success ? "#10B981" : "#EF4444" }]}>
                    <View style={styles.testResultHeader}>
                      <Feather name={testResult.success ? "check-circle" : "x-circle"} size={20} color={testResult.success ? "#10B981" : "#EF4444"} />
                      <ThemedText style={[styles.testResultTitle, { color: testResult.success ? "#10B981" : "#EF4444" }]}>
                        {testResult.success ? "Connection Successful" : "Connection Failed"}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.testResultMessage, { color: theme.text }]}>{testResult.message}</ThemedText>
                    {testResult.responseTime && (
                      <ThemedText style={[styles.testResultDetail, { color: theme.textSecondary }]}>Response time: {testResult.responseTime}ms</ThemedText>
                    )}
                    {testResult.details && (
                      <ThemedText style={[styles.testResultDetail, { color: theme.textSecondary }]}>{testResult.details}</ThemedText>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: Spacing.xs },
  subtitle: { fontSize: 14, lineHeight: 20 },
  tabContainer: { flexDirection: "row", borderRadius: BorderRadius.lg, padding: Spacing.xs, marginBottom: Spacing.lg },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  tabText: { fontSize: 14, fontWeight: "600" },
  serviceCard: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  serviceHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.sm },
  serviceIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  serviceName: { fontSize: 16, fontWeight: "600" },
  serviceModel: { fontSize: 13 },
  serviceBadges: { flexDirection: "row", gap: Spacing.xs },
  serviceDetails: { marginTop: Spacing.xs, gap: Spacing.xs },
  detailRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  detailText: { fontSize: 13 },
  filterContainer: { marginBottom: Spacing.lg },
  filterContent: { gap: Spacing.sm, paddingRight: Spacing.lg },
  filterChip: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  filterChipText: { fontSize: 13, fontWeight: "500" },
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  categoryTitle: { fontSize: 16, fontWeight: "600" },
  categoryCount: { fontSize: 14 },
  promptCard: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  promptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.xs },
  promptName: { fontSize: 15, fontWeight: "600" },
  promptKey: { fontSize: 12, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  promptBadges: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
  promptDescription: { fontSize: 13, marginBottom: Spacing.xs },
  promptPreview: { fontSize: 12, fontStyle: "italic" },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  modalCloseButton: { padding: Spacing.xs },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  modalSaveButton: { padding: Spacing.xs },
  modalSaveText: { fontSize: 16, fontWeight: "600" },
  modalContent: { flex: 1, padding: Spacing.lg },
  modalSection: { marginBottom: Spacing.lg },
  modalLabel: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", marginBottom: Spacing.xs },
  modalValue: { fontSize: 15 },
  promptInput: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: 14, minHeight: 300, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  formInput: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: 15 },
  formHint: { fontSize: 12, marginTop: Spacing.xs },
  pickerContainer: { borderWidth: 1, borderRadius: BorderRadius.md, overflow: "hidden" },
  resetButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.lg },
  resetButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  testButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.md },
  testButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  testResultContainer: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.md },
  testResultHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  testResultTitle: { fontSize: 15, fontWeight: "600" },
  testResultMessage: { fontSize: 14, marginBottom: Spacing.xs },
  testResultDetail: { fontSize: 12 },
  // Avatar styles
  avatarHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  avatarIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  saveAvatarButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  saveAvatarButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  avatarNote: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  agentStatusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  restartButton: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  restartButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  seedButton: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, marginLeft: Spacing.sm },
  seedButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  userInfoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1 },
  userInfoText: { fontSize: 13 },
});
