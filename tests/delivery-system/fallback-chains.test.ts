import { describe, expect, it } from "vitest";

import {
  resolveFallback,
  subscriptionFallbackChains
} from "../../src/data/delivery-system/fallbackChains";
import {
  type SubscriptionSessionBudget,
  geminiKnownTiers
} from "../../src/data/delivery-system/subscriptionBudget";

const geminiBudget: SubscriptionSessionBudget = {
  provider: "gemini_cli",
  activeTierId: "gemini_auto",
  activeTierRateLimitState: "rate_limited",
  rateLimitHitAt: "2026-06-17T00:00:00.000Z",
  lastAttemptedAt: "2026-06-17T00:00:00.000Z",
  availableTiers: geminiKnownTiers,
  exhaustedTierIds: ["gemini_auto"],
  sessionTaskCount: 1,
  lastSuccessfulTaskAt: undefined,
  notes: undefined
};

const geminiAllExhaustedBudget: SubscriptionSessionBudget = {
  ...geminiBudget,
  exhaustedTierIds: ["gemini_auto", "gemini_flash", "gemini_pro"]
};

const claudeBudget: SubscriptionSessionBudget = {
  provider: "anthropic_claude_subscription",
  activeTierId: undefined,
  activeTierRateLimitState: "unknown",
  rateLimitHitAt: undefined,
  lastAttemptedAt: undefined,
  availableTiers: [],
  exhaustedTierIds: [],
  sessionTaskCount: 0,
  lastSuccessfulTaskAt: undefined,
  notes: undefined
};

describe("subscription fallback chains", () => {
  it("resolves Gemini flash when auto is rate-limited", () => {
    const result = resolveFallback("rate_limited", "gemini_cli", geminiBudget);

    expect(result?.toProvider).toBe("gemini_cli");
    expect(result?.toTierId).toBe("gemini_flash");
  });

  it("returns blocked when all Gemini tiers are exhausted", () => {
    const result = resolveFallback("rate_limited", "gemini_cli", geminiAllExhaustedBudget);

    expect(result?.toProvider).toBe("blocked");
  });

  it("routes Claude unavailability to owner decision", () => {
    const result = resolveFallback("provider_unavailable", "anthropic_claude_subscription", claudeBudget);

    expect(result?.toProvider).toBe("owner_decision");
  });

  it("never substitutes Gemini with another provider", () => {
    const geminiSteps = subscriptionFallbackChains.filter((step) => step.fromProvider === "gemini_cli");

    expect(geminiSteps.every((step) => ["gemini_cli", "blocked"].includes(step.toProvider))).toBe(true);
  });

  it("keeps Claude orchestration unavailable state behind owner decision", () => {
    const claudeSteps = subscriptionFallbackChains.filter(
      (step) => step.fromProvider === "anthropic_claude_subscription"
    );

    expect(claudeSteps.every((step) => step.toProvider === "owner_decision")).toBe(true);
  });
});
