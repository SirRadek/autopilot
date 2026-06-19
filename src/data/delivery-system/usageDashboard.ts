import {
  classifyBudgetState,
  type BudgetState,
  type MeasurementConfidence
} from "./modelSpend";
import type { ProviderBudget, UsageLedgerEntry } from "./usageLedger";

/**
 * Deterministic renderer for the usage dashboard (owner proposal §13). It consumes the
 * evidence spine (usage-ledger entries + provider-budget snapshots) and produces a
 * Markdown view of **work-share vs target** and **capacity traffic-light** per provider.
 *
 * Two distinct numbers are deliberately kept separate (the GPT-lane correction):
 *  - work_share_pct  = a provider's share of estimated tokens this period (how work was split)
 *  - remaining_pct   = that provider's remaining capacity (the traffic light)
 * They are NOT the same thing; conflating them is what made the original burn_pct wrong.
 */

/** Deviation beyond this (absolute, 0..1) earns a rebalance correction (owner §14). */
export const REBALANCE_DEVIATION_THRESHOLD = 0.15;

export interface ProviderTarget {
  readonly provider: string;
  /** Target work-share as a 0..1 fraction. */
  readonly share: number;
}

export interface UsageDashboardInput {
  readonly project: string;
  readonly phase?: string;
  readonly entries: readonly UsageLedgerEntry[];
  readonly budgets?: readonly ProviderBudget[];
  readonly targets?: readonly ProviderTarget[];
}

export interface ProviderRollup {
  readonly provider: string;
  readonly runs: number;
  readonly estimated_tokens: number;
  readonly work_share_pct: number;
  readonly target_share_pct: number | null;
  readonly deviation_pct: number | null;
  readonly remaining_pct: number | null;
  readonly measurement_confidence: MeasurementConfidence;
  readonly budget_state: BudgetState;
}

export interface UsageDashboard {
  readonly project: string;
  readonly phase: string | null;
  readonly total_runs: number;
  readonly total_estimated_tokens: number;
  readonly providers: readonly ProviderRollup[];
  readonly corrections: readonly string[];
  readonly report_markdown: string;
}

export function buildUsageDashboard(input: UsageDashboardInput): UsageDashboard {
  const targetByProvider = new Map((input.targets ?? []).map((target) => [target.provider, target.share]));
  const latestBudget = indexLatestBudgets(input.budgets ?? []);
  const grouped = groupByProvider(input.entries);
  const totalTokens = sum([...grouped.values()].map((group) => group.estimatedTokens));
  const totalRuns = input.entries.length;

  const providers = [...grouped.entries()]
    .map(([provider, group]): ProviderRollup => {
      const workShare = totalTokens > 0 ? group.estimatedTokens / totalTokens : 0;
      const target = targetByProvider.has(provider) ? (targetByProvider.get(provider) as number) : null;
      const budget = latestBudget.get(provider);
      const remainingPct = budget?.remaining_pct ?? group.latestRemainingPct;
      const confidence = budget?.confidence ?? group.latestConfidence;

      return {
        provider,
        runs: group.runs,
        estimated_tokens: group.estimatedTokens,
        work_share_pct: workShare,
        target_share_pct: target,
        deviation_pct: target === null ? null : workShare - target,
        remaining_pct: remainingPct,
        measurement_confidence: confidence,
        budget_state: classifyBudgetState(remainingPct, confidence)
      };
    })
    .sort((left, right) => right.estimated_tokens - left.estimated_tokens || left.provider.localeCompare(right.provider));

  const corrections = buildCorrections(providers);
  const dashboard = {
    project: input.project,
    phase: input.phase ?? null,
    total_runs: totalRuns,
    total_estimated_tokens: totalTokens,
    providers,
    corrections
  };

  return { ...dashboard, report_markdown: renderMarkdown(dashboard) };
}

interface ProviderGroup {
  runs: number;
  estimatedTokens: number;
  latestDate: string;
  latestRemainingPct: number | null;
  latestConfidence: MeasurementConfidence;
}

function groupByProvider(entries: readonly UsageLedgerEntry[]): Map<string, ProviderGroup> {
  const grouped = new Map<string, ProviderGroup>();

  for (const entry of entries) {
    const group = grouped.get(entry.provider) ?? {
      runs: 0,
      estimatedTokens: 0,
      latestDate: "",
      latestRemainingPct: null,
      latestConfidence: "unknown" as MeasurementConfidence
    };

    group.runs += 1;
    group.estimatedTokens += entry.estimated_tokens ?? 0;

    if (entry.date >= group.latestDate) {
      group.latestDate = entry.date;
      group.latestRemainingPct = entry.remaining_pct_after;
      group.latestConfidence = entry.measurement_confidence;
    }

    grouped.set(entry.provider, group);
  }

  return grouped;
}

function indexLatestBudgets(budgets: readonly ProviderBudget[]): Map<string, ProviderBudget> {
  const latest = new Map<string, ProviderBudget>();
  for (const budget of budgets) {
    const current = latest.get(budget.provider);
    if (!current || budget.updated_at >= current.updated_at) {
      latest.set(budget.provider, budget);
    }
  }
  return latest;
}

function buildCorrections(providers: readonly ProviderRollup[]): readonly string[] {
  const corrections: string[] = [];

  for (const provider of providers) {
    if (provider.budget_state === "red") {
      corrections.push(
        `${provider.provider}: capacity RED (${formatPct(provider.remaining_pct)} remaining) — critical tasks only, otherwise fall back to a cheaper model.`
      );
    } else if (provider.budget_state === "yellow" && provider.measurement_confidence === "unknown") {
      corrections.push(
        `${provider.provider}: capacity unmetered — treat its work-share as an estimate; expensive models for decisions only.`
      );
    }

    if (provider.deviation_pct !== null && Math.abs(provider.deviation_pct) > REBALANCE_DEVIATION_THRESHOLD) {
      const direction = provider.deviation_pct > 0 ? "over" : "under";
      corrections.push(
        `${provider.provider}: ${formatSignedPct(provider.deviation_pct)} ${direction} target — rebalance ONLY within tasks that suit this lane (never to hit a number).`
      );
    }
  }

  if (corrections.length === 0) {
    corrections.push("No correction needed: shares within tolerance and no capacity in the red.");
  }

  return corrections;
}

function renderMarkdown(dashboard: Omit<UsageDashboard, "report_markdown">): string {
  const lines = [
    "# AI Usage Dashboard",
    "",
    `- Project: ${dashboard.project}`,
    `- Phase: ${dashboard.phase ?? "(all)"}`,
    `- Runs: ${dashboard.total_runs} · Estimated tokens: ${dashboard.total_estimated_tokens.toLocaleString("en-US")}`,
    "",
    "## Work-share vs target & capacity",
    "",
    "| Provider | Runs | Work share | Target | Deviation | Remaining | State |",
    "| --- | ---: | ---: | ---: | ---: | ---: | :---: |"
  ];

  for (const provider of dashboard.providers) {
    lines.push(
      `| ${provider.provider} | ${provider.runs} | ${formatPct(provider.work_share_pct)} | ${formatPct(
        provider.target_share_pct
      )} | ${provider.deviation_pct === null ? "—" : formatSignedPct(provider.deviation_pct)} | ${formatPct(
        provider.remaining_pct
      )} | ${stateIcon(provider.budget_state)} |`
    );
  }

  lines.push("", "## Correction", ...dashboard.corrections.map((correction) => `- ${correction}`), "");
  return lines.join("\n");
}

function stateIcon(state: BudgetState): string {
  return state === "green" ? "🟢" : state === "yellow" ? "🟡" : "🔴";
}

function formatPct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatSignedPct(value: number): string {
  const points = Math.round(value * 100);
  return `${points > 0 ? "+" : ""}${points} pts`;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
