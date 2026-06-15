import assert from 'node:assert/strict'
import test from 'node:test'

import { POST as purgePost } from '@/app/api/opportunities/purge/route'
import { POST as webSourcePost } from '@/app/api/opportunities/live/web-source/route'

test('rejects unauthenticated opportunity purge requests before side effects', async () => {
  const response = await purgePost(
    new Request('http://localhost/api/opportunities/purge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ itemId: 1, reason: 'retention_expired' })
    })
  )

  assert.equal(response.status, 401)
})

test('rejects unauthenticated live web source requests before side effects', async () => {
  const response = await webSourcePost(
    new Request('http://localhost/api/opportunities/live/web-source', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceKey: 'reviewed-web-cz-it', urls: ['https://portal.example.cz/tenders/1'] })
    })
  )

  assert.equal(response.status, 401)
})
