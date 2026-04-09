import { NextRequest } from 'next/server'
import { runWriterStep, runReviewerStep, runFinalizeStep } from '@/lib/agents/pipeline'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const { campaignId, step } = await request.json()
  if (!campaignId || !step) return Response.json({ error: 'campaignId and step required' }, { status: 400 })

  try {
    switch (step) {
      case 'writer':
        await runWriterStep(campaignId)
        break
      case 'reviewer':
        await runReviewerStep(campaignId)
        break
      case 'finalize':
        await runFinalizeStep(campaignId)
        break
      default:
        return Response.json({ error: `Unknown step: ${step}` }, { status: 400 })
    }
    return Response.json({ success: true, step })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Step ${step} error for campaign ${campaignId}:`, err)

    // Mark campaign as paused and write visible error log
    try {
      const { db } = await import('@/lib/db')
      const { campaigns, agentLogs } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')
      await db.update(campaigns).set({ currentStep: null, status: 'paused' }).where(eq(campaigns.id, campaignId))
      await db.insert(agentLogs).values({
        id: crypto.randomUUID(), campaignId,
        role: step as 'planner' | 'writer' | 'reviewer',
        status: 'error',
        message: `Error: ${message}`,
      })
    } catch { /* best-effort */ }

    return Response.json({ error: message }, { status: 500 })
  }
}
