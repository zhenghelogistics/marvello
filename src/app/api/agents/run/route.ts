import { NextRequest } from 'next/server'
import { runPlannerStep } from '@/lib/agents/pipeline'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json()
  if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 })

  try {
    await runPlannerStep(campaignId)
    return Response.json({ success: true, step: 'planner' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Planner step error:', err)

    // Mark campaign as paused so the UI shows the failure instead of spinning forever
    try {
      const { db } = await import('@/lib/db')
      const { campaigns, agentLogs } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')
      await db.update(campaigns).set({ status: 'paused', currentStep: null }).where(eq(campaigns.id, campaignId))
      await db.insert(agentLogs).values({
        id: crypto.randomUUID(), campaignId, role: 'planner', status: 'error',
        message: `Planner failed: ${message}`,
      })
    } catch { /* best-effort */ }

    return Response.json({ error: message }, { status: 500 })
  }
}
