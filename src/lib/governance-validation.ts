export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateRequiredFields(
  value: unknown,
  requiredFields: readonly string[],
  arrayFields: readonly string[] = []
): ValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ['value must be an object'] }
  }

  const errors = requiredFields.flatMap((field) => {
    const fieldValue = value[field]

    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      return [`${field} is required`]
    }

    if (arrayFields.includes(field) && !Array.isArray(fieldValue)) {
      return [`${field} must be an array`]
    }

    return []
  })

  return { valid: errors.length === 0, errors }
}
