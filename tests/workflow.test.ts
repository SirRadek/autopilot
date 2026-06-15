import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload } from 'payload'

import { buildLeadReviewTask, createLeadWorkflow, createTaskId } from '@/lib/workflow'

const lead = {
  name: 'Jan Siroky',
  email: 'jan@example.com',
  company: 'Example',
  project_type: 'Website',
  audience: 'Founders',
  deadline: '',
  current_url: '',
  budget_range: '',
  message: 'Need a website.',
  source_path: '/kontakt',
  referrer: '',
  locale: 'cs',
  honeypot: '',
  correlation_id: '',
  idempotency_key: ''
}

test('creates deterministic workflow task ids for replay-safe task creation', () => {
  const first = createTaskId('lead_review', {
    correlationId: 'corr-1',
    idempotencyKey: 'lead:test@example.com',
    subjectId: 'lead-1'
  })
  const second = createTaskId('lead_review', {
    correlationId: 'corr-1',
    idempotencyKey: 'lead:test@example.com',
    subjectId: 'lead-1'
  })

  assert.equal(first, second)
  assert.match(first, /^LEAD_REVIEW-[A-F0-9]{12}$/)
})

test('builds lead review task payload for orchestrator triage', () => {
  const task = buildLeadReviewTask(lead, '123')

  assert.equal(task.title, 'Review lead: Website - Jan Siroky')
  assert.equal(task.taskType, 'lead_review')
  assert.equal(task.assignedRole, 'orchestrator')
  assert.equal(task.priority, 500)
  assert.equal(task.state, 'queued')
  assert.equal(task.lead, '123')
  assert.equal(task.payload?.next_action, 'qualify_lead_and_convert_to_project_intake')
})

test('keeps numeric lead relationship ids for Payload while stringifying audit payload ids', () => {
  const task = buildLeadReviewTask(lead, 42)

  assert.equal(task.lead, 42)
  assert.equal(task.payload?.lead_id, '42')
})

test('deduplicates repeated lead workflow submissions by idempotency key', async () => {
  const payload = createFakePayload()
  const input = {
    ...lead,
    correlation_id: 'corr-1',
    idempotency_key: 'Lead:Jan@example.com'
  }

  const first = await createLeadWorkflow(payload, input)
  const second = await createLeadWorkflow(payload, {
    ...input,
    correlation_id: 'corr-2',
    idempotency_key: '  LEAD:JAN@EXAMPLE.COM  '
  })

  assert.equal(first.deduplicated, false)
  assert.equal(second.deduplicated, true)
  assert.equal(first.leadId, second.leadId)
  assert.equal(first.taskId, second.taskId)
  assert.equal(payload.store.leads.length, 1)
  assert.equal(payload.store.tasks.length, 1)
})

test('creates a blocked review task for idempotency key collisions', async () => {
  const payload = createFakePayload()
  const input = {
    ...lead,
    correlation_id: 'corr-1',
    idempotency_key: 'lead:collision'
  }

  await createLeadWorkflow(payload, input)
  const collision = await createLeadWorkflow(payload, {
    ...input,
    email: 'other@example.com'
  })

  assert.equal(collision.collision, true)
  assert.equal(collision.deduplicated, false)
  assert.equal(payload.store.leads.length, 1)
  assert.equal(payload.store.tasks.length, 2)
  assert.equal(payload.store.tasks[1]?.state, 'blocked')

  await createLeadWorkflow(payload, {
    ...input,
    correlation_id: 'corr-2',
    email: 'other@example.com'
  })

  assert.equal(payload.store.tasks.length, 2)
})

function createFakePayload() {
  type Doc = Record<string, unknown> & { id: number }
  const store: Record<'leads' | 'tasks' | 'workflow-events', Doc[]> = {
    leads: [],
    tasks: [],
    'workflow-events': []
  }
  let nextId = 1

  const fake = {
    store,
    async create(args: { collection: keyof typeof store; data: Record<string, unknown> }) {
      const doc = { id: nextId++, ...args.data }
      store[args.collection].push(doc)
      return doc
    },
    async update(args: { collection: keyof typeof store; id: string | number; data: Record<string, unknown> }) {
      const doc = store[args.collection].find((item) => item.id === Number(args.id))
      if (!doc) {
        throw new Error(`Missing ${args.collection} ${String(args.id)}`)
      }

      Object.assign(doc, args.data)
      return doc
    },
    async find(args: {
      collection: keyof typeof store
      where?: Record<string, { equals: unknown }>
      limit?: number
    }) {
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
