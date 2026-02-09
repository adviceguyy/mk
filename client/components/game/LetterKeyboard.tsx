import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

interface LetterKeyboardProps {
  onLetterPress: (letter: string) => void;
  correctLetters: Set<string>;
  wrongLetters: Set<string>;
  disabled?: boolean;
}

export default function LetterKeyboard({
  onLetterPress,
  correctLetters,
  wrongLetters,
  disabled,
}: LetterKeyboardProps) {
  const handlePress = (letter: string) => {
    if (disabled || correctLetters.has(letter) || wrongLetters.has(letter)) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onLetterPress(letter);
  };

  return (
    <View style={styles.container}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((letter) => {
            const isCorrect = correctLetters.has(letter);
            const isWrong = wrongLetters.has(letter);
            const isUsed = isCorrect || isWrong;

            return (
              <Pressable
                key={letter}
                style={[
                  styles.key,
                  isCorrect && styles.keyCorrect,
                  isWrong && styles.keyWrong,
                  !isUsed && styles.keyAvailable,
                ]}
                onPress={() => handlePress(letter)}
                disabled={disabled || isUsed}
              >
                <ThemedText
                  style={[
                    styles.keyText,
                    isUsed && styles.keyTextUsed,
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
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6,
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  key: {
    width: 32,
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  keyAvailable: {
    backgroundColor: "#C4942A",
  },
  keyCorrect: {
    backgroundColor: "#2ECC71",
  },
  keyWrong: {
    backgroundColor: "#6B7280",
  },
  keyText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  keyTextUsed: {
    opacity: 0.6,
  },
});
