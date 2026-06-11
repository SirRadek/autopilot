import { describe, expect, it } from "vitest";

import {
  localHardwareProfile,
  localWorkerPolicies,
  selectLocalWorkerRoute
} from "../../src/data/delivery-system/localWorkers";

describe("local worker routing policy", () => {
  it("records this computer's local no-cost worker baseline", () => {
    expect(localHardwareProfile.ramGb).toBeGreaterThanOrEqual(32);
    expect(localHardwareProfile.vramGb).toBe(8);
    expect(localHardwareProfile.runtime).toEqual(expect.arrayContaining(["ollama", "node", "python"]));
    expect(localHardwareProfile.installedModels).toContain("qwen2.5-coder:7b");
  });

  it("keeps Qwen 7B available and Qwen 14B as the max local coding candidate", () => {
    const qwen7b = localWorkerPolicies.find((worker) => worker.id === "qwen2_5_coder_7b_fast");
    const qwen14b = localWorkerPolicies.find((worker) => worker.id === "qwen2_5_coder_14b_max");

    expect(qwen7b).toMatchObject({
      status: "available",
      modelTag: "qwen2.5-coder:7b"
    });
    expect(qwen14b).toMatchObject({
      status: "candidate_install_required",
      modelTag: "qwen2.5-coder:14b"
    });
    expect(qwen14b?.requiredChecks).toContain("hardware_budget_verified");
    expect(qwen14b?.stopConditions).toContain("local_model_unavailable");
  });

  it("routes micro coding to the installed fast local Qwen worker", () => {
    const route = selectLocalWorkerRoute({
      task: "Draft a small single file DTO test"
    });

    expect(route.route).toBe("qwen_fast_worker");
    expect(route.selectedWorkers).toContain("qwen2_5_coder_7b_fast");
    expect(route.requiredChecks).toContain("bounded_file_scope");
    expect(route.handoff).toContain("deterministic_tests_run_before_acceptance");
  });

  it("routes verification-only tasks to deterministic tools first", () => {
    const route = selectLocalWorkerRoute({
      task: "Run verify, typecheck, build, and git diff check"
    });

    expect(route.route).toBe("deterministic_first");
    expect(route.selectedWorkers).toEqual(expect.arrayContaining(["local_static_analysis", "local_test_runner"]));
    expect(route.selectedWorkers).not.toContain("qwen2_5_coder_7b_fast");
    expect(route.taskKinds).toContain("deterministic_verification");
    expect(route.requiredChecks).toContain("record_command_evidence");
  });

  it("routes bounded refactors to the Qwen 14B max worker with install gates", () => {
    const route = selectLocalWorkerRoute({
      task: "Use Qwen 14B maximum for a bounded multi file refactor and test generation"
    });

    expect(route.route).toBe("qwen_max_worker");
    expect(route.selectedWorkers).toContain("qwen2_5_coder_14b_max");
    expect(route.requiredChecks).toContain("model_install_confirmed");
    expect(route.stopConditions).toContain("hardware_budget_unverified");
  });

  it("keeps architecture and security review out of local worker approval", () => {
    const route = selectLocalWorkerRoute({
      task: "Review security architecture for public API auth"
    });

    expect(route.route).toBe("human_or_frontier_review");
    expect(route.selectedWorkers).toContain("local_search_index");
    expect(route.stopConditions).toContain("private_secret_in_prompt");
    expect(route.handoff).toContain("supervisor_reviews_diff_or_claims");
  });
});
