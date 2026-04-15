import { db } from '@/lib/db'
import { campaigns, agentLogs, apifyJobs, posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runPlanner } from './planner'
import { runWriter } from './writer'
import { runReviewer } from './reviewer'

async function log(campaignId: string, role: typeof agentLogs.$inferInsert['role'], status: typeof agentLogs.$inferInsert['status'], message: string, output?: string) {
  await db.insert(agentLogs).values({ id: crypto.randomUUID(), campaignId, role, status, message, output })
}

async function updateCampaign(id: string, patch: Partial<typeof campaigns.$inferInsert>) {
  await db.update(campaigns).set(patch).where(eq(campaigns.id, id))
}

// ── Full pipeline — runs all 3 steps sequentially in one function call ────────
// All agents use Haiku so total time stays well under Vercel's 60s limit.

export async function runAgentPipeline(campaignId: string): Promise<{ postsCreated: number }> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId))
  if (!campaign) throw new Error('Campaign not found')

  // ── Step 1: Planner ──────────────────────────────────────────────────────────
  await updateCampaign(campaignId, { currentStep: 'planner', progress: 10 })
  await log(campaignId, 'planner', 'running', 'Analyzing campaign brief and building content strategy…')

  const completedJobs = await db.select().from(apifyJobs).where(eq(apifyJobs.campaignId, campaignId))
  const researchSummary = completedJobs.some(j => j.result)
    ? completedJobs.filter(j => j.result).map(j => `[${j.type}] Query: ${j.query}\nResult: ${j.result}`).join('\n\n')
    : undefined

  const strategy = await runPlanner({
    campaignName: campaign.name,
    description: campaign.description,
    platforms: campaign.platforms,
    contentPillars: campaign.contentPillars,
    researchResults: researchSummary,
  })

  await log(campaignId, 'planner', 'done',
    `Content strategy created: ${strategy.total_posts} posts over ${strategy.duration_days} days.`,
    strategy.summary
  )
  await updateCampaign(campaignId, { currentStep: 'writer', progress: 35 })

  // ── Step 2: Writer ───────────────────────────────────────────────────────────
  await log(campaignId, 'writer', 'running', `Writing ${strategy.total_posts} post drafts…`)

  const drafts = await runWriter({
    strategy,
    campaignName: campaign.name,
    campaignDescription: campaign.description,
  })

  await log(campaignId, 'writer', 'done',
    `${drafts.length} post drafts written across ${[...new Set(drafts.map((d: { platform: string }) => d.platform))].join(', ')}.`,
    JSON.stringify(drafts)
  )
  await updateCampaign(campaignId, { currentStep: 'reviewer', progress: 65 })

  // ── Step 3: Reviewer ─────────────────────────────────────────────────────────
  await log(campaignId, 'reviewer', 'running', 'Reviewing posts for brand voice and quality…')

  const reviewResult = await runReviewer({ drafts, campaignName: campaign.name })

  await log(campaignId, 'reviewer', 'done',
    `Review complete: ${reviewResult.approved_count} approved, ${reviewResult.revised_count} revised.`,
    reviewResult.overall_feedback
  )
  await updateCampaign(campaignId, { currentStep: 'reviewer', progress: 90 })

  // ── Finalize: save posts ─────────────────────────────────────────────────────
  const sourcePosts = reviewResult.posts?.length > 0 ? reviewResult.posts : drafts

  const today = new Date()
  const postRecords = sourcePosts.map((p: {
    platform: string; title: string; content: string;
    scheduled_day?: number; approved?: boolean; revision?: string
  }) => {
    const scheduledDate = new Date(today)
    scheduledDate.setDate(today.getDate() + ((p.scheduled_day ?? 1) - 1))
    scheduledDate.setHours(9, 0, 0, 0)
    const content = String((!p.approved && p.revision) ? p.revision : p.content)
    return {
      id: crypto.randomUUID(),
      campaignId,
      title: p.title,
      content,
      platform: p.platform.toLowerCase() as 'linkedin' | 'instagram' | 'facebook',
      status: 'scheduled' as const,
      scheduledAt: scheduledDate,
    }
  })

  if (postRecords.length === 0) throw new Error('No posts generated')
  await db.insert(posts).values(postRecords)
  await log(campaignId, 'reviewer', 'done', `${postRecords.length} posts ready — review and publish from the Posts tab.`)
  await updateCampaign(campaignId, { currentStep: null, progress: 100, status: 'active', postsCount: postRecords.length })

  return { postsCreated: postRecords.length }
}
