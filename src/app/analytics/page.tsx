export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { analyticsSnapshots } from '@/lib/db/schema'
import { mockAnalytics } from '@/lib/mock-data'
import { AnalyticsClient } from './analytics-client'
import type { AnalyticsSnapshot } from '@/types'
import type { Platform } from '@/types'

export default async function AnalyticsPage() {
  // Attempt to load real data from DB
  let snapshots: AnalyticsSnapshot[] = []
  let isLive = false

  try {
    const rows = await db.select().from(analyticsSnapshots)

    if (rows.length > 0) {
      snapshots = rows.map(row => ({
        platform: row.platform as Platform,
        period: row.period,
        impressions: row.impressions,
        reach: row.reach,
        engagement: row.engagement,
        followers: row.followers,
        followersGrowth: row.followersGrowth,
        posts: row.postsCount,
      }))
      isLive = true
    }
  } catch {
    // DB not available — fall through to mock data
  }

  const analytics = isLive ? snapshots : mockAnalytics

  return <AnalyticsClient analytics={analytics} isLive={isLive} />
}
