import { NextRequest } from 'next/server'
import { runPlannerStep } from '@/lib/agents/pipeline'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json()
  if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 })

  try {
    // Kick off step 1 only — each step chains to the next automatically
    await runPlannerStep(campaignId)
    return Response.json({ success: true, step: 'planner' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Planner step error:', err)
    return Response.json({ error: message }, { status: 500 })
  }
}
