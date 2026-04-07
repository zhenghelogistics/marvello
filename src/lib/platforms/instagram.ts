import type { AnalyticsData } from './types'

const BASE = 'https://graph.facebook.com/v18.0'

async function igFetch(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`)

  if (res.status === 401 || res.status === 403) {
    throw new Error('Instagram API: Invalid credentials')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
    const msg = body?.error?.message ?? `status ${res.status}`
    throw new Error(`Instagram API: ${msg}`)
  }

  return res.json()
}

export async function getInstagramInsights(
  igUserId: string,
  token: string
): Promise<AnalyticsData> {
  const [profileData, insightsData] = await Promise.all([
    igFetch(`/${igUserId}?fields=followers_count,media_count&access_token=${token}`) as Promise<{
      followers_count?: number
      media_count?: number
    }>,
    igFetch(
      `/${igUserId}/insights?metric=impressions,reach,profile_views&period=days_28&access_token=${token}`
    ) as Promise<{
      data?: Array<{ name: string; values?: Array<{ value: number }> }>
    }>,
  ])

  const followers = profileData.followers_count ?? 0
  const postsCount = profileData.media_count ?? 0

  const metricsMap: Record<string, number> = {}
  for (const metric of insightsData.data ?? []) {
    const total = metric.values?.reduce((sum, v) => sum + (v.value ?? 0), 0) ?? 0
    metricsMap[metric.name] = total
  }

  const impressions = metricsMap['impressions'] ?? 0
  const reach = metricsMap['reach'] ?? 0
  const engagement = impressions > 0 ? parseFloat(((metricsMap['profile_views'] ?? 0) / impressions * 100).toFixed(2)) : 0

  return {
    platform: 'instagram',
    impressions,
    reach,
    engagement,
    followers,
    followersGrowth: 0,
    postsCount,
  }
}
