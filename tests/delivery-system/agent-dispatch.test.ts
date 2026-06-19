import { describe, expect, it } from "vitest";

import { validateAgentDispatchPacket } from "../../src/lib/delivery-system/agentDispatch";

const validPacket = {
  dispatch_id: "2026-06-19-orchestration-technical",
  lane: "technical",
  provider: "openai",
  model: "codex",
  prompt: "Act as the hard technical opponent to the merged concept and return fatal issues.",
  prompt_path: ".agent/dispatch/2026-06-19-orchestration-technical.md",
  created_at: "2026-06-19T08:00:00.000Z"
};

describe("agent dispatch packet contract", () => {
  it("accepts a durable, non-empty dispatch", () => {
    expect(validateAgentDispatchPacket(validPacket)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an empty prompt (the temp-file-cleared bug)", () => {
    expect(validateAgentDispatchPacket({ ...validPacket, prompt: "" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("must never reach a vendor")])
    });
  });

  it("rejects a whitespace-only prompt", () => {
    expect(validateAgentDispatchPacket({ ...validPacket, prompt: "   \n  " })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("too short to dispatch")])
    });
  });

  it("rejects a prompt persisted to a volatile temp path", () => {
    expect(
      validateAgentDispatchPacket({ ...validPacket, prompt_path: "/tmp/p_codex2.txt" })
    ).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("volatile location")])
    });
  });

  it("rejects the Windows per-user Temp folder as a prompt path", () => {
    expect(
      validateAgentDispatchPacket({
        ...validPacket,
        prompt_path: "C:\\Users\\sirok\\AppData\\Local\\Temp\\packet.txt"
      })
    ).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("volatile location")])
    });
  });

  it("reports missing mandatory fields", () => {
    expect(validateAgentDispatchPacket({ dispatch_id: "missing-fields" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        "lane is required",
        "provider is required",
        "model is required",
        "prompt is required",
        "prompt_path is required",
        "created_at is required"
      ])
    });
  });
});
