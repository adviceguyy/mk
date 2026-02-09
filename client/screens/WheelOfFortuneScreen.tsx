import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import SpinWheel from "@/components/game/SpinWheel";
import PhraseBoard from "@/components/game/PhraseBoard";
import LetterKeyboard from "@/components/game/LetterKeyboard";
import GameOverModal from "@/components/game/GameOverModal";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type GamePhase =
  | "loading"
  | "ready_to_spin"
  | "spinning"
  | "guessing"
  | "game_over";

interface GamePhrase {
  mien: string;
  english: string;
  category: string;
}

const TOTAL_PHRASES = 5;

export default function WheelOfFortuneScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { sessionToken } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [phrases, setPhrases] = useState<GamePhrase[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [correctLetters, setCorrectLetters] = useState<Set<string>>(new Set());
  const [wrongLetters, setWrongLetters] = useState<Set<string>>(new Set());
  const [phrasesCompleted, setPhrasesCompleted] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [solveGuess, setSolveGuess] = useState("");
  const scoreSubmitted = useRef(false);

  const currentPhrase = phrases[currentPhraseIndex];

  // Load phrases
  const loadPhrases = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await apiRequest("GET", `/api/game/phrases?count=${TOTAL_PHRASES}`, undefined, {
        token: sessionToken,
      });
      const data = await res.json();
      if (data.phrases && data.phrases.length > 0) {
        setPhrases(data.phrases);
        setCurrentPhraseIndex(0);
        setTotalScore(0);
        setRoundPoints(0);
        setPhrasesCompleted(0);
        setGuessedLetters(new Set());
        setCorrectLetters(new Set());
        setWrongLetters(new Set());
        setStatusMessage("");
        scoreSubmitted.current = false;
        setPhase("ready_to_spin");
      }
    } catch (error) {
      console.error("Failed to load phrases:", error);
      setStatusMessage("Failed to load phrases. Please try again.");
    }
  }, [sessionToken]);

  useEffect(() => {
    loadPhrases();
  }, [loadPhrases]);

  // Check if phrase is complete
  const isPhraseComplete = useCallback(
    (letters: Set<string>, phrase: string) => {
      const uniqueLetters = new Set(
        phrase
          .toUpperCase()
          .split("")
          .filter((c) => /[A-Z]/.test(c))
      );
      for (const letter of uniqueLetters) {
        if (!letters.has(letter)) return false;
      }
      return true;
    },
    []
  );

  // Handle spin result
  const handleSpinResult = useCallback(
    (value: number) => {
      if (value === -1) {
        // Bankrupt
        setRoundPoints(0);
        setStatusMessage("BANKRUPT! Round score reset.");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setPhase("ready_to_spin");
      } else if (value === 0) {
        // Lose turn
        setStatusMessage("Lose a turn! Spin again.");
        setPhase("ready_to_spin");
      } else {
        // Points - show keyboard for guessing
        setRoundPoints(value);
        setStatusMessage(`${value} points per letter! Pick a letter.`);
        setPhase("guessing");
      }
    },
    []
  );

  // Handle letter guess
  const handleLetterGuess = useCallback(
    (letter: string) => {
      if (!currentPhrase || phase !== "guessing") return;

      const newGuessed = new Set(guessedLetters);
      newGuessed.add(letter);
      setGuessedLetters(newGuessed);

      const phraseUpper = currentPhrase.mien.toUpperCase();
      const occurrences = phraseUpper.split("").filter((c) => c === letter).length;

      if (occurrences > 0) {
        // Correct
        const earned = roundPoints * occurrences;
        setTotalScore((prev) => prev + earned);
        const newCorrect = new Set(correctLetters);
        newCorrect.add(letter);
        setCorrectLetters(newCorrect);
        setStatusMessage(`+${earned} points! (${occurrences} ${letter}'s)`);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Check if phrase is complete
        if (isPhraseComplete(newGuessed, currentPhrase.mien)) {
          const completed = phrasesCompleted + 1;
          setPhrasesCompleted(completed);

          if (currentPhraseIndex + 1 >= phrases.length) {
            // Game over
            setPhase("game_over");
            setStatusMessage("All phrases complete!");
          } else {
            // Next phrase
            setTimeout(() => {
              setCurrentPhraseIndex((prev) => prev + 1);
              setGuessedLetters(new Set());
              setCorrectLetters(new Set());
              setWrongLetters(new Set());
              setRoundPoints(0);
              setStatusMessage(`Phrase ${currentPhraseIndex + 2} of ${phrases.length}`);
              setPhase("ready_to_spin");
            }, 1500);
          }
        } else {
          // Keep guessing - go back to spin
          setPhase("ready_to_spin");
        }
      } else {
        // Wrong
        const newWrong = new Set(wrongLetters);
        newWrong.add(letter);
        setWrongLetters(newWrong);
        setStatusMessage(`No ${letter}'s. Back to spinning!`);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        setPhase("ready_to_spin");
      }
    },
    [
      currentPhrase,
      phase,
      guessedLetters,
      correctLetters,
      wrongLetters,
      roundPoints,
      phrasesCompleted,
      currentPhraseIndex,
      phrases.length,
      isPhraseComplete,
    ]
  );

  // Handle solve attempt
  const handleSolveAttempt = useCallback(() => {
    if (!currentPhrase) return;

    const guess = solveGuess.trim().toUpperCase();
    const answer = currentPhrase.mien.trim().toUpperCase();

    if (guess === answer) {
      // Correct solve - award bonus and reveal all letters
      const bonus = 500;
      setTotalScore((prev) => prev + bonus);
      const allLetters = new Set(
        answer.split("").filter((c) => /[A-Z]/.test(c))
      );
      setGuessedLetters(allLetters);
      setCorrectLetters(allLetters);
      setStatusMessage(`Solved it! +${bonus} bonus points!`);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const completed = phrasesCompleted + 1;
      setPhrasesCompleted(completed);

      if (currentPhraseIndex + 1 >= phrases.length) {
        setPhase("game_over");
      } else {
        setTimeout(() => {
          setCurrentPhraseIndex((prev) => prev + 1);
          setGuessedLetters(new Set());
          setCorrectLetters(new Set());
          setWrongLetters(new Set());
          setRoundPoints(0);
          setStatusMessage(`Phrase ${currentPhraseIndex + 2} of ${phrases.length}`);
          setPhase("ready_to_spin");
        }, 1500);
      }
    } else {
      // Wrong solve
      setStatusMessage("Wrong guess! Back to spinning.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setPhase("ready_to_spin");
    }

    setShowSolveModal(false);
    setSolveGuess("");
  }, [currentPhrase, solveGuess, phrasesCompleted, currentPhraseIndex, phrases.length]);

  // Submit score when game is over
  useEffect(() => {
    if (phase === "game_over" && !scoreSubmitted.current) {
      scoreSubmitted.current = true;
      setShowGameOver(true);
      apiRequest(
        "POST",
        "/api/game/scores",
        { score: totalScore, phrasesCompleted, gameType: "wheel_of_fortune" },
        { token: sessionToken }
      ).catch((err) => console.error("Failed to save score:", err));
    }
  }, [phase, totalScore, phrasesCompleted, sessionToken]);

  const handlePlayAgain = () => {
    setShowGameOver(false);
    loadPhrases();
  };

  const handleLeaderboard = () => {
    setShowGameOver(false);
    navigation.navigate("WheelLeaderboard");
  };

  if (phase === "loading") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
        <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C4942A" />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading game...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + 8, paddingBottom: tabBarHeight + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Score bar */}
        <View style={[styles.scoreBar, { backgroundColor: theme.surface }]}>
          <View style={styles.scoreItem}>
            <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
              Score
            </ThemedText>
            <ThemedText style={[styles.scoreValue, { color: "#C4942A" }]}>
              {totalScore.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
              Phrase
            </ThemedText>
            <ThemedText style={[styles.scoreValue, { color: theme.text }]}>
              {currentPhraseIndex + 1}/{phrases.length}
            </ThemedText>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
              Round
            </ThemedText>
            <ThemedText style={[styles.scoreValue, { color: "#2ECC71" }]}>
              {roundPoints}
            </ThemedText>
          </View>
        </View>

        {/* Status message */}
        {statusMessage ? (
          <View style={[styles.statusBanner, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statusText, { color: theme.text }]}>
              {statusMessage}
            </ThemedText>
          </View>
        ) : null}

        {/* Phrase board */}
        {currentPhrase && (
          <PhraseBoard
            phrase={currentPhrase.mien}
            guessedLetters={guessedLetters}
            englishHint={currentPhrase.english}
          />
        )}

        {/* Wheel or Keyboard based on phase */}
        <View style={styles.interactionArea}>
          {(phase === "ready_to_spin" || phase === "spinning") && (
            <View style={styles.wheelContainer}>
              <ThemedText style={[styles.instruction, { color: theme.textSecondary }]}>
                Tap the wheel to spin!
              </ThemedText>
              <SpinWheel
                onSpinResult={handleSpinResult}
                disabled={phase === "spinning"}
              />
            </View>
          )}

          {phase === "guessing" && (
            <View style={styles.keyboardContainer}>
              <ThemedText style={[styles.instruction, { color: theme.textSecondary }]}>
                Pick a letter ({roundPoints} pts each)
              </ThemedText>
              <LetterKeyboard
                onLetterPress={handleLetterGuess}
                correctLetters={correctLetters}
                wrongLetters={wrongLetters}
              />
              <Pressable
                style={styles.solveButton}
                onPress={() => {
                  setSolveGuess("");
                  setShowSolveModal(true);
                }}
              >
                <Feather name="check-circle" size={16} color="#FFFFFF" />
                <ThemedText style={styles.solveButtonText}>Solve Puzzle</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Solve puzzle modal */}
      <Modal visible={showSolveModal} transparent animationType="fade">
        <View style={styles.solveOverlay}>
          <View style={[styles.solveModal, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.solveTitle, { color: theme.text }]}>
              Solve the Puzzle
            </ThemedText>
            <ThemedText style={[styles.solveHint, { color: theme.textSecondary }]}>
              Type the full Mien phrase
            </ThemedText>
            <TextInput
              style={[
                styles.solveInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: "#C4942A",
                },
              ]}
              value={solveGuess}
              onChangeText={setSolveGuess}
              placeholder="Enter the phrase..."
              placeholderTextColor={theme.textSecondary}
              autoFocus
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleSolveAttempt}
            />
            <View style={styles.solveButtons}>
              <Pressable
                style={[styles.solveActionButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setShowSolveModal(false);
                  setSolveGuess("");
                }}
              >
                <ThemedText style={[styles.solveCancelText, { color: theme.text }]}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.solveActionButton, styles.solveSubmitButton]}
                onPress={handleSolveAttempt}
              >
                <ThemedText style={styles.solveSubmitText}>Submit</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <GameOverModal
        visible={showGameOver}
        score={totalScore}
        phrasesCompleted={phrasesCompleted}
        totalPhrases={phrases.length}
        onPlayAgain={handlePlayAgain}
        onLeaderboard={handleLeaderboard}
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
  content: {
    paddingHorizontal: Spacing.md,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  scoreBar: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  scoreItem: {
    flex: 1,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scoreDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
  },
  statusBanner: {
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  interactionArea: {
    alignItems: "center",
    marginTop: 8,
  },
  wheelContainer: {
    alignItems: "center",
    gap: 12,
  },
  keyboardContainer: {
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  instruction: {
    fontSize: 14,
    fontWeight: "500",
  },
  solveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2ECC71",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 8,
  },
  solveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  solveOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  solveModal: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  solveTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  solveHint: {
    fontSize: 13,
    marginBottom: 16,
  },
  solveInput: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  solveButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  solveActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  solveSubmitButton: {
    backgroundColor: "#C4942A",
  },
  solveCancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  solveSubmitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
