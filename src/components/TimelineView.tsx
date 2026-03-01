import type { JSX } from "react";
import type { TaskState } from "../types";
import { useTheme, getStatusConfig } from "../theme";
import { ts, elapsed } from "../utils/helpers";

interface TimelineViewProps {
  tasks: Record<string, TaskState>;
  nowSeconds: number;
}

export function TimelineView({
  tasks,
  nowSeconds,
}: TimelineViewProps): JSX.Element {
  const taskList = Object.values(tasks);
  const theme = useTheme();
  const STATUS_CONFIG = getStatusConfig(theme.mode);

  if (!taskList.length) {
    return (
      <div style={{ color: theme.textMuted, padding: 30, textAlign: "center" }}>
        No tasks.
      </div>
    );
  }

  const minT = Math.min(...taskList.map((t) => t.created_at));
  const maxT = Math.max(...taskList.map((t) => t.completed_at ?? nowSeconds));
  const span = Math.max(maxT - minT, 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color: theme.textMuted,
          marginBottom: 14,
          letterSpacing: "0.1em",
        }}
      >
        TIMELINE · {ts(minT)} → {ts(maxT)} · {span}s total
      </div>

      {/* Axis labels */}
      <div
        style={{
          marginLeft: 110,
          position: "relative",
          height: 16,
          marginBottom: 4,
        }}
      >
        {ticks.map((p) => (
          <span
            key={p}
            style={{
              position: "absolute",
              left: `${p * 100}%`,
              fontSize: 9,
              color: theme.textMuted,
              transform: "translateX(-50%)",
            }}
          >
            +{Math.round(p * span)}s
          </span>
        ))}
      </div>

      {/* Axis line */}
      <div
        style={{
          marginLeft: 110,
          height: 1,
          background: theme.deepBorder,
          marginBottom: 12,
          position: "relative",
        }}
      >
        {ticks.map((p) => (
          <div
            key={p}
            style={{
              position: "absolute",
              left: `${p * 100}%`,
              width: 1,
              height: 5,
              background: theme.textMuted,
              top: -2,
            }}
          />
        ))}
      </div>

      {/* Task rows */}
      {taskList.map((task, i) => {
        const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["CREATED"];
        const startT = task.started_at ?? task.created_at;
        const endT = task.completed_at ?? nowSeconds;
        const left = ((startT - minT) / span) * 100;
        const width = Math.max(((endT - startT) / span) * 100, 0.8);
        const steps = Object.values(task.steps ?? {});

        return (
          <div
            key={task.task_id}
            style={{ display: "flex", alignItems: "center", marginBottom: 10 }}
          >
            {/* Label */}
            <div
              style={{
                width: 110,
                flexShrink: 0,
                paddingRight: 10,
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: theme.accentLight,
                  fontFamily: "monospace",
                }}
              >
                {task.assigned_to}
              </div>
              <div style={{ fontSize: 9, color: theme.textMuted }}>
                T{i + 1}
              </div>
            </div>

            {/* Track */}
            <div
              style={{
                flex: 1,
                height: 28,
                background: theme.trackBg,
                borderRadius: 4,
                position: "relative",
                overflow: "visible",
              }}
            >
              {/* Task bar */}
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: 24,
                  borderRadius: 4,
                  background: cfg.bg,
                  border: `1px solid ${cfg.color}50`,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 8,
                  fontSize: 10,
                  color: cfg.color,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  boxShadow:
                    task.status === "IN_PROGRESS"
                      ? `0 0 10px ${cfg.dot}`
                      : "none",
                  minWidth: 4,
                }}
              >
                {task.content.slice(0, 35)}
                {task.content.length > 35 ? "…" : ""}
              </div>

              {/* Step markers */}
              {steps.map((step) => {
                if (!step.started_at) return null;
                const sl = ((step.started_at - minT) / span) * 100;
                const stepCfg =
                  STATUS_CONFIG[step.status] ?? STATUS_CONFIG["completed"];
                return (
                  <div
                    key={step.step_id}
                    title={step.tool_id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `${sl}%`,
                      width: 3,
                      height: 28,
                      borderRadius: 2,
                      background: stepCfg.dot,
                      opacity: 0.9,
                      zIndex: 2,
                    }}
                  />
                );
              })}
            </div>

            {/* Duration */}
            <div
              style={{
                width: 46,
                paddingLeft: 8,
                fontSize: 10,
                color: theme.textTertiary,
                flexShrink: 0,
              }}
            >
              {elapsed(task.started_at, task.completed_at)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
