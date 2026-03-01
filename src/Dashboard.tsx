import { useState, useEffect } from "react";
import type { CSSProperties, JSX } from "react";
import type {
  ExecutionState,
  MessageState,
  TaskState,
  StepState,
  MessageResult,
  SessionMetrics,
  StatusConfig,
  RetrievedChunk,
} from "./types";
import { redisApi, type AvailableChat } from "./external/redis-api";
import { runTryoutSimulation } from "./tryout/tryout-simulator";

const POLL_INTERVALS = (() => {
  const raw = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_POLL_INTERVALS ?? "2000,5000";
  const parsed = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length ? parsed : [5000];
})();

const STEP_DELAY_FAST = Number((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SIM_STEP_DELAY_FAST ?? 3000);
const STEP_DELAY_SLOW = Number((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SIM_STEP_DELAY_SLOW ?? 6000);

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const BASE_STATE: Record<string, ExecutionState> = {
  "chat_test_7": {
    "chat_id": "chat_test_7",
    "tenant_id": "01ka8bgyan4mn3js75bh7z9xr1",
    "created_at": 1772169449,
    "status": "ACTIVE",
    "session_metrics": { "total_messages": 7, "total_tasks": 10, "tools_used": 8 },
    "last_activity_at": 1772197410,
    "current_message_id": "msg_test_7",
    "messages": {
      "msg_test_7": {
        "message_id": "msg_test_7",
        "master_agent_id": "master_agent",
        "master_agent_host_id": "192.168.1.49",
        "stream_entry_id": "1772197368592-0",
        "filters": { "hub_access": ["01kcgmvnc7g6r7kdad2e7wrwbn"] },
        "role": "USER",
        "status": "COMPLETED",
        "content": "Give the summary for thor and stolen hammer",
        "created_at": 1772197366,
        "updated_at": 1772197410,
        "parent_message_id": null,
        "result": {
          "task_id": "01KJFK4PFHKXXZF597PV96HRJY",
          "response": "I'm sorry, but I couldn't retrieve the summary of Thor and the stolen hammer. Could you please clarify or provide more details?",
          "response_type": "user_response",
        },
        "tasks": {
          "01KJFK3YF7KZ4AZ1S1TT3KZR2T": {
            "task_id": "01KJFK3YF7KZ4AZ1S1TT3KZR2T",
            "task_type": "AGENT",
            "stream_id": "1772197378699-0",
            "message_id": "msg_test_7",
            "assigned_by": "master_agent",
            "master_agent_host_id": "192.168.1.49",
            "assigned_to": "rag_agent",
            "content": "Fetch summary of Thor and stolen hammer from knowledge base",
            "agent_host_id": "192.168.1.49",
            "parent_task_id": null,
            "status": "COMPLETED",
            "created_at": 1772197366,
            "started_at": 1772197378,
            "completed_at": 1772197404,
            "result": {
              "source_agent_name": "rag_agent",
              "source_agent_host_id": "192.168.1.49",
              "target_agent_task": `{"response": "### Thor and the Stolen Hammer Summary\n\n- **Thor's hammer Mjölnir** is stolen by **Thrym**..."}`,
              "target_agent_name": "master_agent",
              "prev_task_id": "01KJFK3YF7KZ4AZ1S1TT3KZR2T",
              "chat_id": "chat_test_7",
              "message_id": "msg_test_7",
            },
            "steps": {
              "01KJFK46DRNJQ2FY9P8ZR58M67": {
                "step_id": "01KJFK46DRNJQ2FY9P8ZR58M67",
                "task_id": "01KJFK3YF7KZ4AZ1S1TT3KZR2T",
                "agent_id": "rag_agent",
                "tool_id": "retrieval",
                "status": "completed",
                "tool_arguments": { "query": "Thor and stolen hammer summary", "query_type": "SUMMARY" },
                "tool_result": {
                  "isError": false,
                  "structuredContent": {
                    "chunk_count": 1,
                    "success": true,
                    "retrieved_content": [
                      {
                        "chunk_index": 1,
                        "filename": "Thor and the Stolen Hammer_20251215091827.docx",
                        "text": `In the Norse myth "Thor and the Stolen Hammer," Thor discovers his powerful hammer, Mjölnir, has been stolen, posing a significant threat to Asgard's safety. The hammer, essential for protecting Asgard from enemies like the frost giants, is taken by Thrym, the king of the giants, who demands the goddess Freyja as his bride in exchange for its return. Loki, known for his cunning, offers to retrieve the hammer and flies to Jotunheim using Freyja's magical cloak. Upon learning Thrym's condition, the gods devise a plan to disguise Thor as Freyja to reclaim Mjölnir.`,
                      },
                    ],
                  },
                },
                "started_at": 1772197386,
                "completed_at": 1772197389,
              },
            },
          },
          "01KJFK4PFHKXXZF597PV96HRJY": {
            "task_id": "01KJFK4PFHKXXZF597PV96HRJY",
            "task_type": "AGENT",
            "stream_id": "1772197403272-0",
            "message_id": "msg_test_7",
            "assigned_by": "rag_agent",
            "master_agent_host_id": "192.168.1.49",
            "assigned_to": "master_agent",
            "content": `{"response": "### Thor and the Stolen Hammer Summary\n\n- **Thor's hammer Mjölnir** is stolen by **Thrym**..."}`,
            "agent_host_id": "192.168.1.49",
            "parent_task_id": null,
            "status": "COMPLETED",
            "created_at": 1772197366,
            "started_at": 1772197403,
            "completed_at": 1772197411,
            "result": {
              "task_id": "01KJFK4PFHKXXZF597PV96HRJY",
              "chat_id": "chat_test_7",
              "message_id": "msg_test_7",
              "response": "I'm sorry, but I couldn't retrieve the summary of Thor and the stolen hammer. Could you please clarify or provide more details?",
              "response_type": "user_response",
            },
            "steps": {},
          },
        },
      },
    },
  },
};

const INITIAL_TIMESTAMP_MS = Date.now();

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, StatusConfig> = {
  CREATED:     { color: "#6b7280", bg: "#111827", label: "Queued",  dot: "#6b7280" },
  IN_PROGRESS: { color: "#f59e0b", bg: "#1c1407", label: "Running", dot: "#f59e0b" },
  COMPLETED:   { color: "#10b981", bg: "#051a11", label: "Done",    dot: "#10b981" },
  FAILED:      { color: "#ef4444", bg: "#1c0505", label: "Failed",  dot: "#ef4444" },
  PICKED:      { color: "#8b5cf6", bg: "#130d1f", label: "Picked",  dot: "#8b5cf6" },
  // Step statuses (lowercase from API)
  in_progress: { color: "#f59e0b", bg: "#1c1407", label: "Running", dot: "#f59e0b" },
  completed:   { color: "#10b981", bg: "#051a11", label: "Done",    dot: "#10b981" },
  failed:      { color: "#ef4444", bg: "#1c0505", label: "Failed",  dot: "#ef4444" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsed(start: number | null, end: number | null): string {
  if (!start) return "—";
  const diff = (end ?? Math.floor(Date.now() / 1000)) - start;
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m ${diff % 60}s`;
}

function ts(unix: number | null): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function tryParseJSON(str: string): Record<string, unknown> | null {
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isRunning(status: string): boolean {
  return status === "IN_PROGRESS" || status === "in_progress";
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

function StatusBadge({ status, size = "sm" }: StatusBadgeProps): JSX.Element {
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

// ─── ChunksViewer ─────────────────────────────────────────────────────────────

interface ChunksViewerProps {
  chunks: RetrievedChunk[];
}

function ChunksViewer({ chunks }: ChunksViewerProps): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {chunks.map((chunk) => (
        <div
          key={chunk.chunk_index}
          style={{
            background: "#04080f",
            border: "1px solid #1a2535",
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
            <span style={{ fontSize: 9, color: "#3b82f6", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              CHUNK {chunk.chunk_index}
            </span>
            <span
              style={{
                fontSize: 9,
                color: "#4b5563",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📄 {chunk.filename}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", lineHeight: 1.7 }}>
            {chunk.text}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── StepRow ──────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: StepState;
  index: number;
}

function StepRow({ step, index }: StepRowProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [tab, setTab] = useState<"args" | "result">("args");

  const chunks = step.tool_result?.structuredContent?.retrieved_content;
  const hasResult = step.tool_result && !step.tool_result.isError;
  const cfg = STATUS_CONFIG[step.status] ?? STATUS_CONFIG["completed"];

  const tabBtnStyle = (id: "args" | "result"): CSSProperties => ({
    padding: "3px 10px",
    fontSize: 10,
    borderRadius: 4,
    cursor: "pointer",
    background: tab === id ? "#0d2340" : "transparent",
    border: `1px solid ${tab === id ? "#3b82f6" : "#1f2937"}`,
    color: tab === id ? "#93c5fd" : "#4b5563",
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
          background: expanded ? "#0a0e14" : "transparent",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!expanded) (e.currentTarget as HTMLDivElement).style.background = "#0a0e14";
        }}
        onMouseLeave={(e) => {
          if (!expanded) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        <span style={{ fontSize: 10, color: "#374151", fontFamily: "monospace", minWidth: 18 }}>
          #{index + 1}
        </span>
        <span
          style={{
            padding: "1px 8px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            background: "#0d1e35",
            color: "#60a5fa",
            border: "1px solid #1d4ed820",
            letterSpacing: "0.04em",
          }}
        >
          {step.tool_id}
        </span>
        <span style={{ fontSize: 10, color: "#4b5563" }}>{step.agent_id}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#374151" }}>
          {ts(step.started_at)} → {ts(step.completed_at)}
        </span>
        <span style={{ fontSize: 10, color: "#4b5563", marginLeft: 6 }}>
          ({elapsed(step.started_at, step.completed_at)})
        </span>
        <StatusBadge status={step.status} />
        <span style={{ color: "#374151", fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            margin: "4px 8px 10px",
            padding: 12,
            borderRadius: 8,
            background: "#04080f",
            border: "1px solid #111827",
          }}
        >
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            <button onClick={(e) => { e.stopPropagation(); setTab("args"); }} style={tabBtnStyle("args")}>
              Arguments
            </button>
            {hasResult && (
              <button onClick={(e) => { e.stopPropagation(); setTab("result"); }} style={tabBtnStyle("result")}>
                {chunks ? `Retrieved Chunks (${chunks.length})` : "Result"}
              </button>
            )}
          </div>

          {tab === "args" && (
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "#9ca3af", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(step.tool_arguments, null, 2)}
            </pre>
          )}

          {tab === "result" && hasResult && (
            chunks ? (
              <ChunksViewer chunks={chunks} />
            ) : (
              <pre style={{ margin: 0, fontSize: 11, color: "#10b981", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(step.tool_result, null, 2)}
              </pre>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: TaskState;
  index: number;
}

function TaskCard({ task, index }: TaskCardProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [resultOpen, setResultOpen] = useState<boolean>(false);

  const steps = Object.values(task.steps ?? {});
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const stepPct = steps.length ? (completedSteps / steps.length) * 100 : 0;
  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["CREATED"];
  const parsedContent = tryParseJSON(task.content);
  const hasResult = task.result && Object.keys(task.result).length > 0;

  return (
    <div
      style={{
        background: "#080e1a",
        border: `1px solid ${cfg.color}20`,
        borderRadius: 10,
        overflow: "hidden",
        animation: "fadeSlideIn 0.4s ease both",
        animationDelay: `${index * 80}ms`,
        boxShadow: task.status === "IN_PROGRESS" ? `0 0 20px ${cfg.dot}10` : "none",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 14px", cursor: "pointer" }}
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
          <div style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 5, lineHeight: 1.4 }}>
            {parsedContent ? (
              <span style={{ color: "#6b7280", fontStyle: "italic", fontSize: 12 }}>
                [JSON payload — expand to view]
              </span>
            ) : (
              task.content
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#374151" }}>
              <span style={{ color: "#4b5563" }}>{task.assigned_by}</span>
              <span style={{ color: "#1f2937", margin: "0 5px" }}>→</span>
              <span style={{ color: "#60a5fa" }}>{task.assigned_to}</span>
            </span>
            <span style={{ color: "#1a2535" }}>|</span>
            <span style={{ fontSize: 9, color: "#374151", fontFamily: "monospace" }}>{task.task_id}</span>
            <span style={{ color: "#1a2535" }}>|</span>
            <span style={{ fontSize: 10, color: "#374151" }}>
              {ts(task.started_at)} → {ts(task.completed_at)}
              <span style={{ color: "#4b5563", marginLeft: 6 }}>({elapsed(task.started_at, task.completed_at)})</span>
            </span>
            {steps.length > 0 && (
              <>
                <span style={{ color: "#1a2535" }}>|</span>
                <span style={{ fontSize: 10, color: "#4b5563" }}>{completedSteps}/{steps.length} steps</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <StatusBadge status={task.status} />
          <span style={{ color: "#374151", fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Step progress micro-bar */}
      {steps.length > 0 && (
        <div style={{ padding: "0 14px 1px" }}>
          <div style={{ height: 2, background: "#0d1420", borderRadius: 1 }}>
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
        <div style={{ padding: "10px 10px 12px", borderTop: "1px solid #0d1420" }}>
          {/* JSON content rendered */}
          {typeof parsedContent?.response === "string" && (
            <div
              style={{
                margin: "0 6px 10px",
                padding: "10px 12px",
                background: "#04080f",
                border: "1px solid #1a2535",
                borderRadius: 6,
                fontSize: 12,
                color: "#d1d5db",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: 9, color: "#4b5563", letterSpacing: "0.1em", marginBottom: 6 }}>
                AGENT RESPONSE PAYLOAD
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{parsedContent.response as string}</div>
            </div>
          )}

          {/* Steps */}
          {steps.length === 0 ? (
            <div style={{ fontSize: 11, color: "#1f2937", padding: "6px 16px", fontStyle: "italic" }}>
              No steps recorded for this task.
            </div>
          ) : (
            steps.map((step, i) => <StepRow key={step.step_id} step={step} index={i} />)
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
                  background: "#051a11",
                  border: "1px solid #10b98125",
                  fontSize: 11,
                  color: "#10b981",
                }}
              >
                <span style={{ fontSize: 8 }}>●</span>
                <span style={{ fontWeight: 600, letterSpacing: "0.07em", fontSize: 9 }}>TASK RESULT</span>
                {task.result.response && (
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: "#4b5563",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {task.result.response_type} · {task.result.response.slice(0, 60)}…
                  </span>
                )}
                {task.result.source_agent_name && (
                  <span style={{ fontSize: 10, color: "#374151" }}>
                    {task.result.source_agent_name} → {task.result.target_agent_name}
                  </span>
                )}
                <span style={{ color: "#374151", fontSize: 10 }}>{resultOpen ? "▲" : "▼"}</span>
              </div>

              {resultOpen && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#030a06",
                    borderRadius: "0 0 6px 6px",
                    border: "1px solid #10b98118",
                    borderTop: "none",
                  }}
                >
                  {task.result.response ? (
                    <>
                      <div style={{ fontSize: 9, color: "#4b5563", letterSpacing: "0.1em", marginBottom: 6 }}>
                        {task.result.response_type?.toUpperCase()}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#d1d5db", lineHeight: 1.7 }}>
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

// ─── TimelineView ─────────────────────────────────────────────────────────────

interface TimelineViewProps {
  tasks: Record<string, TaskState>;
  nowSeconds: number;
}

function TimelineView({ tasks, nowSeconds }: TimelineViewProps): JSX.Element {
  const taskList = Object.values(tasks);

  if (!taskList.length) {
    return (
      <div style={{ color: "#374151", padding: 30, textAlign: "center" }}>No tasks.</div>
    );
  }

  const minT = Math.min(...taskList.map((t) => t.created_at));
  const maxT = Math.max(...taskList.map((t) => t.completed_at ?? nowSeconds));
  const span = Math.max(maxT - minT, 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div style={{ fontSize: 9, color: "#374151", marginBottom: 14, letterSpacing: "0.1em" }}>
        TIMELINE · {ts(minT)} → {ts(maxT)} · {span}s total
      </div>

      {/* Axis labels */}
      <div style={{ marginLeft: 110, position: "relative", height: 16, marginBottom: 4 }}>
        {ticks.map((p) => (
          <span
            key={p}
            style={{
              position: "absolute",
              left: `${p * 100}%`,
              fontSize: 9,
              color: "#374151",
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
          background: "#1a2535",
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
              background: "#374151",
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
          <div key={task.task_id} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            {/* Label */}
            <div style={{ width: 110, flexShrink: 0, paddingRight: 10, textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#60a5fa", fontFamily: "monospace" }}>
                {task.assigned_to}
              </div>
              <div style={{ fontSize: 9, color: "#374151" }}>T{i + 1}</div>
            </div>

            {/* Track */}
            <div
              style={{
                flex: 1,
                height: 28,
                background: "#0d1420",
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
                  boxShadow: task.status === "IN_PROGRESS" ? `0 0 10px ${cfg.dot}` : "none",
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
                const stepCfg = STATUS_CONFIG[step.status] ?? STATUS_CONFIG["completed"];
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
            <div style={{ width: 46, paddingLeft: 8, fontSize: 10, color: "#4b5563", flexShrink: 0 }}>
              {elapsed(task.started_at, task.completed_at)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SessionMetrics ───────────────────────────────────────────────────────────

interface SessionMetricsProps {
  metrics: SessionMetrics;
  chat: ExecutionState;
}

function SessionMetricsBar({ metrics, chat }: SessionMetricsProps): JSX.Element {
  const hostId = Object.values(chat.messages)[0]?.master_agent_host_id ?? "—";

  const items: Array<{ label: string; value: string | number; color: string }> = [
    { label: "Total Messages", value: metrics.total_messages, color: "#e5e7eb" },
    { label: "Total Tasks",    value: metrics.total_tasks,    color: "#60a5fa" },
    { label: "Tools Used",     value: metrics.tools_used,     color: "#a78bfa" },
    { label: "Chat Status",    value: chat.status,            color: "#10b981" },
    { label: "Master Host",    value: hostId,                 color: "#f59e0b" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
      {items.map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            background: "#080e1a",
            border: "1px solid #0d1420",
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
          <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.07em", marginTop: 3 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FinalResponseBanner ──────────────────────────────────────────────────────

interface FinalResponseBannerProps {
  result: MessageResult;
}

function FinalResponseBanner({ result }: FinalResponseBannerProps): JSX.Element | null {
  const [open, setOpen] = useState<boolean>(false);
  if (!result.response) return null;

  return (
    <div style={{ marginBottom: 16, border: "1px solid #1a2535", borderRadius: 8, overflow: "hidden" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          cursor: "pointer",
          background: "#080e1a",
        }}
      >
        <span style={{ fontSize: 9, color: "#374151", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
          FINAL RESPONSE
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: "#6b7280",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {result.response}
        </span>
        <StatusBadge status="COMPLETED" />
        <span style={{ color: "#374151", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div
          style={{
            padding: "14px 16px",
            background: "#04080f",
            borderTop: "1px solid #0d1420",
            fontSize: 13,
            color: "#d1d5db",
            lineHeight: 1.8,
          }}
        >
          {result.response}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type ViewMode = "tasks" | "timeline";

export default function Dashboard(): JSX.Element {
  const [selectedChatId, setSelectedChatId] = useState<string>("chat_test_7");
  const [selectedMsgId, setSelectedMsgId] = useState<string>("msg_test_7");
  const [view, setView] = useState<ViewMode>("tasks");
  const [lastPoll, setLastPoll] = useState<number>(INITIAL_TIMESTAMP_MS);
  const [pollAgo, setPollAgo] = useState<number>(0);
  const [availableChats, setAvailableChats] = useState<AvailableChat[]>([]);
  const [chatFetchState, setChatFetchState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });
  const [executionStateByChat, setExecutionStateByChat] = useState<Record<string, ExecutionState>>({});
  const [executionFetchState, setExecutionFetchState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });
  const [tryoutState, setTryoutState] = useState<{ running: boolean; note: string | null; error: string | null }>(
    { running: false, note: null, error: null }
  );
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(POLL_INTERVALS[0] ?? 5000);

  // Load available chats once on mount
  useEffect(() => {
    const controller = new AbortController();
    setChatFetchState({ loading: true, error: null });

    redisApi
      .fetchAvailableChats(controller.signal)
      .then((chats) => {
        setAvailableChats(chats);
        setChatFetchState({ loading: false, error: null });

        if (chats.length && !chats.some((c) => c.chatId === selectedChatId)) {
          setSelectedChatId(chats[0].chatId);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setChatFetchState({ loading: false, error: err instanceof Error ? err.message : "Failed to load chats" });
      });

    return () => controller.abort();
  }, []);

  // Fetch execution state for the selected chat and poll every 5s
  useEffect(() => {
    let cancelled = false;

    const loadState = async (): Promise<void> => {
      setExecutionFetchState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const doc = await redisApi.fetchExecutionState(selectedChatId);
        if (cancelled) return;
        setExecutionStateByChat((prev) => ({ ...prev, [selectedChatId]: doc.data }));
        setExecutionFetchState({ loading: false, error: null });
        setLastPoll(Date.now());
      } catch (err) {
        if (cancelled) return;
        setExecutionFetchState({
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch execution state",
        });
      }
    };

    loadState();
    const interval = setInterval(loadState, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedChatId, pollIntervalMs]);

  useEffect(() => {
    const ticker = setInterval(
      () => setPollAgo(Math.round((Date.now() - lastPoll) / 1000)),
      1000
    );
    return () => {
      clearInterval(ticker);
    };
  }, [lastPoll]);

  const dynamicChatIds = availableChats.map((c) => c.chatId);
  const chatIds = dynamicChatIds.length ? dynamicChatIds : Object.keys(BASE_STATE);
  const executionState = executionStateByChat[selectedChatId] ?? BASE_STATE[selectedChatId];
  const loadedFromApi = Boolean(executionStateByChat[selectedChatId]);

  useEffect(() => {
    if (!chatIds.length) return;
    if (!chatIds.includes(selectedChatId)) {
      const fallback = chatIds[0];
      setSelectedChatId(fallback);
      const nextMessages = executionStateByChat[fallback]?.messages ?? BASE_STATE[fallback]?.messages ?? {};
      const firstMsgId = Object.values(nextMessages)[0]?.message_id ?? "";
      setSelectedMsgId(firstMsgId);
    }
  }, [chatIds, executionStateByChat, selectedChatId]);
  const currentChat: ExecutionState | undefined = executionState;
  const messages: MessageState[] = currentChat ? Object.values(currentChat.messages) : [];
  const currentMessage: MessageState | undefined = currentChat?.messages[selectedMsgId];
  const tasks: Record<string, TaskState> = currentMessage?.tasks ?? {};
  const taskList: TaskState[] = Object.values(tasks);

  const btnStyle = (active: boolean): CSSProperties => ({
    padding: "5px 14px",
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "monospace",
    border: "1px solid",
    background: active ? "#0d2340" : "transparent",
    borderColor: active ? "#3b82f6" : "#1a2535",
    color: active ? "#93c5fd" : "#4b5563",
    transition: "all 0.15s",
  });

  const selectStyle: CSSProperties = {
    background: "#080e1a",
    border: "1px solid #1a2535",
    color: "#e5e7eb",
    padding: "7px 10px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    appearance: "none",
  };

  const handleRunTryout = async (): Promise<void> => {
    const nowSec = Math.floor(Date.now() / 1000);
    const chatId = `chat_tryout_${nowSec}`;
    const messageId = `${chatId}_msg_1`;
    setTryoutState({ running: true, note: `Simulating ${chatId}`, error: null });
    const minPoll = Math.min(...POLL_INTERVALS);
    const stepDelayMs = pollIntervalMs <= minPoll ? STEP_DELAY_FAST : STEP_DELAY_SLOW;

    setAvailableChats((prev) => {
      if (prev.some((c) => c.chatId === chatId)) return prev;
      return [{ key: `execution_state:${chatId}`, chatId }, ...prev];
    });
    setSelectedChatId(chatId);
    setSelectedMsgId(messageId);

    try {
      await runTryoutSimulation({ chatId, messageId, stepDelayMs });
      setTryoutState({ running: false, note: `Simulated ${chatId}`, error: null });
    } catch (err) {
      setTryoutState({
        running: false,
        note: null,
        error: err instanceof Error ? err.message : "Failed to create try-out run",
      });
    }
  };

  const completedTaskCount = taskList.filter((t) => t.status === "COMPLETED").length;

  useEffect(() => {
    if (!currentChat) {
      setSelectedMsgId("");
      return;
    }
    const msgIds = Object.keys(currentChat.messages ?? {});
    if (!msgIds.length) {
      setSelectedMsgId("");
      return;
    }
    if (!msgIds.includes(selectedMsgId)) {
      setSelectedMsgId(msgIds[0]);
    }
  }, [currentChat, selectedMsgId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        color: "#e5e7eb",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #080e1a; }
        ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; }
      `}</style>

      {/* Top nav */}
      <div
        style={{
          borderBottom: "1px solid #0d1420",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#04080f",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Title */}
          <div>
            <div style={{ fontSize: 9, color: "#3b82f6", letterSpacing: "0.18em", marginBottom: 2 }}>
              ◈ AGENT EXECUTION MONITOR
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb", letterSpacing: "-0.02em" }}>
              Execution State
            </div>
          </div>

          <div style={{ width: 1, height: 34, background: "#1a2535" }} />

          {/* Chat selector */}
          <div>
            <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.1em", marginBottom: 3 }}>CHAT</div>
            <select
              value={selectedChatId}
              onChange={(e) => {
                const nextChatId = e.target.value;
                setSelectedChatId(nextChatId);
                const nextMessages = executionStateByChat[nextChatId]?.messages ?? BASE_STATE[nextChatId]?.messages ?? {};
                const firstMsgId = Object.values(nextMessages)[0]?.message_id ?? "";
                setSelectedMsgId(firstMsgId);
              }}
              style={selectStyle}
            >
              {chatIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            <div style={{ marginTop: 4, minHeight: 14, fontSize: 10 }}>
              {chatFetchState.loading && <span style={{ color: "#4b5563" }}>Loading chats…</span>}
              {!chatFetchState.loading && chatFetchState.error && (
                <span style={{ color: "#ef4444" }}>Chats unavailable: {chatFetchState.error}</span>
              )}
            </div>
          </div>

          {/* Message selector */}
          <div>
            <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.1em", marginBottom: 3 }}>MESSAGE</div>
            <select
              value={selectedMsgId}
              onChange={(e) => setSelectedMsgId(e.target.value)}
              style={{ ...selectStyle, minWidth: 260 }}
              disabled={!messages.length}
            >
              {messages.map((m) => (
                <option key={m.message_id} value={m.message_id}>
                  {m.message_id} · {m.content.slice(0, 35)}
                  {m.content.length > 35 ? "…" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* View toggle */}
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setView("tasks")} style={btnStyle(view === "tasks")}>
                Tasks
              </button>
              <button onClick={() => setView("timeline")} style={btnStyle(view === "timeline")}>
                Timeline
              </button>
            </div>

            <div style={{ width: 1, height: 22, background: "#1a2535" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={handleRunTryout}
                disabled={tryoutState.running}
                style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #3b82f6",
                background: tryoutState.running ? "#0b1727" : "#0d2340",
                color: "#93c5fd",
                fontSize: 11,
                cursor: tryoutState.running ? "not-allowed" : "pointer",
                fontFamily: "monospace",
                opacity: tryoutState.running ? 0.6 : 1,
                transition: "all 0.15s",
                boxShadow: "0 0 12px #1e3a8a55",
              }}
            >
              {tryoutState.running ? "Simulating..." : "Simulate Task"}
            </button>
            {tryoutState.note && (
              <span style={{ fontSize: 10, color: "#10b981" }}>✓ {tryoutState.note}</span>
            )}
            {tryoutState.error && (
              <span style={{ fontSize: 10, color: "#ef4444" }}>⚠ {tryoutState.error}</span>
            )}
          </div>

          <div style={{ width: 1, height: 22, background: "#1a2535" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#374151" }}>Poll</span>
            {POLL_INTERVALS.map((ms) => (
              <button
                key={ms}
                onClick={() => setPollIntervalMs(ms)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: pollIntervalMs === ms ? "#3b82f6" : "#1a2535",
                  background: pollIntervalMs === ms ? "#0d2340" : "transparent",
                  color: pollIntervalMs === ms ? "#93c5fd" : "#4b5563",
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 22, background: "#1a2535" }} />

          {/* Poll indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#374151" }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            Poll {pollIntervalMs / 1000}s · {pollAgo}s ago
            {executionFetchState.loading && <span style={{ color: "#4b5563", marginLeft: 6 }}>Fetching…</span>}
            {!executionFetchState.loading && executionFetchState.error && (
              <span style={{ color: "#ef4444", marginLeft: 6 }}>Fetch error</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px" }}>
        {!executionFetchState.loading && executionFetchState.error && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              background: "#1c0505",
              border: "1px solid #ef444430",
              borderRadius: 8,
              color: "#fca5a5",
              fontSize: 11,
            }}
          >
            Failed to load execution data: {executionFetchState.error}
          </div>
        )}

        {!loadedFromApi && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              background: "#080e1a",
              border: "1px solid #0d1420",
              borderRadius: 10,
              color: "#4b5563",
              fontSize: 12,
            }}
          >
            Showing fallback demo data until execution data loads.
          </div>
        )}

        {/* Session metrics */}
        {currentChat && (
          <SessionMetricsBar metrics={currentChat.session_metrics} chat={currentChat} />
        )}

        {/* Message card */}
        {currentMessage && (
          <div
            style={{
              background: "#080e1a",
              border: "1px solid #0d1420",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.1em", marginBottom: 3 }}>
                  MESSAGE · {currentMessage.message_id}
                  <span style={{ marginLeft: 10, color: "#1f2937" }}>
                    stream: {currentMessage.stream_entry_id}
                  </span>
                  <span style={{ marginLeft: 10, color: "#1f2937" }}>
                    host: {currentMessage.master_agent_host_id}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "#f9fafb", marginBottom: 8, lineHeight: 1.5 }}>
                  {currentMessage.content}
                </div>
                {/* Task progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 3, background: "#0d1420", borderRadius: 2 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${taskList.length ? (completedTaskCount / taskList.length) * 100 : 0}%`,
                        background: "#10b981",
                        transition: "width 0.5s",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: "#4b5563", whiteSpace: "nowrap" }}>
                    {completedTaskCount}/{taskList.length} tasks
                  </span>
                </div>
              </div>
              <StatusBadge status={currentMessage.status} size="md" />
            </div>
          </div>
        )}

        {/* Final response */}
        {currentMessage?.result && <FinalResponseBanner result={currentMessage.result} />}

        {/* Main view */}
        {view === "tasks" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {taskList.length === 0 ? (
              <div
                style={{ color: "#1f2937", textAlign: "center", padding: 60, fontSize: 13, fontStyle: "italic" }}
              >
                No tasks for this message.
              </div>
            ) : (
              taskList.map((task, i) => <TaskCard key={task.task_id} task={task} index={i} />)
            )}
          </div>
        ) : (
          <div
            style={{
              background: "#080e1a",
              border: "1px solid #0d1420",
              borderRadius: 10,
              padding: "18px 20px",
            }}
          >
            <TimelineView tasks={tasks} nowSeconds={Math.floor(lastPoll / 1000)} />
          </div>
        )}
      </div>
    </div>
  );
}
