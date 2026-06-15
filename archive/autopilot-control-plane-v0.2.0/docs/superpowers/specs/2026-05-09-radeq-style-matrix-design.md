# Radeq Style-Matrix Design

Date: 2026-05-09

## Goal

Transform Radeq.cz from a portfolio into a conversion-focused technical showcase that proves speed, SEO discipline, automation skill, and delivery quality through interactive evidence rather than agency-style claims.

## Audience

- Micro-SaaS and tech founders who need landing pages with application-grade performance.
- Expert consultants and personal brands who need prestige without vague agency copy.
- Innovative SMEs replacing outdated operations with lightweight web systems.
- Marketing architects looking for a technical partner for lead-flow structures.

## Direction

The site is a Modern Industrial Command Center:

- true black base
- high-contrast technical typography
- graphite surfaces and thin linework
- acid-lime, cyan, and amber system accents
- metadata strips, coordinates, event logs, and line-art icon language
- no booting intro
- no heavy WebGL
- no generic portfolio gallery as the main story

## Page Architecture

1. Command header with compact navigation and a terminal CTA.
2. Hero with precise positioning, immediate proof framing, and a lightweight interactive Core island.
3. Style-Matrix Simulator that combines module type with visual epoch.
4. Audience routing band that filters recommendations.
5. Live Demo block for SEO Fix Pack.
6. Live Demo block for Webhook Gateway.
7. Performance and build standard proof section.
8. Předávací Standard section showing client handoff quality.
9. Selected Systems section reframing portfolio evidence as operational outcomes.
10. CLI Contact Terminal that turns a visitor into a structured project brief.

## Core Interaction

The Style-Matrix Simulator has four module types:

- Blog / Docs
- Service Landing
- Admin Dashboard
- E-shop / Offers

It has four visual epochs:

- Retro 1996
- Modern Standard
- Cyber/Tech 2036
- Industrial

Selecting a module and epoch updates CSS variables, preview copy, density, icon treatment, motion profile, complexity, and CTA language. The default state is Industrial + Service Landing.

## 3D Island Strategy

The central Core island is progressive enhancement:

- LCP-critical layer is static HTML/CSS/SVG.
- R3F/Three.js island loads only when visible.
- Mobile and reduced-motion users receive a static or CSS/SVG version.
- The WebGL version uses primitive low-poly geometry, no GLTF, no postprocessing, capped DPR, and `frameloop="demand"`.
- WebGL must not be required for core content or conversion.

## Technical Architecture

- Astro static output.
- TypeScript strict mode.
- React islands only where needed: Style-Matrix Simulator, CLI terminal, WebGL Core.
- Tailwind CSS plus runtime CSS custom properties.
- Static JSON content for matrix, demos, handoff, and systems.
- Current Astro transitions use `ClientRouter` from `astro:transitions`.
- No backend in v1 unless contact submission is later connected to a provider.

## Data Contracts

### Style Matrix Entry

```ts
export interface MatrixSelection {
  moduleId: "blog-docs" | "service-landing" | "admin-dashboard" | "eshop-offers";
  epochId: "retro-1996" | "modern" | "cyber-2036" | "industrial";
}

export interface MatrixPreset {
  id: string;
  selection: MatrixSelection;
  title: string;
  summary: string;
  cta: string;
  complexity: "lean" | "balanced" | "advanced";
  tokens: {
    accent: string;
    accent2: string;
    surface: string;
    border: string;
    fontMode: string;
    motion: string;
  };
}
```

### Terminal Brief

```ts
export interface TerminalBrief {
  project_type: string;
  audience: string;
  deadline: string;
  current_url: string;
  budget_range: string;
  message: string;
}
```

## Accessibility Requirements

- Native buttons for all simulator controls.
- Visible focus states on every interactive element.
- Keyboard support for simulator and terminal.
- Live region for simulator preview updates.
- Reduced-motion fallback for transitions, glitch, and WebGL.
- Static text alternative for WebGL Core.
- Contrast must be checked across all matrix styles before production claims.

## Performance Requirements

- LCP must not depend on React or WebGL.
- R3F must be loaded as a visible island, not as global JS.
- Avoid large images in the first viewport.
- No postprocessing, physics, large GLTF, or infinite render loop in v1.
- Lighthouse 100/100 and LCP under 1s are targets until measured.

## Security And Privacy

- CLI terminal is a controlled UI parser, not a shell.
- No `eval`, arbitrary command execution, or unsafe HTML.
- Static demo data only in v1.
- No analytics or third-party scripts unless explicitly approved.
- No secrets in source or docs.

## Acceptance Criteria

- Greenfield Astro site runs locally.
- Style-Matrix changes visible preview and theme variables.
- CLI terminal captures a structured brief locally.
- WebGL Core is optional and has static fallback.
- Main content remains readable with JS disabled.
- Build, typecheck, lint, unit tests, and browser smoke checks are run or honestly reported.
