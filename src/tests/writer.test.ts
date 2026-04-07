import { describe, it, expect } from 'vitest'
import { runPlanner } from '@/lib/agents/planner'
import { runWriter } from '@/lib/agents/writer'

describe('Writer Agent', () => {
  it('writes post drafts from a strategy', async () => {
    const strategy = await runPlanner({
      campaignName: 'Test: Freight Education',
      description: 'Help importers understand how sea freight works.',
      platforms: ['linkedin'],
      contentPillars: ['education'],
    })

    const drafts = await runWriter({
      strategy,
      campaignName: 'Test: Freight Education',
      campaignDescription: 'Help importers understand how sea freight works.',
    })

    expect(Array.isArray(drafts)).toBe(true)
    expect(drafts.length).toBeGreaterThan(0)

    for (const draft of drafts) {
      expect(draft.content).toBeTruthy()
      expect(draft.content.length).toBeGreaterThan(50)
      expect(draft.title).toBeTruthy()
      expect(draft.call_to_action).toBeTruthy()
    }

    console.log('Sample post:', drafts[0]?.content?.slice(0, 200))
  })
})
