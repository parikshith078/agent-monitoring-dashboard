import { useState, useEffect } from "react";
import type { CSSProperties, JSX } from "react";
import type { ExecutionState, MessageState, TaskState } from "./types";
import { redisApi, type AvailableChat } from "./external/redis-api";
import { runTryoutSimulation } from "./tryout/tryout-simulator";
import { getTheme, ThemeContext, type ThemeMode } from "./theme";
import {
  POLL_INTERVALS,
  STEP_DELAY_FAST,
  STEP_DELAY_SLOW,
  INITIAL_TIMESTAMP_MS,
  BASE_STATE,
} from "./data/demoData";

// ─── Components ───────────────────────────────────────────────────────────────
import { StatusBadge } from "./components/StatusBadge";
import { TaskCard } from "./components/TaskCard";
import { TimelineView } from "./components/TimelineView";
import { SessionMetricsBar } from "./components/SessionMetricsBar";
import { FinalResponseBanner } from "./components/FinalResponseBanner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = "tasks" | "timeline";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard(): JSX.Element {
  const [selectedChatId, setSelectedChatId] = useState<string>("chat_test_7");
  const [selectedMsgId, setSelectedMsgId] = useState<string>("msg_test_7");
  const [view, setView] = useState<ViewMode>("tasks");
  const [lastPoll, setLastPoll] = useState<number>(INITIAL_TIMESTAMP_MS);
  const [pollAgo, setPollAgo] = useState<number>(0);
  const [availableChats, setAvailableChats] = useState<AvailableChat[]>([]);
  const [chatFetchState, setChatFetchState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });
  const [executionStateByChat, setExecutionStateByChat] = useState<
    Record<string, ExecutionState>
  >({});
  const [executionFetchState, setExecutionFetchState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });
  const [tryoutState, setTryoutState] = useState<{
    running: boolean;
    note: string | null;
    error: string | null;
  }>({ running: false, note: null, error: null });
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(
    POLL_INTERVALS[0] ?? 5000,
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const theme = getTheme(themeMode);

  // ─── Effects ────────────────────────────────────────────────────────────────

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
        setChatFetchState({
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load chats",
        });
      });

    return () => controller.abort();
  }, []);

  // Fetch execution state for the selected chat and poll periodically
  useEffect(() => {
    let cancelled = false;

    const loadState = async (): Promise<void> => {
      setExecutionFetchState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));
      try {
        const doc = await redisApi.fetchExecutionState(selectedChatId);
        if (cancelled) return;
        setExecutionStateByChat((prev) => ({
          ...prev,
          [selectedChatId]: doc.data,
        }));
        setExecutionFetchState({ loading: false, error: null });
        setLastPoll(Date.now());
      } catch (err) {
        if (cancelled) return;
        setExecutionFetchState({
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to fetch execution state",
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

  // Tick poll-ago counter
  useEffect(() => {
    const ticker = setInterval(
      () => setPollAgo(Math.round((Date.now() - lastPoll) / 1000)),
      1000,
    );
    return () => {
      clearInterval(ticker);
    };
  }, [lastPoll]);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const dynamicChatIds = availableChats.map((c) => c.chatId);
  const chatIds = dynamicChatIds.length
    ? dynamicChatIds
    : Object.keys(BASE_STATE);
  const executionState =
    executionStateByChat[selectedChatId] ?? BASE_STATE[selectedChatId];
  const loadedFromApi = Boolean(executionStateByChat[selectedChatId]);

  useEffect(() => {
    if (!chatIds.length) return;
    if (!chatIds.includes(selectedChatId)) {
      const fallback = chatIds[0];
      setSelectedChatId(fallback);
      const nextMessages =
        executionStateByChat[fallback]?.messages ??
        BASE_STATE[fallback]?.messages ??
        {};
      const firstMsgId = Object.values(nextMessages)[0]?.message_id ?? "";
      setSelectedMsgId(firstMsgId);
    }
  }, [chatIds, executionStateByChat, selectedChatId]);

  const currentChat: ExecutionState | undefined = executionState;
  const messages: MessageState[] = currentChat
    ? Object.values(currentChat.messages)
    : [];
  const currentMessage: MessageState | undefined =
    currentChat?.messages[selectedMsgId];
  const tasks: Record<string, TaskState> = currentMessage?.tasks ?? {};
  const taskList: TaskState[] = Object.values(tasks);
  const completedTaskCount = taskList.filter(
    (t) => t.status === "COMPLETED",
  ).length;

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

  // ─── Style helpers ──────────────────────────────────────────────────────────

  const btnStyle = (active: boolean): CSSProperties => ({
    padding: "5px 14px",
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "monospace",
    border: "1px solid",
    background: active ? theme.accentBg : "transparent",
    borderColor: active ? theme.accentBorder : theme.separator,
    color: active ? theme.accentText : theme.textTertiary,
    transition: "all 0.15s",
  });

  const selectStyle: CSSProperties = {
    background: theme.selectBg,
    border: `1px solid ${theme.selectBorder}`,
    color: theme.selectText,
    padding: "7px 10px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    appearance: "none",
  };

  const pollStatusStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
    color: theme.textMuted,
    minWidth: 120,
    justifyContent: "flex-start",
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleRunTryout = async (): Promise<void> => {
    const nowSec = Math.floor(Date.now() / 1000);
    const chatId = `chat_tryout_${nowSec}`;
    const messageId = `${chatId}_msg_1`;
    setTryoutState({
      running: true,
      note: `Simulating ${chatId}`,
      error: null,
    });
    const minPoll = Math.min(...POLL_INTERVALS);
    const stepDelayMs =
      pollIntervalMs <= minPoll ? STEP_DELAY_FAST : STEP_DELAY_SLOW;

    setAvailableChats((prev) => {
      if (prev.some((c) => c.chatId === chatId)) return prev;
      return [{ key: `execution_state:${chatId}`, chatId }, ...prev];
    });
    setSelectedChatId(chatId);
    setSelectedMsgId(messageId);

    try {
      await runTryoutSimulation({ chatId, messageId, stepDelayMs });
      setTryoutState({
        running: false,
        note: `Simulated ${chatId}`,
        error: null,
      });
    } catch (err) {
      setTryoutState({
        running: false,
        note: null,
        error:
          err instanceof Error ? err.message : "Failed to create try-out run",
      });
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          minHeight: "100vh",
          background: theme.pageBg,
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          color: theme.textPrimary,
          transition: "background 0.3s ease, color 0.3s ease",
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
        ::-webkit-scrollbar-track { background: ${theme.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background: ${theme.scrollThumb}; border-radius: 2px; }
        body { background: ${theme.pageBg}; transition: background 0.3s ease; }
      `}</style>

        {/* ── Top nav ─────────────────────────────────────────────────── */}
        <div
          style={{
            borderBottom: `1px solid ${theme.headerBorder}`,
            padding: "12px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: theme.headerBg,
            transition: "background 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {/* Title */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: theme.accent,
                  letterSpacing: "0.18em",
                  marginBottom: 2,
                }}
              >
                ◈ AGENT EXECUTION MONITOR
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.textBright,
                  letterSpacing: "-0.02em",
                }}
              >
                Execution State
              </div>
            </div>

            <div
              style={{ width: 1, height: 34, background: theme.separator }}
            />

            {/* Chat selector */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 9,
                  color: theme.textMuted,
                  letterSpacing: "0.1em",
                  marginBottom: 3,
                }}
              >
                CHAT
              </div>
              <select
                value={selectedChatId}
                onChange={(e) => {
                  const nextChatId = e.target.value;
                  setSelectedChatId(nextChatId);
                  const nextMessages =
                    executionStateByChat[nextChatId]?.messages ??
                    BASE_STATE[nextChatId]?.messages ??
                    {};
                  const firstMsgId =
                    Object.values(nextMessages)[0]?.message_id ?? "";
                  setSelectedMsgId(firstMsgId);
                }}
                style={selectStyle}
              >
                {chatIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              {(chatFetchState.loading || chatFetchState.error) && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "100%",
                    marginTop: 2,
                    fontSize: 10,
                    whiteSpace: "nowrap",
                  }}
                >
                  {chatFetchState.loading && (
                    <span style={{ color: theme.textTertiary }}>
                      Loading chats…
                    </span>
                  )}
                  {!chatFetchState.loading && chatFetchState.error && (
                    <span style={{ color: "#ef4444" }}>
                      Chats unavailable: {chatFetchState.error}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Message selector */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: theme.textMuted,
                  letterSpacing: "0.1em",
                  marginBottom: 3,
                }}
              >
                MESSAGE
              </div>
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* View toggle */}
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setView("tasks")}
                style={btnStyle(view === "tasks")}
              >
                Tasks
              </button>
              <button
                onClick={() => setView("timeline")}
                style={btnStyle(view === "timeline")}
              >
                Timeline
              </button>
            </div>

            <div
              style={{ width: 1, height: 22, background: theme.separator }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={handleRunTryout}
                disabled={tryoutState.running}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.accentBorder}`,
                  background: tryoutState.running
                    ? theme.hoverBg
                    : theme.accentBg,
                  color: theme.accentText,
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
                <span style={{ fontSize: 10, color: "#10b981" }}>
                  ✓ {tryoutState.note}
                </span>
              )}
              {tryoutState.error && (
                <span style={{ fontSize: 10, color: "#ef4444" }}>
                  ⚠ {tryoutState.error}
                </span>
              )}
            </div>

            <div
              style={{ width: 1, height: 22, background: theme.separator }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: theme.textMuted }}>Poll</span>
              {POLL_INTERVALS.map((ms) => (
                <button
                  key={ms}
                  onClick={() => setPollIntervalMs(ms)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor:
                      pollIntervalMs === ms
                        ? theme.accentBorder
                        : theme.separator,
                    background:
                      pollIntervalMs === ms ? theme.accentBg : "transparent",
                    color:
                      pollIntervalMs === ms
                        ? theme.accentText
                        : theme.textTertiary,
                    fontSize: 10,
                    cursor: "pointer",
                    fontFamily: "monospace",
                  }}
                >
                  {ms / 1000}s
                </button>
              ))}
            </div>

            <div
              style={{ width: 1, height: 22, background: theme.separator }}
            />

            {/* Poll indicator */}
            <div style={pollStatusStyle}>
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
              <span>
                Poll {pollIntervalMs / 1000}s · {pollAgo}s ago
              </span>
              <span
                style={{
                  color: executionFetchState.error ? "#ef4444" : "#4b5563",
                  opacity:
                    executionFetchState.loading || executionFetchState.error
                      ? 1
                      : 0,
                  transition: "opacity 0.2s ease",
                  minWidth: 76,
                  textAlign: "left",
                }}
              >
                {executionFetchState.error ? "Fetch error" : "Fetching…"}
              </span>
            </div>

            <div
              style={{ width: 1, height: 22, background: theme.separator }}
            />

            {/* Theme toggle */}
            <button
              onClick={() =>
                setThemeMode((m) => (m === "dark" ? "light" : "dark"))
              }
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: `1px solid ${theme.separator}`,
                background: theme.hoverBg,
                color: theme.textPrimary,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginLeft: "auto",
              }}
              title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
            >
              {themeMode === "dark" ? "☀️" : "🌙"}
              <span style={{ fontSize: 10, fontFamily: "monospace" }}>
                {themeMode === "dark" ? "Light" : "Dark"}
              </span>
            </button>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div style={{ padding: "20px 24px" }}>
          {!executionFetchState.loading && executionFetchState.error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                background: theme.errorBg,
                border: `1px solid ${theme.errorBorder}`,
                borderRadius: 8,
                color: theme.errorText,
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
                background: theme.infoBg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 10,
                color: theme.textTertiary,
                fontSize: 12,
              }}
            >
              Showing fallback demo data until execution data loads.
            </div>
          )}

          {/* Session metrics */}
          {currentChat && (
            <SessionMetricsBar
              metrics={currentChat.session_metrics}
              chat={currentChat}
            />
          )}

          {/* Message card */}
          {currentMessage && (
            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
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
                  <div
                    style={{
                      fontSize: 9,
                      color: theme.textMuted,
                      letterSpacing: "0.1em",
                      marginBottom: 3,
                    }}
                  >
                    MESSAGE · {currentMessage.message_id}
                    <span style={{ marginLeft: 10, color: theme.textDimmest }}>
                      stream: {currentMessage.stream_entry_id}
                    </span>
                    <span style={{ marginLeft: 10, color: theme.textDimmest }}>
                      host: {currentMessage.master_agent_host_id}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: theme.textBright,
                      marginBottom: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {currentMessage.content}
                  </div>
                  {/* Task progress bar */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        background: theme.trackBg,
                        borderRadius: 2,
                      }}
                    >
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
                    <span
                      style={{
                        fontSize: 10,
                        color: theme.textTertiary,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {completedTaskCount}/{taskList.length} tasks
                    </span>
                  </div>
                </div>
                <StatusBadge status={currentMessage.status} size="md" />
              </div>
            </div>
          )}

          {/* Final response */}
          {currentMessage?.result && (
            <FinalResponseBanner result={currentMessage.result} />
          )}

          {/* Main view */}
          {view === "tasks" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {taskList.length === 0 ? (
                <div
                  style={{
                    color: theme.textDimmest,
                    textAlign: "center",
                    padding: 60,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  No tasks for this message.
                </div>
              ) : (
                taskList.map((task, i) => (
                  <TaskCard key={task.task_id} task={task} index={i} />
                ))
              )}
            </div>
          ) : (
            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 10,
                padding: "18px 20px",
              }}
            >
              <TimelineView
                tasks={tasks}
                nowSeconds={Math.floor(lastPoll / 1000)}
              />
            </div>
          )}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
