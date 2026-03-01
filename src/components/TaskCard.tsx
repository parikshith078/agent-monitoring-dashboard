import { useState } from "react";
import type { JSX } from "react";
import type { TaskState } from "../types";
import { useTheme, getStatusConfig } from "../theme";
import { ts, elapsed, tryParseJSON } from "../utils/helpers";
import { StatusBadge } from "./StatusBadge";
import { StepRow } from "./StepRow";

interface TaskCardProps {
  task: TaskState;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [resultOpen, setResultOpen] = useState<boolean>(false);
  const theme = useTheme();
  const STATUS_CONFIG = getStatusConfig(theme.mode);

  const steps = Object.values(task.steps ?? {});
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const stepPct = steps.length ? (completedSteps / steps.length) * 100 : 0;
  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["CREATED"];
  const parsedContent = tryParseJSON(task.content);
  const hasResult = task.result && Object.keys(task.result).length > 0;

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${cfg.color}20`,
        borderRadius: 10,
        overflow: "hidden",
        animation: "fadeSlideIn 0.4s ease both",
        animationDelay: `${index * 80}ms`,
        boxShadow:
          task.status === "IN_PROGRESS" ? `0 0 20px ${cfg.dot}10` : "none",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "13px 14px",
          cursor: "pointer",
        }}
      >
        {/* Index badge */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: cfg.bg,
            border: `1px solid ${cfg.color}40`,
            fontSize: 11,
            fontWeight: 700,
            color: cfg.color,
          }}
        >
          T{index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Content preview */}
          <div
            style={{
              fontSize: 13,
              color: theme.textPrimary,
              marginBottom: 5,
              lineHeight: 1.4,
            }}
          >
            {parsedContent ? (
              <span
                style={{
                  color: theme.textTertiary,
                  fontStyle: "italic",
                  fontSize: 12,
                }}
              >
                [JSON payload — expand to view]
              </span>
            ) : (
              task.content
            )}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 10, color: theme.textMuted }}>
              <span style={{ color: theme.textTertiary }}>
                {task.assigned_by}
              </span>
              <span style={{ color: theme.textDimmest, margin: "0 5px" }}>
                →
              </span>
              <span style={{ color: theme.accentLight }}>
                {task.assigned_to}
              </span>
            </span>
            <span style={{ color: theme.separator }}>|</span>
            <span
              style={{
                fontSize: 9,
                color: theme.textMuted,
                fontFamily: "monospace",
              }}
            >
              {task.task_id}
            </span>
            <span style={{ color: theme.separator }}>|</span>
            <span style={{ fontSize: 10, color: theme.textMuted }}>
              {ts(task.started_at)} → {ts(task.completed_at)}
              <span style={{ color: theme.textTertiary, marginLeft: 6 }}>
                ({elapsed(task.started_at, task.completed_at)})
              </span>
            </span>
            {steps.length > 0 && (
              <>
                <span style={{ color: theme.separator }}>|</span>
                <span style={{ fontSize: 10, color: theme.textTertiary }}>
                  {completedSteps}/{steps.length} steps
                </span>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <StatusBadge status={task.status} />
          <span style={{ color: theme.textMuted, fontSize: 10 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Step progress micro-bar */}
      {steps.length > 0 && (
        <div style={{ padding: "0 14px 1px" }}>
          <div
            style={{ height: 2, background: theme.trackBg, borderRadius: 1 }}
          >
            <div
              style={{
                height: "100%",
                width: `${stepPct}%`,
                background: task.status === "FAILED" ? "#ef4444" : "#10b981",
                transition: "width 0.6s ease",
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      )}

      {/* Body */}
      {expanded && (
        <div
          style={{
            padding: "10px 10px 12px",
            borderTop: `1px solid ${theme.cardBorder}`,
          }}
        >
          {/* JSON content rendered */}
          {typeof parsedContent?.response === "string" && (
            <div
              style={{
                margin: "0 6px 10px",
                padding: "10px 12px",
                background: theme.deepBg,
                border: `1px solid ${theme.deepBorder}`,
                borderRadius: 6,
                fontSize: 12,
                color: theme.textPrimary,
                lineHeight: 1.6,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: theme.textTertiary,
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                AGENT RESPONSE PAYLOAD
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {parsedContent.response as string}
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.length === 0 ? (
            <div
              style={{
                fontSize: 11,
                color: theme.textDimmest,
                padding: "6px 16px",
                fontStyle: "italic",
              }}
            >
              No steps recorded for this task.
            </div>
          ) : (
            steps.map((step, i) => (
              <StepRow key={step.step_id} step={step} index={i} />
            ))
          )}

          {/* Task result */}
          {hasResult && (
            <div style={{ margin: "10px 6px 0" }}>
              <div
                onClick={() => setResultOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  cursor: "pointer",
                  borderRadius: 6,
                  background: theme.successBg,
                  border: `1px solid ${theme.successBorder}`,
                  fontSize: 11,
                  color: "#10b981",
                }}
              >
                <span style={{ fontSize: 8 }}>●</span>
                <span
                  style={{
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    fontSize: 9,
                  }}
                >
                  TASK RESULT
                </span>
                {task.result.response && (
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: theme.textTertiary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {task.result.response_type} ·{" "}
                    {task.result.response.slice(0, 60)}…
                  </span>
                )}
                {task.result.source_agent_name && (
                  <span style={{ fontSize: 10, color: theme.textMuted }}>
                    {task.result.source_agent_name} →{" "}
                    {task.result.target_agent_name}
                  </span>
                )}
                <span style={{ color: theme.textMuted, fontSize: 10 }}>
                  {resultOpen ? "▲" : "▼"}
                </span>
              </div>

              {resultOpen && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: theme.deepBg,
                    borderRadius: "0 0 6px 6px",
                    border: `1px solid ${theme.successBorder}`,
                    borderTop: "none",
                  }}
                >
                  {task.result.response ? (
                    <>
                      <div
                        style={{
                          fontSize: 9,
                          color: theme.textTertiary,
                          letterSpacing: "0.1em",
                          marginBottom: 6,
                        }}
                      >
                        {task.result.response_type?.toUpperCase()}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: theme.textPrimary,
                          lineHeight: 1.7,
                        }}
                      >
                        {task.result.response}
                      </p>
                    </>
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
                      {JSON.stringify(task.result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
