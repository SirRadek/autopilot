# Plán vývoje `autopilot-beta` — implementace závěrů FINAL.md (FINÁLNÍ, po Codex konzultaci)

**Orchestrátor:** Opus (max reasoning, architekt/governance) · **Datum:** 2026-06-22
**Zdroj pravdy:** `output/creative-profiles-brainstorm/FINAL.md` + `R5-opus-final.md` (sekvence kroků 0–7)
**Reálná konzultace:** `codex_cli` (gpt-5.5 / `model_reasoning_effort=xhigh`) přes `runCliWorker()` — exit 0, 371 s, evidence v `output/autopilot-beta-plan/state/` (`buildSubagentTree` → agent `cli-codex-hp-20260622-beta-plan-critique-…`, typ `codex_cli-external`). `agy_cli` = **MISSING** (`--print` hang, vendor-side), NEnahrazeno (WORKER-CLI-001). Konzultace je tedy **2-zdrojová** (Opus + reálný codex), ne 3.
**Status:** FINÁLNÍ plán. Codex výhrady ověřeny proti repu (5/5 tvrdých claimů TRUE — viz §5). Vývoj NEzahájen, repo NEzaloženo, nic nepushnuto.

---

## 0. Doktrína (nepřekročitelné invarianty)

- **Validace, ne teplota.** Bezpečnost vynucuje *oddělená vynucená podlaha*, ne snižování kreativity.
- **Model emituje spec, deterministický builder dělá kód.** Žádný únik do volného CSS/HTML; „off-library" = governed rozšíření knihovny přes `pdos:validate`/`score`.
- **„Floor" = 4 oddělené věci:** (a) registry integrity · (b) scorer gating · (c) buildability/component contract · (d) visual QA. Dnes existuje jen (d) částečně. Stavíme v tomto pořadí.
- **Report-only první; mutace nikdy bez owner-gate.** Mapování ghostů = lidské rozhodnutí.
- **Gating = vědomý behavior change za samostatným flagem.** Není to „jen validace".
- **Sólo default = drahé osy OFF** do held-out evalu.

---

## 1. Fázový plán (mapuje na §8 kroky 0–7; rozšířeno o Codex výhrady)

Struktura po Codex critique: **Phase 0 (clean-install bootstrap + vendoring)** → **F0 → F0.5 → F1(a/b/c) → F2 → F3 → F4 → F5(a/b/c) → F6 → F7**. F1 a F5 byly rozseknuty, protože nejsou atomické a NEjsou non-breaking, jak v1 mylně tvrdil.

### Phase 0 — Clean-install bootstrap + vendoring (NOVÉ; revidováno po owner clarification 2026-06-22)
- **Cíl:** Založit `autopilot-beta` jako **čistou samostatnou instalaci od nuly** (nová složka, nový repo `autopilot-beta`, žádný sdílený checkout kanonického `autopilot`) a definovat, z jakého **pevně připnutého** stavu kanonický základ beta vychází. Detail strategie = §2.
- **Staví:**
  1. **Pin canonical base ref.** Lokální checkout je `codex/autopilot-safe-move-20260612`, ne `main`. Vybrat a zapsat konkrétní `autopilot` commit SHA jako „pevný základ", ze kterého se vendoruje.
  2. **Čistá nová složka + repo `autopilot-beta`** (`git init`, nový remote pod projektem `autopilot`). NEklonovat kanonický strom.
  3. **Vendoring kontraktů** dle §2: zkopírovat *byte-identicky* připnuté kontrakty/harness, založit `vendor-manifest.json` (source path · canonical SHA · content hash per soubor).
  4. **`beta:vendor-check` script** — re-hash vendorovaných souborů vs `vendor-manifest`, advisory diff vs `autopilot@SHA` (drift detection). **Nahrazuje `beta:path-guard`** (ten odpadá — viz §2.4).
  5. **Source-of-truth hygiena (canonical-side, nízká priorita):** `docs/projects/autopilot-control-plane/architecture.md:8` stále uvádí `C:\Programování\Codex` jako canonical root — odporuje FINAL.md. Opravit v kanonickém repu (ne blokuje beta bootstrap, ale ať záznam nelže).
- **Gate:** base SHA zapsán; beta repo inicializován; `vendor-manifest.json` kompletní a `beta:vendor-check` zelený; vendorované soubory hashově shodné s `autopilot@SHA`.
- **Default OFF:** —
- **Rizika:** vendoring „přibližně" (ne byte-identicky) → rozbije pozdější merge-back patchování (§2.3). Mitigace: hash gate v `beta:vendor-check`.

### F0 — Report-only integrity inventory (= §8 krok 0; rozšířeno)
- **Cíl:** Zviditelnit „falešný klid" `pdos:validate` (0/0 nad duchy/prázdnými tokeny). Nulová změna chování.
- **Staví:** warningy ve `product-design-os/scripts/validate-product-design-os.ts`:
  - `PDOS_EMPTY_TOKENS` — `tokens/*.json` = `{}`.
  - `PDOS_GHOST_PATTERN` — `recipes[].allowed_patterns` mimo `pattern-manifest.patterns[].id`.
  - `PDOS_ASSET_REF_TAG_MIX` (**přidáno po Codex**) — `asset.schema` `works_with`/`avoid_with`/`dependencies` míchají ID-reference a tagy (asset.schema.json:76). To je přesně typová díra, kterou řeší F1; musí být vidět už jako F0 inventář.
  - Test v `tests/delivery-system/product-design-os-validation.test.ts`.
- **Gate:** N warningů vypsáno, **exit code beze změny**; test ověří počty/kódy; `mesh:check`/`typecheck`/`build` zelené.
- **Default OFF:** — · **Rizika:** warning-noise → strukturovaný `warnings[]` s kódem.

### F0.5 — Owner taxonomy review (NOVÉ gate; přijato po Codex)
- **Cíl:** F1 (schema+data) NESMÍ následovat po F0 automaticky.
- **Staví:** schválená tabulka `{ ghost hodnota · navržená kategorie (pattern/direction/asset) · riziko · owner rozhodnutí · migrační dopad }`.
- **Gate:** owner sign-off recorded; bez něj žádná schématická změna.
- **Rizika:** owner bottleneck → dávkovat po doménách.

### F1 — Typové rozdělení jako dual-read migrace (= §8 krok 1; přepracováno — NENÍ non-breaking)
- **Cíl:** Rozseknout slitá pole. **Pozor (Codex, ověřeno):** `validateRecipes` *vyžaduje* `allowed_patterns` (validate:582) a scorer typ/loader ho čtou (score:20,377) — pouhý rename = rozbití. Proto dual-read, ne rename.
- **Staví:**
  - **F1a:** přidat `allowed_pattern_ids` / `required_sections` / `direction_ids` jako **optional** + **dual-read** ve validate i score (čtou staré i nové pole). V `asset.schema` oddělit ID-reference od risk/taste tagů.
  - **F1b:** migrovat data na nová pole.
  - **F1c:** deprecate stará pole **až po** baseline `score`/`validate` beze změny výsledku.
  - **+ formální `recipe.schema.json` + schema-versioning** (**přidáno po Codex**): dnes jsou recepty validované ručně ve `validateRecipes` (validate:555) — bez schématu nemá F1 stabilní kontraktový povrch.
- **Gate:** dual-read prokazatelně beze změny výběru patternů; baseline score diff = 0.
- **Rizika:** ontologická past → proto F0.5 předchází.

### F2 — Owner mapování 13 ghost hodnot (= §8 krok 2)
- **Cíl:** Každá hodnota mimo manifest → pattern/direction/asset. NE auto-fix.
- **Staví:** data-mutace dle F0.5 tabulky a F1 typů, po doménách.
- **Gate:** owner approval per dávka; F0 warningy klesají k 0. · **Default OFF:** off-library auto-adopce.

### F3 — Component/renderer contract (= §8 krok 3; posílen — ne papírový)
- **Cíl:** Bez něj je „deterministický builder" prázdné slovo (`asset.schema` je metadata katalog, ne renderer contract; asset.schema.json:7).
- **Staví (po Codex, aby nebyl self-attestation):**
  1. **ADR + skeleton composition target s příklady** PRVNÍ — jinak je contract navržen naslepo.
  2. **component contract schema** (vstupní props, required slots, výstupní invarianty).
  3. **composition target fixtures** + **minimální compile/renderability harness** (read-only ověření „z asset_id jde renderovat").
- **Gate:** každý referencovaný asset_id má/nemá contract; report-only seznam nesestavitelných; harness běží na fixtures.
- **Default OFF:** skutečný render/build engine (jen kontrakt + harness). · **Rizika:** scope-creep do rendereru → tvrdá hranice.

### F4 — `specs/composition.schema.json` + integrita do `pdos:validate` (= §8 krok 4)
- **Cíl:** Vrstva, kterou model emituje (`recipe_id`, `pattern_ids`, `asset_ids`, `required_sections/evidence`). Referencuje registry, neduplikuje. **`specs/` dnes neexistuje** (ověřeno) — zakládá se zde.
- **Staví:** `product-design-os/specs/composition.schema.json` + referenční integrita spec→registry ve `validate` (spec-error vs registry-warning oddělené).
- **Gate:** validní composition projde; ghost-ref = error v spec vrstvě (ne v ontologii recipes).
- **Default OFF:** `token_overrides`. **+ explicitní token-floor milestone (po Codex):** plán musí říct, KDY tokeny přestanou být prázdné a stanou se použitelnými (dnes všechny `{}`, FINAL.md:29) — jinak `token_overrides` zůstane navždy OFF bez plánu. · **Rizika:** předbíhání → až po F3.

### F5 — Integrity→error + scorer gating (= §8 krok 5; ROZDĚLENO — behavior change)
Codex (ověřeno score:161): scorer dnes `allowed_patterns` **ignoruje** → napojení = změna výsledků. „Promote na error" a „scorer gating" jsou dvě různé změny. Rozsekáno:
- **F5a:** promote registry integrity warning → **error** (jen validace, ne výběr).
- **F5b:** **shadow diff report** — scorer napojen na `allowed_patterns`, ale jen **reportuje** before/after výběr, nemění ho.
- **F5c:** **flagované enforcement** za `PDOS_ENFORCE_ALLOWED_PATTERNS` (**default OFF**); zapnutí jen po owner review F5b diffu.
- **Gate:** F5c default OFF; zapnutí = vědomý owner-gate s before/after diffem. **NEdělat pod hlavičkou „nulová změna".**
- **Závislosti:** F2, F4. · **Default OFF:** ano (flag).

### F6 — Buildability + composition output-floor v `qa/` (= §8 krok 6)
- **Cíl:** Output-floor *vedle* visual-qa.
- **Staví:** **nejdřív `pattern.requires` taxonomy** (**po Codex**: dnes libovolné stringy, pattern.schema.json:64 — bez taxonomy je floor jen text-matching), pak composition/buildability checks v `qa/` přes F3 contract; reuse `analyzeProductDesignVisualQa`.
- **Gate:** nesestavitelná composition neprojde floor; visual-qa zůstává nezávislá. · **Závislosti:** F3, F4.

### F7 — Jediný čudlík „počet variant" + sample_select za floorem (= §8 krok 7)
- **Cíl:** Teprve teď minimální kreativní osa.
- **Staví:** single knob; sample_select N>1 za floor-filtrem.
- **Gate:** každá varianta projde F6 floor; CreativityProfile vektor a band-judge **OFF** do held-out evalu.
- **Závislosti:** F5, F6. · **Default OFF:** vektor, band-judge, LLM creative-director, auto-provider-switch.

---

## 2. Strategie `autopilot-beta` (revidováno po owner clarification 2026-06-22)

**Owner rozhodnutí (závazné): `autopilot-beta` = úplně nová samostatná složka + nový repo `autopilot-beta` (projekt `autopilot`), čistá instalace od nuly — NE fork, NE sdílený checkout kanonického `autopilot`.** Kanonický `autopilot` zůstává fyzicky oddělený a beta jej nemá v pracovním stromě.

### 2.1 Topologie
- Nová složka (mimo `C:\Programování\autopilot`), např. `C:\Programování\autopilot-beta`; vlastní `git init`, vlastní remote pod projektem `autopilot`.
- Beta začíná prázdná a **vendoruje** připnuté kontrakty z `autopilot@<base-SHA>` (Phase 0). Žádná `git` příbuznost (no common ancestor) — vztah ke kanonickému drží **vendor-manifest**, ne sdílená historie.

### 2.2 Co vendorovat vs. začít nanovo
**Vendorovat byte-identicky (read-only baseline, připnuté na `autopilot@<base-SHA>`, hashováno ve `vendor-manifest.json`):**
- `product-design-os/` registry + schémata, na kterých plán operuje: `patterns/pattern.schema.json`, `patterns/pattern-manifest.json`, `assets/asset.schema.json`, `recipes/`, `tokens/`, `briefs/project-brief.schema.json`, `reader/element-map.schema.json`.
- Skripty, které fáze **modifikují** (musí začít z kanonického stavu, aby šel merge-back jako patch): `scripts/validate-product-design-os.ts` (F0/F4/F5a), `scripts/score-product-design-os.ts` (F5b/c), `scripts/visual-qa-product-design-os.ts` (F6 reuse).
- `runCliWorker` harness (stabilní infra pro vendor-konzultace v betě): `src/data/delivery-system/cliWorker.ts`, `cliWorkerCapture.ts`, `subagentEvidence.ts`, `checkCompletionMatrix.ts`, `sessionState.ts`, `fallbackChains.ts`.
- Relevantní podmnožina prompt-library (design-os prompty) + testy pro vendorované skripty.

**Začít nanovo v betě (neexistují v kanonickém / jsou nové vrstvy):**
- `product-design-os/specs/composition.schema.json` (F4 — `specs/` v kanonickém neexistuje, ověřeno).
- component/renderer contract + fixtures + renderability harness (F3).
- `recipe.schema.json` + schema-versioning (F1).
- `pattern.requires` taxonomy (F6).
- `vendor-manifest.json` + `beta:vendor-check` (Phase 0 — beta-only nástroj).

### 2.3 Konzistence + merge-back (samostatný repo)
- **Vendor-manifest jako smlouva.** Každý vendorovaný soubor nese `{ source_path, canonical_sha, content_hash }`. `beta:vendor-check` selže, když hash nesedí → beta vždy ví, z čeho vyšla a zda se to nerozjelo.
- **Merge-back je opt-in per fáze, ne automatický** (samostatný repo, žádný common ancestor):
  - **Additivní/report-only fáze (F0, F1, F4 schémata, F6) na vendorovaných souborech:** protože baseline je byte-identický s `autopilot@<base-SHA>`, diff vůči vendorovanému souboru = aplikovatelný patch (`git format-patch` / ruční PR) na kanonický `autopilot`. **Toto je důvod, proč vendoring musí být byte-identický** — jinak merge-back není patch, ale ruční reimplementace.
  - **Nové vrstvy (F3 contract, composition.schema, recipe.schema, requires-taxonomy):** do kanonického se zavádějí jako **čisté nové soubory** (ne patch) přes samostatný PR, až owner rozhodne o promotion.
  - **Behavior-change fáze (F5b/c, F7):** **zůstávají beta-only** (default-OFF) do held-out evalu + owner promote; mohou trvale zůstat samostatnou produktovou linií.
- **Rozhodnutí:** beta je **legitimně samostatná produktová linie**; merge-back je možnost, ne závazek. Kanonický `autopilot` se nikdy nemění implicitně — jen vědomým PR, který prochází jeho vlastními gaty (`mesh:check`/`pdos:validate`/`typecheck`/`build`).

### 2.4 Bezpečnostní výhoda čisté instalace (co padá, co zůstává)
- **PADÁ `beta:path-guard`.** Jeho úkol byl bránit betě sahat na kanonický `src/`/`mcp/`/`mesh/`. V čisté instalaci je kanonický strom **fyzicky mimo betin working tree → beta jej nemůže editovat by construction.** Celá třída „beta omylem mutovala základ" mizí na úrovni filesystému, ne kontrolou. (Falešný `diff:check`-as-guard z v1 tím přestává být relevantní úplně.)
- **ZŮSTÁVÁ:** (1) `vendor-manifest` + `beta:vendor-check` — provenance + drift, podmínka patchovatelného merge-backu; (2) branch protection na canonical `main` — chrání základ ve chvíli, kdy patch/PR přistává; (3) pinned base-SHA — definice „pevného základu".
- **Čistý zisk:** ochrana základu se přesouvá z *runtime guardu* (křehké, šlo obejít) na *fyzickou hranici + hash-provenance* (robustní). `contract-surface.json` z v1 se zužuje na `vendor-manifest.json` (provenance), allowlist cest už není potřeba.

---

## 3. Default-OFF pro sólo (rozšířeno po Codex)
**OFF:** CreativityProfile vektor (→ jediný čudlík), `sample_select` N>1, LLM creative-director, band-judge, sektorové kostry mimo recipes, **auto-provider-switch**, **auto** task/backlog, off-library auto-adopce, **+ scorer enforcement (F5c), composition-floor enforcement, skutečný renderer/runtime engine, LLM composition emission, token_overrides, external asset adoption**. `graphicAgentPolicy.defaultTools` dnes obsahuje `three_js`/`rapier_physics`/`blender` (graphicAgent.ts:157) → pro sólo **route-only za performance/reduced-motion/mobile checks**, ne plošný default.
**ON:** deterministické route/score/validate, `analyzeProductDesignVisualQa`, **čitelná fallback policy/report** (`resolveFallback` owner/block — fallbackChains.ts:75; NEvypínat diagnostiku, jen auto-substituci), single variant, report-first supervize, lokální evidence.

---

## 4. První konkrétní krok (změněno owner clarification)
**Phase 0 → body 1–3 (clean-install bootstrap):** (1) zapsat konkrétní `autopilot@<base-SHA>` jako pevný základ; (2) `git init` čisté nové složky + repo `autopilot-beta`; (3) vendorovat připnuté kontrakty dle §2.2 a založit `vendor-manifest.json` (hash gate přes `beta:vendor-check`). Až čistá beta stojí a `vendor-check` je zelený, začíná F0. *(Oprava `architecture.md:8` je canonical-side hygiena — Phase 0 bod 5, neblokuje beta bootstrap.)* Nulová mutace kanonického stromu — beta jej nemá v working tree.

---

## 5. Codex konzultace — co přijato/odmítnuto a proč

Všech 5 tvrdých claimů Codexu **ověřeno proti repu = TRUE** (ne přijato na slovo, dle doktríny „model není source-of-truth"):

| # | Codex výhrada | Ověření | Verdikt |
|---|---|---|---|
| 1 | `diff:check` = jen whitespace, NE frozen-base guard | package.json:29 ✅ | **PŘIJATO ve v2, pak superseded** → v2 navrhl `beta:path-guard`; owner clarification (clean install) ho činí zbytečným — ochrana je fyzická hranice repa, ne guard (§2.4). |
| 2 | F1 NENÍ non-breaking; validate vyžaduje `allowed_patterns` | validate:582 ✅ | **PŘIJATO** → F1 přepracováno na dual-read (F1a/b/c). |
| 3 | F5 spojuje 2 změny; scorer dnes `allowed_patterns` ignoruje | score:161 ✅ | **PŘIJATO** → F5 rozděleno na F5a/b/c. |
| 4 | Chybí F0.5 owner taxonomy gate mezi F0 a F1 | — | **PŘIJATO** → F0.5 přidáno. |
| 5 | `specs/` neexistuje; `contract-surface` má být Phase 0 | ls ✅ | **PŘIJATO** → v clean-install variantě se `contract-surface` realizuje jako `vendor-manifest.json` v Phase 0 (§2.4). |
| 6 | architecture.md stále uvádí Codex jako canonical | architecture.md:8 ✅ | **PŘIJATO** → Phase 0 bod 5 (canonical-side hygiena). |
| 7 | F3 je „papírový"; chybí fixtures + renderability harness | — | **PŘIJATO** → F3 posílen (ADR + fixtures + harness). |
| 8 | Chybí inventory scope (asset works_with/tags mix) | asset.schema.json:76 ✅ | **PŘIJATO** → `PDOS_ASSET_REF_TAG_MIX` v F0. |
| 9 | Chybí recipe.schema.json / pattern.requires taxonomy / token-floor | validate:555, pattern.schema:64 ✅ | **PŘIJATO** → doplněno do F1/F6/F4. |
| 10 | Default-OFF rozšířit (enforcement, renderer, blender route…) | graphicAgent:157 ✅ | **PŘIJATO** → §3 rozšířeno. |

**Vývoj beta strategie přes 2 revize:** Codex namítl, že „fork není automaticky bezpečnější než branch" a že bezpečnost neplyne z hranice repa, ale z guardů. Tato námitka byla v2 zohledněna (path-guard + contract-surface). **Owner clarification (2026-06-22) ji pak vyřešil radikálněji a v Codexově duchu:** čistá samostatná instalace přesouvá ochranu základu z *runtime guardu* (který Codex právem označil za křehký) na *fyzickou hranici filesystému + hash-provenance* (§2.4). Codexova pravdivá námitka tím není ignorována — je naplněna silnějším mechanismem; `beta:path-guard` odpadá, zůstává `vendor-manifest`/`beta:vendor-check`.

**Odmítnuto:** nic podstatného — všechny ověřitelné claimy prošly verifikací.

---

## 6. Důkaz reálného Codexu (`buildSubagentTree`)
```
parent_session_hash: autopilot-beta-plan-20260622
└─ cli-codex-hp-20260622-beta-plan-critique-20260622T110718
   agent_type:  codex_cli-external      exit: 0      duration: 371 s
   handoff_id:  hp-20260622-beta-plan-critique
   artifacts:   handoff_packet + worker_output (temp captures)
```
`agy_cli` lane **MISSING** (vendor-side `--print` hang) — NEnahrazeno převlekem (WORKER-CLI-001). Konzultace 2-zdrojová (Opus + reálný codex).

---

## 7. Dodatek — F8 — agy heartbeat capture (po F1–F7, NEaplikováno v betě teď)

> **Status:** ZAŘAZENO DO PLÁNU jako poslední krok beta vývoje. **Není** součástí běžné F0–F7 osy; **neaplikovat do bety dřív**, než F1–F7 dojedou a než je heartbeat design ověřen v kanonickém `autopilot`. Toto je čistě plánový dodatek — beta `cliWorkerCapture.ts` se v této fázi NEmění.

**Původ.** WORKER-CLI-001: vendor `agy` v `--print` režimu reálně píše autoritativní `result.md` za ~8 s, PTY dodá ~16 B a proces po zápisu **hanguje** (bez čistého exitu). Stávající `captureAgyResponse` má jediný zdroj (PTY) + jeden plochý timer → buď MISSING, nebo plýtvá časem. Redesign (Codex-vedený návrh + Opus R1–R8 review, owner-approved) zavádí file-contract heartbeat: `.agent/runs/<run-id>/{status.jsonl,result.md}`, fast-path completion (stabilní `result.md` + `final` řádek / `Stream completed` → hotovo za ~8–10 s), vždy `proc.kill()` zaseklého agy, fallback žebřík `result.md`→PTY→transcript→MISSING, race-safe binding conv-id a handoff addendum. Návrh + diff: `output/agy-heartbeat-capture-design.md` a `output/_codex-agy-heartbeat-raw.md`. **Aplikováno v kanonickém `autopilot`** na větvi `codex/agy-heartbeat-capture-20260622` (mimo betu).

**Cíl F8.** Aktualizovat betou vendorovanou `src/data/delivery-system/cliWorkerCapture.ts` (+ `cliWorker.ts`) na tenhle heartbeat design — jako **poslední** krok beta vývoje, ne dřív.

**Staví:** re-vendor připnuté `cliWorkerCapture.ts`/`cliWorker.ts` z kanonického `autopilot@<new-base-SHA>` (SHA komitu s heartbeat capture), `.gitignore += .agent/` v betě, unit testy pro pure capture/heartbeat logiku (decision ladder, fallback ladder, conv-binding).

**Re-vendor / patch sémantika (dle §2.2/§2.3):**
- `cliWorkerCapture.ts`/`cliWorker.ts` jsou v §2.2 vendorované **byte-identicky** jako stabilní infra. Heartbeat redesign tam dopadá jako **re-vendor**, ne ruční editace: bump `canonical_sha` + `content_hash` ve `vendor-manifest.json` na nový kanonický SHA; `beta:vendor-check` musí po re-vendoru zůstat zelený (jinak beta neví, z čeho vyšla).
- Protože baseline byl byte-identický, změna jde aplikovat jako **patch** (`git format-patch` z kanonického diffu), ne reimplementace — přesně důvod, proč §2.3 trvá na byte-identickém vendoru.
- Směr je **kanonický → beta** (re-vendor novějšího základu), ne beta→kanonický merge-back. Beta tím jen dotahuje infra na aktuální kanonický stav; žádná beta-specifická behavior-change.

**Gate:** po re-vendoru `beta:vendor-check` zelený; `typecheck` + cli-worker unit testy zelené; `agy_cli` lane smí být dál **MISSING** (vendor hang), ale capture/heartbeat logika je otestovaná jednotkově (živý agy round-trip není podmínkou — viz WORKER-CLI-001).

**Závislosti:** F1–F7 hotové (F8 je explicitně poslední); kanonický heartbeat design ověřený a smerge-nutý do canonical `main`. **Default OFF / nedotčeno:** žádné nové runtime přepínače; F8 je infra-parita, ne produktová osa.
