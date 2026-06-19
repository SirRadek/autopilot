import {
  MIN_DISPATCH_PROMPT_CHARS,
  VOLATILE_PROMPT_PATH,
  requiredAgentDispatchFields
} from "../../data/delivery-system/agentDispatch";
import { isRecord, validateRequiredFields, type ValidationResult } from "./validation";

/**
 * Guard a multi-vendor agent dispatch before it runs.
 *
 * Why this exists: a prompt packet was written to a volatile temp dir, the dir was
 * cleared between steps, and the vendor CLI was invoked with an EMPTY prompt — the
 * agent "ran" with no instructions ("I'm ready. Tell me what you want changed...").
 * An agent's prompt must never be lost or empty, and must be persisted somewhere
 * durable before dispatch.
 *
 * This is a pure validator. It does not block, mutate, or dispatch — the caller
 * (the runCliWorker harness on its own branch) decides whether a non-empty `errors`
 * list is a hard stop or a report-first warning, consistent with the report-first
 * posture of the Codex hook guardrails (`CODEX-HOOK-003`).
 */
export function validateAgentDispatchPacket(value: unknown): ValidationResult {
  const base = validateRequiredFields(value, requiredAgentDispatchFields);
  if (!isRecord(value)) {
    return base;
  }

  const errors = [...base.errors];
  const { prompt, prompt_path: promptPath } = value;

  if (typeof prompt === "string" && prompt.trim().length < MIN_DISPATCH_PROMPT_CHARS) {
    errors.push(
      `prompt is empty or too short to dispatch (${prompt.trim().length} < ${MIN_DISPATCH_PROMPT_CHARS} chars); a lost or empty prompt must never reach a vendor`
    );
  }

  if (typeof promptPath === "string" && VOLATILE_PROMPT_PATH.test(promptPath)) {
    errors.push(
      "prompt_path is a volatile location (temp); persist the prompt to a durable, project-scoped path before dispatch"
    );
  }

  return { valid: errors.length === 0, errors };
}
