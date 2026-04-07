import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { campaigns, agentLogs, apifyJobs, posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runPlanner } from '@/lib/agents/planner'
import { runWriter } from '@/lib/agents/writer'
import { runReviewer } from '@/lib/agents/reviewer'

async function log(campaignId: string, role: typeof agentLogs.$inferInsert['role'], status: typeof agentLogs.$inferInsert['status'], message: string, output?: string) {
  await db.insert(agentLogs).values({
    id: crypto.randomUUID(),
    campaignId,
    role,
    status,
    message,
    output,
  })
}

async function updateCampaign(id: string, patch: Partial<typeof campaigns.$inferInsert>) {
  await db.update(campaigns).set(patch).where(eq(campaigns.id, id))
}

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json()

  if (!campaignId) {
    return Response.json({ error: 'campaignId required' }, { status: 400 })
  }

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId))
  if (!campaign) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 })
  }

  try {
    // ── 1. Gather Apify research results if available ─────────────────────────
    let researchSummary: string | undefined
    const completedJobs = await db
      .select()
      .from(apifyJobs)
      .where(eq(apifyJobs.campaignId, campaignId))

    if (completedJobs.some(j => j.result)) {
      researchSummary = completedJobs
        .filter(j => j.result)
        .map(j => `[${j.type}] Query: ${j.query}\nResult: ${j.result}`)
        .join('\n\n')
    }

    // ── 2. Planner agent ──────────────────────────────────────────────────────
    await updateCampaign(campaignId, { currentStep: 'planner', progress: 10 })
    await log(campaignId, 'planner', 'running', 'Analyzing campaign brief and building content strategy…')

    const strategy = await runPlanner({
      campaignName: campaign.name,
      description: campaign.description,
      platforms: campaign.platforms,
      contentPillars: campaign.contentPillars,
      researchResults: researchSummary,
    })

    await log(
      campaignId, 'planner', 'done',
      `Content strategy created: ${strategy.total_posts} posts across ${campaign.platforms.join(', ')} over ${strategy.duration_days} days.`,
      strategy.summary
    )
    await updateCampaign(campaignId, { currentStep: 'writer', progress: 35 })

    // ── 3. Writer agent ───────────────────────────────────────────────────────
    await log(campaignId, 'writer', 'running', `Writing ${strategy.total_posts} post drafts…`)

    const drafts = await runWriter({
      strategy,
      campaignName: campaign.name,
      campaignDescription: campaign.description,
    })

    await log(
      campaignId, 'writer', 'done',
      `${drafts.length} post drafts written across ${[...new Set(drafts.map(d => d.platform))].join(', ')}.`
    )
    await updateCampaign(campaignId, { currentStep: 'reviewer', progress: 60 })

    // ── 4. Reviewer agent ─────────────────────────────────────────────────────
    await log(campaignId, 'reviewer', 'running', 'Reviewing posts for brand voice and quality…')

    const reviewResult = await runReviewer({
      drafts,
      campaignName: campaign.name,
    })

    await log(
      campaignId, 'reviewer', 'done',
      `Review complete: ${reviewResult.approved_count} approved, ${reviewResult.revised_count} revised.`,
      reviewResult.overall_feedback
    )
    await updateCampaign(campaignId, { currentStep: 'publisher', progress: 80 })

    // ── 5. Save posts to DB ───────────────────────────────────────────────────
    const finalPosts = reviewResult.posts.map(p => ({
      ...p,
      content: p.approved ? p.content : (p.revision ?? p.content),
    }))

    const today = new Date()
    const postRecords = finalPosts.map(p => {
      const scheduledDate = new Date(today)
      scheduledDate.setDate(today.getDate() + (p.scheduled_day - 1))
      scheduledDate.setHours(9, 0, 0, 0)

      return {
        id: crypto.randomUUID(),
        campaignId,
        title: p.title,
        content: p.content,
        platform: p.platform,
        status: 'scheduled' as const,
        scheduledAt: scheduledDate,
      }
    })

    await db.insert(posts).values(postRecords)

    await log(
      campaignId, 'publisher', 'done',
      `${postRecords.length} posts scheduled to calendar.`
    )
    await updateCampaign(campaignId, {
      currentStep: 'analyst',
      progress: 95,
      postsCount: postRecords.length,
    })

    await log(
      campaignId, 'analyst', 'running',
      'Monitoring post performance. Analytics will be collected after publishing.'
    )

    await updateCampaign(campaignId, {
      status: campaign.humanReview ? 'active' : 'active',
      currentStep: null,
      progress: 100,
    })

    return Response.json({ success: true, postsCreated: postRecords.length })
  } catch (err) {
    console.error('Agent pipeline error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    await log(campaignId, campaign.currentStep ?? 'planner', 'error', `Agent failed: ${message}`)
    await updateCampaign(campaignId, { status: 'paused' })
    return Response.json({ error: message }, { status: 500 })
  }
}
