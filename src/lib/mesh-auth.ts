export function isAuthorizedMeshRequest(
  headerValue: string | null | undefined,
  configuredToken: string | undefined
): boolean {
  if (!configuredToken) {
    return false
  }

  if (!headerValue) {
    return false
  }

  const value = headerValue.startsWith('Bearer ') ? headerValue.slice('Bearer '.length) : headerValue
  return value === configuredToken
}

export function getMeshAuthHeader(request: Request): string | null {
  return request.headers.get('authorization') ?? request.headers.get('x-mesh-service-token')
}
