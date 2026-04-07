import type { AnalyticsData } from './types'

const BASE = 'https://graph.facebook.com/v18.0'

async function fbFetch(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`)

  if (res.status === 401 || res.status === 403) {
    throw new Error('Facebook API: Invalid credentials')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
    const msg = body?.error?.message ?? `status ${res.status}`
    throw new Error(`Facebook API: ${msg}`)
  }

  return res.json()
}

export async function getFacebookInsights(
  pageId: string,
  token: string
): Promise<AnalyticsData> {
  const [pageData, insightsData] = await Promise.all([
    fbFetch(`/${pageId}?fields=fan_count,followers_count&access_token=${token}`) as Promise<{
      fan_count?: number
      followers_count?: number
    }>,
    fbFetch(
      `/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users&period=month&access_token=${token}`
    ) as Promise<{
      data?: Array<{ name: string; values?: Array<{ value: number }> }>
    }>,
  ])

  const followers = pageData.followers_count ?? pageData.fan_count ?? 0

  const metricsMap: Record<string, number> = {}
  for (const metric of insightsData.data ?? []) {
    // sum all values for the period
    const total = metric.values?.reduce((sum, v) => sum + (v.value ?? 0), 0) ?? 0
    metricsMap[metric.name] = total
  }

  const impressions = metricsMap['page_impressions'] ?? 0
  const reach = metricsMap['page_reach'] ?? 0
  const engagedUsers = metricsMap['page_engaged_users'] ?? 0
  const engagement = reach > 0 ? parseFloat((engagedUsers / reach * 100).toFixed(2)) : 0

  return {
    platform: 'facebook',
    impressions,
    reach,
    engagement,
    followers,
    followersGrowth: 0,
    postsCount: 0,
  }
}
