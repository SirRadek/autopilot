import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload } from 'payload'

import {
  buildHlidacStatuSearchUrl,
  mapHtmlPageToOpportunityRow,
  mapHlidacStatuTenderToOpportunityRow,
  runLiveWebSourceImport,
  runHlidacStatuLiveSearch
} from '@/lib/live-opportunities'

const tender = {
  id: 'vz-1',
  nazevZakazky: 'Dodavka weboveho portalu a CMS',
  popisZakazky: 'Predmetem je vytvoreni weboveho portalu, integrace a sprava obsahu.',
  cpv: ['72000000', '72212224'],
  datumUverejneni: '2026-06-14T06:00:00.000Z',
  lhutaDoruceni: '2026-07-01T10:00:00.000Z',
  posledniZmena: '2026-06-14T07:00:00.000Z',
  odhadovanaHodnotaBezDPH: 250000,
  odhadovanaHodnotaMena: 'CZK',
  zadavatel: {
    ico: '00000001',
    jmeno: 'Mesto Test'
  },
  urlZakazky: ['https://www.hlidacstatu.cz/verejnezakazky/zakazka/vz-1']
}

const htmlPage = `
  <html>
    <head>
      <title>Webovy portal a CMS pro firmu</title>
      <meta name="description" content="Hledame dodavatele pro web, CMS a API integraci.">
      <meta property="article:published_time" content="2026-06-14T08:00:00.000Z">
      <meta property="article:modified_time" content="2026-06-14T08:30:00.000Z">
    </head>
    <body>
      <main>
        <p>Termin pro podani nabidek: 20. 06. 2026 do 11:00 hodin</p>
        <p>Kontaktujte Janu Novou na jana@example.cz nebo +420 777 222 333.</p>
      </main>
    </body>
  </html>
`

test('maps a reviewed HTML page to a normalized opportunity row', () => {
  const row = mapHtmlPageToOpportunityRow({
    canonicalUrl: 'https://portal.example.cz/tenders/1#detail',
    html: htmlPage,
    now: new Date('2026-06-14T09:00:00.000Z')
  })

  assert.equal(row.canonicalUrl, 'https://portal.example.cz/tenders/1')
  assert.equal(row.canonicalHost, 'portal.example.cz')
  assert.equal(row.title, 'Webovy portal a CMS pro firmu')
  assert.equal(row.contactEmail, 'jana@example.cz')
  assert.equal(row.contactPhone, '+420 777 222 333')
  assert.equal(row.publishedAt, '2026-06-14T08:00:00.000Z')
  assert.equal(row.sourceUpdatedAt, '2026-06-14T08:30:00.000Z')
  assert.equal(row.deadlineAt, '2026-06-20T11:00:00.000Z')
  assert.equal(row.sourceStatus, 'open')
  assert.equal(row.discoveredAt, '2026-06-14T09:00:00.000Z')
  assert.ok(row.serviceTags.includes('web'))
  assert.ok(row.serviceTags.includes('cms'))
  assert.ok(row.fitScore >= 70)
})

test('maps localized publish dates without treating them as phone numbers', () => {
  const row = mapHtmlPageToOpportunityRow({
    canonicalUrl: 'https://portal.example.cz/tenders/2',
    html: '<html><head><title>Technicka podpora software IBM II.</title></head><body>zalozeno 12. 6. 2026 Software podpora a sprava aplikace.</body></html>',
    now: new Date('2026-06-14T09:00:00.000Z')
  })

  assert.equal(row.publishedAt, '2026-06-12T00:00:00.000Z')
  assert.equal(row.contactPhone, '')
  assert.ok(row.serviceTags.includes('software'))
})

test('extracts source status and localized submission deadlines from demand detail pages', () => {
  const row = mapHtmlPageToOpportunityRow({
    canonicalUrl: 'https://www.poptavej.cz/poptavka/13573546-aktualizace-webovych-stranek',
    html: `
      <html>
        <head><title>Aktualizace webovych stranek</title></head>
        <body>
          <main>
            <p>Termin: - dohodou</p>
            <p>Overeno dne: 11.6.2026 14:33 Stav poptavky: stale aktivni</p>
            <p>Termin pro podani nabidek: 25. 06. 2026 do 09:30 hodin</p>
          </main>
        </body>
      </html>
    `,
    now: new Date('2026-06-14T09:00:00.000Z')
  })

  assert.equal(row.publishedAt, '2026-06-11T14:33:00.000Z')
  assert.equal(row.sourceUpdatedAt, '2026-06-11T14:33:00.000Z')
  assert.equal(row.deadlineAt, '2026-06-25T09:30:00.000Z')
  assert.equal(row.sourceStatus, 'open')
})

test('marks details closed when source status says the demand is finished', () => {
  const row = mapHtmlPageToOpportunityRow({
    canonicalUrl: 'https://zakazka.sluzby.cz/poptavam-webove-stranky-1',
    html: '<html><head><title>Poptavam webove stranky</title></head><body>Uspesne ukonceno Vlozeno: 30. 8. 2023, 14:59</body></html>',
    now: new Date('2026-06-14T09:00:00.000Z')
  })

  assert.equal(row.publishedAt, '2023-08-30T14:59:00.000Z')
  assert.equal(row.sourceStatus, 'closed')
})

test('extracts publication dates from CZ and SK public procurement detail labels', () => {
  const row = mapHtmlPageToOpportunityRow({
    canonicalUrl: 'https://www.mojedopyty.sk/dopyt/1983967-mini-pc-na-spracovanie-udajov',
    html: `
      <html>
        <head><title>Mini PC na spracovanie udajov</title></head>
        <body>
          <main>
            <p>Termin pre podanie ponuk: - 15. 06. 2026 do 11:30 hod.</p>
            <p>Datum publikacie: 11. 6. 2026 21:33 Identifikator: 1983967</p>
          </main>
        </body>
      </html>
    `,
    now: new Date('2026-06-14T09:00:00.000Z')
  })

  assert.equal(row.publishedAt, '2026-06-11T21:33:00.000Z')
  assert.equal(row.deadlineAt, '2026-06-15T11:30:00.000Z')
  assert.equal(row.sourceStatus, 'open')
})

test('prefers structured page fields and JSON-LD date over full document navigation', () => {
  const row = mapHtmlPageToOpportunityRow({
    canonicalUrl: 'https://portal.example.cz/tenders/3',
    html: `
      <html>
        <head>
          <title>Foto/Webove stranky</title>
          <script type="application/ld+json">{"datePublished":"2026-06-11T19:34:05+00:00"}</script>
        </head>
        <body>
          <nav>Awards Prace Prodej Poptavky</nav>
          <div class="field"><div class="label">Kategorie</div><div class="value">WordPress</div></div>
          <div class="field"><div class="label">Rozpocet</div><div class="value">2 - 10 tisic Kc</div></div>
          <article>Tato poptavka je dostupna v Premium clenstvi.</article>
        </body>
      </html>
    `,
    now: new Date('2026-06-14T09:00:00.000Z')
  })

  assert.equal(row.publishedAt, '2026-06-11T19:34:05.000Z')
  assert.match(row.description, /Kategorie: WordPress/)
  assert.match(row.description, /Rozpocet: 2 - 10 tisic Kc/)
  assert.equal(row.description.includes('Awards Prace'), false)
})

test('blocks a live web source URL outside the configured host allowlist before fetch', async () => {
  const payload = createFakePayload()
  await seedLiveWebSource(payload)
  let called = false

  await assert.rejects(
    runLiveWebSourceImport({
      payload,
      sourceKey: 'reviewed-web-cz-it',
      urls: ['https://evil.example/tenders/1'],
      fetchFn: async () => {
        called = true
        return new Response('')
      }
    }),
    /host is not allowed/
  )

  assert.equal(called, false)
})

test('blocks non-web sources on the generic live web route', async () => {
  const payload = createFakePayload()
  await payload.create({
    collection: 'opportunity-sources',
    data: {
      sourceKey: 'fixture-cz-it',
      name: 'Fixture CZ IT Opportunities',
      sourceType: 'fixture',
      enabled: true,
      termsReviewedAt: '2026-06-14T00:00:00.000Z',
      robotsReviewedAt: '2026-06-14T00:00:00.000Z',
      allowedHosts: [{ host: 'portal.example.cz' }]
    }
  })

  await assert.rejects(
    runLiveWebSourceImport({
      payload,
      sourceKey: 'fixture-cz-it',
      urls: ['https://portal.example.cz/tenders/1'],
      fetchFn: async () => new Response('')
    }),
    /sourceType=web/
  )
})

test('respects robots policy before fetching a reviewed web page', async () => {
  const payload = createFakePayload()
  await seedLiveWebSource(payload)
  let pageFetched = false

  await assert.rejects(
    runLiveWebSourceImport({
      payload,
      sourceKey: 'reviewed-web-cz-it',
      urls: ['https://portal.example.cz/private/tender-1'],
      fetchFn: async (url) => {
        const target = new URL(url.toString())
        if (target.pathname === '/robots.txt') {
          return new Response('User-agent: *\nDisallow: /private\n')
        }

        pageFetched = true
        return new Response(htmlPage, { headers: { 'content-type': 'text/html' } })
      }
    }),
    /no importable rows/
  )

  assert.equal(pageFetched, false)
})

test('runs a live web source through importer with mocked page fetches', async () => {
  const payload = createFakePayload()
  await seedLiveWebSource(payload)

  const result = await runLiveWebSourceImport({
    payload,
    sourceKey: 'reviewed-web-cz-it',
    urls: ['https://portal.example.cz/tenders/1'],
    now: new Date('2026-06-14T09:00:00.000Z'),
    fetchFn: async (url) => {
      const target = new URL(url.toString())
      if (target.pathname === '/robots.txt') {
        return new Response('User-agent: *\nAllow: /\n')
      }

      return new Response(htmlPage, { headers: { 'content-type': 'text/html' } })
    }
  })

  assert.equal(result.import.created, 1)
  assert.equal(result.provider.urlCount, 1)
  assert.equal(result.provider.fetchedUrlCount, 1)
  assert.equal(result.provider.skippedByRobots, 0)
  assert.equal(payload.store['opportunity-items'].length, 1)
  assert.equal(payload.store['opportunity-items'][0]?.sourceKey, 'reviewed-web-cz-it')
  assert.equal(payload.store['opportunity-items'][0]?.contactEmail, 'jana@example.cz')
})

test('builds Hlidac Statu IT public procurement search URL with bounded live parameters', () => {
  const url = buildHlidacStatuSearchUrl({
    baseUrl: 'https://api.hlidacstatu.cz',
    query: 'web OR cms OR portál OR software',
    publishedFrom: '2026-06-01T00:00:00.000Z',
    page: 1
  })

  assert.equal(url.origin, 'https://api.hlidacstatu.cz')
  assert.equal(url.pathname, '/api/v2/verejnezakazky/hledat')
  assert.equal(url.searchParams.get('oblast'), 'IT')
  assert.equal(url.searchParams.get('razeni'), '1')
  assert.equal(url.searchParams.get('strana'), '1')
  assert.equal(url.searchParams.get('zverejnenoOd'), '2026-06-01T00:00:00.000Z')
  assert.match(url.searchParams.get('dotaz') ?? '', /software/)
})

test('maps Hlídač Státu tender result to a PII-minimized opportunity row', () => {
  const row = mapHlidacStatuTenderToOpportunityRow(tender)

  assert.equal(row.sourceItemId, 'vz-1')
  assert.equal(row.canonicalHost, 'www.hlidacstatu.cz')
  assert.equal(row.title, 'Dodavka weboveho portalu a CMS')
  assert.equal(row.fitScore >= 70, true)
  assert.ok(row.serviceTags.includes('web'))
  assert.ok(row.serviceTags.includes('cms'))
  assert.equal(row.requesterName, 'Mesto Test')
  assert.equal(row.contactEmail, '')
  assert.equal(row.contactPhone, '')
  assert.equal(row.sourceStatus, 'open')
  assert.equal(row.publishedAt, '2026-06-14T06:00:00.000Z')
  assert.equal(row.sourceUpdatedAt, '2026-06-14T07:00:00.000Z')
  assert.equal(row.deadlineAt, '2026-07-01T10:00:00.000Z')
  assert.equal(row.discoveredAt, '2026-06-14T07:00:00.000Z')
})

test('blocks live Hlídač run before fetch when token or commercial approval is missing', async () => {
  let called = false

  await assert.rejects(
    runHlidacStatuLiveSearch({
      payload: createFakePayload(),
      apiToken: '',
      commercialApproved: true,
      fetchFn: async () => {
        called = true
        return new Response('{}')
      }
    }),
    /HLIDAC_STATU_API_TOKEN/
  )

  await assert.rejects(
    runHlidacStatuLiveSearch({
      payload: createFakePayload(),
      apiToken: 'token',
      commercialApproved: false,
      fetchFn: async () => {
        called = true
        return new Response('{}')
      }
    }),
    /commercial approval/
  )

  assert.equal(called, false)
})

test('runs live Hlídač search through importer with a mocked provider response', async () => {
  const payload = createFakePayload()
  await payload.create({
    collection: 'opportunity-sources',
    data: {
      sourceKey: 'hlidac-statu-vz-it',
      name: 'Hlídač Státu Veřejné Zakázky IT',
      enabled: true,
      termsReviewedAt: '2026-06-14T00:00:00.000Z',
      allowedHosts: [{ host: 'www.hlidacstatu.cz' }]
    }
  })

  const result = await runHlidacStatuLiveSearch({
    payload,
    apiToken: 'token',
    commercialApproved: true,
    now: new Date('2026-06-14T08:00:00.000Z'),
    fetchFn: async (url, init) => {
      assert.equal(url.toString().includes('/api/v2/verejnezakazky/hledat'), true)
      assert.equal(init?.headers instanceof Headers, true)
      assert.equal((init?.headers as Headers).get('authorization'), 'Token token')
      return Response.json({
        total: 1,
        page: 1,
        results: [tender]
      })
    }
  })

  assert.equal(result.import.created, 1)
  assert.equal(result.provider.total, 1)
  assert.equal(payload.store['opportunity-items'].length, 1)
  assert.equal(payload.store['opportunity-items'][0]?.sourceKey, 'hlidac-statu-vz-it')
  assert.equal(payload.store['opportunity-items'][0]?.contactEmail, '')
})

async function seedLiveWebSource(payload: ReturnType<typeof createFakePayload>) {
  await payload.create({
    collection: 'opportunity-sources',
    data: {
      sourceKey: 'reviewed-web-cz-it',
      name: 'Reviewed CZ/SK IT Web Sources',
      sourceType: 'web',
      enabled: true,
      termsReviewedAt: '2026-06-14T00:00:00.000Z',
      robotsReviewedAt: '2026-06-14T00:00:00.000Z',
      maxUrlsPerRun: 10,
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
