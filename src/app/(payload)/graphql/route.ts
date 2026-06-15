const GRAPHQL_DISABLED_RESPONSE = {
  ok: false,
  error: 'Payload GraphQL is disabled for the current v0.1 operating scope.'
}

export function POST() {
  return Response.json(GRAPHQL_DISABLED_RESPONSE, { status: 410 })
}

export function OPTIONS() {
  return Response.json(GRAPHQL_DISABLED_RESPONSE, { status: 410 })
}
