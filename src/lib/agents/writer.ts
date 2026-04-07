import Anthropic from '@anthropic-ai/sdk'
import { workspace } from '@/lib/workspace'
import type { ContentStrategy, PostPlan } from './planner'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface DraftPost {
  platform: 'linkedin' | 'instagram' | 'facebook'
  title: string
  content: string
  hashtags: string[]
  call_to_action: string
  scheduled_day: number
}

export async function runWriter(params: {
  strategy: ContentStrategy
  campaignName: string
  campaignDescription: string
}): Promise<DraftPost[]> {
  const { strategy, campaignName, campaignDescription } = params

  const systemPrompt = `You are a social media copywriter for ${workspace.business.name} — ${workspace.business.tagline}.

Business: ${workspace.business.description}
Industry: ${workspace.business.industry}

Brand voice: ${workspace.brandVoice.tone}
Always: ${workspace.brandVoice.always.join(' | ')}
Never: ${workspace.brandVoice.avoid.join(' | ')}

Platform-specific guidance:
- LinkedIn: Professional tone, thought leadership, end with a question to drive comments. 150-300 words. Paragraphs, no bullet spam.
- Instagram: Punchy opener, visual language, 5-10 relevant hashtags, emoji used sparingly. 80-150 words.
- Facebook: Conversational, community-focused, can be longer. Include a clear CTA. 100-200 words.

Write posts that sound like a real freight forwarder who knows their stuff — not a corporate marketing bot.
Output valid JSON only.`

  const posts = strategy.posts

  // Batch posts by platform for efficiency
  const userMessage = `Campaign: "${campaignName}"
Campaign brief: ${campaignDescription}

Write post copy for each of these planned posts:
${posts.map((p, i) => `${i + 1}. Platform: ${p.platform} | Topic: ${p.topic} | Angle: ${p.angle} | Format: ${p.format}`).join('\n')}

Return a JSON array with one object per post, in the same order:
[
  {
    "platform": "linkedin" | "instagram" | "facebook",
    "title": "short internal title",
    "content": "full post copy ready to publish",
    "hashtags": ["tag1", "tag2"],
    "call_to_action": "the specific CTA at the end",
    "scheduled_day": <number matching the plan>
  }
]`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  const drafts = JSON.parse(clean) as DraftPost[]

  // Merge scheduled_day from strategy if missing
  return drafts.map((draft, i) => ({
    ...draft,
    scheduled_day: draft.scheduled_day ?? posts[i]?.scheduled_day ?? i + 1,
  }))
}
