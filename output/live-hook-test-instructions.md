# Live Hook Test — S1/R1 Ověření

**Účel:** Ověřit, že `autopilot-hook.mjs` při SubagentStart reálně:
1. vytvoří `docs/autopilot/session-state/worker.lock` s `lockedBy === handoff_id`
2. smaže ho při SubagentStop se stejným `handoff_id`

## Aktualizace 2026-06-17 po prvnim overeni

- Skutecny hook ledger je `.codex/state/events.jsonl`, ne
  `.codex/hooks/state/ledger.jsonl`.
- V PowerShellu nepouzivej prosty pipeline tvar `$payload | node ...` pro JSON
  stdin smoke test. V tomto Windows prostredi hook dostal invalid JSON. Pouzij
  explicitni UTF-8 stdin pres Node `spawnSync`.
- `.codex/hooks.json` spousti Codex CLI/App lifecycle runner po nacteni a trust
  review projektove `.codex` vrstvy. Claude Code ani aktualni
  `multi_agent_v1.spawn_agent` neni prokazany runner techto repo-local Codex
  hooku.
- Oficialni Codex `SubagentStart` schema dokumentuje `turn_id`, `agent_id`,
  `agent_type` a `permission_mode`; `handoff_id` neni oficialni pole. Live B
  test proto musi overit, jestli konkretni runner umi predat custom top-level
  `handoff_id`, jinak zustava S1 otevrene.

### Bezpecny mechanicky stdin wrapper pro PowerShell

Pouzij tento pattern misto `$payload | node .codex/hooks/autopilot-hook.mjs`:

```powershell
node -e "const {spawnSync}=require('child_process'); const payload={hook_event_name:'SubagentStart',session_id:'s-live-test-001',turn_id:'t-live-001',cwd:process.cwd(),model:'openai_gpt',permission_mode:'default',handoff_id:'hp-20260617-live-hook-test'}; const r=spawnSync(process.execPath,['.codex/hooks/autopilot-hook.mjs'],{input:JSON.stringify(payload),encoding:'utf8'}); process.stdout.write(r.stdout); process.stderr.write(r.stderr); process.exit(r.status ?? 0);"
```

Pro `SubagentStop` zmen jen `hook_event_name` na `SubagentStop`.

---

## Nejdřív: jak hook čte `handoff_id`

```javascript
// .codex/hooks/autopilot-hook.mjs — getHandoffId(), řádky 401–410
function getHandoffId(input) {
  if (typeof input.handoff_id === "string") return input.handoff_id;   // ← 1. pokus
  if (typeof input.handoffId  === "string") return input.handoffId;    // ← 2. pokus
  return undefined;  // → "missing_handoff" → lock se nevytvoří
}
```

**Kritický poznatek:** hook NEPARSUJE text úkolu. `handoff_id` musí přijít jako
**přímé JSON pole** v SubagentStart payloadu, ne jako řádek v textu zadání.
Pokud Codex App pošle pouze `input.task = "text..."`, lock nikdy nevznikne.

---

## Část A — Mechanický test (bez Codex App, ihned ověří samotný hook)

Tímhle zjistíš, jestli hook funguje správně, aniž bys musel spouštět Codex App.
Spusť v PowerShellu z kořene repozitáře:

### A1 — SubagentStart: vytvoření locku

```powershell
$payload = @{
  hook_event_name = "SubagentStart"
  session_id      = "s-live-test-001"
  turn_id         = "t-live-001"
  cwd             = (Get-Location).Path
  model           = "openai_gpt"
  permission_mode = "default"
  handoff_id      = "hp-20260617-live-hook-test"
} | ConvertTo-Json -Compress

# Nepouzivej "$payload | node ..." v PowerShellu. Pouzij bezpecny Node
# spawnSync wrapper z aktualizace nahore se stejnymi poli payloadu.
```

**Očekávaný výstup** (JSON na stdout):
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SubagentStart",
    "additionalContext": "Treat subagent output as a bounded draft. ..."
  }
}
```
> Nesmí obsahovat `"handoff_id is missing"` ani `"could not be created"`.

**Ověř lock:**
```powershell
Get-Content docs/autopilot/session-state/worker.lock
```

Musí obsahovat:
```json
{"lockedBy":"hp-20260617-live-hook-test","lockedAt":"2026-06-17T..."}
```

### A2 — SubagentStop: uvolnění locku (pokud A1 prošel)

```powershell
$payload = @{
  hook_event_name = "SubagentStop"
  session_id      = "s-live-test-001"
  turn_id         = "t-live-001"
  cwd             = (Get-Location).Path
  model           = "openai_gpt"
  permission_mode = "default"
  handoff_id      = "hp-20260617-live-hook-test"
} | ConvertTo-Json -Compress

# Nepouzivej "$payload | node ..." v PowerShellu. Pouzij bezpecny Node
# spawnSync wrapper z aktualizace nahore a zmen hook_event_name na SubagentStop.
```

**Ověř, že lock zmizel:**
```powershell
Test-Path docs/autopilot/session-state/worker.lock
# musí vrátit: False
```

### A3 — Kontrola ledgeru

Po A1 a A2 zkontroluj, jestli hook zapsal do ledgeru:
```powershell
Get-Content .codex/state/events.jsonl | Select-Object -Last 5
# nebo pokud cesta neexistuje:
Get-ChildItem .codex -Recurse -Filter "events.jsonl" | Get-Content | Select-Object -Last 5
```

---

## Část B — Live Codex App test (ověří propagaci `handoff_id` přes skutečný SubagentStart)

> **Předpoklad:** Claude Code hooks jsou zapnuté a `.codex/hooks.json` je aktivní.

### B1 — Zadání úkolu s `handoff_id` jako JSON polem

Supervisor (Claude Opus) musí při vytváření Task/Agent subagenta předat
`handoff_id` jako **strukturované pole** v inputu nástroje — ne jen jako text v popisu.

**Aktualni overeny stav runneru:** `codex.cmd --help` a `codex.cmd exec --help`
pro `codex-cli 0.106.0` neukazuji `--metadata`. `codex exec` umi cist prompt ze
stdin, ale to neni tottez jako pridat top-level pole do hook payloadu. Proto
nepovazuj `codex --metadata` ani JSON prompt na stdin za overenou B cestu,
dokud to nepotvrdi aktualni CLI/App dokumentace nebo skutecny lifecycle event v
`.codex/state/events.jsonl`.

**Cesta pro realny B test:** spustit novou nebo refreshnutou Codex CLI/App
session v tomto repo, projit `/hooks` trust review a vyvolat Codexem vlastneny
subagent lifecycle. Behem behu kontrolovat `.codex/state/events.jsonl` a
`docs/autopilot/session-state/worker.lock`. Pokud se zapise SubagentStart, ale
bez locku, runner neposkytl `handoff_id` jako strukturovane pole.

**Pokud použiješ Agent/Task nástroj v Claude Code session (jen pokud je prokazane napojeny na Codex hook lifecycle):**

Při volání `Agent` nebo `Task` nástroje zahrň `handoff_id` přímo v objektu `input`:
```json
{
  "handoff_id": "hp-20260617-live-hook-test",
  "subagent_type": "claude",
  "prompt": "Přečti soubor docs/projects/autopilot-control-plane/work-log.md a vrať poslední 3 záznamy jako shrnutí. Nic neměň."
}
```

Jakmile Claude Code vytvoří subagenta s tímto inputem, hook dostane
`input.handoff_id = "hp-20260617-live-hook-test"` a lock se vytvoří.

**Pokud použiješ Codex CLI přímo:**

Codex CLI může předat `handoff_id` buď:

- **Nedolozena varianta `--metadata`** (aktualni help ji neukazuje):
  ```
  codex --metadata '{"handoff_id":"hp-20260617-live-hook-test"}' "Přečti docs/projects/autopilot-control-plane/work-log.md a vrať poslední 3 záznamy."
  ```

- **Nedolozena varianta JSON prompt na stdin** (neni hook payload):
  ```powershell
  '{"handoff_id":"hp-20260617-live-hook-test","task":"Přečti docs/projects/autopilot-control-plane/work-log.md a vrať poslední 3 záznamy."}' | codex
  ```

Pokud Codex CLI nepodporuje ani jedno → viz **výsledek C** níže.

### B2 — Triviální bounded úkol (bezpečný)

Úkol pro Codex workera — nic nerozbije, jde snadno ověřit:

```
handoff_id: hp-20260617-live-hook-test

Přečti soubor docs/projects/autopilot-control-plane/work-log.md.
Vrať poslední tři záznamy jako plain-text shrnutí.
Nepřidávej nic, neupravuj žádný soubor, nespouštěj žádné příkazy.
Výstup: shrnutí 3–5 vět.
```

> Proč tento úkol: read-only, žádný zápis, výsledek ihned viditelný, nepotřebuje nic z internetu.

### B3 — Po dokončení Codex subagenta: co zkontrolovat

**Za běhu** (ihned po SubagentStart, před dokončením):
```powershell
Get-Content docs/autopilot/session-state/worker.lock -ErrorAction SilentlyContinue
```

**Po dokončení** (SubagentStop):
```powershell
Test-Path docs/autopilot/session-state/worker.lock  # musí vrátit False
```

---

## Interpretace výsledků

### Výsledek 1 — ✅ PASS (S1 ověřen)

```
worker.lock obsah: {"lockedBy":"hp-20260617-live-hook-test","lockedAt":"..."}
lock po dokončení: neexistuje
```

**Co to znamená:** Hook dostává `handoff_id` jako přímé JSON pole v SubagentStart payloadu.
Celá smyčka SubagentStart → lock → SubagentStop → release funguje end-to-end.
R1 ověřen naživo. Můžeš se spolehnout na sériové vynucení přes worker.lock.

**Co dělat dál:** Zaznamenej datum a verzi Codex App/Claude Code do adoption record.
S1 riziko uzavřeno.

---

### Výsledek 2 — ⚠️ PARTIAL (hook fires, ale `handoff_id` není v payloadu)

```
hook message: "worker.lock was not created because handoff_id is missing; do not claim serial worker enforcement."
worker.lock: neexistuje
.codex/state/events.jsonl: záznam SubagentStart ale bez handoff_id pole
```

**Co to znamená:** Codex App/Claude Code SubagentStart hook payload neobsahuje
`handoff_id` jako přímé JSON pole. Buď:
(a) supervisor předal `handoff_id` pouze v textu popisu (hook ho neparsuje), nebo
(b) Codex App samo o sobě neposkytuje strukturovaný `handoff_id` field v SubagentStart.

**Co dělat dál — dvě možnosti:**

- **Opce 1 (krátkodobé obejití):** Supervisor vždy vkládá `handoff_id` jako přímé pole
  v Task/Agent tool inputu (ne jen v textu). Zkontroluj, jak Claude Code formátuje
  SubagentStart payload při použití Task nástroje.

- **Opce 2 (strukturální fix):** Rozšiř `getHandoffId` o parsování `input.task` textu:
  ```javascript
  // po stávajícím kódu:
  const taskText = typeof input.task === "string" ? input.task : "";
  const match = taskText.match(/handoff[_-]id:\s*(hp-\d{8}-[a-z0-9][a-z0-9-]*)/i);
  if (match) return match[1];
  ```
  Tato změna by zachytila `handoff_id: hp-...` i z textu úkolu.
  Vyžaduje nový handoff packet a review před implementací.

---

### Výsledek 3 — ❌ FAIL (hook se vůbec nespustil)

```
.codex/state/events.jsonl: neexistuje nebo prázdný
worker.lock: neexistuje
```

**Co to znamená:** Hook se při SubagentStart nespustil. Možné příčiny:
- `.codex/hooks.json` není načteno Codex App/Claude Code
- Cesta k hook scriptu je špatná (zkontroluj `commandWindows` v hooks.json)
- Node.js není dostupný na PATH
- Hooks jsou v Claude Code nastaveném projektu vypnuté

**Co dělat dál:**
```powershell
# Ověř, že hook script existuje a spustí se:
node .codex/hooks/autopilot-hook.mjs
# měl by vrátit: {"continue":true,"systemMessage":"... invalid JSON input ..."}

# Ověř hooks.json:
Get-Content .codex/hooks.json | ConvertFrom-Json | Select-Object -ExpandProperty hooks
```

---

### Výsledek 4 — Lock existuje ale po dokončení zůstal (leak)

```
worker.lock po SubagentStop: stále existuje
obsah: {"lockedBy":"hp-20260617-live-hook-test",...}
```

**Co to znamená:** SubagentStop hook neproběhl nebo nedostal stejný `handoff_id`.
`releaseWorkerLock` maže lock pouze pokud `lock.lockedBy === handoffId`.

**Co dělat dál:**
```powershell
# Ruční cleanup (bezpečné):
Remove-Item docs/autopilot/session-state/worker.lock -Confirm:$false
```
Pak zkontroluj, jestli SubagentStop dostává `handoff_id` — stejný problém jako výsledek 2.

---

## Volitelný souběžnostní test

Pokud chceš ověřit sériové vynucení (že druhý worker čeká, když je lock obsazený):

```powershell
# Terminál 1 — vytvořit lock ručně:
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "docs/autopilot/session-state/worker.lock"),
  '{"lockedBy":"hp-20260617-live-hook-test","lockedAt":"2026-06-17T15:00:00.000Z"}',
  [System.Text.UTF8Encoding]::new($false)
)

# Terminál 2 — zkus spustit druhý SubagentStart s jiným handoff_id:
$payload2 = @{
  hook_event_name = "SubagentStart"
  session_id      = "s-live-test-002"
  turn_id         = "t-live-002"
  cwd             = (Get-Location).Path
  handoff_id      = "hp-20260617-second-worker"
} | ConvertTo-Json -Compress

# Nepouzivej "$payload2 | node ..." v PowerShellu. Pouzij bezpecny Node
# spawnSync wrapper z aktualizace nahore se stejnymi poli payloadu.
```

Výstup musí obsahovat: `"worker.lock already present"` → sériové vynucení funguje.

```powershell
# Cleanup po testu:
Remove-Item docs/autopilot/session-state/worker.lock -Confirm:$false
```

---

## Shrnutí: co S1 ověřuje a co ne

| Otázka | Část A (manuální) | Část B (live) |
|---|---|---|
| Hook script se spustí | ✓ ověřeno | ověří B |
| Lock vznikne a smaže se | ✓ ověřeno | ověří B |
| `handoff_id` proteče přes Codex App | ✗ neověřuje | **to je S1** |
| Sériové vynucení (already_locked) | ✓ ověřeno | ověří B |

Část A ověřuje hook mechaniku izolovaně. Část B (výsledek 1) je skutečné S1 ověření.

---

## Referenční soubory

- `docs/autopilot/session-state/worker.lock` — lock soubor (gitignorován)
- `docs/autopilot/session-state/session.json` — session manifest (gitignorován)
- `.codex/hooks/autopilot-hook.mjs:401` — `getHandoffId(input)` — přímé pole, bez text parsování
- `.codex/hooks/autopilot-hook.mjs:586` — `createWorkerLock(input)` — atomic `"wx"` flag
- `.codex/hooks/autopilot-hook.mjs:629` — `releaseWorkerLock(input)` — `lockedBy === handoffId` check
- `.codex/hooks.json` — hooks konfigurace (SubagentStart + SubagentStop s matcher `.*`)
- `tests/codex-hooks.test.ts:340` — unit test reprodukující stejný scénář
