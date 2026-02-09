import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform, Alert } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { File } from "expo-file-system";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { CreditIndicator } from "@/components/CreditIndicator";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";
import { useCredits } from "@/lib/CreditContext";
import { useXp } from "@/lib/XpContext";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

interface TranslationHistoryItem {
  id: string;
  originalText: string;
  translatedText: string;
  direction: "to_mien" | "to_english";
  sourceType: "text" | "document" | "video";
  creditsUsed: number;
  createdAt: string;
}

// Design colors matching the reference mockup
const DESIGN_COLORS = {
  orange: "#E8943A",
  orangeLight: "#F0A855",
  orangeDark: "#D4832E",
  green: "#6BAF4E",
  greenDark: "#5A9940",
  cream: "#FDF6E3",
  creamDark: "#EDE6D3",
  parchment: "#FAF4E8",
  brown: "#8B6914",
  warmBg: "#F5EDD8",
  white: "#FFFFFF",
  textDark: "#333333",
};

type InputMode = "text" | "document";
type TranslationDirection = "toEnglish" | "toMien" | "toOtherLanguage";

const OTHER_LANGUAGES = [
  { key: "vietnamese", label: "Vietnamese" },
  { key: "mandarin", label: "Mandarin Chinese" },
  { key: "hmong", label: "Hmong" },
  { key: "cantonese", label: "Cantonese" },
  { key: "thai", label: "Thai" },
  { key: "lao", label: "Lao" },
  { key: "burmese", label: "Burmese" },
  { key: "french", label: "French" },
  { key: "pinghua", label: "Pinghua" },
  { key: "khmer", label: "Khmer" },
] as const;

type OtherLanguageKey = typeof OTHER_LANGUAGES[number]["key"];

interface SelectedFile {
  name: string;
  size: number;
  uri: string;
  mimeType?: string;
  base64Data?: string;
}

// Simple translate direction button
function TranslateDirectionButton({
  onPress,
  label,
  isActive,
}: {
  onPress: () => void;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.directionButton,
        isActive && styles.directionButtonActive,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
    >
      <ThemedText style={[styles.directionButtonText, isActive && styles.directionButtonTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function TranslateScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { sessionToken } = useAuth();
  const { checkCreditError } = useCredits();
  const { notifyXpGain } = useXp();

  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [documentText, setDocumentText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<{ original: string; translated: string; direction: TranslationDirection } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedOtherLanguage, setSelectedOtherLanguage] = useState<OtherLanguageKey>("vietnamese");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const fetchHistory = useCallback(async () => {
    if (!sessionToken) return;
    setIsLoadingHistory(true);
    try {
      const response = await fetch(new URL("/api/translation-history?limit=20", getApiUrl()).toString(), {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch translation history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (sessionToken && showHistory) {
      fetchHistory();
    }
  }, [sessionToken, showHistory, fetchHistory]);

  const handleDeleteHistoryItem = async (id: string) => {
    if (!sessionToken) return;
    try {
      const response = await fetch(new URL(`/api/translation-history/${id}`, getApiUrl()).toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (response.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Failed to delete translation:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!sessionToken) return;

    const confirmClear = () => {
      if (Platform.OS === "web") {
        return window.confirm("Are you sure you want to clear all translation history?");
      }
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          "Clear History",
          "Are you sure you want to clear all translation history?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Clear", style: "destructive", onPress: () => resolve(true) },
          ]
        );
      });
    };

    const confirmed = await confirmClear();
    if (!confirmed) return;

    try {
      const response = await fetch(new URL("/api/translation-history", getApiUrl()).toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (response.ok) {
        setHistory([]);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Failed to clear translation history:", err);
    }
  };

  const handleUseHistoryItem = (item: TranslationHistoryItem) => {
    setTextInput(item.originalText);
    setInputMode("text");
    setShowHistory(false);
    setResult({
      original: item.originalText,
      translated: item.translatedText,
      direction: item.direction === "to_mien" ? "toMien" : "toEnglish",
    });
  };

  const modes: { key: InputMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "text", label: "Text", icon: "type" },
    { key: "document", label: "Document", icon: "file-text" },
  ];

  const [permissionResponse, setPermissionResponse] = useState<{ granted: boolean; canAskAgain: boolean } | null>(null);

  const requestAudioPermission = async () => {
    if (Platform.OS === "web") {
      setHasAudioPermission(false);
      setPermissionResponse({ granted: false, canAskAgain: false });
      return { granted: false, canAskAgain: false };
    }
    const status = await AudioModule.requestRecordingPermissionsAsync();
    setHasAudioPermission(status.granted);
    setPermissionResponse({ granted: status.granted, canAskAgain: status.canAskAgain });
    return { granted: status.granted, canAskAgain: status.canAskAgain };
  };

  const handleOpenSettings = async () => {
    try {
      const { Linking } = await import("react-native");
      await Linking.openSettings();
    } catch (err) {
      console.error("Could not open settings:", err);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (hasAudioPermission === null) {
        const result = await requestAudioPermission();
        if (!result.granted) {
          if (!result.canAskAgain) {
            setError("Microphone permission denied. Please enable it in Settings.");
          } else {
            setError("Microphone permission is required for audio recording");
          }
          return;
        }
      } else if (!hasAudioPermission) {
        if (permissionResponse && !permissionResponse.canAskAgain) {
          setError("Microphone permission denied. Please enable it in Settings.");
        } else {
          const result = await requestAudioPermission();
          if (!result.granted) return;
        }
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Failed to start recording. Please try again.");
    }
  };

  const handleStopRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await audioRecorder.stop();
      setIsRecording(false);

      const uri = audioRecorder.uri;
      if (!uri) {
        setError("No audio recorded");
        return;
      }

      setIsTranscribing(true);

      let base64Audio = "";
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || result;
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        const file = new File(uri);
        base64Audio = await file.base64();
      }

      const response = await fetch(new URL("/api/transcribe-audio", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: "audio/m4a",
        }),
      });

      if (await checkCreditError(response)) {
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await response.json();
      if (data.transcription) {
        setTextInput((prev) => (prev ? prev + "\n" + data.transcription : data.transcription));
      } else {
        setError("Could not transcribe audio");
      }
    } catch (err: any) {
      console.error("Failed to stop recording:", err);
      setError(err.message || "Failed to transcribe audio");
    } finally {
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain"],
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let base64Data = "";

        setSelectedFile({
          name: asset.name,
          size: asset.size || 0,
          uri: asset.uri,
          mimeType: asset.mimeType,
        });
        setDocumentText("");

        if (asset.mimeType === "text/plain") {
          try {
            if (Platform.OS === "web") {
              const response = await fetch(asset.uri);
              const content = await response.text();
              setDocumentText(content);
            } else {
              const file = new File(asset.uri);
              const content = await file.text();
              setDocumentText(content);
            }
          } catch (e) {
            console.log("Could not read text file:", e);
          }
        } else {
          try {
            if (Platform.OS === "web") {
              const response = await fetch(asset.uri);
              const blob = await response.blob();
              base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  const base64 = result.split(",")[1] || result;
                  resolve(base64);
                };
                reader.readAsDataURL(blob);
              });
            } else {
              const file = new File(asset.uri);
              base64Data = await file.base64();
            }

            setSelectedFile({
              name: asset.name,
              size: asset.size || 0,
              uri: asset.uri,
              mimeType: asset.mimeType,
              base64Data,
            });
          } catch (e) {
            console.log("Could not read document as base64:", e);
          }
        }
      }
    } catch (err) {
      console.error("Document picker error:", err);
    }
  };

  const handleTranslate = async (direction: TranslationDirection) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTranslating(true);
    setError(null);
    setResult(null);

    try {
      let content = "";
      let documentContent = "";

      if (inputMode === "text") {
        content = textInput;
      } else if (inputMode === "document" && selectedFile) {
        content = selectedFile.name;
        documentContent = documentText;
      }

      if (inputMode !== "document" && !content.trim()) {
        setError("Please enter content to translate");
        setIsTranslating(false);
        return;
      }

      if (inputMode === "document" && !selectedFile) {
        setError("Please select a document");
        setIsTranslating(false);
        return;
      }

      const response = await fetch(new URL("/api/translate", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          content,
          sourceType: inputMode,
          documentContent: documentContent || undefined,
          documentData: selectedFile?.base64Data || undefined,
          documentMimeType: selectedFile?.mimeType || undefined,
          targetLanguage: direction === "toMien" ? "mien" : direction === "toOtherLanguage" ? selectedOtherLanguage : "english",
        }),
      });

      if (await checkCreditError(response)) {
        return;
      }

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      setResult({
        original: inputMode === "document" ? (documentText || `Document: ${selectedFile?.name}`) : content,
        translated: data.translation,
        direction,
      });
      notifyXpGain(10, false);
      // Refresh history if it's being shown
      if (showHistory) {
        fetchHistory();
      }
    } catch (err: any) {
      setError(err.message || "Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    if (result?.translated) {
      await Clipboard.setStringAsync(result.translated);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const canTranslate =
    (inputMode === "text" && textInput.trim().length > 0) ||
    (inputMode === "document" && selectedFile !== null);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#1a1a1a" : DESIGN_COLORS.warmBg }}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {/* Mode Selector - Pill Style */}
        <View style={styles.modeSelector}>
          {modes.map((mode) => {
            const isActive = inputMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                style={[
                  styles.modeButton,
                  isActive ? styles.modeButtonActive : styles.modeButtonInactive,
                ]}
                onPress={() => {
                  setInputMode(mode.key);
                  setResult(null);
                  setError(null);
                }}
              >
                <ThemedText
                  style={[
                    styles.modeText,
                    { color: isActive ? "#FFFFFF" : DESIGN_COLORS.textDark },
                  ]}
                >
                  {mode.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Text Input */}
        {inputMode === "text" && (
          <View style={styles.parchmentContainer}>
            <View style={styles.parchmentInner}>
              <TextInput
                style={styles.parchmentTextArea}
                placeholder="Enter text to translate"
                placeholderTextColor="#999"
                value={textInput}
                onChangeText={setTextInput}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <View style={styles.parchmentFooter}>
                <ThemedText style={styles.charCount}>
                  {textInput.length} characters
                </ThemedText>
                <View style={styles.parchmentActions}>
                  {Platform.OS !== "web" && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.micButton,
                        {
                          backgroundColor: isRecording ? DESIGN_COLORS.orange : DESIGN_COLORS.cream,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                      onPress={isRecording ? handleStopRecording : handleStartRecording}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <ActivityIndicator size="small" color={DESIGN_COLORS.orange} />
                      ) : (
                        <Feather
                          name={isRecording ? "stop-circle" : "mic"}
                          size={18}
                          color={isRecording ? "#FFFFFF" : DESIGN_COLORS.orange}
                        />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={[styles.recordingDot, { backgroundColor: DESIGN_COLORS.orange }]} />
                <ThemedText style={[styles.recordingText, { color: DESIGN_COLORS.orange }]}>
                  Recording... Tap to stop
                </ThemedText>
              </View>
            )}
            {isTranscribing && (
              <View style={styles.recordingIndicator}>
                <ThemedText style={[styles.recordingText, { color: theme.textSecondary }]}>
                  Transcribing audio...
                </ThemedText>
              </View>
            )}
            {Platform.OS !== "web" && permissionResponse && !permissionResponse.granted && !permissionResponse.canAskAgain && (
              <Pressable
                style={({ pressed }) => [
                  styles.settingsButton,
                  { backgroundColor: DESIGN_COLORS.orange, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleOpenSettings}
              >
                <Feather name="settings" size={16} color="#FFFFFF" />
                <ThemedText style={styles.settingsButtonText}>Open Settings</ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* Document Input */}
        {inputMode === "document" && (
          <View>
            <View style={styles.parchmentContainer}>
              <View style={styles.parchmentInner}>
                {selectedFile ? (
                  <View style={styles.filePreview}>
                    <Feather name="file-text" size={40} color={DESIGN_COLORS.orange} />
                    <View style={styles.fileInfo}>
                      <ThemedText style={styles.fileName} numberOfLines={1}>
                        {selectedFile.name}
                      </ThemedText>
                      <ThemedText style={[styles.fileSize, { color: theme.textSecondary }]}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </ThemedText>
                    </View>
                    <Pressable onPress={() => { setSelectedFile(null); setDocumentText(""); }} style={styles.removeFile}>
                      <Feather name="x" size={20} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.pickButton, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={handlePickDocument}
                  >
                    <Feather name="upload" size={32} color={DESIGN_COLORS.orange} />
                    <ThemedText style={[styles.pickText, { color: DESIGN_COLORS.orange }]}>Select Document</ThemedText>
                    <ThemedText style={[styles.pickHint, { color: theme.textSecondary }]}>
                      Supports PDF
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            </View>

            {selectedFile && (
              <View style={[styles.parchmentContainer, { marginTop: Spacing.md }]}>
                <View style={styles.parchmentInner}>
                  <ThemedText style={[styles.docHelpLabel, { color: theme.textSecondary }]}>
                    Paste document text here for best results:
                  </ThemedText>
                  <TextInput
                    style={[styles.parchmentTextArea, { minHeight: 100 }]}
                    placeholder="Paste the text from your document..."
                    placeholderTextColor="#999"
                    value={documentText}
                    onChangeText={setDocumentText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Translate Direction Buttons */}
        <View style={styles.translateButtonsRow}>
          <TranslateDirectionButton
            onPress={() => handleTranslate("toMien")}
            label="Translate to Mien"
          />
          <TranslateDirectionButton
            onPress={() => handleTranslate("toEnglish")}
            label="Translate to English"
          />
        </View>

        {/* Other Language Translation */}
        <View style={styles.otherLanguageSection}>
          <ThemedText style={styles.otherLanguageLabel}>Translate to Other Language</ThemedText>
          <Pressable
            style={styles.languagePickerButton}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <ThemedText style={styles.languagePickerText}>
              {OTHER_LANGUAGES.find((l) => l.key === selectedOtherLanguage)?.label}
            </ThemedText>
            <Feather
              name={showLanguagePicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={DESIGN_COLORS.orange}
            />
          </Pressable>
          {showLanguagePicker && (
            <View style={[styles.languageDropdown, { backgroundColor: isDark ? "#2a2a2a" : "#FFFFFF" }]}>
              {OTHER_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.key}
                  style={({ pressed }) => [
                    styles.languageOption,
                    selectedOtherLanguage === lang.key && styles.languageOptionActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => {
                    setSelectedOtherLanguage(lang.key);
                    setShowLanguagePicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.languageOptionText,
                      selectedOtherLanguage === lang.key && styles.languageOptionTextActive,
                    ]}
                  >
                    {lang.label}
                  </ThemedText>
                  {selectedOtherLanguage === lang.key && (
                    <Feather name="check" size={16} color={DESIGN_COLORS.orange} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.mainTranslateButton,
              {
                opacity: pressed && canTranslate ? 0.9 : !canTranslate ? 0.5 : 1,
                transform: [{ scale: pressed && canTranslate ? 0.98 : 1 }],
              },
            ]}
            onPress={() => handleTranslate("toOtherLanguage")}
            disabled={!canTranslate || isTranslating}
          >
            {isTranslating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.mainTranslateButtonText}>
                Translate to {OTHER_LANGUAGES.find((l) => l.key === selectedOtherLanguage)?.label}
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: "#EF444420" }]}>
            <Feather name="alert-circle" size={18} color="#EF4444" />
            <ThemedText style={[styles.errorText, { color: "#EF4444" }]}>{error}</ThemedText>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={[styles.resultContainer, { backgroundColor: theme.surface, borderColor: DESIGN_COLORS.orange }]}>
            <View style={styles.resultHeader}>
              <ThemedText style={styles.resultTitle}>Translation Result</ThemedText>
              <Pressable
                style={({ pressed }) => [styles.copyButton, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleCopy}
              >
                <Feather name="copy" size={18} color={DESIGN_COLORS.orange} />
              </Pressable>
            </View>
            <View style={[styles.resultDivider, { backgroundColor: DESIGN_COLORS.orange }]} />
            <ThemedText style={[styles.resultLabel, { color: theme.textSecondary }]}>Original:</ThemedText>
            <ThemedText style={styles.resultOriginal} numberOfLines={3}>
              {result.original}
            </ThemedText>
            <ThemedText style={[styles.resultLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>
              {result.direction === "toMien" ? "Mien (IuMiNR):" : result.direction === "toOtherLanguage" ? `${OTHER_LANGUAGES.find((l) => l.key === selectedOtherLanguage)?.label}:` : "English:"}
            </ThemedText>
            <ThemedText style={styles.resultTranslated}>{result.translated}</ThemedText>
          </View>
        )}

        {/* Translation History Section */}
        <Pressable
          style={({ pressed }) => [
            styles.historyToggle,
            {
              backgroundColor: showHistory ? DESIGN_COLORS.orange : theme.surface,
              borderColor: DESIGN_COLORS.orange,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Feather
            name="clock"
            size={14}
            color={showHistory ? "#FFFFFF" : DESIGN_COLORS.orange}
          />
          <ThemedText
            style={[
              styles.historyToggleText,
              { color: showHistory ? "#FFFFFF" : DESIGN_COLORS.orange },
            ]}
          >
            Translation History
          </ThemedText>
          <Feather
            name={showHistory ? "chevron-up" : "chevron-down"}
            size={16}
            color={showHistory ? "#FFFFFF" : DESIGN_COLORS.orange}
          />
        </Pressable>

        {showHistory && (
          <View style={[styles.historySection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.historyHeader}>
              <ThemedText style={styles.historyTitle}>Translation History</ThemedText>
              {history.length > 0 && (
                <Pressable
                  style={({ pressed }) => [styles.clearHistoryButton, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={handleClearHistory}
                >
                  <Feather name="trash-2" size={14} color={DESIGN_COLORS.orange} />
                  <ThemedText style={[styles.clearHistoryText, { color: DESIGN_COLORS.orange }]}>
                    Clear All
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {isLoadingHistory ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="small" color={DESIGN_COLORS.orange} />
                <ThemedText style={[styles.historyLoadingText, { color: theme.textSecondary }]}>
                  Loading history...
                </ThemedText>
              </View>
            ) : history.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Feather name="inbox" size={32} color={theme.textSecondary} />
                <ThemedText style={[styles.historyEmptyText, { color: theme.textSecondary }]}>
                  No translation history yet
                </ThemedText>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.historyItem,
                      { backgroundColor: pressed ? DESIGN_COLORS.creamDark : DESIGN_COLORS.cream },
                    ]}
                    onPress={() => handleUseHistoryItem(item)}
                  >
                    <View style={styles.historyItemContent}>
                      <ThemedText style={styles.historyOriginal} numberOfLines={1}>
                        Source: {item.originalText}
                      </ThemedText>
                      <ThemedText style={[styles.historyTranslated, { color: theme.textSecondary }]} numberOfLines={1}>
                        Translated: {item.translatedText}
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
      <CreditIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
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
  // Page title
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },

  // Mode selector - pill style
  modeSelector: {
    flexDirection: "row",
    backgroundColor: DESIGN_COLORS.creamDark,
    borderRadius: 25,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: 22,
  },
  modeButtonActive: {
    backgroundColor: DESIGN_COLORS.orange,
  },
  modeButtonInactive: {
    backgroundColor: "transparent",
  },
  modeText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Input container
  parchmentContainer: {
    marginBottom: Spacing.lg,
  },
  parchmentInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.creamDark,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  parchmentTextArea: {
    fontSize: 16,
    minHeight: 120,
    color: "#333",
  },
  parchmentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DESIGN_COLORS.creamDark,
  },
  parchmentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  charCount: {
    fontSize: 12,
    color: "#888",
  },

  // Mic button
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DESIGN_COLORS.orange,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  // File picker
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  fileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 13,
    marginTop: 2,
  },
  removeFile: {
    padding: Spacing.sm,
  },
  pickButton: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  pickText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: Spacing.md,
  },
  pickHint: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  docHelpLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },

  // Translate direction buttons
  directionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: DESIGN_COLORS.orange,
  },
  directionButtonActive: {
    backgroundColor: DESIGN_COLORS.orangeDark,
  },
  directionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  directionButtonTextActive: {
    color: "#FFFFFF",
  },

  // Translate buttons row
  translateButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Other language section
  otherLanguageSection: {
    marginBottom: Spacing.lg,
  },
  otherLanguageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DESIGN_COLORS.textDark,
    marginBottom: Spacing.sm,
  },
  languagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.orange,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  languagePickerText: {
    fontSize: 15,
    fontWeight: "500",
    color: DESIGN_COLORS.textDark,
  },
  languageDropdown: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.creamDark,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.creamDark,
  },
  languageOptionActive: {
    backgroundColor: DESIGN_COLORS.cream,
  },
  languageOptionText: {
    fontSize: 14,
    color: DESIGN_COLORS.textDark,
  },
  languageOptionTextActive: {
    fontWeight: "600",
    color: DESIGN_COLORS.orange,
  },

  // Main translate button
  mainTranslateButton: {
    backgroundColor: DESIGN_COLORS.green,
    borderRadius: 25,
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mainTranslateButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },

  // Result
  resultContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  copyButton: {
    padding: Spacing.xs,
  },
  resultDivider: {
    height: 2,
    marginVertical: Spacing.md,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  resultOriginal: {
    fontSize: 14,
  },
  resultTranslated: {
    fontSize: 16,
    lineHeight: 24,
  },

  // History toggle
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  historyToggleText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  // History section
  historySection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  clearHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  historyLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  historyLoadingText: {
    fontSize: 14,
  },
  historyEmpty: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  historyEmptyText: {
    fontSize: 14,
  },
  historyList: {
    gap: Spacing.xs,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.creamDark,
  },
  historyItemContent: {
    flex: 1,
  },
  historyOriginal: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  historyTranslated: {
    fontSize: 13,
  },
});
