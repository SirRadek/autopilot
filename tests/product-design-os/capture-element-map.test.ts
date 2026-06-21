import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type {
  ElementMap,
  ElementPassport,
  ElementStyleDigest
} from "../../product-design-os/scripts/capture-element-map";

const elementMapModule = (await import(
  new URL("../../product-design-os/scripts/capture-element-map.ts", import.meta.url).href
)) as typeof import("../../product-design-os/scripts/capture-element-map");

const { resolvePointToPassport } = elementMapModule;

const baseStyle: ElementStyleDigest = {
  display: "block",
  position: "absolute",
  visibility: "visible",
  pointerEvents: "auto",
  opacity: 1,
  zIndex: "auto",
  color: "rgb(17, 24, 39)",
  backgroundColor: "rgb(255, 255, 255)",
  borderColor: "rgb(209, 213, 219)",
  borderWidth: "1px 1px 1px 1px",
  boxShadow: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: "16px",
  fontWeight: "400",
  lineHeight: "24px",
  padding: "8px 12px 8px 12px",
  margin: "0px 0px 0px 0px",
  gap: "0px",
  hasPaint: true
};

const fixtureMap: ElementMap = {
  vemVersion: "vem-mvp-1",
  url: "file:///fixture.html",
  captured_at: "2026-06-21T00:00:00.000Z",
  viewports: [
    {
      name: "desktop",
      width: 1440,
      height: 900,
      screenshot_path: "output/playwright/product-design-os/desktop-element-map.png",
      nodes: [
        passport({
          id: "panel",
          siteId: "site-panel",
          instanceKey: "site-panel:panel",
          parentId: null,
          domPath: "html:nth-of-type(1) > body:nth-of-type(1) > section:nth-of-type(1)",
          role: "region",
          accessibleName: "Settings",
          textSnippet: "",
          rect: { x: 0, y: 0, w: 220, h: 180 },
          zPath: [0, 0],
          depth: 2,
          sourceRef: "unknown"
        }),
        passport({
          id: "primary-button",
          siteId: "site-button",
          instanceKey: "site-button:save",
          parentId: "panel",
          domPath: "html:nth-of-type(1) > body:nth-of-type(1) > section:nth-of-type(1) > button:nth-of-type(1)",
          role: "button",
          accessibleName: "Save",
          textSnippet: "Save",
          rect: { x: 20, y: 20, w: 120, h: 60 },
          zPath: [0, 1],
          depth: 3,
          sourceRef: {
            file: "src/components/settings-panel.tsx",
            line: 12,
            col: 5,
            component: "SettingsPanel"
          },
          identityConfidence: "high"
        }),
        passport({
          id: "top-link",
          siteId: "site-link",
          instanceKey: "site-link:open",
          parentId: "panel",
          domPath: "html:nth-of-type(1) > body:nth-of-type(1) > section:nth-of-type(1) > a:nth-of-type(1)",
          role: "link",
          accessibleName: "Open",
          textSnippet: "Open",
          rect: { x: 40, y: 40, w: 120, h: 60 },
          zPath: [0, 3],
          depth: 3,
          sourceRef: "unknown"
        }),
        passport({
          id: "transparent-overlay",
          siteId: "site-overlay",
          instanceKey: "site-overlay:overlay",
          parentId: null,
          domPath: "html:nth-of-type(1) > body:nth-of-type(1) > div:nth-of-type(1)",
          role: "generic",
          accessibleName: "",
          textSnippet: "",
          rect: { x: 10, y: 10, w: 180, h: 130 },
          zPath: [0, 99],
          depth: 2,
          sourceRef: "unknown",
          styleDigest: {
            ...baseStyle,
            backgroundColor: "rgba(0, 0, 0, 0)",
            color: "rgba(0, 0, 0, 0)",
            hasPaint: false
          },
          stateFlags: ["windowed", "scroll=0,0", "zero-paint-overlay"],
          identityConfidence: "low"
        })
      ]
    }
  ]
};

test("resolvePointToPassport returns the topmost visible meaningful node for overlapping boxes", () => {
  const resolved = resolvePointToPassport(fixtureMap, "desktop", 50, 50);

  assert.equal(resolved?.id, "top-link");
});

test("resolvePointToPassport demotes zero-paint pointer-events overlays", () => {
  const resolved = resolvePointToPassport(fixtureMap, "desktop", 30, 30);

  assert.equal(resolved?.id, "primary-button");
});

test("fixture ElementMap validates against element-map.schema.json", () => {
  const schemaUrl = new URL("../../product-design-os/reader/element-map.schema.json", import.meta.url);
  const schema = JSON.parse(readFileSync(schemaUrl, "utf8")) as JsonSchema;
  const errors = validateSchema(schema, fixtureMap);

  assert.deepEqual(errors, []);
});

function passport(overrides: Partial<ElementPassport> & Pick<ElementPassport, "id" | "siteId" | "instanceKey" | "domPath">): ElementPassport {
  return {
    id: overrides.id,
    siteId: overrides.siteId,
    instanceKey: overrides.instanceKey,
    parentId: overrides.parentId ?? null,
    domPath: overrides.domPath,
    role: overrides.role ?? "generic",
    accessibleName: overrides.accessibleName ?? "",
    textSnippet: overrides.textSnippet ?? "",
    rect: overrides.rect ?? { x: 0, y: 0, w: 1, h: 1 },
    zPath: overrides.zPath ?? [0],
    depth: overrides.depth ?? 0,
    visible: overrides.visible ?? true,
    hitTestable: overrides.hitTestable ?? true,
    sourceRef: overrides.sourceRef ?? "unknown",
    styleDigest: overrides.styleDigest ?? baseStyle,
    stateFlags: overrides.stateFlags ?? ["windowed", "scroll=0,0"],
    identityConfidence: overrides.identityConfidence ?? "medium"
  };
}

interface JsonSchema {
  readonly $ref?: string;
  readonly $defs?: Record<string, JsonSchema>;
  readonly type?: string | readonly string[];
  readonly additionalProperties?: boolean;
  readonly required?: readonly string[];
  readonly properties?: Record<string, JsonSchema>;
  readonly items?: JsonSchema;
  readonly oneOf?: readonly JsonSchema[];
  readonly enum?: readonly unknown[];
  readonly const?: unknown;
  readonly minimum?: number;
  readonly minLength?: number;
}

function validateSchema(schema: JsonSchema, value: unknown): readonly string[] {
  return validateNode(schema, value, "$", schema);
}

function validateNode(schema: JsonSchema, value: unknown, path: string, root: JsonSchema): string[] {
  if (schema.$ref) {
    return validateNode(resolveRef(root, schema.$ref), value, path, root);
  }

  if (schema.oneOf) {
    const passingOptions = schema.oneOf.map((option) => validateNode(option, value, path, root)).filter((errors) => errors.length === 0);
    return passingOptions.length === 1 ? [] : [`${path} must match exactly one schema option`];
  }

  const errors: string[] = [];
  if ("const" in schema && value !== schema.const) {
    errors.push(`${path} must equal ${String(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((candidate) => candidate === value)) {
    errors.push(`${path} must be one of ${schema.enum.map((item) => String(item)).join(", ")}`);
  }
  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${path} must be ${Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type}`);
    return errors;
  }
  if (typeof value === "string" && schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push(`${path} must have length >= ${schema.minLength}`);
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${path} must be >= ${schema.minimum}`);
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      errors.push(...validateNode(schema.items as JsonSchema, item, `${path}[${index}]`, root));
    });
  }
  if (isRecord(value) && schema.properties) {
    for (const required of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        errors.push(`${path}.${required} is required`);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(schema.properties, key)) {
          errors.push(`${path}.${key} is not allowed`);
        }
      }
    }
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateNode(propertySchema, value[key], `${path}.${key}`, root));
      }
    }
  }
  return errors;
}

function resolveRef(root: JsonSchema, ref: string): JsonSchema {
  if (!ref.startsWith("#/$defs/")) {
    throw new Error(`Unsupported schema ref: ${ref}`);
  }
  const key = ref.slice("#/$defs/".length);
  const resolved = root.$defs?.[key];
  if (!resolved) {
    throw new Error(`Missing schema ref: ${ref}`);
  }
  return resolved;
}

function matchesType(value: unknown, type: string | readonly string[]): boolean {
  const types = Array.isArray(type) ? type : [type];
  return types.some((candidate) => {
    if (candidate === "array") {
      return Array.isArray(value);
    }
    if (candidate === "object") {
      return isRecord(value);
    }
    if (candidate === "integer") {
      return Number.isInteger(value);
    }
    if (candidate === "null") {
      return value === null;
    }
    return typeof value === candidate;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
