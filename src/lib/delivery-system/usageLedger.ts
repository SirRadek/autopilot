import {
  requiredProviderBudgetKeys,
  requiredUsageLedgerKeys,
  usageLedgerNullableNumberKeys
} from "../../data/delivery-system/usageLedger";
import { isRecord, type ValidationResult } from "./validation";

const SURFACES = ["api", "cli", "web_ui", "local"];
const QUOTA_SOURCES = ["api_usage", "response_usage", "dashboard_manual", "local_estimate", "unknown"];
const CONFIDENCE = ["high", "medium", "low", "unknown"];
const CAPACITY_KINDS = ["messages", "tokens", "credits", "requests", "unknown"];

export function validateUsageLedgerEntry(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["value must be an object"] };
  }

  const errors: string[] = [
    ...requirePresentKeys(value, requiredUsageLedgerKeys),
    ...requireEnum(value, "surface", SURFACES),
    ...requireEnum(value, "quota_source", QUOTA_SOURCES),
    ...requireEnum(value, "measurement_confidence", CONFIDENCE)
  ];

  if ("used_in_final_plan" in value && typeof value.used_in_final_plan !== "boolean") {
    errors.push("used_in_final_plan must be a boolean");
  }

  for (const key of usageLedgerNullableNumberKeys) {
    errors.push(...validateNullableNumber(value, key, /^remaining_pct_|^quality_score$/.test(key)));
  }

  return { valid: errors.length === 0, errors };
}

export function validateProviderBudget(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["value must be an object"] };
  }

  const errors: string[] = [
    ...requirePresentKeys(value, requiredProviderBudgetKeys),
    ...requireEnum(value, "surface", SURFACES),
    ...requireEnum(value, "capacity_kind", CAPACITY_KINDS),
    ...requireEnum(value, "source", QUOTA_SOURCES),
    ...requireEnum(value, "confidence", CONFIDENCE),
    ...validateNullableNumber(value, "capacity_total", false),
    ...validateNullableNumber(value, "consumed", false),
    ...validateNullableNumber(value, "remaining", false),
    ...validateNullableNumber(value, "remaining_pct", true)
  ];

  return { valid: errors.length === 0, errors };
}

/** A required key must exist; a string value must be non-empty. `false`/`0`/`null` are allowed. */
function requirePresentKeys(value: Record<string, unknown>, keys: readonly string[]): string[] {
  return keys.flatMap((key) => {
    if (!(key in value) || value[key] === undefined) {
      return [`${key} is required`];
    }
    if (typeof value[key] === "string" && (value[key] as string).trim() === "") {
      return [`${key} must not be empty`];
    }
    return [];
  });
}

function requireEnum(value: Record<string, unknown>, key: string, allowed: readonly string[]): string[] {
  if (!(key in value) || value[key] === undefined) {
    return [];
  }
  return allowed.includes(value[key] as string) ? [] : [`${key} must be one of: ${allowed.join(", ")}`];
}

/** number | null only; when `isFraction`, a number must be within [0, 1]. */
function validateNullableNumber(value: Record<string, unknown>, key: string, isFraction: boolean): string[] {
  if (!(key in value) || value[key] === null) {
    return [];
  }
  const candidate = value[key];
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    return [`${key} must be a number or null`];
  }
  if (isFraction && (candidate < 0 || candidate > 1)) {
    return [`${key} must be a 0..1 fraction`];
  }
  return [];
}
