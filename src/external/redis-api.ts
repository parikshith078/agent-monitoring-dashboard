import type { ExecutionState, MessageState, TaskState, TaskType } from "../types";

export interface RedisApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
  error: unknown | null;
}

export interface ActiveChatsPayload {
  keys: string[];
  count: number;
}

export interface AvailableChat {
  key: string;
  chatId: string;
}

export interface ExecutionStateDocument {
  key: string;
  path: string | null;
  data: ExecutionState;
}

export class RedisApi {
  private readonly baseUrl: string;

  constructor(baseUrl = "http://100.65.209.109:7018") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async fetchAvailableChats(signal?: AbortSignal): Promise<AvailableChat[]> {
    const url = `${this.baseUrl}/json/?pattern=execution_state%3A%2A`;
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chats (status ${response.status})`);
    }

    const body = (await response.json()) as RedisApiResponse<ActiveChatsPayload>;

    if (!body.success || !body.data || !Array.isArray(body.data.keys)) {
      throw new Error("Unexpected response while fetching chats");
    }

    return body.data.keys.map((key) => ({
      key,
      chatId: key.replace(/^execution_state:/, ""),
    }));
  }

  async fetchExecutionState(chatId: string, signal?: AbortSignal): Promise<ExecutionStateDocument> {
    const encodedKey = encodeURIComponent(`execution_state:${chatId}`);
    const url = `${this.baseUrl}/json/${encodedKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch execution state for ${chatId} (status ${response.status})`);
    }

    const body = (await response.json()) as RedisApiResponse<ExecutionStateDocument>;

    if (!body.success || !body.data || !body.data.data) {
      throw new Error(`Unexpected response while fetching execution state for ${chatId}`);
    }

    return {
      ...body.data,
      data: normalizeExecutionState(body.data.data),
    };
  }
}

const REDIS_API_BASE = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_REDIS_API_BASE
  ?? "http://100.65.209.109:7018";

export const redisApi = new RedisApi(REDIS_API_BASE);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalizeExecutionState(raw: ExecutionState): ExecutionState {
  const messages = Object.entries(raw.messages ?? {}).reduce<Record<string, MessageState>>((acc, [id, msg]) => {
    const tasks = Object.entries(msg.tasks ?? {}).reduce<Record<string, TaskState>>((taskAcc, [taskId, task]) => {
      const taskType = (task as TaskState).task_type ?? "AGENT";
      taskAcc[taskId] = {
        task_id: taskId,
        task_type: taskType as TaskType,
        stream_id: (task as TaskState).stream_id ?? "",
        message_id: (task as TaskState).message_id ?? msg.message_id ?? "",
        assigned_by: (task as TaskState).assigned_by ?? "",
        master_agent_host_id: (task as TaskState).master_agent_host_id ?? "",
        assigned_to: (task as TaskState).assigned_to ?? "",
        content: (task as TaskState).content ?? "",
        agent_host_id: (task as TaskState).agent_host_id ?? null,
        parent_task_id: (task as TaskState).parent_task_id ?? null,
        status: (task as TaskState).status ?? "CREATED",
        created_at: (task as TaskState).created_at ?? 0,
        started_at: (task as TaskState).started_at ?? null,
        completed_at: (task as TaskState).completed_at ?? null,
        result: (task as TaskState).result ?? {},
        steps: (task as TaskState).steps ?? {},
      };
      return taskAcc;
    }, {} as Record<string, TaskState>);

    acc[id] = {
      message_id: msg.message_id ?? id,
      master_agent_id: msg.master_agent_id ?? "",
      master_agent_host_id: msg.master_agent_host_id ?? "",
      stream_entry_id: msg.stream_entry_id ?? "",
      filters: msg.filters ?? {},
      role: msg.role ?? "USER",
      status: msg.status ?? "COMPLETED",
      content: msg.content ?? "",
      created_at: msg.created_at ?? 0,
      updated_at: msg.updated_at ?? msg.created_at ?? 0,
      parent_message_id: msg.parent_message_id ?? null,
      tasks,
      result: msg.result ?? undefined,
    } as MessageState;
    return acc;
  }, {} as Record<string, MessageState>);

  return {
    chat_id: raw.chat_id,
    tenant_id: raw.tenant_id,
    created_at: raw.created_at ?? 0,
    status: raw.status ?? "UNKNOWN",
    messages,
    last_activity_at: raw.last_activity_at ?? 0,
    current_message_id: raw.current_message_id ?? null,
    session_metrics: {
      total_messages: raw.session_metrics?.total_messages ?? 0,
      total_tasks: raw.session_metrics?.total_tasks ?? 0,
      tools_used: raw.session_metrics?.tools_used ?? 0,
    },
  };
}
