import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload } from 'payload'

import {
  createOpportunityImport,
  purgeOpportunityPersonalData,
  validateOpportunityIngestPayload
} from '@/lib/opportunities'

const opportunityRow = {
  sourceItemId: 'item-1',
  canonicalUrl: 'https://portal.example.cz/tenders/1',
  title: 'Poptavka na novy web a CMS',
  description: 'Firma hleda dodavatele pro web a spravu obsahu.',
  rawSnippet: 'Kontakt Jan Novak, jan@example.cz, +420 777 111 222',
  rowFingerprint: 'fingerprint-1',
  fitScore: 86,
  serviceTags: ['web', 'cms'],
  requesterName: 'Jan Novak',
  contactEmail: 'jan@example.cz',
  contactPhone: '+420 777 111 222',
  sourceStatus: 'open',
  publishedAt: '2026-06-13T08:00:00.000Z',
  sourceUpdatedAt: '2026-06-13T08:30:00.000Z',
  deadlineAt: '2026-06-20T10:00:00.000Z',
  discoveredAt: '2026-06-13T09:00:00.000Z'
}

test('validates opportunity ingest rows against source identity and allowed hosts', () => {
  const result = validateOpportunityIngestPayload(
    {
      sourceKey: 'portal-cz',
      sourceRunId: 'run-1',
      idempotencyKey: 'portal-cz:run-1',
      items: [opportunityRow]
    },
    {
      allowedHosts: ['portal.example.cz']
    }
  )

  assert.equal(result.ok, true)
  if (!result.ok) return

  assert.equal(result.data.sourceKey, 'portal-cz')
  assert.equal(result.data.items[0]?.contactEmail, 'jan@example.cz')
  assert.equal(result.data.items[0]?.canonicalHost, 'portal.example.cz')
  assert.equal(result.data.items[0]?.sourceStatus, 'open')
  assert.equal(result.data.items[0]?.deadlineAt, '2026-06-20T10:00:00.000Z')

  const rejected = validateOpportunityIngestPayload(
    {
      sourceKey: 'portal-cz',
      sourceRunId: 'run-2',
      items: [
        {
          ...opportunityRow,
          canonicalUrl: 'https://evil.example/tenders/1'
        }
      ]
    },
    {
      allowedHosts: ['portal.example.cz']
    }
  )

  assert.equal(rejected.ok, false)
  if (rejected.ok) return
  assert.ok(rejected.errors.some((error) => error.includes('host is not allowed')))
})

test('imports opportunity fixture rows with PII-free events and 14 day retention deadline', async () => {
  const payload = createFakePayload()
  await seedSource(payload)

  const result = await createOpportunityImport(payload, {
    sourceKey: 'portal-cz',
    sourceRunId: 'run-1',
    idempotencyKey: 'portal-cz:run-1',
    items: [opportunityRow]
  })

  assert.equal(result.created, 1)
  assert.equal(result.duplicates, 0)
  assert.equal(result.collisions, 0)
  assert.equal(payload.store['opportunity-runs'].length, 1)
  assert.equal(payload.store['opportunity-items'].length, 1)

  const item = payload.store['opportunity-items'][0]
  assert.equal(item?.status, 'new')
  assert.equal(item?.sourceStatus, 'open')
  assert.equal(item?.sourceUpdatedAt, '2026-06-13T08:30:00.000Z')
  assert.equal(item?.deadlineAt, '2026-06-20T10:00:00.000Z')
  assert.equal(item?.dedupeKey, 'portal-cz:fingerprint-1')
  assert.equal(item?.personalDataExpiresAt, '2026-06-27T09:00:00.000Z')

  const importedEvent = payload.store['workflow-events'].find((event) => event.eventType === 'opportunity_imported')
  assert.ok(importedEvent)
  assert.equal(JSON.stringify(importedEvent?.payload).includes('jan@example.cz'), false)
  assert.equal(JSON.stringify(importedEvent?.payload).includes('+420 777'), false)
  assert.equal(JSON.stringify(importedEvent?.payload).includes('Jan Novak'), false)
})

test('replays opportunity import idempotently and skips duplicate row fingerprints', async () => {
  const payload = createFakePayload()
  await seedSource(payload)

  const first = await createOpportunityImport(payload, {
    sourceKey: 'portal-cz',
    sourceRunId: 'run-1',
    idempotencyKey: 'portal-cz:run-1',
    items: [opportunityRow]
  })
  const replay = await createOpportunityImport(payload, {
    sourceKey: 'portal-cz',
    sourceRunId: 'run-1',
    idempotencyKey: ' PORTAL-CZ:RUN-1 ',
    items: [opportunityRow]
  })
  const duplicate = await createOpportunityImport(payload, {
    sourceKey: 'portal-cz',
    sourceRunId: 'run-2',
    idempotencyKey: 'portal-cz:run-2',
    items: [opportunityRow]
  })

  assert.equal(first.created, 1)
  assert.equal(replay.replayed, true)
  assert.equal(duplicate.created, 0)
  assert.equal(duplicate.duplicates, 1)
  assert.equal(payload.store['opportunity-runs'].length, 2)
  assert.equal(payload.store['opportunity-items'].length, 1)
  assert.ok(payload.store['workflow-events'].some((event) => event.eventType === 'opportunity_duplicate_skipped'))
})

test('blocks opportunity collisions without creating another item', async () => {
  const payload = createFakePayload()
  await seedSource(payload)

  await createOpportunityImport(payload, {
    sourceKey: 'portal-cz',
    sourceRunId: 'run-1',
    idempotencyKey: 'portal-cz:run-1',
    items: [opportunityRow]
  })
  const collision = await createOpportunityImport(payload, {
    sourceKey: 'portal-cz',
    sourceRunId: 'run-2',
    idempotencyKey: 'portal-cz:run-2',
    items: [
      {
        ...opportunityRow,
        rowFingerprint: 'fingerprint-changed',
        title: 'Changed row with same source item'
      }
    ]
  })

  assert.equal(collision.collisions, 1)
  assert.equal(payload.store['opportunity-items'].length, 1)
  assert.equal(payload.store['opportunity-items'][0]?.status, 'blocked')
  assert.ok(payload.store['workflow-events'].some((event) => event.eventType === 'opportunity_collision_blocked'))
})

test('purges opportunity personal data idempotently without restating purged values in events', async () => {
  const payload = createFakePayload()
  await seedSource(payload)

  await createOpportunityImport(payload, {
    sourceKey: 'portal-cz',
    sourceRunId: 'run-1',
    idempotencyKey: 'portal-cz:run-1',
    items: [opportunityRow]
  })

  const item = payload.store['opportunity-items'][0]
  assert.ok(item)

  const purge = await purgeOpportunityPersonalData(payload, {
    itemId: item.id,
    actorId: 'owner',
    reason: 'responded',
    now: new Date('2026-06-13T10:00:00.000Z')
  })
  const replay = await purgeOpportunityPersonalData(payload, {
    itemId: item.id,
    actorId: 'owner',
    reason: 'responded',
    now: new Date('2026-06-13T10:05:00.000Z')
  })

  assert.equal(purge.purged, true)
  assert.equal(replay.purged, false)
  assert.equal(item.requesterName, '')
  assert.equal(item.contactEmail, '')
  assert.equal(item.contactPhone, '')
  assert.equal(item.rawSnippet, '')
  assert.equal(item.personalDataPurgedAt, '2026-06-13T10:00:00.000Z')

  const purgeEvent = payload.store['workflow-events'].find(
    (event) => event.eventType === 'opportunity_personal_data_purged'
  )
  assert.ok(purgeEvent)
  const serializedPayload = JSON.stringify(purgeEvent?.payload)
  assert.equal(serializedPayload.includes('jan@example.cz'), false)
  assert.equal(serializedPayload.includes('+420 777'), false)
  assert.equal(serializedPayload.includes('Jan Novak'), false)
})

async function seedSource(payload: ReturnType<typeof createFakePayload>) {
  await payload.create({
    collection: 'opportunity-sources',
    data: {
      sourceKey: 'portal-cz',
      name: 'Portal CZ',
      enabled: true,
      termsReviewedAt: '2026-06-13T00:00:00.000Z',
      allowedHosts: [{ host: 'portal.example.cz' }]
    }
  })
}

function createFakePayload() {
  type Collection =
    | 'opportunity-sources'
    | 'opportunity-runs'
    | 'opportunity-items'
    | 'opportunity-reviews'
    | 'workflow-events'
  type Doc = Record<string, unknown> & { id: number }
  const store: Record<Collection, Doc[]> = {
    'opportunity-sources': [],
    'opportunity-runs': [],
    'opportunity-items': [],
    'opportunity-reviews': [],
    'workflow-events': []
  }
  let nextId = 1

  const fake = {
    store,
    async create(args: { collection: Collection; data: Record<string, unknown> }) {
      const doc = { id: nextId++, ...args.data }
      store[args.collection].push(doc)
      return doc
    },
    async update(args: { collection: Collection; id: string | number; data: Record<string, unknown> }) {
      const doc = store[args.collection].find((item) => item.id === Number(args.id))
      if (!doc) {
        throw new Error(`Missing ${args.collection} ${String(args.id)}`)
      }

      Object.assign(doc, args.data)
      return doc
    },
    async find(args: { collection: Collection; where?: Record<string, { equals: unknown }>; limit?: number }) {
      let docs = store[args.collection]

      if (args.where) {
        docs = docs.filter((doc) =>
          Object.entries(args.where ?? {}).every(([field, condition]) => doc[field] === condition.equals)
        )
      }

      return {
        docs: args.limit ? docs.slice(0, args.limit) : docs,
        totalDocs: docs.length
      }
    }
  }

  return fake as typeof fake & Payload
}
