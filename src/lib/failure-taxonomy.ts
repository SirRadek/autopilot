// Fixed failure taxonomy. Lessons tag failures from this closed set so the digest can
// aggregate on counts and repeated patterns instead of anecdotes. Free-text lessons stay;
// `failure_tags` add a machine-actionable layer on top.

export const FAILURE_CATEGORIES = [
  'missing_context',
  'instruction_miss',
  'unsafe_assumption',
  'bad_format',
  'unverifiable_claim',
  'poor_handoff',
  'excessive_tokens',
  'wrong_tool_route',
  'stale_docs',
  'privacy_risk'
] as const

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number]

const KNOWN = new Set<string>(FAILURE_CATEGORIES)

export function isFailureCategory(value: unknown): value is FailureCategory {
  return typeof value === 'string' && KNOWN.has(value)
}

// Keep only valid taxonomy tags; unknown tags are dropped (and reported by callers).
export function normalizeFailureTags(value: unknown): { tags: FailureCategory[]; unknown: string[] } {
  if (!Array.isArray(value)) {
    return { tags: [], unknown: [] }
  }
  const tags: FailureCategory[] = []
  const unknown: string[] = []
  for (const item of value) {
    if (isFailureCategory(item)) {
      if (!tags.includes(item)) {
        tags.push(item)
      }
    } else if (typeof item === 'string' && item.length > 0) {
      unknown.push(item)
    }
  }
  return { tags, unknown }
}
