import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { getApiUrl } from "@/lib/query-client";

// Get the Express API server base URL
function getServerBase(): string {
  if (Platform.OS === "web") {
    // On web, derive from current hostname
    const loc = window.location;
    // In production, Express serves the web app on standard ports (no port visible)
    // In dev on port 5000, we're already on Express — use relative URLs
    if (!loc.port || loc.port === "5000") return "";
    // In dev, web app is on a different port (e.g., Expo on 8081) — point to Express
    return `${loc.protocol}//${loc.hostname}:5000`;
  }
  return getApiUrl().replace(/\/$/, "");
}

export default function GrammarBookScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGoToPage, setShowGoToPage] = useState(false);
  const [pageInputValue, setPageInputValue] = useState("");

  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isWeb = Platform.OS === "web";
  const serverBase = getServerBase();
  const viewerUrl =
    serverBase +
    "/api/literature/grammar-book/viewer" +
    (isDark ? "?dark=1" : "");

  // Fetch total pages
  useEffect(() => {
    fetch(`${serverBase}/api/literature/grammar-book/info`)
      .then((r) => r.json())
      .then((info: any) => {
        if (info?.totalPages) setTotalPages(info.totalPages);
      })
      .catch(() => {});
  }, [serverBase]);

  // Hide loading after timeout
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for postMessage from iframe (web)
  const handleViewerMessage = useCallback((raw: any) => {
    let data = raw;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    if (!data || !data.type) return;
    if (data.type === "pdfLoaded" && data.totalPages) {
      setTotalPages(data.totalPages);
    } else if (data.type === "pageRendered") {
      if (data.currentPage) setCurrentPage(data.currentPage);
      if (data.totalPages) setTotalPages(data.totalPages);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    const handler = (e: MessageEvent) => handleViewerMessage(e.data);
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isWeb, handleViewerMessage]);

  const sendToViewer = useCallback(
    (message: object) => {
      const json = JSON.stringify(message);
      if (isWeb) {
        try {
          (iframeRef.current as any)?.contentWindow?.postMessage(json, "*");
        } catch {}
      } else {
        try {
          webViewRef.current?.postMessage(json);
        } catch {}
      }
    },
    [isWeb],
  );

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages || page));
      setCurrentPage(clamped);
      setLoading(true);
      sendToViewer({ type: "goToPage", page: clamped });
      setTimeout(() => setLoading(false), 2000);
    },
    [totalPages, sendToViewer],
  );

  const handleGoToPageSubmit = () => {
    const page = parseInt(pageInputValue, 10);
    if (
      !isNaN(page) &&
      page >= 1 &&
      (totalPages === 0 || page <= totalPages)
    ) {
      goToPage(page);
    }
    setShowGoToPage(false);
    setPageInputValue("");
  };

  const bgColor = isDark ? "#1a1a1a" : "#F5EDD8";
  const goldColor = isDark
    ? Colors.dark.heritage.gold
    : Colors.light.heritage.gold;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Loading overlay */}
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: bgColor }]}>
          <ActivityIndicator size="large" color={goldColor} />
          <ThemedText
            style={[styles.loadingText, { color: theme.textSecondary }]}
          >
            Loading Grammar Book...
          </ThemedText>
        </View>
      )}

      {/* PDF Viewer */}
      <View style={[styles.viewerArea, { marginTop: headerHeight }]}>
        {isWeb ? (
          <iframe
            ref={iframeRef as any}
            src={viewerUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Mien Grammar Book"
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: viewerUrl }}
            style={styles.webview}
            onMessage={(e) => handleViewerMessage(e.nativeEvent.data)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Navigation Controls — always visible, positioned above tab bar */}
      <View
        style={[
          styles.controls,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            bottom: tabBarHeight,
            paddingBottom: Spacing.sm,
          },
        ]}
      >
        <Pressable
          onPress={() => goToPage(1)}
          disabled={currentPage <= 1}
          style={({ pressed }) => [
            styles.navBtn,
            { opacity: currentPage <= 1 ? 0.25 : pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="chevrons-left" size={20} color={theme.text} />
        </Pressable>

        <Pressable
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          style={({ pressed }) => [
            styles.navBtn,
            { opacity: currentPage <= 1 ? 0.25 : pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="chevron-left" size={22} color={theme.text} />
        </Pressable>

        <Pressable
          onPress={() => {
            setPageInputValue(String(currentPage));
            setShowGoToPage(true);
          }}
          style={({ pressed }) => [
            styles.pageIndicator,
            {
              backgroundColor: (isDark ? "#ffffff" : "#000000") + "08",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ThemedText style={[styles.pageNumber, { color: theme.text }]}>
            {totalPages > 0
              ? `${currentPage} / ${totalPages}`
              : `Page ${currentPage}`}
          </ThemedText>
          <ThemedText
            style={[styles.goToHint, { color: theme.textTertiary }]}
          >
            Go to page
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => goToPage(currentPage + 1)}
          disabled={totalPages > 0 && currentPage >= totalPages}
          style={({ pressed }) => [
            styles.navBtn,
            {
              opacity:
                totalPages > 0 && currentPage >= totalPages
                  ? 0.25
                  : pressed
                    ? 0.6
                    : 1,
            },
          ]}
        >
          <Feather name="chevron-right" size={22} color={theme.text} />
        </Pressable>

        <Pressable
          onPress={() => goToPage(totalPages)}
          disabled={totalPages === 0 || currentPage >= totalPages}
          style={({ pressed }) => [
            styles.navBtn,
            {
              opacity:
                totalPages === 0 || currentPage >= totalPages
                  ? 0.25
                  : pressed
                    ? 0.6
                    : 1,
            },
          ]}
        >
          <Feather name="chevrons-right" size={20} color={theme.text} />
        </Pressable>
      </View>

      {/* Go to Page Modal */}
      <Modal visible={showGoToPage} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowGoToPage(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalCenter}
          >
            <Pressable
              style={[styles.modalCard, { backgroundColor: theme.surface }]}
              onPress={(e) => e.stopPropagation()}
            >
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                Go to Page
              </ThemedText>
              <ThemedText
                style={[
                  styles.modalSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Enter a page number
                {totalPages > 0 ? ` (1–${totalPages})` : ""}
              </ThemedText>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: isDark ? "#2a2a3a" : "#f9f9f9",
                  },
                ]}
                value={pageInputValue}
                onChangeText={setPageInputValue}
                keyboardType="number-pad"
                placeholder={
                  totalPages > 0
                    ? `e.g. ${Math.ceil(totalPages / 2)}`
                    : "e.g. 50"
                }
                placeholderTextColor={theme.textTertiary}
                autoFocus
                onSubmitEditing={handleGoToPageSubmit}
                selectTextOnFocus
                maxLength={totalPages > 0 ? String(totalPages).length : 4}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[
                    styles.modalBtn,
                    { backgroundColor: isDark ? "#333" : "#e5e7eb" },
                  ]}
                  onPress={() => setShowGoToPage(false)}
                >
                  <ThemedText
                    style={[styles.modalBtnText, { color: theme.text }]}
                  >
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: goldColor }]}
                  onPress={handleGoToPageSubmit}
                >
                  <ThemedText
                    style={[styles.modalBtnText, { color: "#fff" }]}
                  >
                    Go
                  </ThemedText>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  viewerArea: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 5,
    gap: Spacing.xs,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  pageIndicator: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    maxWidth: 160,
  },
  pageNumber: {
    fontSize: 15,
    fontWeight: "600",
  },
  goToHint: {
    fontSize: 10,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCenter: {
    width: "100%",
    alignItems: "center",
  },
  modalCard: {
    width: 280,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    width: "100%",
    height: 48,
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
