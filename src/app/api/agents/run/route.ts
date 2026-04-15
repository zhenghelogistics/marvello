import { NextRequest } from 'next/server'
import { runAgentPipeline } from '@/lib/agents/pipeline'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json()
  if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 })

  try {
    const result = await runAgentPipeline(campaignId)
    return Response.json({ success: true, postsCreated: result.postsCreated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Pipeline error:', err)

    try {
      const { db } = await import('@/lib/db')
      const { campaigns, agentLogs } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')
      await db.update(campaigns).set({ status: 'paused', currentStep: null }).where(eq(campaigns.id, campaignId))
      await db.insert(agentLogs).values({
        id: crypto.randomUUID(), campaignId, role: 'planner', status: 'error',
        message: `Pipeline failed: ${message}`,
      })
    } catch { /* best-effort */ }

    return Response.json({ error: message }, { status: 500 })
  }
}
