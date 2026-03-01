import { useState } from "react";
import type { JSX } from "react";
import type { MessageResult } from "../types";
import { useTheme } from "../theme";
import { StatusBadge } from "./StatusBadge";

interface FinalResponseBannerProps {
  result: MessageResult;
}

export function FinalResponseBanner({
  result,
}: FinalResponseBannerProps): JSX.Element | null {
  const [open, setOpen] = useState<boolean>(false);
  const theme = useTheme();
  if (!result.response) return null;

  return (
    <div
      style={{
        marginBottom: 16,
        border: `1px solid ${theme.deepBorder}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          cursor: "pointer",
          background: theme.cardBg,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: theme.textMuted,
            letterSpacing: "0.1em",
            whiteSpace: "nowrap",
          }}
        >
          FINAL RESPONSE
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: theme.textTertiary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {result.response}
        </span>
        <StatusBadge status="COMPLETED" />
        <span style={{ color: theme.textMuted, fontSize: 10 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div
          style={{
            padding: "14px 16px",
            background: theme.deepBg,
            borderTop: `1px solid ${theme.cardBorder}`,
            fontSize: 13,
            color: theme.textPrimary,
            lineHeight: 1.8,
          }}
        >
          {result.response}
        </div>
      )}
    </div>
  );
}
