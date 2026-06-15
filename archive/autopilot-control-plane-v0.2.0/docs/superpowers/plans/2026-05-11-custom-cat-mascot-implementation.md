# Custom Cat Mascot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first custom cat mascot milestone: a generated stylized ginger ghost-rig GLB, runtime rig adapter, preview/default asset selection, and a tested predator/laser motion contract.

**Architecture:** Keep the current mascot renderer, but stop hard-coding Quaternius object names. Add a small rig resolver that maps both the legacy Quaternius names and the new custom rig contract into one runtime shape. Generate a local GLB with smooth named parts first, then make the renderer drive those parts through the same look, pet, jump, and hunt layers.

**Tech Stack:** Astro 6, React 19, Three.js 0.184, Vitest, Playwright, Node 22+, glTF/GLB assets.

---

## File Structure

- Create `src/lib/catRig.ts`: resolves named bones/objects from either legacy Quaternius or custom rig contract.
- Modify `src/lib/catMascot.ts`: add custom asset metadata, asset selection, and predator/hunt pose math.
- Modify `src/components/CoreIsland.tsx`: use asset selection, rig resolver, tail segments, ears, and hunt pose overlay.
- Create `scripts/generate-cat-ghost-rig.mjs`: generates `public/models/cat/radeq-ginger-ghost.glb` with named smooth proxy parts.
- Modify `package.json`: add `models:cat:ghost` script.
- Create `tests/cat-rig.test.ts`: unit tests for rig resolution.
- Modify `tests/cat-mascot.test.ts`: tests asset selection and hunt pose math.
- Modify `tests/smoke.spec.ts`: verify custom asset metadata and hunt QA attributes in browser.

This workspace is not a git repository, so commit steps are replaced with explicit verification checkpoints.

---

### Task 1: Rig Resolver

**Files:**
- Create: `src/lib/catRig.ts`
- Test: `tests/cat-rig.test.ts`

- [ ] **Step 1: Write the failing rig resolver tests**

Create `tests/cat-rig.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Object3D } from 'three';

import { resolveCatRig } from '../src/lib/catRig';

function node(name: string, children: Object3D[] = []) {
  const object = new Object3D();
  object.name = name;
  for (const child of children) object.add(child);
  return object;
}

describe('cat rig resolver', () => {
  it('resolves the custom rig contract', () => {
    const root = node('CatRoot', [
      node('Center_Of_Mass', [
        node('Hips'),
        node('Spine_02'),
        node('Head'),
        node('Ear_L'),
        node('Ear_R'),
        node('Tail_01'),
        node('Tail_02'),
        node('Tail_03'),
        node('FrontLeg_L_Upper'),
        node('FrontLeg_R_Upper'),
        node('BackLeg_L_Upper'),
        node('BackLeg_R_Upper'),
      ]),
    ]);

    const rig = resolveCatRig(root);

    expect(rig.version).toBe('custom-contract-v1');
    expect(rig.quality).toBe('contract');
    expect(rig.head?.name).toBe('Head');
    expect(rig.body?.name).toBe('Spine_02');
    expect(rig.tailSegments.map((part) => part.name)).toEqual(['Tail_01', 'Tail_02', 'Tail_03']);
    expect(rig.ears.left?.name).toBe('Ear_L');
    expect(rig.legs.frontLeft?.name).toBe('FrontLeg_L_Upper');
    expect(rig.missing).not.toContain('Head');
  });

  it('keeps the legacy Quaternius model working', () => {
    const root = node('Scene', [
      node('Body'),
      node('Head'),
      node('Tail'),
      node('FrontLeg.L'),
      node('FrontLeg.R'),
      node('BackLeg.L'),
      node('BackLeg.R'),
    ]);

    const rig = resolveCatRig(root);

    expect(rig.version).toBe('legacy-quaternius-v1');
    expect(rig.quality).toBe('legacy');
    expect(rig.body?.name).toBe('Body');
    expect(rig.tailSegments.map((part) => part.name)).toEqual(['Tail']);
    expect(rig.legs.frontRight?.name).toBe('FrontLeg.R');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npx vitest run tests/cat-rig.test.ts`

Expected: FAIL because `src/lib/catRig.ts` does not exist.

- [ ] **Step 3: Implement the resolver**

Create `src/lib/catRig.ts` with:

```ts
import type { Object3D } from 'three';

export type CatRigQuality = 'contract' | 'legacy' | 'partial';

export interface CatRigParts {
  version: 'custom-contract-v1' | 'legacy-quaternius-v1' | 'partial-v1';
  quality: CatRigQuality;
  body: Object3D | null;
  head: Object3D | null;
  tail: Object3D | null;
  tailSegments: Object3D[];
  ears: { left: Object3D | null; right: Object3D | null };
  legs: {
    frontLeft: Object3D | null;
    frontRight: Object3D | null;
    backLeft: Object3D | null;
    backRight: Object3D | null;
  };
  missing: string[];
}

export function resolveCatRig(root: Object3D): CatRigParts {
  const contract = {
    body: findFirst(root, ['Spine_02', 'Spine_03', 'Center_Of_Mass']),
    head: findFirst(root, ['Head']),
    tailSegments: ['Tail_01', 'Tail_02', 'Tail_03', 'Tail_04', 'Tail_05']
      .map((name) => root.getObjectByName(name))
      .filter((part): part is Object3D => Boolean(part)),
    ears: {
      left: findFirst(root, ['Ear_L']),
      right: findFirst(root, ['Ear_R']),
    },
    legs: {
      frontLeft: findFirst(root, ['FrontLeg_L_Upper', 'FrontPaw_L']),
      frontRight: findFirst(root, ['FrontLeg_R_Upper', 'FrontPaw_R']),
      backLeft: findFirst(root, ['BackLeg_L_Upper', 'BackPaw_L']),
      backRight: findFirst(root, ['BackLeg_R_Upper', 'BackPaw_R']),
    },
  };

  const legacy = {
    body: findFirst(root, ['Body']),
    head: findFirst(root, ['Head']),
    tailSegments: [findFirst(root, ['Tail'])].filter((part): part is Object3D => Boolean(part)),
    ears: { left: null, right: null },
    legs: {
      frontLeft: findFirst(root, ['FrontLeg.L']),
      frontRight: findFirst(root, ['FrontLeg.R']),
      backLeft: findFirst(root, ['BackLeg.L']),
      backRight: findFirst(root, ['BackLeg.R']),
    },
  };

  const useContract = Boolean(contract.body && contract.head && contract.tailSegments.length >= 2);
  const parts = useContract ? contract : legacy;
  const missing = collectMissing(parts);

  return {
    version: useContract ? 'custom-contract-v1' : missing.length < 4 ? 'legacy-quaternius-v1' : 'partial-v1',
    quality: useContract ? 'contract' : missing.length < 4 ? 'legacy' : 'partial',
    body: parts.body,
    head: parts.head,
    tail: parts.tailSegments[0] ?? null,
    tailSegments: parts.tailSegments,
    ears: parts.ears,
    legs: parts.legs,
    missing,
  };
}

function findFirst(root: Object3D, names: string[]): Object3D | null {
  for (const name of names) {
    const part = root.getObjectByName(name);
    if (part) return part;
  }
  return null;
}

function collectMissing(parts: {
  body: Object3D | null;
  head: Object3D | null;
  tailSegments: Object3D[];
  legs: CatRigParts['legs'];
}) {
  const missing: string[] = [];
  if (!parts.body) missing.push('Body');
  if (!parts.head) missing.push('Head');
  if (parts.tailSegments.length === 0) missing.push('Tail');
  if (!parts.legs.frontLeft) missing.push('FrontLeft');
  if (!parts.legs.frontRight) missing.push('FrontRight');
  if (!parts.legs.backLeft) missing.push('BackLeft');
  if (!parts.legs.backRight) missing.push('BackRight');
  return missing;
}
```

- [ ] **Step 4: Run the resolver tests**

Run: `npx vitest run tests/cat-rig.test.ts`

Expected: PASS.

---

### Task 2: Asset Registry And Hunt Pose Contract

**Files:**
- Modify: `src/lib/catMascot.ts`
- Modify: `tests/cat-mascot.test.ts`

- [ ] **Step 1: Add failing tests for custom asset selection and hunt pose**

Add imports:

```ts
  CAT_MASCOT_ASSETS,
  getCatHuntPose,
  resolveCatMascotAsset,
```

Add tests:

```ts
it('selects the custom ghost rig as the default mascot asset', () => {
  expect(CAT_MASCOT_ASSET.path).toBe('/models/cat/radeq-ginger-ghost.glb');
  expect(CAT_MASCOT_ASSET.triangles).toBeLessThanOrEqual(18_000);
  expect(CAT_MASCOT_ASSETS.quaternius.path).toBe('/models/cat/quaternius-cat.glb');
  expect(resolveCatMascotAsset('?cat=quaternius').path).toBe('/models/cat/quaternius-cat.glb');
  expect(resolveCatMascotAsset('?cat=ghost').path).toBe('/models/cat/radeq-ginger-ghost.glb');
});

it('turns fast pointer motion into a playful predator hunt pose', () => {
  const calm = getCatHuntPose({ x: 0.2, y: 0.1, active: true }, 0.04, 4.2);
  const laser = getCatHuntPose({ x: 0.9, y: -0.25, active: true }, 1.8, 4.2);

  expect(calm.state).toBe('watching');
  expect(laser.state).toBe('laser');
  expect(laser.stalkIntensity).toBeGreaterThan(calm.stalkIntensity);
  expect(laser.headSnap).toBeGreaterThan(0.4);
  expect(laser.tailTwitch).toBeGreaterThan(0.2);
  expect(laser.frontBrace).toBeGreaterThan(0.2);
  expect(laser.pounceReadiness).toBeGreaterThan(0.2);
});
```

- [ ] **Step 2: Run the failing test**

Run: `npx vitest run tests/cat-mascot.test.ts`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement minimal asset and hunt exports**

Add to `src/lib/catMascot.ts`:

```ts
export interface CatMascotAsset {
  path: string;
  sourceUrl: string;
  author: string;
  license: string;
  bytes: number;
  triangles: number;
  requiredExtensions: string[];
}

export interface CatHuntPose {
  state: 'idle' | 'watching' | 'stalk' | 'laser' | 'prePounce';
  pointerSpeed: number;
  stalkIntensity: number;
  headSnap: number;
  bodyCrouch: number;
  tailTwitch: number;
  frontBrace: number;
  pounceReadiness: number;
}

export const CAT_MASCOT_ASSETS = {
  ghost: {
    path: '/models/cat/radeq-ginger-ghost.glb',
    sourceUrl: 'local://radeq-ginger-ghost',
    author: 'Radeq.cz generated asset pipeline',
    license: 'Project-owned local generated asset',
    bytes: 1_200_000,
    triangles: 12_000,
    requiredExtensions: [] as string[],
  },
  quaternius: {
    path: '/models/cat/quaternius-cat.glb',
    sourceUrl: 'https://poly.pizza/m/qKICY6xla2',
    author: 'Quaternius',
    license: 'CC0-1.0',
    bytes: 229_676,
    triangles: 2_448,
    requiredExtensions: [] as string[],
  },
} as const satisfies Record<string, CatMascotAsset>;

export const CAT_MASCOT_ASSET = CAT_MASCOT_ASSETS.ghost;

export function resolveCatMascotAsset(search = ''): CatMascotAsset {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get('cat') === 'quaternius' ? CAT_MASCOT_ASSETS.quaternius : CAT_MASCOT_ASSETS.ghost;
}

export function getCatHuntPose(pointer: MascotPointer, pointerSpeed: number, elapsedTime = 0): CatHuntPose {
  if (!pointer.active) {
    return { state: 'idle', pointerSpeed: 0, stalkIntensity: 0, headSnap: 0, bodyCrouch: 0, tailTwitch: 0, frontBrace: 0, pounceReadiness: 0 };
  }

  const speed = clamp(pointerSpeed, 0, 2);
  const attention = clamp(Math.abs(pointer.x) * 0.72 + Math.abs(pointer.y) * 0.28, 0, 1);
  const stalkIntensity = clamp(attention * 0.45 + speed * 0.38, 0, 1);
  const stillPulse = speed < 0.12 ? (Math.sin(elapsedTime * 7.5) + 1) * 0.5 : 0;
  const pounceReadiness = clamp(stalkIntensity * 0.55 + stillPulse * attention * 0.35, 0, 1);
  const state = speed > 0.9 ? 'laser' : pounceReadiness > 0.45 ? 'prePounce' : stalkIntensity > 0.28 ? 'stalk' : 'watching';

  return {
    state,
    pointerSpeed: round3(speed),
    stalkIntensity: round3(stalkIntensity),
    headSnap: round3(clamp(speed * 0.55 + attention * 0.28, 0, 1)),
    bodyCrouch: round3(stalkIntensity * 0.32),
    tailTwitch: round3(stalkIntensity * 0.18 + speed * 0.22 + stillPulse * 0.08),
    frontBrace: round3(stalkIntensity * 0.34 + pounceReadiness * 0.18),
    pounceReadiness: round3(pounceReadiness),
  };
}
```

- [ ] **Step 4: Run cat mascot tests**

Run: `npx vitest run tests/cat-mascot.test.ts`

Expected: PASS.

---

### Task 3: Generate The Stylized Ghost-Rig GLB

**Files:**
- Create: `scripts/generate-cat-ghost-rig.mjs`
- Modify: `package.json`
- Generate: `public/models/cat/radeq-ginger-ghost.glb`

- [ ] **Step 1: Add the generator script**

Create `scripts/generate-cat-ghost-rig.mjs` using Three.js primitives. Include a Node `FileReader` polyfill before `GLTFExporter`.

The generated scene must include these named controls: `CatRoot`, `Center_Of_Mass`, `Hips`, `Spine_01`, `Spine_02`, `Spine_03`, `Neck`, `Head`, `Ear_L`, `Ear_R`, `Tail_01` through `Tail_05`, all four upper leg names, and paw names.

- [ ] **Step 2: Add the npm script**

Modify `package.json`:

```json
"models:cat:ghost": "node scripts/generate-cat-ghost-rig.mjs"
```

- [ ] **Step 3: Generate the GLB**

Run: `npm run models:cat:ghost`

Expected: script prints `Generated public/models/cat/radeq-ginger-ghost.glb` with a byte size under 2 MB.

- [ ] **Step 4: Verify generated file exists**

Run: `Get-Item public\models\cat\radeq-ginger-ghost.glb | Select-Object Name,Length`

Expected: file exists and length is less than `2000000`.

---

### Task 4: Wire The Rig Resolver Into The Renderer

**Files:**
- Modify: `src/components/CoreIsland.tsx`
- Test: `tests/smoke.spec.ts`

- [ ] **Step 1: Add failing browser expectations**

In `tests/smoke.spec.ts`, replace the model source expectation with:

```ts
await expect(mascot).toHaveAttribute('data-model-source', /local:\/\/radeq-ginger-ghost/);
await expect(mascot).toHaveAttribute('data-cat-rig-version', /custom-contract-v1|legacy-quaternius-v1/);
await expect(mascot).toHaveAttribute('data-cat-rig-quality', /contract|legacy|partial/);
```

Also add:

```ts
await expect(mascot).toHaveAttribute('data-cat-hunt-state', /idle|watching|stalk|laser|prePounce/);
await expect(mascot).toHaveAttribute('data-cat-pointer-speed', /^\d+\.\d{3}$/);
```

- [ ] **Step 2: Run failing smoke test**

Run: `npm run test:e2e`

Expected: FAIL because runtime does not expose rig/hunt data and still uses the old hard-coded model source.

- [ ] **Step 3: Modify `CoreIsland.tsx`**

Use `resolveCatMascotAsset(window.location.search)` before loading the model.

Use `resolveCatRig(model)` after the GLB loads:

```ts
const rigParts = resolveCatRig(model);
const head = rigParts.head;
const body = rigParts.body;
const tailSegments = rigParts.tailSegments;
const tail = rigParts.tail;
const frontLeftLeg = rigParts.legs.frontLeft;
const frontRightLeg = rigParts.legs.frontRight;
const backLeftLeg = rigParts.legs.backLeft;
const backRightLeg = rigParts.legs.backRight;
```

Set QA attributes:

```ts
host.dataset.catRigVersion = rigParts.version;
host.dataset.catRigQuality = rigParts.quality;
host.dataset.catRigMissing = rigParts.missing.join(',');
```

Drive all tail segments with a slight phase offset, using the first segment as the legacy fallback.

- [ ] **Step 4: Run smoke test**

Run: `npm run test:e2e`

Expected: PASS.

---

### Task 5: Apply Predator/Laser Motion Overlay

**Files:**
- Modify: `src/components/CoreIsland.tsx`
- Test: `tests/cat-mascot.test.ts`
- Test: `tests/smoke.spec.ts`

- [ ] **Step 1: Track pointer speed in renderer**

Add local state:

```ts
let previousPointer = pointer;
let pointerSpeed = 0;
```

Inside `updatePointerFromEvent`, calculate speed from pointer delta and clamp it:

```ts
const dx = pointer.x - previousPointer.x;
const dy = pointer.y - previousPointer.y;
pointerSpeed = Math.min(Math.hypot(dx, dy) * 3.8, 2);
previousPointer = pointer;
```

- [ ] **Step 2: Apply hunt pose in `tick()`**

Compute:

```ts
const huntPose = getCatHuntPose(pointer, pointerSpeed, elapsedTime);
```

Expose:

```ts
host.dataset.catHuntState = huntPose.state;
host.dataset.catPointerSpeed = huntPose.pointerSpeed.toFixed(3);
host.dataset.catStalkIntensity = huntPose.stalkIntensity.toFixed(3);
host.dataset.catPounceReadiness = huntPose.pounceReadiness.toFixed(3);
```

Blend into body/head/tail/front paws:

```ts
// head: stronger follow when laser state is active
// body: crouch from huntPose.bodyCrouch
// tail: add huntPose.tailTwitch
// front paws: add huntPose.frontBrace
```

- [ ] **Step 3: Run unit and e2e tests**

Run:

```bash
npm run test
npm run test:e2e
```

Expected: both pass.

---

### Task 6: Final Verification

**Files:**
- No code changes unless verification fails.

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`

Expected: `0 errors`.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: build completes. The existing Vite large chunk warning is acceptable unless new errors appear.

- [ ] **Step 3: Browser QA**

At `http://127.0.0.1:4322/`:

- launch the cat
- confirm the custom ghost rig loads
- move pointer left/right and confirm full-body facing follows after scroll pause
- move pointer quickly and confirm `data-cat-hunt-state` reaches `laser`
- hover/click the cat and confirm petting still enters `petting`
- confirm no relevant console errors

Expected: browser behavior is responsive, nonblank, and the cat stays near its lane.
