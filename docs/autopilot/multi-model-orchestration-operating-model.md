# Multi-Model Orchestration & Burn-Rate Governance — Operating Model

Date introduced: 2026-06-19
Status: phase-0 proposal, validated by a real 3-vendor brainstorm (this document)
Owner: Autopilot Control Plane
Reviewer of record: Claude (Opus 4.8)
Relation: extends `reasoning_strategy`, `model_spend_policy`, `context_economy_policy`,
and `protective_supervision_policy` mesh nodes. It is **policy + evidence**, not a
runtime engine, and does not create a parallel source of truth (`CAP-PARALLEL-001`).

> Source: owner proposal "phased divergent brainstorm → controlled regime + burn-rate
> governance" (2026-06-19). External rate-card/limit claims in that proposal are kept
> **advisory** and must be re-checked against live meters (`antigravity-usage.cmd`,
> provider usage dashboards) per `AI-CONTEXT7-001` / `PROTECT-SUP-003`.

---

## Shrnutí (CZ)

Návrh: **na začátku projektu vědomě pálit drahé modely** na široký *divergentní*
brainstorm třemi nezávislými „mozky", pak konvergovat (merge → 2. kolo → rozhodnutí),
pak přepnout do **řízeného režimu** (plán → implementace → review → preview → finální
oponentura). Spotřebu řídit přes **burn_pct** (% vyčerpané kapacity), ne přes počet
tokenů či zpráv, a vyrovnávat ji **jen v rámci úkolů, které modelu sedí**.

Verdikt brainstormu (3 vendoři): **adopt**, ale se třemi tvrdými podmínkami —
(1) celý drahý vícemozkový režim **gatovat třídou úlohy** (nový projekt / velký směr;
ne rutina — jinak boří `CTX-ECON-001`/Caveman Mode); (2) cíl je **hodnota na jednotku
burnu**, ne rovný burn (jinak Goodhart); (3) merge musí být **mechanická extrakce
tvrzení** do tabulky *před* tím, než jakýkoli model rozhoduje (jinak se vrací kotvení,
kterému se 1. kolo vyhýbalo).

---

## 1. Why this fits Autopilot

This is the **same medicine** the 2026-06-19 mesh/learning review prescribed
(`autopilot-mesh-learning-map-2026-06-19.md`): turn static prose policy into a
*deterministic evidence → digest → decision* spine. There it was the taste/learning
loop; here it is **model spend + reasoning routing**. Both should share ONE evidence
substrate (the redacted ledger), not two.

| Existing node | Today (static) | With this policy (measured) |
|---|---|---|
| `reasoning_strategy` | prose: "frontier = advisory only" | + a **phase → reasoning** matrix (max in brainstorm/round-2/release; low in routine impl) |
| `model_spend_policy` | "smallest safe free/no-cost model" | + **burn_pct** signal + traffic-light gate driven by real meters |
| `context_economy_policy` | Caveman Mode, compact packets | + **context-width by phase** (wide only in brainstorm; narrow in impl) |
| `protective_supervision_policy` | progress/blocker states | + **usage dashboard** as the budget view of supervision |

The **usage-ledger** below is a concrete instance of the "durable redacted evidence
record" (gap G2/G5 in the mesh map). Implement it once; serve both learning and spend.

---

## 2. Lane roles (provider-neutral)

Bind to **roles**, not model versions (versions churn; `model_spend_policy` says never
assume a provider). The only thing you edit on a model change is the mapping table.

| Lane | Strength | Current mapping (2026-06-19) |
|---|---|---|
| **Strategic / design** | product framing, architecture judgment, final quality gate | Claude Opus 4.8 |
| **Technical opponent / implementability** | logic, edge cases, data model, maintenance, implementation | Codex CLI (GPT lane), reasoning=high |
| **UX / SEO / external / multimodal** | users, market, visual, trend, outside view | Antigravity `gemini-3.1-pro-high` |
| **Routine worker** | bounded impl, tests, docs, search | local Qwen / Sonnet / smaller Codex |

Rule (`no vendor roleplay`): a lane is only "filled" by a **real** vendor CLI round;
if a provider is unavailable, record it and proceed with the available lanes — never
simulate the missing one.

---

## 3. Phase workflow (gated by task class)

**Gate first.** The expensive 3-brain divergence runs ONLY for `new_project` or
`major_direction` task classes. For `routine` / `bounded` work, Caveman Mode +
`select_token_efficiency_route` still win — do not pay for divergence on trivia.

```
0. Intake Brief (single shared input; Sonnet/human)            [context: authored]
1. Independent Brainstorm 1 — NO cross-feeding (anti-anchor)   [reasoning: high/max, context: WIDE]
     strategic | technical | ux  → each answers the same brief
2. Merge — MECHANICAL claim-extraction table, THEN judge       [reasoning: med/high]
     area | strategic | technical | ux | agreement | conflict | recommended decision
3. Brainstorm 2 over merged concept                            [reasoning: high/max]
     strategic = whole holds? | technical = HARD opponent | ux = users/SEO/market opponent
4. Final direction: strategic decides, technical confirms logic [record in decision ledger]
5. Development plan (strategic/Sonnet) + technical validation   [reasoning: high]
6. Implementation (technical/Codex; routine worker for boilerplate) [context: NARROW]
7. Preview → UX/SEO review (ux lane on important pages)
8. Final review: technical check + strategic judgement         [reasoning: high/max]
9. Asset extraction: reusable rules → prompt-library / templates
```

Anti-anchoring (step 1) and mechanical-merge (step 2) are the two integrity controls;
everything else is throughput.

---

## 4. Burn-rate governance

### 4.1 The metric — corrected by technical review

The original `burn_pct` framing has a flaw the GPT lane caught: it is **semantically
inverted** (defining `consumed/capacity` but then treating 65–100% as "normal", which
reads as *remaining*). Split the two and carry a confidence:

```
consumed_pct  = consumed_in_period / capacity_in_period
remaining_pct = 1 - consumed_pct
measurement_confidence = high | medium | low | unknown
```

**Do NOT equalize provider burn** (revised position — both Opus and GPT lane). Equal
burn% Goodharts into routing tasks to the wrong/weaker/less-private provider just
because its quota is underused. Replace "equalize" with an explicit **routing order**:

```
eligibility → privacy fit → task fit → cost/quota state → recent quality → availability
```

Budget is a **late-stage gate**, never the primary selector. The 35/40/45 split (§4.3)
is a *descriptive expectation*, not a target to force.

Measurement honesty: drive the traffic light off the **real meter you have** —
Antigravity via `antigravity-usage.cmd quota --refresh --json` (hard %, `isExhausted`,
`resetTime`). Where a meter is hidden (consumer-UI Claude/Codex), record
`quota_source: unknown` and `measurement_confidence: low|unknown` — **do not invent a
burn number**; use it only as a coarse hint. Note also (UX lane): API usage often
reports **asynchronously (minutes–hours late)**, so the ledger lags real consumption —
never make a hard routing flip on a fresh, unsettled number.

### 4.2 Traffic light (per provider)

| State | Remaining | Behavior |
|---|---|---|
| 🟢 green | 65–100% | use normally |
| 🟡 yellow | 35–65% | expensive models only for *decisions* (not routine) |
| 🔴 red | 0–35% | critical tasks only; otherwise cheaper model / fallback |

Rebalance rule (**hard, not advisory**): top up an underused lane **only within tasks
that suit it**. Never give the UX lane a backend refactor or the strategic lane a CSS
patch just to move a number.

### 4.3 Suggested split (starting point, tune from ledger)

- Overall ≈ strategic 35–40% / technical 40–45% / UX-lane 10–20%.
- Brainstorm ≈ 33/33/33 but **only 1–2 quality runs** (the gate prevents loops).
- Implementation ≈ technical 60–70% / strategic 20–30% (review) / UX 5–15%.

---

## 5. Usage ledger (the evidence spine)

Per project: `.agent/usage/usage-ledger.jsonl` (redacted; no raw prompts/secrets — same
privacy rule as `.codex/state`). One line per meaningful model run:

```json
{
  "date": "2026-06-19",
  "project": "radeq-homepage",
  "phase": "brainstorm-1",
  "lane": "strategic",
  "provider": "anthropic",
  "model": "claude-opus-4-8",
  "surface": "web_ui",
  "reasoning": "high",
  "context_level": "wide",
  "task_type": "strategy_brainstorm",
  "estimated_tokens": 42000,
  "actual_tokens": null,
  "quota_source": "unknown",
  "measurement_confidence": "low",
  "remaining_pct_before": null,
  "remaining_pct_after": null,
  "quality_score": 0.9,
  "used_in_final_plan": true,
  "notes": "Best product framing, weaker implementation detail."
}
```

Plus a per-provider `provider-budget.json` (capacity_kind, capacity_total, consumed,
remaining, remaining_pct, source, confidence, updated_at) so the traffic light reads
from a typed snapshot, not ad-hoc parsing. `quota_source`/`measurement_confidence` are
mandatory: authoritative only where a meter exists (Antigravity); `unknown` elsewhere
(never a fabricated number). `quality_score` needs a defined rubric + evidence pointer,
or it becomes pseudo-authority. A deterministic script renders the per-project
dashboard. Same jsonl pattern as the decision/issue ledgers — build the store **once**
(mesh-map G2) and reuse it for both learning and spend.

**Implemented (typed mirror):** row/snapshot contracts in
[`usageLedger.ts`](../../src/data/delivery-system/usageLedger.ts); burn-governance
policy + `classifyBudgetState` traffic light in
[`modelSpend.ts`](../../src/data/delivery-system/modelSpend.ts); validators in
[`src/lib/delivery-system/usageLedger.ts`](../../src/lib/delivery-system/usageLedger.ts);
committed templates under [`.agent/usage/`](../../.agent/usage/); tests in
`tests/delivery-system/usage-ledger.test.ts`. `remaining_pct` is a 0..1 fraction;
unmetered surfaces classify as `yellow` (never a fabricated green).

The dashboard is rendered by
[`scripts/usage-dashboard.ts`](../../scripts/usage-dashboard.ts) (`npm run
usage:dashboard`, `--format json|markdown`, `--project`, `--phase`): it shows
**work-share vs target** and the **capacity traffic light** per provider — two numbers
kept deliberately separate — plus rebalance corrections (within-fit only) and
red-capacity warnings. Falls back to the committed `*.example.*` templates when no live
ledger exists.

**Degradation states** (a missing lane is never silent): `ready`,
`provider_unavailable`, `quota_unknown`, `quota_exhausted`, `blocked_owner`. The
orchestrator records the state; it does not fabricate a result for an absent lane
(`no vendor roleplay`).

### 5.1 Durable dispatch — never lose an agent's prompt (`AGENT-DISPATCH-001`)

Discovered the hard way (2026-06-19): a dispatch packet written to a **volatile temp
dir** was cleared between steps, so the vendor CLI ran with an **empty prompt** and
replied "I'm ready, tell me what you want". That must be impossible. Contract:

- Every agent prompt is **persisted to a durable, project-scoped path** (e.g.
  `.agent/dispatch/<id>.md`) **before** dispatch — never OS/MSYS temp.
- A vendor is **never invoked with an empty or near-empty prompt**.
- The persisted `prompt_path` + `dispatch_id` are recorded in the usage-ledger as
  evidence.

Enforced by a pure validator, mirroring the ledger contracts:
[`validateAgentDispatchPacket`](../../src/lib/delivery-system/agentDispatch.ts) +
typed packet in
[`agentDispatch.ts`](../../src/data/delivery-system/agentDispatch.ts), covered by
`tests/delivery-system/agent-dispatch.test.ts`. The validator is policy-neutral
(returns `errors`); the harness decides hard-stop vs report-first per `CODEX-HOOK-003`.

Operational note for the CLI harness itself: run headless Codex with stdin closed
(`codex exec "<prompt>" </dev/null`) — backgrounded runs otherwise hang on "Reading
additional input from stdin…"; and keep the prompt file alive for the whole call
(build packet + invoke in one step), which is exactly what `prompt_path` durability
guarantees.

---

## 6. Opus independent position (strategic lane, round 1)

Recorded before reading the other lanes (anti-anchoring, per the policy itself).

**Endorse the shape.** Divergent-then-convergent with *independent* round 1 is the
correct counter to multi-agent diversity collapse; the switch to a controlled regime
matches Autopilot's existing "normalize into bounded handoff packets, no model is
source of truth" stance. The proposal is essentially `model_spend_policy` +
`reasoning_strategy` becoming **measured instead of prose** — coherent with the
open-loop → closed-loop theme of the mesh review.

**Three hard conditions before adoption:**

1. **Gate the expensive regime by task class.** Without a `new_project /
   major_direction` gate, this violates `CTX-ECON-001` and burns capacity on trivia.
   This is the single most important integration constraint.
2. **Value-per-burn, not equal burn.** Make "rebalance only within fit" a *hard* rule;
   otherwise burn-equalization Goodharts into routing tasks to the wrong model.
3. **Mechanical merge.** Extract each lane's claims verbatim into the comparison table
   *before* any model judges — a free-form "one model merges" re-introduces the
   anchoring round 1 avoided. The merger's decision goes in the decision ledger with
   *why* (auditable, not vibes).

**Keep the creative core free.** Per the owner's standing rule (process discipline, not
design templates): discipline the *workflow around* the brainstorm; keep the brainstorm
*content* free and divergent. Provider/model names stay abstract (lane + capability
tier); only the §2 mapping table changes on a version bump.

---

## 7. GPT lane — hard technical opponent (Codex, real, reasoning=high)

Codex did not endorse the proposal as written; it found a real defect and reframed the
budget model:

- **`burn_pct` is inverted** → split `consumed_pct` / `remaining_pct` (+
  `measurement_confidence`). *(Adopted into §4.1.)*
- **Do not equalize burn** — it conflicts with "smallest suitable model" and can force
  work onto weaker/less-private providers. Route by **eligibility → privacy → task fit
  → cost state → recent quality → availability**. *(Adopted into §4.1.)*
- **Hidden consumer meters → `unknown`, not estimated burn.** "For hidden consumer UIs,
  burn_pct comes from nowhere reliable." Use API usage fields where present; local
  tokenizer estimate only for *your submitted* prompt; otherwise `unknown`.
- **Missing a brain = a stop/degrade state, not silent continuation.** Degradation
  states `ready / provider_unavailable / quota_unknown / quota_exhausted /
  blocked_owner`. *(Adopted into §5.)*
- **`quality_score` needs dimensions + scorer + evidence + confidence** or it becomes
  pseudo-authority.
- **Merge isn't neutral unless criteria are fixed *before* outputs arrive** —
  reinforces the mechanical-merge control.
- **Round 2 only for high-risk decisions**, not every project start.
- Concrete shapes: `provider-budget.json` + `usage-ledger.jsonl` with `surface` and
  `confidence`. *(Adopted into §5.)*

## 8. UX/External lane — Gemini 3.1 Pro (Antigravity, real)

Gemini brought the outside/operational view the other lanes missed:

- **Help vs hurt:** prevents premature engineering-centric convergence (UX/SEO become
  first-class); but strict zero-cross-feeding in round 1 risks "creative but technically
  unviable" concepts → wasted effort and slower time-to-market.
- **Measurement reality:** beyond incomparable meters, **billing latency** — usage often
  reports minutes–hours late, so the ledger lags real consumption; plus caching
  discounts and nondeterministic retry/context overhead make forecasts volatile.
  *(Adopted into §4.1.)*
- **Anti-paralysis cadence:** timebox the divergent phase (24–48h), cap each lane to
  **≤2 proposals**, and merge via a weighted scoring matrix against fixed constraints
  rather than open discussion.
- **Coverage the policy is missing:** synthetic user personas (simulate conversion
  friction/cognitive load), **search-demand/SEO-difficulty validation before coding**,
  and a regulatory checkpoint (GDPR/CCPA/accessibility).
- **Split risks:** rigid 33/33/33 misallocates (backend changes waste the UX lane;
  user-facing flows starve it); and "rebalance only within fit" can **starve a phase**
  if the primary reasoning model is depleted and no overflow is allowed.
- **Highest-value change:** a lightweight **"Shared Constraints Checkpoint" mid-round-1**
  — a structured exchange of hard tech constraints + UX imperatives that kills unviable
  branches *without* full cross-feeding, preserving divergence while easing the merge.

## 9. Three-vendor convergence & decision

**Convergent (all three):** divergent-then-convergent is right *for high-value
starts*; round 1 must avoid anchoring; the merge must be mechanical / criteria-fixed;
budget must never become the primary selector; a missing lane must degrade loudly, not
silently.

**Each lane's decisive contribution:**

| Theme | Strategic (Opus) | Technical (Codex) | UX (Gemini) |
|---|---|---|---|
| Scope control | gate by task class (`new_project`/`major_direction`) | round 2 only for high-risk | timebox + ≤2 proposals/lane |
| Budget model | value-per-burn, not equal | **don't equalize**; routing order; split consumed/remaining | billing latency → don't flip on fresh numbers |
| Anti-anchoring | mechanical merge, decision-ledgered | fix merge criteria before outputs | **Shared Constraints Checkpoint** mid-round-1 |
| Coverage gap | keep creative core free | quality_score needs a rubric | personas + SEO-demand + regulatory checks |

**Decision (Opus, for governance): ADOPT with amendments.**

1. Gate the expensive 3-brain regime by task class; routine work stays on Caveman Mode
   / token-efficiency routing (`CTX-ECON-001`).
2. Replace burn-equalization with the routing order; budget = late gate only.
3. Split `consumed_pct`/`remaining_pct` + `measurement_confidence`; `unknown` where no
   meter; never fabricate.
4. Adopt the **Shared Constraints Checkpoint** mid-round-1 as the reconciliation between
   anti-anchoring and viability — the single best addition from this brainstorm.
5. Merge stays mechanical with criteria fixed up front; decisions go to the decision
   ledger; missing lanes use explicit degradation states.
6. Implementation order: usage-ledger jsonl + provider-budget.json (the evidence spine,
   = mesh-map G2) → traffic-light policy function (pure, typed in
   `src/data/delivery-system/modelSpend.ts`) → phase/reasoning matrix in
   `reasoning_strategy`. No runtime engine, no parallel source of truth.

Burn note for *this* brainstorm: 3 real vendor lanes (Codex ×2 reasoning=high, Antigravity
`gemini-3.1-pro-high` ×1) on free/no-cost quota verified via `antigravity-usage.cmd`;
Gemini intentionally **not** run on the separate skills/Context7 topic (§ companion doc)
— that lane's fit is UX/external, not tooling architecture (dogfooding "rebalance only
within fit").
