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
import GameOverModal from "@/components/game/GameOverModal";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type GamePhase = "loading" | "playing" | "round_won" | "round_lost" | "game_over";

interface WordleWord {
  mienWord: string;
  englishDefinition: string;
  partOfSpeech: string | null;
}

const TOTAL_ROUNDS = 5;
const MAX_WRONG_GUESSES = 6;
const BASE_POINTS_PER_LETTER = 100;
const TIME_BONUS_MAX = 500;
const TIME_BONUS_WINDOW = 30; // seconds for full bonus
const LIVES_BONUS = 75;
const SOLVE_BONUS = 300;

export default function MienWordleScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { sessionToken } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [words, setWords] = useState<WordleWord[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundsWon, setRoundsWon] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [correctLetters, setCorrectLetters] = useState<Set<string>>(new Set());
  const [wrongLetters, setWrongLetters] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [solveGuess, setSolveGuess] = useState("");
  const scoreSubmitted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentWord = words[currentRound];

  // Get the displayable letters from the current word (uppercase, alpha only)
  const getUniqueLetters = useCallback((word: string) => {
    return new Set(
      word
        .toUpperCase()
        .split("")
        .filter((c) => /[A-Z]/.test(c))
    );
  }, []);

  // Check if word is fully revealed
  const isWordComplete = useCallback(
    (guessed: Set<string>, word: string) => {
      const unique = getUniqueLetters(word);
      for (const letter of unique) {
        if (!guessed.has(letter)) return false;
      }
      return true;
    },
    [getUniqueLetters]
  );

  // Timer
  useEffect(() => {
    if (phase === "playing") {
      const start = Date.now();
      setRoundStartTime(start);
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentRound]);

  // Load words
  const [loadError, setLoadError] = useState(false);

  const loadWords = useCallback(async () => {
    setPhase("loading");
    setLoadError(false);
    try {
      const res = await apiRequest(
        "GET",
        `/api/game/wordle/words?count=${TOTAL_ROUNDS}`,
        undefined,
        { token: sessionToken }
      );
      const data = await res.json();
      if (data.words && data.words.length > 0) {
        setWords(data.words);
        setCurrentRound(0);
        setTotalScore(0);
        setRoundsWon(0);
        setGuessedLetters(new Set());
        setCorrectLetters(new Set());
        setWrongLetters(new Set());
        setWrongCount(0);
        setStatusMessage("");
        scoreSubmitted.current = false;
        setPhase("playing");
      } else {
        setLoadError(true);
      }
    } catch (error) {
      console.error("Failed to load wordle words:", error);
      setLoadError(true);
    }
  }, [sessionToken]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Calculate time bonus
  const getTimeBonus = useCallback(() => {
    const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
    if (elapsed >= TIME_BONUS_WINDOW) return 0;
    return Math.round(TIME_BONUS_MAX * (1 - elapsed / TIME_BONUS_WINDOW));
  }, [roundStartTime]);

  // Score a round win
  const scoreRoundWin = useCallback(
    (livesLeft: number, solveBonus: boolean) => {
      const timeBonus = getTimeBonus();
      const livesBonus = livesLeft * LIVES_BONUS;
      const solve = solveBonus ? SOLVE_BONUS : 0;
      const uniqueCount = currentWord
        ? getUniqueLetters(currentWord.mienWord).size
        : 0;
      const letterPoints = uniqueCount * BASE_POINTS_PER_LETTER;
      return letterPoints + timeBonus + livesBonus + solve;
    },
    [getTimeBonus, currentWord, getUniqueLetters]
  );

  // Advance to next round or end game
  const advanceRound = useCallback(
    (won: boolean, points: number) => {
      const newScore = totalScore + points;
      setTotalScore(newScore);

      if (won) {
        setRoundsWon((prev) => prev + 1);
      }

      if (currentRound + 1 >= words.length) {
        // Game over
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("game_over");
      } else {
        setPhase(won ? "round_won" : "round_lost");
        // Auto-advance after delay
        setTimeout(() => {
          setCurrentRound((prev) => prev + 1);
          setGuessedLetters(new Set());
          setCorrectLetters(new Set());
          setWrongLetters(new Set());
          setWrongCount(0);
          setStatusMessage(`Round ${currentRound + 2} of ${words.length}`);
          setPhase("playing");
        }, 2000);
      }
    },
    [totalScore, currentRound, words.length]
  );

  // Handle letter guess
  const handleLetterGuess = useCallback(
    (letter: string) => {
      if (!currentWord || phase !== "playing") return;
      if (guessedLetters.has(letter)) return;

      const newGuessed = new Set(guessedLetters);
      newGuessed.add(letter);
      setGuessedLetters(newGuessed);

      const wordUpper = currentWord.mienWord.toUpperCase();
      const isCorrect = wordUpper.includes(letter);

      if (isCorrect) {
        const newCorrect = new Set(correctLetters);
        newCorrect.add(letter);
        setCorrectLetters(newCorrect);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Check if word is complete
        if (isWordComplete(newGuessed, currentWord.mienWord)) {
          const livesLeft = MAX_WRONG_GUESSES - wrongCount;
          const points = scoreRoundWin(livesLeft, false);
          setStatusMessage(`+${points} points!`);
          advanceRound(true, points);
        } else {
          const occurrences = wordUpper
            .split("")
            .filter((c) => c === letter).length;
          setStatusMessage(
            `${occurrences} ${letter}${occurrences > 1 ? "'s" : ""} found!`
          );
        }
      } else {
        const newWrong = new Set(wrongLetters);
        newWrong.add(letter);
        setWrongLetters(newWrong);
        const newWrongCount = wrongCount + 1;
        setWrongCount(newWrongCount);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        if (newWrongCount >= MAX_WRONG_GUESSES) {
          setStatusMessage(
            `The word was: ${currentWord.mienWord}`
          );
          advanceRound(false, 0);
        } else {
          setStatusMessage(
            `Wrong! ${MAX_WRONG_GUESSES - newWrongCount} ${
              MAX_WRONG_GUESSES - newWrongCount === 1 ? "life" : "lives"
            } left`
          );
        }
      }
    },
    [
      currentWord,
      phase,
      guessedLetters,
      correctLetters,
      wrongLetters,
      wrongCount,
      isWordComplete,
      scoreRoundWin,
      advanceRound,
    ]
  );

  // Handle solve attempt
  const handleSolveAttempt = useCallback(() => {
    if (!currentWord) return;

    const guess = solveGuess.trim().toUpperCase();
    const answer = currentWord.mienWord.trim().toUpperCase();

    if (guess === answer) {
      // Correct - reveal all letters and give solve bonus
      const allLetters = getUniqueLetters(currentWord.mienWord);
      setGuessedLetters(allLetters);
      setCorrectLetters(allLetters);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const livesLeft = MAX_WRONG_GUESSES - wrongCount;
      const points = scoreRoundWin(livesLeft, true);
      setStatusMessage(`Solved it! +${points} points!`);
      advanceRound(true, points);
    } else {
      // Wrong - costs a life
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      if (newWrongCount >= MAX_WRONG_GUESSES) {
        setStatusMessage(`The word was: ${currentWord.mienWord}`);
        advanceRound(false, 0);
      } else {
        setStatusMessage(
          `Wrong guess! ${MAX_WRONG_GUESSES - newWrongCount} ${
            MAX_WRONG_GUESSES - newWrongCount === 1 ? "life" : "lives"
          } left`
        );
      }
    }

    setShowSolveModal(false);
    setSolveGuess("");
  }, [
    currentWord,
    solveGuess,
    wrongCount,
    getUniqueLetters,
    scoreRoundWin,
    advanceRound,
  ]);

  // Submit score when game is over
  useEffect(() => {
    if (phase === "game_over" && !scoreSubmitted.current) {
      scoreSubmitted.current = true;
      setShowGameOver(true);
      apiRequest(
        "POST",
        "/api/game/scores",
        {
          score: totalScore,
          phrasesCompleted: roundsWon,
          gameType: "mien_wordle",
        },
        { token: sessionToken }
      ).catch((err) => console.error("Failed to save score:", err));
    }
  }, [phase, totalScore, roundsWon, sessionToken]);

  const handlePlayAgain = () => {
    setShowGameOver(false);
    loadWords();
  };

  const handleLeaderboard = () => {
    setShowGameOver(false);
    navigation.navigate("MienWordleLeaderboard");
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Render word tiles
  const renderWordTiles = () => {
    if (!currentWord) return null;
    const wordChars = currentWord.mienWord.toUpperCase().split("");

    return (
      <View style={styles.tilesContainer}>
        <View style={styles.tilesRow}>
          {wordChars.map((char, i) => {
            const isAlpha = /[A-Z]/.test(char);
            const isRevealed = !isAlpha || guessedLetters.has(char);
            const isSpace = char === " ";

            if (isSpace) {
              return <View key={i} style={styles.tileSpace} />;
            }

            return (
              <View
                key={i}
                style={[
                  styles.tile,
                  {
                    backgroundColor: isRevealed
                      ? "#2ECC71"
                      : theme.surface,
                    borderColor: isRevealed
                      ? "#27AE60"
                      : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.tileLetter,
                    { color: isRevealed ? "#FFFFFF" : "transparent" },
                  ]}
                >
                  {char}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Render keyboard
  const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const renderKeyboard = () => (
    <View style={styles.keyboard}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keyboardRow}>
          {row.map((letter) => {
            const isCorrect = correctLetters.has(letter);
            const isWrong = wrongLetters.has(letter);
            const isUsed = guessedLetters.has(letter);

            let bgColor = "#C4942A";
            if (isCorrect) bgColor = "#2ECC71";
            else if (isWrong) bgColor = "#6B7280";
            else bgColor = "#C4942A";

            return (
              <Pressable
                key={letter}
                style={[styles.key, { backgroundColor: bgColor }]}
                onPress={() => handleLetterGuess(letter)}
                disabled={isUsed || phase !== "playing"}
              >
                <ThemedText
                  style={[
                    styles.keyText,
                    { opacity: isUsed && !isCorrect ? 0.5 : 1 },
                  ]}
                >
                  {letter}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );

  // Render lives indicator
  const renderLives = () => {
    const lives = MAX_WRONG_GUESSES - wrongCount;
    return (
      <View style={styles.livesRow}>
        {Array.from({ length: MAX_WRONG_GUESSES }).map((_, i) => (
          <Feather
            key={i}
            name="heart"
            size={18}
            color={i < lives ? "#EF4444" : "#374151"}
            style={{ opacity: i < lives ? 1 : 0.3 }}
          />
        ))}
      </View>
    );
  };

  if (phase === "loading") {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      >
        <Image
          source={backgroundTop}
          style={styles.backgroundTop}
          contentFit="cover"
        />
        <Image
          source={backgroundBottom}
          style={styles.backgroundBottom}
          contentFit="cover"
        />
        <View style={styles.loadingContainer}>
          {loadError ? (
            <>
              <Feather name="alert-circle" size={40} color="#EF4444" />
              <ThemedText
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Failed to load words. Please try again.
              </ThemedText>
              <Pressable
                style={[styles.retryButton]}
                onPress={loadWords}
              >
                <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#C4942A" />
              <ThemedText
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Loading game...
              </ThemedText>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <Image
        source={backgroundTop}
        style={styles.backgroundTop}
        contentFit="cover"
      />
      <Image
        source={backgroundBottom}
        style={styles.backgroundBottom}
        contentFit="cover"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + 8,
            paddingBottom: tabBarHeight + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Score bar */}
        <View style={[styles.scoreBar, { backgroundColor: theme.surface }]}>
          <View style={styles.scoreItem}>
            <ThemedText
              style={[styles.scoreLabel, { color: theme.textSecondary }]}
            >
              Score
            </ThemedText>
            <ThemedText style={[styles.scoreValue, { color: "#C4942A" }]}>
              {totalScore.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <ThemedText
              style={[styles.scoreLabel, { color: theme.textSecondary }]}
            >
              Round
            </ThemedText>
            <ThemedText style={[styles.scoreValue, { color: theme.text }]}>
              {currentRound + 1}/{words.length}
            </ThemedText>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <ThemedText
              style={[styles.scoreLabel, { color: theme.textSecondary }]}
            >
              Time
            </ThemedText>
            <ThemedText style={[styles.scoreValue, { color: "#3B82F6" }]}>
              {formatTime(elapsedSeconds)}
            </ThemedText>
          </View>
        </View>

        {/* Lives */}
        <View style={[styles.livesBar, { backgroundColor: theme.surface }]}>
          {renderLives()}
        </View>

        {/* Status message */}
        {statusMessage ? (
          <View style={[styles.statusBanner, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statusText, { color: theme.text }]}>
              {statusMessage}
            </ThemedText>
          </View>
        ) : null}

        {/* English hint */}
        {currentWord && (
          <View style={[styles.hintCard, { backgroundColor: theme.surface }]}>
            <Feather name="help-circle" size={16} color="#C4942A" />
            <View style={styles.hintContent}>
              <ThemedText
                style={[styles.hintLabel, { color: theme.textSecondary }]}
              >
                English Definition
              </ThemedText>
              <ThemedText style={[styles.hintText, { color: theme.text }]}>
                {currentWord.englishDefinition}
              </ThemedText>
              {currentWord.partOfSpeech && (
                <ThemedText
                  style={[styles.hintPos, { color: theme.textTertiary }]}
                >
                  ({currentWord.partOfSpeech})
                </ThemedText>
              )}
            </View>
          </View>
        )}

        {/* Word tiles */}
        {renderWordTiles()}

        {/* Keyboard */}
        <View style={styles.keyboardContainer}>
          {renderKeyboard()}

          {/* Solve button */}
          {phase === "playing" && (
            <Pressable
              style={styles.solveButton}
              onPress={() => {
                setSolveGuess("");
                setShowSolveModal(true);
              }}
            >
              <Feather name="check-circle" size={16} color="#FFFFFF" />
              <ThemedText style={styles.solveButtonText}>
                Solve Word
              </ThemedText>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Solve modal */}
      <Modal visible={showSolveModal} transparent animationType="fade">
        <View style={styles.solveOverlay}>
          <View
            style={[styles.solveModal, { backgroundColor: theme.surface }]}
          >
            <ThemedText style={[styles.solveTitle, { color: theme.text }]}>
              Solve the Word
            </ThemedText>
            <ThemedText
              style={[styles.solveHint, { color: theme.textSecondary }]}
            >
              Type the full Mien word/phrase
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
              placeholder="Enter the word..."
              placeholderTextColor={theme.textSecondary}
              autoFocus
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleSolveAttempt}
            />
            <View style={styles.solveButtons}>
              <Pressable
                style={[
                  styles.solveActionButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => {
                  setShowSolveModal(false);
                  setSolveGuess("");
                }}
              >
                <ThemedText
                  style={[styles.solveCancelText, { color: theme.text }]}
                >
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
        phrasesCompleted={roundsWon}
        totalPhrases={words.length}
        onPlayAgain={handlePlayAgain}
        onLeaderboard={handleLeaderboard}
        statLabel="Words Solved"
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
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C4942A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
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
  livesBar: {
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  livesRow: {
    flexDirection: "row",
    gap: 8,
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
  hintCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  hintContent: {
    flex: 1,
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hintText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  hintPos: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  tilesContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  tilesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    maxWidth: 340,
  },
  tile: {
    width: 36,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tileSpace: {
    width: 16,
    height: 42,
  },
  tileLetter: {
    fontSize: 18,
    fontWeight: "bold",
  },
  keyboardContainer: {
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  keyboard: {
    gap: 6,
    alignItems: "center",
    width: "100%",
  },
  keyboardRow: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  key: {
    width: 32,
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  solveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 4,
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
