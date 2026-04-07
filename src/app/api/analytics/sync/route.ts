import { db } from '@/lib/db'
import { analyticsSnapshots, platformCredentials } from '@/lib/db/schema'
import { syncLinkedInAnalytics } from '@/lib/platforms/linkedin'
import { getInstagramInsights } from '@/lib/platforms/instagram'
import { getFacebookInsights } from '@/lib/platforms/facebook'
import type { AnalyticsData } from '@/lib/platforms/types'

export async function POST() {
  const synced: string[] = []
  const errors: { platform: string; error: string }[] = []

  // Fetch all stored credentials
  const creds = await db.select().from(platformCredentials)

  for (const cred of creds) {
    if (!cred.accessToken) continue

    let data: AnalyticsData | null = null

    try {
      if (cred.platform === 'linkedin') {
        if (!cred.orgId) {
          errors.push({ platform: 'linkedin', error: 'Missing orgId for LinkedIn' })
          continue
        }
        data = await syncLinkedInAnalytics(cred.orgId, cred.accessToken)
      } else if (cred.platform === 'instagram') {
        if (!cred.pageId) {
          errors.push({ platform: 'instagram', error: 'Missing pageId (IG User ID) for Instagram' })
          continue
        }
        data = await getInstagramInsights(cred.pageId, cred.accessToken)
      } else if (cred.platform === 'facebook') {
        if (!cred.pageId) {
          errors.push({ platform: 'facebook', error: 'Missing pageId for Facebook' })
          continue
        }
        data = await getFacebookInsights(cred.pageId, cred.accessToken)
      }

      if (data) {
        await db
          .insert(analyticsSnapshots)
          .values({
            id: `${data.platform}-30d`,
            platform: data.platform,
            period: '30d',
            impressions: data.impressions,
            reach: data.reach,
            engagement: data.engagement,
            followers: data.followers,
            followersGrowth: data.followersGrowth,
            postsCount: data.postsCount,
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: analyticsSnapshots.id,
            set: {
              impressions: data.impressions,
              reach: data.reach,
              engagement: data.engagement,
              followers: data.followers,
              followersGrowth: data.followersGrowth,
              postsCount: data.postsCount,
              syncedAt: new Date(),
            },
          })

        synced.push(cred.platform)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      errors.push({ platform: cred.platform, error: message })
    }
  }

  return Response.json({ synced, errors })
}
