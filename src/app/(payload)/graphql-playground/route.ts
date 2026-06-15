const GRAPHQL_PLAYGROUND_DISABLED_RESPONSE = {
  ok: false,
  error: 'Payload GraphQL Playground is disabled for the current v0.1 operating scope.'
}

export function GET() {
  return Response.json(GRAPHQL_PLAYGROUND_DISABLED_RESPONSE, { status: 410 })
}
