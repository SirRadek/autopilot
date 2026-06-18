# Radeq.cz — Design Direction Proposal

**Datum:** 2026-06-18  
**Referenční zdroj:** Lepshee.com analýza + before/after radeq.cz  
**Typ dokumentu:** Analýza + návrh — ŽÁDNÁ implementace. Advisory output.  
**Role:** Gemini/UX analyst (bounded, analýza stylu), GPT/tech worker (implementovatelnost, technická proveditelnost), Opus supervisor (syntéza). Všechny role = Claude Sonnet 4.6 agenti.

---

## FÁZE B — Rozbor lepshee.com

### Co funguje a proč

#### 1. Radikální redukce v hero

Lepshee hero = černé pozadí + 1 velká věta + minimální nav + scroll arrow. Nic jiného. Žádný proof rail, žádné CTA, žádný lead text nad foldem.

Efekt: návštěvník nemůže ignorovat H1. Není s čím kompetovat o pozornost. Vytváří napětí („co to dělají?") a nutí scrollovat.

**Co to není:** není to líné opuštění konverzní mechaniky — je to vědomé odsunutí konverze za pochopení. Funguje, protože lepshee má portfolio, které mluví za sebe. Radeq to nemůže kopírovat 1:1 — radeq potřebuje konvertovat, ne inspirovat.

#### 2. Typografie: jedna rozhodnutí, maximum efektu

Font: těžký geometric sans (pravděpodobně vlastní nebo Neue Haas Grotesk / DM Sans Extra Bold / Syne Bold). Velikost: ~100–120 px na desktopu, center-aligned. Váha: 700–900.

Na černém pozadí = maximální kontrast. Barva fontu je metalická šedá-bílá (ne čistá bílá), což na černém dává luxusnější pocit než #FFFFFF.

**Co je přenositelné:** zvýšit heading weight a scale na radeq. Aktuální heading je příliš skromné. H1 může klidně být 72–96 px na desktopu, font-weight 800. Nemusí být na černém bg — i na béžovém.

**Co není přenositelné:** center-aligned hero pro radeq není ideální (konverzní weby mají lepší výsledky s left-aligned / F-pattern scan). Lepshee si to může dovolit, protože není primárně konverzní.

#### 3. Barevná strategie: Black canvas + 1 accent

Paleta lepshee: #000 background + purple/magenta gradient orb jako vizuální anchor + neon green jako akcent (viditelný na language switcher).

Princip: minimální paleta + maximální kontrast. Tři barvy dělají víc než sedm.

**Co je přenositelné:** princip, ne barvy. Radeq potřebuje „svůj fialový orb" — jeden vizuální prvek, který je výrazný a opakuje se. Může to být typografická textura, barevný blok, ilustrační motiv. Nemusí to být gradient.

#### 4. Motion jako signatura

Ze statického screenshotu nelze zachytit animace, ale design naznačuje: gradient orb pulzuje/dýchá, scroll indicator animuje, pravděpodobně scroll-triggered section reveal. Toto vytváří pocit „živého" webu bez agresivního flashe.

**Co je přenositelné:** minimální scroll-triggered fade/slide pro sekce. `@keyframes` nebo Intersection Observer (`client:visible` je již zavedeno na ContactTerminal — stejný princip rozšírit na sekce). Na Astro stack je to dobře proveditelné.

#### 5. Projekt karty: reálné screenshots, ne ikony

Lepshee project karty = tmavé karty s reálnými UI screenshots aplikací. Žádné stock fotky, žádné generické ikony. Každá karta říká: „existuje reálná věc, kterou jsme udělali."

**Přenositelnost na radeq:** radeq `/ukazky/` sekce může zobrazovat reálné preview screenshots projektů místo icon+text karet. Pokud reálné projekty nemohou být pokazány (NDA atd.), „modelové výstupy" s reálnými UI screenshoty fungují.

#### 6. Copy voice: sebejistá minimalizace

„Tvoříme digitální svět Lepshee." — žádné vysvětlování, žádné audience targeting, žádné feature listing. Přímé, přítomné, brand-centric.

**Přenositelnost:** radeq nemůže jít tak daleko (potřebuje konvertovat SMB, ne inspirovat), ale může přijmout sebejistý tón na nadpisech sekcí. Místo „Proč zvolit radeq?" → „Jak to funguje." Místo „O mně" → „Přístup." Generované weby mají podnadpisy jako otázky — jisté weby mají tvrzení.

#### 7. Struktura: málokdy, hodně

Desktop: hero (fullscreen) → krátké „o nás" + service grid (6 kategorií, grid layout, tmavé karty) → proof (loga/klienti) → kontakt (jen e-mail, žádný formulář). Celkem ~4 sekce.

Radeq má ~8 sekcí. Lepshee má 4. Více sekcí = více scrollování = větší šance opuštění. Ale radeq konverzní smyčka vyžaduje proof + ceny + formulář — 6 sekcí je pravděpodobně minimum.

---

### Co lepshee nedělá dobře (pro radeq kontext)

- **Žádné ceny** — pro české SMB je cena kritický trust signal. Radeq správně ceny zobrazuje.
- **Žádný formulář** — jen e-mail. Radeq potřebuje formulář pro strukturovanou poptávku.
- **Copy příliš vágní pro SMB** — „Tvoříme digitální svět" nepomáhá zákazníkovi z Olomouce rozhodnout se. Radeq's outcome-focused copy je správnější přístup pro cílovou skupinu.

---

## FÁZE C — Od generovaného k profesionálně řízenému

### Klíčová diagnóza

Radeq vypadá generovaně ne proto, že je špatně udělaný — ale proto, že každé designové rozhodnutí je **defaultní, ne záměrné**. Barvy jsou výchozí Tailwind neutral. Fonty jsou výchozí web-safe sada. Spacing je výchozí CSS grid. Komponenty jsou funkční ale bez individuální identity.

Profesionálně řízený vývoj = **každé rozhodnutí má důvod**. Nemusí to být dramatické — ale musí existovat design language, která by mohla odpovědět na otázku: „Proč tato barva? Proč tento font? Proč tento spacing?"

---

### Design Direction: „Řemeslná preciznost"

Navrhovaný charakter: technická přesnost, klidná sebejistota, čitelná struktura. Odkazuje na řemeslo a přesnost — ne na startup-cool nebo agency-dark.

Klíčová slova: **strukturované, přesné, vzdušné, nenuceně sebejisté**.

Toto není dramatická změna palety — je to zpřísnění a záměrnost stávajícího směru.

---

### 1. Token systém — základ

#### Barvy

Aktuální problém: sand/béžová je neutrální až anonymní. Chybí výrazný akcent.

**Navrhovaný token set:**

```
--color-bg:          #F7F4EF   (stávající písek — ponechat)
--color-bg-alt:      #EDEAE4   (o stupeň tmavší pro alternate sekce)
--color-surface:     #FFFFFF   (karty — čistá bílá, ne béžová)
--color-ink:         #1A1714   (skoro-černá s teplým podtónem)
--color-ink-muted:   #6B6560   (secondary text)
--color-accent:      #C4521A   (terracotta/brick — záměrně teplý, ne oranžový)
--color-accent-soft: #F0E4DA   (accent background tint)
--color-cta:         #1A1714   (dark CTA — sebejistý, ne zelený)
--color-cta-text:    #F7F4EF   (inverted)
```

Princip: záměrně teplá paleta s terracotta jako jediným výrazným akcentem. Terracotta/brick odkazuje na řemeslo (hlína, cihla, materiál). Zároveň je neobvyklá jako CTA barva — většina webů je zelená/modrá/černá.

**Alternativní směr (pokud vlastník chce víc kontrastu):** ponechat béžový bg, ale přidat section s `--color-bg-dark: #1A1714` pro About nebo ContactTerminal — jeden tmavý blok na světlém webu vytvoří dramatický rytmus bez kompletního dark-mode.

#### Typografie

Aktuální problém: heading weight je příliš skromný, chybí display-size pro hero.

```
--font-display:     'Syne', 'DM Serif Display', system-ui  (pro H1 a sekčních nadpisech)
--font-body:        stávající sans (zachovat)
--font-mono:        stávající mono (zachovat pro terminal/code accenty)

--size-display:     clamp(3rem, 6vw, 5.5rem)    (H1)
--size-h2:          clamp(2rem, 4vw, 3rem)       (sekční nadpisy)
--size-h3:          clamp(1.25rem, 2vw, 1.5rem)  (karta titulky)
--size-body:        1rem
--size-small:       0.875rem

--weight-display:   800
--weight-heading:   700
--weight-body:      400
--weight-emphasis:  600
```

Syne je free Google Font, geometrický, se silnou vlastní identitou v bold. Alternativa: DM Serif Display pro kontrasnější serif/sans mix.

Klíčová změna: H1 `font-weight: 800, font-size: clamp(3rem, 6vw, 5.5rem)` z aktuálního ~2.5rem/700 — to je skok, který hero okamžitě vymezí.

#### Spacing systém

```
--space-xs:    0.25rem
--space-sm:    0.5rem
--space-md:    1rem
--space-lg:    2rem
--space-xl:    4rem
--space-2xl:   8rem
--space-3xl:   12rem

Section padding: --space-2xl top/bottom (8rem) → aktuálně je pravděpodobně méně
Hero padding-top: --space-3xl (12rem) pro „vzduch" nad headline
```

Aktuální web je příliš komprimovaný — sections followují hned za sebou. Více vzduch = vnímání jako kvalitnější.

---

### 2. Motion principy

Minimální, záměrný motion:

```
--duration-quick:   150ms
--duration-base:    300ms
--duration-slow:    600ms
--easing-out:       cubic-bezier(0.16, 1, 0.3, 1)  (ease-out-expo — rychlý start, pomalý konec)
```

**Doporučené použití:**
- Karty: `transform: translateY(0)` → na hover: `translateY(-4px) + box-shadow deepens` — jemný lift, ne bounce
- Hero headline: `opacity 0 → 1` při load, `transform: translateY(16px) → 0`, duration 600ms, easing out — nic dramatického
- Sekce entry: Intersection Observer → každá sekce `opacity 0, translateY(24px)` → `opacity 1, translateY(0)` při vstupu do viewportu, staggered 100ms per item
- Reduced-motion: `@media (prefers-reduced-motion: reduce)` vypnout vše kromě opacity

**Stack:** čisté CSS keyframes + Intersection Observer (žádná závislost na GSAP nebo Framer Motion pro toto). Astro `client:visible` pattern je již zaveden na ContactTerminal — rozšířit na sekce pomocí `<motion.div>` nebo custom hook.

---

### 3. Komponentový systém — co budovat záměrně

Aktuální problém: komponenty jsou funkční, ale nemají design signature. `ServiceCatalog` karta a `PricingSection` karta vypadají jako Bootstrap komponenty.

**Priority pro přepracování (od nejvyšší impact):**

#### A. HeroSection — nejvyšší priorita

Změny:
- H1 na display token (`clamp(3rem, 6vw, 5.5rem)`, weight 800)
- Proof rail: zvětšit label na `font-size: 0.75rem, letter-spacing: 0.1em, text-transform: uppercase, color: --color-accent` — přidá technický charakter
- Proof rail hodnoty: `font-size: 0.9rem, color: --color-ink-muted`
- Visual anchor: přidat jednoduché SVG nebo CSS shape do pravé části hero (ne 3D — prostě geometrický blok nebo liniová ilustrace). Alternativně: terracotta accent bar vlevo od H1 (`border-left: 4px solid --color-accent, padding-left: 1.5rem`)
- CTA: primární CTA přejít na dark (`--color-cta, --color-cta-text`) — sebejistý, ne zelený

#### B. ServiceCatalog karty — střední priorita

Aktuální: bílá karta, border, title, popis. Generické.

Změna: přidat ikonografii nebo číslo (01, 02, 03) jako velký dekorativní prvek v pozadí karty (`font-size: 5rem, color: --color-accent-soft, position: absolute, right: 1rem, top: 0.5rem`). Efekt: karta dostane charakter bez nutnosti ilustrací.

#### C. Sekce alternate bg — nízká priorita, vysoký vizuální efekt

Přidat `AboutSection` s `background: --color-bg-alt` (o stupeň tmavší než hlavní bg). Na světlém webu i malý tónový posun sekci vizuálně oddělí bez border.

Nebo: jeden tmavý blok — `ContactTerminal` section s `background: --color-ink` a světlým textem. Dramatické zakončení webu.

---

### 4. Proces — jak řídit vývoj, ne generovat ad-hoc

Klíčová změna v procesu: **design rozhodnutí mají být uložena a odkazovatelná**, ne re-derivována při každém agentu nebo sezení.

#### Krok 1: Design tokens soubor (`src/styles/tokens.css`)

Nevytvářet nové Tailwind configuarce — napsat CSS custom properties (`--color-*`, `--font-*`, `--space-*`) jako single source of truth. Každý komponent pak čte z tokenů, ne z hardcoded hodnot.

```css
/* src/styles/tokens.css */
:root {
  --color-accent: #C4521A;
  --font-display: 'Syne', system-ui;
  --size-display: clamp(3rem, 6vw, 5.5rem);
  /* ... */
}
```

Výsledek: změna palety = změna 5 řádků v tokens.css, ne prohledávání 20 komponent.

#### Krok 2: Typografická škála jako Astro global CSS

Importovat `tokens.css` v `BaseLayout.astro`. Aplikovat typografické tokeny jako CSS třídy nebo utility: `.text-display { font: var(--weight-display) var(--size-display)/1.1 var(--font-display) }`.

#### Krok 3: Component storybook nebo vizuální inventář

Není nutné Storybook (overhead). Stačí: `output/radeq-component-inventory.md` — seznam každé komponenty s: aktuální stav (screenshot), doporučená změna, design token reference, priorita.

Toto zabrání situaci, kdy každý agent nebo session re-hodnotí stejné komponenty od začátku.

#### Krok 4: Design review před každým implementačním během

Před dalším autopilot implementačním během: supervisor přečte design-direction-proposal → odsouhlasí s vlastníkem konkrétní změny → zapíše do backlogu jako design-track položky (D3, D4, ...).

**Zakázané:** generovat ad-hoc „vypadá to dobře" změny bez odkazu na token systém nebo tuto direction.

#### Krok 5: Visual QA protokol

Po každém implementačním běhu — ne jen build/acceptance, ale:
- Screenshot desktop fold
- Screenshot mobile fold  
- Checklist: heading size odpovídá tokenu? Accent barva aplikována konzistentně? Spacing odpovídá --space-xl/2xl? Motion přítomna/ověřena?

---

### 5. Top věci z lepshee spirit — přenositelné pro radeq

| Lepshee prvek | Radeq adaptace | Proveditelnost |
|---|---|---|
| Ultra-bold headline s max kontrasten | H1 weight 800, size clamp(3rem, 6vw, 5.5rem) — funguje i na béžovém bg | Nízká složitost, vysoký dopad |
| Jeden výrazný vizuální prvek jako anchor | Terracotta accent bar vlevo od H1 (4px border-left), nebo jednoduchá SVG linie | Nízká složitost |
| Sebejisté sekční nadpisy (tvrzení, ne otázky) | „Jak pracuji." místo „Proč zvolit radeq?" | Nulová technická práce — čistě copy |
| Tmavý závěr webu | ContactTerminal section s `background: #1A1714`, světlý text | Střední složitost — závisí na tom, zda chceme měnit Terminal layout |
| Card hover: jemný lift | `transform: translateY(-4px)` na hover všech karet | Nízká složitost |
| Sekce entry animace | Intersection Observer fade-in na každé sekci | Střední složitost — nové JS, ale malé |

---

### Co NEKOPÍROVAT z lepshee

- Černý hero background — pro české SMB konzervativní publikum není správný signál
- Brand-centric H1 bez audience targeting — radeq musí vysvětlit KDO to je pro
- Absence cen — radeq správně zobrazuje ceny, to ponechat
- Minimální formulář (jen email) — radeq potřebuje strukturovanou poptávku

---

### Závěr Fáze C

Radeq není špatně navržený. Je navržen genericky. Cesta od „generovaného" k „profesionálně řízenému" není restart — je to zpřísnění: token systém, odvážnější typografická škála, jeden výrazný vizuální prvek, záměrný motion, a proces který design rozhodnutí ukládá a brání re-derivaci.

Největší okamžitý dopad při nejnižší složitosti: **H1 weight 800 + display size** a **terracotta accent jako primární barva CTA a akcentů**. Tyto dvě změny radikálně změní první dojem bez doteku obsahu nebo struktury.

---

*Vytvořeno supervisorem (Opus/Sonnet 4.6) na základě GPT/tech worker implementovatelnostní analýzy a Gemini/UX style analýzy.*  
*Role note: Gemini a GPT worker jsou Claude agenti — known limitation, bez Codex hook firování.*  
*Screenshoty: `output/radeq-compare/`*
