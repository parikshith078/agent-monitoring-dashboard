import { useState } from "react";
import type { CSSProperties, JSX } from "react";
import type { StepState } from "../types";
import { useTheme, getStatusConfig } from "../theme";
import { ts, elapsed } from "../utils/helpers";
import { StatusBadge } from "./StatusBadge";
import { ChunksViewer } from "./ChunksViewer";

interface StepRowProps {
  step: StepState;
  index: number;
}

export function StepRow({ step, index }: StepRowProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [tab, setTab] = useState<"args" | "result">("args");
  const theme = useTheme();
  const STATUS_CONFIG = getStatusConfig(theme.mode);

  const chunks = step.tool_result?.structuredContent?.retrieved_content;
  const hasResult = step.tool_result && !step.tool_result.isError;
  const cfg = STATUS_CONFIG[step.status] ?? STATUS_CONFIG["completed"];

  const tabBtnStyle = (id: "args" | "result"): CSSProperties => ({
    padding: "3px 10px",
    fontSize: 10,
    borderRadius: 4,
    cursor: "pointer",
    background: tab === id ? theme.accentBg : "transparent",
    border: `1px solid ${tab === id ? theme.accentBorder : theme.textDimmest}`,
    color: tab === id ? theme.accentText : theme.textTertiary,
    transition: "all 0.15s",
  });

  return (
    <div
      style={{
        borderLeft: `2px solid ${cfg.dot}`,
        marginLeft: 16,
        paddingLeft: 12,
        marginBottom: 6,
        animation: "fadeSlideIn 0.3s ease both",
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Step header row */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 8px",
          borderRadius: 6,
          cursor: "pointer",
          background: expanded ? theme.hoverBg : "transparent",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!expanded)
            (e.currentTarget as HTMLDivElement).style.background =
              theme.hoverBg;
        }}
        onMouseLeave={(e) => {
          if (!expanded)
            (e.currentTarget as HTMLDivElement).style.background =
              "transparent";
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: theme.textMuted,
            fontFamily: "monospace",
            minWidth: 18,
          }}
        >
          #{index + 1}
        </span>
        <span
          style={{
            padding: "1px 8px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            background: theme.toolBg,
            color: theme.toolText,
            border: `1px solid ${theme.toolBorder}`,
            letterSpacing: "0.04em",
          }}
        >
          {step.tool_id}
        </span>
        <span style={{ fontSize: 10, color: theme.textTertiary }}>
          {step.agent_id}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: theme.textMuted }}>
          {ts(step.started_at)} → {ts(step.completed_at)}
        </span>
        <span
          style={{ fontSize: 10, color: theme.textTertiary, marginLeft: 6 }}
        >
          ({elapsed(step.started_at, step.completed_at)})
        </span>
        <StatusBadge status={step.status} />
        <span style={{ color: theme.textMuted, fontSize: 10 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            margin: "4px 8px 10px",
            padding: 12,
            borderRadius: 8,
            background: theme.deepBg,
            border: `1px solid ${theme.deepBorder}`,
          }}
        >
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTab("args");
              }}
              style={tabBtnStyle("args")}
            >
              Arguments
            </button>
            {hasResult && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTab("result");
                }}
                style={tabBtnStyle("result")}
              >
                {chunks ? `Retrieved Chunks (${chunks.length})` : "Result"}
              </button>
            )}
          </div>

          {tab === "args" && (
            <pre
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: "monospace",
                color: theme.textSecondary,
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(step.tool_arguments, null, 2)}
            </pre>
          )}

          {tab === "result" &&
            hasResult &&
            (chunks ? (
              <ChunksViewer chunks={chunks} />
            ) : (
              <pre
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#10b981",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                }}
              >
                {JSON.stringify(step.tool_result, null, 2)}
              </pre>
            ))}
        </div>
      )}
    </div>
  );
}
