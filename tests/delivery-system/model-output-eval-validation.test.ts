import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  formatModelOutputEvalValidationReport,
  validateModelOutputEvals
} from "../../scripts/validate-model-output-evals";

describe("model-output eval validation", () => {
  it("validates current schema, examples, and source catalog links", () => {
    const report = validateModelOutputEvals(process.cwd());

    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.checkedFiles).toContain("model-output-evals/model-output-eval-record.schema.json");
    expect(report.checkedFiles).toContain("model-output-evals/examples/learning-loop.accepted.example.json");
    expect(report.checkedFiles).toContain("prompt-library/source-catalog.json");
    expect(report.checkedRecords).toBeGreaterThanOrEqual(1);
  });

  it("formats validation reports for CLI output", () => {
    const report = validateModelOutputEvals(process.cwd());
    const formatted = formatModelOutputEvalValidationReport(report);

    expect(formatted).toContain("Model-output eval validation passed.");
    expect(formatted).toContain("Errors: 0");
  });

  it("rejects accepted records below the acceptance threshold", () => {
    const tempRoot = createModelOutputEvalFixture((record) => {
      record.score_by_dimension = {
        task_fit: 70,
        instruction_following: 70,
        source_grounding: 70,
        format_contract: 70,
        verification_readiness: 70,
        privacy_safety: 70,
        handoff_clarity: 70,
        token_efficiency: 70,
        workflow_compatibility: 70
      };
    });

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain("Accepted records must score at least 80 on average.");
  });

  it("rejects retry records without a meaningful prompt or input delta", () => {
    const tempRoot = createModelOutputEvalFixture((record) => {
      record.state = "retry_with_prompt_or_input_tuning";
      record.accepted_state = "not_accepted";
      record.prompt_or_input_delta = {
        changed: false,
        summary: "No meaningful change.",
        changed_fields: [],
        rollback_path: "No rollback needed."
      };
    });

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Retry records must include a meaningful prompt_or_input_delta."
    );
  });

  it("rejects repeated failures without model or reasoning route review", () => {
    const tempRoot = createModelOutputEvalFixture((record) => {
      record.state = "retry_with_prompt_or_input_tuning";
      record.accepted_state = "not_accepted";
      record.rerun_count = 3;
      record.failure_labels = ["repeated_failure"];
      record.prompt_or_input_delta = {
        changed: true,
        summary: "Clarified expected output and verification evidence.",
        changed_fields: ["expected_output", "verification"],
        rollback_path: "Restore previous prompt/input packet."
      };
    });

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Repeated failures must route to model/reasoning review or blocked state."
    );
  });

  it("rejects provider best-practice source ids that are missing from the source catalog", () => {
    const tempRoot = createModelOutputEvalFixture((record) => {
      record.provider_best_practice_sources = ["missing-provider-source"];
    });

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Unknown provider best-practice source id: missing-provider-source."
    );
  });

  it("rejects records that store raw output or unredacted sensitive data", () => {
    const tempRoot = createModelOutputEvalFixture((record) => {
      record.privacy_review = {
        redacted_context_only: false,
        raw_output_stored: true,
        raw_prompt_stored: false,
        raw_logs_stored: false,
        secrets_or_customer_data_stored: false,
        reviewer: "fixture"
      };
    });

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        "privacy_review.redacted_context_only must be true.",
        "privacy_review.raw_output_stored must be false."
      ])
    );
  });

  it("validates agent output contract examples without counting them as eval records", () => {
    const tempRoot = createModelOutputEvalFixture(() => {});

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(true);
    expect(report.checkedFiles).toContain("model-output-evals/worker-output.schema.json");
    expect(report.checkedFiles).toContain("model-output-evals/examples/valid-worker-output.json");
    expect(report.checkedRecords).toBe(1);
  });

  it("rejects worker output examples with invalid handoff ids", () => {
    const tempRoot = createModelOutputEvalFixture(() => {});
    const examplePath = join(tempRoot, "model-output-evals", "examples", "valid-worker-output.json");
    const example = JSON.parse(readFileSync(examplePath, "utf8")) as Record<string, unknown>;
    example.handoff_id = "plain-slug";
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Positive contract example $.handoff_id: must match pattern ^hp-[0-9]{8}-[a-z0-9][a-z0-9-]*$"
    );
  });

  it("rejects worker output examples with invalid date-time values", () => {
    const tempRoot = createModelOutputEvalFixture(() => {});
    const examplePath = join(tempRoot, "model-output-evals", "examples", "valid-worker-output.json");
    const example = JSON.parse(readFileSync(examplePath, "utf8")) as Record<string, unknown>;
    example.created = "2026-06-17";
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Positive contract example $.created: must be a valid RFC3339 date-time"
    );

    example.created = "2026-02-31T12:00:00.000Z";
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

    const impossibleDateReport = validateModelOutputEvals(tempRoot);

    expect(impossibleDateReport.ok).toBe(false);
    expect(impossibleDateReport.errors.map((error) => error.message)).toContain(
      "Positive contract example $.created: must be a valid RFC3339 date-time"
    );
  });

  it("requires a skip reason only when worker verification is skipped", () => {
    const tempRoot = createModelOutputEvalFixture(() => {});
    const examplePath = join(tempRoot, "model-output-evals", "examples", "valid-worker-output.json");
    const example = JSON.parse(readFileSync(examplePath, "utf8")) as Record<string, unknown>;
    example.verify_result = "skipped";
    delete example.verify_skip_reason;
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

    const skippedWithoutReasonReport = validateModelOutputEvals(tempRoot);

    expect(skippedWithoutReasonReport.ok).toBe(false);
    expect(skippedWithoutReasonReport.errors.map((error) => error.message)).toContain(
      "Positive contract example $.verify_skip_reason: is required"
    );

    example.verify_skip_reason = "";
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

    const skippedWithEmptyReasonReport = validateModelOutputEvals(tempRoot);

    expect(skippedWithEmptyReasonReport.ok).toBe(false);
    expect(skippedWithEmptyReasonReport.errors.map((error) => error.message)).toContain(
      "Positive contract example $.verify_skip_reason: must have at least 1 characters"
    );

    example.verify_result = "pass";
    example.verify_skip_reason = "Should not be present for passed verification.";
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

    const passWithSkipReasonReport = validateModelOutputEvals(tempRoot);

    expect(passWithSkipReasonReport.ok).toBe(false);
    expect(passWithSkipReasonReport.errors.map((error) => error.message)).toContain(
      "Positive contract example $: must not match the disallowed schema"
    );
  });

  it("rejects sensitive values inside agent output contract examples", () => {
    const tempRoot = createModelOutputEvalFixture(() => {});
    const examplePath = join(tempRoot, "model-output-evals", "examples", "valid-worker-output.json");
    const example = JSON.parse(readFileSync(examplePath, "utf8")) as Record<string, unknown>;
    example.blocked_items = [`sk-proj-${"a".repeat(32)}`];
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

    const report = validateModelOutputEvals(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "$.blocked_items[0]: value looks like a secret or credential."
    );
  });
});

function createModelOutputEvalFixture(mutator: (record: Record<string, unknown>) => void): string {
  const tempRoot = mkdtempSync(join(tmpdir(), "autopilot-model-output-evals-"));
  const evalRoot = join(tempRoot, "model-output-evals");
  const recordsRoot = join(evalRoot, "records");
  const examplesRoot = join(evalRoot, "examples");
  const promptRoot = join(tempRoot, "prompt-library");

  mkdirSync(recordsRoot, { recursive: true });
  mkdirSync(examplesRoot, { recursive: true });
  mkdirSync(promptRoot, { recursive: true });

  writeFileSync(
    join(evalRoot, "model-output-eval-record.schema.json"),
    readFileSync(join(process.cwd(), "model-output-evals", "model-output-eval-record.schema.json"), "utf8"),
    "utf8"
  );
  writeFileSync(
    join(promptRoot, "source-catalog.json"),
    readFileSync(join(process.cwd(), "prompt-library", "source-catalog.json"), "utf8"),
    "utf8"
  );
  copyRepositoryFile(tempRoot, "model-output-evals/worker-output.schema.json");
  copyRepositoryFile(tempRoot, "model-output-evals/reviewer-output.schema.json");
  copyRepositoryFile(tempRoot, "model-output-evals/examples/valid-worker-output.json");
  copyRepositoryFile(tempRoot, "model-output-evals/examples/invalid-worker-output.json");
  copyRepositoryFile(tempRoot, "model-output-evals/examples/valid-reviewer-output.json");

  const record = createValidEvalRecord();
  mutator(record);
  writeFileSync(join(recordsRoot, "fixture.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return tempRoot;
}

function createValidEvalRecord(): Record<string, unknown> {
  return {
    record_version: "v0.1",
    eval_id: "fixture-model-output-eval",
    created: "2026-06-11",
    project: {
      slug: "autopilot-control-plane",
      name: "Autopilot Control Plane",
      control_plane: true
    },
    task: {
      task_type: "evaluation",
      summary: "Fixture for model-output eval validation.",
      risk_level: "medium"
    },
    phase: "learning_immediate_loop",
    state: "accepted",
    model_or_worker: {
      provider: "local",
      name: "deterministic-validator",
      role: "qa"
    },
    reasoning_profile: {
      route: "deterministic_tools",
      reasoning_effort: "none",
      change_policy: "Do not change model route from fixture."
    },
    token_efficiency_profile: {
      mode: "caveman",
      context_scope: "Schema and source catalog only.",
      caveman_applied: true
    },
    provider_best_practice_sources: ["local-agents-md", "token-efficiency-operating-model"],
    input_packet_summary: {
      summary: "Bounded fixture.",
      allowed_context: ["model-output-evals/model-output-eval-record.schema.json"],
      forbidden_context: ["raw prompts", "raw output", "raw logs", "secrets"],
      source_pointers: ["docs/autopilot/model-output-evaluation-operating-model.md"]
    },
    output_pointer: {
      kind: "local_file",
      pointer: "model-output-evals/records/fixture.json",
      summary: "Fixture pointer."
    },
    score_by_dimension: {
      task_fit: 90,
      instruction_following: 90,
      source_grounding: 90,
      format_contract: 90,
      verification_readiness: 90,
      privacy_safety: 100,
      handoff_clarity: 90,
      token_efficiency: 90,
      workflow_compatibility: 90
    },
    failure_labels: [],
    prompt_or_input_delta: {
      changed: false,
      summary: "No delta for accepted fixture.",
      changed_fields: [],
      rollback_path: "Remove fixture."
    },
    rerun_count: 0,
    accepted_state: "accepted",
    verification_evidence: [
      {
        type: "local_test",
        status: "passed",
        evidence: "Fixture validation.",
        source_pointer: "tests/delivery-system/model-output-eval-validation.test.ts"
      }
    ],
    source_pointers: [
      "docs/autopilot/model-output-evaluation-operating-model.md",
      "prompt-library/source-catalog.json"
    ],
    privacy_review: {
      redacted_context_only: true,
      raw_output_stored: false,
      raw_prompt_stored: false,
      raw_logs_stored: false,
      secrets_or_customer_data_stored: false,
      reviewer: "fixture"
    }
  };
}

function copyRepositoryFile(tempRoot: string, repoPath: string): void {
  writeFileSync(join(tempRoot, repoPath), readFileSync(join(process.cwd(), repoPath), "utf8"), "utf8");
}
