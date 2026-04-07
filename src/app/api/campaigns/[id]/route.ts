import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { campaigns, agentLogs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id))
  if (!campaign) return Response.json({ error: 'Not found' }, { status: 404 })

  const logs = await db.select().from(agentLogs).where(eq(agentLogs.campaignId, id))

  return Response.json({
    ...campaign,
    agentLogs: logs.map(l => ({
      id: l.id,
      role: l.role,
      status: l.status,
      message: l.message,
      timestamp: l.createdAt.toISOString(),
      output: l.output ?? undefined,
    })),
  })
}
