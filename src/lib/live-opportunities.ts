import { createHash } from 'node:crypto'

import type { Payload } from 'payload'

import type { OpportunityImportResult, OpportunityIngestRow } from '@/lib/opportunities'
import { createOpportunityImport } from '@/lib/opportunities'

const hlidacSourceKey = 'hlidac-statu-vz-it'
const defaultHlidacBaseUrl = 'https://api.hlidacstatu.cz'
const defaultHlidacQuery = 'web OR cms OR portal OR software OR informacni system OR aplikace'
const defaultWebFetchUserAgent = 'AutopilotOpportunityMonitor/0.1'
const defaultMaxUrlsPerRun = 10

export interface HlidacStatuTender {
  id?: unknown
  nazevZakazky?: unknown
  popisZakazky?: unknown
  popisZakazkyRozza?: unknown
  cpv?: unknown
  datumUverejneni?: unknown
  lhutaDoruceni?: unknown
  lhutaPrihlaseni?: unknown
  posledniZmena?: unknown
  lastUpdated?: unknown
  odhadovanaHodnotaBezDPH?: unknown
  odhadovanaHodnotaMena?: unknown
  zadavatel?: unknown
  urlZakazky?: unknown
}

export interface HlidacStatuLiveRunResult {
  sourceKey: typeof hlidacSourceKey
  provider: {
    total: number
    page: number
    rowCount: number
  }
  import: OpportunityImportResult
}

export interface LiveWebSourceRunResult {
  sourceKey: string
  provider: {
    urlCount: number
    fetchedUrlCount: number
    skippedByRobots: number
    importedRowCount: number
  }
  import: OpportunityImportResult
}

export interface HtmlOpportunityPageInput {
  canonicalUrl: string
  html: string
  now?: Date
}

export function buildHlidacStatuSearchUrl(input: {
  baseUrl?: string
  query?: string
  publishedFrom?: string
  page?: number
}): URL {
  const url = new URL('/api/v2/verejnezakazky/hledat', input.baseUrl || defaultHlidacBaseUrl)
  url.searchParams.set('oblast', 'IT')
  url.searchParams.set('dotaz', input.query || defaultHlidacQuery)
  url.searchParams.set('razeni', '1')
  url.searchParams.set('strana', String(boundedInteger(input.page, 1, 250, 1)))

  if (input.publishedFrom) {
    url.searchParams.set('zverejnenoOd', input.publishedFrom)
  }

  return url
}

export function mapHlidacStatuTenderToOpportunityRow(tender: HlidacStatuTender): OpportunityIngestRow {
  const id = sanitizeString(tender.id, 180) || stableHash(tender).slice(0, 24)
  const title = sanitizeString(tender.nazevZakazky, 240) || `Verejna zakazka ${id}`
  const description = sanitizeString(tender.popisZakazky, 1200) || sanitizeString(tender.popisZakazkyRozza, 1200)
  const publishedAt = normalizeDateString(tender.datumUverejneni)
  const discoveredAt =
    normalizeDateString(tender.posledniZmena) ||
    normalizeDateString(tender.lastUpdated) ||
    publishedAt ||
    new Date().toISOString()
  const canonicalUrl =
    firstUrl(tender.urlZakazky) ||
    `https://www.hlidacstatu.cz/verejnezakazky/zakazka/${encodeURIComponent(id)}`
  const zadavatel = isObjectRecord(tender.zadavatel) ? tender.zadavatel : {}
  const requesterName = sanitizeString(zadavatel.jmeno, 160)
  const cpv = cpvList(tender.cpv)
  const tags = serviceTags(title, description, cpv)
  const budget = numberValue(tender.odhadovanaHodnotaBezDPH)
  const currency = sanitizeString(tender.odhadovanaHodnotaMena, 20)
  const deadline = normalizeDateString(tender.lhutaDoruceni) || normalizeDateString(tender.lhutaPrihlaseni)
  const sourceStatus = sourceStatusFromDeadline(deadline, new Date())
  const rawSnippet = [description, deadline ? `Lhuta: ${deadline}` : '', budget ? `Odhad: ${budget} ${currency}` : '']
    .filter(Boolean)
    .join(' | ')

  return {
    sourceItemId: id,
    canonicalUrl,
    canonicalHost: hostFromUrl(canonicalUrl),
    title,
    description,
    rawSnippet,
    rowFingerprint: stableHash({
      id,
      title,
      publishedAt,
      deadline,
      sourceStatus,
      cpv: cpv.join(',')
    }),
    fitScore: fitScore(tags, title, description),
    serviceTags: tags,
    requesterName,
    contactEmail: '',
    contactPhone: '',
    sourceStatus,
    publishedAt,
    sourceUpdatedAt: discoveredAt,
    deadlineAt: deadline,
    discoveredAt
  }
}

export function mapHtmlPageToOpportunityRow(input: HtmlOpportunityPageInput): OpportunityIngestRow {
  const canonicalUrl = canonicalizeUrl(input.canonicalUrl)
  const title = sanitizeString(extractTitle(input.html) || fallbackTitle(canonicalUrl), 240)
  const text = extractPrimaryPageText(input.html) || htmlToText(input.html)
  const description = sanitizeString(
    extractMeta(input.html, 'description') || extractJsonLdValue(input.html, 'description') || text.slice(0, 500),
    1200
  )
  const now = input.now ?? new Date()
  const sourceUpdatedAt =
    normalizeDateString(extractMeta(input.html, 'article:modified_time')) ||
    normalizeDateString(extractJsonLdValue(input.html, 'dateModified')) ||
    extractLabeledDate(text, sourceUpdatedDateLabels())
  const publishedAt =
    normalizeDateString(extractMeta(input.html, 'article:published_time')) ||
    normalizeDateString(extractJsonLdValue(input.html, 'datePublished')) ||
    normalizeDateString(extractFirstTime(input.html)) ||
    extractLabeledDate(text, publishedDateLabels()) ||
    sourceUpdatedAt
  const deadlineAt = extractLabeledDate(text, deadlineDateLabels())
  const sourceStatus = extractSourceStatus(text, deadlineAt, now)
  const discoveredAt = now.toISOString()
  const emails = extractEmails(text)
  const phones = extractPhones(text)
  const tags = serviceTags(title, description, [])

  return {
    sourceItemId: stableHash({ canonicalUrl }).slice(0, 40),
    canonicalUrl,
    canonicalHost: hostFromUrl(canonicalUrl),
    title,
    description,
    rawSnippet: sanitizeString(text, 1200),
    rowFingerprint: stableHash({
      canonicalUrl,
      title,
      description,
      publishedAt,
      sourceUpdatedAt,
      deadlineAt,
      sourceStatus,
      contactEmail: emails[0] || '',
      contactPhone: phones[0] || ''
    }),
    fitScore: fitScore(tags, title, description),
    serviceTags: tags,
    requesterName: sanitizeString(extractMeta(input.html, 'author') || extractMeta(input.html, 'og:site_name'), 160),
    contactEmail: emails[0] || '',
    contactPhone: phones[0] || '',
    sourceStatus,
    publishedAt,
    sourceUpdatedAt,
    deadlineAt,
    discoveredAt
  }
}

export async function runLiveWebSourceImport(input: {
  payload: Payload
  sourceKey: string
  urls?: unknown
  items?: unknown
  sourceRunId?: string
  idempotencyKey?: string
  correlationId?: string
  now?: Date
  fetchFn?: typeof fetch
  userAgent?: string
  maxUrls?: number
  checkRobots?: boolean
}): Promise<LiveWebSourceRunResult> {
  const sourceKey = sanitizeString(input.sourceKey, 120)
  if (!sourceKey) {
    throw new LiveOpportunitySourceError('Live web source key is required.', 400)
  }

  const source = await findLiveOpportunitySource(input.payload, sourceKey)
  assertSourceReady(source, sourceKey)

  const allowedHosts = allowedHostsFromSource(source)
  if (allowedHosts.length === 0) {
    throw new LiveOpportunitySourceError(`Live web source has no allowed hosts: ${sourceKey}`)
  }

  const now = input.now ?? new Date()
  const urlLimit = boundedInteger(
    input.maxUrls,
    1,
    Math.min(sourceMaxUrls(source) || defaultMaxUrlsPerRun, 50),
    sourceMaxUrls(source) || defaultMaxUrlsPerRun
  )
  const urls = normalizeUrls(input.urls, urlLimit)
  const suppliedRows = normalizeSuppliedRows(input.items)
  const fetchedRows: OpportunityIngestRow[] = []
  let skippedByRobots = 0

  if (urls.length === 0 && suppliedRows.length === 0) {
    throw new LiveOpportunitySourceError('Live web source requires at least one URL or normalized item.', 400)
  }

  for (const url of urls) {
    assertAllowedUrl(url, allowedHosts)
  }

  if (urls.length > 0 && !stringValue(source.robotsReviewedAt)) {
    throw new LiveOpportunitySourceError(`Live web source robots policy has not been reviewed: ${sourceKey}`)
  }

  const fetchFn = input.fetchFn ?? fetch
  const userAgent = sanitizeString(input.userAgent, 200) || defaultWebFetchUserAgent

  for (const url of urls) {
    if (input.checkRobots !== false) {
      const allowed = await isUrlAllowedByRobots(url, fetchFn, userAgent)
      if (!allowed) {
        skippedByRobots += 1
        continue
      }
    }

    const html = await fetchHtml(url, fetchFn, userAgent)
    fetchedRows.push(mapHtmlPageToOpportunityRow({ canonicalUrl: url.toString(), html, now }))
  }

  const items = [...suppliedRows, ...fetchedRows]
  if (items.length === 0) {
    throw new LiveOpportunitySourceError('Live web source produced no importable rows.')
  }

  const sourceRunId =
    sanitizeString(input.sourceRunId, 180) ||
    `${sourceKey}:${now.toISOString().slice(0, 10)}:${stableHash(urls.map((url) => url.toString())).slice(0, 12)}`
  const importResult = await createOpportunityImport(input.payload, {
    sourceKey,
    sourceRunId,
    idempotencyKey: sanitizeString(input.idempotencyKey, 180) || sourceRunId,
    correlationId: sanitizeString(input.correlationId, 180) || `web-source-${sourceKey}-${now.toISOString()}`,
    items
  })

  return {
    sourceKey,
    provider: {
      urlCount: urls.length,
      fetchedUrlCount: fetchedRows.length,
      skippedByRobots,
      importedRowCount: items.length
    },
    import: importResult
  }
}

export async function runHlidacStatuLiveSearch(input: {
  payload: Payload
  apiToken?: string
  commercialApproved?: boolean
  now?: Date
  page?: number
  publishedFrom?: string
  query?: string
  fetchFn?: typeof fetch
}): Promise<HlidacStatuLiveRunResult> {
  const token = input.apiToken?.trim()
  if (!token) {
    throw new LiveOpportunitySourceError('HLIDAC_STATU_API_TOKEN is required before running Hlidac Statu live source.')
  }

  if (!input.commercialApproved) {
    throw new LiveOpportunitySourceError('Hlidac Statu public procurement search requires explicit commercial approval.')
  }

  const now = input.now ?? new Date()
  const page = boundedInteger(input.page, 1, 250, 1)
  const publishedFrom = input.publishedFrom || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const url = buildHlidacStatuSearchUrl({
    query: input.query,
    publishedFrom,
    page
  })
  const headers = new Headers({ authorization: `Token ${token}` })
  const response = await (input.fetchFn ?? fetch)(url, { headers })

  if (!response.ok) {
    throw new LiveOpportunitySourceError(`Hlidac Statu API returned ${response.status}.`)
  }

  const providerPayload = await response.json()
  const resultRows = isObjectRecord(providerPayload) && Array.isArray(providerPayload.results)
    ? providerPayload.results
    : []
  const rows = resultRows.map((row) => mapHlidacStatuTenderToOpportunityRow(row as HlidacStatuTender))
  const sourceRunId = `${hlidacSourceKey}:${now.toISOString().slice(0, 10)}:page-${page}`
  const importResult = await createOpportunityImport(input.payload, {
    sourceKey: hlidacSourceKey,
    sourceRunId,
    idempotencyKey: sourceRunId,
    correlationId: `hlidac-statu-${now.toISOString()}`,
    items: rows
  })

  return {
    sourceKey: hlidacSourceKey,
    provider: {
      total: numberValue((providerPayload as Record<string, unknown>).total),
      page: numberValue((providerPayload as Record<string, unknown>).page) || 1,
      rowCount: rows.length
    },
    import: importResult
  }
}

async function findLiveOpportunitySource(payload: Payload, sourceKey: string) {
  const result = await payload.find({
    collection: 'opportunity-sources',
    where: { sourceKey: { equals: sourceKey } },
    limit: 1,
    overrideAccess: true
  })

  return result.docs[0]
}

function assertSourceReady(source: unknown, sourceKey: string): asserts source is Record<string, unknown> & { id: string | number } {
  if (!isObjectRecord(source)) {
    throw new LiveOpportunitySourceError(`Live web source is not configured: ${sourceKey}`)
  }

  if (source.enabled === false) {
    throw new LiveOpportunitySourceError(`Live web source is disabled: ${sourceKey}`)
  }

  if (!stringValue(source.termsReviewedAt)) {
    throw new LiveOpportunitySourceError(`Live web source terms have not been reviewed: ${sourceKey}`)
  }

  if (stringValue(source.sourceType) !== 'web') {
    throw new LiveOpportunitySourceError(`Live web source must have sourceType=web: ${sourceKey}`)
  }
}

function normalizeSuppliedRows(value: unknown): OpportunityIngestRow[] {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new LiveOpportunitySourceError('Live web source items must be an array.', 400)
  }

  return value as OpportunityIngestRow[]
}

function normalizeUrls(value: unknown, limit: number): URL[] {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new LiveOpportunitySourceError('Live web source urls must be an array.', 400)
  }

  return value.slice(0, limit).map((item, index) => {
    const candidate = sanitizeString(item, 1000)
    try {
      const url = new URL(candidate)
      url.hash = ''
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Unsupported protocol.')
      }
      return url
    } catch {
      throw new LiveOpportunitySourceError(`Live web source URL ${index} is invalid.`, 400)
    }
  })
}

function assertAllowedUrl(url: URL, allowedHosts: string[]) {
  const host = url.hostname.toLowerCase()
  if (!allowedHosts.includes(host)) {
    throw new LiveOpportunitySourceError(`Live web source URL host is not allowed: ${host}`)
  }
}

async function isUrlAllowedByRobots(url: URL, fetchFn: typeof fetch, userAgent: string): Promise<boolean> {
  const robotsUrl = new URL('/robots.txt', url.origin)
  const response = await fetchFn(robotsUrl, {
    headers: new Headers({
      accept: 'text/plain',
      'user-agent': userAgent
    })
  })

  if (response.status === 404) {
    return true
  }

  if (!response.ok) {
    throw new LiveOpportunitySourceError(`Robots policy could not be verified for ${url.hostname}: ${response.status}`)
  }

  return isPathAllowedByRobots(await response.text(), userAgent, `${url.pathname}${url.search}`)
}

function isPathAllowedByRobots(robotsText: string, userAgent: string, path: string): boolean {
  const product = userAgent.toLowerCase().split(/[\/\s;]/)[0]
  const groups: Array<{ agents: string[]; rules: Array<{ type: 'allow' | 'disallow'; path: string }> }> = []
  let current: { agents: string[]; rules: Array<{ type: 'allow' | 'disallow'; path: string }> } | undefined

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.split('#')[0]?.trim()
    if (!line) {
      current = undefined
      continue
    }

    const separator = line.indexOf(':')
    if (separator === -1) continue

    const key = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()

    if (key === 'user-agent') {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      continue
    }

    if ((key === 'allow' || key === 'disallow') && current) {
      current.rules.push({ type: key, path: value })
    }
  }

  const matchingRules = groups
    .filter((group) => group.agents.some((agent) => agent === '*' || product.includes(agent) || agent.includes(product)))
    .flatMap((group) => group.rules)
    .filter((rule) => rule.path && path.startsWith(rule.path))
    .sort((a, b) => b.path.length - a.path.length)

  const strongest = matchingRules[0]
  return strongest ? strongest.type === 'allow' : true
}

async function fetchHtml(url: URL, fetchFn: typeof fetch, userAgent: string): Promise<string> {
  const response = await fetchFn(url, {
    headers: new Headers({
      accept: 'text/html,application/xhtml+xml,text/plain;q=0.8',
      'user-agent': userAgent
    })
  })

  if (!response.ok) {
    throw new LiveOpportunitySourceError(`Live web source fetch failed for ${url.hostname}: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
    throw new LiveOpportunitySourceError(`Live web source returned unsupported content type: ${contentType}`)
  }

  return response.text()
}

function extractTitle(html: string): string {
  return decodeHtmlEntities(matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i))
}

function extractMeta(html: string, name: string): string {
  const escaped = escapeRegExp(name)
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'i')
  ]

  for (const pattern of patterns) {
    const value = matchFirst(html, pattern)
    if (value) return decodeHtmlEntities(value)
  }

  return ''
}

function extractFirstTime(html: string): string {
  return matchFirst(html, /<time[^>]+datetime=["']([^"']+)["'][^>]*>/i)
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function extractPrimaryPageText(html: string): string {
  return [extractLabeledFieldText(html), htmlToText(matchFirst(html, /<article[^>]*>([\s\S]*?)<\/article>/i))]
    .filter(Boolean)
    .join(' | ')
}

function publishedDateLabels(): string[] {
  return [
    'datum zadani',
    'datum podani',
    'datum publikace',
    'datum publikacie',
    'zverejneno',
    'zverejnene',
    'zverejnena',
    'vlozeno',
    'zalozeno',
    'date of publication',
    'data di pubblicazione'
  ]
}

function sourceUpdatedDateLabels(): string[] {
  return [
    'aktualizovano',
    'aktualizovane',
    'aktualizovana',
    'overeno dne',
    'overene dna',
    'posledni zmena',
    'posledna zmena',
    'datum posledniho uverejneni',
    'date modified'
  ]
}

function deadlineDateLabels(): string[] {
  return [
    'termin pro podani nabidek',
    'termin pre podanie ponuk',
    'termin podani',
    'termin podanie',
    'lehota na predkladanie ponuk',
    'lhuta pro doruceni',
    'lhuta doruceni',
    'deadline',
    'scadenza',
    'termine ultimo ricezione offerte'
  ]
}

function extractLabeledDate(text: string, labels: string[]): string {
  const folded = foldText(text).toLowerCase()

  for (const label of labels) {
    let start = 0
    while (start < folded.length) {
      const index = folded.indexOf(label, start)
      if (index === -1) break

      const parsed = extractFirstDateCandidate(text.slice(index, index + 420))
      if (parsed) return parsed
      start = index + label.length
    }
  }

  return ''
}

function extractFirstDateCandidate(text: string): string {
  const isoMatch = text.match(/\b20\d{2}-\d{1,2}-\d{1,2}(?:[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?\b/)
  const isoDate = normalizeDateString(isoMatch?.[0])
  if (isoDate) return isoDate

  const numericMatch = text.match(
    /(?<!\d)(\d{1,2})\s*[.\/]\s*(\d{1,2})\s*[.\/]\s*(20\d{2})(?:[,\s]*(?:do|o|at)?\s*(\d{1,2})[:.](\d{2}))?/i
  )
  if (numericMatch) {
    return dateFromParts(
      Number(numericMatch[1]),
      Number(numericMatch[2]),
      Number(numericMatch[3]),
      numericMatch[4] ? Number(numericMatch[4]) : 0,
      numericMatch[5] ? Number(numericMatch[5]) : 0
    )
  }

  const folded = foldText(text).toLowerCase()
  const monthMatch = folded.match(
    /(?<!\d)(\d{1,2})\s+(ledna|unora|brezna|dubna|kvetna|cervna|cervence|srpna|zari|rijna|listopadu|prosince|januara|februara|marca|aprila|maja|juna|jula|augusta|septembra|oktobra|novembra|decembra|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})(?:[,\s]*(?:do|o|at)?\s*(\d{1,2})[:.](\d{2}))?/i
  )

  if (!monthMatch) return ''

  const month = monthNumber(monthMatch[2] || '')
  return month
    ? dateFromParts(
        Number(monthMatch[1]),
        month,
        Number(monthMatch[3]),
        monthMatch[4] ? Number(monthMatch[4]) : 0,
        monthMatch[5] ? Number(monthMatch[5]) : 0
      )
    : ''
}

function dateFromParts(day: number, month: number, year: number, hour = 0, minute = 0): string {
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    year < 2000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return ''
  }

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute
  ) {
    return ''
  }

  return date.toISOString()
}

function monthNumber(value: string): number {
  const months: Record<string, number> = {
    ledna: 1,
    unora: 2,
    brezna: 3,
    dubna: 4,
    kvetna: 5,
    cervna: 6,
    cervence: 7,
    srpna: 8,
    zari: 9,
    rijna: 10,
    listopadu: 11,
    prosince: 12,
    januara: 1,
    februara: 2,
    marca: 3,
    aprila: 4,
    maja: 5,
    juna: 6,
    jula: 7,
    augusta: 8,
    septembra: 9,
    oktobra: 10,
    novembra: 11,
    decembra: 12,
    gennaio: 1,
    febbraio: 2,
    marzo: 3,
    aprile: 4,
    maggio: 5,
    giugno: 6,
    luglio: 7,
    agosto: 8,
    settembre: 9,
    ottobre: 10,
    novembre: 11,
    dicembre: 12,
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
  }

  return months[value] || 0
}

function extractSourceStatus(text: string, deadlineAt: string, now: Date): 'open' | 'closed' | 'unknown' {
  const folded = foldText(text).toLowerCase()

  if (/(stav poptavky|stav dopytu)\s*:\s*(stale\s+)?aktivn/.test(folded)) {
    return 'open'
  }

  if (
    /(stav poptavky|stav dopytu)\s*:\s*ukoncen/.test(folded) ||
    /uspesne ukonceno|uspesne ukoncene|uzavrena|uzavrene|closed|expired/.test(folded)
  ) {
    return 'closed'
  }

  return sourceStatusFromDeadline(deadlineAt, now)
}

function sourceStatusFromDeadline(deadlineAt: string, now: Date): 'open' | 'closed' | 'unknown' {
  if (!deadlineAt) return 'unknown'
  const deadline = new Date(deadlineAt)
  if (Number.isNaN(deadline.getTime())) return 'unknown'
  return deadline.getTime() >= now.getTime() ? 'open' : 'closed'
}

function foldText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function extractLabeledFieldText(html: string): string {
  const fields = [
    ...html.matchAll(
      /<div class=["']field["'][^>]*>\s*<div class=["']label["'][^>]*>([\s\S]*?)<\/div>\s*<div class=["']value["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi
    )
  ]
    .map((match) => {
      const label = htmlToText(match[1] || '')
      const value = htmlToText(match[2] || '')
      return label && value ? `${label}: ${value}` : ''
    })
    .filter(Boolean)

  return fields.join(' | ')
}

function extractJsonLdValue(html: string, key: string): string {
  const escaped = escapeRegExp(key)
  const pattern = new RegExp(`"${escaped}"\\s*:\\s*"([^"]*)"`, 'i')
  const value = matchFirst(html, pattern)
  return value ? decodeHtmlEntities(value.replace(/\\\//g, '/')) : ''
}

function extractEmails(text: string): string[] {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
  return [...new Set(matches.map((value) => value.toLowerCase()))].slice(0, 3)
}

function extractPhones(text: string): string[] {
  const matches = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []
  return [
    ...new Set(
      matches
        .map((value) => sanitizeString(value, 80))
        .filter((value) => {
          const digits = value.replace(/\D/g, '')
          return digits.length >= 9 && !/^\d{1,2}\.\s*\d{1,2}\.\s*\d{4}$/.test(value)
        })
    )
  ].slice(0, 3)
}

function serviceTags(title: string, description: string, cpv: string[]): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const tags = new Set<string>()

  if (/(web|portal|cms|strank)/i.test(text)) tags.add('web')
  if (/(cms|sprava obsahu)/i.test(text)) tags.add('cms')
  if (/(software|aplikace|informacni system)/i.test(text)) tags.add('software')
  if (/(integrace|api|crm)/i.test(text)) tags.add('integration')
  if (/(seo|vyhledavani)/i.test(text)) tags.add('seo')
  if (cpv.some((code) => code.startsWith('72') || code.startsWith('48'))) tags.add('it-procurement')

  return [...tags].slice(0, 12)
}

function fitScore(tags: string[], title: string, description: string): number {
  let score = 35 + tags.length * 10
  const text = `${title} ${description}`.toLowerCase()

  if (/(web|cms|software|aplikace|portal)/i.test(text)) score += 20
  if (/(integrace|api|crm|seo)/i.test(text)) score += 10

  return Math.min(score, 95)
}

function cpvList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => sanitizeString(item, 40)).filter(Boolean)
}

function firstUrl(value: unknown): string {
  if (!Array.isArray(value)) return ''
  for (const item of value) {
    const candidate = sanitizeString(item, 500)
    if (hostFromUrl(candidate)) return candidate
  }
  return ''
}

function allowedHostsFromSource(source: unknown): string[] {
  if (!isObjectRecord(source) || !Array.isArray(source.allowedHosts)) {
    return []
  }

  return source.allowedHosts
    .map((item) => (isObjectRecord(item) ? sanitizeString(item.host, 180).toLowerCase() : ''))
    .filter(Boolean)
}

function sourceMaxUrls(source: unknown): number {
  return isObjectRecord(source) ? numberValue(source.maxUrlsPerRun) : 0
}

function canonicalizeUrl(value: string): string {
  const url = new URL(value)
  url.hash = ''
  return url.toString()
}

function fallbackTitle(value: string): string {
  const url = new URL(value)
  return `${url.hostname}${url.pathname === '/' ? '' : url.pathname}`.slice(0, 240)
}

function hostFromUrl(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 80)
}

function matchFirst(value: string, pattern: RegExp): string {
  return pattern.exec(value)?.[1]?.trim() || ''
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sanitizeString(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength)
    : ''
}

function normalizeDateString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function boundedInteger(value: unknown, min: number, max: number, fallback: number): number {
  const number =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : fallback
  return Math.min(Math.max(Math.trunc(Number.isFinite(number) ? number : fallback), min), max)
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export class LiveOpportunitySourceError extends Error {
  constructor(message: string, readonly status = 412) {
    super(message)
  }
}
