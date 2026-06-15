import assert from 'node:assert/strict'
import test from 'node:test'

import {
  OPTIONS as graphqlOptions,
  POST as graphqlPost
} from '@/app/(payload)/graphql/route'
import { GET as graphqlPlaygroundGet } from '@/app/(payload)/graphql-playground/route'

test('Payload GraphQL route is disabled for v0.1 scope', async () => {
  const postResponse = await graphqlPost()
  const optionsResponse = await graphqlOptions()

  assert.equal(postResponse.status, 410)
  assert.equal(optionsResponse.status, 410)
  assert.deepEqual(await postResponse.json(), {
    ok: false,
    error: 'Payload GraphQL is disabled for the current v0.1 operating scope.'
  })
})

test('Payload GraphQL Playground route is disabled for v0.1 scope', async () => {
  const response = await graphqlPlaygroundGet()

  assert.equal(response.status, 410)
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'Payload GraphQL Playground is disabled for the current v0.1 operating scope.'
  })
})
