import nextEnv from '@next/env'
import type { getPayload as getPayloadType } from 'payload'

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

type SeedPayload = Awaited<ReturnType<typeof getPayloadType>>
type SeedDocument = { id: string | number }

async function main() {
  const [{ default: config }, { getPayload }] = await Promise.all([import('@payload-config'), import('payload')])
  const payload = await getPayload({ config })

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.SEED_ADMIN_PASSWORD || 'change-me-locally'

  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: email
      }
    },
    overrideAccess: true,
    limit: 1
  })

  if (existingUsers.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name: 'Admin',
        roles: ['admin']
      },
      overrideAccess: true
    })
    console.log(`Created admin user: ${email}`)
  } else {
    console.log(`Admin user already exists: ${email}`)
  }

  const client = await upsertByName(payload, 'clients', 'Radeq.cz', {
    name: 'Radeq.cz',
    status: 'active',
    primaryContact: 'Radek Siroky',
    primaryEmail: email,
    notes: 'Seed record for the first owned web property.'
  })

  const project = await upsertByTitle(payload, 'projects', 'Radeq lead capture and CMS', {
    title: 'Radeq lead capture and CMS',
    client: client.id,
    status: 'active',
    projectType: 'website',
    primaryStack: 'Astro + Payload CMS + Postgres',
    productionUrl: 'https://radeq.cz',
    description: 'Owned website and lead workflow foundation.'
  })

  const site = await upsertByName(payload, 'sites', 'Radeq.cz', {
    name: 'Radeq.cz',
    client: client.id,
    project: project.id,
    domain: 'radeq.cz',
    status: 'live',
    framework: 'astro',
    deploymentProvider: 'cloudflare_pages'
  })

  await upsertByTitle(payload, 'forms', 'Website project request', {
    title: 'Website project request',
    site: site.id,
    slug: 'website-project-request',
    status: 'active',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'project_type', label: 'Project type', type: 'select', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true }
    ],
    successMessage: 'Diky, poptavka byla ulozena.'
  })

  await upsertOpportunitySource(payload, 'fixture-cz-it', {
    sourceKey: 'fixture-cz-it',
    name: 'Fixture CZ IT Opportunities',
    sourceType: 'fixture',
    enabled: true,
    locale: 'cs',
    allowedHosts: [{ host: 'portal.example.cz' }],
    termsReviewedAt: '2026-06-13T00:00:00.000Z',
    robotsReviewedAt: '2026-06-13T00:00:00.000Z',
    maxUrlsPerRun: 10,
    notes: 'Local fixture-only source for pre-live opportunity ingest verification.'
  })

  await upsertOpportunitySource(payload, 'reviewed-web-cz-it', {
    sourceKey: 'reviewed-web-cz-it',
    name: 'Reviewed CZ/SK IT Web Sources',
    sourceType: 'web',
    enabled: true,
    locale: 'cs',
    allowedHosts: [{ host: 'portal.example.cz' }],
    termsReviewedAt: '2026-06-14T00:00:00.000Z',
    robotsReviewedAt: '2026-06-14T00:00:00.000Z',
    maxUrlsPerRun: 10,
    notes:
      'Default generic web-source runner for reviewed demand/project pages. Add real hosts in Payload only after terms and robots review.'
  })

  await upsertOpportunitySource(payload, 'hlidac-statu-vz-it', {
    sourceKey: 'hlidac-statu-vz-it',
    name: 'Hlidac Statu Verejne Zakazky IT',
    sourceType: 'api',
    enabled: false,
    locale: 'cs',
    allowedHosts: [{ host: 'www.hlidacstatu.cz' }],
    termsReviewedAt: '2026-06-14T00:00:00.000Z',
    robotsReviewedAt: '2026-06-14T00:00:00.000Z',
    maxUrlsPerRun: 10,
    notes:
      'Parked disabled API source. Not required for the default live flow. Runtime route is disabled until a future owner re-enable decision.'
  })

  console.log('Seed complete.')
}

async function upsertByName(
  payload: SeedPayload,
  collection: 'clients' | 'sites',
  name: string,
  data: Record<string, unknown>
): Promise<SeedDocument> {
  const existing = await payload.find({
    collection,
    where: { name: { equals: name } },
    limit: 1,
    overrideAccess: true
  })

  if (existing.docs[0]) {
    return payload.update({
      collection,
      id: existing.docs[0].id,
      data: data as never,
      overrideAccess: true
    }) as Promise<SeedDocument>
  }

  return payload.create({ collection, data: data as never, overrideAccess: true }) as Promise<SeedDocument>
}

async function upsertByTitle(
  payload: SeedPayload,
  collection: 'projects' | 'forms',
  title: string,
  data: Record<string, unknown>
): Promise<SeedDocument> {
  const existing = await payload.find({
    collection,
    where: { title: { equals: title } },
    limit: 1,
    overrideAccess: true
  })

  if (existing.docs[0]) {
    return payload.update({
      collection,
      id: existing.docs[0].id,
      data: data as never,
      overrideAccess: true
    }) as Promise<SeedDocument>
  }

  return payload.create({ collection, data: data as never, overrideAccess: true }) as Promise<SeedDocument>
}

async function upsertOpportunitySource(
  payload: SeedPayload,
  sourceKey: string,
  data: Record<string, unknown>
): Promise<SeedDocument> {
  const existing = await payload.find({
    collection: 'opportunity-sources',
    where: { sourceKey: { equals: sourceKey } },
    limit: 1,
    overrideAccess: true
  })

  if (existing.docs[0]) {
    return payload.update({
      collection: 'opportunity-sources',
      id: existing.docs[0].id,
      data: data as never,
      overrideAccess: true
    }) as Promise<SeedDocument>
  }

  return payload.create({ collection: 'opportunity-sources', data: data as never, overrideAccess: true }) as Promise<SeedDocument>
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
