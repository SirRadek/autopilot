export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface JsonSchemaValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateRequiredFields(
  value: unknown,
  requiredFields: readonly string[],
  arrayFields: readonly string[] = []
): ValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["value must be an object"] };
  }

  const errors = requiredFields.flatMap((field) => {
    const fieldValue = value[field];

    if (fieldValue === undefined || fieldValue === null || fieldValue === "") {
      return [`${field} is required`];
    }

    if (arrayFields.includes(field) && !Array.isArray(fieldValue)) {
      return [`${field} must be an array`];
    }

    return [];
  });

  return { valid: errors.length === 0, errors };
}

export function validateJsonSchema(value: unknown, schema: unknown, path = "$"): JsonSchemaValidationIssue[] {
  if (!isRecord(schema)) {
    return [{ path, message: "schema must be an object" }];
  }

  const errors: JsonSchemaValidationIssue[] = [];
  const type = schema.type;

  if (typeof type === "string") {
    validateType(value, type, path, errors);
  }

  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && !enumValues.some((item) => Object.is(item, value))) {
    errors.push({ path, message: `must be one of: ${enumValues.join(", ")}` });
  }

  if (typeof value === "string") {
    validateString(value, schema, path, errors);
  }

  if (typeof value === "number") {
    validateNumber(value, schema, path, errors);
  }

  if (Array.isArray(value)) {
    validateArray(value, schema, path, errors);
  }

  if (isRecord(value)) {
    validateObject(value, schema, path, errors);
  }

  return errors;
}

function validateType(value: unknown, type: string, path: string, errors: JsonSchemaValidationIssue[]): void {
  if (type === "object" && !isRecord(value)) {
    errors.push({ path, message: "must be an object" });
  } else if (type === "array" && !Array.isArray(value)) {
    errors.push({ path, message: "must be an array" });
  } else if (type === "string" && typeof value !== "string") {
    errors.push({ path, message: "must be a string" });
  } else if (type === "integer" && (!Number.isInteger(value) || typeof value !== "number")) {
    errors.push({ path, message: "must be an integer" });
  } else if (type === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
    errors.push({ path, message: "must be a number" });
  } else if (type === "boolean" && typeof value !== "boolean") {
    errors.push({ path, message: "must be a boolean" });
  }
}

function validateString(
  value: string,
  schema: Record<string, unknown>,
  path: string,
  errors: JsonSchemaValidationIssue[]
): void {
  if (typeof schema.minLength === "number" && value.length < schema.minLength) {
    errors.push({ path, message: `must have at least ${schema.minLength} characters` });
  }

  if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) {
    errors.push({ path, message: `must match pattern ${schema.pattern}` });
  }

  if (schema.format === "date" && !isValidDateOnly(value)) {
    errors.push({ path, message: "must be a valid YYYY-MM-DD date" });
  }
}

function validateNumber(
  value: number,
  schema: Record<string, unknown>,
  path: string,
  errors: JsonSchemaValidationIssue[]
): void {
  if (typeof schema.minimum === "number" && value < schema.minimum) {
    errors.push({ path, message: `must be greater than or equal to ${schema.minimum}` });
  }

  if (typeof schema.maximum === "number" && value > schema.maximum) {
    errors.push({ path, message: `must be less than or equal to ${schema.maximum}` });
  }
}

function validateArray(
  value: readonly unknown[],
  schema: Record<string, unknown>,
  path: string,
  errors: JsonSchemaValidationIssue[]
): void {
  if (typeof schema.minItems === "number" && value.length < schema.minItems) {
    errors.push({ path, message: `must contain at least ${schema.minItems} item(s)` });
  }

  if (schema.uniqueItems === true && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
    errors.push({ path, message: "must contain unique items" });
  }

  if (isRecord(schema.items)) {
    value.forEach((item, index) => {
      errors.push(...validateJsonSchema(item, schema.items, `${path}[${index}]`));
    });
  }
}

function validateObject(
  value: Record<string, unknown>,
  schema: Record<string, unknown>,
  path: string,
  errors: JsonSchemaValidationIssue[]
): void {
  const required = Array.isArray(schema.required) ? schema.required.filter((item) => typeof item === "string") : [];
  for (const field of required) {
    if (value[field] === undefined) {
      errors.push({ path: `${path}.${field}`, message: "is required" });
    }
  }

  const properties = isRecord(schema.properties) ? schema.properties : {};
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (properties[key] === undefined) {
        errors.push({ path: `${path}.${key}`, message: "is not allowed" });
      }
    }
  }

  for (const [key, childSchema] of Object.entries(properties)) {
    if (value[key] !== undefined) {
      errors.push(...validateJsonSchema(value[key], childSchema, `${path}.${key}`));
    }
  }
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return new Date(timestamp).toISOString().startsWith(value);
}
