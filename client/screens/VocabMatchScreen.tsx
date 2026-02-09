import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Animated,
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
import { VocabArt } from "@/components/game/VocabSvgArt";
import { VOCAB_WORDS, VocabWord } from "@/data/vocabGameWords";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type GamePhase = "ready" | "playing" | "round_result" | "game_over";

const TOTAL_ROUNDS = 10;
const ROUND_TIME = 10; // seconds
const BASE_POINTS = 1000;
const TIME_BONUS_MULTIPLIER = 100;
const WRONG_TAP_PENALTY = 200;

interface RoundOption {
  word: VocabWord;
  isCorrect: boolean;
  anim: Animated.Value;
  eliminated: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function VocabMatchScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { sessionToken } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [phase, setPhase] = useState<GamePhase>("ready");
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [options, setOptions] = useState<RoundOption[]>([]);
  const [correctWord, setCorrectWord] = useState<VocabWord | null>(null);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultColor, setResultColor] = useState("#2ECC71");

  const scoreSubmitted = useRef(false);
  const roundStartTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedWordIds = useRef<Set<string>>(new Set());

  // Setup a new round
  const setupRound = useCallback((roundNum: number) => {
    // Pick a correct word not yet used
    const available = VOCAB_WORDS.filter((w) => !usedWordIds.current.has(w.id));
    if (available.length < 5) {
      usedWordIds.current.clear();
    }
    const pool = available.length >= 5 ? available : VOCAB_WORDS;
    const shuffledPool = shuffleArray(pool);
    const correct = shuffledPool[0];
    usedWordIds.current.add(correct.id);

    // Pick 4 distractors (different svgKey)
    const distractors = shuffleArray(
      VOCAB_WORDS.filter((w) => w.id !== correct.id && w.svgKey !== correct.svgKey)
    ).slice(0, 4);

    const allOptions: RoundOption[] = shuffleArray([
      { word: correct, isCorrect: true, anim: new Animated.Value(0), eliminated: false },
      ...distractors.map((w) => ({
        word: w,
        isCorrect: false,
        anim: new Animated.Value(0),
        eliminated: false,
      })),
    ]);

    setCorrectWord(correct);
    setOptions(allOptions);
    setTimeLeft(ROUND_TIME);
    setWrongTaps(0);
    setRoundScore(0);
    setCurrentRound(roundNum);
    setResultMessage("");
    roundStartTime.current = Date.now();

    // Staggered bounce-in animation
    allOptions.forEach((opt, i) => {
      Animated.spring(opt.anim, {
        toValue: 1,
        delay: i * 100,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    });

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setPhase("playing");
  }, []);

  // Handle time running out
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0) {
      endRound(0, "Time's up!");
    }
  }, [timeLeft, phase]);

  // End the round
  const endRound = useCallback(
    (points: number, message: string) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const isGood = points > 0;
      setRoundScore(points);
      setTotalScore((prev) => prev + Math.max(0, points));
      setResultMessage(message);
      setResultColor(isGood ? "#2ECC71" : "#E74C3C");
      if (points > 0) setRoundsCompleted((prev) => prev + 1);

      if (Platform.OS !== "web") {
        if (isGood) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      setPhase("round_result");
    },
    []
  );

  // Handle tapping an option
  const handleTap = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const opt = options[index];
      if (opt.eliminated) return;

      if (opt.isCorrect) {
        // Correct! Calculate score
        const elapsed = (Date.now() - roundStartTime.current) / 1000;
        const timeRemaining = Math.max(0, ROUND_TIME - elapsed);
        const points = BASE_POINTS + Math.round(timeRemaining * TIME_BONUS_MULTIPLIER) - wrongTaps * WRONG_TAP_PENALTY;
        const finalPoints = Math.max(0, points);

        // Scale up animation on correct
        Animated.spring(opt.anim, {
          toValue: 1.3,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }).start();

        endRound(finalPoints, `+${finalPoints} points!`);
      } else {
        // Wrong tap
        const newWrongTaps = wrongTaps + 1;
        setWrongTaps(newWrongTaps);

        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        // Shrink out animation
        Animated.timing(opt.anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();

        const newOptions = [...options];
        newOptions[index] = { ...opt, eliminated: true };
        setOptions(newOptions);

        // Check if only correct answer remains
        const remaining = newOptions.filter((o) => !o.eliminated);
        if (remaining.length === 1 && remaining[0].isCorrect) {
          // Last object standing - score 0
          endRound(0, "Last one standing - 0 points");
        }
      }
    },
    [phase, options, wrongTaps, endRound]
  );

  // Move to next round or game over
  const handleNextRound = useCallback(() => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setPhase("game_over");
    } else {
      setupRound(currentRound + 1);
    }
  }, [currentRound, setupRound]);

  // Submit score when game over
  useEffect(() => {
    if (phase === "game_over" && !scoreSubmitted.current) {
      scoreSubmitted.current = true;
      setShowGameOver(true);
      apiRequest(
        "POST",
        "/api/game/scores",
        { score: totalScore, phrasesCompleted: roundsCompleted, gameType: "vocab_match" },
        { token: sessionToken }
      ).catch((err) => console.error("Failed to save score:", err));
    }
  }, [phase, totalScore, roundsCompleted, sessionToken]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePlayAgain = () => {
    setShowGameOver(false);
    setTotalScore(0);
    setRoundsCompleted(0);
    scoreSubmitted.current = false;
    usedWordIds.current.clear();
    setupRound(0);
  };

  const handleLeaderboard = () => {
    setShowGameOver(false);
    navigation.navigate("VocabMatchLeaderboard");
  };

  const handleStartGame = () => {
    setTotalScore(0);
    setRoundsCompleted(0);
    scoreSubmitted.current = false;
    usedWordIds.current.clear();
    setupRound(0);
  };

  const goldColor = "#C4942A";

  // Ready screen
  if (phase === "ready") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
        <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
        <View style={[styles.readyContainer, { paddingTop: headerHeight + 16, paddingBottom: tabBarHeight + 16 }]}>
          <View style={[styles.readyCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.readyIconWrapper, { backgroundColor: goldColor + "15" }]}>
              <Feather name="book-open" size={48} color={goldColor} />
            </View>
            <ThemedText style={[styles.readyTitle, { color: theme.text }]}>
              Vocab Match
            </ThemedText>
            <ThemedText style={[styles.readyDescription, { color: theme.textSecondary }]}>
              A Mien word will appear on screen with 5 pictures. Tap the correct picture that matches the word!
            </ThemedText>
            <View style={styles.readyRules}>
              <View style={styles.ruleRow}>
                <Feather name="clock" size={16} color={goldColor} />
                <ThemedText style={[styles.ruleText, { color: theme.textSecondary }]}>
                  {ROUND_TIME} seconds per round
                </ThemedText>
              </View>
              <View style={styles.ruleRow}>
                <Feather name="zap" size={16} color={goldColor} />
                <ThemedText style={[styles.ruleText, { color: theme.textSecondary }]}>
                  Faster answers = more points
                </ThemedText>
              </View>
              <View style={styles.ruleRow}>
                <Feather name="x-circle" size={16} color={goldColor} />
                <ThemedText style={[styles.ruleText, { color: theme.textSecondary }]}>
                  Wrong taps cost {WRONG_TAP_PENALTY} points
                </ThemedText>
              </View>
              <View style={styles.ruleRow}>
                <Feather name="target" size={16} color={goldColor} />
                <ThemedText style={[styles.ruleText, { color: theme.textSecondary }]}>
                  {TOTAL_ROUNDS} rounds total
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.startButton, { backgroundColor: goldColor }]}
              onPress={handleStartGame}
            >
              <Feather name="play" size={20} color="#FFFFFF" />
              <ThemedText style={styles.startButtonText}>Start Game</ThemedText>
            </Pressable>
          </View>
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
            <ThemedText style={[styles.scoreValue, { color: goldColor }]}>
              {totalScore.toLocaleString()}
            </ThemedText>
          </View>
          <View style={[styles.scoreDivider, { backgroundColor: theme.border }]} />
          <View style={styles.scoreItem}>
            <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
              Round
            </ThemedText>
            <ThemedText style={[styles.scoreValue, { color: theme.text }]}>
              {currentRound + 1}/{TOTAL_ROUNDS}
            </ThemedText>
          </View>
          <View style={[styles.scoreDivider, { backgroundColor: theme.border }]} />
          <View style={styles.scoreItem}>
            <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
              Time
            </ThemedText>
            <ThemedText
              style={[
                styles.scoreValue,
                { color: timeLeft <= 3 ? "#E74C3C" : theme.text },
              ]}
            >
              {timeLeft}s
            </ThemedText>
          </View>
        </View>

        {/* Mien word prompt */}
        {correctWord && phase === "playing" && (
          <View style={[styles.wordCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.wordLabel, { color: theme.textSecondary }]}>
              Tap the picture for:
            </ThemedText>
            <ThemedText style={[styles.wordMien, { color: goldColor }]}>
              {correctWord.mien}
            </ThemedText>
            <ThemedText style={[styles.wordCategory, { color: theme.textTertiary }]}>
              {correctWord.category}
            </ThemedText>
          </View>
        )}

        {/* Round result */}
        {phase === "round_result" && correctWord && (
          <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.resultMessage, { color: resultColor }]}>
              {resultMessage}
            </ThemedText>
            <View style={styles.resultAnswer}>
              <VocabArt svgKey={correctWord.svgKey} size={60} />
              <View style={styles.resultAnswerText}>
                <ThemedText style={[styles.resultMien, { color: theme.text }]}>
                  {correctWord.mien}
                </ThemedText>
                <ThemedText style={[styles.resultEnglish, { color: theme.textSecondary }]}>
                  = {correctWord.english}
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.nextButton, { backgroundColor: goldColor }]}
              onPress={handleNextRound}
            >
              <ThemedText style={styles.nextButtonText}>
                {currentRound + 1 >= TOTAL_ROUNDS ? "See Results" : "Next Round"}
              </ThemedText>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Options grid */}
        {phase === "playing" && (
          <View style={styles.optionsGrid}>
            {options.map((opt, index) => (
              <Animated.View
                key={`${currentRound}-${opt.word.id}`}
                style={[
                  styles.optionWrapper,
                  {
                    transform: [{ scale: opt.anim }],
                    opacity: opt.anim,
                  },
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.optionCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      opacity: opt.eliminated ? 0 : pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => handleTap(index)}
                  disabled={opt.eliminated}
                >
                  <VocabArt svgKey={opt.word.svgKey} size={70} />
                  <ThemedText
                    style={[styles.optionLabel, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {opt.word.english}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <GameOverModal
        visible={showGameOver}
        score={totalScore}
        phrasesCompleted={roundsCompleted}
        totalPhrases={TOTAL_ROUNDS}
        onPlayAgain={handlePlayAgain}
        onLeaderboard={handleLeaderboard}
        statLabel="Rounds"
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
  readyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  readyCard: {
    borderRadius: BorderRadius.xl,
    padding: 28,
    alignItems: "center",
  },
  readyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  readyDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  readyRules: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ruleText: {
    fontSize: 14,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreBar: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: 12,
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
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scoreDivider: {
    width: 1,
    height: 30,
  },
  wordCard: {
    borderRadius: BorderRadius.lg,
    padding: 20,
    alignItems: "center",
  },
  wordLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  wordMien: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  wordCategory: {
    fontSize: 12,
    fontStyle: "italic",
  },
  resultCard: {
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  resultMessage: {
    fontSize: 22,
    fontWeight: "bold",
  },
  resultAnswer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  resultAnswerText: {
    alignItems: "flex-start",
  },
  resultMien: {
    fontSize: 20,
    fontWeight: "bold",
  },
  resultEnglish: {
    fontSize: 16,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  optionWrapper: {
    width: "45%",
  },
  optionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
