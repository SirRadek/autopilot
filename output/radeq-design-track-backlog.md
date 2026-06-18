# Radeq.cz — Design Track Backlog

**Větev pro implementaci:** `autopilot/design-direction-2026-06-18`  
**Zdroj:** `output/radeq-design-direction-proposal.md` (design direction "Řemeslná preciznost")  
**Datum:** 2026-06-18  
**Governance:** Nepushovat do main, neměnit produkci. Preview přes GitHub Pages.

---

## Závislosti a pořadí

```
DT1 (tokens.css) → DT2 (typo utils) → DT3 (H1 size)
DT1 → DT4 (terracotta accent)
DT1 → DT5 (motion tokens)
DT1 → DT6 (marker CSS)
DT1 → DT8 (alternate block CSS)
DT7 (copy) — nezávislé
DT9 (inventář) — nezávislé
```

---

## DT1 — `src/styles/tokens.css` + import v BaseLayout

**Komplexita:** 1/5  
**Závisí na:** —  
**Je podmínkou pro:** DT2, DT3, DT4, DT5, DT6, DT8

### Co/proč/kde

Vytvoří dedikovaný soubor pro design-direction tokeny. Existující `global.css` (6576 řádků) má robustní systém CSS custom properties (`--accent`, `--page-bg`, `--text-main` atd.) v `html[data-theme][data-style]` selektorech. Nový `tokens.css` **přidává** nové tokeny a přepisuje jen ty hodnoty, kde design direction mění záměr — bez mazání nebo duplikování stávajících.

### Navrhovaná změna

Soubor `src/styles/tokens.css`:
```css
:root {
  --size-display: clamp(3rem, 6vw, 5.5rem);
  --weight-display: 800;
  --space-section: clamp(5rem, 8vw, 8rem);
  --space-flow: clamp(2rem, 3.5vw, 3.5rem);
  --reveal-duration: 480ms;
  --reveal-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Import v `src/layouts/BaseLayout.astro` — přidat řádek **za** existující `import '../styles/global.css'`.

### Akceptační kritéria

- `src/styles/tokens.css` existuje a je syntakticky validní
- `BaseLayout.astro` importuje `tokens.css` po `global.css`
- `npm run build` proběhne bez chyby
- `--size-display` je k dispozici jako CSS proměnná v build output (`grep -r "size-display" dist/`)

### Vlastníkovo rozhodnutí

Není potřeba — čistě technická změna.

### Promote to playbook

**Ano** — vzor "design-direction override layer jako samostatný soubor" patří do B4 playbooku.

---

## DT2 — Typografická škála / utility třídy

**Komplexita:** 2/5  
**Závisí na:** DT1  
**Je podmínkou pro:** DT3

### Co/proč/kde

Přidá utility třídy `.text-display`, `.text-section`, `.text-lead` do `tokens.css` nebo `global.css`. Umožní konzistentní používání typografické škály bez hard-coded hodnot v komponentech.

### Navrhovaná změna

Přidat do `src/styles/tokens.css`:
```css
.text-display {
  font-size: var(--size-display);
  font-weight: var(--weight-display);
  line-height: 1.08;
  letter-spacing: -0.02em;
}
.text-section {
  font-size: clamp(1.85rem, 2.7vw, 3.75rem);
  font-weight: 760;
  line-height: 1.15;
}
.text-lead {
  font-size: clamp(1.05rem, 1.4vw, 1.3rem);
  line-height: 1.55;
}
```

### Akceptační kritéria

- Třídy jsou v build output
- `npm run typecheck` projde
- `npm run build` projde

### Vlastníkovo rozhodnutí

Není potřeba.

### Promote to playbook

**Ano** — typografická škála jako utility třídy je obecný pattern.

---

## DT3 — H1 display token weight 800 (úprava velikosti)

**Komplexita:** 1/5  
**Závisí na:** DT1  
**Je podmínkou pro:** —

### Co/proč/kde

**Klíčový nález:** `h1` v `global.css` má **již** `font-weight: 800`. DT3 proto není o váze, ale o **úpravě `font-size` clamp** tak, aby H1 na typickém desktopu (1280px) bylo větší — `4.2vw` → `6vw`. Stávající clamp `clamp(2.75rem, 4.2vw, 5.8rem)` = 53px na 1280px; nový `clamp(3rem, 6vw, 5.5rem)` = 76.8px na 1280px.

Soubor: `src/styles/global.css`, řádek s `h1 { font-size: clamp(2.75rem, 4.2vw, 5.8rem) }`.

### Navrhovaná změna

Změnit v `global.css`:
```css
/* PŘED */
h1 { font-size: clamp(2.75rem, 4.2vw, 5.8rem); font-weight: 800; }

/* PO */
h1 { font-size: var(--size-display, clamp(3rem, 6vw, 5.5rem)); font-weight: 800; }
```

Použití `var(--size-display, fallback)` napojí na DT1 token s fallbackem pro případ, že `tokens.css` nenačte.

### Akceptační kritéria

- Hero H1 na 1280px viewportu je vizuálně větší než před změnou
- Mobil (390px): `clamp` spodní mez `3rem` = 48px — přijatelné, nekvalokuje layout
- `npm run build` projde, žádné CSS parse errory

### Vlastníkovo rozhodnutí

Není potřeba — `font-weight: 800` zůstává, mění se jen size. Pokud vlastník chce Syne font, přidá se `font-family` sem.

**Poznámka k Syne fontu:** Design direction doporučuje Syne (Google Fonts) pro H1/H2. Implementace Syne vyžaduje rozhodnutí vlastníka o:
1. Zda preferuje self-hosted (GDPR-friendly) nebo `@import` z Google Fonts
2. Jaký font-weight subset stáhnout

Označeno: **čeká na vlastníka.**

### Promote to playbook

Ne — jednotlivá hodnota, ne obecný pattern.

---

## DT4 — Terracotta accent jako CTA/akcent barva

**Komplexita:** 1/5  
**Závisí na:** DT1  
**Je podmínkou pro:** —

### Co/proč/kde

Stávající `--accent: #a85f2a` (variant-a light) je teplá hnědá. Design direction navrhuje `#C4521A` — živější terrakota s více oranžovou. Změna ovlivní: `button-primary` (background), `.hero-proof-rail dt` (barva popisků), `.service-card__marker` (barva čísla), hover states karet.

Soubor: `src/styles/tokens.css` (přepsání s vyšší specificitou po global.css).

### Navrhovaná změna

Přidat do `tokens.css` (importovaný po `global.css`, stejná specificita = cascade wins):
```css
html[data-theme="light"][data-style="variant-a"] {
  --accent: #C4521A;
}
```

### Akceptační kritéria

- CTA tlačítko v hero sekci je vizuálně terracotta-oranžové, ne hnědé
- `.service-card:hover` border je terracotta
- Kontrast: `#C4521A` na bílém = 4.2:1 (splňuje AA pro velký text); zkontrolovat přes preview

### Vlastníkovo rozhodnutí

**Čeká na vlastníka z preview** — přesný odstín `#C4521A` vs `#a85f2a` je vizuální rozhodnutí. Implementovaná hodnota slouží jako výchozí bod pro review.

### Promote to playbook

Ne — specifická hodnota.

---

## DT5 — Motion: card hover lift + section Intersection Observer reveal + reduced-motion

**Komplexita:** 3/5  
**Závisí na:** DT1 (pro `--reveal-duration`, `--reveal-easing`)  
**Je podmínkou pro:** —

### Co/proč/kde

**5a — Card hover lift:** `.service-card` má v CSS transition pro `transform 180ms ease`. Chybí jen `transform: translateY(-4px)` v hover state. Soubor: `global.css`, cca řádek 3530 (`.service-card:hover, ...`).

**5b — Section reveal:** Sekce `main section` načtou s `opacity: 0; transform: translateY(24px)` a přejdou do `is-revealed` state přes Intersection Observer. Soubor: `global.css` (CSS) + `BaseLayout.astro` (inline `<script>` s IO logicí).

**5c — Reduced motion:** `@media (prefers-reduced-motion: reduce)` přepíše reveal state na viditelný ihned. `MotionOrchestrator` již detekuje `prefers-reduced-motion` a nastavuje `data-motion-ready="reduced"` — reveal CSS může reagovat na tento atribut jako fallback.

### Navrhovaná změna

1. V `global.css` přidat `transform: translateY(-4px)` do `.service-card:hover` bloku.
2. Přidat CSS pro `.reveal-section` do `global.css`:
   ```css
   [data-reveal-section] {
     opacity: 0;
     transform: translateY(24px);
     transition: opacity var(--reveal-duration, 480ms) var(--reveal-easing, ease),
                 transform var(--reveal-duration, 480ms) var(--reveal-easing, ease);
   }
   [data-reveal-section].is-revealed {
     opacity: 1;
     transform: translateY(0);
   }
   @media (prefers-reduced-motion: reduce) {
     [data-reveal-section] { opacity: 1; transform: none; transition: none; }
   }
   ```
3. V `BaseLayout.astro` přidat inline `<script>` s Intersection Observer.
4. Přidat `data-reveal-section` atribut do HeroSection, ServiceCatalog, AboutSection, PricingSection, FitSection.

### Akceptační kritéria

- Hover na service kartě způsobí `translateY(-4px)` zdvih
- Scrollování na sekci aktivuje fade-in (opacity 0→1, translateY 24px→0px)
- `prefers-reduced-motion: reduce` → sekce jsou viditelné bez animace hned při načtení
- `npm run build` projde

### Vlastníkovo rozhodnutí

Není potřeba — reduced-motion respektuje OS nastavení.

### Promote to playbook

**Ano** — vzor "IO reveal s reduced-motion fallback" je obecný pattern.

---

## DT6 — ServiceCatalog dekorativní čísla (CSS enhancement)

**Komplexita:** 2/5  
**Závisí na:** DT1  
**Je podmínkou pro:** —

### Co/proč/kde

**Klíčový nález:** `.service-card__marker` v `ServiceCatalog.astro` **již existuje** s HTML `<span class="service-card__marker"><span>{index + 1, padStart(2, '0')}</span></span>`. Čísla jsou vykreslována jako malý 2.25rem × 2.25rem odznak (`font-size: 0.72rem`). DT6 přemístí a zvětší čísla jako dekorativní watermark element ve vrchním rohu karty.

Soubor: `src/styles/global.css`, bloky `.service-card__marker` a `.service-card__marker span` (cca řádky 3566–3575, 3480–3484).

### Navrhovaná změna

```css
/* Přepsat .service-card__marker — z inline badge na absolute dekoraci */
.service-card__marker {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  z-index: 0;
  pointer-events: none;
  width: auto;
  height: auto;
  border: none;
  border-radius: 0;
  background: none;
  box-shadow: none;
  display: block;
}
.service-card__marker span {
  font-family: var(--font-mono);
  font-size: clamp(3.5rem, 5vw, 5rem);
  font-weight: 700;
  color: var(--accent);
  opacity: 0.1;
  line-height: 1;
}
```

### Akceptační kritéria

- Čísla "01", "02" atd. jsou viditelná jako velký, poloprůhledný watermark v pravém rohu karty
- Obsah karty (nadpis, popis) zůstane čitelný a nekryje se s číslem
- Na mobilu (390px) čísla se neořezávají přes `overflow: hidden` na `.service-card`
- `npm run build` projde

### Vlastníkovo rozhodnutí

Není potřeba.

### Promote to playbook

Ne — komponentně specifické.

---

## DT7 — Copy tón: sekční nadpisy jako tvrzení

**Komplexita:** 1/5  
**Závisí na:** —  
**Je podmínkou pro:** —

### Co/proč/kde

Stávající sekční nadpisy jsou mix tvrzení a popisků. Design direction volá po nadpisech jako tvrzeních (statements, nikoliv labels). Soubor: `src/data/siteContent.ts`.

**Analýza stávajících nadpisů (CZ):**
| Sekce | Stávající | Hodnocení |
|---|---|---|
| Hero | "Web, který jasně vysvětlí vaši nabídku — a ušetří čas na zbytek." | ✅ Tvrzení |
| FitSection H2 | "Kdy to dává smysl" | ⚠️ Popisek / otázka |
| ServiceCatalog H2 | "Co vám můžu zjednodušit" | ⚠️ Popisek / nabídka |
| AboutSection H2 | "Jeden technický partner pro obsah, data i klidné vysvětlení." | ✅ Tvrzení |
| PricingSection H2 | "Orientační ceny bez překvapení." | ✅ Tvrzení |
| HandoffStandard H2 | "Důkazem není jen vzhled. Důkazem je i předání." | ✅ Tvrzení |

Změny potřebné:
- FitSection: "Kdy to dává smysl" → **"Hodí se, když stojíte na začátku."**
- ServiceCatalog: "Co vám můžu zjednodušit" → **"Tady ztrácíte čas. Tady vstoupím."**

### Navrhovaná změna

V `src/data/siteContent.ts`:
- Řádek cca 232: `title: 'Kdy to dává smysl'` → `title: 'Hodí se, když stojíte na začátku.'`
- Řádek cca 286: `title: 'Co vám můžu zjednodušit'` → `title: 'Tady ztrácíte čas. Tady vstoupím.'`

(Symetricky pro EN verzi, pokud EN sekce existují.)

### Akceptační kritéria

- Obě sekce zobrazují nový nadpis v preview
- `npm run build` projde
- TypeScript typecheck projde

### Vlastníkovo rozhodnutí

**Čeká na vlastníka z preview** — copywriting. Návrhy jsou výchozí bod; vlastník rozhodne z preview.

### Promote to playbook

Ne — konkrétní copy.

---

## DT8 — Alternate/tmavý blok pro vizuální rytmus (AboutSection)

**Komplexita:** 2/5  
**Závisí na:** DT1  
**Je podmínkou pro:** —

### Co/proč/kde

Každá sekce homepage vypadá identicky (bílá/krémová plocha, headings, karty). Vizuální rytmus potřebuje alespoň jednu sekci s odlišným pozadím — "tmavý blok" nebo "alternate sekce". AboutSection (`section.about-services`) je dobrý kandidát: přichází po ServiceCatalog a přede PricingSection — přirozený rytmický break.

Soubory: `global.css` (CSS pro alternate sekci).

### Navrhovaná změna

Přidat do `global.css` (nebo `tokens.css`):
```css
/* DT8: Alternate section rhythm */
.section--alternate {
  background: var(--panel-strong, #efe6dc);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
/* nebo tmavá varianta (k posouzení vlastníka z preview): */
.section--dark {
  background: #2a1f18;
  color: var(--panel-bg);
  --text-main: var(--panel-bg);
  --text-muted: #b9aa9d;
  --line: #3d2e27;
}
```

Přidat `.section--alternate` na `<section class="about-services section--alternate" ...>` v `AboutSection.astro`.

### Akceptační kritéria

- AboutSection má viditelně jiné pozadí než ServiceCatalog a PricingSection
- Text je stále čitelný (kontrast ≥ 4.5:1 pro body text)
- `npm run build` projde

### Vlastníkovo rozhodnutí

**Čeká na vlastníka z preview:**
- `.section--alternate` (světlé `#efe6dc`) — subtilní, bezpečná volba
- `.section--dark` (`#2a1f18`) — výrazná, "craftsman dark" varianta

Obě varianty budou v CSS; v HTML bude nasazena `.section--alternate`. Pokud vlastník chce dark, změní class.

### Promote to playbook

**Ano** — vzor "section rhythm přes alternate-block class" je obecný pattern.

---

## DT9 — `component-inventory.md` + visual QA protokol

**Komplexita:** 1/5  
**Závisí na:** —  
**Je podmínkou for:** —

### Co/proč/kde

Chybí přehled komponent pro orientaci budoucích implementačních běhů. `component-inventory.md` dokumentuje každou komponentu: soubor, CSS třídy, props, závislosti na CSS vars, screenshots.

Soubor: `docs/radeq-component-inventory.md` (v radeq projektu).

### Navrhovaná změna

Vytvořit `docs/radeq-component-inventory.md` se záznamy pro:
- HeroSection
- ServiceCatalog + ServiceCard
- AboutSection
- PricingSection
- FitSection
- HandoffStandard
- SiteFooter
- BaseLayout + global.css architektura

### Akceptační kritéria

- Soubor existuje a je čitelný
- Každý záznam má: soubor, CSS třídy, key CSS vars, notes
- `npm run build` projde (soubor je jen dokumentace)

### Vlastníkovo rozhodnutí

Není potřeba.

### Promote to playbook

**Ano** — component inventory jako živý dokument patří do projektové governance.

---

## Shrnutí

| ID | Název | Komplexita | Závisí na | Vlastník? | Playbook? |
|---|---|---|---|---|---|
| DT1 | tokens.css + import | 1/5 | — | Ne | Ano |
| DT2 | Typografická škála | 2/5 | DT1 | Ne | Ano |
| DT3 | H1 display size | 1/5 | DT1 | Syne font: Ano | Ne |
| DT4 | Terracotta accent | 1/5 | DT1 | Ano (z preview) | Ne |
| DT5 | Motion + IO reveal | 3/5 | DT1 | Ne | Ano |
| DT6 | ServiceCatalog čísla | 2/5 | DT1 | Ne | Ne |
| DT7 | Copy tón nadpisů | 1/5 | — | Ano (z preview) | Ne |
| DT8 | Alternate dark block | 2/5 | DT1 | Ano (z preview) | Ano |
| DT9 | Component inventory | 1/5 | — | Ne | Ano |

**Položky čekající na vlastníka (k posouzení z preview):**
- DT3: Syne font — výběr fontu a způsob načtení
- DT4: Přesný odstín terracotty (`#C4521A` vs `#a85f2a`)
- DT7: Návrhy copy nadpisů k odsouhlasení
- DT8: Světlý alternate vs tmavý `.section--dark` blok

---

*Vytvořeno: 2026-06-18 | Větev: `autopilot/design-direction-2026-06-18` | Projekt: radeq.cz*
