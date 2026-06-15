import assert from 'node:assert/strict'
import test from 'node:test'

import { POST as hlidacPost } from '@/app/api/opportunities/live/hlidac-statu/route'
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

test('opportunity purge requires the dedicated purge token', async () => {
  const previousMeshToken = process.env.MESH_SERVICE_TOKEN
  const previousPurgeToken = process.env.OPPORTUNITY_PURGE_TOKEN
  process.env.MESH_SERVICE_TOKEN = 'shared-token'
  process.env.OPPORTUNITY_PURGE_TOKEN = 'purge-token'

  try {
    const response = await purgePost(
      new Request('http://localhost/api/opportunities/purge', {
        method: 'POST',
        headers: {
          authorization: 'Bearer shared-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ itemId: 1, reason: 'retention_expired' })
      })
    )

    assert.equal(response.status, 401)
  } finally {
    restoreEnv('MESH_SERVICE_TOKEN', previousMeshToken)
    restoreEnv('OPPORTUNITY_PURGE_TOKEN', previousPurgeToken)
  }
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

test('live web source requires the dedicated live run token', async () => {
  const previousMeshToken = process.env.MESH_SERVICE_TOKEN
  const previousLiveRunToken = process.env.OPPORTUNITY_LIVE_RUN_TOKEN
  process.env.MESH_SERVICE_TOKEN = 'shared-token'
  process.env.OPPORTUNITY_LIVE_RUN_TOKEN = 'live-run-token'

  try {
    const response = await webSourcePost(
      new Request('http://localhost/api/opportunities/live/web-source', {
        method: 'POST',
        headers: {
          authorization: 'Bearer shared-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ sourceKey: 'reviewed-web-cz-it', urls: ['https://portal.example.cz/tenders/1'] })
      })
    )

    assert.equal(response.status, 401)
  } finally {
    restoreEnv('MESH_SERVICE_TOKEN', previousMeshToken)
    restoreEnv('OPPORTUNITY_LIVE_RUN_TOKEN', previousLiveRunToken)
  }
})

test('Hlidac Statu live route is disabled before auth and request parsing', async () => {
  const previousMeshToken = process.env.MESH_SERVICE_TOKEN
  const previousLiveRunToken = process.env.OPPORTUNITY_LIVE_RUN_TOKEN
  const previousHlidacToken = process.env.HLIDAC_STATU_API_TOKEN
  const previousCommercialApproved = process.env.HLIDAC_STATU_COMMERCIAL_APPROVED
  process.env.MESH_SERVICE_TOKEN = 'shared-token'
  process.env.OPPORTUNITY_LIVE_RUN_TOKEN = 'live-run-token'
  process.env.HLIDAC_STATU_API_TOKEN = 'provider-token'
  process.env.HLIDAC_STATU_COMMERCIAL_APPROVED = 'true'

  try {
    const response = await hlidacPost()
    const body = await response.json()

    assert.equal(response.status, 410)
    assert.deepEqual(body, {
      ok: false,
      error: 'Hlidac Statu live source is disabled.'
    })
  } finally {
    restoreEnv('MESH_SERVICE_TOKEN', previousMeshToken)
    restoreEnv('OPPORTUNITY_LIVE_RUN_TOKEN', previousLiveRunToken)
    restoreEnv('HLIDAC_STATU_API_TOKEN', previousHlidacToken)
    restoreEnv('HLIDAC_STATU_COMMERCIAL_APPROVED', previousCommercialApproved)
  }
})

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}
