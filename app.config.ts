import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Mien Kingdom",
  slug: "mien-kingdom",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/main-app-icon.png",
  scheme: "mienkingdom",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mienkingdom.app",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#DC2626",
      foregroundImage: "./assets/main-app-icon.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.mienkingdom.app",
  },
  web: {
    output: "single",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#DC2626",
        dark: {
          backgroundColor: "#111827",
        },
      },
    ],
    [
      "expo-notifications",
      {
        color: "#DC2626",
        defaultChannel: "default",
      },
    ],
    "expo-web-browser",
    "expo-secure-store",
  ],
  experiments: {
    reactCompiler: true,
  },
  extra: {
    expoPublicDomain: process.env.EXPO_PUBLIC_DOMAIN ?? "",
  },
});
