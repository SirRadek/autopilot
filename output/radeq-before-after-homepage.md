# Radeq.cz — Before / After homepage porovnání

**Datum:** 2026-06-18  
**Větev:** `autopilot/homepage-tuning-2026-06-18` vs produkce `main/new`  
**Preview URL:** https://sirradek.github.io/radeq/?v=7723fbf  
**Produkce:** https://radeq.cz/  

**Role note:** GPT/tech worker a Gemini/UX analyst jsou v tomto běhu Claude agenti (Sonnet 4.6) přehrávající role. Agent-tool spawny nefirují Codex hooky → agent-registry prázdný. Analýza je syntetizována supervisorem (Opus/Sonnet 4.6) z obou perspektiv.

---

## Metoda

Screenshoty pořízeny přes Playwright headless Chromium:
- Desktop: 1280×900, deviceScaleFactor 1, fullPage + above-fold clip
- Mobile: 390×844, isMobile true, deviceScaleFactor 2, fullPage + above-fold clip
- Čekání na `networkidle` + 1.2–1.5 s buffer

---

## FÁZE A — Verdikt: posunuli jsme se kupředu?

### Krátká odpověď

**Ano v copy a struktuře. Ne v designu. Celkový dojem zůstává "generovaný".**

Provedené změny jsou věcně správné a každá z nich je měřitelně lepší než původní stav. Ale design language je identický — stejná paleta, stejné fonty, stejný rytmus sekcí, stejná hustota karet. Visitor, který obě verze vidí vedle sebe, identifikuje změny v textu; neidentifikuje rozdíl v pocitu. Pocit „vygenerováno" nevychází ze špatného copy — vychází z nepřítomnosti zřetelných designových rozhodnutí.

---

### Položkový verdikt

#### T1 — Hero titulek ✅ Zlepšení

| | Text |
|---|---|
| **PŘED** | „Web pro malé firmy, kterému rozumíte vy i vaši zákazníci." |
| **PO** | „Web, který jasně vysvětlí vaši nabídku — a ušetří čas na zbytek." |

**Posun:** Nový titulek je outcome-orientovaný (co web udělá pro zákazníka), starý byl audience-orientovaný (kdo jsem). Pomlčka vytváří přirozenou pauzu, druhá polovina „ušetří čas na zbytek" přidává diferenciátor. Na mobilu je break přirozený.

**Co stále visí:** Titulek je funkčně dobrý, ale ne zapamatovatelný. Chybí vlastní slovní otisk — slova jako „jasně" a „ušetří" jsou správná, ale generická. Lepshee říká „Tvoříme digitální svět Lepshee" — to si zapamatujete. Radeq titulek zapamatujete za týden? Otevřená otázka pro vlastníka.

---

#### T2 — Hero lead ✅ Zlepšení (střední)

| | Text |
|---|---|
| **PŘED** | Delší popis s více větami, nestrukturovaný |
| **PO** | „Dělám weby, formuláře a automatizace pro živnostníky a malé firmy. Jeden kontakt, srozumitelný výstup — vše předám s návodem." |

**Posun:** Dvě věty, jasné. Druhá věta opakuje diferenciátor z titulku (předání). Funkční.

**Co stále visí:** „Dělám weby, formuláře a automatizace" — formuláře a automatizace jsou sekundární produkty. Headline říká „vysvětlí nabídku", lead říká „formuláře a automatizace" — mírný signál rozptylení. Zvážit: lead by mohl zůstat jen u webu jako primárního produktu.

---

#### T3 — Proof rail ✅ Výrazné zlepšení

| | PŘED | PO |
|---|---|---|
| Item 1 | KOMPLETNĚ / krátký popis | AUDIT OD 2 900 KČ / zjistíme, co řešit jako první, a odečteme to z realizace |
| Item 2 | SROZUMITELNĚ / krátký popis | WEB OD 25 000 KČ / struktura, text, formulář a základní nastavení v jednom balíku |
| Item 3 | PŘEDÁNO / krátký popis | PŘEDÁNÍ S NÁVODEM / web i data zůstanou vaše, bez závislosti na dodavateli |

**Posun:** Nový proof rail má cenu (price anchor), výsledek a procesní diferenciátor — přesně vzorec z playbooku B2. Původní byl výhodový jazyk bez kotvy.

**Poznámka GPT/tech worker:** Audit jako vstupní produkt s explicitní cenou a klausulí „odečteme z realizace" je silný konverzní pattern — snižuje bariéru vstupu. Toto je nejlepší změna v celém běhu.

---

#### T4 — Pricing deliverables ✅ Zlepšení (minor)

„Startovací web" má nyní 7 položek místo 5, přidány hosting a předání kódu. Konkrétnější. Odstraňuje námitku „co přesně dostanu?".

---

#### T5 — CTA label ✅ Drobné zlepšení

„Kontakt" místo původního textu — konzistentní s navigací, čistší.

---

#### S1 — FitSection id rename ✅ Technicky správné

`id="about"` → `id="fit"`, navItems `#about` → `#fit`. Eliminuje duplicate ID konflikt. Zero visible impact — invisible fix.

---

#### S2 — AboutSection ✅ Správné přidání

AboutSection je nově vložena mezi ServiceCatalog a PricingSection. Na desktopu zaujme správnou pozici ve flow — čtete o službách, pak o člověku, pak o cenách. Logická kompozice.

**Co ještě není:** AboutSection vizuálně působí jako další card-section bez odlišení. Potřebuje silnější vizuální „signature" — buď jiný background, jiný typografický rytmus, nebo fotku/ilustraci. Jinak se vizuálně splyne s okolím.

---

#### S4 — Nav rozšíření ✅/⚠️ Mixed

Nav nyní obsahuje 6 položek (CO ŘEŠÍM / SLUŽBY / O MNĚ / JAK PRACUJI / CENY / KONTAKT). Anchor na AboutSection je funkční.

**Varování Gemini/UX:** 6 položek nav na mobilu 390px je na hraně. Na screenshotu je hamburger (MENU tlačítko) — zkontrolovat, zda se na nejmenších telefonech nav nezalomí nebo neodřízne. Aktuální nav je přijatelný, ale každá další položka snižuje scannability.

---

#### D1 — client:visible ✅ Správné (neviditelné)

ContactTerminal přepnut na `client:visible` (IntersectionObserver deferred). TTI se zlepšuje, ale v screenshotu neviditelné. Správný krok.

---

#### SE1/SE2 — Meta title + description ✅ Správné (neviditelné)

`<title>` je nyní keyword-first: „Tvorba webů pro živnostníky a malé firmy | Radeq.cz". Description 142 znaků, action-oriented. Neviditelné v screenshotu, ale dá se ověřit přes `curl -s https://sirradek.github.io/radeq/ | grep '<title>'`.

---

#### SE3 — robots.txt ✅ Správné

`Disallow: /demo/` a `/en/demo/` přidány. Chrání interní review stránky před indexací.

---

#### SE4 — Footer service links ✅ Funkční přidání

Footer má nyní service links (Služby / Portfolio / Ukázky / Kontakt) vpravo jako box/tag style. Přidává interní linkování pro SEO a navigaci.

**Vizuální poznámka:** Box/tag styl v footeru působí jako label/button hybrid — vizuálně inconsistent se zbytkem footeru (který je textový). Nebrání funkci, ale design decision, která nebyla dobře vyřešena.

---

#### L2 — Footer legal links ✅ Již bylo

PODMÍNKY / GDPR / COOKIES / SOUKROMÍ — již v footeru.

---

#### L3 — Privacy link formulář ✅ Správné

„Odesláním souhlasíte se zpracováním osobních údajů." pod submit tlačítkem. Minimální GDPR compliance krok.

---

### Co se NO-OP nebo nezlepšilo

| Oblast | Hodnocení | Poznámka |
|---|---|---|
| Design language | ❌ Beze změny | Stejná paleta, stejné fonty, stejný rytmus — viz Fáze B/C |
| Visual hierarchy | ❌ Beze změny | Vše má stejnou vizuální váhu — H2 neroste, bílé plochy nejsou strategicky využity |
| Motion/animation | ❌ Beze změny | Žádné scroll animace, žádné entry animace, žádné micro-interakce |
| Typografická škála | ❌ Beze změny | Heading/body kontrast nedostatečný |
| Card density | ⚠️ Nezlepšeno | ServiceCatalog cards a Pricing cards jsou stále husté, vizuálně ploché |
| 3D mascot / visual anchor | ⚠️ Změna bez náhrady | Produkce má terracotta pot mascot (alespoň poskytuje vizuální zájem). Preview ho nemá ve fold — fold je čistší, ale vizuálně chudší |

---

### Co působí pořád „generovaně"

1. **Každá sekce vypadá jako každá jiná sekce.** Rytmus je „nadpis + text + karty / list" opakovaný bez variace pozadí, layoutu nebo vizuálního tónu.

2. **Barva nemá charakter.** Sand/béžová je bezpečná. Není špatná, ale je nerozlišující — každý second developer, který sáhl po Tailwind default palette, vypadá podobně.

3. **Typografie nemá charakter.** Fonty jsou funkčně správné, ale headline váha není dostatečně odvážná. Radeq.cz a sto dalších webů vypadají typograficky identicky.

4. **Karty jsou nakresleny, ne nafouknuty.** Serivce karty a pricing karty mají border, ale žádný vizuální zájem — žádná hloubka, žádný gradient, žádná ikonografie, žádný hover efekt, který by naznačoval interakci.

5. **Nejsou žádné vizuální kotvy.** Lepshee má gradient orb. Apple má product renders. Radeq nemá nic — dokonce terracotta pot z produkce je pryč nebo méně viditelný. Kde je oko návštěvníka odpočinout?

---

### Závěr Fáze A

Posun je reálný, ale ne dramatický. Copy a struktura jsou výrazně lepší — to je legitimní progress. Design zůstává neutrální / generovaný. Pro vlastníka: tyto změny jsou správné kroky v copy-vrstvi. Design-vrstva bude vyžadovat záměrná designová rozhodnutí — viz Fáze B+C report.

---

*Screenshoty: `output/radeq-compare/`*  
*Větev: `autopilot/homepage-tuning-2026-06-18` (commit `7723fbf`)*
