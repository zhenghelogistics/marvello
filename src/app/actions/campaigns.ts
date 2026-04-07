'use server'

import { after } from 'next/server'
import { db } from '@/lib/db'
import { campaigns, apifyJobs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runCampaignResearch } from '@/lib/apify'
import { revalidatePath } from 'next/cache'

function appBaseUrl() {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export async function deleteCampaign(id: string) {
  await db.delete(campaigns).where(eq(campaigns.id, id))
  try { revalidatePath('/campaigns') } catch { /* no-op */ }
}

export interface CreateCampaignInput {
  name: string
  description: string
  platforms: string[]
  contentPillars: string[]
  apifyResearch: boolean
  humanReview: boolean
}

export async function createCampaign(input: CreateCampaignInput) {
  const id = crypto.randomUUID()
  const today = new Date().toISOString().split('T')[0]

  await db.insert(campaigns).values({
    id,
    name: input.name,
    description: input.description,
    status: 'active',
    platforms: input.platforms,
    startDate: today,
    postsCount: 0,
    currentStep: 'planner',
    progress: 5,
    apifyResearch: input.apifyResearch,
    humanReview: input.humanReview,
    contentPillars: input.contentPillars,
  })

  // Kick off Apify research jobs if enabled
  if (input.apifyResearch) {
    try {
      const researchJobs = await runCampaignResearch({
        campaignName: input.name,
        description: input.description,
        platforms: input.platforms,
      })

      await db.insert(apifyJobs).values(
        researchJobs.map(job => ({
          id: crypto.randomUUID(),
          campaignId: id,
          type: job.type,
          status: 'running' as const,
          runId: job.runId,
          query: job.query,
        }))
      )
    } catch (err) {
      // Research failure shouldn't block campaign creation
      console.error('Apify research failed:', err)
    }
  }

  try { revalidatePath('/campaigns') } catch { /* no-op outside Next.js request context */ }

  // Trigger the agent pipeline after the server action response is sent
  after(() => {
    fetch(`${appBaseUrl()}/api/agents/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: id }),
    }).catch(err => console.error('Failed to trigger agent pipeline:', err))
  })

  return { id }
}
