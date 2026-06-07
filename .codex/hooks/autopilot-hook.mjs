import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK_VERSION = 1;
const MAX_LEDGER_ENTRIES = 200;
const MAX_LEDGER_BYTES = 256 * 1024;
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), "..", "..");
const STATE_DIRECTORY =
  process.env.AUTOPILOT_HOOK_STATE_DIR || join(REPOSITORY_ROOT, ".codex", "state");
const LEDGER_PATH = join(STATE_DIRECTORY, "events.jsonl");
const CONTINUITY_PATH = join(STATE_DIRECTORY, "continuity.json");

const REQUIRED_CONTROL_PLANE_PATHS = [
  "AGENTS.md",
  "mesh",
  "docs/projects/autopilot-control-plane/architecture.md",
  "docs/projects/autopilot-control-plane/work-log.md",
  "docs/projects/autopilot-control-plane/decision-mesh"
];

const SECRET_PATTERNS = [
  /\bsk-(?:proj-)?[a-z0-9_-]{20,}\b/i,
  /\bgh[pousr]_[a-z0-9]{20,}\b/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{25,}\b/,
  /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["']?[a-z0-9_./+=-]{16,}/i
];

const RISK_PATTERNS = {
  destructive_command: [
    /\bgit\s+reset\s+--hard\b/i,
    /\bgit\s+clean\s+-[a-z]*f/i,
    /\brm\s+-rf\b/i,
    /\bRemove-Item\b[\s\S]*\b-Recurse\b/i,
    /\bdel\s+\/[sq]\b/i,
    /\bformat\s+[a-z]:/i,
    /\bDROP\s+(?:DATABASE|TABLE)\b/i,
    /\bTRUNCATE\s+TABLE\b/i
  ],
  remote_mutation: [
    /\bgit\s+push\b/i,
    /\bgh\s+(?:api|issue|pr|release|repo|workflow)\b[\s\S]*\b(?:close|create|delete|edit|merge|run)\b/i,
    /\bwrangler\s+(?:deploy|publish|d1\s+execute)\b/i,
    /\bvercel\b[\s\S]*(?:--prod|\bdeploy\b)/i,
    /\bnpm\s+publish\b/i,
    /\bdocker\s+push\b/i,
    /\bcurl\b[\s\S]*\b(?:POST|PUT|PATCH|DELETE)\b/i
  ],
  deployment_or_production: [
    /\b(?:deploy|deployment|production|publish|promote|rollback)\b/i,
    /\b(?:wrangler|vercel|cloudflare|github actions)\b/i
  ],
  credential_surface: [
    /(?:^|[\\/])\.env(?:[./\\]|$)/i,
    /(?:credential|private[_-]?key|secret|token)/i,
    /(?:^|[\\/])\.codex[\\/](?:auth|credential)/i
  ],
  governance_surface: [
    /(?:^|[\\/])AGENTS\.md\b/i,
    /(?:^|[\\/])mesh[\\/]/i,
    /(?:^|[\\/])mcp[\\/]/i,
    /(?:^|[\\/])docs[\\/]projects[\\/]/i,
    /(?:^|[\\/])\.codex[\\/]hooks/i
  ],
  external_model_or_api: [
    /\b(?:gemini|claude|openai)\b[\s\S]*(?:cli|api|prompt|model)/i,
    /\bcurl\b[\s\S]*https?:\/\//i
  ]
};

function hash(value) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16);
}

function toJsonText(value, limit = 24_000) {
  try {
    const text = JSON.stringify(value);
    return text.length > limit ? text.slice(0, limit) : text;
  } catch {
    return "";
  }
}

function collectFlags(text) {
  const flags = [];

  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) {
    flags.push("secret_like_input");
  }

  for (const [flag, patterns] of Object.entries(RISK_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) {
      flags.push(flag);
    }
  }

  return flags;
}

function classifyScope(cwd) {
  if (!cwd || !isAbsolute(cwd)) {
    return "unknown";
  }

  const pathFromRoot = relative(REPOSITORY_ROOT, resolve(cwd));
  return pathFromRoot === "" || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot))
    ? "autopilot_control_plane"
    : "external_or_supervised_project";
}

function getToolText(input) {
  const toolInput = input.tool_input;

  if (toolInput && typeof toolInput === "object" && typeof toolInput.command === "string") {
    return toolInput.command;
  }

  return toJsonText(toolInput);
}

function responseLooksFailed(response) {
  if (!response || typeof response !== "object") {
    return false;
  }

  if (response.isError === true || response.ok === false) {
    return true;
  }

  for (const field of ["exit_code", "exitCode"]) {
    if (typeof response[field] === "number" && response[field] !== 0) {
      return true;
    }
  }

  if (typeof response.statusCode === "number" && response.statusCode >= 400) {
    return true;
  }

  const text = toJsonText(response, 8_000);
  return /(?:exit code|process exited with code)\s*[:=]?\s*[1-9]\d*/i.test(text);
}

function eventRecord(input, flags = [], result = "observed") {
  const inputFingerprint =
    input.hook_event_name === "UserPromptSubmit"
      ? hash(input.prompt)
      : hash(getToolText(input) || input.last_assistant_message || input.trigger || input.source);

  return {
    version: HOOK_VERSION,
    timestamp: new Date().toISOString(),
    event: String(input.hook_event_name || "Unknown"),
    scope: classifyScope(input.cwd),
    session: hash(input.session_id),
    turn: hash(input.turn_id),
    tool: typeof input.tool_name === "string" ? input.tool_name : null,
    flags: [...new Set(flags)].sort(),
    result,
    input_fingerprint: inputFingerprint
  };
}

function ensureStateDirectory() {
  mkdirSync(STATE_DIRECTORY, { recursive: true });
}

function trimLedgerIfNeeded() {
  if (!existsSync(LEDGER_PATH) || statSync(LEDGER_PATH).size <= MAX_LEDGER_BYTES) {
    return;
  }

  const lines = readFileSync(LEDGER_PATH, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-MAX_LEDGER_ENTRIES);
  const temporaryPath = `${LEDGER_PATH}.tmp`;
  writeFileSync(temporaryPath, `${lines.join("\n")}\n`, "utf8");
  renameSync(temporaryPath, LEDGER_PATH);
}

function record(input, flags = [], result = "observed") {
  try {
    ensureStateDirectory();
    appendFileSync(LEDGER_PATH, `${JSON.stringify(eventRecord(input, flags, result))}\n`, "utf8");
    trimLedgerIfNeeded();
    return true;
  } catch {
    return false;
  }
}

function readRecentTurnEvents(input) {
  try {
    if (!existsSync(LEDGER_PATH)) {
      return [];
    }

    const turn = hash(input.turn_id);
    return readFileSync(LEDGER_PATH, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-MAX_LEDGER_ENTRIES)
      .map((line) => JSON.parse(line))
      .filter((entry) => entry.turn === turn);
  } catch {
    return [];
  }
}

function writeContinuity(input) {
  try {
    ensureStateDirectory();
    const recentEvents = readRecentTurnEvents(input);
    const flags = [...new Set(recentEvents.flatMap((entry) => entry.flags || []))].sort();
    const payload = {
      version: HOOK_VERSION,
      updated_at: new Date().toISOString(),
      session: hash(input.session_id),
      turn: hash(input.turn_id),
      trigger: input.trigger || null,
      scope: classifyScope(input.cwd),
      recent_event_count: recentEvents.length,
      recent_flags: flags,
      required_sources: [
        "AGENTS.md",
        "Decision Mesh packet",
        "project architecture and work log",
        "local verification evidence"
      ]
    };
    const temporaryPath = `${CONTINUITY_PATH}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    renameSync(temporaryPath, CONTINUITY_PATH);
    return true;
  } catch {
    return false;
  }
}

function additionalContext(eventName, messages, systemMessage) {
  const response = {
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext: messages.join(" ")
    }
  };

  if (systemMessage) {
    response.systemMessage = systemMessage;
  }

  return response;
}

function riskMessages(flags, scope) {
  const messages = [];

  if (flags.includes("secret_like_input") || flags.includes("credential_surface")) {
    messages.push(
      "Potential credential or secret material is present. Do not print, persist, or send it to external tools; redact and verify the intended surface."
    );
  }

  if (flags.includes("destructive_command")) {
    messages.push(
      "Potential destructive operation detected. Confirm the exact resolved target, backup or rollback, and explicit owner scope before execution."
    );
  }

  if (flags.includes("remote_mutation")) {
    messages.push(
      "Potential remote mutation detected. Require explicit REMOTE_MUTATION_APPROVED scope and work-log evidence before treating it as authorized."
    );
  }

  if (flags.includes("deployment_or_production")) {
    messages.push(
      "Deployment or production behavior may be affected. Verify the current project architecture, environment, rollback path, and delivery approval."
    );
  }

  if (flags.includes("external_model_or_api")) {
    messages.push(
      "External model or API use may be involved. Verify availability and no-cost status, redact private context, and keep model output advisory until locally verified."
    );
  }

  if (flags.includes("governance_surface")) {
    messages.push(
      "Autopilot governance files may change. Record architecture, project-mesh, and work-log impact after verification."
    );
  }

  if (scope === "external_or_supervised_project") {
    messages.push(
      "The active working directory is outside the Autopilot control plane. Classify the supervised project and load its project-specific mesh before implementation."
    );
  }

  return messages;
}

function handleSessionStart(input) {
  const missing = REQUIRED_CONTROL_PLANE_PATHS.filter(
    (path) => !existsSync(join(REPOSITORY_ROOT, path))
  );
  const messages = [
    "Autopilot Codex hooks are active in report-first mode.",
    "Before planning or editing, follow AGENTS.md, use the smallest relevant Decision Mesh packet, and keep supervised-project runtime evidence in that project."
  ];

  if (missing.length > 0) {
    messages.push(`Required control-plane sources are missing: ${missing.join(", ")}.`);
  }

  const recorded = record(input, missing.length > 0 ? ["missing_control_plane_source"] : []);
  if (!recorded) {
    messages.push("The local redacted hook ledger is unavailable; do not claim hook evidence.");
  }

  return additionalContext(
    "SessionStart",
    messages,
    missing.length > 0 ? "Autopilot startup guardrail found missing control-plane sources." : undefined
  );
}

function handleSubagentStart(input) {
  const messages = [
    "Treat subagent output as a bounded draft.",
    "Do not approve architecture, security, business scope, remote mutation, or delivery.",
    "Return verification evidence, risks, and source pointers for orchestrator review."
  ];
  record(input);
  return additionalContext("SubagentStart", messages);
}

function handleUserPromptSubmit(input) {
  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  const flags = collectFlags(prompt);
  const scope = classifyScope(input.cwd);
  const messages = riskMessages(flags, scope);

  if (/\b(?:latest|current|newest|best practices?|context7)\b/i.test(prompt)) {
    flags.push("currentness_verification_needed");
    messages.push(
      "Currentness-sensitive guidance is requested. Verify it through Context7 when available or official documentation before adoption."
    );
  }

  const recorded = record(input, flags);
  if (!recorded) {
    messages.push("The local redacted hook ledger is unavailable; do not claim hook evidence.");
  }

  return messages.length > 0
    ? additionalContext(
        "UserPromptSubmit",
        messages,
        flags.includes("secret_like_input")
          ? "Autopilot hook detected possible sensitive prompt content."
          : undefined
      )
    : null;
}

function handlePreToolUse(input) {
  const flags = collectFlags(getToolText(input));
  const scope = classifyScope(input.cwd);
  const messages = riskMessages(flags, scope);
  const recorded = record(input, flags);

  if (!recorded) {
    messages.push("The local redacted hook ledger is unavailable; do not claim hook evidence.");
  }

  return messages.length > 0
    ? additionalContext(
        "PreToolUse",
        messages,
        flags.some((flag) =>
          ["destructive_command", "remote_mutation", "secret_like_input"].includes(flag)
        )
          ? "Autopilot report-only hook detected a high-risk tool surface."
          : undefined
      )
    : null;
}

function handlePostToolUse(input) {
  const flags = collectFlags(getToolText(input));
  const failed = responseLooksFailed(input.tool_response);

  if (failed) {
    flags.push("tool_result_failed");
  }

  const messages = [];
  if (failed) {
    messages.push(
      "The tool result appears unsuccessful. Do not treat it as verification evidence; inspect the failure and rerun the narrowest relevant check."
    );
  }

  if (flags.includes("remote_mutation")) {
    messages.push(
      "A possible remote-mutation tool call completed. Record the approved scope, result, source pointer, and rollback evidence."
    );
  }

  if (flags.includes("governance_surface")) {
    messages.push(
      "A governance surface may have changed. Complete the architecture, work-log, and project-mesh impact check before handoff."
    );
  }

  const recorded = record(input, flags, failed ? "failed" : "completed");
  if (!recorded) {
    messages.push("The local redacted hook ledger is unavailable; do not claim hook evidence.");
  }

  return messages.length > 0 ? additionalContext("PostToolUse", messages) : null;
}

function handlePreCompact(input) {
  const recorded = record(input);
  const continuityWritten = writeContinuity(input);
  const warnings = [];

  if (!recorded || !continuityWritten) {
    warnings.push("Autopilot compact continuity evidence could not be written.");
  }

  return warnings.length > 0
    ? { continue: true, systemMessage: warnings.join(" ") }
    : { continue: true };
}

function handlePostCompact(input) {
  record(input);
  return {
    continue: true,
    systemMessage:
      "Autopilot compaction completed. Re-read AGENTS.md and obtain a fresh relevant mesh packet before further edits."
  };
}

function handleSubagentStop(input) {
  record(input, [], "subagent_completed");
  return { continue: true };
}

function handleStop(input) {
  const recentEvents = readRecentTurnEvents(input);
  const flags = [...new Set(recentEvents.flatMap((entry) => entry.flags || []))].sort();
  const failures = recentEvents.filter((entry) => entry.result === "failed").length;
  const messages = [];

  if (failures > 0) {
    messages.push(`${failures} hook-observed tool result(s) failed in this turn.`);
  }

  if (flags.includes("remote_mutation")) {
    messages.push("Confirm remote-mutation approval, result evidence, and rollback notes.");
  }

  if (flags.includes("governance_surface")) {
    messages.push("Confirm architecture, work-log, and project-mesh impact before claiming completion.");
  }

  if (flags.includes("secret_like_input") || flags.includes("credential_surface")) {
    messages.push("Confirm that no sensitive material was persisted or disclosed.");
  }

  record(input, flags, messages.length > 0 ? "completion_review_needed" : "completion_observed");

  return messages.length > 0
    ? {
        continue: true,
        systemMessage: `Autopilot completion check: ${messages.join(" ")}`
      }
    : { continue: true };
}

export function handleHook(input) {
  switch (input.hook_event_name) {
    case "SessionStart":
      return handleSessionStart(input);
    case "SubagentStart":
      return handleSubagentStart(input);
    case "UserPromptSubmit":
      return handleUserPromptSubmit(input);
    case "PreToolUse":
      return handlePreToolUse(input);
    case "PostToolUse":
      return handlePostToolUse(input);
    case "PreCompact":
      return handlePreCompact(input);
    case "PostCompact":
      return handlePostCompact(input);
    case "SubagentStop":
      return handleSubagentStop(input);
    case "Stop":
      return handleStop(input);
    default:
      record(input, ["unsupported_hook_event"]);
      return null;
  }
}

function readStdin() {
  return readFileSync(0, "utf8");
}

function run() {
  let input;

  try {
    input = JSON.parse(readStdin());
  } catch {
    process.stdout.write(
      JSON.stringify({
        continue: true,
        systemMessage: "Autopilot hook received invalid JSON input; hook evidence is unavailable."
      })
    );
    return;
  }

  const response = handleHook(input);
  if (response) {
    process.stdout.write(JSON.stringify(response));
  }
}

if (resolve(process.argv[1] || "") === SCRIPT_PATH) {
  run();
}
