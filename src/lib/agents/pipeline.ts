import { after } from 'next/server'
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

function chainStep(step: string, campaignId: string) {
  if (process.env.NODE_ENV === 'development') {
    // In dev, call the step function directly — no HTTP round-trip needed
    const fn = step === 'writer' ? runWriterStep
      : step === 'reviewer' ? runReviewerStep
      : step === 'finalize' ? runFinalizeStep
      : null
    if (fn) fn(campaignId).catch(err => console.error(`Step ${step} failed:`, err))
    return
  }

  // Production: fire HTTP request to a new function invocation so each step gets its own 60s budget
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

  after(() => {
    fetch(`${base}/api/agents/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, step }),
    }).catch(err => console.error(`Failed to chain step ${step}:`, err))
  })
}

// ── Individual steps (each must complete within 60s for Vercel Hobby) ─────────

export async function runPlannerStep(campaignId: string) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId))
  if (!campaign) throw new Error('Campaign not found')

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

  // Save strategy to DB so the next step can read it
  await db.update(campaigns)
    .set({ description: campaign.description })
    .where(eq(campaigns.id, campaignId))

  // Store strategy in agent log output so writer step can retrieve it
  await db.insert(agentLogs).values({
    id: crypto.randomUUID(),
    campaignId,
    role: 'planner',
    status: 'done',
    message: '__strategy__',
    output: JSON.stringify(strategy),
  })

  chainStep('writer', campaignId)
}

export async function runWriterStep(campaignId: string) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId))
  if (!campaign) throw new Error('Campaign not found')

  // Retrieve strategy from the planner's stored output
  const plannerLogs = await db.select().from(agentLogs)
    .where(eq(agentLogs.campaignId, campaignId))
  const strategyLog = plannerLogs.find(l => l.role === 'planner' && l.message === '__strategy__')
  if (!strategyLog?.output) throw new Error('No strategy found — planner may not have completed')

  const strategy = JSON.parse(strategyLog.output)

  await updateCampaign(campaignId, { currentStep: 'writer', progress: 40 })
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

  chainStep('reviewer', campaignId)
}

export async function runReviewerStep(campaignId: string) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId))
  if (!campaign) throw new Error('Campaign not found')

  // Retrieve drafts from writer log
  const allLogs = await db.select().from(agentLogs).where(eq(agentLogs.campaignId, campaignId))
  const writerLog = allLogs.find(l => l.role === 'writer' && l.status === 'done' && l.message.includes('drafts written'))
  const drafts = writerLog?.output ? JSON.parse(writerLog.output) : []

  if (drafts.length === 0) throw new Error('No drafts found — writer may not have completed')

  await updateCampaign(campaignId, { currentStep: 'reviewer', progress: 70 })
  await log(campaignId, 'reviewer', 'running', 'Reviewing posts for brand voice and quality…')

  const reviewResult = await runReviewer({ drafts, campaignName: campaign.name })

  await log(campaignId, 'reviewer', 'done',
    `Review complete: ${reviewResult.approved_count} approved, ${reviewResult.revised_count} revised.`,
    reviewResult.overall_feedback
  )
  await updateCampaign(campaignId, { currentStep: 'publisher', progress: 85 })

  chainStep('finalize', campaignId)
}

export async function runFinalizeStep(campaignId: string) {
  const allLogs = await db.select().from(agentLogs).where(eq(agentLogs.campaignId, campaignId))

  // Get reviewer output, fall back to writer drafts
  const reviewerLog = allLogs.find(l => l.role === 'reviewer' && l.status === 'done' && l.message.includes('Review complete'))
  const writerLog = allLogs.find(l => l.role === 'writer' && l.status === 'done')

  let sourcePosts
  if (reviewerLog?.output) {
    try {
      const reviewResult = JSON.parse(reviewerLog.output)
      sourcePosts = reviewResult.posts?.length > 0 ? reviewResult.posts : null
    } catch { sourcePosts = null }
  }
  if (!sourcePosts && writerLog?.output) {
    try { sourcePosts = JSON.parse(writerLog.output) } catch { sourcePosts = null }
  }

  if (!sourcePosts || sourcePosts.length === 0) throw new Error('No posts to save')

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
      platform: p.platform as 'linkedin' | 'instagram' | 'facebook',
      status: 'scheduled' as const,
      scheduledAt: scheduledDate,
    }
  })

  if (postRecords.length === 0) throw new Error('No posts generated')
  await db.insert(posts).values(postRecords)
  await log(campaignId, 'publisher', 'done', `${postRecords.length} posts scheduled to calendar.`)
  await updateCampaign(campaignId, { currentStep: null, progress: 100, status: 'active', postsCount: postRecords.length })
}

// ── Legacy: full pipeline in one call (use locally only, will timeout on Vercel Hobby) ───

export async function runAgentPipeline(campaignId: string): Promise<{ postsCreated: number }> {
  await runPlannerStep(campaignId)
  // Note: runPlannerStep chains to writer automatically via chainStep — this legacy path
  // is only used in tests where chaining is sufficient.
  return { postsCreated: 0 }
}
