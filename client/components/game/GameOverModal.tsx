import React from "react";
import { View, Modal, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface GameOverModalProps {
  visible: boolean;
  score: number;
  phrasesCompleted: number;
  totalPhrases: number;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
  statLabel?: string;
}

export default function GameOverModal({
  visible,
  score,
  phrasesCompleted,
  totalPhrases,
  onPlayAgain,
  onLeaderboard,
  statLabel,
}: GameOverModalProps) {
  const { theme } = useTheme();

  const handlePress = (callback: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    callback();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.surface }]}>
          <View style={styles.iconWrapper}>
            <Feather name="award" size={48} color="#C4942A" />
          </View>

          <ThemedText style={[styles.title, { color: theme.text }]}>
            Game Over!
          </ThemedText>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.statValue, { color: "#C4942A" }]}>
                {score.toLocaleString()}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Score
              </ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.statValue, { color: "#2ECC71" }]}>
                {phrasesCompleted}/{totalPhrases}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                {statLabel || "Phrases"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={() => handlePress(onPlayAgain)}
            >
              <Feather name="refresh-cw" size={18} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonText}>Play Again</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => handlePress(onLeaderboard)}
            >
              <Feather name="bar-chart-2" size={18} color="#C4942A" />
              <ThemedText style={[styles.buttonText, { color: theme.text }]}>
                Leaderboard
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(196, 148, 42, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    width: "100%",
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  buttons: {
    width: "100%",
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#C4942A",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
