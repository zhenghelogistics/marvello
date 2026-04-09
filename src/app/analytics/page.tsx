export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { analyticsSnapshots, posts } from '@/lib/db/schema'
import { AnalyticsClient } from './analytics-client'
import type { AnalyticsSnapshot, Post } from '@/types'
import type { Platform } from '@/types'
import { desc } from 'drizzle-orm'

export default async function AnalyticsPage() {
  const [rows, dbPosts] = await Promise.all([
    db.select().from(analyticsSnapshots),
    db.select().from(posts).orderBy(desc(posts.createdAt)).limit(100),
  ])

  const isLive = rows.length > 0
  const snapshots: AnalyticsSnapshot[] = isLive
    ? rows.map(row => ({
        platform: row.platform as Platform,
        period: row.period,
        impressions: row.impressions,
        reach: row.reach,
        engagement: row.engagement,
        followers: row.followers,
        followersGrowth: row.followersGrowth,
        posts: row.postsCount,
      }))
    : []

  const realPosts: Post[] = dbPosts.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    platform: p.platform,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }))

  // Build time series: posts per day for last 30 days
  const now = new Date()
  const timeSeries = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (29 - i))
    const dateStr = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
    const count = dbPosts.filter(p => {
      const pd = new Date(p.scheduledAt ?? p.createdAt)
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && pd.getDate() === d.getDate()
    }).length
    return { date: dateStr, value: count }
  })

  return <AnalyticsClient analytics={snapshots} isLive={isLive} posts={realPosts} timeSeries={timeSeries} />
}
