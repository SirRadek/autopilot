import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { makeHandoffId } from "../../src/data/delivery-system/checkCompletionMatrix";
import {
  HISTORY_MAX_ENTRIES,
  SESSION_HISTORY_PATH,
  SESSION_LOCK_PATH,
  SESSION_STATE_PATH,
  createHistoryEntry,
  createInitialSessionState
} from "../../src/data/delivery-system/sessionState";

describe("session state", () => {
  it("uses literal schema version v1", () => {
    const state = createInitialSessionState();
    const schemaVersion: "v1" = state.schemaVersion;

    expect(schemaVersion).toBe("v1");
  });

  it("exports bounded session state paths and history limit", () => {
    expect(SESSION_STATE_PATH).toBe("docs/autopilot/session-state/session.json");
    expect(SESSION_HISTORY_PATH).toBe("docs/autopilot/session-state/history.jsonl");
    expect(SESSION_LOCK_PATH).toMatch(/worker\.lock$/);
    expect(HISTORY_MAX_ENTRIES).toBe(50);
  });

  it("creates initial state with safe defaults", () => {
    const state = createInitialSessionState();

    expect(state.workflowState).toBe("planning");
    expect(state.activeHandoffId).toBeNull();
    expect(state.pendingAlerts).toEqual([]);
    expect(state.activeCorrectionLoopCount).toBe(0);
    expect(state.hookEventCount).toBe(0);
    expect(state.investigationQueueDepth).toBe(0);
  });

  it("creates redacted history entries with optional handoff ids", () => {
    const handoffId = makeHandoffId("hp-20260617-session-state");
    const entry = createHistoryEntry("handoff_created", "Created bounded worker handoff.", handoffId);

    expect(entry.event).toBe("handoff_created");
    expect(entry.detail).toBe("Created bounded worker handoff.");
    expect(entry.handoffId).toBe(handoffId);
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("serializes absent handoff ids as null instead of dropping keys", () => {
    const state = createInitialSessionState();
    const entry = createHistoryEntry("session_start", "Started session.");

    expect(JSON.parse(JSON.stringify(state))).toHaveProperty("activeHandoffId", null);
    expect(JSON.parse(JSON.stringify(entry))).toHaveProperty("handoffId", null);
  });

  it("does not import file-system APIs in the typed state module", () => {
    const source = readFileSync(join(process.cwd(), "src/data/delivery-system/sessionState.ts"), "utf8");

    expect(source).not.toMatch(/from ["']node:fs["']/);
    expect(source).not.toMatch(/from ["']fs["']/);
    expect(source).not.toContain("readFileSync");
    expect(source).not.toContain("writeFileSync");
  });

  it("ignores generated session-state runtime files", () => {
    const ignoreFile = readFileSync(join(process.cwd(), "docs/autopilot/session-state/.gitignore"), "utf8");

    expect(ignoreFile).toContain("*.json");
    expect(ignoreFile).toContain("*.jsonl");
    expect(ignoreFile).toContain("*.lock");
  });
});
