import { describe, expect, it } from "vitest";

import {
  type SubscriptionSessionBudget,
  geminiKnownTiers
} from "../../src/data/delivery-system/subscriptionBudget";

describe("subscription budget policy", () => {
  it("tracks three known Gemini CLI tiers", () => {
    expect(geminiKnownTiers).toHaveLength(3);
    expect(geminiKnownTiers.map((tier) => tier.tierId)).toEqual([
      "gemini_auto",
      "gemini_flash",
      "gemini_pro"
    ]);
  });

  it("marks only gemini_auto as locally verified", () => {
    expect(geminiKnownTiers.find((tier) => tier.tierId === "gemini_auto")?.verifiedLocally).toBe(true);
    expect(geminiKnownTiers.find((tier) => tier.tierId === "gemini_flash")?.verifiedLocally).toBe(false);
    expect(geminiKnownTiers.find((tier) => tier.tierId === "gemini_pro")?.verifiedLocally).toBe(false);
  });

  it("does not hardcode CLI access paths for unverified flash or pro tiers", () => {
    expect(geminiKnownTiers.find((tier) => tier.tierId === "gemini_flash")?.cliAccessPath).toBeUndefined();
    expect(geminiKnownTiers.find((tier) => tier.tierId === "gemini_pro")?.cliAccessPath).toBeUndefined();
  });

  it("includes lastAttemptedAt on session budgets", () => {
    const budget: SubscriptionSessionBudget = {
      provider: "gemini_cli",
      activeTierId: "gemini_auto",
      activeTierRateLimitState: "available",
      rateLimitHitAt: undefined,
      lastAttemptedAt: undefined,
      availableTiers: geminiKnownTiers,
      exhaustedTierIds: [],
      sessionTaskCount: 0,
      lastSuccessfulTaskAt: undefined,
      notes: undefined
    };

    expect(budget.lastAttemptedAt).toBeUndefined();
  });
});
