import { Platform } from "react-native";

// Heritage Geometry Design System
// Inspired by traditional Mien textile patterns and cross-stitch embroidery

const primaryColor = "#C4942A";      // Warm golden amber
const primaryLight = "#D4A84B";      // Lighter gold accent
const secondaryColor = "#5B8C8A";    // Teal/sage green
const cream = "#FDF8EF";             // Warm cream background
const charcoal = "#1F2937";          // Deep charcoal for text

export const Colors = {
  light: {
    text: charcoal,
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    primaryLight: primaryLight,
    secondary: secondaryColor,
    backgroundRoot: cream,
    backgroundDefault: "#F9FAFB",
    backgroundSecondary: "#F3F4F6",
    backgroundTertiary: "#E5E7EB",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    error: "#EF4444",
    success: "#10B981",
    // Platform colors
    youtube: "#FF0000",
    tiktok: "#000000",
    instagram: "#E1306C",
    facebook: "#1877F2",
    twitter: "#000000",
    google: "#4285F4",
    // Heritage Geometry palette
    heritage: {
      red: "#DC2626",
      redLight: "#EF4444",
      cream: cream,
      gold: primaryColor,
      goldDark: "#A67B1E",
      teal: secondaryColor,
      tealLight: "#7BA39F",
      charcoal: charcoal,
      silver: "#9CA3AF",
      warmOrange: "#E8A838",
      amber: "#D4942A",
    },
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#F87171",
    link: "#F87171",
    primary: "#F87171",
    primaryLight: "#FCA5A5",
    secondary: secondaryColor,
    backgroundRoot: "#0F172A",
    backgroundDefault: "#1E293B",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    surface: "#1E293B",
    surfaceElevated: "#334155",
    border: "#334155",
    borderLight: "#475569",
    error: "#F87171",
    success: "#34D399",
    youtube: "#FF0000",
    tiktok: "#FFFFFF",
    instagram: "#E1306C",
    facebook: "#1877F2",
    twitter: "#FFFFFF",
    google: "#4285F4",
    heritage: {
      red: "#F87171",
      redLight: "#FCA5A5",
      cream: "#1E293B",
      gold: "#D4A84B",
      goldDark: "#C4942A",
      teal: "#7BA39F",
      tealLight: "#9DBFBB",
      charcoal: "#F9FAFB",
      silver: "#9CA3AF",
      warmOrange: "#F0B84D",
      amber: "#E8A838",
    },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 56,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
