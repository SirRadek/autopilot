import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { makeHandoffId } from "../../src/data/delivery-system/checkCompletionMatrix";
import {
  AGENT_HANDOFF_INDEX_PATH,
  AGENT_REGISTRY_PATH,
  SUBAGENT_EVIDENCE_PATH
} from "../../src/data/delivery-system/sessionState";
import {
  type AgentRegistryEntry,
  type SubagentEvidenceRecord,
  buildSubagentTree,
  readAgentRegistry,
  readCorrelationIndex,
  readSubagentEvidence,
  writeCorrelationEntry,
  writeSubagentEvidence
} from "../../src/data/delivery-system/subagentEvidence";

const temporaryDirectories: string[] = [];

function createStateDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "autopilot-subagent-evidence-"));
  temporaryDirectories.push(directory);
  return directory;
}

function writeJsonl(path: string, entries: readonly unknown[]): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`, "utf8");
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function createEvidenceRecord(
  overrides: Partial<Omit<SubagentEvidenceRecord, "schema_version">> = {}
): Omit<SubagentEvidenceRecord, "schema_version"> {
  return {
    handoff_id: makeHandoffId("hp-20260617-test"),
    agent_id: "agent-001",
    agent_type: "codex",
    parent_session_hash: "abc123",
    started_at: "2026-06-17T10:00:00.000Z",
    stopped_at: "2026-06-17T10:01:00.000Z",
    duration_seconds: 60,
    artifacts: {
      handoff_packet: "docs/autopilot/spike-artifacts/hp-20260617-test.md",
      worker_output: "docs/autopilot/spike-artifacts/hp-20260617-test-worker.json",
      reviewer_output: null
    },
    lock_status: "acquired",
    verified: true,
    recorded_at: "2026-06-17T10:02:00.000Z",
    ...overrides
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("subagent evidence", () => {
  it("exports bounded session evidence paths", () => {
    expect(AGENT_REGISTRY_PATH).toBe("docs/autopilot/session-state/agent-registry.jsonl");
    expect(AGENT_HANDOFF_INDEX_PATH).toBe("docs/autopilot/session-state/agent-handoff-index.jsonl");
    expect(SUBAGENT_EVIDENCE_PATH).toBe("docs/autopilot/session-state/subagent-evidence.jsonl");
  });

  it("writeCorrelationEntry appends valid JSON to agent-handoff-index.jsonl", () => {
    const stateDirectory = createStateDirectory();
    const handoffId = makeHandoffId("hp-20260617-test");

    writeCorrelationEntry(
      {
        agent_id: "agent-001",
        handoff_id: handoffId,
        correlated_at: "2026-06-17T10:02:00.000Z",
        source: "supervisor_assignment"
      },
      stateDirectory
    );

    const path = join(stateDirectory, "agent-handoff-index.jsonl");
    const entries = readJsonl<Record<string, unknown>>(path);

    expect(existsSync(path)).toBe(true);
    expect(entries.at(-1)).toEqual({
      schema_version: "v1",
      agent_id: "agent-001",
      handoff_id: handoffId,
      correlated_at: "2026-06-17T10:02:00.000Z",
      source: "supervisor_assignment"
    });
  });

  it("writeSubagentEvidence appends valid JSON to subagent-evidence.jsonl", () => {
    const stateDirectory = createStateDirectory();

    writeSubagentEvidence(createEvidenceRecord(), stateDirectory);

    const path = join(stateDirectory, "subagent-evidence.jsonl");
    const entries = readJsonl<Record<string, unknown>>(path);

    expect(existsSync(path)).toBe(true);
    expect(entries.at(-1)).toEqual({
      schema_version: "v1",
      ...createEvidenceRecord()
    });
  });

  it("readAgentRegistry returns an empty array when the file is absent", () => {
    expect(readAgentRegistry(createStateDirectory())).toEqual([]);
  });

  it("readAgentRegistry parses start and stop entries", () => {
    const stateDirectory = createStateDirectory();
    const startEntry: AgentRegistryEntry = {
      schema_version: "v1",
      event: "subagent_start",
      agent_id: "agent-001",
      agent_type: "codex",
      parent_session_hash: "abc123",
      parent_turn_hash: "turnhash",
      started_at: "2026-06-17T10:00:00.000Z"
    };
    const stopEntry: AgentRegistryEntry = {
      schema_version: "v1",
      event: "subagent_stop",
      agent_id: "agent-001",
      stopped_at: "2026-06-17T10:01:00.000Z"
    };

    writeJsonl(join(stateDirectory, "agent-registry.jsonl"), [startEntry, stopEntry]);

    expect(readAgentRegistry(stateDirectory)).toEqual([startEntry, stopEntry]);
  });

  it("readCorrelationIndex returns an empty array when the file is absent", () => {
    expect(readCorrelationIndex(createStateDirectory())).toEqual([]);
  });

  it("readSubagentEvidence returns an empty array when the file is absent", () => {
    expect(readSubagentEvidence(createStateDirectory())).toEqual([]);
  });

  it("buildSubagentTree returns the correlated tree for a known session hash", () => {
    const stateDirectory = createStateDirectory();
    const handoffId = makeHandoffId("hp-20260617-test");
    const evidence = createEvidenceRecord({ handoff_id: handoffId });

    writeJsonl(join(stateDirectory, "agent-registry.jsonl"), [
      {
        schema_version: "v1",
        event: "subagent_start",
        agent_id: "agent-001",
        agent_type: "codex",
        parent_session_hash: "abc123",
        parent_turn_hash: "turnhash",
        started_at: "2026-06-17T10:00:00.000Z"
      },
      {
        schema_version: "v1",
        event: "subagent_stop",
        agent_id: "agent-001",
        stopped_at: "2026-06-17T10:01:00.000Z"
      }
    ]);
    writeJsonl(join(stateDirectory, "agent-handoff-index.jsonl"), [
      {
        schema_version: "v1",
        agent_id: "agent-001",
        handoff_id: handoffId,
        correlated_at: "2026-06-17T10:02:00.000Z",
        source: "supervisor_assignment"
      }
    ]);
    writeJsonl(join(stateDirectory, "subagent-evidence.jsonl"), [{ schema_version: "v1", ...evidence }]);

    const tree = buildSubagentTree("abc123", stateDirectory);

    expect(tree.parent_session_hash).toBe("abc123");
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toEqual(
      expect.objectContaining({
        agent_id: "agent-001",
        handoff_id: handoffId,
        evidence: { schema_version: "v1", ...evidence },
        started_at: "2026-06-17T10:00:00.000Z",
        stopped_at: "2026-06-17T10:01:00.000Z"
      })
    );
  });

  it("buildSubagentTree returns empty children for an unknown session hash", () => {
    const stateDirectory = createStateDirectory();

    writeJsonl(join(stateDirectory, "agent-registry.jsonl"), [
      {
        schema_version: "v1",
        event: "subagent_start",
        agent_id: "agent-001",
        agent_type: "codex",
        parent_session_hash: "abc123",
        parent_turn_hash: "turnhash",
        started_at: "2026-06-17T10:00:00.000Z"
      }
    ]);

    expect(buildSubagentTree("unknown-hash", stateDirectory)).toEqual({
      parent_session_hash: "unknown-hash",
      children: []
    });
  });

  it("buildSubagentTree keeps child evidence null when correlation is absent", () => {
    const stateDirectory = createStateDirectory();

    writeJsonl(join(stateDirectory, "agent-registry.jsonl"), [
      {
        schema_version: "v1",
        event: "subagent_start",
        agent_id: "agent-uncorrelated",
        agent_type: "codex",
        parent_session_hash: "abc123",
        parent_turn_hash: "turnhash",
        started_at: "2026-06-17T10:00:00.000Z"
      }
    ]);

    const tree = buildSubagentTree("abc123", stateDirectory);

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toEqual(
      expect.objectContaining({
        agent_id: "agent-uncorrelated",
        handoff_id: null,
        evidence: null
      })
    );
  });
});
