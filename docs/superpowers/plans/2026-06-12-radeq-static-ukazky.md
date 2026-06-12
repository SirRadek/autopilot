# Radeq Static Ukazky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add static, public-safe Radeq work examples at `/ukazky/`, `/ukazky/chatbot/`, `/ukazky/automatizace/`, and `/ukazky/nabidka-eshop/` without turning the homepage into a demo menu or implying the chatbot uses an LLM, RAG, model API, payment flow, or hidden backend automation.

**Architecture:** Use a Czech static showcase layer separate from the existing `/demo/[module]/` A/B/C/D matrix. Store public copy and safety rules in typed TS data files, render SEO-readable Astro pages, and use one React island only for the local rule-based chatbot decision tree. Keep all handoff actions explicit and user-initiated.

**Tech Stack:** Astro 6 static output, React 19 islands, TypeScript 6, Vitest, Playwright, existing `BaseLayout`, `CommandHeader`, `ContactTerminal`, and `global.css`.

---

## Advisory Inputs Used

- Codex IA agent: create a Czech `/ukazky/` hub and first-wave details for chatbot, automation, and offer/e-shop; skip `/ukazky/firemni-web`.
- Codex chatbot architecture agent: use `src/pages/ukazky/chatbot.astro`, `src/components/RuleChatbotGuide.tsx`, and `src/data/chatbotGuide.ts`; no network calls, no localStorage, no LLM/RAG/model.
- Codex security agent: visible static/no-model disclaimers, no sensitive-data requests, explicit handoff, no payment/order claims, no hidden tracking.
- Codex QA agent: prefer static SEO pages, fixed style, no A/B/C/D leakage, no homepage CTA dilution, add Vitest and Playwright gates.
- Claude CLI: add owner gates before URL/nav, decision-tree content, email/form provider, final copy, and preview merge.
- Gemini CLI: treat its output as lower-confidence advisory because one run hit model capacity; adopted only the matching points about static rules, explicit handoff, and no AI overclaim.
- Project Decision Mesh: preserve complete-website primary offer, keep broader services secondary, keep core content static-readable, maintain lead minimization, and do not mutate production/deploy targets without owner approval.

## Owner Gates Before Product Code

Implementation must stop until these are answered:

1. **Language scope:** recommended first slice is Czech-only `/ukazky/*`. If owner wants English now, create a separate bilingual plan for `/en/examples/*` before coding.
2. **Public discoverability:** recommended first slice adds `/ukazky/` to header navigation only after pages pass tests; it does not add dominant homepage content above the website offer.
3. **Handoff method:** recommended first slice uses explicit CTA links to the existing contact form, not `mailto:` and not a new provider. `mailto:`, Formspree, Cloudflare email, analytics, or `/api/leads` prefill requires a separate owner decision.
4. **Old demo routes:** recommended first slice leaves `/demo/*` public and in sitemap for compatibility, but keeps them out of public homepage content. Redirecting or hiding them is a separate URL-migration decision.
5. **E-shop example behavior:** recommended first slice makes `/ukazky/nabidka-eshop/` a static SEO explanation page with a clearly labeled optional link to existing `/demo/eshop-offers/`; it does not embed a checkout or payment-like flow.

If owner chooses differently on any gate, stop and revise this plan before implementation.

## File Structure

Create in `C:\Users\sirok\Documents\Projects\radeq`:

- `src/data/showcaseExamples.ts`: typed Czech showcase data for hub and detail pages.
- `src/data/chatbotGuide.ts`: typed decision-tree data for the static chatbot/pruvodce.
- `src/components/RuleChatbotGuide.tsx`: React island for local choice state and explicit handoff reveal.
- `src/pages/ukazky/index.astro`: Czech showcase hub.
- `src/pages/ukazky/[example].astro`: generated detail pages for `chatbot`, `automatizace`, and `nabidka-eshop`.
- `tests/showcase-examples.test.ts`: Vitest content, slug, safety, and forbidden-claim contract tests.
- `tests/chatbot-guide.test.ts`: Vitest decision-tree integrity tests.
- `tests/showcase-examples.spec.ts`: Playwright route, SEO, safety, interaction, and mobile tests.

Modify:

- `src/layouts/BaseLayout.astro`: make alternate hreflang optional for Czech-only showcase pages.
- `src/pages/sitemap.xml.ts`: add `/ukazky/` and `/ukazky/*` URLs.
- `src/styles/global.css`: add showcase and rule-chatbot styles.
- `src/data/siteContent.ts`: only if owner approves header nav exposure and contact-form project options.
- `tests/i18n-content.test.ts`, `tests/i18n.spec.ts`, and `tests/smoke.spec.ts`: update only for approved nav/header changes and new SEO expectations.

Do not modify in this slice:

- `src/data/styleMatrix.ts` unless owner chooses to merge `/demo` with `/ukazky`.
- `functions/api/leads.ts`, `migrations/`, `wrangler.example.toml`, package files, workflow files, model assets, or deployment config.

---

### Task 1: Lock Owner Decisions And Branch

**Files:**
- Read: `C:\Users\sirok\Documents\Projects\radeq\src\pages\index.astro`
- Read: `C:\Users\sirok\Documents\Projects\radeq\src\data\siteContent.ts`
- Read: `C:\Users\sirok\Documents\Projects\radeq\src\pages\demo\[module].astro`
- No product file changes in this task.

- [ ] **Step 1: Confirm owner gates**

Ask owner to approve this exact default:

```text
Default scope for implementation:
1. Czech-only /ukazky first wave.
2. Create /ukazky hub plus /ukazky/chatbot, /ukazky/automatizace, /ukazky/nabidka-eshop.
3. Add a header nav item "Ukázky" only after tests pass; do not add a dominant homepage showcase section.
4. Keep old /demo routes public and in sitemap, but not promoted as the main homepage path.
5. Chatbot is a static rule-based guide with prepared answers. No LLM, RAG, model API, fetch, localStorage, analytics, or backend inference.
6. Handoff is explicit and points to the existing contact form. No mailto/provider/API prefill in this slice.
```

Expected: owner approves, or implementation stops and the plan is revised.

- [ ] **Step 2: Check working tree before product work**

Run:

```powershell
git status --short
```

Expected: no unrelated product changes. If there are unrelated changes, inspect them and do not revert them.

- [ ] **Step 3: Create implementation branch if needed**

Run:

```powershell
git switch -c codex/radeq-static-ukazky
```

Expected: branch created. If branch already exists, use:

```powershell
git switch codex/radeq-static-ukazky
```

Stop if branch switch would overwrite or discard existing work.

---

### Task 2: Add Showcase Data Contract Test First

**Files:**
- Create: `C:\Users\sirok\Documents\Projects\radeq\tests\showcase-examples.test.ts`
- Create: `C:\Users\sirok\Documents\Projects\radeq\src\data\showcaseExamples.ts`

- [ ] **Step 1: Write failing content contract test**

Create `tests/showcase-examples.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { showcaseExamples, showcaseHub } from '../src/data/showcaseExamples';

const expectedSlugs = ['chatbot', 'automatizace', 'nabidka-eshop'];
const forbiddenClaimFragments = [
  'llm',
  'rag',
  'model api',
  'učí se z vašich dat',
  'analyzuje soukromé dokumenty',
  'garantuje',
  'checkout',
  'objednávka je závazná',
  'heslo',
  'api klíč',
  'rodné číslo',
  'platební karta',
];

describe('showcase examples', () => {
  it('defines the first Czech showcase wave', () => {
    expect(showcaseHub.slug).toBe('ukazky');
    expect(showcaseExamples.map((example) => example.slug)).toEqual(expectedSlugs);
  });

  it('keeps each example SEO-readable and action-oriented', () => {
    for (const example of showcaseExamples) {
      expect(example.title.length).toBeGreaterThan(12);
      expect(example.description.length).toBeGreaterThan(60);
      expect(example.h1.length).toBeGreaterThan(12);
      expect(example.summary.length).toBeGreaterThan(80);
      expect(example.primaryCta.href).toBe('#terminal');
      expect(example.sections.length).toBeGreaterThanOrEqual(4);
      expect(example.safetyNotes.length).toBeGreaterThanOrEqual(3);
      expect(example.outOfScope.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('uses public-safe copy without fake client evidence or overclaims', () => {
    const publicText = JSON.stringify({ showcaseHub, showcaseExamples }).toLowerCase();

    for (const fragment of forbiddenClaimFragments) {
      expect(publicText).not.toContain(fragment.toLowerCase());
    }

    expect(publicText).toContain('statick');
    expect(publicText).toContain('bez klientských dat');
    expect(publicText).toContain('schválen');
    expect(publicText).toContain('úspora času');
    expect(publicText).toContain('ochrana dat');
  });
});
```

- [ ] **Step 2: Run test and verify it fails for missing data**

Run:

```powershell
npm.cmd test -- tests/showcase-examples.test.ts
```

Expected: FAIL because `src/data/showcaseExamples.ts` does not exist.

- [ ] **Step 3: Add typed showcase data**

Create `src/data/showcaseExamples.ts` with these exports and content fields:

```ts
export type ShowcaseSlug = 'chatbot' | 'automatizace' | 'nabidka-eshop';

export interface ShowcaseLink {
  label: string;
  href: string;
}

export interface ShowcaseSection {
  title: string;
  body: string;
  points: string[];
}

export interface ShowcaseExample {
  slug: ShowcaseSlug;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  summary: string;
  promise: string;
  primaryCta: ShowcaseLink;
  secondaryCta?: ShowcaseLink;
  sections: ShowcaseSection[];
  safetyNotes: string[];
  outOfScope: string[];
  proofTags: string[];
}

export const showcaseHub = {
  slug: 'ukazky',
  title: 'Ukázky praktických řešení | Radeq.cz',
  description:
    'Veřejně bezpečné ukázky chatbotu, automatizace a zpřehlednění nabídky bez klientských dat, plateb a skrytého zpracování.',
  h1: 'Ukázky praktických řešení pro web, poptávky a ruční práci',
  summary:
    'Tyto ukázky nejsou klientské case studies. Jsou to statické scénáře, které ukazují, jak se dá šetřit čas, peníze a provozní riziko bez zbytečného sběru dat.',
} as const;

export const showcaseExamples = [
  {
    slug: 'chatbot',
    title: 'Statický chatbot a průvodce | Radeq.cz',
    description:
      'Ukázka statického chatbotu a rozhodovacího průvodce nad připravenými odpověďmi bez modelu, soukromých dat a automatického odesílání.',
    h1: 'Chatbot, který odpovídá jen z připravených pravidel',
    eyebrow: 'Statický průvodce',
    summary:
      'Ukázka předvádí, jak může návštěvník rychle zjistit, jestli potřebuje nový web, audit, automatizaci nebo úpravu nabídky. Odpovědi jsou připravené dopředu a výsledek se nikam neposílá bez vědomé akce.',
    promise: 'Rychlejší orientace návštěvníků, méně opakovaných dotazů a menší riziko práce s citlivými údaji.',
    primaryCta: { label: 'Probrat jednoduchý chatbot', href: '#terminal' },
    secondaryCta: { label: 'Zpět na ukázky', href: '/ukazky/' },
    sections: [
      {
        title: 'Co ukázka řeší',
        body: 'Návštěvník často neví, jestli potřebuje web, audit, opravu nebo automatizaci. Průvodce mu dá bezpečnou první orientaci.',
        points: ['předem schválené odpovědi', 'volby místo volného promptu', 'jasné hranice a předání člověku'],
      },
      {
        title: 'Jak funguje',
        body: 'Pravidla běží v prohlížeči jako rozhodovací strom. Nevyhledává v soukromých datech a nevytváří nové odpovědi mimo připravený obsah.',
        points: ['statická databáze odpovědí', 'lokální stav v prohlížeči', 'reset bez ukládání osobních údajů'],
      },
      {
        title: 'Kde šetří čas a peníze',
        body: 'Opakované otázky se dají zjednodušit do několika bezpečných větví. Člověk pak řeší až dotazy, které opravdu potřebují posouzení.',
        points: ['méně ručního vysvětlování', 'rychlejší první odpověď', 'lepší zadání pro následný kontakt'],
      },
      {
        title: 'Kdy dává smysl opatrná AI vrstva',
        body: 'Pokročilejší asistent může dávat smysl později, až jsou zdroje, hranice, citlivá data a ruční kontrola jasně popsané.',
        points: ['nejdřív pravidla', 'potom schválené zdroje', 'nakonec měřitelné rozšíření'],
      },
    ],
    safetyNotes: [
      'Ukázka je statický průvodce bez modelového generování odpovědí.',
      'Do průvodce nepatří hesla, přístupy, interní dokumenty ani osobní údaje zákazníků.',
      'Kontakt se předává jen po vědomém kliknutí na poptávku nebo e-mailový krok.',
    ],
    outOfScope: ['automatické posuzování citlivých případů', 'zpracování soukromých dokumentů', 'garance obchodního výsledku'],
    proofTags: ['bez klientských dat', 'schválené odpovědi', 'úspora času', 'ochrana dat'],
  },
  {
    slug: 'automatizace',
    title: 'Automatizace poptávek a ruční práce | Radeq.cz',
    description:
      'Ukázka jednoduché automatizace poptávek: sběr, kontrola, třídění a předání bez skrytého posílání dat třetím stranám.',
    h1: 'Automatizace, která ubere ruční přepisování',
    eyebrow: 'Poptávky a data',
    summary:
      'Ukázka popisuje cestu od formuláře přes kontrolu polí až po přehledný stav. Cílem není autonomní systém, ale méně ztracených dotazů, méně chyb a lepší kontrola nad daty.',
    promise: 'Méně ručního kopírování, rychlejší reakce a jasnější odpovědnost za další krok.',
    primaryCta: { label: 'Zmapovat ruční práci', href: '#terminal' },
    secondaryCta: { label: 'Zpět na ukázky', href: '/ukazky/' },
    sections: [
      {
        title: 'Co ukázka řeší',
        body: 'Poptávky často končí v e-mailu, tabulce a poznámkách současně. Automatizace má sjednotit příjem a ukázat, kde je další krok.',
        points: ['kontrola povinných polí', 'třídění podle typu práce', 'přehled stavu bez těžkého systému'],
      },
      {
        title: 'Bezpečný průběh',
        body: 'Ukázka pracuje s minimem údajů a popisuje, co se má předávat až při osobní domluvě.',
        points: ['volitelná doplňující pole', 'žádné přístupy ve formuláři', 'ruční kontrola citlivých případů'],
      },
      {
        title: 'Kde šetří čas a peníze',
        body: 'Menší firma často nepotřebuje nový systém. Stačí odstranit opakované přepisování, ztracené zprávy a nejasné další kroky.',
        points: ['méně ručních chyb', 'rychlejší třídění', 'levnější provoz než velký interní systém'],
      },
      {
        title: 'Co se ověřuje před spuštěním',
        body: 'Nejdřív se mapuje proces, chybové stavy a ruční záloha. Automatizovat slepě je drahé a rizikové.',
        points: ['vstupy a výstupy', 'chybové cesty', 'ruční override'],
      },
    ],
    safetyNotes: [
      'Demo samo neposílá data třetím stranám.',
      'Citlivé údaje patří až do bezpečné domluvy, ne do veřejné ukázky.',
      'Automatizace musí mít viditelnou ruční zálohu, když pravidlo nestačí.',
    ],
    outOfScope: ['skryté profilování návštěvníků', 'odesílání bez potvrzení', 'převzetí odpovědnosti za odborná rozhodnutí'],
    proofTags: ['kontrola polí', 'méně ručních chyb', 'úspora peněz', 'ochrana dat'],
  },
  {
    slug: 'nabidka-eshop',
    title: 'Nabídka a e-shop bez zbytečného tření | Radeq.cz',
    description:
      'Ukázka zpřehlednění produktů, balíčků nebo služeb bez plateb, závazné objednávky a falešných obchodních slibů.',
    h1: 'Nabídka, která zkracuje rozhodování',
    eyebrow: 'Nabídka / e-shop',
    summary:
      'Ukázka vysvětluje, jak srovnat produkty, balíčky nebo služby tak, aby zákazník rychle pochopil rozdíl a bezpečně přešel k poptávce. Není to platební ani objednávkový systém.',
    promise: 'Jasnější výběr, méně dotazů na základní rozdíly a kratší cesta k poptávce.',
    primaryCta: { label: 'Zpřehlednit nabídku', href: '#terminal' },
    secondaryCta: { label: 'Otevřít starší demo nabídky', href: '/demo/eshop-offers/' },
    sections: [
      {
        title: 'Co ukázka řeší',
        body: 'Když nabídka vypadá stejně nebo zahlceně, zákazník odkládá rozhodnutí. Struktura mu má ukázat rozdíl mezi variantami.',
        points: ['méně zahlcení', 'jasné porovnání', 'viditelná další akce'],
      },
      {
        title: 'Bezpečný rozsah',
        body: 'Tato ukázka nic neprodává, nepočítá dopravu a nepřijímá platební údaje. Slouží k návrhu poptávkové cesty.',
        points: ['bez platby', 'bez závazné objednávky', 'bez fakturačních údajů'],
      },
      {
        title: 'Kde šetří čas a peníze',
        body: 'Srozumitelná nabídka snižuje počet vysvětlujících e-mailů a pomáhá poznat, o jakou variantu má zákazník zájem.',
        points: ['méně opakovaných dotazů', 'rychlejší výběr varianty', 'lepší zadání pro poptávku'],
      },
      {
        title: 'Co se dá měřit opatrně',
        body: 'Měření má pomáhat zlepšit nabídku, ne sbírat zbytečná osobní data.',
        points: ['zájem o varianty', 'slabá místa nabídky', 'opatrné vyhodnocení bez obsahu zpráv'],
      },
    ],
    safetyNotes: [
      'Ukázka není závazná objednávka.',
      'Nezadávají se platební, doručovací ani fakturační údaje.',
      'Poptávka se řeší až vědomým kontaktem přes formulář.',
    ],
    outOfScope: ['platební brána', 'skladové napojení', 'garance prodeje'],
    proofTags: ['jasná nabídka', 'bez platby', 'kratší rozhodnutí', 'úspora času'],
  },
] as const satisfies readonly ShowcaseExample[];

export function getShowcaseExample(slug: string): ShowcaseExample | undefined {
  return showcaseExamples.find((example) => example.slug === slug);
}
```

- [ ] **Step 4: Run test and verify it passes**

Run:

```powershell
npm.cmd test -- tests/showcase-examples.test.ts
```

Expected: PASS.

---

### Task 3: Make Alternate Hreflang Optional For Czech-Only Showcase Pages

**Files:**
- Modify: `C:\Users\sirok\Documents\Projects\radeq\src\layouts\BaseLayout.astro`
- Test later in: `C:\Users\sirok\Documents\Projects\radeq\tests\showcase-examples.spec.ts`

- [ ] **Step 1: Update `BaseLayout` props**

Change the props interface so `alternatePath` and `alternateLang` are optional:

```ts
interface Props {
  title: string;
  description: string;
  lang: Locale;
  alternatePath?: string;
  alternateLang?: Locale;
  allowStoredStyle?: boolean;
}
```

- [ ] **Step 2: Render alternate only when both values exist**

Replace the current unconditional `alternateHref` and `alternateUrl` logic with guarded values:

```ts
const { title, description, lang, alternatePath, alternateLang, allowStoredStyle = false } = Astro.props;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const siteUrl = Astro.site ?? new URL(Astro.url.origin);
const canonicalUrl = new URL(Astro.url.pathname, siteUrl).toString();
const alternateHref = alternatePath ? `${basePath}${alternatePath}` : undefined;
const alternateUrl = alternateHref ? new URL(alternateHref, siteUrl).toString() : undefined;
```

Change the head alternate link to:

```astro
{alternateLang && alternateUrl ? <link rel="alternate" hreflang={alternateLang} href={alternateUrl} /> : null}
```

- [ ] **Step 3: Run existing i18n smoke check**

Run:

```powershell
npm.cmd run test:e2e -- tests/i18n.spec.ts
```

Expected: PASS. Existing `/` and `/en/` pages still expose alternate links.

---

### Task 4: Add Rule-Based Chatbot Data And Integrity Tests

**Files:**
- Create: `C:\Users\sirok\Documents\Projects\radeq\src\data\chatbotGuide.ts`
- Create: `C:\Users\sirok\Documents\Projects\radeq\tests\chatbot-guide.test.ts`

- [ ] **Step 1: Write failing decision-tree test**

Create `tests/chatbot-guide.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { chatbotGuide } from '../src/data/chatbotGuide';

describe('chatbot guide data', () => {
  it('has valid start and fallback nodes', () => {
    expect(chatbotGuide.nodes[chatbotGuide.startId]).toBeDefined();
    expect(chatbotGuide.nodes[chatbotGuide.fallbackId]).toBeDefined();
  });

  it('keeps every option connected to an existing node', () => {
    for (const node of Object.values(chatbotGuide.nodes)) {
      if (node.type === 'question') {
        expect(node.options?.length).toBeGreaterThan(0);
      }

      for (const option of node.options ?? []) {
        expect(chatbotGuide.nodes[option.nextId]).toBeDefined();
      }
    }
  });

  it('keeps result nodes useful and bounded', () => {
    const resultNodes = Object.values(chatbotGuide.nodes).filter((node) => node.type === 'result');
    expect(resultNodes.length).toBeGreaterThanOrEqual(5);

    for (const node of resultNodes) {
      expect(node.result?.recommendedService).toBeTruthy();
      expect(node.result?.nextSteps.length).toBeGreaterThanOrEqual(2);
      expect(node.result?.nextSteps.length).toBeLessThanOrEqual(4);
      expect(['high', 'medium', 'low']).toContain(node.result?.confidence);
    }
  });

  it('does not define network, model, storage, or tracking behavior', () => {
    const text = JSON.stringify(chatbotGuide).toLowerCase();
    const forbidden = ['fetch(', 'websocket', 'openai', 'anthropic', 'gemini', 'rag', 'llm', 'localstorage', 'analytics'];

    for (const fragment of forbidden) {
      expect(text).not.toContain(fragment);
    }
  });
});
```

- [ ] **Step 2: Run test and verify it fails for missing data**

Run:

```powershell
npm.cmd test -- tests/chatbot-guide.test.ts
```

Expected: FAIL because `src/data/chatbotGuide.ts` does not exist.

- [ ] **Step 3: Add the guide types and data**

Create `src/data/chatbotGuide.ts` with:

```ts
export type ChatbotNodeType = 'question' | 'result' | 'handoff';

export interface ChatbotOption {
  id: string;
  label: string;
  nextId: string;
}

export interface ChatbotResult {
  title: string;
  summary: string;
  recommendedService: string;
  nextSteps: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ChatbotNode {
  id: string;
  type: ChatbotNodeType;
  title: string;
  body: string;
  options?: ChatbotOption[];
  result?: ChatbotResult;
}

export interface ChatbotGuideData {
  startId: string;
  fallbackId: string;
  resetLabel: string;
  backLabel: string;
  handoffLabel: string;
  handoffIntro: string;
  nodes: Record<string, ChatbotNode>;
}

export const chatbotGuide = {
  startId: 'start',
  fallbackId: 'fallback',
  resetLabel: 'Začít znovu',
  backLabel: 'Zpět',
  handoffLabel: 'Ukázat bezpečné předání',
  handoffIntro:
    'Shrnutí se nikam neposílá automaticky. Pokud chcete pokračovat, zkopírujte výsledek do poptávky nebo napište vlastními slovy do kontaktního formuláře.',
  nodes: {
    start: {
      id: 'start',
      type: 'question',
      title: 'S čím chcete návštěvníkovi pomoct?',
      body: 'Vyberte nejbližší situaci. Průvodce používá jen připravené odpovědi a volby.',
      options: [
        { id: 'new-site', label: 'Nevím, jestli potřebuji nový web nebo audit', nextId: 'website-state' },
        { id: 'requests', label: 'Opakují se stejné dotazy nebo poptávky', nextId: 'request-load' },
        { id: 'offer', label: 'Zákazníci se ztrácí v nabídce', nextId: 'offer-state' },
        { id: 'unsure', label: 'Nevím, potřebuji poradit', nextId: 'result-audit' },
      ],
    },
    'website-state': {
      id: 'website-state',
      type: 'question',
      title: 'Jaký je stav současného webu?',
      body: 'Stačí obecná odpověď. Neposílejte přístupy ani interní dokumenty.',
      options: [
        { id: 'none', label: 'Web nemáme nebo je velmi zastaralý', nextId: 'result-new-web' },
        { id: 'weak', label: 'Web existuje, ale nepomáhá poptávkám', nextId: 'result-redesign' },
        { id: 'unknown', label: 'Nevíme, co je největší problém', nextId: 'result-audit' },
      ],
    },
    'request-load': {
      id: 'request-load',
      type: 'question',
      title: 'Kde vzniká nejvíc ruční práce?',
      body: 'Cílem je najít první malou automatizaci, ne stavět velký systém.',
      options: [
        { id: 'sorting', label: 'Třídění poptávek a odpovědi', nextId: 'result-chatbot' },
        { id: 'copying', label: 'Přepisování z formulářů do tabulek', nextId: 'result-automation' },
        { id: 'unclear', label: 'Není jasné, kdo má další krok', nextId: 'result-automation' },
      ],
    },
    'offer-state': {
      id: 'offer-state',
      type: 'question',
      title: 'Co je na nabídce nejasné?',
      body: 'Tato větev neřeší platby ani závaznou objednávku. Jen strukturu nabídky a poptávkovou cestu.',
      options: [
        { id: 'variants', label: 'Varianty nejdou snadno porovnat', nextId: 'result-offer' },
        { id: 'packages', label: 'Balíčky nebo služby nejsou jasně popsané', nextId: 'result-offer' },
        { id: 'measurement', label: 'Nevíme, o co je zájem', nextId: 'result-offer' },
      ],
    },
    'result-new-web': {
      id: 'result-new-web',
      type: 'result',
      title: 'Dává smysl začít strukturou nového webu',
      body: 'Když web chybí nebo je příliš starý, bývá levnější připravit čistý základ než opravovat každý detail zvlášť.',
      result: {
        title: 'Nový web',
        summary: 'Začal bych cílem, strukturou, texty a poptávkovou cestou.',
        recommendedService: 'Startovací firemní web',
        nextSteps: ['popsat hlavní nabídku', 'určit cílového zákazníka', 'sepsat 3-5 hlavních sekcí'],
        confidence: 'medium',
      },
    },
    'result-redesign': {
      id: 'result-redesign',
      type: 'result',
      title: 'Dává smysl redesign nebo audit současného webu',
      body: 'Když web existuje, nejdřív je potřeba oddělit slabý obsah, technické chyby a špatnou cestu ke kontaktu.',
      result: {
        title: 'Redesign nebo audit',
        summary: 'Nejdřív ověřit, co zachovat, co opravit a co přestavět.',
        recommendedService: 'Redesign staršího webu nebo audit webu s plánem',
        nextSteps: ['poslat URL webu', 'popsat hlavní problém', 'vybrat prioritní cíl'],
        confidence: 'medium',
      },
    },
    'result-audit': {
      id: 'result-audit',
      type: 'result',
      title: 'Nejbezpečnější je krátký audit',
      body: 'Když není jasné, co bolí nejvíc, audit zabrání drahé slepé implementaci.',
      result: {
        title: 'Audit webu s plánem',
        summary: 'Výstupem má být krátký seznam priorit a rozhodnutí, jestli stačí oprava nebo je lepší nový základ.',
        recommendedService: 'Audit webu s plánem',
        nextSteps: ['poslat veřejnou URL', 'neposílat přístupy', 'popsat, co má web přinést'],
        confidence: 'high',
      },
    },
    'result-chatbot': {
      id: 'result-chatbot',
      type: 'result',
      title: 'Pomůže statický chatbot nebo FAQ průvodce',
      body: 'Pro opakované otázky stačí často připravené odpovědi a jasné předání člověku.',
      result: {
        title: 'Statický chatbot',
        summary: 'Průvodce může třídit dotazy, vysvětlit nabídku a nasměrovat člověka na správný kontakt.',
        recommendedService: 'Chatbot a průvodce bez modelového generování',
        nextSteps: ['sepsat časté otázky', 'schválit odpovědi', 'určit, kdy předat člověku'],
        confidence: 'high',
      },
    },
    'result-automation': {
      id: 'result-automation',
      type: 'result',
      title: 'Pomůže malá automatizace poptávek',
      body: 'Nejdřív se mapuje proces, ruční výjimky a chybové stavy. Teprve potom se zapojují nástroje.',
      result: {
        title: 'Automatizace poptávek',
        summary: 'Cílem je méně přepisování, méně ztracených dotazů a lepší přehled o dalším kroku.',
        recommendedService: 'Formuláře, data a jednoduchá automatizace',
        nextSteps: ['popsat současný proces', 'vypsat opakované kroky', 'určit ruční zálohu'],
        confidence: 'medium',
      },
    },
    'result-offer': {
      id: 'result-offer',
      type: 'result',
      title: 'Pomůže zpřehlednit nabídku',
      body: 'Když zákazník rychle pochopí varianty, klesá počet vysvětlujících dotazů.',
      result: {
        title: 'Nabídka / e-shop',
        summary: 'Ukázka směřuje k jasné poptávce, ne k platbě nebo závazné objednávce.',
        recommendedService: 'Zpřehlednění nabídky nebo e-shop úprava',
        nextSteps: ['sepsat varianty', 'označit rozdíly', 'vybrat hlavní akci'],
        confidence: 'medium',
      },
    },
    fallback: {
      id: 'fallback',
      type: 'result',
      title: 'Tahle větev nemá přesnou odpověď',
      body: 'Průvodce je záměrně omezený. Když si není jistý, má říct, že je potřeba lidské posouzení.',
      result: {
        title: 'Krátká konzultace',
        summary: 'Nejasné nebo citlivé případy patří do ruční domluvy, ne do veřejné ukázky.',
        recommendedService: 'Úvodní posouzení',
        nextSteps: ['popsat situaci obecně', 'neposílat citlivé údaje', 'domluvit další krok'],
        confidence: 'low',
      },
    },
  },
} as const satisfies ChatbotGuideData;
```

- [ ] **Step 4: Run test and verify it passes**

Run:

```powershell
npm.cmd test -- tests/chatbot-guide.test.ts
```

Expected: PASS.

---

### Task 5: Build The Rule Chatbot React Island

**Files:**
- Create: `C:\Users\sirok\Documents\Projects\radeq\src\components\RuleChatbotGuide.tsx`
- Uses: `C:\Users\sirok\Documents\Projects\radeq\src\data\chatbotGuide.ts`

- [ ] **Step 1: Create component with local-only state**

Create `src/components/RuleChatbotGuide.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { ChatbotGuideData, ChatbotNode } from '../data/chatbotGuide';

interface Props {
  guide: ChatbotGuideData;
}

interface SelectedAnswer {
  question: string;
  answer: string;
}

export default function RuleChatbotGuide({ guide }: Props) {
  const [currentNodeId, setCurrentNodeId] = useState(guide.startId);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswer[]>([]);
  const [handoffOpen, setHandoffOpen] = useState(false);

  const currentNode = guide.nodes[currentNodeId] ?? guide.nodes[guide.fallbackId];
  const resultSummary = useMemo(() => buildSummary(currentNode, selectedAnswers), [currentNode, selectedAnswers]);

  function chooseOption(nextId: string, label: string) {
    const nextNode = guide.nodes[nextId] ? nextId : guide.fallbackId;
    setHistory((items) => [...items, currentNode.id]);
    setSelectedAnswers((items) => [...items, { question: currentNode.title, answer: label }]);
    setCurrentNodeId(nextNode);
    setHandoffOpen(false);
  }

  function goBack() {
    setHistory((items) => {
      const nextHistory = [...items];
      const previous = nextHistory.pop();
      if (previous) {
        setCurrentNodeId(previous);
        setSelectedAnswers((answers) => answers.slice(0, -1));
      }
      return nextHistory;
    });
    setHandoffOpen(false);
  }

  function reset() {
    setCurrentNodeId(guide.startId);
    setHistory([]);
    setSelectedAnswers([]);
    setHandoffOpen(false);
  }

  return (
    <section className="rule-chatbot" aria-labelledby="rule-chatbot-title">
      <div className="rule-chatbot__panel">
        <p className="section-code">Statický průvodce</p>
        <h2 id="rule-chatbot-title">{currentNode.title}</h2>
        <p>{currentNode.body}</p>

        {currentNode.type === 'question' ? (
          <div className="rule-chatbot__options" aria-label="Možnosti průvodce">
            {currentNode.options?.map((option) => (
              <button key={option.id} type="button" onClick={() => chooseOption(option.nextId, option.label)}>
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rule-chatbot__result" aria-live="polite">
            <h3>{currentNode.result?.title}</h3>
            <p>{currentNode.result?.summary}</p>
            <dl>
              <div>
                <dt>Doporučená cesta</dt>
                <dd>{currentNode.result?.recommendedService}</dd>
              </div>
              <div>
                <dt>Jistota ukázky</dt>
                <dd>{confidenceLabel(currentNode.result?.confidence)}</dd>
              </div>
            </dl>
            <ul>
              {currentNode.result?.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <button type="button" className="rule-chatbot__handoff-trigger" onClick={() => setHandoffOpen((open) => !open)}>
              {guide.handoffLabel}
            </button>
          </div>
        )}

        {handoffOpen ? (
          <div className="rule-chatbot__handoff" aria-live="polite">
            <h3>Bezpečné předání</h3>
            <p>{guide.handoffIntro}</p>
            <pre>{resultSummary}</pre>
            <a className="button-primary" href="#terminal">
              Přejít na poptávku
            </a>
          </div>
        ) : null}

        <div className="rule-chatbot__controls">
          <button type="button" onClick={goBack} disabled={history.length === 0}>
            {guide.backLabel}
          </button>
          <button type="button" onClick={reset}>
            {guide.resetLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function buildSummary(currentNode: ChatbotNode, answers: SelectedAnswer[]) {
  const selected = answers.map((item) => `- ${item.question}: ${item.answer}`).join('\n') || '- Bez vybraných odpovědí';
  const result = currentNode.result
    ? `Výsledek: ${currentNode.result.title}\nDoporučená cesta: ${currentNode.result.recommendedService}`
    : `Aktuální krok: ${currentNode.title}`;

  return `${selected}\n${result}`;
}

function confidenceLabel(confidence: 'high' | 'medium' | 'low' | undefined) {
  if (confidence === 'high') return 'vysoká pro tuto ukázku';
  if (confidence === 'medium') return 'orientační';
  return 'nízká, vhodné probrat ručně';
}
```

- [ ] **Step 2: Verify no network primitives are introduced**

Run:

```powershell
rg -n "fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navigator.sendBeacon|analytics" src\components\RuleChatbotGuide.tsx src\data\chatbotGuide.ts
```

Expected: no matches. If any match appears, stop and remove the behavior or request owner approval.

---

### Task 6: Add Static Showcase Routes

**Files:**
- Create: `C:\Users\sirok\Documents\Projects\radeq\src\pages\ukazky\index.astro`
- Create: `C:\Users\sirok\Documents\Projects\radeq\src\pages\ukazky\[example].astro`

- [ ] **Step 1: Create `/ukazky/` hub**

Create `src/pages/ukazky/index.astro` using `BaseLayout`, `CommandHeader`, `ContactTerminal`, `showcaseHub`, and `showcaseExamples`.

Required page structure:

```astro
---
import CommandHeader from '../../components/CommandHeader.astro';
import ContactTerminal from '../../components/ContactTerminal';
import { siteContent } from '../../data/siteContent';
import { showcaseExamples, showcaseHub } from '../../data/showcaseExamples';
import BaseLayout from '../../layouts/BaseLayout.astro';

const content = siteContent.cs;
---

<BaseLayout title={showcaseHub.title} description={showcaseHub.description} lang={content.layout.lang}>
  <CommandHeader content={content.header} alternatePath={content.layout.alternatePath} alternateLabel={content.layout.alternateLabel} locale={content.layout.lang} showStyleToggle={false} />
  <main>
    <section class="showcase-hero" id="top" aria-labelledby="showcase-title">
      <p class="section-code">Ukázky</p>
      <h1 id="showcase-title">{showcaseHub.h1}</h1>
      <p>{showcaseHub.summary}</p>
    </section>
    <section class="showcase-grid-section" aria-label="Přehled ukázek">
      <div class="showcase-card-grid">
        {showcaseExamples.map((example) => (
          <article class="showcase-card">
            <p class="section-code">{example.eyebrow}</p>
            <h2>{example.h1}</h2>
            <p>{example.promise}</p>
            <ul>{example.proofTags.map((tag) => <li>{tag}</li>)}</ul>
            <a class="button-secondary" href={`/ukazky/${example.slug}/`}>Otevřít ukázku</a>
          </article>
        ))}
      </div>
    </section>
    <ContactTerminal locale={content.layout.lang} content={content.terminal} client:load />
  </main>
</BaseLayout>
```

- [ ] **Step 2: Create generated detail route**

Create `src/pages/ukazky/[example].astro`:

```astro
---
import CommandHeader from '../../components/CommandHeader.astro';
import ContactTerminal from '../../components/ContactTerminal';
import RuleChatbotGuide from '../../components/RuleChatbotGuide';
import { chatbotGuide } from '../../data/chatbotGuide';
import { siteContent } from '../../data/siteContent';
import { getShowcaseExample, showcaseExamples, type ShowcaseSlug } from '../../data/showcaseExamples';
import BaseLayout from '../../layouts/BaseLayout.astro';

export function getStaticPaths() {
  return showcaseExamples.map((example) => ({
    params: { example: example.slug },
    props: { slug: example.slug },
  }));
}

const { slug } = Astro.props as { slug: ShowcaseSlug };
const example = getShowcaseExample(slug);
const content = siteContent.cs;

if (!example) {
  throw new Error(`Unknown showcase example: ${slug}`);
}
---

<BaseLayout title={example.title} description={example.description} lang={content.layout.lang}>
  <CommandHeader content={content.header} alternatePath={content.layout.alternatePath} alternateLabel={content.layout.alternateLabel} locale={content.layout.lang} showStyleToggle={false} />
  <main>
    <section class="showcase-hero" id="top" aria-labelledby="showcase-detail-title">
      <p class="section-code">{example.eyebrow}</p>
      <h1 id="showcase-detail-title">{example.h1}</h1>
      <p>{example.summary}</p>
      <div class="showcase-hero__actions">
        <a class="button-primary" href={example.primaryCta.href}>{example.primaryCta.label}</a>
        {example.secondaryCta ? <a class="button-secondary" href={example.secondaryCta.href}>{example.secondaryCta.label}</a> : null}
      </div>
    </section>

    <section class="showcase-safety" aria-labelledby="showcase-safety-title">
      <h2 id="showcase-safety-title">Bezpečnost a hranice ukázky</h2>
      <ul>{example.safetyNotes.map((note) => <li>{note}</li>)}</ul>
    </section>

    {slug === 'chatbot' ? <RuleChatbotGuide guide={chatbotGuide} client:load /> : null}

    <section class="showcase-sections" aria-label="Popis ukázky">
      {example.sections.map((section) => (
        <article class="showcase-section-card">
          <h2>{section.title}</h2>
          <p>{section.body}</p>
          <ul>{section.points.map((point) => <li>{point}</li>)}</ul>
        </article>
      ))}
    </section>

    <section class="showcase-out-of-scope" aria-labelledby="showcase-out-of-scope-title">
      <h2 id="showcase-out-of-scope-title">Co tato ukázka neslibuje</h2>
      <ul>{example.outOfScope.map((item) => <li>{item}</li>)}</ul>
    </section>

    <ContactTerminal locale={content.layout.lang} content={content.terminal} client:load />
  </main>
</BaseLayout>
```

- [ ] **Step 3: Build once to catch Astro syntax**

Run:

```powershell
npm.cmd run build
```

Expected: PASS. Stop on any Astro or TypeScript error.

---

### Task 7: Add Styles Without Reusing Demo Matrix State

**Files:**
- Modify: `C:\Users\sirok\Documents\Projects\radeq\src\styles\global.css`

- [ ] **Step 1: Add showcase layout styles near existing route sections**

Add CSS selectors for:

```css
.showcase-hero
.showcase-hero__actions
.showcase-grid-section
.showcase-card-grid
.showcase-card
.showcase-safety
.showcase-sections
.showcase-section-card
.showcase-out-of-scope
.rule-chatbot
.rule-chatbot__panel
.rule-chatbot__options
.rule-chatbot__result
.rule-chatbot__handoff
.rule-chatbot__controls
```

Use existing tokens such as `--color-surface`, `--color-border`, `--color-text`, `--color-muted`, and existing button classes. Do not add new global style variant selectors for `html[data-style="variant-b"]`, `variant-c`, or `variant-d`.

- [ ] **Step 2: Add mobile rules**

Add mobile rules in the existing responsive section so `.showcase-card-grid`, `.showcase-sections`, and `.rule-chatbot__options` collapse to one column at `max-width: 760px`.

- [ ] **Step 3: Check no A/B/C/D selectors were added**

Run:

```powershell
rg -n "showcase|rule-chatbot|variant-b|variant-c|variant-d" src\styles\global.css
```

Expected: showcase selectors exist; no new showcase-specific variant selectors exist. If style variants are added for `/ukazky`, stop and ask owner.

---

### Task 8: Add Sitemap Entries And SEO Tests

**Files:**
- Modify: `C:\Users\sirok\Documents\Projects\radeq\src\pages\sitemap.xml.ts`
- Modify: `C:\Users\sirok\Documents\Projects\radeq\tests\smoke.spec.ts` or create route checks in `tests\showcase-examples.spec.ts`

- [ ] **Step 1: Add showcase paths to sitemap**

In `src/pages/sitemap.xml.ts`, import `showcaseExamples`:

```ts
import { showcaseExamples } from '../data/showcaseExamples';
```

Add paths:

```ts
const showcasePaths = ['/ukazky/', ...showcaseExamples.map((example) => `/ukazky/${example.slug}/`)];
```

Include `...showcasePaths` in the `paths` array after `/en/` and before `/demo/*`.

- [ ] **Step 2: Add sitemap assertion**

In the relevant Playwright test, assert:

```ts
expect(sitemapText).toContain('<loc>https://radeq.cz/ukazky/</loc>');
expect(sitemapText).toContain('<loc>https://radeq.cz/ukazky/chatbot/</loc>');
expect(sitemapText).toContain('<loc>https://radeq.cz/ukazky/automatizace/</loc>');
expect(sitemapText).toContain('<loc>https://radeq.cz/ukazky/nabidka-eshop/</loc>');
```

- [ ] **Step 3: Run SEO/indexability test**

Run:

```powershell
npm.cmd run test:e2e -- tests/smoke.spec.ts
```

Expected: PASS or only a failure in a not-yet-written showcase assertion. Fix local test implementation; do not remove existing sitemap checks.

---

### Task 9: Add Showcase E2E Coverage

**Files:**
- Create: `C:\Users\sirok\Documents\Projects\radeq\tests\showcase-examples.spec.ts`

- [ ] **Step 1: Add Playwright route and SEO test**

Create `tests/showcase-examples.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

const showcaseRoutes = [
  { path: '/ukazky/', heading: 'Ukázky praktických řešení pro web, poptávky a ruční práci' },
  { path: '/ukazky/chatbot/', heading: 'Chatbot, který odpovídá jen z připravených pravidel' },
  { path: '/ukazky/automatizace/', heading: 'Automatizace, která ubere ruční přepisování' },
  { path: '/ukazky/nabidka-eshop/', heading: 'Nabídka, která zkracuje rozhodování' },
];

test('showcase pages are static-readable and SEO-indexable', async ({ page }) => {
  for (const route of showcaseRoutes) {
    await page.goto(route.path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `https://radeq.cz${route.path}`);
    await expect(page.locator('head link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
    await expect(page.locator('.style-toggle')).toHaveCount(0);
    await expect(page.locator('#matrix')).toHaveCount(0);
    await expect(page.getByText(/bez klientských dat|schválené|statický/i)).toBeVisible();
  }
});

test('stored demo style does not affect showcase pages', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('radeq-style-variant', 'variant-d');
  });

  await page.goto('/ukazky/chatbot/');
  await expect(page.locator('html')).toHaveAttribute('data-style', 'variant-a');
  await expect(page.locator('html')).toHaveAttribute('data-style-source', 'fixed');
  await expect(page.locator('.style-toggle')).toHaveCount(0);
});

test('chatbot guide is rule-based and does not submit data before handoff', async ({ page }) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/leads')) {
      apiRequests.push(request.url());
    }
  });

  await page.goto('/ukazky/chatbot/');
  await expect(page.getByText('Statický průvodce')).toBeVisible();
  await expect(page.locator('textarea')).toHaveCount(1);
  await expect(page.locator('.rule-chatbot textarea')).toHaveCount(0);
  await expect(page.locator('.rule-chatbot input')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Opakují se stejné dotazy nebo poptávky' })).toBeVisible();
  await page.getByRole('button', { name: 'Opakují se stejné dotazy nebo poptávky' }).click();
  await page.getByRole('button', { name: 'Třídění poptávek a odpovědi' }).click();
  await expect(page.getByRole('heading', { name: 'Pomůže statický chatbot nebo FAQ průvodce' })).toBeVisible();
  expect(apiRequests).toHaveLength(0);
  await page.getByRole('button', { name: 'Ukázat bezpečné předání' }).click();
  await expect(page.getByText('Shrnutí se nikam neposílá automaticky.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Přejít na poptávku' })).toHaveAttribute('href', '#terminal');
  expect(apiRequests).toHaveLength(0);
});

test('showcase pages avoid payment and sensitive-data prompts', async ({ page }) => {
  const forbiddenVisibleText = [/platební karta/i, /rodné číslo/i, /api klíč/i, /heslo/i, /zadejte přístup/i];

  for (const route of showcaseRoutes) {
    await page.goto(route.path);
    for (const pattern of forbiddenVisibleText) {
      await expect(page.getByText(pattern)).toHaveCount(0);
    }
  }

  await page.goto('/ukazky/nabidka-eshop/');
  await expect(page.getByText('není závazná objednávka')).toBeVisible();
  await expect(page.getByText('Nezadávají se platební')).toBeVisible();
});

test('showcase pages fit mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 920 });

  for (const route of showcaseRoutes) {
    await page.goto(route.path);
    const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(hasOverflow).toBe(false);
  }
});
```

- [ ] **Step 2: Run showcase E2E test**

Run:

```powershell
npm.cmd run test:e2e -- tests/showcase-examples.spec.ts
```

Expected: PASS after route, styles, and component are implemented. If the textarea count fails because `ContactTerminal` is present, keep the scoped `.rule-chatbot textarea` assertion and adjust only the unscoped assertion to match actual page composition.

---

### Task 10: Owner-Gated Header Navigation And Contact Options

**Files:**
- Modify only if owner approved: `C:\Users\sirok\Documents\Projects\radeq\src\data\siteContent.ts`
- Tests if modified: `C:\Users\sirok\Documents\Projects\radeq\tests\i18n-content.test.ts`, `C:\Users\sirok\Documents\Projects\radeq\tests\smoke.spec.ts`

- [ ] **Step 1: If owner approved header discoverability, update Czech nav**

Change Czech `header.navItems` from:

```ts
[
  { href: '#services', label: 'Weby' },
  { href: '#pricing', label: 'Ceny' },
  { href: '#about', label: 'O nás' },
  { href: '#terminal', label: 'Poptávka' },
]
```

to:

```ts
[
  { href: '#services', label: 'Weby' },
  { href: '/ukazky/', label: 'Ukázky' },
  { href: '#pricing', label: 'Ceny' },
  { href: '#about', label: 'O nás' },
  { href: '#terminal', label: 'Poptávka' },
]
```

Do not add English nav until English pages exist.

- [ ] **Step 2: Update content contract test**

If nav is changed, update `tests/i18n-content.test.ts` to expect Czech nav length 5 and English nav length 4:

```ts
expect(siteContent.cs.header.navItems).toHaveLength(5);
expect(siteContent.en.header.navItems).toHaveLength(4);
expect(siteContent.cs.header.navItems.some((item) => item.href === '/ukazky/' && item.label === 'Ukázky')).toBe(true);
```

- [ ] **Step 3: Update homepage smoke test**

If nav is changed, add:

```ts
await expect(page.getByRole('link', { name: 'Ukázky' })).toHaveAttribute('href', '/ukazky/');
await expect(page.locator('main a[href*="/ukazky/"]')).toHaveCount(0);
```

This preserves the rule that the main homepage content does not become a demo menu.

- [ ] **Step 4: Contact form project options**

Only if owner approved new project options, add these to Czech `terminal.projectOptions`:

```ts
'Jednoduchý chatbot / průvodce',
'Automatizace poptávek',
'Nabídka / e-shop úprava',
```

Do not remove existing options. Add an `i18n-content.test.ts` assertion that these strings exist.

---

### Task 11: Full Verification

**Files:**
- No new files unless fixing test failures.

- [ ] **Step 1: Typecheck**

Run:

```powershell
npm.cmd run typecheck
```

Expected: PASS. Stop and fix any Astro/TypeScript issue.

- [ ] **Step 2: Unit tests**

Run:

```powershell
npm.cmd test
```

Expected: PASS. Stop and fix any data, parser, or content contract issue.

- [ ] **Step 3: Static build**

Run:

```powershell
npm.cmd run build
```

Expected: PASS. The build must include static HTML for `/ukazky/` and each detail route.

- [ ] **Step 4: GitHub Pages build**

Run:

```powershell
$env:DEPLOY_TARGET='github-pages'; npm.cmd run build
```

Expected: PASS. Links must respect Astro base behavior.

- [ ] **Step 5: E2E tests**

Run:

```powershell
npm.cmd run test:e2e
```

Expected: PASS. Existing homepage, `/demo`, i18n, SEO, mobile, and new `/ukazky` tests must all pass.

- [ ] **Step 6: Diff whitespace check**

Run:

```powershell
git diff --check
```

Expected: PASS except pre-existing CRLF conversion notices if Git reports them without whitespace errors.

- [ ] **Step 7: Manual browser checks**

Run local dev server:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:4321/
http://127.0.0.1:4321/ukazky/
http://127.0.0.1:4321/ukazky/chatbot/
http://127.0.0.1:4321/ukazky/automatizace/
http://127.0.0.1:4321/ukazky/nabidka-eshop/
```

Check desktop and 390 px mobile:

- no horizontal overflow,
- no visible A/B/C/D style toggle,
- no broken text wrapping in buttons,
- chatbot choices work,
- handoff panel does not submit data,
- page copy clearly says public-safe/static/prepared answers,
- homepage primary CTA still points to `#terminal`.

---

### Task 12: Preview, Logging, And Evaluation

**Files:**
- Modify: `C:\Programování\Codex\docs\projects\radeq\work-log.md`
- Create: `C:\Programování\Codex\model-output-evals\records\YYYY-MM-DD-radeq-static-ukazky-implementation.json`
- Modify only if project mesh topology changes: `C:\Programování\Codex\docs\projects\radeq\decision-mesh\`

- [ ] **Step 1: Owner gate before remote mutation**

Do not push, deploy, merge, or modify Cloudflare/GitHub settings until owner approves the preview target.

Recommended preview path:

```text
GitHub Pages preview from codex/radeq-static-ukazky, same pattern as the current brainstorm preview.
```

- [ ] **Step 2: Log implementation evidence**

Add a work-log entry with:

- branch and commit,
- files changed,
- verification commands and results,
- preview URL if pushed,
- owner decisions taken,
- known limitations,
- rollback path.

- [ ] **Step 3: Add model-output eval**

Add a redacted eval record scoring the planning/implementation output on:

- task fit,
- instruction following,
- source grounding,
- format contract,
- verification readiness,
- privacy safety,
- handoff clarity,
- token efficiency,
- workflow compatibility.

- [ ] **Step 4: Validate Autopilot records**

Run from `C:\Programování\Codex`:

```powershell
npm.cmd run model-output:validate
git diff --check -- docs/projects/radeq/work-log.md model-output-evals/records
```

Expected: PASS.

---

## Parallelization Plan

Safe parallel work after owner gates:

- Agent A: `src/data/showcaseExamples.ts` and `tests/showcase-examples.test.ts`.
- Agent B: `src/data/chatbotGuide.ts`, `src/components/RuleChatbotGuide.tsx`, and `tests/chatbot-guide.test.ts`.
- Agent C: `src/pages/ukazky/index.astro`, `src/pages/ukazky/[example].astro`, and `src/pages/sitemap.xml.ts`.
- Agent D: `tests/showcase-examples.spec.ts` and existing smoke/i18n test updates.

Do not parallelize:

- `src/styles/global.css`, because all pages depend on the same visual layer.
- `src/data/siteContent.ts` nav/contact-option edits, because they depend on owner gates and affect existing tests.
- Remote push/deploy, because it requires one final verified branch state.

## Global Stop Conditions

Stop and fix locally when:

- TypeScript, Astro check, Vitest, Playwright, build, or diff check fails.
- New `/ukazky` pages depend on client-only JS for their primary content.
- `/ukazky` reads or writes `radeq-style-variant`.
- Chatbot code introduces `fetch`, WebSocket, model-provider names, localStorage, analytics, or backend inference.
- Any visible copy implies autonomous AI answers, learning from visitor data, guaranteed results, payment processing, or a real order.
- Any page asks for passwords, access tokens, payment cards, personal customer records, contracts, or private documents.
- Homepage primary CTA stops pointing to `#terminal`, or the homepage main content becomes a demo menu.

Stop for owner decision when:

- Implementation needs English pages.
- Implementation needs `mailto:`, an email provider, analytics, tracking, or `/api/leads` prefill.
- Implementation needs redirecting, hiding, or deleting old `/demo/*` routes.
- Implementation needs payment, checkout, file upload, auth, storage, or a new public API.
- Security copy would make claims stronger than minimization, explicit handoff, prepared answers, no hidden storage, and human review.

## Self-Review

- Spec coverage: covers routes, IA, chatbot, security/data protection, automation/e-shop pages, sitemap, tests, preview, logging, and owner gates.
- Placeholder scan: no incomplete markers, no open-ended delayed-test instruction, and no unspecified provider setup.
- Type consistency: `ShowcaseSlug`, `ShowcaseExample`, `ChatbotGuideData`, and `RuleChatbotGuide` names are consistent across tasks.
- Scope check: payment, upload, auth, analytics, email provider, English pages, and model-backed AI are deliberately outside this slice.
