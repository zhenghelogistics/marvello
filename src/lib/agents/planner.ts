import Anthropic from '@anthropic-ai/sdk'
import { workspace } from '@/lib/workspace'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface PostPlan {
  platform: 'linkedin' | 'instagram' | 'facebook'
  topic: string
  angle: string
  pillar: string
  format: 'post' | 'article' | 'carousel' | 'story'
  scheduled_day: number
}

export interface ContentStrategy {
  summary: string
  total_posts: number
  duration_days: number
  posts: PostPlan[]
}

export async function runPlanner(params: {
  campaignName: string
  description: string
  platforms: string[]
  contentPillars: string[]
  researchResults?: string
}): Promise<ContentStrategy> {
  const { campaignName, description, platforms, contentPillars, researchResults } = params

  const pillarsContext = workspace.contentPillars
    .filter(p => contentPillars.includes(p.id))
    .map(p => `- ${p.label} (${p.weight}%): ${p.description}`)
    .join('\n')

  const platformsContext = workspace.platforms
    .filter(p => platforms.includes(p.id))
    .map(p => `- ${p.id}: ${p.goal}. Post frequency: ${p.postFrequency}. Content split: ${JSON.stringify(p.contentSplit)}`)
    .join('\n')

  const systemPrompt = `You are a content strategist for ${workspace.business.name} — ${workspace.business.tagline}.

Business: ${workspace.business.description}
Industry: ${workspace.business.industry}
Primary goal: Lead generation — drive freight inquiries from social media.

Brand voice: ${workspace.brandVoice.tone}
Always do: ${workspace.brandVoice.always.join(', ')}
Avoid: ${workspace.brandVoice.avoid.join(', ')}

Target audience (priority order):
${workspace.audience.map(a => `${a.priority}. ${a.label}: ${a.description}`).join('\n')}

You must create a realistic, actionable content strategy that maps directly to the campaign brief.
Output valid JSON only — no markdown, no explanation outside the JSON.`

  const userMessage = `Campaign: "${campaignName}"
Brief: ${description}

Platforms to use:
${platformsContext}

Content pillars to focus on:
${pillarsContext}

${researchResults ? `Apify Research Results:\n${researchResults}\n\nUse these insights to inform topic selection and angles.` : ''}

Create a content strategy. Return JSON matching this exact structure:
{
  "summary": "1-2 sentence strategy overview",
  "total_posts": <number>,
  "duration_days": <number>,
  "posts": [
    {
      "platform": "linkedin" | "instagram" | "facebook",
      "topic": "specific topic title",
      "angle": "the specific angle or hook for this post",
      "pillar": "education" | "commentary" | "social-proof" | "behind-scenes",
      "format": "post" | "article" | "carousel" | "story",
      "scheduled_day": <day number from 1>
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip any markdown fences if present
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(clean) as ContentStrategy
}
