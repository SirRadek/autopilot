import { describe, expect, it } from "vitest";

import {
  type HandoffPacket,
  isHandoffPacket,
  makeHandoffId,
  validateHandoffPacket
} from "../../src/data/delivery-system/checkCompletionMatrix";

describe("check completion matrix", () => {
  it("returns valid: false when handoff_id is missing", () => {
    const result = validateHandoffPacket({ goal: "implement button" });

    expect(result.valid).toBe(false);
    expect(result.missingSections).toContain("handoff_id");
  });

  it("returns all required sections for an empty packet", () => {
    const result = validateHandoffPacket({});

    expect(result.valid).toBe(false);
    expect(result.missingSections).toEqual([
      "handoff_id",
      "source_agent",
      "target_agent",
      "project",
      "mode",
      "goal",
      "scope",
      "allowed_files_or_surfaces",
      "forbidden_actions",
      "verified_facts",
      "expected_output",
      "required_checks",
      "stop_conditions",
      "context_budget"
    ]);
  });

  it("makeHandoffId rejects plain strings that do not match the handoff format", () => {
    expect(() => makeHandoffId("not-valid")).toThrow();
    expect(() => makeHandoffId("raw")).toThrow();
    expect(() => makeHandoffId("hp-20260617-test")).not.toThrow();
  });

  it("bounded_coding task requires reuse_check", () => {
    const packet = buildValidPacket();
    const result = validateHandoffPacket(packet, "bounded_coding");

    expect(result.valid).toBe(false);
    expect(result.missingSections).toEqual(["reuse_check"]);
  });

  it("complete packet validates successfully", () => {
    const packet = buildCompletePacket();

    expect(validateHandoffPacket(packet).valid).toBe(true);
    expect(validateHandoffPacket(packet).missingSections).toEqual([]);
    expect(validateHandoffPacket(packet, "bounded_coding").valid).toBe(true);
  });

  it("rejects packets with invalid enum and array field values", () => {
    const packet = {
      ...buildCompletePacket(),
      mode: "BAD_MODE" as never,
      allowedFilesOrSurfaces: "src/data/delivery-system/checkCompletionMatrix.ts" as never
    };
    const result = validateHandoffPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.missingSections).toEqual(expect.arrayContaining(["mode", "allowed_files_or_surfaces"]));
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "mode is present but invalid.",
        "allowed_files_or_surfaces is present but invalid."
      ])
    );
  });

  it("uses runtime shape checks in isHandoffPacket", () => {
    expect(isHandoffPacket(buildCompletePacket())).toBe(true);
    expect(isHandoffPacket({ ...buildCompletePacket(), contextBudget: { profile: "bad" } })).toBe(false);
  });

  it("rejects extra side-channel fields in runtime packet checks", () => {
    expect(isHandoffPacket({ ...buildCompletePacket(), raw_prompt: "do not store this" })).toBe(false);
    expect(isHandoffPacket({ ...buildCompletePacket(), tool_response: { output: "raw output" } })).toBe(false);
  });

  it("HandoffPacket requires a branded HandoffId", () => {
    const plainString = "hp-20260617-plain";

    // @ts-expect-error Plain strings must be created with makeHandoffId() first.
    const invalidTypedPacket: HandoffPacket = { ...buildCompletePacket(), handoffId: plainString };

    expect(invalidTypedPacket.handoffId).toBe(plainString);
  });
});

function buildValidPacket(): HandoffPacket {
  return {
    handoffId: makeHandoffId("hp-20260617-test"),
    sourceAgent: "claude-opus-supervisor",
    targetAgent: "codex-bounded-worker",
    project: "autopilot-control-plane",
    mode: "WRITE_ALLOWED",
    goal: "Implement a bounded delivery-system module.",
    scope: "Only the assigned files.",
    allowedFilesOrSurfaces: ["src/data/delivery-system/checkCompletionMatrix.ts"],
    forbiddenActions: ["Do not edit unrelated files."],
    verifiedFacts: ["The worker output schema exists."],
    expectedOutput: ["A typed validation result."],
    requiredChecks: ["npm.cmd run typecheck"],
    stopConditions: ["Missing required input."],
    reuseCheck: undefined,
    contextBudget: {
      profile: "standard_compact",
      maxFilesInPacket: 8,
      maxContextLines: 600
    }
  };
}

function buildCompletePacket(): HandoffPacket {
  return {
    ...buildValidPacket(),
    reuseCheck: {
      searchedPatterns: ["validateHandoffPacket", "HandoffId"],
      existingMatches: [],
      packageMatches: [],
      decision: "implement_new",
      reuseTarget: undefined
    }
  };
}
