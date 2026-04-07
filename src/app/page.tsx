export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { campaigns, posts, agentLogs, analyticsSnapshots } from '@/lib/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const [dbCampaigns, dbPosts, dbSnapshots] = await Promise.all([
    db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(10),
    db.select().from(posts).orderBy(desc(posts.createdAt)).limit(10),
    db.select().from(analyticsSnapshots),
  ])

  let dbLogs: (typeof agentLogs.$inferSelect)[] = []
  if (dbCampaigns.length > 0) {
    const ids = dbCampaigns.map(c => c.id)
    dbLogs = await db.select().from(agentLogs).where(inArray(agentLogs.campaignId, ids))
  }

  const logsByCampaign = dbLogs.reduce<Record<string, typeof agentLogs.$inferSelect[]>>((acc, l) => {
    if (!acc[l.campaignId]) acc[l.campaignId] = []
    acc[l.campaignId].push(l)
    return acc
  }, {})

  const totalFollowers = dbSnapshots.reduce((s, sn) => s + sn.followers, 0)
  const totalImpressions = dbSnapshots.reduce((s, sn) => s + sn.impressions, 0)
  const avgEngagement = dbSnapshots.length > 0
    ? dbSnapshots.reduce((s, sn) => s + sn.engagement, 0) / dbSnapshots.length
    : 0
  const scheduledPosts = dbPosts.filter(p => p.status === 'scheduled').length

  return (
    <DashboardClient
      campaigns={dbCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        platforms: c.platforms as ('linkedin' | 'instagram' | 'facebook')[],
        startDate: c.startDate,
        endDate: c.endDate ?? undefined,
        createdAt: c.createdAt.toISOString(),
        postsCount: c.postsCount,
        currentStep: c.currentStep ?? null,
        progress: c.progress,
        apifyResearch: c.apifyResearch,
        agentLogs: (logsByCampaign[c.id] ?? []).map(l => ({
          id: l.id,
          role: l.role,
          status: l.status,
          message: l.message,
          timestamp: l.createdAt.toISOString(),
          output: l.output ?? undefined,
        })),
      }))}
      recentPosts={dbPosts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        platform: p.platform,
        status: p.status,
        scheduledAt: p.scheduledAt?.toISOString() ?? null,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        campaignId: p.campaignId ?? undefined,
      }))}
      stats={{
        totalFollowers,
        totalImpressions,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        scheduledPosts,
      }}
    />
  )
}
