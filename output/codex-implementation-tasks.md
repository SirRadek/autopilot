# Codex Implementation Tasks

**Version:** 1.0.0  
**Date:** 2026-06-17  
**Navazuje na:** `output/supervisor-architecture-plan-v2.md`  
**Status:** Ready for implementation  
**Audience:** Codex worker (GPT-4o via Codex App)

Každý úkol je navržen jako jedna izolovaná Codex session. Sesssion nesmí překročit
ohraničení `allowed_files` a `forbidden_actions`. Opus přiděluje úkoly, normalizuje
výstupy a reviewuje — neimplementuje.

---

## Přehled vln

```
VLNA 1 — Schemas + enforcement gate    (2 úkoly, sequential)
  CX-01  JSON schemas + fixtures
  CX-02  checkCompletionMatrix.ts + HandoffId

VLNA 2 — Session state + hook bridge   (3 úkoly, sequential)
  CX-03  supervisorAlerts.ts
  CX-04  sessionState.ts + lock spec
  CX-05  hook bridge extension

VLNA 3 — Prompts + spike               (3 úkoly; CX-06/07 parallel, CX-08 manuální)
  CX-06  handoff template extension
  CX-07  supervisor + worker prompts
  CX-08  spike + adoption record [MANUÁLNÍ — vlastník]

  ←── POC GATE: spike musí projít ──→

VLNA 4 — Advanced automation           (11 úkolů, částečně paralelní)
  Set A (parallel):  CX-09, CX-11, CX-13, CX-14, CX-15, CX-16
  Set B (po Set A):  CX-10 (po CX-09), CX-12 (po CX-09 + CX-11)
  Set C (závěr):     CX-17 (po Set B), CX-18 (po CX-08), CX-19 (po CX-17+18)
```

**Celkem: 19 úkolů** — 18 pro Codex/GPT, 1 manuální (CX-08).

---

## Konvence

| Pole | Popis |
|---|---|
| **Allowed files** | Codex smí číst + editovat jen tyto soubory. Nic jiného. |
| **Forbidden actions** | Absolutní zákaz v dané session. |
| **Context width** | `tiny/small/medium` — dle `contextWidthSpecs` z plánu. |
| **Reasoning** | `low` = přímočaré; `medium` = logika + testy; `high` = cross-file s ochranou testů. |
| **Model** | `codex` = GPT-4o via Codex App; `qwen_local:7b` = lokální Qwen 2.5. |

---

## VLNA 1 — Schemas + Enforcement Gate

---

### CX-01 — JSON Schemas + Spike Fixtures

**Navazuje na:** TASK-01 v plánu  
**Závislosti:** žádné — první úkol

**Cíl**  
Vytvořit JSON Schema soubory definující kontrakt výstupu workera a reviewera,
a k nim 3 fixture soubory pro spike validaci a testy.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `model-output-evals/worker-output.schema.json` |
| | `model-output-evals/reviewer-output.schema.json` |
| | `model-output-evals/examples/valid-worker-output.json` |
| | `model-output-evals/examples/invalid-worker-output.json` |
| | `model-output-evals/examples/valid-reviewer-output.json` |
| Allowed files (read) | `model-output-evals/model-output-eval-record.schema.json` (vzor formátu) |
| Forbidden actions | Editovat existující schémata, psát TypeScript, volat jakékoliv API |

**Vstupy**  
- Spec `worker-output.schema.json` z plánu (sekce TASK-01)
- Spec `reviewer-output.schema.json` z plánu (sekce TASK-01)

**Výstupy**  
- 2 JSON Schema soubory (`$schema: https://json-schema.org/draft/2020-12/schema`)
- 3 fixture JSON soubory: `valid-worker-output.json`, `invalid-worker-output.json` (chybí `handoff_id`), `valid-reviewer-output.json`

**No-op check**  
```
grep -rn "worker-output.schema\|reviewer-output.schema" model-output-evals/
```
Pokud soubory existují — přečíst a porovnat se specí. Pokud shodné, úkol přeskočit.

**Failing-test-first**  
1. Vytvořit `invalid-worker-output.json` (chybí pole `handoff_id`).
2. Ručně ověřit, že `ajv validate --schema worker-output.schema.json invalid-worker-output.json` selže.
3. Teprve pak vytvořit platná schémata a `valid-worker-output.json`.

**Acceptance kritéria**  
- [ ] `valid-worker-output.json` projde validací proti `worker-output.schema.json`.
- [ ] `invalid-worker-output.json` (chybí `handoff_id`) selže validaci.
- [ ] Oba schéma soubory jsou platné JSON s `$schema` a `$id`.
- [ ] `npm.cmd run model-output:validate` projde (schémata ho nerozbitou).
- [ ] `handoff_id` má vzor `"^[a-z0-9][a-z0-9-]*$"` v obou schématech.

**Doporučený model:** `qwen_local:7b`  
**Odůvodnění:** Čistě mechanická tvorba JSON struktur bez logiky nebo testů.
Lokální model je dostatečný, šetří GPT kvótu.  
**Reasoning:** low  
**Context width:** `tiny` (max 3 soubory, 200 řádků — žádné TS závislosti)

---

### CX-02 — Check-Completion-Matrix + HandoffId

**Navazuje na:** TASK-02 v plánu  
**Závislosti:** CX-01 (fixture formáty ovlivňují HandoffId regex)

**Cíl**  
Vytvořit modul `checkCompletionMatrix.ts` s branded typem `HandoffId`,
rozhraním `HandoffPacket`, funkcí `validateHandoffPacket()` a kompletními testy.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `src/data/delivery-system/checkCompletionMatrix.ts` |
| | `tests/delivery-system/check-completion-matrix.test.ts` |
| Allowed files (read) | `src/data/delivery-system/workflows.ts` (import `WorkflowState` — jen pro typ check) |
| Forbidden actions | Editovat existující soubory, psát file I/O, importovat z neexistujících modulů |

**Vstupy**  
- Kompletní spec typů z plánu (sekce TASK-02)
- Fixture `valid-worker-output.json` (ověřit formát `handoff_id`)

**Výstupy**  
- `checkCompletionMatrix.ts` exportující: `HandoffId`, `makeHandoffId()`, `HandoffMode`, `ContextBudgetSummary`, `ReuseCheckSummary`, `HandoffPacket`, `CompletionMatrixResult`, `REQUIRED_SECTIONS_*`, `validateHandoffPacket()`, `isHandoffPacket()`
- `check-completion-matrix.test.ts` s testy (viz níže)

**No-op check**  
```
grep -rn "validateHandoffPacket\|HandoffId\|checkCompletionMatrix" src/
```

**Failing-test-first — napsat test PRVNÍ, pak implementovat:**

```typescript
// test #1: chybí handoff_id
it("returns valid: false when handoff_id is missing", () => {
  const r = validateHandoffPacket({ goal: "x" });
  expect(r.valid).toBe(false);
  expect(r.missingSections).toContain("handoff_id");
});

// test #2: branded type odmítne plain string
it("makeHandoffId throws on plain string", () => {
  expect(() => makeHandoffId("not-valid")).toThrow();
  expect(() => makeHandoffId("hp-20260617-test")).not.toThrow();
});

// test #3: bounded_coding vyžaduje reuse_check
it("bounded_coding task requires reuse_check", () => {
  const packet = buildValidPacket(); // bez reuseCheck
  const r = validateHandoffPacket(packet, "bounded_coding");
  expect(r.valid).toBe(false);
  expect(r.missingSections).toContain("reuse_check");
});

// test #4: kompletní packet projde
it("complete packet validates successfully", () => {
  const packet = buildCompletePacket();
  expect(validateHandoffPacket(packet).valid).toBe(true);
});
```

**Acceptance kritéria**  
- [ ] Všechny 4 failing testy projdou po implementaci.
- [ ] `makeHandoffId("hp-20260617-test")` → OK; `makeHandoffId("raw")` → throw.
- [ ] `HandoffPacket.handoffId: HandoffId` — TypeScript odmítne plain `string`.
- [ ] `npm.cmd run typecheck` projde.
- [ ] `npm.cmd test tests/delivery-system/check-completion-matrix.test.ts` projde.

**Doporučený model:** `codex` (GPT-4o via Codex App)  
**Odůvodnění:** Branded typy, TypeScript nominal typing a `as const` vzory vyžadují
GPT-4o reasoning. Qwen 7b by mohl udělat chyby v branded type patternu.  
**Reasoning:** medium  
**Context width:** `small` (8 souborů max — jen nový modul + workflows.ts pro WorkflowState)

---

## VLNA 2 — Session State + Hook Bridge

---

### CX-03 — Supervisor Alerts Types

**Navazuje na:** TASK-03 v plánu  
**Závislosti:** žádné (může běžet paralelně s CX-02)

**Cíl**  
Vytvořit modul `supervisorAlerts.ts` s typy `AlertSeverity`, `AlertTrigger`,
`SupervisorAlert`, funkcemi `createAlert()` a `resolveAlert()`.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `src/data/delivery-system/supervisorAlerts.ts` |
| | `tests/delivery-system/supervisor-alerts.test.ts` |
| Allowed files (read) | — žádné závislosti na jiných modulech |
| Forbidden actions | Importovat z neexistujících modulů, psát file I/O |

**Vstupy**  
- Spec z plánu (sekce TASK-03): všechny typy, SEVERITY_MAP

**Výstupy**  
- `supervisorAlerts.ts`: `AlertSeverity`, `AlertTrigger` (10 triggerů), `SupervisorAlert`, `createAlert()`, `resolveAlert()`
- `supervisor-alerts.test.ts`

**No-op check**  
```
grep -rn "SupervisorAlert\|AlertTrigger\|createAlert" src/
```

**Failing-test-first:**

```typescript
it("correction_loop_exceeded is blocker severity", () => {
  expect(createAlert("correction_loop_exceeded", "ctx").severity).toBe("blocker");
});
it("provider_tier_switched is info severity", () => {
  expect(createAlert("provider_tier_switched", "ctx").severity).toBe("info");
});
it("resolved alert has resolved: true", () => {
  const a = createAlert("reuse_check_skipped", "ctx");
  expect(resolveAlert(a).resolved).toBe(true);
  expect(resolveAlert(a).resolvedAt).toBeDefined();
});
```

**Acceptance kritéria**  
- [ ] Všechny severity testy projdou.
- [ ] `createAlert()` vrací unikátní `id` pro každé volání.
- [ ] `SupervisorAlert` je `readonly` — žádné mutable pole.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** low  
**Context width:** `tiny` (modul bez závislostí, spec je kompletní)

---

### CX-04 — Session State Module + Lock Spec

**Navazuje na:** TASK-04 v plánu  
**Závislosti:** CX-03 (importuje `SupervisorAlert`)

**Cíl**  
Vytvořit `sessionState.ts` s typy pro `SessionStateManifest`, `SessionHistoryEntry`,
exportovanými konstantami cest (`SESSION_STATE_PATH`, `SESSION_LOCK_PATH`, `HISTORY_MAX_ENTRIES`)
a factory funkcemi. Vytvořit `.gitignore` pro session-state složku.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `src/data/delivery-system/sessionState.ts` |
| | `docs/autopilot/session-state/.gitignore` |
| Allowed files (read) | `src/data/delivery-system/workflows.ts` (WorkflowState) |
| | `src/data/delivery-system/supervisorAlerts.ts` (CX-03 výstup) |
| Forbidden actions | Psát file I/O, importovat `fs`, volat runtime funkce |

**Vstupy**  
- Spec z plánu (sekce TASK-04): kompletní interface typy, konstanty
- `workflows.ts`: ověřit existenci exportu `WorkflowState`

**Výstupy**  
- `sessionState.ts` exportující `SessionStateManifest`, `SessionHistoryEntry`, `SESSION_STATE_PATH`, `SESSION_HISTORY_PATH`, `SESSION_LOCK_PATH`, `HISTORY_MAX_ENTRIES`, `createInitialSessionState()`, `createHistoryEntry()`
- `docs/autopilot/session-state/.gitignore` (`*.json`, `*.jsonl`, `*.lock`)

**No-op check**  
```
grep -rn "SessionStateManifest\|SESSION_STATE_PATH\|HISTORY_MAX_ENTRIES" src/
ls docs/autopilot/session-state/ 2>$null
```

**Failing-test-first:**

```typescript
// Přidat do tests/delivery-system/session-state.test.ts
it("schemaVersion is literal type v1", () => {
  const s = createInitialSessionState();
  expect(s.schemaVersion).toBe("v1");
});
it("HISTORY_MAX_ENTRIES equals 50", () => {
  expect(HISTORY_MAX_ENTRIES).toBe(50);
});
it("SESSION_LOCK_PATH ends with worker.lock", () => {
  expect(SESSION_LOCK_PATH).toMatch(/worker\.lock$/);
});
```

**Acceptance kritéria**  
- [ ] `schemaVersion: "v1"` je literal type (ne `string`).
- [ ] `HISTORY_MAX_ENTRIES === 50` (exportovaná konstanta).
- [ ] Modul neobsahuje žádný `import { readFileSync }` ani `import fs`.
- [ ] `docs/autopilot/session-state/.gitignore` obsahuje `*.lock`.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** low-medium (cross-import s workflows.ts, literal types)  
**Context width:** `small` (workflows.ts + supervisorAlerts.ts + nový modul)

---

### CX-05 — Hook Bridge Extension

**Navazuje na:** TASK-05 v plánu  
**Závislosti:** CX-03 (SupervisorAlert shape), CX-04 (path constants + HISTORY_MAX_ENTRIES)

**Cíl**  
Rozšířit existující `.codex/hooks/autopilot-hook.mjs` o 5 aditivních přídavků:
Gemini capacity detektor, Stop warning, session.json update, lock file management,
`trimAndAppendHistory()` helper. Žádná existující logika se nesmí měnit.

**Ohraničení**

| | |
|---|---|
| Allowed files (edit) | `.codex/hooks/autopilot-hook.mjs` |
| Allowed files (read) | `.codex/hooks/autopilot-hook.mjs` (přečíst celý soubor před editem) |
| | `tests/codex-hooks.test.ts` (přečíst existující testy — nesmí se rozbít) |
| | `src/data/delivery-system/sessionState.ts` (zkopírovat konstanty PATH a HISTORY_MAX_ENTRIES jako literály) |
| Forbidden actions | Editovat `.codex/hooks.json`, měnit existující handlery, psát synchronní file I/O pro session.json (musí být async s timeout 200ms) |

**Vstupy**  
- `.codex/hooks/autopilot-hook.mjs` — celý soubor (přečíst před editací)
- Spec 5 přídavků z plánu (sekce TASK-05)
- `HISTORY_MAX_ENTRIES = 50`, cesty z session-state spec

**Výstupy**  
- Rozšířený `.codex/hooks/autopilot-hook.mjs` s:
  - `GEMINI_RATE_LIMIT_PHRASES` konstanta
  - `detectGeminiCapacityPhrase()` funkce
  - `trimAndAppendHistory()` helper (async, fail-silently)
  - `writeSessionJsonSafe()` s 200ms timeout
  - Lock file create (SubagentStart) + delete (SubagentStop)

**No-op check**  
```
grep -n "GEMINI_RATE_LIMIT_PHRASES\|trimAndAppendHistory\|worker\.lock\|writeSessionJsonSafe" .codex/hooks/autopilot-hook.mjs
```
Pokud nalezeno — přečíst sekci a nekopírovat existující kód.

**Failing-test-first (přidat do `tests/codex-hooks.test.ts`):**

```typescript
it("trimAndAppendHistory keeps max 50 lines", async () => {
  // write 52 lines to temp file, call trimAndAppendHistory, expect 50 lines
  // test interní helper přes export nebo inline mock
});
it("writeSessionJsonSafe resolves even if write fails", async () => {
  // point to read-only path, expect no throw
});
```

**Acceptance kritéria**  
- [ ] `npm.cmd test tests/codex-hooks.test.ts` projde bez regrese (všechny existující testy zelené).
- [ ] Po simulaci Gemini rate-limit fráze → `history.jsonl` má nový řádek.
- [ ] `session.json` se aktualizuje při Stop (nebo selže tiše do max 200ms).
- [ ] `worker.lock` je vytvořen na SubagentStart, smazán na SubagentStop.
- [ ] `history.jsonl` nikdy nepřekročí 51 řádků po write.
- [ ] Žádný raw prompt, command nebo secret v zapsaných souborech.

**Doporučený model:** `codex`  
**Reasoning:** high (mění existující soubor, musí chránit testy, async/timeout logika)  
**Context width:** `medium` (autopilot-hook.mjs + codex-hooks.test.ts + sessionState spec)

---

## VLNA 3 — Prompts + Spike

---

### CX-06 — Handoff Packet Template Extension

**Navazuje na:** TASK-06 v plánu  
**Závislosti:** CX-02 (HandoffSection enum — ověřit názvy sekcí)

**Cíl**  
Rozšířit `docs/autopilot/agent-handoff-packet-template.md` o 4 nové sekce:
Handoff ID, Reuse Check, Context Budget, Learning Signal. Sekce musí odpovídat
názvům v `HandoffSection` enumu z CX-02.

**Ohraničení**

| | |
|---|---|
| Allowed files (edit) | `docs/autopilot/agent-handoff-packet-template.md` |
| Allowed files (read) | `src/data/delivery-system/checkCompletionMatrix.ts` (ověřit HandoffSection hodnoty) |
| Forbidden actions | Editovat TypeScript soubory, měnit stávající sekce šablony |

**Vstupy**  
- Stávající `docs/autopilot/agent-handoff-packet-template.md`
- Spec 4 sekcí z plánu (sekce TASK-06)

**Výstupy**  
- Rozšířená šablona s: `## Handoff ID`, `## Reuse Check (required for bounded_coding tasks)`, `## Context Budget (required)`, `## Learning Signal (optional)`

**No-op check**  
```
grep -n "Handoff ID\|Reuse Check\|Context Budget\|Learning Signal" docs/autopilot/agent-handoff-packet-template.md
```

**Acceptance kritéria**  
- [ ] Šablona je platný Markdown.
- [ ] Pořadí sekcí: Handoff ID → [původní sekce] → Reuse Check → Context Budget → Learning Signal.
- [ ] Sekce `## Handoff ID` obsahuje vzorový slug `hp-YYYYMMDD-<task-slug>`.
- [ ] `## Reuse Check` obsahuje `token saving estimate`.
- [ ] Sekce odpovídají hodnotám `HandoffSection` enum (bez překladu — anglicky).

**Doporučený model:** `qwen_local:7b`  
**Odůvodnění:** Čistě Markdown editace bez logiky.  
**Reasoning:** low  
**Context width:** `tiny` (1 Markdown soubor + 1 TS soubor pro kontrolu názvů)

---

### CX-07 — Supervisor Prompt + Worker Prompt POC

**Navazuje na:** TASK-07 v plánu  
**Závislosti:** CX-06 (rozšířená šablona), CX-02 (HandoffId slug formát), CX-01 (odkaz na schémata)

**Cíl**  
Vytvořit dva prompt soubory: `claude-opus-supervisor.md` (POC, status: draft) a
`codex-bounded-worker.md` (POC). Supervisor musí odkazovat na `session.json`
místo `codex_app.read_thread_terminal`. Worker musí obsahovat verify failure handling.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `prompt-library/06-supervisor/claude-opus-supervisor.md` |
| | `prompt-library/01-gpt/codex-bounded-worker.md` |
| Allowed files (read) | `prompt-library/06-supervisor/autopilot-supervisor-base.md` (jen referenční čtení) |
| | `prompt.schema.json` (metadata schema pro validaci) |
| | `docs/autopilot/agent-handoff-packet-template.md` (odkaz v promptu) |
| Forbidden actions | Editovat `autopilot-supervisor-base.md`, psát TypeScript |

**Vstupy**  
- Spec obou promptů z plánu (sekce TASK-07)
- `autopilot-supervisor-base.md`: přečíst strukturu, NEkopírovat `codex_app` sekce
- Popis "verify failure handling" z plánu pro worker prompt

**Výstupy**  
- `claude-opus-supervisor.md` s YAML frontmatter (`status: draft`, `forbidden: codex_app_tools`)
- `codex-bounded-worker.md` s YAML frontmatter a sekcí "Verify failure handling"

**No-op check**  
```
ls prompt-library/06-supervisor/claude-opus-supervisor.md 2>$null
ls prompt-library/01-gpt/codex-bounded-worker.md 2>$null
```

**Failing-test-first (prompt validace):**  
Spustit `npm.cmd run prompt:validate` po vytvoření — musí projít.
Pokud selže kvůli validaci metadat, opravit frontmatter pole.

**Acceptance kritéria**  
- [ ] `npm.cmd run prompt:validate` projde pro oba soubory.
- [ ] `claude-opus-supervisor.md` neobsahuje `codex_app` (ověřit: `grep "codex_app" prompt-library/06-supervisor/claude-opus-supervisor.md` → žádný výsledek).
- [ ] `codex-bounded-worker.md` obsahuje sekci "Verify failure handling" s pravidly pro `verify_result: fail`.
- [ ] `codex-bounded-worker.md` Required Output obsahuje `verify_result` a `verify_skip_reason`.
- [ ] Oba soubory mají platný YAML frontmatter s `forbidden` polem.

**Doporučený model:** `codex`  
**Odůvodnění:** Psaní strukturovaných prompt souborů s přesnou YAML syntaxí,
references na existující schémata a workflow logiku. Vyžaduje medium reasoning.  
**Reasoning:** medium  
**Context width:** `small` (autopilot-supervisor-base.md + prompt.schema.json + šablona)

---

### CX-08 — Manual Spike + Adoption Record [MANUÁLNÍ]

**Navazuje na:** TASK-08 v plánu  
**Závislosti:** CX-01 až CX-07 kompletní

**Cíl**  
Manuálně provést spike handoff loop a zapsat adoption record. Tento úkol
NELZE delegovat na Codex — vyžaduje živé sezení Claude Opus + Codex.

**Kroky (vlastník, ne Codex):**  
1. Spustit `claude-opus-supervisor.md` v Claude Code + malý bounded task.
2. Opus vygeneruje handoff packet se slug `hp-YYYYMMDD-*`.
3. Validovat: `node scripts/validate-spike-artifacts.mjs worker <file>`.
4. Vložit handoff packet do Codex session s `codex-bounded-worker.md`.
5. Codex vrátí strukturovaný output.
6. Validovat: `node scripts/validate-spike-artifacts.mjs reviewer <file>`.
7. Ověřit shodu `handoff_id` přes všechny tři artefakty.

**Vedlejší úkol pro Codex (CX-08a — vytvoření validačního skriptu):**

| | |
|---|---|
| Allowed files (create) | `scripts/validate-spike-artifacts.mjs` |
| | `docs/autopilot/spike-supervisor-handoff.md` |
| | `docs/autopilot/adoption-record-template.md` |
| | `docs/autopilot/adoption-records/.gitkeep` |
| Forbidden actions | Editovat schémata, volat cloud API |

**Acceptance kritéria (pro CX-08a — Codex)**  
- [ ] `scripts/validate-spike-artifacts.mjs worker <valid-worker.json>` → exit 0.
- [ ] `scripts/validate-spike-artifacts.mjs worker <invalid-worker.json>` → exit 1 + chybová zpráva.
- [ ] `docs/autopilot/adoption-record-template.md` má 8 povinných polí.
- [ ] `docs/autopilot/adoption-records/` adresář existuje v git.

**Acceptance kritéria (pro manuální spike — vlastník)**  
- [ ] Oba `validate-spike-artifacts.mjs` příkazy vrátí exit 0.
- [ ] `handoff_id` shodné přes handoff packet + worker output + reviewer output.
- [ ] Adoption record vyplněn a uložen v `docs/autopilot/adoption-records/`.

**Model pro CX-08a:** `qwen_local:7b` (jednoduchý Node.js CLI skript)  
**Reasoning:** low  
**Context width:** `tiny` (spec skriptu z plánu + schémata CX-01)

---

## POC COMPLETION GATE

Před spuštěním Vlny 4 musí platit:

```
npm.cmd run typecheck                                             [green]
npm.cmd test tests/delivery-system/check-completion-matrix.test.ts  [green]
npm.cmd test tests/delivery-system/supervisor-alerts.test.ts     [green]
npm.cmd test tests/codex-hooks.test.ts                           [green]
npm.cmd run prompt:validate                                       [green]
npm.cmd run model-output:validate                                 [green]
npm.cmd run mesh:check                                            [green]
Manuální spike CX-08 projít                                      [done]
Adoption record uložen                                           [filed]
```

---

## VLNA 4 — Advanced Automation

### Set A — Paralelní úkoly (žádné vzájemné závislosti)

---

### CX-09 — Subscription Budget + Gemini Tiers

**Navazuje na:** TASK-09 v plánu  
**Závislosti:** POC Gate

**KRITICKÉ — před psaním kódu:**  
Spustit `gemini --help` nebo ověřit model jména v CLI referenci.
Pokud modely `gemini-2.5-flash`/`gemini-2.5-pro` nejsou potvrzeny:
→ `cliAccessPath: undefined`, `verifiedLocally: false` v kódu.
Toto není volitelné. Nezapsat neověřené model jméno jako `verifiedLocally: true`.

**Cíl**  
Vytvořit `subscriptionBudget.ts` s `ProviderTierSpec`, `SubscriptionSessionBudget`
(incl. `lastAttemptedAt`), `geminiKnownTiers` (3 tiery), typ `SubscriptionRateLimitState`.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `src/data/delivery-system/subscriptionBudget.ts` |
| | `tests/delivery-system/subscription-budget.test.ts` |
| Allowed files (read) | `src/data/delivery-system/modelPolicy.ts` (ReasoningProviderId typ) |
| Forbidden actions | Psát HTTP calls, importovat Gemini SDK, hardkódovat neověřené model jméno jako `verifiedLocally: true` |

**Vstupy**  
- Spec z plánu (sekce TASK-09): všechny typy, `geminiKnownTiers` s 3 tiery
- `modelPolicy.ts`: ověřit existenci `ReasoningProviderId`

**Výstupy**  
- `subscriptionBudget.ts`: `SubscriptionRateLimitState`, `ProviderTierSpec` (s `verifiedLocally` + `notes` + `lastAttemptedAt`), `SubscriptionSessionBudget`, `geminiKnownTiers`

**No-op check**  
```
grep -rn "SubscriptionSessionBudget\|geminiKnownTiers\|ProviderTierSpec" src/
```

**Failing-test-first:**

```typescript
it("geminiKnownTiers has 3 entries", () => {
  expect(geminiKnownTiers).toHaveLength(3);
});
it("only gemini_auto is verifiedLocally", () => {
  expect(geminiKnownTiers.find(t => t.tierId === "gemini_auto")?.verifiedLocally).toBe(true);
  expect(geminiKnownTiers.find(t => t.tierId === "gemini_flash")?.verifiedLocally).toBe(false);
});
it("SubscriptionSessionBudget has lastAttemptedAt field", () => {
  const budget: SubscriptionSessionBudget = {
    provider: "gemini_cli", activeTierId: "gemini_auto",
    activeTierRateLimitState: "available", rateLimitHitAt: undefined,
    lastAttemptedAt: undefined, availableTiers: geminiKnownTiers,
    exhaustedTierIds: [], sessionTaskCount: 0,
    lastSuccessfulTaskAt: undefined, notes: undefined
  };
  expect(budget.lastAttemptedAt).toBeUndefined();
});
```

**Acceptance kritéria**  
- [ ] `geminiKnownTiers.length === 3`.
- [ ] `gemini_auto.verifiedLocally === true`, ostatní `=== false`.
- [ ] `SubscriptionSessionBudget` má pole `lastAttemptedAt: string | undefined`.
- [ ] Žádný `cliAccessPath` pro flash/pro (nebo `undefined`).
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** low-medium  
**Context width:** `small`

---

### CX-11 — modelPolicy.ts: GPT Subscription Fix + Lane Updates

**Navazuje na:** TASK-11 v plánu  
**Závislosti:** POC Gate

**KRITICKÉ — přečíst testy před jakoukoliv editací:**  
`tests/delivery-system/model-policy.test.ts` musí být přečten celý. Každá
existující assertion musí zůstat zelená. Přidávat pouze — nikdy mazat existující
pole z existujících entries.

**Cíl**  
Minimální sada změn v `modelPolicy.ts`: opravit `openai_gpt.accessMode` na
`subscription_interactive`, přidat `costGuard` a subscription checks,
aktualizovat lane preference pro `bounded_coding_worker` a `agent_validation`.

**Ohraničení**

| | |
|---|---|
| Allowed files (edit) | `src/data/delivery-system/modelPolicy.ts` |
| | `tests/delivery-system/model-policy.test.ts` |
| Allowed files (read) | `src/data/delivery-system/modelPolicy.ts` (celý) |
| | `tests/delivery-system/model-policy.test.ts` (celý — PŘED editací) |
| Forbidden actions | Mazat existující pole, přepisovat existující entries, přidávat `layerProviderMapping` nebo `SupervisorRoutingDecision` (to patří do CX-12) |

**Vstupy**  
- Kompletní spec změn z plánu (sekce TASK-11)
- Oba soubory přečteny před zahájením

**Výstupy**  
- `modelPolicy.ts`: `openai_gpt.accessMode === "subscription_interactive"` + nové `requiredChecks` + `stopConditions` + `costGuard`; `gemini_cli` guards; `bounded_coding_worker` preferredProviders[0] = openai_gpt; `agent_validation` preferredProviders[0] = claude_subscription
- `model-policy.test.ts`: 2 nové testy (viz spec)

**No-op check**  
```
grep -n "subscription_interactive" src/data/delivery-system/modelPolicy.ts
```
Pokud `openai_gpt.accessMode` je již `subscription_interactive` — přeskočit tuto část.

**Failing-test-first — napsat PŘED editací `modelPolicy.ts`:**

```typescript
it("openai_gpt uses subscription_interactive, not api_or_self_hosted", () => {
  const gpt = reasoningProviderPolicies.find(p => p.id === "openai_gpt");
  expect(gpt?.accessMode).toBe("subscription_interactive");
  expect(gpt?.requiredChecks).toContain("serial_task_delegation_required");
  expect(gpt?.stopConditions).toContain("parallel_subscription_calls_attempted");
});
it("bounded_coding_worker lane prefers openai_gpt first", () => {
  const lane = reasoningTaskLanes.find(l => l.id === "bounded_coding_worker");
  expect(lane?.preferredProviders[0]).toBe("openai_gpt");
});
```

**Acceptance kritéria**  
- [ ] Všechny existující `model-policy.test.ts` testy zelené (nulová regrese).
- [ ] Oba nové testy zelené.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** high (edituje existující komplexní soubor, chrání existující testy)  
**Context width:** `medium` (modelPolicy.ts celý + test soubor celý)

---

### CX-13 — Learning Signal + Self-Correction Types

**Navazuje na:** TASK-13 v plánu  
**Závislosti:** POC Gate, CX-02 (HandoffId branded type)

**Cíl**  
Rozšířit `modelOutputEvaluation.ts` o: `EvalRecordSummary`, `SupervisorLearningSignal`,
`CorrectionLoopEntry` (s `handoffId: HandoffId`), `WorkerOutputNormalization`,
`deriveLearningSignal()`, `EVAL_RECORDS_PATH` konstanta.

**Ohraničení**

| | |
|---|---|
| Allowed files (edit) | `src/data/delivery-system/modelOutputEvaluation.ts` |
| | `tests/delivery-system/model-output-evaluation-policy.test.ts` |
| Allowed files (read) | `src/data/delivery-system/modelOutputEvaluation.ts` (celý — PŘED editací) |
| | `tests/delivery-system/model-output-evaluation-policy.test.ts` (PŘED editací) |
| | `src/data/delivery-system/checkCompletionMatrix.ts` (HandoffId import) |
| Forbidden actions | Psát file I/O v `deriveLearningSignal()`, měnit existující funkce, importovat `fs` |

**Vstupy**  
- Kompletní spec z plánu (sekce TASK-13)
- `EVAL_RECORDS_PATH = "model-output-evals/records/"` — exportovat jako konstantu

**Výstupy**  
- Rozšířený `modelOutputEvaluation.ts` s novými typy + `EVAL_RECORDS_PATH`
- Nové testy v `model-output-evaluation-policy.test.ts`

**No-op check**  
```
grep -n "SupervisorLearningSignal\|EvalRecordSummary\|deriveLearningSignal\|EVAL_RECORDS_PATH" src/data/delivery-system/modelOutputEvaluation.ts
```

**Failing-test-first:**

```typescript
it("returns no_data when records array is empty", () => {
  const s = deriveLearningSignal("bounded_coding", "openai", []);
  expect(s.confidenceSource).toBe("no_data");
  expect(s.recentFailureCount).toBe(0);
});
it("CorrectionLoopEntry requires handoffId", () => {
  const entry: CorrectionLoopEntry = {
    taskId: "t1", handoffId: makeHandoffId("hp-20260617-test"),
    provider: "openai", iterationCount: 1, maxIterations: 3,
    lastScore: 45, failureLabels: [], correctionApplied: "x",
    state: "retry_with_prompt_or_input_tuning"
  };
  expect(entry.handoffId).toBeDefined();
});
```

**Acceptance kritéria**  
- [ ] Existující `model-output-evaluation-policy.test.ts` testy zelené.
- [ ] `deriveLearningSignal(type, provider, [])` → `confidenceSource: "no_data"`.
- [ ] `CorrectionLoopEntry.handoffId` je `HandoffId` (branded), ne plain `string`.
- [ ] `EVAL_RECORDS_PATH === "model-output-evals/records/"`.
- [ ] `deriveLearningSignal` neobsahuje `import fs` ani `readFileSync`.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** high (edituje existující testovaný soubor)  
**Context width:** `medium`

---

### CX-14 — Context Width Selection (ContextWidthSpec Only)

**Navazuje na:** TASK-14 v plánu  
**Závislosti:** POC Gate

**KRITICKÉ:** `TokenBudgetClass` na řádku 3 `tokenEfficiency.ts` již obsahuje `"large"`.
Nepřidávat znovu. Přidávat pouze `ContextWidthSpec` a `contextWidthSpecs`.

**Cíl**  
Rozšířit `tokenEfficiency.ts` o interface `ContextWidthSpec`, record `contextWidthSpecs`
(4 záznamy pro tiny/small/medium/large) a funkci `selectContextWidth()`.

**Ohraničení**

| | |
|---|---|
| Allowed files (edit) | `src/data/delivery-system/tokenEfficiency.ts` |
| | `tests/delivery-system/token-efficiency-policy.test.ts` |
| Allowed files (read) | `src/data/delivery-system/tokenEfficiency.ts` (celý — PŘED editací) |
| Forbidden actions | Modifikovat `TokenBudgetClass` union type |

**No-op check**  
```
grep -n "ContextWidthSpec\|contextWidthSpecs\|maxFilesInPacket" src/data/delivery-system/tokenEfficiency.ts
```
Ověřit `TokenBudgetClass` před zahájením:
```
grep -n "TokenBudgetClass" src/data/delivery-system/tokenEfficiency.ts
```

**Failing-test-first:**

```typescript
it("does not re-add large — TokenBudgetClass stays at 4 members", () => {
  const classes: TokenBudgetClass[] = ["tiny", "small", "medium", "large"];
  expect(classes).toHaveLength(4); // type-level assertion
});
it("large maps exclusively to gemini_cli", () => {
  expect(contextWidthSpecs.large.preferredProviderForWidth).toBe("gemini_cli");
});
it("tiny limits files to 3", () => {
  expect(contextWidthSpecs.tiny.maxFilesInPacket).toBe(3);
});
```

**Acceptance kritéria**  
- [ ] `TokenBudgetClass` je beze změny (4 члены — ověřit `git diff`).
- [ ] `contextWidthSpecs.large.preferredProviderForWidth === "gemini_cli"`.
- [ ] `contextWidthSpecs.tiny.maxFilesInPacket === 3`.
- [ ] Existující testy zelené.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** medium  
**Context width:** `small`

---

### CX-15 — Skill Registry Types + Initial File

**Navazuje na:** TASK-15 v plánu  
**Závislosti:** POC Gate

**Cíl**  
Rozšířit `toolInventory.ts` o typy skill registry a vytvořit
committed `docs/autopilot/skill-registry.json` s `schemaVersion: "v1"`.

**Ohraničení**

| | |
|---|---|
| Allowed files (edit) | `src/data/delivery-system/toolInventory.ts` |
| Allowed files (create) | `docs/autopilot/skill-registry.json` |
| | `tests/delivery-system/tool-inventory.test.ts` (přidat 1–2 testy) |
| Allowed files (read) | `src/data/delivery-system/toolInventory.ts` (celý — PŘED editací) |
| | `tests/delivery-system/tool-inventory.test.ts` (PŘED editací) |
| Forbidden actions | Mazat existující `ToolInventorySnapshot`, psát file I/O |

**Failing-test-first:**

```typescript
it("skill-registry.json has schemaVersion", () => {
  const registry = JSON.parse(readFileSync("docs/autopilot/skill-registry.json", "utf8"));
  expect(registry.schemaVersion).toBe("v1");
  expect(Array.isArray(registry.skills)).toBe(true);
});
```

**Acceptance kritéria**  
- [ ] Existující `tool-inventory.test.ts` testy zelené.
- [ ] `skill-registry.json` je platné JSON s klíči: `lastUpdatedAt`, `schemaVersion`, `skills`, `usageRecords`, `replacementCandidates`.
- [ ] `SkillReplacementCandidate.status` je union s `"proposed" | "in_development" | "evaluating" | "adopted" | "rejected"`.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** low  
**Context width:** `small`

---

### CX-16 — Dependency Freshness + Reuse Gate Module

**Navazuje na:** TASK-16 v plánu  
**Závislosti:** POC Gate

**Cíl**  
Vytvořit `dependencyFreshness.ts` s `DependencyFreshnessState`, `UpdateDecision`,
`DependencyCheckRecord`, `ReuseDecision`, `ReuseCheckResult` (s `tokenSavingEstimate`),
`dependencyFreshnessPolicy` (s `autoUpdateAllowed: false as const`).

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `src/data/delivery-system/dependencyFreshness.ts` |
| | `tests/delivery-system/dependency-freshness.test.ts` |
| Forbidden actions | Spouštět `npm.cmd outdated`, volat shell, psát file I/O |

**Failing-test-first:**

```typescript
it("autoUpdateAllowed is literally false", () => {
  expect(dependencyFreshnessPolicy.autoUpdateAllowed).toBe(false);
  expect(typeof dependencyFreshnessPolicy.autoUpdateAllowed).toBe("boolean");
});
it("checkCommands all start with npm.cmd", () => {
  dependencyFreshnessPolicy.checkCommands.forEach(cmd => {
    expect(cmd.startsWith("npm.cmd ")).toBe(true);
  });
});
it("ReuseCheckResult has tokenSavingEstimate", () => {
  const r: ReuseCheckResult = {
    searchedPatterns: [], existingMatches: [], packageMatches: [],
    decision: "implement_new", reuseTarget: undefined,
    tokenSavingEstimate: "none"
  };
  expect(r.tokenSavingEstimate).toBe("none");
});
```

**Acceptance kritéria**  
- [ ] `dependencyFreshnessPolicy.autoUpdateAllowed === false` (literal).
- [ ] Všechny `checkCommands` začínají `"npm.cmd "` (ne `"npm "`).
- [ ] `ReuseCheckResult` má `tokenSavingEstimate: "high" | "medium" | "low" | "none"`.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** low  
**Context width:** `tiny`

---

### Set B — Po dokončení Set A

---

### CX-10 — Fallback Chains

**Navazuje na:** TASK-10 v plánu  
**Závislosti:** CX-09 (`ProviderTierSpec`, `SubscriptionSessionBudget`)

**Cíl**  
Vytvořit `fallbackChains.ts` s `FallbackTrigger`, `FallbackChainStep`,
`subscriptionFallbackChains` (5 kroků z plánu) a `resolveFallback()`.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `src/data/delivery-system/fallbackChains.ts` |
| | `tests/delivery-system/fallback-chains.test.ts` |
| Allowed files (read) | `src/data/delivery-system/subscriptionBudget.ts` (CX-09) |
| Forbidden actions | Psát automatické fallback logiku mimo `resolveFallback()` |

**Failing-test-first:**

```typescript
it("Gemini falls to Flash when auto rate-limited", () => {
  const r = resolveFallback("rate_limited", "gemini_cli", budgetWithFlashAvailable);
  expect(r?.toProvider).toBe("gemini_cli");
  expect(r?.toTierId).toBe("gemini_flash");
});
it("Gemini never falls to GPT", () => {
  const r = resolveFallback("rate_limited", "gemini_cli", budgetAllExhausted);
  expect(r?.toProvider).not.toBe("openai_gpt");
  expect(r?.toProvider).toBe("blocked");
});
it("Claude unavailability goes to owner_decision", () => {
  const r = resolveFallback("provider_unavailable", "anthropic_claude_subscription", anyBudget);
  expect(r?.toProvider).toBe("owner_decision");
});
```

**Acceptance kritéria**  
- [ ] Všechny 3 failing testy zelené.
- [ ] Žádný `subscriptionFallbackChains` krok nemá `fromProvider: "gemini_cli"` a `toProvider` mimo `["gemini_cli", "blocked"]`.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** medium  
**Context width:** `small`

---

### CX-12 — modelPolicy.ts: Layer Mapping + SupervisorRoutingDecision

**Navazuje na:** TASK-12 v plánu  
**Závislosti:** CX-09 (typy budget), CX-11 (testy zelené)  
**Soft dependency:** CX-14 (`ContextWidthSpec`) — pokud není hotovo, použít placeholder

**Cíl**  
Přidat do `modelPolicy.ts`: `layerProviderMapping`, `SupervisorRoutingDecision`
(s `assignedTierId`, `learningSignal`, `contextWidthSpec`), `buildSupervisorRoutingDecision()`,
`selectModelForLayer()`, entry `codex_gpt_worker` do `credentialedAdvisoryProviderPolicies`.

**Ohraničení**

| | |
|---|---|
| Allowed files (edit) | `src/data/delivery-system/modelPolicy.ts` |
| | `tests/delivery-system/model-policy.test.ts` |
| Allowed files (read) | `src/data/delivery-system/modelPolicy.ts` (celý) |
| | `tests/delivery-system/model-policy.test.ts` (celý) |
| | `src/data/delivery-system/subscriptionBudget.ts` |
| | `src/data/delivery-system/tokenEfficiency.ts` (ContextWidthSpec — pokud CX-14 hotovo) |
| Forbidden actions | Mazat existující exporty, měnit CX-11 změny |

**Failing-test-first:**

```typescript
it("layerProviderMapping covers all 8 layers", () => {
  const layers: ModelPolicyLayer[] = [
    "orchestrator", "architect", "reviewer", "tester",
    "micro_worker", "bounded_coding", "memory_summarizer", "copywriter"
  ];
  layers.forEach(l => expect(layerProviderMapping[l]).toBeDefined());
});
it("SupervisorRoutingDecision has assignedTierId and learningSignal", () => {
  const d: SupervisorRoutingDecision = buildMinimalDecision();
  expect("assignedTierId" in d).toBe(true);
  expect("learningSignal" in d).toBe(true);
});
it("codex_gpt_worker is subscription_interactive", () => {
  const w = credentialedAdvisoryProviderPolicies.find(p => p.id === "codex_gpt_worker");
  expect(w?.accessMode).toBe("subscription_interactive");
  expect(w?.requiredChecks).toContain("handoff_packet_received_before_start");
});
```

**Acceptance kritéria**  
- [ ] Všechny existující + nové testy zelené.
- [ ] `layerProviderMapping` pokrývá 8 vrstev.
- [ ] `SupervisorRoutingDecision` má `assignedTierId`, `learningSignal`, `contextWidthSpec`.
- [ ] `buildSupervisorRoutingDecision()` je exportovaná funkce.
- [ ] `npm.cmd run typecheck` projde.

**Doporučený model:** `codex`  
**Reasoning:** high  
**Context width:** `medium`

---

### Set C — Závěr

---

### CX-17 — Mesh Nodes (4 nové)

**Navazuje na:** TASK-17 v plánu  
**Závislosti:** CX-09 až CX-16 dokončeny (přesné názvy signálů závisí na finálních typech)

**Cíl**  
Vytvořit 4 YAML mesh node soubory a přidat 4 edges do `mesh/edges.yaml`.
Každý node musí mít `failure_modes[]` navíc ke standardním polím.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `mesh/nodes/subscription_worker_boundary.yaml` |
| | `mesh/nodes/skill_registry_policy.yaml` |
| | `mesh/nodes/reuse_gate.yaml` |
| | `mesh/nodes/supervisor_execution_loop.yaml` |
| Allowed files (edit) | `mesh/edges.yaml` |
| Allowed files (read) | `mesh/nodes/model_spend_policy.yaml` (edge target existuje?) |
| | Existující node soubory (vzor formátu) |
| Forbidden actions | Editovat existující nodes, mazat existující edges |

**No-op check**  
```
ls mesh/nodes/ | grep -E "subscription_worker|skill_registry|reuse_gate|supervisor_execution"
```

**Failing-test-first:** Vytvořit prázdný `subscription_worker_boundary.yaml`, spustit
`npm.cmd run mesh:check` — zachytit chybovou zprávu o chybějících required polích,
pak doplnit.

**Required YAML klíče pro každý node:**  
`id`, `type`, `name`, `question`, `why`, `signals`, `related_agents`, `related_files`,
`required_checks`, `stop_conditions`, `must_not_assume`, `objective`, `failure_modes`

**4 edges (přidat do `mesh/edges.yaml`):**
```yaml
- from: supervisor_execution_loop
  to: subscription_worker_boundary
  relation: requires
  weight: 0.95
  why: "Every supervisor delegation must go through subscription worker boundary."
- from: supervisor_execution_loop
  to: reuse_gate
  relation: requires
  weight: 0.88
  why: "Reuse check mandatory before bounded_coding delegation."
- from: supervisor_execution_loop
  to: skill_registry_policy
  relation: informs
  weight: 0.75
  why: "Supervisor checks skill registry before platform plugin activation."
- from: subscription_worker_boundary
  to: model_spend_policy
  relation: depends_on
  weight: 0.90
  why: "Subscription worker boundary inherits model spend guardrails."
```

**Acceptance kritéria**  
- [ ] `npm.cmd run mesh:check` projde (0 errors) po přidání nodes + edges.
- [ ] Každý node má `failure_modes` pole s ≥ 3 položkami.
- [ ] Edge target `model_spend_policy` existuje v `mesh/nodes/` (ověřit před přidáním edge).
- [ ] Žádný existující node nebyl upraven.

**Doporučený model:** `codex`  
**Reasoning:** medium (YAML struktura, mesh validace)  
**Context width:** `small` (vzorové nody + edges.yaml)

---

### CX-18 — Adoption Record Finalize

**Navazuje na:** TASK-18 v plánu  
**Závislosti:** CX-08 (šablona adoption record), POC Gate (spike výsledek)

**Cíl**  
Vytvořit `adoption-record.schema.json` a první adoption record dokumentující
rozhodnutí nasadit Claude Opus jako primárního supervisora.

**Ohraničení**

| | |
|---|---|
| Allowed files (create) | `docs/autopilot/adoption-record.schema.json` |
| | `docs/autopilot/adoption-records/2026-0617-claude-opus-orchestrator.md` |
| Allowed files (read) | `docs/autopilot/adoption-record-template.md` (CX-08 výstup) |
| Forbidden actions | Editovat adoption record šablonu |

**Acceptance kritéria**  
- [ ] `adoption-record.schema.json` je platné JSON Schema draft 2020-12.
- [ ] First adoption record vyplněn se všemi 8 poli (`decision_id`, `date`, `what_was_proposed`, `decision`, `who_decided`, `reason`, `files_changed`, `evidence`).
- [ ] `decision: "adopted"` v prvním záznamu.

**Doporučený model:** `qwen_local:7b`  
**Reasoning:** low  
**Context width:** `tiny`

---

### CX-19 — Full Verification Pass

**Navazuje na:** TASK-19 v plánu  
**Závislosti:** CX-17 + CX-18

**Cíl**  
Spustit kompletní verifikaci. Pokud selže — identifikovat, který task selhal,
nahlásit jako `blocked_items` — NEOPRAVOVAT přímo v této session.

**Ohraničení**

| | |
|---|---|
| Allowed actions | Spustit příkazy, číst chybové výstupy |
| Forbidden actions | Editovat jakýkoliv soubor, obcházet selhání |

**Příkazy:**
```
npm.cmd run mesh:check
npm.cmd run prompt:validate
npm.cmd run model-output:validate
npm.cmd run pdos:validate
npm.cmd run contracts:validate
npm.cmd run diff:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```
Nebo jedním příkazem: `npm.cmd run verify`

**Acceptance kritéria**  
- [ ] Všechny příkazy exit 0.
- [ ] Pokud selže → `verify_result: fail`, `blocked_items` obsahuje přesný příkaz a první error řádek.
- [ ] Nikdy neoznačit jako hotovo při selhání verifikace.

**Doporučený model:** `codex`  
**Reasoning:** low (mechanické spuštění)  
**Context width:** `tiny`

---

## Souhrn doporučených modelů

| Model | Úkoly | Počet |
|---|---|---|
| `codex` (GPT-4o via Codex App) | CX-02, 03, 04, 05, 07, 08a, 09, 10, 11, 12, 13, 14, 15, 16, 17, 19 | 16 |
| `qwen_local:7b` | CX-01, 06, 18 | 3 |
| Manuální (vlastník) | CX-08 (spike) | 1 |

## Souhrn context widths

| Width | Úkoly |
|---|---|
| `tiny` | CX-01, 03, 06, 08a, 16, 18, 19 |
| `small` | CX-02, 04, 07, 09, 10, 11, 14, 15, 17 |
| `medium` | CX-05, 12, 13 |
| `large` | — (žádný implementační úkol nevyžaduje large) |
