import { describe, expect, it } from "vitest";

import {
  protectiveSupervisionPolicy,
  selectProtectiveSupervisionRoute
} from "../../src/data/delivery-system/protectiveSupervision";
import { findRole, roleHasPermission } from "../../src/data/delivery-system/roles";

describe("protective supervision policy", () => {
  it("keeps the protective supervisor read-only until owner approval", () => {
    expect(protectiveSupervisionPolicy.agentId).toBe("protective-supervisor");
    expect(protectiveSupervisionPolicy.mode).toBe("read_only_guardrail_until_owner_approval");
    expect(protectiveSupervisionPolicy.sourceOfTruth).toBe("decision_mesh_and_project_work_logs");
    expect(protectiveSupervisionPolicy.stopConditions).toContain("remote_mutation_without_approval");
    expect(protectiveSupervisionPolicy.stopConditions).toContain("duplicate_runtime_queue");
  });

  it("routes currentness checks, handoff compilation, progress tracking, and blockers", () => {
    const route = selectProtectiveSupervisionRoute({
      task: "Check latest official docs, process agent output into next agent packet, track progress, and flag blockers"
    });

    expect(route.lanes).toEqual(
      expect.arrayContaining(["currentness_sentinel", "handoff_compiler", "progress_ledger", "blocker_review"])
    );
    expect(route.requiredChecks).toEqual(
      expect.arrayContaining([
        "official_docs_or_context7_for_currentness",
        "agent_output_normalized",
        "next_agent_scope_declared",
        "progress_state_updated",
        "blocker_owner_declared"
      ])
    );
  });

  it("defines project progress states and stop conditions for stale handoffs", () => {
    expect(protectiveSupervisionPolicy.progressStates).toEqual(
      expect.arrayContaining(["ready", "in_progress", "needs_review", "blocked", "waiting_owner", "done"])
    );
    expect(protectiveSupervisionPolicy.stopConditions).toContain("raw_agent_output_used_as_next_prompt");
    expect(protectiveSupervisionPolicy.stopConditions).toContain("stale_progress_ledger");
  });

  it("registers the protective supervisor role without delivery approval authority", () => {
    const role = findRole("protective-supervisor");

    expect(role?.layer).toBe("autopilot");
    expect(role?.responsibilities).toContain("compile reviewed agent outputs into next-agent handoff packets");
    expect(roleHasPermission("protective-supervisor", "monitor_runs")).toBe(true);
    expect(roleHasPermission("protective-supervisor", "approve_delivery")).toBe(false);
  });
});
