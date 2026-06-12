import { describe, expect, it } from "vitest";

import {
  modelOutputEvaluationPolicy,
  selectModelOutputEvaluationRoute
} from "../../src/data/delivery-system/modelOutputEvaluation";

describe("model output evaluation policy", () => {
  it("requires scoring and source-grounded prompt tuning before accepting model output", () => {
    expect(modelOutputEvaluationPolicy.sourceOfTruth).toBe("local_eval_records_and_verified_outputs");
    expect(modelOutputEvaluationPolicy.dimensions).toEqual(
      expect.arrayContaining(["task_fit", "source_grounding", "workflow_compatibility"])
    );
    expect(modelOutputEvaluationPolicy.requiredChecks).toEqual(
      expect.arrayContaining([
        "model_output_scored_before_acceptance",
        "caveman_or_token_efficiency_route_selected",
        "provider_best_practice_sources_checked",
        "context7_or_official_docs_verified",
        "retry_loop_until_acceptable_or_blocked"
      ])
    );
    expect(modelOutputEvaluationPolicy.stopConditions).toContain("bad_output_retried_without_prompt_or_input_delta");
    expect(modelOutputEvaluationPolicy.evaluationRecordFields).toEqual(
      expect.arrayContaining(["record_version", "privacy_review", "route_review", "weekly_aggregate"])
    );
  });

  it("routes low-scored outputs into immediate prompt or input tuning", () => {
    const route = selectModelOutputEvaluationRoute({
      task: "Bad Gemini output for a handoff packet needs prompt tuning",
      score: 62,
      repeatedFailures: 1
    });

    expect(route.phase).toBe("learning_immediate_loop");
    expect(route.qualityState).toBe("retry_with_prompt_or_input_tuning");
    expect(route.nextActions).toContain("adjust_prompt_or_input_packet");
    expect(route.promptTuningActions).toContain("use_clear_direct_instructions");
    expect(route.sourceIds).toContain("gemini-api-prompting-strategies");
  });

  it("requires model or reasoning route review after repeated similar failures", () => {
    const route = selectModelOutputEvaluationRoute({
      task: "Claude agent validation keeps failing with repeated bad outputs for a similar task",
      score: 55,
      repeatedFailures: 3
    });

    expect(route.qualityState).toBe("review_model_or_reasoning_route");
    expect(route.requiredChecks).toContain("select_reasoning_model_route_rerun");
    expect(route.nextActions).toContain("rerun_reasoning_model_route");
    expect(route.escalationActions).toContain("switch_model_or_provider_only_after_entitlement_privacy_and_cost_checks");
    expect(route.stopConditions).toContain("route_review_skipped_after_repeated_bad_outputs");
  });

  it("switches to weekly batch tuning only when eval records are the input", () => {
    const route = selectModelOutputEvaluationRoute({
      task: "Weekly prompt tuning based on collected eval records and trend data",
      phase: "weekly_batch_tuning",
      score: 82,
      repeatedFailures: 0,
      provider: "openai"
    });

    expect(route.phase).toBe("weekly_batch_tuning");
    expect(route.qualityState).toBe("accepted");
    expect(route.requiredChecks).toContain("weekly_eval_summary_created");
    expect(route.stopConditions).toContain("weekly_prompt_change_without_eval_trend");
    expect(route.sourceIds).toEqual(expect.arrayContaining(["openai-evals", "openai-model-optimization"]));
  });

  it("blocks reruns when the problem is missing source, owner, or privacy context", () => {
    const route = selectModelOutputEvaluationRoute({
      task: "Blocked model output contains private data and missing source context",
      provider: "unknown"
    });

    expect(route.qualityState).toBe("blocked");
    expect(route.nextActions).toContain("record_blocker_owner_or_source_needed");
    expect(route.sourceIds).toEqual(expect.arrayContaining(["prompt-source-catalog", "prompt-library-policy"]));
  });

  it("blocks advisory runner artifacts that do not contain model output", () => {
    const route = selectModelOutputEvaluationRoute({
      task: "Gemini CLI syntax error produced a runner log with no model output after Claude and DeepSeek provider checks",
      provider: "google",
      runnerStatus: "failed",
      artifactKind: "runner_log",
      outputPresent: false
    });

    expect(route.qualityState).toBe("blocked");
    expect(route.requiredChecks).toEqual(
      expect.arrayContaining([
        "runner_artifact_contract_verified",
        "provider_run_status_recorded",
        "model_output_presence_verified",
        "blocked_state_recorded_when_output_missing"
      ])
    );
    expect(route.stopConditions).toEqual(
      expect.arrayContaining([
        "provider_run_failed_without_blocked_state",
        "model_output_missing_from_artifact",
        "advisory_workflow_continued_after_provider_error"
      ])
    );
    expect(route.nextActions).toEqual(
      expect.arrayContaining([
        "record_provider_run_artifact",
        "verify_model_output_presence",
        "set_progress_blocked_or_waiting_owner"
      ])
    );
  });
});
