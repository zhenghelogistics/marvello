export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { campaigns, agentLogs } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
import { CampaignsClient } from './campaigns-client'
import type { Campaign, AgentLog } from '@/types'

export default async function CampaignsPage() {
  const dbCampaigns = await db.select().from(campaigns).orderBy(campaigns.createdAt)

  let dbLogs: (typeof agentLogs.$inferSelect)[] = []
  if (dbCampaigns.length > 0) {
    dbLogs = await db
      .select()
      .from(agentLogs)
      .where(inArray(agentLogs.campaignId, dbCampaigns.map(c => c.id)))
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

  const data: Campaign[] = dbCampaigns.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    platforms: c.platforms as Campaign['platforms'],
    startDate: c.startDate,
    endDate: c.endDate ?? undefined,
    createdAt: c.createdAt.toISOString(),
    postsCount: c.postsCount,
    agentLogs: logsByCampaign[c.id] ?? [],
    currentStep: c.currentStep ?? null,
    progress: c.progress,
  }))

  return <CampaignsClient campaigns={data} />
}
