import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet, ScrollView, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

export interface RichTextStyle {
  fontSize?: "small" | "medium" | "large";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textColor?: string;
  backgroundColor?: string;
}

interface RichTextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  style?: RichTextStyle;
  onStyleChange: (style: RichTextStyle) => void;
  placeholder?: string;
}

const TEXT_COLORS = [
  "#000000", "#DC2626", "#EA580C", "#D97706", "#65A30D",
  "#16A34A", "#0D9488", "#0284C7", "#7C3AED", "#DB2777",
];

const BG_COLORS = [
  "transparent", "#FEE2E2", "#FFEDD5", "#FEF3C7", "#ECFCCB",
  "#D1FAE5", "#CCFBF1", "#E0F2FE", "#EDE9FE", "#FCE7F3",
];

const FONT_SIZES = [
  { key: "small", label: "S", size: 14 },
  { key: "medium", label: "M", size: 16 },
  { key: "large", label: "L", size: 20 },
];

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😊", "🥰", "😍", "🤩", "😘", "😋",
  "🤔", "🤗", "🙏", "👍", "👏", "🎉", "🔥", "❤️", "💯", "✨",
  "🌟", "🌈", "☀️", "🌙", "🌸", "🌺", "🍀", "🦋", "🐝", "🌊",
];

export function RichTextEditor({
  value,
  onChangeText,
  style = {},
  onStyleChange,
  placeholder,
}: RichTextEditorProps) {
  const { theme, isDark } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const getFontSize = () => {
    switch (style.fontSize) {
      case "small": return 14;
      case "large": return 20;
      default: return 16;
    }
  };

  const toggleBold = () => {
    onStyleChange({ ...style, fontWeight: style.fontWeight === "bold" ? "normal" : "bold" });
  };

  const toggleItalic = () => {
    onStyleChange({ ...style, fontStyle: style.fontStyle === "italic" ? "normal" : "italic" });
  };

  const setFontSize = (size: "small" | "medium" | "large") => {
    onStyleChange({ ...style, fontSize: size });
  };

  const setTextColor = (color: string) => {
    onStyleChange({ ...style, textColor: color });
    setShowColorPicker(false);
  };

  const setBgColor = (color: string) => {
    onStyleChange({ ...style, backgroundColor: color === "transparent" ? undefined : color });
    setShowBgPicker(false);
  };

  const insertEmoji = (emoji: string) => {
    onChangeText(value + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar}>
        {FONT_SIZES.map((fs) => (
          <Pressable
            key={fs.key}
            style={[
              styles.toolButton,
              { backgroundColor: style.fontSize === fs.key ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.backgroundSecondary },
            ]}
            onPress={() => setFontSize(fs.key as "small" | "medium" | "large")}
          >
            <ThemedText style={[styles.sizeLabel, { color: style.fontSize === fs.key ? "#FFFFFF" : theme.text }]}>
              {fs.label}
            </ThemedText>
          </Pressable>
        ))}

        <Pressable
          style={[
            styles.toolButton,
            { backgroundColor: style.fontWeight === "bold" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.backgroundSecondary },
          ]}
          onPress={toggleBold}
        >
          <Feather name="bold" size={18} color={style.fontWeight === "bold" ? "#FFFFFF" : theme.text} />
        </Pressable>

        <Pressable
          style={[
            styles.toolButton,
            { backgroundColor: style.fontStyle === "italic" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.backgroundSecondary },
          ]}
          onPress={toggleItalic}
        >
          <Feather name="italic" size={18} color={style.fontStyle === "italic" ? "#FFFFFF" : theme.text} />
        </Pressable>

        <Pressable
          style={[styles.toolButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => setShowColorPicker(true)}
        >
          <View style={[styles.colorIndicator, { backgroundColor: style.textColor || theme.text }]} />
        </Pressable>

        <Pressable
          style={[styles.toolButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => setShowBgPicker(true)}
        >
          <Feather name="edit-3" size={18} color={theme.text} />
          {style.backgroundColor ? (
            <View style={[styles.bgIndicator, { backgroundColor: style.backgroundColor }]} />
          ) : null}
        </Pressable>

        <Pressable
          style={[styles.toolButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => setShowEmojiPicker(true)}
        >
          <ThemedText style={styles.emojiButton}>😊</ThemedText>
        </Pressable>
      </ScrollView>

      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: style.backgroundColor || theme.backgroundSecondary,
            color: style.textColor || theme.text,
            borderColor: theme.border,
            fontSize: getFontSize(),
            fontWeight: style.fontWeight || "normal",
            fontStyle: style.fontStyle || "normal",
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={4}
      />

      <Modal visible={showColorPicker} transparent animationType="fade" onRequestClose={() => setShowColorPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.pickerTitle}>Text Color</ThemedText>
            <View style={styles.colorGrid}>
              {TEXT_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color, borderColor: style.textColor === color ? (isDark ? Colors.dark.primary : Colors.light.primary) : "transparent" }]}
                  onPress={() => setTextColor(color)}
                />
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showBgPicker} transparent animationType="fade" onRequestClose={() => setShowBgPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowBgPicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.pickerTitle}>Highlight Color</ThemedText>
            <View style={styles.colorGrid}>
              {BG_COLORS.map((color, index) => (
                <Pressable
                  key={color + index}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color === "transparent" ? theme.backgroundSecondary : color,
                      borderColor: (style.backgroundColor === color || (!style.backgroundColor && color === "transparent"))
                        ? (isDark ? Colors.dark.primary : Colors.light.primary)
                        : theme.border,
                    },
                  ]}
                  onPress={() => setBgColor(color)}
                >
                  {color === "transparent" ? <Feather name="x" size={16} color={theme.textSecondary} /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showEmojiPicker} transparent animationType="fade" onRequestClose={() => setShowEmojiPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEmojiPicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.pickerTitle}>Add Emoji</ThemedText>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((emoji) => (
                <Pressable key={emoji} style={styles.emojiOption} onPress={() => insertEmoji(emoji)}>
                  <ThemedText style={styles.emoji}>{emoji}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  toolbar: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  bgIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emojiButton: {
    fontSize: 18,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    width: "80%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emojiOption: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 28,
  },
});
