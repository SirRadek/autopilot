import assert from 'node:assert/strict'
import test from 'node:test'

import { isAuthorizedMeshRequest } from '@/lib/mesh-auth'

test('rejects missing mesh service token when configured', () => {
  assert.equal(isAuthorizedMeshRequest(undefined, 'secret'), false)
})

test('rejects requests when no service token is configured', () => {
  assert.equal(isAuthorizedMeshRequest('Bearer secret', undefined), false)
})

test('accepts bearer token when it matches configured token', () => {
  assert.equal(isAuthorizedMeshRequest('Bearer secret', 'secret'), true)
})

test('accepts x-mesh-service-token when it matches configured token', () => {
  assert.equal(isAuthorizedMeshRequest('secret', 'secret'), true)
})

test('rejects mismatched bearer token', () => {
  assert.equal(isAuthorizedMeshRequest('Bearer wrong', 'secret'), false)
})
