# Reusable Website Patterns Playbook

**Zdroj:** Agent B (hp-20260617-radeq-playbook) + Supervisor synthesis  
**Datum:** 2026-06-17  
**Stack reference:** Astro + React islands + Cloudflare Worker + D1  
**Určeno pro:** Operátor používající Claude Code + Codex, ne designový tým

---

## B1. Vzory sekcí podle typu webu

### Typ 1: Solo freelancer / konzultant (jako radeq.cz)

Cíl: konvertovat návštěvníka od „je tahle osoba legit?" na „měl bych ji kontaktovat" v jednom scrollu.

**Pořadí sekcí:**

1. **Header/Nav** — jméno/brand, 3–5 nav položek, jedno primární CTA tlačítko (kontakt nebo schůzka), theme toggle pokud relevantní. Nav minimální — každý extra odkaz snižuje pravděpodobnost kliknutí na CTA.
2. **Hero** — H1 popisuje primární službu + výsledek pro pojmenované publikum. Lead vysvětluje komu to je a proč právě tato osoba (ne „my"). Dvě CTA: primární (kontakt/probrat), sekundární (ukázky/práce). Proof rail: 3 položky max (vzorec viz B2).
3. **FitSection / Kvalifikační signály** — „Kdy to dává smysl": 4–6 konkrétních popisů problémů psaných v první osobě. Tato sekce předkvalifikuje a provádí auto-selekci. Kompaktní, bez obrázků.
4. **Služby** — 3–5 service karet, každá s outcome-orientovaným titulkem, jednovětným popisem, volitelně startovací cenou „od X Kč". Víc než 5 vypadá jako menu, ne nabídka.
5. **Ceny** — process steps (max 3 kroky) + 2–3 pricing karty. Vstupní produkt jako featured karta. Price anchoring: zobrazit nejnižší produkt s viditelnou cenou.
6. **O mně / About** — krátký odstavec o background, 3–4 principy (seznam, ne prose), bridge věta vedoucí k formuláři. Osobní foto není nutné; silný headline + principy sekci udrží.
7. **Proof / Ukázky teasery** — 2–3 karty odkazující na /ukazky/ nebo statické case stránky. Štítky: „Ukázka", „Modelový výstup", nikdy „Klient X říká" bez souhlasu. Žádné vymyšlené metriky.
8. **Kontaktní formulář** — vlastní sekce s viditelným anchorem, jasný heading, krátký intro, 4–5 polí max.

**CTA strategie:** jedno primární CTA celou stránkou (kontakt/probrat). Sekundární CTA (ukázky) pouze v hero a volitelně v About. Rozptýlená CTA fragmentují konverzní záměr.

---

### Typ 2: Místní servisní firma pro lead gen (instalatér, účetní, úklidová firma)

Cíl: zachytit telefonní hovor nebo odeslání formuláře od místního návštěvníka do 3 vteřin.

**Pořadí sekcí:**

1. **Header** — logo, telefonní číslo prominentně (vpravo nahoře), jedno CTA tlačítko „Zavolat" nebo „Poptávka". Žádné zbytečné nav položky. Lokalita v headeru pokud relevantní.
2. **Hero** — H1 popisuje službu + lokalitu + slib rychlosti. Žádný jargon. Jedno CTA: telefon nebo formulář. Fotka firmy nebo týmu pokud k dispozici — zde je fyzický důvěrový signál nutný.
3. **Trust signals band** — 3–4 inline signály: roky praxe, počet zakázek, certifikace, oblast. Ekvivalent proof railu.
4. **Služby** — jednoduchý seznam nebo 3-karta grid. Začínat nejčastější službou, ne nejziskovější. Návštěvníci jsou v problem-solving módu.
5. **Jak to funguje** — max 3 kroky. „Zavolejte → Domluvíme termín → Opravíme." Ikony pokud jsou; jinak číslované kroky.
6. **Social proof** — 3–5 krátkých testimonialů se jménem a volitelně městem. Pouze reálná křestní jména, žádná příjmení. Bez souhlasu klienta nepoužívat.
7. **Oblast pokrytí / mapa** — textový seznam měst/obvodů nebo embedded mapa. Pro lokální SEO klíčový signál pro „near me" vyhledávání.
8. **Kontakt / CTA** — telefon + formulář. Formulář: jméno, telefon, adresa (volitelně), popis problému. Telefonní číslo musí být klikatelné (tel: odkaz).

**CTA strategie:** telefon je primární, formulář sekundární. Místní zákazník nesmí telefon hledat.

---

### Typ 3: Jednoproduktová landing page (jeden offer, vysoká konverze)

Cíl: konvertovat návštěvníka na jediné specifické nabídce. Žádná navigace mimo stránku.

**Pořadí sekcí:**

1. **Above-fold blok** — H1 popisuje výsledek v 6–10 slovech. Subhead přidává komu to je a v čem je jiný. Jedno CTA. Bez nav baru (nebo minimální sticky bar jen s CTA).
2. **Popis problému** — 3–5 bullet points popisujících bolestný stav, který produkt řeší. Psáno jako „Pokud vy...". Tato sekce buduje resonanci před řešením.
3. **Řešení / Jak funguje** — 3-krokový process nebo feature callouts, každý vázán na výsledek. Screenshoty nebo ilustrace pokud dostupné.
4. **Social proof** — 3 testimonialsy nebo loga. Pokud žádné: „Co dostanete" seznam. Pro české SMB funguje „Výstup obsahuje..." lépe než prázdné testimonialsy.
5. **Cena** — jedna cena (nebo 2 úrovně max). Zobrazit jasně, brzy. Česká SMB publika kontrolují cenu před čtením features. Zahrnout co je a není součástí.
6. **FAQ** — 5–8 otázek zaměřených na purchase-blocking námitky. Každá odpověď 2–3 věty.
7. **Finální CTA** — opakovat primární CTA s urgency signálem pokud pravdivý nebo risk-reduction signálem.

**CTA strategie:** jedno CTA tlačítko, opakováno 3× (above fold, po social proof, na konci). Na landing page nevkládat sekundární CTA — odvádí konverzi.

---

### Typ 4: Portfolio / case study web (kreativní profesionál nebo agentura)

Cíl: vybudovat dostatek proof kvality a přístupu, aby návštěvník zarezervoval konzultaci nebo web přeposlal.

**Pořadí sekcí:**

1. **Header** — jméno/brand, minimální nav (Práce, O mně, Kontakt), žádné CTA tlačítko v headeru.
2. **Hero** — H1 popisuje specializaci a přístup. Žádná cena. Lead věta popisuje typ klienta a práce. Jeden odkaz: „Ukázky práce →".
3. **Vybraná práce** — 4–8 case karet. Každá: název projektu, typ klienta (ne nutně jméno), disciplína, jednovětný výsledek. Odkaz na celou case study stránku. Pro česky mluvící: označit jako „modelový výstup" nebo „konceptuální ukázka" bez klientského souhlasu.
4. **Přístup / Jak pracuji** — 4 principy nebo 3-krokový proces. Diferenciační sekce pro kreativce.
5. **O mně** — background, 1–2 odstavce, zaměřené na relevantní zkušenosti ne obecnou biografii.
6. **Služby a co nedělám** — jasné vyjádření co děláte a co záměrně neděláte. Signals senioritu a předkvalifikuje poptávky.
7. **Kontakt** — minimální formulář: jméno, e-mail, typ projektu, stručný popis. Závazek doby odpovědi je trust signál.

**CTA strategie:** soft CTA v hero (procházet práci), medium CTA po About (domluvit schůzku), strong CTA na konci (kontaktní formulář).

---

## B2. Copy vzorce pro české SMB publikum

### Hero titulek

**Vzorec:** `[Výsledek pro cílovou skupinu] + bez [bolest / komplikace]`

Nebo pro servisní weby: `[Hlavní služba] pro [publikum], [diferenciátor].`

**Délka:** 10–18 slov pro titulek. 40–60 slov pro lead. České SMB čtou na mobilu; dlouhé hero věty selhávají pod 400px.

**Trigger slova, která konvertují (česky):**
- **Jednoduché / jednoduchý** — klíčový hodnotový signál pro netechnické kupce
- **Přehledné** — jasnost nad komplexitou
- **Bez závazku** — snižuje purchase anxiety
- **Jasná cena** — price transparentnost je disproportionálně důležitá; „od X Kč" ukotvuje očekávání
- **Předání** — signál handoff/nezávislosti; česká SMB se akutně bojí vendor lock-in
- **Bez technické mlhy** — účinná fráze radeq.cz; pojmenovává bolest bez povýšenosti
- **Funguje** — „web, který funguje" je akčnější než „profesionální web"

**Slova k vyhnutí:**
- „Agilní", „škálovatelný", „synergický" — enterprise jargon
- „Garantujeme" bez důkazu — čeští kupci jsou skeptičtí k nepodloženým zárukám
- „Moderní" samotné — přepoužité
- „AI-powered" v SMB kontextu — generuje úzkost, ne důvěru

### Proof rail vzorec

Přesně 3 položky. Formát: krátký label + upřesňující věta nebo price anchor.

**3 položky = cena + výsledek + proces:**
- Item 1: `[Vstupní produkt] od [cena] Kč | [co návštěvník dostane]`
- Item 2: `[Primární služba] od [cena] Kč | [konkrétní výsledek]`
- Item 3: `[Procesní diferenciátor] | [proč to zákazníkovi záleží]`

Aktuální proof rail radeq.cz je dobře konstruovaný. Třetí položka (předání bez závislosti) adresuje specifický strach, který české SMB mají z webových vývojářů.

### FitSection vzorec

- 5–6 signálů, ne méně než 4, ne více než 7
- Psát jako první osoba, přítomný čas, problémové statements — ne otázky druhé osoby
- Každý signál dostatečně specifický, aby vyloučil nesprávné publikum
- Zahrnout alespoň jeden „nevím kde začít" signál jako poslední položka — zachytí decision-paralyzované návštěvníky
- Formát: vertikální seznam na mobilu (ne grid)

---

## B3. Astro + Cloudflare checklist

### Preview deployment — každý implementační běh musí vrátit sdílitelnou URL

| Krok | Akce | Hotovo když |
|---|---|---|
| 1 | Push větve na GitHub origin | `git push origin <branch>` vrátí `[new branch]` nebo `Branch set up to track` |
| 2 | GitHub Actions spustí workflow | `.github/workflows/preview-deploy.yml` trigger na `autopilot/**` / `codex/**` |
| 3 | Wrangler deploy `--env preview` | Worker `radeq-preview` živý na workers.dev |
| 4 | URL v process reportu | Sekce "Preview URL" v závěrečném reportu supervisora |

**Předpoklady (one-time owner setup):**
- GitHub repo → Settings → Secrets → Actions → přidat:
  - `CLOUDFLARE_API_TOKEN` — Cloudflare dashboard → My Profile → API Tokens → Create Token (šablona: Edit Cloudflare Workers)
  - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare dashboard → přehled účtu, pravý panel
  - `CLOUDFLARE_ACCOUNT_SUBDOMAIN` — vaše `<subdomain>.workers.dev` (vidíte v Workers → Overview)

**Preview URL formát:** `https://radeq-preview.<account-subdomain>.workers.dev`

**Omezení preview:** D1 databáze není napojena na preview environment — kontaktní formulář bude vracet chybu. Statický obsah (HTML, CSS, navigace, texty) funguje plně.

**Alternativa bez Actions secrets — Cloudflare Pages (lepší long-term):**
1. Cloudflare dashboard → Pages → Create project → Connect to Git → vybrat `SirRadek/radeq`
2. Build command: `npm run build`, output dir: `dist`
3. Environment variables: přidat `LEADS_DB` D1 binding (Pages → Settings → Functions → D1 database bindings)
4. Po propojení: každý push na libovolnou větev automaticky generuje `https://<hash>.radeq-cz.pages.dev`
5. Výhoda oproti Workers: form (D1) funguje i v preview pokud namapujete preview D1 databázi

### BaseLayout — každá stránka musí dostat

| Element | Hodnota |
|---|---|
| `<title>` | Unikátní, max 60 znaků, keyword-first |
| `<meta name="description">` | Unikátní, 140–155 znaků, action-oriented |
| `<link rel="canonical">` | Absolutní URL, `Astro.site + path` |
| `<meta property="og:url">` | Stejné jako canonical |
| `<meta property="og:title/description">` | Může shodovat s title/description |
| `<html lang="cs">` / `lang="en"` | Per-stránka, ne hardcoded |
| `hreflang` alternate links | Pouze pokud existuje odpovídající jazyková alternativa; potlačit pro jazykově exkluzivní stránky |
| `<meta name="viewport">` | Vždy; `width=device-width, initial-scale=1` |

### Security headers v `public/_headers`

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

Poznámka: `unsafe-inline` je nutný pro Astro SSR-injected inline styles a client-side islands.

### Velký chunk warning — řešení pro Astro + Three.js

Příčina: React + Three.js v jednom sdíleném chunku (React ~140 kB raw + Three.js ~600 kB raw = >500 kB Vite threshold).

**Oprava:** `manualChunks` v `astro.config.mjs`:
```js
vite: {
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] }
      }
    }
  }
}
```

Tím se Three.js dostane do samostatného cachovatelného chunku a warning zmizí.

### sitemap.xml.ts — standardní konfigurace

- Generovat všechny veřejné routy z typovaného pole, ne hardcoded string
- Zahrnout `/ukazky/*` detail routy pokud mají unikátní SEO obsah
- Vyloučit `/demo/*` routy — jsou pro interní review, ne pro indexaci
- Priority: homepage 1.0, service pages 0.8, showcase 0.7, privacy 0.3

### robots.txt.ts — standardní konfigurace

```
User-agent: *
Allow: /
Disallow: /demo/
Disallow: /en/demo/
Sitemap: https://yourdomain.cz/sitemap.xml
```

### Minimální sada statických trust routes (česky mluvící SMB servisní web)

| Route | Účel |
|---|---|
| `/kontakt/` | Kontaktní stránka s formulářem nebo telefonem + e-mailem; vlastní meta description |
| `/sluzby/` | Detail služeb; dobrý pro long-tail keyword targeting |
| `/soukromi/` | GDPR/privacy page; zákonně motivované + trust signál |

Volitelné ale doporučené:
- `/portfolio/` nebo `/ukazky/` — proof/ukázky stránka
- `/o-nas/` — About page s dedikovanou URL pro organické vyhledávání na jméno/brand

---

## B4. Co už existuje — reuse first

Tyto radeq.cz komponenty jsou production-verified; adaptovat, ne přegenerovat:

| Komponenta | Účel | Co změnit | Co nechat |
|---|---|---|---|
| `CommandHeader.astro` | Sticky nav, brand, nav items, CTA, ThemeModeToggle, language switch | Nav labels+hrefs, CTA label+href, brand name | Route-aware logiku potlačující false EN alternate links pro CS-only stránky |
| `HeroSection.astro` | H1 + lead + proof rail (3 položky) + 2 CTA + slot pro 3D mascot trigger | Veškerý text obsah v siteContent.ts | Slot-based mascot trigger (jednoduše nepředat prop pro weby bez 3D) |
| `PricingSection.astro` | 3-krokový process + 2–3 pricing karty s featured card variantou | Process step text, pricing card labels, ceny, featured flag | Featured card pattern (data-driven přes `featured: true`) |
| `ContactTerminal.tsx` | React island pro kontaktní formulář, D1 API POST, inline validation, status feedback | `project_type` options přes `content.terminal.projectOptions` | API payload, persistence, server validation contracts |
| `BaseLayout.astro` | `<html>`, `<head>` (meta, canonical, OG, hreflang, CSS), MotionOrchestrator | site/base v astro.config.mjs, default lang | Canonical URL construction, hreflang pair generation se suppression pro language-exclusive stránky |

**D1 lead capture pattern — kdy použít:**

✅ Použít D1 + Cloudflare Worker když:
- Leady musí být stored server-side bez third-party form backendu
- Operátor reviewuje leady manuálně, nepotřebuje real-time CRM integraci
- Privacy minimalizace je důležitá a third-party form services jsou záměrně vyloučeny

❌ Použít standardní third-party formulář (Formspree, Basin, Netlify Forms) když:
- D1 není v scope (jiný deployment target: Netlify, Vercel bez Worker vrstvy)
- Klient potřebuje CRM integraci bez custom middleware
- Objem formulářů je nízký a data sovereignty není priorita

D1 pattern je vhodný pro operátorský profil radeq.cz (solo, privacy-conscious, Cloudflare-native) ale je overengineered pro klienty, kteří potřebují jen form-to-email pipeline.

---

## B5. When to Use / When to Avoid

### Three.js mascot (CoreIsland + GLTFLoader)

**Použít když:**
- Brand má specifický character asset (GLB soubor s ověřenou licencí a provenancí)
- Stránka má budget pro ~180 kB dodatečný transfer (gzipped Three.js)
- Publikum očekává nebo oceňuje kreativní/technickou diferenciaci
- Mascot je genuinely optional (user opt-in, žádný obsah locked za ním, reduced-motion fallback existuje)

**Vyhnout se když:**
- Primární konverzní metrika je telefonní hovor nebo form fill
- Publikum je seniorní, netechnické nebo v high-anxiety purchase situaci
- GLB asset nemá ověřenou licenci nebo provenci
- Mascot by se zobrazoval na mobilu above the fold

### CLI terminálový formulář (ContactTerminal pattern)

**Použít když:**
- Cílové publikum je technické (vývojáři, IT profesionálové, kteří CLI metaforu rozpoznávají)
- Brand voice je záměrně nekonvenční a formulář je „character moment"
- Formulář je below-the-fold, návštěvník přichází pre-qualifikovaný

**Vyhnout se když:**
- Publikum jsou majitelé malých firem bez technického background — CLI metafora je neznámá a přidává kognitivní load ve chvíli nejvyšší purchase anxiety
- Primární služba je místní/offline (instalatér, úklidová firma, účetní)
- Senior publikum — monospace font a command-line styling čtou jako „rozbitý" nebo „starý"
- Formulář je first thing visible on the page (above-fold)

Pro radeq.cz: CLI formulář je deliberated choice v souladu s brand voice. Riziko jsou živnostníci/malé firmy bez technického background. Mitigace: formulář je below-the-fold po velké kvalifikační kopii, a radeq architektura uvádí explicit labels/guidance. Doporučení: zachovat, mít `/kontakt/` jako conventional fallback.

### A/B/C/D style variants (StyleVariantToggle, StyleMatrixSimulator)

**Použít pro:** interní design review; prezentace klientovi v controlled URL; QA surface pro demo routy.

**Vyhnout se pro:** veřejná homepage feature pro návštěvníky (decision fatigue, zpoždění CTA); náhrada za design rozhodnutí. Správná architektura radeq.cz izoluje A/B/C/D na demo routy a brání jejich leaknutí na veřejnou homepage (`data-style-source="fixed"`).

---

*Playbook je advisory. Veškerý obsah je Claude-generated synthesis; žádné produkční změny neprovedeny. Verifikace před implementací je na vlastníkovi projektu.*
