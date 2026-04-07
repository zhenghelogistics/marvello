import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { campaigns, agentLogs, apifyJobs, posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id))
  if (!campaign) return Response.json({ error: 'Not found' }, { status: 404 })

  const [logs, jobs, campaignPosts] = await Promise.all([
    db.select().from(agentLogs).where(eq(agentLogs.campaignId, id)),
    db.select().from(apifyJobs).where(eq(apifyJobs.campaignId, id)),
    db.select().from(posts).where(eq(posts.campaignId, id)),
  ])

  return Response.json({
    ...campaign,
    agentLogs: logs.map(l => ({
      id: l.id,
      role: l.role,
      status: l.status,
      message: l.message,
      timestamp: l.createdAt.toISOString(),
      output: l.output ?? undefined,
    })),
    apifyJobs: jobs.map(j => ({
      id: j.id,
      type: j.type,
      status: j.status,
      query: j.query,
      result: j.result ?? undefined,
      createdAt: j.createdAt.toISOString(),
      completedAt: j.completedAt?.toISOString() ?? undefined,
    })),
    posts: campaignPosts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      platform: p.platform,
      status: p.status,
      scheduledAt: p.scheduledAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  })
}
