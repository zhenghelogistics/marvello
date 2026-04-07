import { describe, it, expect } from 'vitest'
import { runPlanner } from '@/lib/agents/planner'

describe('Planner Agent', () => {
  it('generates a valid content strategy', async () => {
    const strategy = await runPlanner({
      campaignName: 'Test: FCL vs LCL Education',
      description: 'Educate importers about the difference between FCL and LCL shipping to drive freight inquiries.',
      platforms: ['linkedin', 'instagram'],
      contentPillars: ['education', 'commentary'],
    })

    expect(strategy.summary).toBeTruthy()
    expect(strategy.total_posts).toBeGreaterThan(0)
    expect(strategy.duration_days).toBeGreaterThan(0)
    expect(Array.isArray(strategy.posts)).toBe(true)
    expect(strategy.posts.length).toBeGreaterThan(0)

    for (const post of strategy.posts) {
      expect(['linkedin', 'instagram', 'facebook']).toContain(post.platform)
      expect(post.topic).toBeTruthy()
      expect(post.angle).toBeTruthy()
      expect(post.scheduled_day).toBeGreaterThan(0)
    }

    console.log('Strategy summary:', strategy.summary)
    console.log('Posts planned:', strategy.total_posts)
  })
})
