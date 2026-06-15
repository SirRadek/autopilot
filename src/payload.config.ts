import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

import { Clients } from '@/collections/Clients'
import { Forms } from '@/collections/Forms'
import { Leads } from '@/collections/Leads'
import { OpportunityItems } from '@/collections/OpportunityItems'
import { OpportunityReviews } from '@/collections/OpportunityReviews'
import { OpportunityRuns } from '@/collections/OpportunityRuns'
import { OpportunitySources } from '@/collections/OpportunitySources'
import { Pages } from '@/collections/Pages'
import { Projects } from '@/collections/Projects'
import { Sites } from '@/collections/Sites'
import { Tasks } from '@/collections/Tasks'
import { Users } from '@/collections/Users'
import { WorkflowEvents } from '@/collections/WorkflowEvents'
import { SiteSettings } from '@/globals/SiteSettings'

export default buildConfig({
  admin: {
    user: Users.slug
  },
  collections: [
    Users,
    Clients,
    Projects,
    Sites,
    Pages,
    Forms,
    Leads,
    OpportunitySources,
    OpportunityRuns,
    OpportunityItems,
    OpportunityReviews,
    Tasks,
    WorkflowEvents
  ],
  globals: [SiteSettings],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL
    }
  }),
  secret: process.env.PAYLOAD_SECRET || 'dev-only-replace-with-PAYLOAD_SECRET',
  typescript: {
    outputFile: 'src/payload-types.ts'
  },
  cors: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
  csrf: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000']
})
