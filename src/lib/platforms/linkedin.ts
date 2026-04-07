import type { AnalyticsData } from './types'

const BASE = 'https://api.linkedin.com/v2'

async function linkedInFetch(path: string, token: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  })

  if (res.status === 401 || res.status === 403) {
    throw new Error('LinkedIn API: Invalid credentials')
  }

  if (!res.ok) {
    throw new Error(`LinkedIn API: Request failed with status ${res.status}`)
  }

  return res.json()
}

export async function getLinkedInFollowers(orgId: string, token: string): Promise<number> {
  const data = await linkedInFetch(
    `/networkSizes/urn:li:organization:${orgId}?edgeType=CompanyFollowedByMember`,
    token
  ) as { firstDegreeSize?: number }
  return data.firstDegreeSize ?? 0
}

export async function getLinkedInPostStats(
  orgId: string,
  token: string
): Promise<{ impressions: number; clicks: number; engagement: number }> {
  const data = await linkedInFetch(
    `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}`,
    token
  ) as {
    elements?: Array<{
      totalShareStatistics?: {
        impressionCount?: number
        clickCount?: number
        engagement?: number
      }
    }>
  }

  const stats = data.elements?.[0]?.totalShareStatistics ?? {}
  return {
    impressions: stats.impressionCount ?? 0,
    clicks: stats.clickCount ?? 0,
    engagement: stats.engagement != null ? stats.engagement * 100 : 0,
  }
}

export async function syncLinkedInAnalytics(orgId: string, token: string): Promise<AnalyticsData> {
  const [followers, postStats] = await Promise.all([
    getLinkedInFollowers(orgId, token),
    getLinkedInPostStats(orgId, token),
  ])

  return {
    platform: 'linkedin',
    impressions: postStats.impressions,
    reach: Math.round(postStats.impressions * 0.75), // LinkedIn doesn't expose reach directly
    engagement: postStats.engagement,
    followers,
    followersGrowth: 0, // Would require historical comparison
    postsCount: 0,
  }
}
