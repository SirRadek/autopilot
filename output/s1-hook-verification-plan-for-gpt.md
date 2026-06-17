# S1/R1 Hook Verification Plan

**Typ zadání:** Verifikační plán — spuštění testů, zápis výsledků, žádná produkční změna bez explicitního schválení.  
**Pracovní adresář:** kořen repozitáře `autopilot-control-plane` (Windows, PowerShell).  
**Prerekvizita:** Node.js na PATH, repozitář naklonovaný, aktuální větev.

> **Aktualizace 2026-06-17:** Vlastník schválil design. Lock se klíčuje na `agent_id`
> (nativní Codex pole). `handoff_id` je auditní identifikátor — prochází handoff
> packetem, worker outputem, reviewer outputem — ale nepodmiňuje vznik locku.
> Implementační task: `hp-20260617-rekey-lock-to-agent-id`.

---

## 1. Kontext — co ověřujeme a proč

### Architektura Autopilot supervisora

Repozitář implementuje **governance vrstvu** pro AI-asistovaný vývoj. Základní smyčka:

```
Claude Opus (supervisor)
  → sestaví handoff packet (strukturovaný úkol pro workera)
  → deleguje na Codex / GPT worker přes SubagentStart
  → worker vrátí strukturovaný výstup (obsahuje handoff_id)
  → supervisor ověří audit korelaci a schválí nebo pošle korekci
```

Systém vynucuje **sériové zpracování** — pouze jeden worker najednou smí být aktivní.
Sériové vynucení závisí na souboru `worker.lock`.

### worker.lock a session-state

```
docs/autopilot/session-state/
  session.json    ← manifest aktuálního stavu supervisora (gitignorován)
  worker.lock     ← mutex pro sériové vynucení (gitignorován)
  history.jsonl   ← chronologická historie handoffů (gitignorována)
```

- `worker.lock` je **advisory atomický lock** — vzniká přes `fs.open(path, "wx")` (exclusive create flag).
- Obsah: `{"lockedBy":"<agent_id>","lockedAt":"ISO timestamp"}`.
- Lock se vytváří při **SubagentStart** (klíčem je `agent_id`) a maže se při
  **SubagentStop** pokud `lock.lockedBy === agent_id`.

### Dvě oddělené identity — lock a audit

| Identita | Pole | Zdroj | Účel |
|---|---|---|---|
| `agent_id` | `input.agent_id` / `input.agentId` | Codex runtime (vždy přítomno) | Klíč locku — sériové vynucení |
| `handoff_id` | `input.handoff_id` / `input.handoffId` | Supervisor (volitelné struct. pole) | Auditní ID — korelace work-log, worker output, reviewer output |

### Hook bridge

Soubor `.codex/hooks/autopilot-hook.mjs` je hook skript registrovaný v `.codex/hooks.json`.  
Codex App / Claude Code ho volá přes `node` s JSON payloadem na stdin při těchto událostech:
`SessionStart`, `SubagentStart`, `SubagentStop`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreCompact`, `PostCompact`, `Stop`.

### S1 riziko — co ještě nebylo ověřeno

Mechanika locku s `agent_id` klíčem je implementována (task `hp-20260617-rekey-lock-to-agent-id`).  
**Nebylo ale ověřeno live**, že Codex App SubagentStart payload skutečně obsahuje `agent_id`
jako top-level JSON pole, ze kterého ho hook přečte.

Pokud `agent_id` v payloadu chybí → hook vrátí `"missing_agent_id"` → lock nevznikne
→ sériové vynucení **nefunguje**.

**Cíl tohoto plánu:** Ověřit A) izolovaně hook mechaniku s `agent_id`, B) živou propagaci
`agent_id` přes SubagentStart payload + audit korelaci přes strukturovaný worker output.

---

## 2. Klíčový fakt o kódu — jak hook čte `agent_id`

**Soubor:** `.codex/hooks/autopilot-hook.mjs` (po implementaci `hp-20260617-rekey-lock-to-agent-id`)

```javascript
function getAgentId(input) {
  if (typeof input.agent_id === "string") {
    return input.agent_id;       // ← pole snake_case
  }

  if (typeof input.agentId === "string") {
    return input.agentId;        // ← pole camelCase
  }

  return undefined;              // → createWorkerLock vrátí "missing_agent_id"
}
```

**Funkce `getAgentId` NEPARSUJE žádný text.** Čte výhradně přímé JSON pole `input.agent_id`
nebo `input.agentId` na top-level objektu.

**`getHandoffId` je zachována** (audit logging). Pokud je `handoff_id` přítomno jako
strukturované pole, zaloguje se vedle `agent_id`. Nepodmiňuje vznik locku.

**Chování `createWorkerLock`:**

```
getAgentId(input) vrátí undefined
  → return "missing_agent_id"
  → hook přidá zprávu: "worker.lock was not created because agent_id is missing"
  → lock soubor NEVZNIKNE
```

```
getAgentId(input) vrátí "agent-xyz-001"
  → fs.open(SESSION_LOCK_PATH, "wx")  // atomic exclusive create
  → writeFile({"lockedBy":"agent-xyz-001","lockedAt":"ISO"})
  → return "acquired"
```

**Chování `releaseWorkerLock`:**

```
lock.lockedBy === agent_id  → unlink(SESSION_LOCK_PATH)   // smazání
lock.lockedBy !== agent_id  → nic (lock zůstane)
```

---

## 3. Část A — Mechanický test hooku (ihned, bez Codex App)

> **Spusť v PowerShellu z kořene repozitáře.** Testuje hook skript přímo — nezávisí na Codex App.

---

### A1 — SubagentStart: vznik locku

**Co ověřuje:** Hook přijme `agent_id` jako přímé JSON pole, vytvoří `worker.lock`
s `lockedBy` shodným s hodnotou `agent_id` — a NE s `handoff_id`.

```powershell
$payload = @{
  hook_event_name = "SubagentStart"
  session_id      = "s-live-test-001"
  turn_id         = "t-live-001"
  cwd             = (Get-Location).Path
  model           = "openai_gpt"
  permission_mode = "default"
  agent_id        = "agent-live-test-001"
  handoff_id      = "hp-20260617-live-hook-test"
} | ConvertTo-Json -Compress

$payload | node .codex/hooks/autopilot-hook.mjs
```

**Očekávaný stdout (PASS):**
```json
{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Treat subagent output as a bounded draft. ..."}}
```

Stdout nesmí obsahovat: `"agent_id is missing"`, `"could not be created"`, `"already_locked"`.

**Ověř lock:**
```powershell
Get-Content docs/autopilot/session-state/worker.lock
```

**PASS kritérium:** Soubor existuje, obsah je:
```json
{"lockedBy":"agent-live-test-001","lockedAt":"2026-06-17T..."}
```

`lockedBy` MUSÍ být `"agent-live-test-001"` (hodnota `agent_id`), nikoliv
`"hp-20260617-live-hook-test"` (hodnota `handoff_id`).

**FAIL kritérium:** Soubor neexistuje NEBO `lockedBy` obsahuje `handoff_id` hodnotu NEBO
stdout obsahuje `"agent_id is missing"`.

---

### A2 — SubagentStop: uvolnění locku

**Co ověřuje:** Hook při SubagentStop se stejným `agent_id` smaže lock.

> Spusť až po úspěšném A1.

```powershell
$payload = @{
  hook_event_name = "SubagentStop"
  session_id      = "s-live-test-001"
  turn_id         = "t-live-001"
  cwd             = (Get-Location).Path
  model           = "openai_gpt"
  permission_mode = "default"
  agent_id        = "agent-live-test-001"
  handoff_id      = "hp-20260617-live-hook-test"
} | ConvertTo-Json -Compress

$payload | node .codex/hooks/autopilot-hook.mjs
```

**Ověř smazání:**
```powershell
Test-Path docs/autopilot/session-state/worker.lock
```

**PASS kritérium:** `Test-Path` vrátí `False` (soubor neexistuje).

**FAIL kritérium:** `Test-Path` vrátí `True` (lock zůstal).

---

### A3 — Ledger: hook zapsal události

**Co ověřuje:** Hook loguje SubagentStart a SubagentStop události do ledgeru.

```powershell
Get-Content .codex/state/events.jsonl | Select-Object -Last 5
# pokud cesta neexistuje, najdi ji:
Get-ChildItem .codex -Recurse -Filter "events.jsonl" | Get-Content | Select-Object -Last 5
```

**PASS kritérium:** Poslední záznamy jsou JSON řádky s SubagentStart/SubagentStop
událostmi a časovým razítkem. Záznamy mohou obsahovat `agent_id`; neobsahují raw
prompt text.

**FAIL kritérium:** Soubor neexistuje nebo je prázdný → hook se vůbec nespustil
(viz Výsledek 3).

---

### A-BONUS — Souběžnostní test (sériové vynucení)

**Co ověřuje:** Druhý SubagentStart při obsazeném locku vrátí `"already present"` a
nepřepíše stávající lock.

**Krok 1 — Simuluj obsazený lock:**
```powershell
'{"lockedBy":"agent-live-test-001","lockedAt":"2026-06-17T15:00:00.000Z"}' |
  Out-File docs/autopilot/session-state/worker.lock -Encoding utf8 -NoNewline
```

**Krok 2 — Zkus druhý SubagentStart s jiným `agent_id`:**
```powershell
$payload2 = @{
  hook_event_name = "SubagentStart"
  session_id      = "s-live-test-002"
  turn_id         = "t-live-002"
  cwd             = (Get-Location).Path
  agent_id        = "agent-second-worker-001"
} | ConvertTo-Json -Compress

$payload2 | node .codex/hooks/autopilot-hook.mjs
```

**PASS kritérium:**
- Stdout obsahuje: `"worker.lock already present; previous worker session may still be active."`
- `Get-Content docs/autopilot/session-state/worker.lock` stále ukazuje `"lockedBy":"agent-live-test-001"`.

**Cleanup po testu:**
```powershell
Remove-Item docs/autopilot/session-state/worker.lock -Confirm:$false
```

---

## 4. Část B — Živý Codex App test (S1 ověření)

> Tato část ověřuje, jestli Codex App SubagentStart payload skutečně obsahuje `agent_id`
> jako top-level JSON pole — to je samotné S1 riziko.

### Proč `agent_id` a ne `handoff_id`

Codex runtime přiřazuje každé subagent invokaci nativní `agent_id`. Toto pole je vždy
přítomno v SubagentStart payloadu bez nutnosti caller-side injekce.

`handoff_id` je naše governance ID (formát `hp-YYYYMMDD-slug`). Codex CLI 0.106.0 nemá
`--metadata` flag — není způsob, jak ho vložit jako top-level JSON pole při spuštění.
Worker vidí `handoff_id` v textu zadání a MUSÍ ho vrátit ve strukturovaném výstupu;
supervisor ověří auditní korelaci z tohoto výstupu.

### Spuštění live subagenta

Spusť Codex / Claude Code subagenta s trivialním read-only úkolem. Codex runtime
automaticky pošle `agent_id` v SubagentStart payloadu bez nutnosti dalšího nastavení.

**Triviální bounded úkol pro Codex workera:**
```
handoff_id: hp-20260617-live-hook-test

Přečti soubor docs/projects/autopilot-control-plane/work-log.md.
Vrať poslední tři záznamy jako plain-text shrnutí (3–5 vět).
Nepřidávej nic do žádného souboru.
Nespouštěj žádné příkazy kromě čtení souboru.
Výstup: pouze textové shrnutí.
```

### Kontrolní kroky

**Za běhu** (ihned po SubagentStart, před dokončením):
```powershell
Get-Content docs/autopilot/session-state/worker.lock -ErrorAction SilentlyContinue
```

**PASS: lock existuje, `lockedBy` je `agent_id` hodnota přiřazená Codexem** — vypadá jako
`"codex-agent-<uuid>"` nebo podobný runtime identifikátor, nikoliv `"hp-..."` formát.

**Po dokončení** (SubagentStop):
```powershell
Test-Path docs/autopilot/session-state/worker.lock  # PASS = False
```

### Audit korelace přes strukturovaný worker output

Worker MUSÍ vrátit `handoff_id` ve strukturovaném JSON výstupu. Zkontroluj:

```powershell
# Pokud worker vrátil JSON output do spike-artifacts:
Get-Content docs/autopilot/spike-artifacts/*-worker.json | ConvertFrom-Json | Select-Object handoff_id
```

**PASS audit korelace:** Worker output obsahuje `handoff_id: "hp-20260617-live-hook-test"`.  
Uzavřený auditní řetězec: supervisor vydal `handoff_id` v zadání → worker ho vrátil
ve strukturovaném výstupu → supervisor ověřil, že výstup patří ke správnému úkolu.

---

## 5. Interpretace výsledků

### Tabulka 4 výsledků

| # | Situace | Signál | Co to znamená |
|---|---|---|---|
| 1 ✅ | Lock vznikl s `agent_id`, po stop smazán, worker output má `handoff_id` | `lockedBy` = runtime `agent_id`; `Test-Path` = False; worker JSON má `handoff_id` | S1 ověřen end-to-end |
| 2 ⚠️ | Hook fires, lock nevznikl | Stdout: `"agent_id is missing"`, `worker.lock` neexistuje | `agent_id` v SubagentStart payloadu chybí |
| 3 ❌ | Hook se vůbec nespustil | `events.jsonl` prázdný/neexistující, žádný stdout | Hook skript se neexekutoval |
| 4 🔒 | Lock vznikl, ale po SubagentStop zůstal | `Test-Path worker.lock` vrátí `True` | SubagentStop nedostal shodný `agent_id` |

---

### Výsledek 1 ✅ — S1 ověřen

```
worker.lock: {"lockedBy":"codex-agent-<uuid>","lockedAt":"..."}   ← agent_id hodnota
po SubagentStop: neexistuje
worker output: {"handoff_id":"hp-20260617-live-hook-test", ...}   ← audit korelace
```

**Akce:** Zapiš datum, verzi Codex App / Claude Code a pozorovaný tvar `agent_id`
do adoption record (viz sekce 6). S1 riziko uzavřeno.

---

### Výsledek 2 ⚠️ — `agent_id` chybí v payloadu

```
stdout: "worker.lock was not created because agent_id is missing; do not claim serial worker enforcement."
worker.lock: neexistuje
```

**Příčina:** Codex App SubagentStart payload neobsahuje `agent_id` jako top-level JSON
pole. Může jít o starší verzi Codex CLI nebo nestandardní invokaci.

**Diagnostika:**
```powershell
# Ověř verzi Codex CLI:
codex --version

# Ověř probe — funguje ruční `agent_id`:
echo '{"hook_event_name":"SubagentStart","agent_id":"test-probe"}' | node .codex/hooks/autopilot-hook.mjs
Get-Content docs/autopilot/session-state/worker.lock -ErrorAction SilentlyContinue
Remove-Item docs/autopilot/session-state/worker.lock -ErrorAction SilentlyContinue -Confirm:$false
```

Pokud probe vytvoří lock → hook funguje, ale Codex CLI nativně `agent_id` neposílá.
Eskaluj vlastníkovi s výstupem `codex --version` a výsledkem probe.

---

### Výsledek 3 ❌ — Hook se nespustil

```
events.jsonl: neexistuje nebo prázdný
worker.lock: neexistuje
```

**Diagnostika:**
```powershell
# Ověř, že hook script spustitelný:
node .codex/hooks/autopilot-hook.mjs
# Očekávaný výstup: {"continue":true,"systemMessage":"... invalid JSON input ..."}

# Ověř hooks.json konfiguraci:
Get-Content .codex/hooks.json | ConvertFrom-Json | Select-Object -ExpandProperty hooks

# Ověř SubagentStart matcher:
(Get-Content .codex/hooks.json | ConvertFrom-Json).hooks.SubagentStart
```

Možné příčiny:
- Node.js není na PATH
- `.codex/hooks.json` není načten aktivní session
- Hooks jsou v nastavení Claude Code pro tento projekt vypnuty
- Cesta v `commandWindows` klíči neodpovídá aktuálnímu umístění repozitáře

---

### Výsledek 4 🔒 — Lock zůstal po SubagentStop (leak)

```
Test-Path docs/autopilot/session-state/worker.lock  → True
obsah: {"lockedBy":"codex-agent-<uuid>",...}
```

**Příčina:** SubagentStop nedostal shodný `agent_id` jako SubagentStart
(`releaseWorkerLock` maže lock pouze pokud `lock.lockedBy === agentId`).

**Ruční cleanup (bezpečné — lock je advisory):**
```powershell
Remove-Item docs/autopilot/session-state/worker.lock -Confirm:$false
```

**Další krok:** Zkontroluj, jestli SubagentStop dostává stejný `agent_id` jako SubagentStart.
Pokud ne, eskaluj vlastníkovi — může jít o to, že Codex runtime mění `agent_id` mezi
Start a Stop událostmi.

---

## 6. Acceptance kritéria a adoption record

### S1 je uzavřeno, pokud jsou splněna všechna tato kritéria:

- [ ] A1 PASS: lock vznikl; `lockedBy` = hodnota `agent_id` (tvar runtime identifikátoru, nikoliv `hp-...`)
- [ ] A2 PASS: lock smazán po SubagentStop se stejným `agent_id`
- [ ] A3 PASS: `events.jsonl` obsahuje záznamy SubagentStart + SubagentStop
- [ ] A-BONUS PASS: `"already present"` při obsazeném locku, původní lock nepřepsán
- [ ] B PASS: živý Codex App worker → lock vznikl s `lockedBy` = Codex-native `agent_id` → smazán po stop
- [ ] AUDIT PASS: worker output obsahuje `handoff_id` shodné se zadáním supervisora

### Co zapsat do adoption record po úspěchu

Přidej záznam do `docs/autopilot/adoption-records/` (formát `YYYY-MMDD-s1-hook-verified.md`):

```markdown
# Adoption Record

## Decision ID
adopt-YYYY-MMDD-s1-hook-verified

## Date
YYYY-MM-DD

## What Was Proposed
Verify S1: live SubagentStart hook creates worker.lock keyed on agent_id,
SubagentStop releases it, and worker output carries handoff_id for audit correlation.

## Decision: adopted

## Who Decided
[vlastník]

## Reason
[Popis co fungovalo: A1-A3 prošly / B prošlo / pozorovaný tvar agent_id]

## What Was Changed (file paths)
[prázdné pokud jen verifikace]

## Tests Or Evidence
- A1: worker.lock vznikl s lockedBy = agent_id (ne handoff_id) ✓
- A2: worker.lock smazán po SubagentStop ✓
- A3: events.jsonl obsahuje SubagentStart + SubagentStop záznamy ✓
- A-BONUS: already_locked zpráva při obsazeném locku ✓
- B: [PASS / PARTIAL / N/A] — live Codex App run; pozorovaný agent_id: [hodnota]
- AUDIT: worker output handoff_id = hp-20260617-live-hook-test ✓
- Codex App verze: [verze]
- Claude Code verze: [verze]
```

---

## 7. Referenční soubory

| Soubor | Co obsahuje | Relevantní místa |
|---|---|---|
| `.codex/hooks/autopilot-hook.mjs` | Hook skript | `getAgentId` (po impl.), `createWorkerLock`, `releaseWorkerLock`, `handleSubagentStart` |
| `.codex/hooks.json` | Hook registrace | SubagentStart, SubagentStop (matcher `.*`) |
| `.codex/state/events.jsonl` | Hook ledger (gitignorován) | SubagentStart/Stop záznamy |
| `docs/autopilot/session-state/worker.lock` | Lock soubor (gitignorován) | — |
| `docs/autopilot/session-state/session.json` | Session manifest (gitignorován) | — |
| `tests/codex-hooks.test.ts` | Unit testy locku | lock lifecycle testy (agent_id varianta po impl.) |
| `docs/autopilot/adoption-records/2026-0617-lock-keyed-on-agent-id.md` | Design decision | owner schválení |
| `docs/autopilot/spike-artifacts/hp-20260617-rekey-lock-to-agent-id-handoff.md` | Task card | implementační detail |

---

*Tento plán je self-contained. Nevyžaduje přístup k žádnému externímu systému, nevykonává žádný destruktivní příkaz bez cleanup kroku a nemění žádný zdrojový soubor bez explicitního schválení.*
