import {
  requiredDecisionLedgerFields,
  requiredIssueLedgerFields
} from "../../data/delivery-system/ledgers";
import { validateRequiredFields, type ValidationResult } from "./validation";

export function validateDecisionLedgerEntry(value: unknown): ValidationResult {
  return validateRequiredFields(value, requiredDecisionLedgerFields, [
    "alternatives",
    "related_tasks"
  ]);
}

export function validateIssueLedgerEntry(value: unknown): ValidationResult {
  return validateRequiredFields(value, requiredIssueLedgerFields);
}
