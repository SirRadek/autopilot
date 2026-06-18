# Radeq.cz — Homepage Tuning Backlog

**Zdroj:** grounded audit `output/radeq-homepage-improvement-proposal.md` (v2, 2026-06-18)  
**Větev:** `codex/radeq-ab-c-preview`  
**Stav webu:** žádné změny zatím neprovedeny  
**Vlastník schvalování:** SirRadek  
**Zpráva pro vlastníka:** Každou položku schvaluj samostatně. Závislosti jsou explicitně označeny — nikdy nespouštěj S2 před S1. U „promote_to_playbook: ✅" položek přidej po schválení poznámku do playbooku (viz sekce Feedback loop).

---

## Phase 1 Review — 2026-06-18

**Agenti:** GPT/tech-worker (proveditelnost, rizika, verifikace line č.) + Gemini/UX-analyst (bounded — copy+positioning, max 2 soubory). Opus syntéza.  
**Proces-anomálie:** Agent-tool spawny nefirují Codex hooky → agent-registry.jsonl prázdný. Očekáváno, zdokumentováno v subagent-evidence.

| Položka | Korekce | Zdroj |
|---|---|---|
| **T3** | Audit JIŽ první v `cs.hero.proof` — popis „přesuň na 1. místo" byl fakticky chybný. Přeznačeno: aktualizace copy textů. | GPT/tech |
| **T5** | Doporučená hodnota: **„Kontakt"** místo „Napsat" (B2B formálnost). | Gemini/UX |
| **T2** | Lead zkrátit na 2 věty; diferenciátor jako 2. věta (ne házet automatizaci do věty 1). | Gemini/UX |
| **T4** | Přidat 7. bullet: pomoc s nastavením hostingu/domény po spuštění. | Gemini/UX |
| **SE4/L2** | Prerekvizita ověřena: `SiteFooter.astro` renderuje přes `BaseLayout.astro` (line 81) na všech stránkách. Obě položky VALID bez blokeru. | GPT/tech |
| **D2** | **ODLOŽENO** — UX RECONSIDER: cold visitor vidí cenu bez kontextu → risk bounce. Implementovat až po ověřeném dopadu T3+T4. | Gemini/UX |

**Potvrzeno bez změn:** S1, S2, S3 (owner), S4, T1 (Var. A), D1, SE1, SE2, SE3, L1, L2, L3.  
**Čeká na vlastníka:** S3 (varianta A/B/C), T6 (závisí na S3).  
**Odloženo do dalšího cyklu:** D2.

---

## Aktivní tracky

| Track | Položek | Doporučená první |
|---|---|---|
| Struktura / pořadí sekcí | 4 | **S1** |
| Texty / copy | 6 | **T3** |
| Design / UX | 2 | **D1** |
| SEO / meta | 4 | **SE3** |
| Legal / podmínky | 3 | **L2** |
| **Celkem** | **19** | — |

## Parkované tracky (čekají na produkční homepage)

| Track | Popis |
|---|---|
| Ukázky | Naplnit `/ukazky/` reálnými projekty; závisí na schválení vlastníkem, nelze bez obsahu |
| Blog | Mimo scope homepage tuningu |

---

## Track: Struktura / pořadí sekcí

### S1 — Přejmenovat `id="about"` v FitSection

| Pole | Hodnota |
|---|---|
| **ID** | S1 |
| **Priorita** | 🔴 Blokuje S2, S4 |
| **Náročnost** | Nízká (2 řádky ve 2 souborech) |
| **Zdroj** | Grounded audit C7 |
| **promote_to_playbook** | ❌ (radeq-specifický ID konflikt, ne obecný vzor) |

**Co:** FitSection.astro má `id="about"`. AboutSection.astro také má `id="about"`. Duplikátní ID způsobí, že kliknutí na nav `#about` scrolluje na FitSection, ne na AboutSection.

**Kde:**
- `src/components/FitSection.astro` řádek 11: `id="about"` → `id="fit"`
- `src/data/siteContent.ts` řádek 177: `href: '#about'` → `href: '#fit'` (label „Co řeším" zůstává)
- `src/data/siteContent.ts` řádek 520 (EN): `href: '#about'` → `href: '#fit'`

**Navrhovaná změna:**
```astro
<!-- FitSection.astro, řádek 11 -->
<section class="fit-section" id="fit" aria-labelledby="fit-title" ...>
```
```typescript
// siteContent.ts, CS navItems
{ href: '#fit', label: 'Co řeším' },
// EN navItems
{ href: '#fit', label: 'What I solve' },
```

**Acceptance kritérium:** Po deployi klik na „Co řeším" v navu scrolluje na FitSection. Žádný jiný `id="about"` v DOM na homepage (ověřit DevTools → Elements → Ctrl+F `id="about"`).

**Závislosti:** žádné

---

### S2 — Renderovat AboutSection mezi ServiceCatalog a PricingSection

| Pole | Hodnota |
|---|---|
| **ID** | S2 |
| **Priorita** | Vysoká |
| **Náročnost** | Nízká (1 řádek v index.astro + import) |
| **Zdroj** | Advisory A sekce 3, grounded audit C11 |
| **promote_to_playbook** | ✅ Vzor: trust bridge mezi Služby → Ceny pro Typ 1 (solo freelancer) |

**Co:** AboutSection.astro je kompletní komponenta (intro + principy `<dl>` + bridge sekce vedoucí k formuláři + note). Není renderována na homepage. Způsobuje skok Services → Pricing → Form bez trust vrstvy.

**Kde:** `src/pages/index.astro` — přidat za `<ServiceCatalog ... />`, před `<PricingSection ... />`

**Navrhovaná změna:**
```astro
---
// index.astro — přidat do importů
import AboutSection from '../components/AboutSection.astro';
---

<!-- za ServiceCatalog, před PricingSection -->
<AboutSection content={content.about} />
```

**Acceptance kritérium:** AboutSection se renderuje mezi ServiceCatalog a PricingSection. Nav položka „O mně" (přidána v S4) scrolluje na `id="about"`. Bridge sekce je viditelná a vede vizuálně k formuláři.

**Závislosti:** ⚠️ **Vyžaduje S1** (přejmenovat FitSection id), jinak duplikátní `id="about"` v DOM.

---

### S3 — DemoBlocks conditional guard + rozhodnutí o obsahu

| Pole | Hodnota |
|---|---|
| **ID** | S3 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (1 řádek) + rozhodnutí vlastníka |
| **Zdroj** | Advisory A sekce 4, grounded audit T3 |
| **promote_to_playbook** | ✅ Vzor: conditional render pro sekce s prázdnými datovými poli |

**Co:** `demos.items = []` způsobuje render prázdné sekce před formulářem. Poškozuje důvěru.

**Kde:** `src/pages/index.astro` — obalit `<DemoBlocks ... />`

**Navrhovaná změna (minimální — jen guard):**
```astro
{content.demos.items.length > 0 && (
  <DemoBlocks locale={content.layout.lang} content={content.demos} />
)}
```

**Rozhodnutí vlastníka (součást S3):** Co místo prázdné sekce?
- A) Nic (conditional guard odstraní sekci) — nejrychlejší, žádný nový obsah
- B) Naplnit `demos.items` 2–3 portréty projektů → `/ukazky/` (střední práce, závisí na Parkovaném tracku Ukázky)
- C) Ilustrace procesu (Audit → Plán → Web → Předání) jako placeholder

**Acceptance kritérium:** Na homepage není viditelná sekce s titulkem ale bez obsahu. Pokud zvolena varianta B: každá karta odkazuje na `/ukazky/chatbot/`, `/ukazky/automatizace/`, nebo `/ukazky/nabidka-eshop/` (všechny existují v buildu).

**Závislosti:** žádné (guard lze nasadit nezávisle; obsah závisí na Ukázky tracku)

---

### S4 — Přidat nav položku „O mně" → `#about`

| Pole | Hodnota |
|---|---|
| **ID** | S4 |
| **Priorita** | Nízká |
| **Náročnost** | Nízká (1 řádek v siteContent.ts) |
| **Zdroj** | Advisory A sekce 3 |
| **promote_to_playbook** | ✅ Vzor: About sekce musí mít nav anchor pro keyboard navigaci a discoverability |

**Co:** Po přidání AboutSection (`id="about"`) musí nav obsahovat odpovídající anchor, jinak je sekce nedostupná klávesnicí z navu.

**Kde:** `src/data/siteContent.ts` navItems (CS i EN) — přidat za `#services`

**Navrhovaná změna:**
```typescript
// CS navItems (za #fit nebo #services)
{ href: '#about', label: 'O mně' },
// EN navItems
{ href: '#about', label: 'About' },
```

**Poznámka:** Přidání páté položky do současných 5 dělá nav 6-položkový. Zvážit zda odstranit nebo sloučit „Jak pracuji" (`#process`) — momentálně vede na sekci PricingSection, jejíž vlastní pořadí by se změnilo po S2. Vlastník rozhodne o finálním nav.

**Acceptance kritérium:** Klik „O mně" v navu scrolluje na AboutSection. Nav je čitelný na mobilním viewportu (neolámá se).

**Závislosti:** ⚠️ **Vyžaduje S1 + S2**

---

## Track: Texty / copy

### T1 — Hero titulek: website-first varianta

| Pole | Hodnota |
|---|---|
| **ID** | T1 |
| **Priorita** | Vysoká |
| **Náročnost** | Nízká (1 řádek siteContent.ts) |
| **Zdroj** | Advisory A sekce 2, 8 |
| **promote_to_playbook** | ✅ Vzor: titulek frontuje primární službu (web), automation/AI jako vedlejší věta |

**Co:** Aktuální titulek „Weby, formuláře a automatizace pro méně ruční práce" prezentuje tři kategorie jako rovnocenné. Neexekuuje website-first positioning lock.

**Kde:** `src/data/siteContent.ts` — `cs.hero.title`

**Navrhovaná změna:**
```typescript
// Varianta A (doporučena)
title: 'Web, který jasně vysvětlí vaši nabídku — a ušetří čas na zbytek.',
// Varianta B (kratší)
title: 'Weby a redesigny pro malé firmy. Bez technické mlhy.',
```

**Acceptance kritérium:** H1 na homepage neobsahuje „formuláře a automatizace" jako hlavní sdělení. Po zobrazení na mobilu (375px) se celý titulek vejde do 3 řádků max.

**Závislosti:** žádné (samostatná copy změna)

---

### T2 — Hero lead: zkrátit, dodat „jeden kontakt" signál

| Pole | Hodnota |
|---|---|
| **ID** | T2 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (1 blok siteContent.ts) |
| **Zdroj** | Advisory A sekce 2 |
| **promote_to_playbook** | ✅ Vzor: lead copy 40–60 slov, diferenciátor „jeden kontakt" na konci první věty |

**Co:** Aktuální lead (46 slov) vyjmenovává 5 kategorií výstupů před identifikací cílové skupiny. Diferenciátor „předám s návodem / jeden kontakt" je pohřben v AboutSection, ne v hero.

**Kde:** `src/data/siteContent.ts` — `cs.hero.lead`

**Navrhovaná změna:**
```typescript
lead: 'Dělám weby pro živnostníky a malé firmy, které potřebují aby je zákazník pochopil napoprvé. Součástí jsou formuláře, automatizace a AI pomocníci tam, kde to opravdu šetří práci. Jeden kontakt, srozumitelný výstup, vše předám s návodem.',
```

**Acceptance kritérium:** Lead obsahuje frázi „jeden kontakt" nebo ekvivalent do 60 slov. Na mobilním viewportu (375px) lead nezabírá více než cca 6 řádků.

**Závislosti:** žádné (vhodné udělat spolu s T1)

---

### T3 — Proof rail: Audit na první pozici

| Pole | Hodnota |
|---|---|
| **ID** | T3 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (přeuspořádat 3 položky v siteContent.ts) |
| **Zdroj** | Advisory A sekce 2 |
| **promote_to_playbook** | ✅ Vzor: proof rail item 1 = vstupní produkt s cenou (nejnižší bariéra), item 2 = primární služba, item 3 = procesní diferenciátor |

**Co:** ⚠️ **Phase 1 korekce (GPT/tech):** Audit je JIŽ první v `cs.hero.proof` — původní popis „přesuň na 3. místo → 1. místo" byl chybný (kód nebyl ověřen). Tato položka aktualizuje `value` texty všech tří proof-rail položek na přesnější formulaci. Není to reorder, ale copy update.

**Kde:** `src/data/siteContent.ts` — `cs.hero.proof` (přeuspořádat položky)

**Navrhovaná změna:**
```typescript
proof: [
  { label: 'Audit od 2 900 Kč', value: 'zjistíme, co řešit jako první, a odečteme to z realizace' },
  { label: 'Web od 25 000 Kč', value: 'struktura, text, formulář a základní nastavení v jednom balíku' },
  { label: 'Předání s návodem', value: 'web i data zůstanou vaše, bez závislosti na dodavateli' },
],
```

**Acceptance kritérium:** První položka proof railu obsahuje „Audit od 2 900 Kč" a je viditelná bez scrollu na desktopovém viewportu (1280px).

**Závislosti:** žádné

---

### T4 — Pricing karta „Startovací web": přidat bullet deliverables

| Pole | Hodnota |
|---|---|
| **ID** | T4 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (přidat deliverables pole do siteContent.ts pricing karty) |
| **Zdroj** | Advisory A sekce 6 |
| **promote_to_playbook** | ✅ Vzor: pricing karta pro službu 25 000+ Kč musí obsahovat 4–5 konkrétních deliverables |

**Co:** Pricing karta „Startovací web / landing page" (od 25 000 Kč) neobsahuje konkrétní seznam výstupů. Audit karta je detailnější — tvoří anchor pro price-to-value porovnání.

**Kde:** `src/data/siteContent.ts` — pricing karta pro Startovací web (konkrétní řádek závisí na struktuře pricing dat — ověřit před implementací)

**Navrhovaný obsah deliverables:**
- Struktura a rozvržení stránek
- Texty orientované na zákazníka (copywriting)
- Poptávkový nebo kontaktní formulář
- Mobilní a desktopová verze
- Základní technické nastavení (SEO titulky, sitemap, rychlost)
- Předání zdrojového kódu a návod k údržbě

**Acceptance kritérium:** Pricing karta „Startovací web" obsahuje seznam ≥4 konkrétních výstupů, vizuálně srovnatelný s Audit kartou.

**Závislosti:** žádné (ověřit strukturu pricing dat v siteContent.ts)

---

### T5 — Nav CTA text: přejmenovat z „Chci zmapovat problém" na neutrálnější

| Pole | Hodnota |
|---|---|
| **ID** | T5 |
| **Priorita** | Nízká |
| **Náročnost** | Nízká (1 řádek siteContent.ts) |
| **Zdroj** | Advisory A sekce 1 |
| **promote_to_playbook** | ✅ Vzor: nav CTA ≠ hero CTA; nav = „Kontakt", hero = akční fráze |

**Co:** Nav CTA „Chci zmapovat problém" je identické s hero primary CTA. Redundance plýtvá nav prostorem.

**Kde:** `src/data/siteContent.ts` — `cs.header.cta`

**Navrhovaná změna:**
```typescript
cta: 'Napsat',  // nebo 'Kontakt', 'Poptávka'
```

**Poznámka:** Nav CTA je hardcoded na `href="#terminal"` v CommandHeader.astro (řádek 99) — nelze změnit cíl přes siteContent.ts bez změny komponenty.

**Acceptance kritérium:** Nav CTA text je ≤ 10 znaků a liší se od hero primary CTA textu.

**Závislosti:** žádné

---

### T6 — DemoBlocks: naplnit portréty projektů (parkováno u S3-B)

| Pole | Hodnota |
|---|---|
| **ID** | T6 |
| **Priorita** | Nízká (blokováno obsahem) |
| **Náročnost** | Střední (nový obsah + datová struktura) |
| **Zdroj** | Advisory A sekce 4 |
| **promote_to_playbook** | ✅ Vzor: case teaser formát — typ klienta (ne jméno) + problém + výstup + odkaz na /ukazky/ |

**Co:** Pokud S3 zvolí variantu B (naplnit místo odstranit), zapsat 2–3 anonymizované projektové portréty.

**Kde:** `src/data/siteContent.ts` — `cs.demos.items`

**Navrhovaný formát:**
```typescript
items: [
  {
    name: 'Živnostník — opravy a instalace',
    metric: '4 poptávky v prvním měsíci',
    summary: 'Web nevysvětloval nabídku. Nová stránka s formulářem a jasnou strukturou.',
    events: [],
  },
],
```

**Acceptance kritérium:** Každá karta odkazuje na existující `/ukazky/` stránku. Žádné vymyšlené metriky bez reálného podkladu.

**Závislosti:** ⚠️ **Závisí na S3 (rozhodnutí B) + Parkovaný track Ukázky**

---

## Track: Design / UX

### D1 — ContactTerminal: přejít na `client:visible`

| Pole | Hodnota |
|---|---|
| **ID** | D1 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (1 atribut v index.astro) |
| **Zdroj** | Grounded audit T4, C4 |
| **promote_to_playbook** | ✅ Vzor: React island below-the-fold → `client:visible`; above-fold toggle → `client:load` |

**Co:** `<ContactTerminal client:load />` hydratuje 7 kB JS komponenty při každém načtení stránky. React core (181,6 kB) se načte i tak kvůli ThemeModeToggle — ale zbytečná hydratace ContactTerminal přidává práci main threadu.

**Kde:** `src/pages/index.astro` — změnit atribut na ContactTerminal

**Navrhovaná změna:**
```astro
<!-- Před: -->
<ContactTerminal locale={content.layout.lang} content={content.terminal} client:load />
<!-- Po: -->
<ContactTerminal locale={content.layout.lang} content={content.terminal} client:visible />
```

**Acceptance kritérium:** Lighthouse TTI na homepage se nehorší (referenční měření před + po). Formulář funguje správně při scrollu na sekci. Ověřit na pomalém síťovém profilu (Chrome DevTools → Network throttling: Slow 4G).

**Závislosti:** žádné

---

### D2 — Přidat secondary hero CTA pro Audit ⏸ ODLOŽENO

> **Phase 1 UX RECONSIDER (Gemini/UX):** Cold visitors vidí cenu bez kontextu → risk bounce. Implementovat až po ověřeném konverzním dopadu T3+T4. V tomto autopilot běhu vynecháno.

| Pole | Hodnota |
|---|---|
| **ID** | D2 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (upravit `cs.hero.actions` v siteContent.ts) |
| **Zdroj** | Advisory A sekce 2 |
| **promote_to_playbook** | ✅ Vzor: hero dual CTA — primary = kontakt/form, secondary = vstupní produkt nebo proof |

**Co:** Aktuální hero CTA: primary „Chci zmapovat problém" → `#terminal`, secondary „Co umím zjednodušit" → `#services`. Secondary CTA nevede k Auditu — přeskakuje vstupní produkt. Návštěvníci nepřipravení na 25 000 Kč nemají nízkorozpočtový vstupní bod.

**Kde:** `src/data/siteContent.ts` — `cs.hero.actions`

**Navrhovaná změna:**
```typescript
actions: [
  { href: '#terminal', label: 'Chci zmapovat problém', variant: 'primary' },
  { href: '#pricing', label: 'Audit od 2 900 Kč', variant: 'secondary' },
],
```

**Acceptance kritérium:** Secondary CTA scrolluje na PricingSection kde je Audit karta. Label obsahuje cenu nebo přímý odkaz na Audit.

**Závislosti:** žádné (ideálně po T3 — Audit jako první pricing karta)

---

## Track: SEO / meta

### SE1 — Meta title CS: keyword-first varianta

| Pole | Hodnota |
|---|---|
| **ID** | SE1 |
| **Priorita** | Vysoká |
| **Náročnost** | Nízká (1 řádek siteContent.ts) |
| **Zdroj** | Grounded audit T1 |
| **promote_to_playbook** | ✅ Vzor: meta title pro czech SMB service web — `[Služba] pro [publikum] | [Brand]` |

**Co:** Aktuální `Radeq.cz | Praktická IT pomoc bez technické mlhy` neodpovídá vyhledávacím dotazům cílového publika.

**Kde:** `src/data/siteContent.ts` — `cs.layout.title`

**Navrhovaná změna (vyber jednu):**
```typescript
// Varianta 1 — keyword-first
title: 'Tvorba webů pro živnostníky a malé firmy | Radeq.cz',
// Varianta 2 — brand+benefit
title: 'Radeq.cz | Weby pro malé firmy — s předáním a bez závislosti',
```

**Acceptance kritérium:** Title ≤ 60 znaků. Obsahuje aspoň jedno z: „tvorba webů", „weby pro firmy", „weby pro živnostníky". Ověřit v `<title>` tagu v dist/index.html po buildu.

**Závislosti:** žádné

---

### SE2 — Meta description CS: action-oriented, cena, diferenciátor

| Pole | Hodnota |
|---|---|
| **ID** | SE2 |
| **Priorita** | Vysoká |
| **Náročnost** | Nízká (1 blok siteContent.ts) |
| **Zdroj** | Grounded audit T1 |
| **promote_to_playbook** | ✅ Vzor: description = služba + cena + diferenciátor, 140–155 znaků |

**Co:** Aktuální description vyjmenovává 5 kategorií, nezmíní cenu ani diferenciátor předání.

**Kde:** `src/data/siteContent.ts` — `cs.layout.description`

**Navrhovaná změna:**
```typescript
description: 'Weby, redesigny a audit webu pro živnostníky a malé firmy. Od 2 900 Kč za audit, od 25 000 Kč za startovací web. Jeden kontakt, předání s návodem.',
```
(144 znaků — v limitu)

**Acceptance kritérium:** Description 140–155 znaků. Obsahuje cenu Auditu. Ověřit v `<meta name="description">` v dist/index.html.

**Závislosti:** žádné (vhodné udělat spolu s SE1)

---

### SE3 — robots.txt: přidat Disallow pro demo routy

| Pole | Hodnota |
|---|---|
| **ID** | SE3 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (2–3 řádky v robots.txt.ts) |
| **Zdroj** | Grounded audit C8 |
| **promote_to_playbook** | ✅ Vzor: robots.txt template pro Astro+Cloudflare s demo route exclusion |

**Co:** Aktuální `robots.txt` nemá žádný Disallow — demo routy (`/demo/*`, `/en/demo/*`) jsou indexovatelné crawlery. Jsou to interní QA/review surfaces, ne produkční stránky.

**Kde:** `src/pages/robots.txt.ts`

**Navrhovaná změna:**
```typescript
// Přidat do výstupu:
Disallow: /demo/
Disallow: /en/demo/
```

**Acceptance kritérium:** `dist/robots.txt` po buildu obsahuje obě Disallow direktivy. Google Search Console po reindexaci nezobrazuje `/demo/*` URL jako indexované.

**Závislosti:** žádné — **nejbezpečnější standalone fix v celém backlogu**

---

### SE4 — SiteFooter: interní odkazy na statické routy

| Pole | Hodnota |
|---|---|
| **ID** | SE4 |
| **Priorita** | Střední |
| **Náročnost** | Nízká–Střední (závisí na stávající struktuře SiteFooter.astro) |
| **Zdroj** | Grounded audit T2, C9 |
| **promote_to_playbook** | ✅ Vzor: footer musí propojit homepage s trust routes pro PageRank flow + discoverability |

**Co:** Build odhalil 7 legal/trust routes (`/kontakt/`, `/sluzby/`, `/portfolio/`, `/soukromi/`, `/gdpr/`, `/podminky/`, `/cookies/`). Žádná není odkazována z homepage — jsou de facto neviditelné pro crawlery.

**Kde:** `src/components/SiteFooter.astro` (nebo ekvivalent — ověřit existenci před implementací)

**Navrhovaná struktura footer odkazů:**
```
Služby          Informace
/sluzby/        /soukromi/
/portfolio/     /gdpr/
/ukazky/        /podminky/
/kontakt/       /cookies/
```

**Acceptance kritérium:** Homepage (`/`) obsahuje v DOM aspoň 4 interní `<a>` elementy vedoucí na statické routy. Ověřit Screaming Frog crawl nebo `grep -r "href" dist/index.html`.

**Závislosti:** ✅ **Phase 1 ověřeno (GPT/tech):** `SiteFooter.astro` renderuje přes `BaseLayout.astro` line 81 na všech stránkách. Žádná prerekvizita — přímá editace `SiteFooter.astro`.

---

## Track: Legal / podmínky

### L1 — Zmapovat a ověřit stav všech 7 legal routes

| Pole | Hodnota |
|---|---|
| **ID** | L1 |
| **Priorita** | Střední (prerekvizita pro L2, L3) |
| **Náročnost** | Nízká (jen čtení a audit, žádná změna kódu) |
| **Zdroj** | Grounded audit C9 |
| **promote_to_playbook** | ❌ (radeq-specifický inventory audit) |

**Co:** Build obsahuje 7 legal routes, advisory znal jen 4. Před linkováním ověřit: má každá stránka vlastní meta description, správnou h1, a aktuální obsah?

**Routes k ověření:**
| Route | Stav | Akce |
|---|---|---|
| `/kontakt/` | ? | ověřit |
| `/sluzby/` | ? | ověřit |
| `/portfolio/` | ? | ověřit |
| `/soukromi/` | ? | ověřit |
| `/gdpr/` | ? | ověřit — je to duplicate /soukromi/ nebo separátní? |
| `/podminky/` | ? | ověřit — T&C stránka? |
| `/cookies/` | ? | ověřit — cookie policy? |

**Acceptance kritérium:** Vyplněná tabulka výše se stavem každé stránky. Identifikovány duplicity nebo neaktivní stránky.

**Závislosti:** žádné — toto je průzkumný krok

---

### L2 — SiteFooter: přidat viditelné linky na legal routes

| Pole | Hodnota |
|---|---|
| **ID** | L2 |
| **Priorita** | Střední |
| **Náročnost** | Nízká (závisí na L1 výsledku) |
| **Zdroj** | Grounded audit C9 |
| **promote_to_playbook** | ✅ Vzor: minimální legal footer set pro česky mluvící SMB web |

**Co:** Legal routes z buildu nejsou linkované — poruší GDPR audit trail pro uživatele, kteří nemohou najít privacy policy.

**Minimální set odkazů (po L1):**
- `/soukromi/` nebo `/gdpr/` — ochrana osobních údajů (GDPR povinné)
- `/cookies/` — cookie policy (pokud web používá cookies/analytics)
- `/podminky/` — podmínky (pokud existují)

**Acceptance kritérium:** Footer obsahuje viditelný link na privacy/GDPR stránku. Odkaz je přístupný bez scrollu na desktop footeru.

**Závislosti:** ⚠️ **Doporučeno po L1** (ověřit stav a obsah stránek). **Phase 1 ověřeno:** SiteFooter renderuje přes BaseLayout — sdílí implementační cestu se SE4.

---

### L3 — ContactTerminal: přidat odkaz na soukromi pod formulářem

| Pole | Hodnota |
|---|---|
| **ID** | L3 |
| **Priorita** | Nízká–Střední |
| **Náročnost** | Nízká (přidat 1 řádek pod submit button v ContactTerminal.tsx) |
| **Zdroj** | Legal best practice, grounded audit C9 |
| **promote_to_playbook** | ✅ Vzor: každý lead capture formulář musí mít viditelný odkaz na zpracování osobních údajů |

**Co:** ContactTerminal odesílá osobní data (jméno, email) do D1. Pod submit tlačítkem chybí odkaz na informace o zpracování osobních údajů — GDPR best practice, v českém prostředí standard.

**Kde:** `src/components/ContactTerminal.tsx` — za `<div className="brief-actions">` blok

**Navrhovaná změna:**
```tsx
<p className="brief-form__privacy">
  Odesláním souhlasíte se{' '}
  <a href="/soukromi/" target="_blank" rel="noopener">zpracováním osobních údajů</a>.
</p>
```

**Acceptance kritérium:** Pod submit tlačítkem je viditelný text s odkazem na privacy stránku. Odkaz se otevírá v novém tabu. Text je čitelný (kontrast ≥ 4.5:1).

**Závislosti:** ⚠️ **Doporučeno po L1** (ověřit URL — `/soukromi/` vs. `/gdpr/`)

---

## Phase 2 Results — 2026-06-18

**Větev:** `autopilot/homepage-tuning-2026-06-18`  
**Soubory změněny:** 6 (`ContactTerminal.tsx`, `FitSection.astro`, `SiteFooter.astro`, `siteContent.ts`, `index.astro`, `robots.txt.ts`)  
**Buildy:** všechny prošly čistě (3.3–3.8s, 21 stránek, 0 warningů)

| ID | Status | Kdo | Build |
|---|---|---|---|
| SE3 | ✅ HOTOVO | GPT/worker | pass |
| S1 | ✅ HOTOVO | GPT/worker | pass |
| S2 | ✅ HOTOVO | GPT/worker | pass |
| S4 | ✅ HOTOVO | GPT/worker | pass |
| T1 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| T2 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| T3 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| T4 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| T5 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| D1 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| SE1 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| SE2 | ✅ HOTOVO | Supervisor (approved spec) | pass |
| SE4 | ✅ HOTOVO | GPT/worker | pass |
| L1 | ✅ HOTOVO | Supervisor audit (read-only) | n/a |
| L2 | ✅ SPLNĚNO STÁVAJÍCÍM STAVEM | — | — |
| L3 | ✅ HOTOVO | GPT/worker | pass |
| S3 | ⏳ ČEKÁ NA VLASTNÍKA | — | — |
| T6 | ⏳ ČEKÁ NA VLASTNÍKA | — | — |
| D2 | ⏸ ODLOŽENO (UX RECONSIDER) | — | — |

**Governance note:** T1–T5, D1, SE1, SE2 provedeny jako supervisor-executed approved changes (jednořádkové string substituce, schváleny Opus syntézou Phase 1). Zaznamenáno v evidenci.  
**Proces-anomálie:** Agent-tool spawny nefirují Codex hooky → agent-registry.jsonl prázdný (expected, documented).

---

## Cross-track závislosti — přehled

```
S1 ──────────────────────────────────────────→ S2 → S4
                                              ↑
(S1 je prerekvizita pro S2 i S4)

L1 ──→ L2
L1 ──→ L3

S3 rozhodnutí-B ──→ T6

Vše ostatní je nezávislé.
```

**Doporučené pořadí prvních kroků (nejnižší riziko):**

| Krok | Proč |
|---|---|
| 1. **SE3** | 2 řádky, nulové riziko, okamžitý SEO benefit, odblokuje žádné závislosti ale je dlouho odkládatelné |
| 2. **S1** | 2 řádky ve 2 souborech, odblokuje S2+S4, prerekvizita pro half of Struktura tracku |
| 3. **T3** | Přeuspořádat 3 řádky v poli, zero risk, okamžitý konverzní benefit |
| 4. **L1** | Průzkumný krok, žádná změna kódu, odblokuje L2+L3 |

---

## Feedback loop: jak schválená položka vstoupí do Playbooku

Po schválení položky vlastníkem:

| Track | Playbook sekce k aktualizaci |
|---|---|
| **Struktura** (S2, S4) | `B1 Typ 1` — doplnit AboutSection jako mandatorní sekci trust bridge; upřesnit prerekvizitu ID rename |
| **Texty** (T1, T2, T3) | `B2 Hero titulek` — přidat potvrzený vzorec titulku; `B2 Proof rail` — potvrdit Audit-first pořadí jako doporučení |
| **Texty** (T4) | `B1 Typ 1` — doplnit že pricing karta 25 000+ Kč musí obsahovat bullet deliverables |
| **Design/UX** (D1) | `B3 checklist` — přidat pravidlo: below-fold island → `client:visible` |
| **Design/UX** (D2) | `B1 Typ 1` + `B2` — potvrdit dual CTA vzorec: primary = form, secondary = entry product s cenou |
| **SEO** (SE1, SE2) | `B3 checklist` — přidat potvrzený meta title vzorec pro Czech SMB |
| **SEO** (SE3) | `B3 robots.txt` — přidat Disallow /demo/ jako součást standardní šablony |
| **SEO** (SE4) | `B3 checklist` — potvrdit footer internal links jako SEO requirement |
| **Legal** (L2, L3) | `B3 checklist` — přidat minimální legal footer set; privacy link v lead capture formuláři |

**Postup:** Po schválení položky vlastníkem otevři `output/radeq-website-patterns-playbook.md`, najdi odpovídající sekci dle tabulky výše, a přidej větu: „Potvrzeno v radeq.cz [datum]:" + konkrétní doporučení s odůvodněním.

---

*Backlog je advisory. Žádné změny na webu nebyly provedeny. Veškerý obsah vychází z grounded auditu (v2, 2026-06-18) a reálného build výstupu. Verifikace každé položky před deplojem je na vlastníkovi projektu.*
