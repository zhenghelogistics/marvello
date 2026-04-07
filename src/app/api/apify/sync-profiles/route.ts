import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apifyJobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { scrapeOwnProfiles, getRunResults } from '@/lib/apify'
import { analyticsSnapshots } from '@/lib/db/schema'

export const maxDuration = 60

// POST — fire the 3 scrape runs and save runIds to DB, return immediately
export async function POST() {
  try {
    const runIds = await scrapeOwnProfiles()

    // Save as apifyJobs so we can poll them later
    await db.delete(apifyJobs).where(and(eq(apifyJobs.type, 'profile-scrape'), eq(apifyJobs.status, 'running')))
    await db.insert(apifyJobs).values([
      { id: crypto.randomUUID(), type: 'profile-scrape', status: 'running', runId: runIds.instagram, query: 'instagram', campaignId: null },
      { id: crypto.randomUUID(), type: 'profile-scrape', status: 'running', runId: runIds.facebook, query: 'facebook', campaignId: null },
    ])

    return NextResponse.json({ started: true, runIds })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET — check run status and save metrics when done
export async function GET() {
  try {
    const jobs = await db.select().from(apifyJobs).where(eq(apifyJobs.type, 'profile-scrape'))
    if (jobs.length === 0) return NextResponse.json({ status: 'idle' })

    const APIFY_BASE = 'https://api.apify.com/v2'
    const TOKEN = process.env.APIFY_API_TOKEN!
    const results: Record<string, string> = {}
    let anyRunning = false

    for (const job of jobs) {
      if (!job.runId) continue
      if (job.status === 'done') { results[job.query] = 'done'; continue }

      const res = await fetch(`${APIFY_BASE}/actor-runs/${job.runId}?token=${TOKEN}`)
      const data = await res.json()
      const apifyStatus: string = data?.data?.status

      if (apifyStatus === 'SUCCEEDED') {
        // Fetch results and save to analyticsSnapshots
        const items = await getRunResults(job.runId) as Record<string, unknown>[]
        const platform = job.query as 'linkedin' | 'instagram' | 'facebook'
        let followers = 0, postsCount = 0, impressions = 0, engagement = 0

        if (platform === 'linkedin') {
          const co = items[0] ?? {}
          followers = Number((co.followersCount as number | null) ?? (co.followers as number | null) ?? 0)
          postsCount = Number((co.postsCount as number | null) ?? 0)
        } else if (platform === 'instagram') {
          const profile = items[0] ?? {}
          followers = Number((profile.followersCount as number | null) ?? 0)
          postsCount = Number((profile.postsCount as number | null) ?? 0)
          const latestPosts = (profile.latestPosts as Record<string, unknown>[] | null) ?? []
          const totalLikes = latestPosts.reduce((s, p) => s + Number((p.likesCount as number | null) ?? 0), 0)
          const totalComments = latestPosts.reduce((s, p) => s + Number((p.commentsCount as number | null) ?? 0), 0)
          impressions = totalLikes
          engagement = followers > 0 && latestPosts.length > 0
            ? Math.round(((totalLikes + totalComments) / latestPosts.length / followers) * 10000) / 100
            : 0
        } else if (platform === 'facebook') {
          const page = items[0] ?? {}
          followers = Number((page.followers as number | null) ?? (page.likes as number | null) ?? (page.fanCount as number | null) ?? 0)
          const pagePosts = (page.posts as Record<string, unknown>[] | null) ?? []
          impressions = pagePosts.reduce((s, p) => s + Number((p.likes as number | null) ?? 0), 0)
          postsCount = pagePosts.length
        }

        await db.delete(analyticsSnapshots).where(eq(analyticsSnapshots.platform, platform))
        await db.insert(analyticsSnapshots).values({
          id: crypto.randomUUID(), platform, period: '30d',
          impressions, reach: followers, engagement, followers,
          followersGrowth: 0, postsCount, syncedAt: new Date(),
        })

        await db.update(apifyJobs).set({ status: 'done', completedAt: new Date() }).where(eq(apifyJobs.id, job.id))
        results[job.query] = 'done'
      } else if (apifyStatus === 'FAILED' || apifyStatus === 'ABORTED') {
        await db.update(apifyJobs).set({ status: 'failed' }).where(eq(apifyJobs.id, job.id))
        results[job.query] = 'failed'
      } else {
        results[job.query] = 'running'
        anyRunning = true
      }
    }

    const allDone = Object.values(results).every(s => s === 'done' || s === 'failed')
    const synced = Object.entries(results).filter(([, s]) => s === 'done').map(([p]) => p)

    return NextResponse.json({ status: allDone ? 'done' : 'running', results, synced })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
