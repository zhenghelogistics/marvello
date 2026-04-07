import { type NextRequest } from 'next/server'
import { pollAndSaveJobResults } from '@/lib/apify'

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json()

  if (!campaignId || typeof campaignId !== 'string') {
    return Response.json({ error: 'campaignId is required' }, { status: 400 })
  }

  const updated = await pollAndSaveJobResults(campaignId)
  return Response.json({ updated })
}
