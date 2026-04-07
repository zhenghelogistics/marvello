export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { CalendarClient } from './calendar-client'
import type { Post } from '@/types'

export default async function CalendarPage() {
  const dbPosts = await db.select().from(posts).orderBy(desc(posts.scheduledAt))

  const data: Post[] = dbPosts.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    platform: p.platform,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    campaignId: p.campaignId ?? undefined,
  }))

  return <CalendarClient posts={data} />
}
