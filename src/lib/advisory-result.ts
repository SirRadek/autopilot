// The opaque advisory result and the canonical-write contract (3-vendor review,
// 2026-06-19). Only the sanctioned executor can mint an AdvisoryResult; canonical
// mutators must refuse it. The ONLY conversion from advisory to canonical state is an
// explicit CanonicalDecision tied to a decision event and an actor — that decision is
// the enforcement point, not the type brand alone.

declare const advisoryBrand: unique symbol

export interface ActualUsage {
  readonly actual_tokens: number | null
  readonly latency_ms: number | null
  readonly provider_txn_id: string | null
}

// Phantom-branded: the brand lives only in the type, so this cannot be constructed
// outside `createAdvisoryResult` without an unsafe cast.
export type AdvisoryResult = {
  readonly advisory_only: true
  readonly advisory_id: string
  readonly content: string
  readonly usage: ActualUsage
} & { readonly [advisoryBrand]: true }

export function createAdvisoryResult(input: {
  advisory_id: string
  content: string
  usage: ActualUsage
}): AdvisoryResult {
  return {
    advisory_only: true,
    advisory_id: input.advisory_id,
    content: input.content,
    usage: input.usage
  } as AdvisoryResult
}

export function isAdvisoryResult(value: unknown): boolean {
  return typeof value === 'object' && value !== null && (value as { advisory_only?: unknown }).advisory_only === true
}

// Canonical mutators call this first. Raw advisory output must never reach a Payload
// write without going through an explicit decision.
export function assertNotAdvisory(value: unknown): void {
  if (isAdvisoryResult(value)) {
    throw new Error('advisory output cannot be written to canonical state without an explicit CanonicalDecision')
  }
}

// The single sanctioned conversion point: an explicit decision tied to a decision event
// and a human/system actor. Canonical write APIs should accept ONLY this — never an
// AdvisoryResult or raw model output.
export interface CanonicalDecision {
  readonly decision_event_id: string
  readonly decided_by: string
  readonly source_advisory_id: string
  readonly canonical_patch: Record<string, unknown>
}

export function requireCanonicalDecision(input: unknown): CanonicalDecision {
  const candidate = input as Partial<CanonicalDecision>
  if (
    typeof input !== 'object' ||
    input === null ||
    typeof candidate.decision_event_id !== 'string' ||
    typeof candidate.decided_by !== 'string' ||
    typeof candidate.source_advisory_id !== 'string' ||
    typeof candidate.canonical_patch !== 'object' ||
    candidate.canonical_patch === null
  ) {
    throw new Error(
      'canonical write requires a CanonicalDecision { decision_event_id, decided_by, source_advisory_id, canonical_patch }'
    )
  }
  // The patch itself must not smuggle advisory output back in.
  assertNotAdvisory(candidate.canonical_patch)
  return input as CanonicalDecision
}
