import { describe, it, expect } from 'vitest'
import { db } from '@/lib/db'
import { campaigns, agentLogs, posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runAgentPipeline } from '@/lib/agents/pipeline'

describe('Full Agent Pipeline', () => {
  it('creates a campaign, runs agents, and saves posts to DB', async () => {
    const id = crypto.randomUUID()

    // Insert campaign directly (bypass server action)
    await db.insert(campaigns).values({
      id,
      name: '[TEST] Sea Freight Basics',
      description: 'Educate small business owners about sea freight — FCL vs LCL, timelines, and hidden costs.',
      platforms: ['linkedin'],
      contentPillars: ['education'],
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      postsCount: 0,
      progress: 0,
      apifyResearch: false,
      humanReview: false,
    })

    try {
      const result = await runAgentPipeline(id)

      expect(result.postsCreated).toBeGreaterThan(0)

      // Verify campaign updated
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id))
      expect(campaign.progress).toBe(100)
      expect(campaign.postsCount).toBeGreaterThan(0)
      expect(campaign.currentStep).toBeNull()

      // Verify agent logs
      const logs = await db.select().from(agentLogs).where(eq(agentLogs.campaignId, id))
      const roles = logs.map(l => l.role)
      expect(roles).toContain('planner')
      expect(roles).toContain('writer')
      expect(roles).toContain('reviewer')
      expect(roles).toContain('publisher')

      // Verify posts saved
      const savedPosts = await db.select().from(posts).where(eq(posts.campaignId, id))
      expect(savedPosts.length).toBeGreaterThan(0)
      expect(savedPosts[0].content.length).toBeGreaterThan(50)
      expect(savedPosts[0].status).toBe('scheduled')

      console.log(`✓ Pipeline created ${savedPosts.length} posts`)
      console.log(`  Sample: "${savedPosts[0].title}"`)
      console.log(`  Preview: ${savedPosts[0].content.slice(0, 120)}…`)
    } finally {
      // Always cleanup test data
      await db.delete(campaigns).where(eq(campaigns.id, id))
    }
  }, 300000)
})
