import { describe, expect, it } from "vitest";

import {
  type AlertSeverity,
  type AlertTrigger,
  type SupervisorAlert,
  createAlert,
  resolveAlert
} from "../../src/data/delivery-system/supervisorAlerts";

describe("supervisor alerts", () => {
  const severityCases: Array<[AlertTrigger, AlertSeverity]> = [
    ["provider_rate_limited", "warning"],
    ["provider_tier_switched", "info"],
    ["provider_unavailable", "blocker"],
    ["correction_loop_exceeded", "blocker"],
    ["stuck_workflow_state", "warning"],
    ["eval_score_below_threshold", "warning"],
    ["missing_owner_decision", "blocker"],
    ["gemini_session_exhausted", "warning"],
    ["reuse_check_skipped", "info"],
    ["skill_replacement_available", "info"]
  ];

  it.each(severityCases)("maps %s to %s severity", (trigger, severity) => {
    expect(createAlert(trigger, "ctx").severity).toBe(severity);
  });

  it("creates unique ids for repeated alerts", () => {
    const first = createAlert("reuse_check_skipped", "ctx");
    const second = createAlert("reuse_check_skipped", "ctx");

    expect(first.id).toMatch(/^alert-reuse-check-skipped-\d+$/);
    expect(second.id).toMatch(/^alert-reuse-check-skipped-\d+$/);
    expect(first.id).not.toBe(second.id);
  });

  it("resolves alerts without mutating the original alert", () => {
    const alert = createAlert("reuse_check_skipped", "ctx");
    const resolved = resolveAlert(alert);

    expect(resolved.resolved).toBe(true);
    expect(resolved.resolvedAt).toBeDefined();
    expect(alert.resolved).toBe(false);
    expect(alert.resolvedAt).toBeNull();
  });

  it("SupervisorAlert fields are readonly", () => {
    const alert = createAlert("provider_tier_switched", "ctx");

    // @ts-expect-error SupervisorAlert is immutable after creation.
    alert.resolved = true;

    expect((alert as SupervisorAlert).resolved).toBe(true);
  });
});
