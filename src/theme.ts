import { createContext, useContext } from "react";

export type ThemeMode = "dark" | "light";

export interface ThemeTokens {
  mode: ThemeMode;
  pageBg: string;
  headerBg: string;
  headerBorder: string;
  cardBg: string;
  cardBorder: string;
  deepBg: string;
  deepBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textDimmest: string;
  textBright: string;
  accent: string;
  accentLight: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  separator: string;
  trackBg: string;
  hoverBg: string;
  selectBg: string;
  selectBorder: string;
  selectText: string;
  toolBg: string;
  toolText: string;
  toolBorder: string;
  scrollTrack: string;
  scrollThumb: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  infoBg: string;
  successBg: string;
  successBorder: string;
}

const darkTheme: ThemeTokens = {
  mode: "dark",
  pageBg: "#030712",
  headerBg: "#04080f",
  headerBorder: "#0d1420",
  cardBg: "#080e1a",
  cardBorder: "#0d1420",
  deepBg: "#04080f",
  deepBorder: "#1a2535",
  textPrimary: "#e5e7eb",
  textSecondary: "#9ca3af",
  textTertiary: "#4b5563",
  textMuted: "#374151",
  textDimmest: "#1f2937",
  textBright: "#f9fafb",
  accent: "#3b82f6",
  accentLight: "#60a5fa",
  accentBg: "#0d2340",
  accentBorder: "#3b82f6",
  accentText: "#93c5fd",
  separator: "#1a2535",
  trackBg: "#0d1420",
  hoverBg: "#0a0e14",
  selectBg: "#080e1a",
  selectBorder: "#1a2535",
  selectText: "#e5e7eb",
  toolBg: "#0d1e35",
  toolText: "#60a5fa",
  toolBorder: "#1d4ed820",
  scrollTrack: "#080e1a",
  scrollThumb: "#1f2937",
  errorBg: "#1c0505",
  errorBorder: "#ef444430",
  errorText: "#fca5a5",
  infoBg: "#080e1a",
  successBg: "#051a11",
  successBorder: "#10b98125",
};

const lightTheme: ThemeTokens = {
  mode: "light",
  pageBg: "#f8fafc",
  headerBg: "#ffffff",
  headerBorder: "#e2e8f0",
  cardBg: "#ffffff",
  cardBorder: "#e2e8f0",
  deepBg: "#f1f5f9",
  deepBorder: "#cbd5e1",
  textPrimary: "#1e293b",
  textSecondary: "#475569",
  textTertiary: "#64748b",
  textMuted: "#94a3b8",
  textDimmest: "#cbd5e1",
  textBright: "#0f172a",
  accent: "#2563eb",
  accentLight: "#3b82f6",
  accentBg: "#dbeafe",
  accentBorder: "#93c5fd",
  accentText: "#1d4ed8",
  separator: "#e2e8f0",
  trackBg: "#e2e8f0",
  hoverBg: "#f1f5f9",
  selectBg: "#ffffff",
  selectBorder: "#cbd5e1",
  selectText: "#1e293b",
  toolBg: "#dbeafe",
  toolText: "#1d4ed8",
  toolBorder: "#93c5fd40",
  scrollTrack: "#f1f5f9",
  scrollThumb: "#cbd5e1",
  errorBg: "#fef2f2",
  errorBorder: "#fca5a5",
  errorText: "#dc2626",
  infoBg: "#f0f9ff",
  successBg: "#f0fdf4",
  successBorder: "#86efac50",
};

export function getTheme(mode: ThemeMode): ThemeTokens {
  return mode === "dark" ? darkTheme : lightTheme;
}

export interface StatusConfig {
  color: string;
  bg: string;
  label: string;
  dot: string;
}

export function getStatusConfig(mode: ThemeMode): Record<string, StatusConfig> {
  const isDark = mode === "dark";
  return {
    CREATED: {
      color: "#6b7280",
      bg: isDark ? "#111827" : "#f3f4f6",
      label: "Queued",
      dot: "#6b7280",
    },
    IN_PROGRESS: {
      color: isDark ? "#f59e0b" : "#d97706",
      bg: isDark ? "#1c1407" : "#fffbeb",
      label: "Running",
      dot: isDark ? "#f59e0b" : "#d97706",
    },
    COMPLETED: {
      color: "#10b981",
      bg: isDark ? "#051a11" : "#ecfdf5",
      label: "Done",
      dot: "#10b981",
    },
    FAILED: {
      color: "#ef4444",
      bg: isDark ? "#1c0505" : "#fef2f2",
      label: "Failed",
      dot: "#ef4444",
    },
    PICKED: {
      color: "#8b5cf6",
      bg: isDark ? "#130d1f" : "#f5f3ff",
      label: "Picked",
      dot: "#8b5cf6",
    },
    // Step statuses (lowercase from API)
    in_progress: {
      color: isDark ? "#f59e0b" : "#d97706",
      bg: isDark ? "#1c1407" : "#fffbeb",
      label: "Running",
      dot: isDark ? "#f59e0b" : "#d97706",
    },
    completed: {
      color: "#10b981",
      bg: isDark ? "#051a11" : "#ecfdf5",
      label: "Done",
      dot: "#10b981",
    },
    failed: {
      color: "#ef4444",
      bg: isDark ? "#1c0505" : "#fef2f2",
      label: "Failed",
      dot: "#ef4444",
    },
  };
}

export const ThemeContext = createContext<ThemeTokens>(darkTheme);

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
