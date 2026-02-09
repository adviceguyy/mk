import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert, Platform, ImageBackground, TextInput } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";

const mienPatternBg = require("@/assets/mien-pattern.png");

interface IntegrationSettings {
  baseUrl: string;
  enrollmentSecret: string;
  appId: string | null;
  lastRegistrationStatus: string | null;
}

const fetchIntegrationSettings = async (): Promise<IntegrationSettings> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/integration-settings", getApiUrl()).toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch integration settings");
  }
  return response.json();
};

const updateIntegrationSettings = async (data: { baseUrl?: string; enrollmentSecret?: string }): Promise<any> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/integration-settings", getApiUrl()).toString(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update settings");
  }
  return response.json();
};

const triggerRegistration = async (forceReregister: boolean): Promise<any> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/integration/register", getApiUrl()).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ forceReregister }),
  });
  if (!response.ok) {
    throw new Error("Failed to register");
  }
  return response.json();
};

const clearAppId = async (): Promise<any> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/admin/integration/app-id", getApiUrl()).toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to clear app ID");
  }
  return response.json();
};

export default function IntegrationSettingsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [baseUrl, setBaseUrl] = useState("");
  const [enrollmentSecret, setEnrollmentSecret] = useState("");
  const [hasEdited, setHasEdited] = useState(false);

  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/integration-settings"],
    queryFn: fetchIntegrationSettings,
  });

  React.useEffect(() => {
    if (settings && !hasEdited) {
      setBaseUrl(settings.baseUrl);
    }
  }, [settings, hasEdited]);

  const updateMutation = useMutation({
    mutationFn: updateIntegrationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integration-settings"] });
      setHasEdited(false);
      setEnrollmentSecret("");
      showAlert("Success", "Settings updated successfully");
    },
    onError: (error: any) => {
      showAlert("Error", error.message || "Failed to update settings");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (forceReregister: boolean) => triggerRegistration(forceReregister),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integration-settings"] });
      showAlert(data.success ? "Success" : "Failed", data.message);
    },
    onError: (error: any) => {
      showAlert("Error", error.message || "Registration failed");
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearAppId,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integration-settings"] });
      showAlert("Success", data.message);
    },
    onError: (error: any) => {
      showAlert("Error", error.message || "Failed to clear app ID");
    },
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSaveSettings = () => {
    const updates: { baseUrl?: string; enrollmentSecret?: string } = {};
    if (baseUrl && baseUrl !== settings?.baseUrl) {
      updates.baseUrl = baseUrl;
    }
    if (enrollmentSecret) {
      updates.enrollmentSecret = enrollmentSecret;
    }
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    } else {
      showAlert("Info", "No changes to save");
    }
  };

  const handleRegister = () => {
    registerMutation.mutate(false);
  };

  const handleForceReregister = () => {
    if (Platform.OS === "web") {
      if (window.confirm("This will clear the current app ID and re-register. Continue?")) {
        registerMutation.mutate(true);
      }
    } else {
      Alert.alert(
        "Force Re-register",
        "This will clear the current app ID and re-register. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Re-register", style: "destructive", onPress: () => registerMutation.mutate(true) },
        ]
      );
    }
  };

  const handleClearAppId = () => {
    if (Platform.OS === "web") {
      if (window.confirm("This will clear the app ID. You will need to re-register. Continue?")) {
        clearMutation.mutate();
      }
    } else {
      Alert.alert(
        "Clear App ID",
        "This will clear the app ID. You will need to re-register. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear", style: "destructive", onPress: () => clearMutation.mutate() },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={{ color: Colors.light.primary }}>Failed to load settings</ThemedText>
        <Pressable
          style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md }]}
          onPress={() => refetch()}
        >
          <ThemedText style={styles.buttonText}>Retry</ThemedText>
        </Pressable>
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
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Three Tears Integration</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Configure the connection to the Three Tears ecosystem
          </ThemedText>

          <View style={styles.statusRow}>
            <ThemedText style={styles.label}>Registration Status:</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: settings?.appId ? "#22C55E" : "#EF4444" }]}>
              <ThemedText style={styles.statusText}>
                {settings?.appId ? "Registered" : "Not Registered"}
              </ThemedText>
            </View>
          </View>

          {settings?.appId ? (
            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>App ID:</ThemedText>
              <ThemedText style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
                {settings.appId}
              </ThemedText>
            </View>
          ) : null}

          {settings?.lastRegistrationStatus ? (
            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Last Status:</ThemedText>
              <ThemedText style={[styles.infoValue, { color: theme.textSecondary, fontSize: 12 }]} numberOfLines={2}>
                {settings.lastRegistrationStatus}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>

          <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Base URL</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={baseUrl}
            onChangeText={(text) => {
              setBaseUrl(text);
              setHasEdited(true);
            }}
            placeholder="https://threetears.net"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ThemedText style={[styles.label, { marginTop: Spacing.md }]}>Enrollment Secret</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={enrollmentSecret}
            onChangeText={setEnrollmentSecret}
            placeholder={settings?.enrollmentSecret || "Enter secret..."}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary, opacity: pressed || updateMutation.isPending ? 0.7 : 1, marginTop: Spacing.lg },
            ]}
            onPress={handleSaveSettings}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="save" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Save Settings</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Registration Actions</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Trigger registration or heartbeat manually
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: "#22C55E", opacity: pressed || registerMutation.isPending ? 0.7 : 1, marginTop: Spacing.md },
            ]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="refresh-cw" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>
                  {settings?.appId ? "Send Heartbeat" : "Register Now"}
                </ThemedText>
              </>
            )}
          </Pressable>

          {settings?.appId ? (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: "#F59E0B", opacity: pressed || registerMutation.isPending ? 0.7 : 1, marginTop: Spacing.sm },
                ]}
                onPress={handleForceReregister}
                disabled={registerMutation.isPending}
              >
                <Feather name="rotate-cw" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Force Re-register</ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: "#EF4444", opacity: pressed || clearMutation.isPending ? 0.7 : 1, marginTop: Spacing.sm },
                ]}
                onPress={handleClearAppId}
                disabled={clearMutation.isPending}
              >
                {clearMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="trash-2" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.buttonText}>Clear App ID</ThemedText>
                  </>
                )}
              </Pressable>
            </>
          ) : null}
        </View>
      </KeyboardAwareScrollViewCompat>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    marginTop: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
