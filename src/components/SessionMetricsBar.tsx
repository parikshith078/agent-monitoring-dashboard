import type { JSX } from "react";
import type { ExecutionState, SessionMetrics } from "../types";
import { useTheme } from "../theme";

interface SessionMetricsProps {
  metrics: SessionMetrics;
  chat: ExecutionState;
}

export function SessionMetricsBar({
  metrics,
  chat,
}: SessionMetricsProps): JSX.Element {
  const theme = useTheme();
  const hostId = Object.values(chat.messages)[0]?.master_agent_host_id ?? "—";

  const items: Array<{ label: string; value: string | number; color: string }> =
    [
      {
        label: "Total Messages",
        value: metrics.total_messages,
        color: theme.textPrimary,
      },
      {
        label: "Total Tasks",
        value: metrics.total_tasks,
        color: theme.accentLight,
      },
      { label: "Tools Used", value: metrics.tools_used, color: "#a78bfa" },
      { label: "Chat Status", value: chat.status, color: "#10b981" },
      { label: "Master Host", value: hostId, color: "#f59e0b" },
    ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 8,
        marginBottom: 20,
      }}
    >
      {items.map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 8,
            padding: "10px 12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color,
              fontFamily: "monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </div>
          <div
            style={{
              fontSize: 9,
              color: theme.textMuted,
              letterSpacing: "0.07em",
              marginTop: 3,
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
