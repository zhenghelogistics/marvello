export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { platformCredentials } from '@/lib/db/schema'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const creds = await db.select().from(platformCredentials)

  const savedPlatforms = Object.fromEntries(
    creds.map(c => [c.platform, {
      hasToken: !!c.accessToken,
      pageId: c.pageId ?? undefined,
      orgId: c.orgId ?? undefined,
      updatedAt: c.updatedAt.toISOString(),
    }])
  ) as Record<string, { hasToken: boolean; pageId?: string; orgId?: string; updatedAt: string }>

  return <SettingsClient savedPlatforms={savedPlatforms} />
}
