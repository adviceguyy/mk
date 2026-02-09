import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  Image as RNImage,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { useCredits } from "@/lib/CreditContext";
import { apiRequest } from "@/lib/query-client";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useLiveKitPlatform, NativeVideoView } from "@/lib/useLiveKitPlatform";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

interface AvatarStatus {
  available: boolean;
  disabled: boolean;
  disabledReason: string | null;
}

const CREDITS_PER_MINUTE = 20;
const CREDIT_DEDUCTION_INTERVAL_MS = 60000;

interface SessionData {
  sessionId: string;
  roomName: string;
  token: string;
  livekitUrl: string;
  simliConfig: {
    faceId: string;
  };
}

export default function TalkToOngScreen() {
  const { theme, isDark } = useTheme();
  const { user, sessionToken, updateUser } = useAuth();
  const { showUpgradeModal } = useCredits();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  
  const {
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
    remoteVideoTrack,
    isConnected: isLiveKitConnected,
    webVideoRef,
  } = useLiveKitPlatform();

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  // Check if avatar agent is available
  const { data: avatarStatus } = useQuery<AvatarStatus>({
    queryKey: ["/api/avatar/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/avatar/status");
      if (!response.ok) {
        return { available: false, disabled: true, disabledReason: "Unable to check status" };
      }
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });

  const isAgentAvailable = avatarStatus?.available ?? true;
  const isAgentDisabled = avatarStatus?.disabled ?? false;

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const creditDeductionRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const sessionDataRef = useRef<SessionData | null>(null);

  const deductCreditsMutation = useMutation({
    mutationFn: async (credits: number) => {
      const response = await apiRequest("POST", "/api/avatar/deduct-credits", {
        credits,
      }, { token: sessionToken });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to deduct credits");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const updates: { credits?: number; packCredits?: number } = {};
      if (data.subscriptionCredits !== undefined) {
        updates.credits = data.subscriptionCredits;
      }
      if (data.packCredits !== undefined) {
        updates.packCredits = data.packCredits;
      }
      if (Object.keys(updates).length > 0) {
        updateUser(updates);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: (error: Error) => {
      console.error("Credit deduction failed:", error);
      if (error.message.includes("Insufficient credits")) {
        endSession();
        showUpgradeModal();
      }
    },
  });

  const startCreditDeduction = useCallback(() => {
    deductCreditsMutation.mutate(CREDITS_PER_MINUTE);
    creditDeductionRef.current = setInterval(() => {
      deductCreditsMutation.mutate(CREDITS_PER_MINUTE);
    }, CREDIT_DEDUCTION_INTERVAL_MS);
  }, [deductCreditsMutation]);

  const stopCreditDeduction = useCallback(() => {
    if (creditDeductionRef.current) {
      clearInterval(creditDeductionRef.current);
      creditDeductionRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isSessionActive) {
      sessionStartTimeRef.current = Date.now();
      sessionTimerRef.current = setInterval(() => {
        if (sessionStartTimeRef.current) {
          setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setSessionDuration(0);
      sessionStartTimeRef.current = null;
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isSessionActive]);

  useEffect(() => {
    return () => {
      stopCreditDeduction();
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      disconnectLiveKit();
    };
  }, [stopCreditDeduction, disconnectLiveKit]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getUserCredits = (): number => {
    return (user?.credits ?? 0) + (user?.packCredits ?? 0);
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS !== "web") {
      return true;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setConnectionError("Microphone access is required for voice conversations. Please allow microphone access and try again.");
      return false;
    }
  };

  const startSession = async () => {
    const totalCredits = getUserCredits();
    if (totalCredits < CREDITS_PER_MINUTE) {
      showUpgradeModal();
      return;
    }

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      if (Platform.OS === "web") {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          setIsConnecting(false);
          return;
        }
      }

      const response = await apiRequest("POST", "/api/avatar/session/start", {}, { token: sessionToken });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to start session");
      }

      const sessionData: SessionData = await response.json();
      sessionDataRef.current = sessionData;

      await connectLiveKit(sessionData);

      setIsSessionActive(true);
      startCreditDeduction();
    } catch (error) {
      console.error("Failed to start session:", error);
      setConnectionError(error instanceof Error ? error.message : "Failed to connect to Ong. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const endSession = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    stopCreditDeduction();
    setIsSessionActive(false);

    await disconnectLiveKit();

    if (sessionDataRef.current) {
      try {
        await apiRequest("POST", "/api/avatar/session/end", {
          sessionId: sessionDataRef.current.sessionId,
        }, { token: sessionToken });
      } catch (e) {
        console.log("Error ending session on server:", e);
      }
      sessionDataRef.current = null;
    }
  };

  const confirmEndSession = () => {
    if (Platform.OS === "web") {
      if (window.confirm("End your conversation with Ong?")) {
        endSession();
      }
    } else {
      Alert.alert(
        "End Conversation",
        "Are you sure you want to end your conversation with Ong?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "End", style: "destructive", onPress: endSession },
        ]
      );
    }
  };

  const creditsRemaining = getUserCredits();
  const estimatedMinutes = Math.floor(creditsRemaining / CREDITS_PER_MINUTE);

  const renderAvatarDisplay = () => {
    if (isSessionActive && remoteVideoTrack && Platform.OS !== "web" && NativeVideoView) {
      return (
        <View style={styles.videoContainer}>
          <NativeVideoView
            style={styles.video}
            videoTrack={remoteVideoTrack}
            objectFit="cover"
          />
          <View style={styles.videoOverlay}>
            <View style={styles.sessionInfo}>
              <View style={[styles.liveIndicator, { backgroundColor: Colors.light.primary }]} />
              <ThemedText style={[styles.sessionDuration, { color: "#FFFFFF" }]}>
                {formatDuration(sessionDuration)}
              </ThemedText>
            </View>
          </View>
        </View>
      );
    }

    if (isSessionActive && Platform.OS === "web") {
      return (
        <View style={styles.videoContainer}>
          <video
            ref={webVideoRef as any}
            autoPlay
            playsInline
            muted={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              backgroundColor: "#000",
            }}
          />
          <View style={styles.videoOverlay}>
            <View style={styles.sessionInfo}>
              <View style={[styles.liveIndicator, { backgroundColor: Colors.light.primary }]} />
              <ThemedText style={[styles.sessionDuration, { color: "#FFFFFF" }]}>
                {formatDuration(sessionDuration)}
              </ThemedText>
            </View>
          </View>
        </View>
      );
    }

    if (isSessionActive) {
      return (
        <View style={styles.avatarPlaceholder}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
          <ThemedText style={[styles.avatarName, { color: theme.text }]}>
            Ong
          </ThemedText>
          <View style={styles.sessionInfo}>
            <View style={[styles.liveIndicator, { backgroundColor: Colors.light.primary }]} />
            <ThemedText style={[styles.sessionDuration, { color: theme.text }]}>
              {formatDuration(sessionDuration)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.avatarDescription, { color: theme.textSecondary }]}>
            Connecting to avatar...
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <View style={[styles.avatarCircle, { backgroundColor: theme.surface, overflow: 'hidden' }]}>
          <RNImage
            source={require("@/assets/ong-placeholder.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
        <ThemedText style={[styles.avatarName, { color: theme.text }]}>
          Ong
        </ThemedText>
        <ThemedText style={[styles.avatarDescription, { color: theme.textSecondary }]}>
          Your AI companion for Mien culture
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
            zIndex: 1,
          },
        ]}
      >
        {/* Avatar display - smaller when not in session */}
        <View style={[
          styles.avatarArea,
          { backgroundColor: theme.backgroundSecondary },
          !isSessionActive && styles.avatarAreaCompact,
        ]}>
          {renderAvatarDisplay()}
        </View>

        {/* Agent unavailable notice */}
        {isAgentDisabled && !isSessionActive ? (
          <View style={[styles.agentDownNotice, { backgroundColor: "#FEF3C7" }]}>
            <Feather name="alert-triangle" size={20} color="#D97706" />
            <View style={styles.agentDownContent}>
              <ThemedText style={styles.agentDownTitle}>
                Ong is temporarily unavailable
              </ThemedText>
              <ThemedText style={[styles.agentDownText, { color: "#92400E" }]}>
                The avatar service is temporarily unavailable. Please try again later.
              </ThemedText>
            </View>
          </View>
        ) : null}

        {/* Action button - prominently placed right after avatar */}
        <View style={styles.actionArea}>
          {isSessionActive ? (
            <Pressable
              onPress={confirmEndSession}
              style={({ pressed }) => [
                styles.actionButton,
                styles.endButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="phone-off" size={24} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>End Conversation</ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={startSession}
              disabled={isConnecting || creditsRemaining < CREDITS_PER_MINUTE || isAgentDisabled}
              style={({ pressed }) => [
                styles.actionButton,
                styles.startButton,
                {
                  backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                  opacity: pressed || isConnecting || creditsRemaining < CREDITS_PER_MINUTE || isAgentDisabled ? 0.6 : 1,
                },
              ]}
            >
              {isConnecting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Connecting...</ThemedText>
                </>
              ) : (
                <>
                  <Feather name="phone" size={24} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Start Conversation</ThemedText>
                </>
              )}
            </Pressable>
          )}

          {creditsRemaining < CREDITS_PER_MINUTE && !isSessionActive ? (
            <Pressable
              onPress={showUpgradeModal}
              style={[styles.upgradeButton, { borderColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
            >
              <Feather name="zap" size={16} color={isDark ? Colors.dark.primary : Colors.light.primary} />
              <ThemedText style={[styles.upgradeButtonText, { color: isDark ? Colors.dark.primary : Colors.light.primary }]}>
                Get More Credits
              </ThemedText>
            </Pressable>
          ) : null}

          {isConnecting ? (
            <View style={styles.loadingNotice}>
              <Feather name="info" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.loadingNoticeText, { color: theme.textSecondary }]}>
                This may take up to 30 seconds to load, thank you for your patience.
              </ThemedText>
            </View>
          ) : null}
        </View>

        {connectionError ? (
          <View style={[styles.errorCard, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={18} color="#DC2626" />
            <ThemedText style={styles.errorText}>{connectionError}</ThemedText>
          </View>
        ) : null}

        {/* Info card - moved below the button */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <View style={styles.infoRow}>
            <Feather name="clock" size={18} color={theme.textSecondary} />
            <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Available:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.text }]}>
              {estimatedMinutes} {estimatedMinutes === 1 ? "minute" : "minutes"}
            </ThemedText>
          </View>

          {isSessionActive ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.infoRow}>
                <Feather name="activity" size={18} color={Colors.light.primary} />
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Session:
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: Colors.light.primary }]}>
                  Active - {formatDuration(sessionDuration)}
                </ThemedText>
              </View>
            </>
          ) : null}
        </View>

        {Platform.OS === "web" && !isSessionActive ? (
          <View style={[styles.webNotice, { backgroundColor: theme.surface }]}>
            <Feather name="mic" size={24} color={theme.textSecondary} />
            <ThemedText style={[styles.webNoticeText, { color: theme.textSecondary }]}>
              Microphone access is required for voice conversations.
            </ThemedText>
          </View>
        ) : null}

        <ThemedText style={[styles.disclaimer, { color: theme.textSecondary }]}>
          Credits are deducted at the start of each minute.
        </ThemedText>
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
    paddingHorizontal: Spacing.lg,
  },
  avatarArea: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 280,
    overflow: "hidden",
  },
  avatarAreaCompact: {
    flex: 0,
    minHeight: 200,
    paddingVertical: Spacing.lg,
  },
  avatarPlaceholder: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarName: {
    fontSize: 28,
    fontWeight: "700",
  },
  avatarDescription: {
    fontSize: 15,
    textAlign: "center",
    maxWidth: 250,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionDuration: {
    fontSize: 18,
    fontWeight: "600",
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  infoCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    flex: 1,
  },
  agentDownNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  agentDownContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  agentDownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
  },
  agentDownText: {
    fontSize: 14,
    lineHeight: 20,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  webNoticeText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actionArea: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  loadingNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  loadingNoticeText: {
    fontSize: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  startButton: {},
  endButton: {
    backgroundColor: "#DC2626",
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.xs,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
