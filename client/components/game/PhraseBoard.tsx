import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface PhraseBoardProps {
  phrase: string;
  guessedLetters: Set<string>;
  englishHint: string;
}

export default function PhraseBoard({ phrase, guessedLetters, englishHint }: PhraseBoardProps) {
  const { theme } = useTheme();

  const words = phrase.split(" ");

  return (
    <View style={styles.container}>
      <View style={styles.phraseContainer}>
        {words.map((word, wi) => (
          <View key={wi} style={styles.wordContainer}>
            {word.split("").map((char, ci) => {
              const upper = char.toUpperCase();
              const isLetter = /[A-Za-z]/.test(char);
              const revealed = !isLetter || guessedLetters.has(upper);

              return (
                <View
                  key={`${wi}-${ci}`}
                  style={[
                    styles.tile,
                    {
                      backgroundColor: isLetter
                        ? revealed
                          ? "#C4942A"
                          : theme.surface
                        : "transparent",
                      borderColor: isLetter ? "#A67B1E" : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tileText,
                      { color: revealed ? "#FFFFFF" : "transparent" },
                    ]}
                  >
                    {isLetter ? upper : char}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* English hint */}
      <View style={[styles.hintContainer, { backgroundColor: theme.surface }]}>
        <ThemedText style={[styles.hintLabel, { color: theme.textSecondary }]}>
          Hint:
        </ThemedText>
        <ThemedText
          style={[styles.hintText, { color: theme.text }]}
          numberOfLines={2}
        >
          {englishHint}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  phraseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  wordContainer: {
    flexDirection: "row",
    gap: 3,
  },
  tile: {
    width: 28,
    height: 34,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  hintContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: "95%",
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
