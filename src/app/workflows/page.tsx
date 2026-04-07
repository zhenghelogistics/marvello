export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { campaigns, agentLogs, posts } from '@/lib/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { WorkflowsClient } from './workflows-client'
import type { Campaign, AgentLog } from '@/types'

export default async function WorkflowsPage() {
  const dbCampaigns = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt))

  let dbLogs: (typeof agentLogs.$inferSelect)[] = []
  let dbPosts: (typeof posts.$inferSelect)[] = []

  if (dbCampaigns.length > 0) {
    const ids = dbCampaigns.map(c => c.id)
    ;[dbLogs, dbPosts] = await Promise.all([
      db.select().from(agentLogs).where(inArray(agentLogs.campaignId, ids)),
      db.select().from(posts).where(inArray(posts.campaignId, ids)),
    ])
  }

  const logsByCampaign = dbLogs.reduce<Record<string, AgentLog[]>>((acc, log) => {
    const mapped: AgentLog = {
      id: log.id,
      role: log.role,
      status: log.status,
      message: log.message,
      timestamp: log.createdAt.toISOString(),
      output: log.output ?? undefined,
    }
    if (!acc[log.campaignId]) acc[log.campaignId] = []
    acc[log.campaignId].push(mapped)
    return acc
  }, {})

  const postCountByCampaign = dbPosts.reduce<Record<string, number>>((acc, p) => {
    if (p.campaignId) acc[p.campaignId] = (acc[p.campaignId] ?? 0) + 1
    return acc
  }, {})

  const data: Campaign[] = dbCampaigns.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    platforms: c.platforms as Campaign['platforms'],
    startDate: c.startDate,
    endDate: c.endDate ?? undefined,
    createdAt: c.createdAt.toISOString(),
    postsCount: postCountByCampaign[c.id] ?? c.postsCount,
    agentLogs: logsByCampaign[c.id] ?? [],
    currentStep: c.currentStep ?? null,
    progress: c.progress,
    apifyResearch: c.apifyResearch,
  }))

  return <WorkflowsClient campaigns={data} />
}
