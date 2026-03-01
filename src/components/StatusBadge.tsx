import type { JSX } from "react";
import { useTheme, getStatusConfig } from "../theme";
import { isRunning } from "../utils/helpers";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  size = "sm",
}: StatusBadgeProps): JSX.Element {
  const theme = useTheme();
  const STATUS_CONFIG = getStatusConfig(theme.mode);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["CREATED"];
  const running = isRunning(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        borderRadius: 999,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}35`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
          boxShadow: running ? `0 0 6px ${cfg.dot}` : "none",
          animation: running ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
      />
      {cfg.label}
    </span>
  );
}
