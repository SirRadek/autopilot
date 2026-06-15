import assert from 'node:assert/strict'
import test from 'node:test'

import { denyAccess, isAdmin, isAdminOrEditor, isAuthenticated } from '@/access/isAdmin'

type AccessArgs = Parameters<typeof isAdmin>[0]

function accessArgs(roles?: string[]): AccessArgs {
  return ({
    req: {
      user:
        roles === undefined
          ? undefined
          : {
              id: 'user-1',
              roles
            }
    }
  } as unknown) as AccessArgs
}

test('isAdmin allows only admins', async () => {
  assert.equal(await isAdmin(accessArgs(['admin'])), true)
  assert.equal(await isAdmin(accessArgs(['editor'])), false)
  assert.equal(await isAdmin(accessArgs(['client'])), false)
  assert.equal(await isAdmin(accessArgs()), false)
})

test('isAuthenticated allows any logged-in user', async () => {
  assert.equal(await isAuthenticated(accessArgs(['admin'])), true)
  assert.equal(await isAuthenticated(accessArgs(['editor'])), true)
  assert.equal(await isAuthenticated(accessArgs(['client'])), true)
  assert.equal(await isAuthenticated(accessArgs()), false)
})

test('isAdminOrEditor allows staff and denies clients', async () => {
  assert.equal(await isAdminOrEditor(accessArgs(['admin'])), true)
  assert.equal(await isAdminOrEditor(accessArgs(['editor'])), true)
  assert.equal(await isAdminOrEditor(accessArgs(['client'])), false)
  assert.equal(await isAdminOrEditor(accessArgs()), false)
})

test('denyAccess always denies', async () => {
  assert.equal(await denyAccess(accessArgs(['admin'])), false)
  assert.equal(await denyAccess(accessArgs(['editor'])), false)
  assert.equal(await denyAccess(accessArgs(['client'])), false)
  assert.equal(await denyAccess(accessArgs()), false)
})
