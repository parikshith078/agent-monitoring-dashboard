// ─── Enums ────────────────────────────────────────────────────────────────────

export type ExeStepStatus = "in_progress" | "completed" | "failed";

export type ExeTaskStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type ExeMessageStatus = "PICKED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type TaskType = "AGENT" | "MASTER";

// ─── Step ─────────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  chunk_index: number;
  text: string;
  filename: string;
}

export interface StructuredContent {
  retrieved_content: RetrievedChunk[];
  chunk_count: number;
  success: boolean;
}

export interface ToolResult {
  isError: boolean;
  meta?: unknown;
  content?: unknown[];
  structuredContent?: StructuredContent;
  [key: string]: unknown;
}

export interface StepState {
  step_id: string;
  task_id: string;
  agent_id: string;
  tool_id: string;
  status: ExeStepStatus;
  tool_arguments: Record<string, unknown>;
  tool_result: ToolResult;
  started_at: number;
  completed_at: number | null;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface TaskResult {
  task_id?: string;
  chat_id?: string;
  message_id?: string;
  response?: string;
  response_type?: string;
  source_agent_name?: string;
  source_agent_host_id?: string;
  target_agent_name?: string;
  target_agent_task?: string;
  prev_task_id?: string;
  [key: string]: unknown;
}

export interface TaskState {
  task_id: string;
  task_type: TaskType;
  stream_id: string;
  message_id: string;
  assigned_by: string;
  master_agent_host_id: string;
  assigned_to: string;
  content: string;
  agent_host_id: string | null;
  parent_task_id: string | null;
  status: ExeTaskStatus;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  result: TaskResult;
  steps: Record<string, StepState>;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface MessageResult {
  task_id?: string;
  chat_id?: string;
  message_id?: string;
  response?: string;
  response_type?: string;
  [key: string]: unknown;
}

export interface MessageState {
  message_id: string;
  master_agent_id: string;
  master_agent_host_id: string;
  stream_entry_id: string;
  filters: Record<string, unknown>;
  role: string;
  status: ExeMessageStatus;
  content: string;
  created_at: number;
  updated_at: number;
  parent_message_id: string | null;
  tasks: Record<string, TaskState>;
  result?: MessageResult;
}

// ─── Execution State ──────────────────────────────────────────────────────────

export interface SessionMetrics {
  total_messages: number;
  total_tasks: number;
  tools_used: number;
}

export interface ExecutionState {
  chat_id: string;
  tenant_id: string;
  created_at: number;
  status: string;
  messages: Record<string, MessageState>;
  last_activity_at: number;
  current_message_id: string | null;
  session_metrics: SessionMetrics;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface StatusConfig {
  color: string;
  bg: string;
  label: string;
  dot: string;
}
