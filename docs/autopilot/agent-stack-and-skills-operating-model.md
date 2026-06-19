# Agent Stack, Context7, and Cross-Vendor Skills — Operating Model

Date introduced: 2026-06-19
Status: phase-0 proposal, under 3-vendor review (this document)
Owner: Autopilot Control Plane
Reviewer of record: Claude (Opus 4.8)
Relation: extends `prompt_library_policy`, `capability_routing`, `context_economy_policy`,
and `codex_hooks_guardrail`. It is **policy + thin adapters**, not a new runtime or a
second source of truth (`CAP-PARALLEL-001`).

> Companion to `multi-model-orchestration-operating-model.md`. Together they define how
> the three lanes (strategic / technical / UX-external) share **docs** (Context7) and
> **process** (skills-core) so they behave consistently instead of drifting.

---

## Shrnutí (CZ)

Dva návrhy:

1. **Context7 = core MCP** (ne volitelný) → Claude, Codex i Antigravity berou dokumentaci
   ze stejného zdroje. Pro `agy` přidat do `~/.gemini/config/mcp_config.json`.
2. **Skills vendor-neutral + tenké adaptery**: `.agent/skills-core/<skill>/SKILL.md`
   (sdílený proces + output contract) + `.agent/adapters/{codex,claude,antigravity}/<skill>.md`
   (jen provider rozdíly). Místo tří ručně udržovaných sad.

Opus verdikt: **adopt obojí** — protože **už to děláme v malém**. AGENTS.md/`AI-CONTEXT7-001`
už dělá Context7 prvním zdrojem pravdy pro tech-claims; a `prompt-library/` už má přesně
ten vzor „sdílená pravidla + per-vendor složky" (`00-rules/` + `01-gpt/02-gemini/03-claude/
04-qwen-local/`). Tyhle návrhy ten vzor jen **rozšiřují na skills a MCP**. Klíčové
podmínky: Context7 „core" = default-on, **ne blokující** (fail-open + fallback na
official docs); a **anti-drift validátor**, aby adaptery zůstaly tenké a core
autoritativní.

---

## 1. Context7 as a CORE MCP (default-on, fail-open)

### 1.1 Why core, not optional

`AI-CONTEXT7-001` already says: *"use Context7 first when connected; otherwise record
official-docs fallback."* Making Context7 a core MCP server **formalizes existing
policy** and, crucially, gives all three lanes the **same docs source** — directly
reducing the "three brains disagree because they read different/stale docs" failure that
the multi-model loop is most exposed to. Typical surface: React/Next/Vite/Tailwind/
shadcn, Prisma/Supabase/Drizzle, Playwright, Cloudflare Workers, the
OpenAI/Anthropic/Gemini SDKs, Stripe, Auth.js, TanStack, Zod.

### 1.2 Hard conditions

- **Core ≠ required.** "Core" means default-on and first-choice, **not** a blocking
  dependency. If Context7 is down/slow/returns nothing, **fail open** to official docs
  and record the fallback (the rule already mandates this). Determinism and availability
  discipline (`PROTECT-SUP-003`) must hold.
- **Privacy boundary.** Context7 is an *external docs-retrieval* service. Query it by
  **library/symbol name**, never by pasting proprietary source. This is the same
  "redact before external" rule that governs the Gemini lane (`GEMINI.md`). A docs MCP
  must not become an exfiltration path for private code.
- **Freshness is advisory, not authority.** Context7 output still verifies *against*
  official docs for anything load-bearing; it speeds verification, it is not a new
  source of truth (`PROMPT-LIB-001`).
- **Antigravity wiring** goes in `~/.gemini/config/mcp_config.json` (user-scoped) so
  `agy` resolves the same source. Treat that file like any MCP trust surface (§1.3).

### 1.3 Adding an MCP to `agy` — trust surface

Each MCP server added to a vendor config is **new attack surface + a new availability
dependency**. Before enabling, run the existing gate (AGENTS.md prompt-library item 6):
verify availability, cost, privacy, and mutation boundary. Context7 is read-only docs →
low mutation risk, but still: pin the server source, no secrets in the query path,
fail-open.

---

## 2. Vendor-neutral skills + thin adapters

### 2.1 This is the prompt-library pattern, reused

The repo already proves this shape in `prompt-library/`:

```
prompt-library/00-rules/      ← shared, vendor-neutral contracts
prompt-library/01-gpt/        ← provider deltas
prompt-library/02-gemini/
prompt-library/03-claude/
prompt-library/04-qwen-local/
```

The proposed `.agent/skills-core/` + `.agent/adapters/{codex,claude,antigravity}/` is the
**same DRY split applied to executable skills**. Endorse — it is consistent with proven
local structure, not a new paradigm.

```
.agent/
  skills-core/<skill>/SKILL.md      ← when-to-use, required process, never-do, OUTPUT CONTRACT
  adapters/<vendor>/<skill>.md      ← ONLY provider deltas (tools, conventions, output routing)
  outputs/                          ← where skills write results (feeds supervision + usage ledger)
```

### 2.2 The one risk that matters: core↔adapter drift

A vendor-neutral core only stays valuable if adapters stay **thin**. Drift = an adapter
quietly accreting process logic that belongs in core, or core/adapter disagreeing. This
is the make-or-break and is exactly what the technical-opponent pass (§4) is asked to
stress.

Opus prevention design (deterministic, mirrors `validate-prompt-library.ts`):

- **Schema for adapters**: allowed keys only — `core_skill_id`, `tools`, `conventions`,
  `output_routing`. Any *process step* (when-to-use, required steps, never-do, output
  contract) in an adapter = validation error. Process lives in core, period.
- **Referential check**: every adapter must reference an existing `skills-core/<id>`;
  every core skill should have ≥1 adapter or be marked `vendor_neutral_runnable`.
- **Output-contract ownership**: the `.agent/outputs/...` contract is defined **once**
  in core; adapters may not redefine it. This keeps skill output ingestible by
  Protective Supervision and the usage-ledger.
- **CI gate**: add `skills:validate` to `npm run verify` so drift fails the build.

### 2.3 Output contracts tie skills into governance

Each skill's "write result to `.agent/outputs/...`" contract is the bridge to existing
nodes: Protective Supervision normalizes those outputs into bounded handoff packets
(`PROTECT-SUP-001`), and the usage-ledger records which run produced which artifact.
One output convention, three consumers (supervision, ledger, next-lane handoff).

---

## 3. Core stack (endorsed, each behind the availability gate)

| Layer | Purpose | Gate |
|---|---|---|
| Superpowers | shared workflow philosophy | already used |
| **Context7 MCP** | current docs, all lanes | core, fail-open (§1) |
| Playwright / Browser MCP | UI verification, preview review | availability/cost |
| GitHub MCP | issues, PRs, CI context | read-first; writes need remote-mutation approval |
| Selected third-party skills | specialized playbooks | source/license/privacy review (`PROMPT-LIB-001`) |
| Frontend skills | frontend/Next playbooks | same |
| `.agent/skills-core` | our process + output contracts | anti-drift validator (§2.2) |
| Provider adapters | Codex/Claude/Antigravity specifics | thin, schema-enforced |

Every MCP added is attack surface + an availability dependency: default-on but
**fail-open**, and never source of truth.

### 3.1 One naming decision (avoid two skill homes)

This introduces `.agent/` alongside `.codex/` and `prompt-library/`. Decide explicitly:
`.agent/` is the **cross-vendor skill/adapter + outputs** home; `prompt-library/` stays
the **prompt contract** home; `.codex/` stays **hooks/state**. Document the boundary so
we don't grow two parallel "skills" trees (`CAP-PARALLEL-001`). *Open decision for the
owner — recorded, not assumed.*

---

## 4. GPT lane — hard technical opponent (Codex, real, reasoning=high)

Codex validated the direction but sharpened every weak edge:

- **"Core MCP" is not enforceable** across Claude/Codex/Antigravity — they differ in
  invocation semantics, timeout, permission model, and failure handling. "Same source"
  does **not** mean "same result". Treat Context7 as a *preferred resolver with
  fallback*, not a uniform guarantee.
- **Vendor-neutral skills are not truly portable** when the process leans on
  provider-specific affordances (`apply_patch`, TodoWrite, MCP discovery, browser
  control, artifact paths, approval modes). Core must stay at the *process* layer; the
  affordance differences are exactly what adapters absorb.
- **READ-ONLY MCP is a trust boundary, not a passive file.** A read-only docs tool can
  still exfiltrate prompts, paths, repo snippets, or usage patterns. Treat every MCP
  server as a code-execution/exfiltration risk.
- **Drift control is the missing mechanism — "thin adapters" is a slogan without CI.**
  Enforceable invariants: core owns required steps / forbidden actions / output schema /
  evidence fields / failure states; adapters may only *map* those to provider
  commands; adapters must declare `core_skill_id` + `core_version`; adapters may not add
  policy, stop conditions, or source-of-truth rules.
- **Context7 as mandatory core = centralized wrongness + availability/rate-limit/
  version-drift risk + query-payload leakage.** Required behavior: unavailable → fall
  back to pinned official docs/cache, or stop *only* for currentness-sensitive claims;
  never send private code unless explicitly allowed.
- **Global `~/.gemini/config/mcp_config.json` is a BAD DEFAULT.** Prefer **project-scoped**
  MCP config; pin server package/version/checksum; no broad inherited env; no secrets in
  env; explicit tool allowlist; audit logs; treat server compromise as context
  exfiltration.

### 4.1 Concrete CI drift check (adopted)

```
.agent/skills-core/<skill>/SKILL.md          # process prose
.agent/skills-core/<skill>/contract.json     # skill_id, version, required_steps,
                                              # forbidden_actions, output_schema
.agent/adapters/<provider>/<skill>.md         # provider deltas only
.agent/adapters/<provider>/<skill>.manifest.json  # skill_id, core_version, step→tool map
```

`skills:validate` (wire into `npm run verify`):
1. parse every core `contract.json`;
2. each adapter manifest must match `skill_id` + `core_version`, map **all**
   `required_steps`, and preserve **all** `forbidden_actions`;
3. **fail** if adapter markdown contains policy keywords (`must`, `never`, `source of
   truth`, `stop condition`) not mirrored from core;
4. fail if an adapter has no core, or a core has no required adapter;
5. validate output schemas + example artifacts.

This *detects* drift (makes divergence visible/reviewable); it does not prevent bad
policy — human review still owns that.

## 5. Three-vendor note & decision

Gemini lane was **intentionally not run** on this topic (burn-aware, "rebalance only
within fit": MCP/skills architecture is the technical lane's fit, not UX/external).
Recorded, not simulated. Two real lanes: Opus (strategic) + Codex (technical).

**Decision (Opus, for governance): ADOPT both, with conditions.**

1. **Context7 = core but fail-open.** Default-on, first-choice resolver; never a
   blocking dependency; query by library/symbol name, never proprietary source; output
   stays advisory vs official docs for load-bearing claims (`AI-CONTEXT7-001`).
2. **Context7 in Antigravity = project-scoped**, pinned, tool-allowlisted, no secrets in
   env — not the global user config.
3. **skills-core + thin adapters = adopt**, but only behind the §4.1 CI drift check;
   without `skills:validate` in `verify`, do not ship the split (it would just become 3
   diverging sets with extra steps).
4. **Output contracts live in core**, feed `.agent/outputs/` → Protective Supervision +
   usage-ledger. One output convention, three consumers.
5. **Naming boundary (owner decision, §3.1):** `.agent/` = cross-vendor skills/adapters/
   outputs; `prompt-library/` = prompt contracts; `.codex/` = hooks/state. Do not grow a
   second skills home (`CAP-PARALLEL-001`).

Sequence: land `skills:validate` + one pilot skill (`safe-refactor`) across all three
adapters first; prove the drift check fails on a planted violation; only then port the
rest.
