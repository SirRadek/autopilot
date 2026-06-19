import { isRecord, validateRequiredFields, type ValidationResult } from './governance-validation'

// Guard a model/agent dispatch before it runs. A dispatch packet written to a volatile
// temp dir was once cleared between steps, so a vendor CLI ran with an empty prompt and
// produced nothing. An agent's prompt must never be lost or empty, and must be persisted
// somewhere durable before dispatch. This is a pure validator — the caller decides
// hard-stop vs report-first.

export const requiredAgentDispatchFields = [
  'dispatch_id',
  'lane',
  'provider',
  'model',
  'prompt',
  'prompt_path',
  'created_at'
] as const

// A near-empty prompt (e.g. a temp file that got cleared, leaving nothing) must never
// reach a vendor.
export const MIN_DISPATCH_PROMPT_CHARS = 24

// Volatile / non-durable locations a prompt must NOT live in before dispatch.
export const VOLATILE_PROMPT_PATH = /(^|[\\/])(tmp|temp)([\\/]|$)|\/dev\/shm\b|[\\/]AppData[\\/]Local[\\/]Temp[\\/]/i

export interface AgentDispatchPacket {
  dispatch_id: string
  lane: string
  provider: string
  model: string
  prompt: string
  prompt_path: string
  created_at: string
}

export function validateAgentDispatchPacket(value: unknown): ValidationResult {
  const base = validateRequiredFields(value, requiredAgentDispatchFields)
  if (!isRecord(value)) {
    return base
  }

  const errors = [...base.errors]
  const { prompt, prompt_path: promptPath } = value

  if (typeof prompt === 'string' && prompt.trim().length < MIN_DISPATCH_PROMPT_CHARS) {
    errors.push(
      `prompt is empty or too short to dispatch (${prompt.trim().length} < ${MIN_DISPATCH_PROMPT_CHARS} chars); a lost or empty prompt must never reach a vendor`
    )
  }

  if (typeof promptPath === 'string' && VOLATILE_PROMPT_PATH.test(promptPath)) {
    errors.push('prompt_path is a volatile location (temp); persist the prompt to a durable, project-scoped path before dispatch')
  }

  return { valid: errors.length === 0, errors }
}
