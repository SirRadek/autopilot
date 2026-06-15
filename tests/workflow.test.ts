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
  const task = buildLeadReviewTask(lead, '123', {
    correlationId: 'corr-1',
    idempotencyKey: 'Lead:Jan@example.com'
  })

  assert.equal(task.title, 'Review lead: Website (#123)')
  assert.equal(task.taskType, 'lead_review')
  assert.equal(task.assignedRole, 'orchestrator')
  assert.equal(task.priority, 500)
  assert.equal(task.state, 'queued')
  assert.equal(task.lead, '123')
  assert.equal(task.payload?.source, 'public_lead_api')
  assert.equal(task.payload?.lead_id, '123')
  assert.equal(task.payload?.correlation_id, 'corr-1')
  assert.match(String(task.payload?.idempotency_key), /^sha256:[a-f0-9]{16}$/)
  assert.equal(task.payload?.project_type, 'Website')
  assert.equal(task.payload?.priority_reason, 'standard_lead_triage')
  assert.equal(task.payload?.source_path, '/kontakt')
  assert.equal(task.payload?.next_action, 'qualify_lead_and_convert_to_project_intake')
  assertNoLeadPayloadKeys(task.payload)
  assertNoLeadValues(task.title)
  assertNoLeadValues(task.payload)
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

test('keeps created lead workflow event payload free of contact values', async () => {
  const payload = createFakePayload()
  const richLead = {
    ...lead,
    company: 'Sensitive Company',
    audience: 'Private buyer segment',
    deadline: 'Before acquisition announcement',
    current_url: 'https://example.com/private-roadmap',
    budget_range: '$50k confidential',
    message: 'Contact me about the confidential launch.',
    referrer: 'https://referrer.example/private-source',
    correlation_id: 'corr-event',
    idempotency_key: ''
  }

  await createLeadWorkflow(payload, richLead)

  const eventPayload = payload.store['workflow-events'][0]?.payload
  assertRecord(eventPayload)
  assert.equal(eventPayload.title, 'Review lead: Website (#1)')
  assertNoLeadPayloadKeys(eventPayload)
  assertNoLeadValues(eventPayload, richLead)
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

test('treats changed company or budget as idempotency collisions', async () => {
  for (const changedFields of [{ company: 'Changed Co' }, { budget_range: '$25k-$50k' }]) {
    const payload = createFakePayload()
    const input = {
      ...lead,
      correlation_id: 'corr-collision',
      idempotency_key: 'lead:collision-content'
    }

    await createLeadWorkflow(payload, input)
    const collision = await createLeadWorkflow(payload, {
      ...input,
      ...changedFields
    })

    assert.equal(collision.collision, true)
    assert.equal(collision.deduplicated, false)
    assert.equal(payload.store.leads.length, 1)
    assert.equal(payload.store.tasks.length, 2)
    assert.equal(payload.store.tasks[1]?.state, 'blocked')
  }
})

test('keeps idempotency collision payloads to mismatched field names', async () => {
  const payload = createFakePayload()
  const input = {
    ...lead,
    budget_range: '$10k',
    correlation_id: 'corr-collision',
    idempotency_key: 'lead:collision-fields'
  }

  await createLeadWorkflow(payload, input)
  await createLeadWorkflow(payload, {
    ...input,
    email: 'other@example.com',
    company: 'Other Company',
    budget_range: '$50k',
    message: 'Different private request.'
  })

  const collisionTask = payload.store.tasks[1]
  assert.equal(collisionTask?.title, 'Review lead idempotency collision (#1)')
  assertRecord(collisionTask?.payload)
  assert.deepEqual(collisionTask.payload.mismatched_fields, ['email', 'company', 'budgetRange', 'message'])
  assert.equal(collisionTask.payload.collision, true)
  assert.equal(collisionTask.payload.existing_lead_id, '1')
  assert.equal(collisionTask.payload.next_action, 'manual_review_idempotency_collision')
  assertNoSubmittedCurrentValues(collisionTask.payload)

  const collisionEventPayload = payload.store['workflow-events'][1]?.payload
  assertRecord(collisionEventPayload)
  assert.deepEqual(collisionEventPayload.mismatched_fields, ['email', 'company', 'budgetRange', 'message'])
  assertNoSubmittedCurrentValues(collisionEventPayload)
})

function assertNoLeadPayloadKeys(payload: unknown) {
  assertRecord(payload)
  for (const key of [
    'name',
    'email',
    'company',
    'audience',
    'deadline',
    'current_url',
    'budget_range',
    'message',
    'referrer'
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(payload, key), false, `payload includes ${key}`)
  }
}

function assertNoLeadValues(value: unknown, submittedLead = lead) {
  const serialized = JSON.stringify(value)
  for (const sensitiveValue of [
    submittedLead.name,
    submittedLead.email,
    submittedLead.company,
    submittedLead.audience,
    submittedLead.deadline,
    submittedLead.current_url,
    submittedLead.budget_range,
    submittedLead.message,
    submittedLead.referrer
  ]) {
    if (sensitiveValue) {
      assert.equal(serialized.includes(sensitiveValue), false, `payload includes ${sensitiveValue}`)
    }
  }
}

function assertNoSubmittedCurrentValues(payload: Record<string, unknown>) {
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'submitted'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'current'), false)
  for (const value of [
    'jan@example.com',
    'other@example.com',
    'Example',
    'Other Company',
    '$10k',
    '$50k',
    'Need a website.',
    'Different private request.'
  ]) {
    assert.equal(JSON.stringify(payload).includes(value), false, `collision payload includes ${value}`)
  }
}

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  assert.equal(typeof value, 'object')
  assert.notEqual(value, null)
  assert.equal(Array.isArray(value), false)
}

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
