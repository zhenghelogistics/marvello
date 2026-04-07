import { db } from '@/lib/db'
import { apifyJobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const APIFY_TOKEN = process.env.APIFY_API_TOKEN!
const APIFY_BASE = 'https://api.apify.com/v2'

export type ApifyResearchType = 'competitor-analysis' | 'trending-topics' | 'hashtag-research'

interface ActorRunResult {
  runId: string
  status: string
}

// Trigger an Apify actor run and return the run ID
async function runActor(actorId: string, input: Record<string, unknown>): Promise<ActorRunResult> {
  const res = await fetch(`${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${APIFY_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify actor run failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return { runId: data.data.id, status: data.data.status }
}

// Fetch results from a completed run's dataset
async function getRunResults(runId: string): Promise<unknown[]> {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`)
  if (!res.ok) throw new Error(`Failed to fetch run results: ${res.status}`)
  return res.json()
}

// Wait for a run to finish (polls every 3s, max 60s)
async function waitForRun(runId: string, maxWaitMs = 60000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`)
    const data = await res.json()
    const status = data.data.status
    if (status === 'SUCCEEDED') return 'done'
    if (status === 'FAILED' || status === 'ABORTED') return 'failed'
    await new Promise(r => setTimeout(r, 3000))
  }
  return 'timeout'
}

// ── Research functions ────────────────────────────────────────────────────────

export async function runCompetitorAnalysis(query: string) {
  return runActor('apify/rag-web-browser', {
    queries: query,
    maxResults: 5,
  })
}

export async function runTrendingTopics(industry: string, platforms: string[]) {
  const query = `${industry} trending content ${platforms.join(' ')} ${new Date().getFullYear()}`
  return runActor('apify/rag-web-browser', {
    queries: query,
    maxResults: 5,
  })
}

export async function runInstagramScrape(handles: string[]) {
  return runActor('apify/instagram-scraper', {
    directUrls: handles.map(h => `https://www.instagram.com/${h}/`),
    resultsType: 'posts',
    resultsLimit: 10,
  })
}

export async function runLinkedInScrape(profileUrls: string[]) {
  return runActor('dev_fusion/Linkedin-Profile-Scraper', {
    profileUrls,
  })
}

export async function runFacebookScrape(pageUrls: string[]) {
  return runActor('apify/facebook-posts-scraper', {
    startUrls: pageUrls.map(url => ({ url })),
    maxPosts: 10,
  })
}

// ── Main research runner for a campaign ──────────────────────────────────────

export async function runCampaignResearch(params: {
  campaignName: string
  description: string
  platforms: string[]
  industry?: string
}): Promise<{ runId: string; query: string; type: ApifyResearchType }[]> {
  const { campaignName, description, platforms, industry = 'freight forwarding logistics' } = params

  const jobs = []

  // Always run trending topics research
  const trendingRun = await runTrendingTopics(industry, platforms)
  jobs.push({
    runId: trendingRun.runId,
    query: `${industry} trending content ${platforms.join(', ')}`,
    type: 'trending-topics' as ApifyResearchType,
  })

  // Run competitor analysis based on campaign brief
  const competitorRun = await runCompetitorAnalysis(
    `${campaignName} ${description} ${industry} marketing strategy`
  )
  jobs.push({
    runId: competitorRun.runId,
    query: `${campaignName} — ${description}`,
    type: 'competitor-analysis' as ApifyResearchType,
  })

  return jobs
}

// ── Poll and save job results for a campaign ─────────────────────────────────

export async function pollAndSaveJobResults(campaignId: string): Promise<number> {
  const runningJobs = await db
    .select()
    .from(apifyJobs)
    .where(and(eq(apifyJobs.campaignId, campaignId), eq(apifyJobs.status, 'running')))

  let updated = 0

  for (const job of runningJobs) {
    if (!job.runId) continue

    const res = await fetch(`${APIFY_BASE}/actor-runs/${job.runId}?token=${APIFY_TOKEN}`)
    if (!res.ok) continue

    const data = await res.json()
    const runStatus: string = data?.data?.status

    if (runStatus === 'SUCCEEDED') {
      const items = await getRunResults(job.runId)
      await db
        .update(apifyJobs)
        .set({
          status: 'done',
          result: JSON.stringify(items),
          completedAt: new Date(),
        })
        .where(eq(apifyJobs.id, job.id))
      updated++
    } else if (runStatus === 'FAILED' || runStatus === 'ABORTED') {
      await db
        .update(apifyJobs)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(eq(apifyJobs.id, job.id))
      updated++
    }
    // still running — leave as is
  }

  return updated
}

// ── Own profile scrapers ──────────────────────────────────────────────────────

export async function scrapeOwnProfiles() {
  const { workspace } = await import('@/lib/workspace')
  const { linkedin, instagram, facebook } = workspace.profiles

  const [linkedinRun, instagramRun, facebookRun] = await Promise.all([
    runLinkedInScrape([linkedin]),
    runInstagramScrape([instagram]),
    runFacebookScrape([facebook]),
  ])

  return {
    linkedin: linkedinRun.runId,
    instagram: instagramRun.runId,
    facebook: facebookRun.runId,
  }
}

/** Wait for all 3 profile runs, extract metrics, return per-platform snapshots */
export async function collectProfileMetrics(runIds: { linkedin: string; instagram: string; facebook: string }) {
  const results: Record<string, {
    followers: number
    postsCount: number
    impressions: number
    reach: number
    engagement: number
    followersGrowth: number
  }> = {}

  // ── LinkedIn ──────────────────────────────────────────────────────────────
  const liStatus = await waitForRun(runIds.linkedin, 90_000)
  if (liStatus === 'done') {
    const items = await getRunResults(runIds.linkedin) as Record<string, unknown>[]
    const profile = items[0] ?? {}
    const followers = Number((profile.followers as number | null) ?? (profile.followerCount as number | null) ?? 0)
    const postsCount = Number((profile.postsCount as number | null) ?? (profile.posts as unknown[])?.length ?? 0)
    results.linkedin = { followers, postsCount, impressions: 0, reach: followers, engagement: 0, followersGrowth: 0 }
  }

  // ── Instagram ─────────────────────────────────────────────────────────────
  const igStatus = await waitForRun(runIds.instagram, 90_000)
  if (igStatus === 'done') {
    const items = await getRunResults(runIds.instagram) as Record<string, unknown>[]
    // First item may be profile metadata, rest are posts
    const profile = items.find(i => (i.followersCount as number) != null) ?? {}
    const posts = items.filter(i => (i.likesCount as number) != null || (i.commentsCount as number) != null)
    const followers = Number((profile.followersCount as number | null) ?? 0)
    const postsCount = posts.length || Number((profile.postsCount as number | null) ?? 0)
    const totalLikes = posts.reduce((s, p) => s + Number((p.likesCount as number | null) ?? 0), 0)
    const totalComments = posts.reduce((s, p) => s + Number((p.commentsCount as number | null) ?? 0), 0)
    const engagementRate = followers > 0 && postsCount > 0
      ? ((totalLikes + totalComments) / postsCount / followers) * 100
      : 0
    results.instagram = { followers, postsCount, impressions: totalLikes, reach: followers, engagement: Math.round(engagementRate * 100) / 100, followersGrowth: 0 }
  }

  // ── Facebook ──────────────────────────────────────────────────────────────
  const fbStatus = await waitForRun(runIds.facebook, 90_000)
  if (fbStatus === 'done') {
    const items = await getRunResults(runIds.facebook) as Record<string, unknown>[]
    const posts = items.filter(i => (i.likesCount as number) != null || (i.text as string) != null)
    const totalLikes = posts.reduce((s, p) => s + Number((p.likesCount as number | null) ?? 0), 0)
    const totalComments = posts.reduce((s, p) => s + Number((p.commentsCount as number | null) ?? 0), 0)
    const totalShares = posts.reduce((s, p) => s + Number((p.sharesCount as number | null) ?? 0), 0)
    results.facebook = { followers: 0, postsCount: posts.length, impressions: totalLikes + totalComments + totalShares, reach: 0, engagement: 0, followersGrowth: 0 }
  }

  return results
}

export { waitForRun, getRunResults }
