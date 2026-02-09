import React from "react";
import { View, StyleSheet, Pressable, Modal, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface YouTubePlayerModalProps {
  visible: boolean;
  youtubeId: string | null;
  onClose: () => void;
}

function getPlayerHtml(youtubeId: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    .wrap { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <iframe
      src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
      allow="autoplay; fullscreen; encrypted-media"
      allowfullscreen
      frameborder="0"
    ></iframe>
  </div>
</body>
</html>`;
}

export function YouTubePlayerModal({ visible, youtubeId, onClose }: YouTubePlayerModalProps) {
  const insets = useSafeAreaInsets();

  if (!youtubeId) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      supportedOrientations={["portrait", "landscape"]}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button area */}
        <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.7 : 1 }]}
            onPress={onClose}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Video player */}
        <View style={styles.videoContainer}>
          {Platform.OS === "web" ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              style={{ width: "100%", height: "100%", border: "none" } as any}
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />
          ) : (
            <WebView
              source={{ html: getPlayerHtml(youtubeId) }}
              style={styles.webview}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              mixedContentMode="compatibility"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
