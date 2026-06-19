export const requiredAgentDispatchFields = [
  "dispatch_id",
  "lane",
  "provider",
  "model",
  "prompt",
  "prompt_path",
  "created_at"
] as const;

/**
 * Minimum substantive prompt length. A near-empty prompt — for example a packet
 * file that was written to a volatile temp dir and then cleared, leaving `cat` to
 * emit nothing — must never reach a vendor. The agent would "run" with no
 * instructions and silently produce garbage (observed 2026-06-19).
 */
export const MIN_DISPATCH_PROMPT_CHARS = 24;

/**
 * Volatile / non-durable locations an agent prompt must NOT live in before dispatch:
 * POSIX temp, MSYS `/tmp`, shared memory, and the Windows per-user Temp folder.
 * Prompts must be persisted to a durable, project-scoped path first so they cannot
 * be lost mid-run.
 */
export const VOLATILE_PROMPT_PATH =
  /(^|[\\/])(tmp|temp)([\\/]|$)|\/dev\/shm\b|[\\/]AppData[\\/]Local[\\/]Temp[\\/]/i;

export interface AgentDispatchPacket {
  /** Stable id for the dispatch, traceable in the usage ledger. */
  dispatch_id: string;
  /** strategic | technical | ux | routine — see multi-model-orchestration model. */
  lane: string;
  provider: string;
  model: string;
  /** The exact prompt text sent to the agent. The thing that must never be lost. */
  prompt: string;
  /** Durable, project-scoped path where `prompt` is persisted as evidence. */
  prompt_path: string;
  /** ISO timestamp of when the packet was prepared. */
  created_at: string;
}
