import type { ExecutionState } from "../types";

// ─── Poll / simulation config ─────────────────────────────────────────────────

export const POLL_INTERVALS = (() => {
  const raw =
    (import.meta as { env?: Record<string, string | undefined> }).env
      ?.VITE_POLL_INTERVALS ?? "2000,5000";
  const parsed = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length ? parsed : [5000];
})();

export const STEP_DELAY_FAST = Number(
  (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_SIM_STEP_DELAY_FAST ?? 3000,
);
export const STEP_DELAY_SLOW = Number(
  (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_SIM_STEP_DELAY_SLOW ?? 6000,
);

export const INITIAL_TIMESTAMP_MS = Date.now();

// ─── Fallback demo data ───────────────────────────────────────────────────────

export const BASE_STATE: Record<string, ExecutionState> = {
  chat_test_7: {
    chat_id: "chat_test_7",
    tenant_id: "01ka8bgyan4mn3js75bh7z9xr1",
    created_at: 1772169449,
    status: "ACTIVE",
    session_metrics: { total_messages: 7, total_tasks: 10, tools_used: 8 },
    last_activity_at: 1772197410,
    current_message_id: "msg_test_7",
    messages: {
      msg_test_7: {
        message_id: "msg_test_7",
        master_agent_id: "master_agent",
        master_agent_host_id: "192.168.1.49",
        stream_entry_id: "1772197368592-0",
        filters: { hub_access: ["01kcgmvnc7g6r7kdad2e7wrwbn"] },
        role: "USER",
        status: "COMPLETED",
        content: "Give the summary for thor and stolen hammer",
        created_at: 1772197366,
        updated_at: 1772197410,
        parent_message_id: null,
        result: {
          task_id: "01KJFK4PFHKXXZF597PV96HRJY",
          response:
            "I'm sorry, but I couldn't retrieve the summary of Thor and the stolen hammer. Could you please clarify or provide more details?",
          response_type: "user_response",
        },
        tasks: {
          "01KJFK3YF7KZ4AZ1S1TT3KZR2T": {
            task_id: "01KJFK3YF7KZ4AZ1S1TT3KZR2T",
            task_type: "AGENT",
            stream_id: "1772197378699-0",
            message_id: "msg_test_7",
            assigned_by: "master_agent",
            master_agent_host_id: "192.168.1.49",
            assigned_to: "rag_agent",
            content:
              "Fetch summary of Thor and stolen hammer from knowledge base",
            agent_host_id: "192.168.1.49",
            parent_task_id: null,
            status: "COMPLETED",
            created_at: 1772197366,
            started_at: 1772197378,
            completed_at: 1772197404,
            result: {
              source_agent_name: "rag_agent",
              source_agent_host_id: "192.168.1.49",
              target_agent_task: `{"response": "### Thor and the Stolen Hammer Summary\\n\\n- **Thor's hammer Mjölnir** is stolen by **Thrym**..."}`,
              target_agent_name: "master_agent",
              prev_task_id: "01KJFK3YF7KZ4AZ1S1TT3KZR2T",
              chat_id: "chat_test_7",
              message_id: "msg_test_7",
            },
            steps: {
              "01KJFK46DRNJQ2FY9P8ZR58M67": {
                step_id: "01KJFK46DRNJQ2FY9P8ZR58M67",
                task_id: "01KJFK3YF7KZ4AZ1S1TT3KZR2T",
                agent_id: "rag_agent",
                tool_id: "retrieval",
                status: "completed",
                tool_arguments: {
                  query: "Thor and stolen hammer summary",
                  query_type: "SUMMARY",
                },
                tool_result: {
                  isError: false,
                  structuredContent: {
                    chunk_count: 1,
                    success: true,
                    retrieved_content: [
                      {
                        chunk_index: 1,
                        filename:
                          "Thor and the Stolen Hammer_20251215091827.docx",
                        text: `In the Norse myth "Thor and the Stolen Hammer," Thor discovers his powerful hammer, Mjölnir, has been stolen, posing a significant threat to Asgard's safety. The hammer, essential for protecting Asgard from enemies like the frost giants, is taken by Thrym, the king of the giants, who demands the goddess Freyja as his bride in exchange for its return. Loki, known for his cunning, offers to retrieve the hammer and flies to Jotunheim using Freyja's magical cloak. Upon learning Thrym's condition, the gods devise a plan to disguise Thor as Freyja to reclaim Mjölnir.`,
                      },
                    ],
                  },
                },
                started_at: 1772197386,
                completed_at: 1772197389,
              },
            },
          },
          "01KJFK4PFHKXXZF597PV96HRJY": {
            task_id: "01KJFK4PFHKXXZF597PV96HRJY",
            task_type: "AGENT",
            stream_id: "1772197403272-0",
            message_id: "msg_test_7",
            assigned_by: "rag_agent",
            master_agent_host_id: "192.168.1.49",
            assigned_to: "master_agent",
            content: `{"response": "### Thor and the Stolen Hammer Summary\\n\\n- **Thor's hammer Mjölnir** is stolen by **Thrym**..."}`,
            agent_host_id: "192.168.1.49",
            parent_task_id: null,
            status: "COMPLETED",
            created_at: 1772197366,
            started_at: 1772197403,
            completed_at: 1772197411,
            result: {
              task_id: "01KJFK4PFHKXXZF597PV96HRJY",
              chat_id: "chat_test_7",
              message_id: "msg_test_7",
              response:
                "I'm sorry, but I couldn't retrieve the summary of Thor and the stolen hammer. Could you please clarify or provide more details?",
              response_type: "user_response",
            },
            steps: {},
          },
        },
      },
    },
  },
};
