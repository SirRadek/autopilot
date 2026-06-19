import type { MeasurementConfidence } from "./modelSpend";

/**
 * The shared evidence spine. One append-only redacted store serves BOTH burn-rate
 * governance and the learning loop (mesh-map gaps G2/G5): per-run usage records plus
 * a per-provider budget snapshot. No raw prompts, secrets, or transcripts — only the
 * fields below. See multi-model-orchestration-operating-model.md §5.
 */

export type ModelSurface = "api" | "cli" | "web_ui" | "local";

export type QuotaSource =
  | "api_usage"
  | "response_usage"
  | "dashboard_manual"
  | "local_estimate"
  | "unknown";

export type CapacityKind = "messages" | "tokens" | "credits" | "requests" | "unknown";

/** Keys that must be present on every usage-ledger line (may be `false`/`0`, but not absent). */
export const requiredUsageLedgerKeys = [
  "date",
  "project",
  "phase",
  "lane",
  "provider",
  "model",
  "surface",
  "reasoning",
  "context_level",
  "task_type",
  "quota_source",
  "measurement_confidence",
  "used_in_final_plan"
] as const;

/** Numeric keys that are allowed to be `null` when no reliable meter exists. */
export const usageLedgerNullableNumberKeys = [
  "estimated_tokens",
  "actual_tokens",
  "remaining_pct_before",
  "remaining_pct_after",
  "quality_score"
] as const;

export interface UsageLedgerEntry {
  date: string;
  project: string;
  phase: string;
  lane: string;
  provider: string;
  model: string;
  surface: ModelSurface;
  reasoning: string;
  context_level: string;
  task_type: string;
  estimated_tokens: number | null;
  actual_tokens: number | null;
  quota_source: QuotaSource;
  measurement_confidence: MeasurementConfidence;
  /** 0..1 fraction of capacity remaining before/after the run, or null if unmetered. */
  remaining_pct_before: number | null;
  remaining_pct_after: number | null;
  /** 0..1 quality signal, or null until scored. Needs a rubric to avoid pseudo-authority. */
  quality_score: number | null;
  used_in_final_plan: boolean;
  notes?: string;
}

/** Keys that must be present on a provider-budget snapshot. */
export const requiredProviderBudgetKeys = [
  "provider",
  "surface",
  "period",
  "capacity_kind",
  "source",
  "confidence",
  "updated_at"
] as const;

export interface ProviderBudget {
  provider: string;
  surface: ModelSurface;
  /** e.g. daily | weekly | per_5h — whatever the provider's reset window is. */
  period: string;
  capacity_kind: CapacityKind;
  capacity_total: number | null;
  consumed: number | null;
  remaining: number | null;
  /** 0..1 fraction, or null when the meter is hidden (then confidence is unknown). */
  remaining_pct: number | null;
  source: QuotaSource;
  confidence: MeasurementConfidence;
  updated_at: string;
}
