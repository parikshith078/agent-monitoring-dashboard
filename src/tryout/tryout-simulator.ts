import type { ExecutionState, MessageState, StepState, TaskState } from "../types";

const API_BASE = "http://100.65.209.109:7018";
const STEP_DELAY_MS = 6000;

export interface TryoutOptions {
  chatId?: string;
  messageId?: string;
  stepDelayMs?: number;
}

interface TryoutResult {
  chatId: string;
  messageId: string;
}

async function apiRequest(path: string, init: RequestInit): Promise<void> {
  console.info("tryout: call", init.method ?? "GET", path, { body: init.body ? "with-body" : "no-body" });
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) as Record<string, unknown> : {};
  } catch {
    body = {};
  }

  const successFlag = (body as { success?: boolean }).success;
  if (!response.ok || successFlag === false) {
    const payload = body as { message?: unknown; detail?: unknown };
    const message = payload.message ?? payload.detail ?? `Request failed with status ${response.status}`;
    throw new Error(typeof message === "string" ? message : "Unexpected response from redis-api");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createJsonDocument(key: string, data: ExecutionState): Promise<void> {
  const encodedKey = encodeURIComponent(key);
  await apiRequest(`/json/${encodedKey}`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

async function updatePath(key: string, keyPath: string, value: unknown): Promise<void> {
  const encodedKey = encodeURIComponent(key);
  await apiRequest(`/json/${encodedKey}`, {
    method: "PATCH",
    body: JSON.stringify({ key_path: keyPath, value }),
  });
}

function buildBaseState(now: number, chatId: string, messageId: string): ExecutionState {
  const message: MessageState = {
    message_id: messageId,
    master_agent_id: "master_agent",
    master_agent_host_id: "demo.host",
    stream_entry_id: `${Date.now()}-0`,
    filters: { hub_access: ["demo_hub"] },
    role: "USER",
    status: "IN_PROGRESS",
    content: "Try-out: craft a sample execution narrative",
    created_at: now,
    updated_at: now,
    parent_message_id: null,
    tasks: {},
  };

  return {
    chat_id: chatId,
    tenant_id: "demo_tenant",
    created_at: now,
    status: "ACTIVE",
    messages: { [messageId]: message },
    last_activity_at: now,
    current_message_id: messageId,
    session_metrics: { total_messages: 1, total_tasks: 0, tools_used: 0 },
  };
}

export async function runTryoutSimulation(options: TryoutOptions = {}): Promise<TryoutResult> {
  const now = Math.floor(Date.now() / 1000);
  const chatId = options.chatId ?? `chat_tryout_${now}`;
  const messageId = options.messageId ?? `${chatId}_msg_1`;
  const delay = options.stepDelayMs ?? STEP_DELAY_MS;
  const taskAId = `${chatId}_task_a`;
  const taskBId = `${chatId}_task_b`;
  const stepAId = `${taskAId}_step_1`;
  const stepBId = `${taskBId}_step_1`;
  const key = `execution_state:${chatId}`;

  const baseState = buildBaseState(now, chatId, messageId);
  console.info("tryout: create base execution state", chatId);
  await createJsonDocument(key, baseState);

  const taskA: TaskState = {
    task_id: taskAId,
    task_type: "AGENT",
    stream_id: `${Date.now()}-1`,
    message_id: messageId,
    assigned_by: "master_agent",
    master_agent_host_id: "demo.host",
    assigned_to: "planner_agent",
    content: "Draft an execution outline for the try-out run",
    agent_host_id: "demo.host",
    parent_task_id: null,
    status: "IN_PROGRESS",
    created_at: now + 1,
    started_at: now + 1,
    completed_at: null,
    result: {},
    steps: {},
  };

  await sleep(delay);
  console.info("tryout: add task A");
  await updatePath(key, `messages.${messageId}.tasks.${taskAId}`, taskA);
  await updatePath(key, "session_metrics.total_tasks", 1);
  await updatePath(key, "last_activity_at", now + 1);

  const stepA: StepState = {
    step_id: stepAId,
    task_id: taskAId,
    agent_id: "planner_agent",
    tool_id: "retrieval",
    status: "in_progress",
    tool_arguments: { query: "collect existing demo snippets" },
    tool_result: { isError: false },
    started_at: now + 1,
    completed_at: null,
  };

  await sleep(delay);
  console.info("tryout: add step A (in-progress)");
  await updatePath(key, `messages.${messageId}.tasks.${taskAId}.steps.${stepAId}`, stepA);
  await updatePath(key, "last_activity_at", now + 2);

  const stepAComplete: StepState = {
    ...stepA,
    status: "completed",
    completed_at: now + 2,
    tool_result: {
      isError: false,
      structuredContent: {
        chunk_count: 1,
        success: true,
        retrieved_content: [
          {
            chunk_index: 1,
            filename: "demo-outline.md",
            text: "Outline gathered: intro, task planning, tool calls, final response",
          },
        ],
      },
    },
  };

  await sleep(delay);
  console.info("tryout: complete step A");
  await updatePath(key, `messages.${messageId}.tasks.${taskAId}.steps.${stepAId}`, stepAComplete);
  await updatePath(key, "session_metrics.tools_used", 1);
  await updatePath(key, "last_activity_at", now + 3);

  console.info("tryout: complete task A");
  await updatePath(key, `messages.${messageId}.tasks.${taskAId}.status`, "COMPLETED");
  await updatePath(key, `messages.${messageId}.tasks.${taskAId}.completed_at`, now + 3);
  await updatePath(key, `messages.${messageId}.tasks.${taskAId}.result`, {
    response: "Drafted the outline and shared retrieved context.",
    response_type: "agent_response",
  });

  const taskB: TaskState = {
    task_id: taskBId,
    task_type: "AGENT",
    stream_id: `${Date.now()}-2`,
    message_id: messageId,
    assigned_by: "master_agent",
    master_agent_host_id: "demo.host",
    assigned_to: "writer_agent",
    content: "Expand the outline into a readable execution summary",
    agent_host_id: "demo.host",
    parent_task_id: taskAId,
    status: "IN_PROGRESS",
    created_at: now + 3,
    started_at: now + 3,
    completed_at: null,
    result: {},
    steps: {},
  };

  await sleep(delay);
  console.info("tryout: add task B");
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}`, taskB);
  await updatePath(key, "session_metrics.total_tasks", 2);
  await updatePath(key, "last_activity_at", now + 4);

  const stepB: StepState = {
    step_id: stepBId,
    task_id: taskBId,
    agent_id: "writer_agent",
    tool_id: "llm",
    status: "in_progress",
    tool_arguments: { prompt: "Draft narrative about dashboard try-out" },
    tool_result: { isError: false },
    started_at: now + 4,
    completed_at: null,
  };

  await sleep(delay);
  console.info("tryout: add step B1 (in-progress)");
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}.steps.${stepBId}`, stepB);
  await updatePath(key, "last_activity_at", now + 5);

  const stepBComplete: StepState = {
    ...stepB,
    status: "completed",
    completed_at: now + 5,
    tool_result: {
      isError: false,
      content: ["Generated try-out summary"],
      structuredContent: {
        chunk_count: 1,
        success: true,
        retrieved_content: [
          {
            chunk_index: 1,
            filename: "tryout-summary.md",
            text: "Simulated execution flows through planning and writing before finishing.",
          },
        ],
      },
    },
  };

  await sleep(delay);
  console.info("tryout: complete step B1");
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}.steps.${stepBId}`, stepBComplete);
  await updatePath(key, "session_metrics.tools_used", 2);
  await updatePath(key, "last_activity_at", now + 6);

  const stepB2Id = `${taskBId}_step_2`;
  const stepB2: StepState = {
    step_id: stepB2Id,
    task_id: taskBId,
    agent_id: "writer_agent",
    tool_id: "postprocess",
    status: "in_progress",
    tool_arguments: { action: "polish narrative" },
    tool_result: { isError: false },
    started_at: now + 6,
    completed_at: null,
  };

  await sleep(delay);
  console.info("tryout: add step B2 (in-progress)");
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}.steps.${stepB2Id}`, stepB2);
  await updatePath(key, "last_activity_at", now + 7);

  const stepB2Complete: StepState = {
    ...stepB2,
    status: "completed",
    completed_at: now + 7,
    tool_result: {
      isError: false,
      content: ["Polished narrative"],
      structuredContent: {
        chunk_count: 1,
        success: true,
        retrieved_content: [
          {
            chunk_index: 1,
            filename: "tryout-polish.md",
            text: "Smoothed the summary and added closing sentence.",
          },
        ],
      },
    },
  };

  await sleep(delay);
  console.info("tryout: complete step B2");
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}.steps.${stepB2Id}`, stepB2Complete);
  await updatePath(key, "session_metrics.tools_used", 3);
  await updatePath(key, "last_activity_at", now + 8);

  console.info("tryout: complete task B");
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}.status`, "COMPLETED");
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}.completed_at`, now + 8);
  await updatePath(key, `messages.${messageId}.tasks.${taskBId}.result`, {
    response: "Expanded and polished the narrative for the dashboard demo.",
    response_type: "agent_response",
  });

  console.info("tryout: finalize message and chat");
  await updatePath(key, `messages.${messageId}.status`, "COMPLETED");
  await updatePath(key, `messages.${messageId}.updated_at`, now + 8);
  await updatePath(key, "status", "COMPLETED");
  await updatePath(key, "last_activity_at", now + 8);
  await updatePath(key, `messages.${messageId}.result`, {
    response: "Demo run completed. Tasks moved from planning to writing and produced the final response.",
    response_type: "user_response",
  });
  await updatePath(key, "session_metrics", { total_messages: 1, total_tasks: 2, tools_used: 3 });

  return { chatId, messageId };
}
