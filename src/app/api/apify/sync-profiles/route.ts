import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsSnapshots } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { scrapeOwnProfiles, collectProfileMetrics } from '@/lib/apify'

export async function POST() {
  try {
    // Kick off all three profile scrapes
    const runIds = await scrapeOwnProfiles()

    // Wait for results (each run waits up to 90s independently)
    const metrics = await collectProfileMetrics(runIds)

    if (Object.keys(metrics).length === 0) {
      return NextResponse.json({ error: 'All Apify runs timed out or failed' }, { status: 502 })
    }

    const synced: string[] = []

    for (const [platform, data] of Object.entries(metrics)) {
      const p = platform as 'linkedin' | 'instagram' | 'facebook'

      // Upsert — delete existing then insert fresh
      await db.delete(analyticsSnapshots).where(eq(analyticsSnapshots.platform, p))
      await db.insert(analyticsSnapshots).values({
        id: crypto.randomUUID(),
        platform: p,
        period: '30d',
        impressions: data.impressions,
        reach: data.reach,
        engagement: data.engagement,
        followers: data.followers,
        followersGrowth: data.followersGrowth,
        postsCount: data.postsCount,
        syncedAt: new Date(),
      })
      synced.push(platform)
    }

    return NextResponse.json({ synced, runIds })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
