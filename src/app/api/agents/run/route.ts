import { NextRequest } from 'next/server'
import { runAgentPipeline } from '@/lib/agents/pipeline'

export const maxDuration = 300 // 5 min — requires Vercel Pro; Hobby capped at 60s

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json()
  if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 })

  try {
    const result = await runAgentPipeline(campaignId)
    return Response.json({ success: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Agent pipeline error:', err)
    return Response.json({ error: message }, { status: 500 })
  }
}
