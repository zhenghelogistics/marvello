import Anthropic from '@anthropic-ai/sdk'
import { workspace } from '@/lib/workspace'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 50_000 })

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

Create a content strategy. Limit to a maximum of 3 posts total. Return JSON matching this exact structure:
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
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemPrompt,
    tools: [
      {
        name: 'output_strategy',
        description: 'Output the content strategy',
        input_schema: {
          type: 'object' as const,
          properties: {
            summary: { type: 'string' },
            total_posts: { type: 'number' },
            duration_days: { type: 'number' },
            posts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string', enum: ['linkedin', 'instagram', 'facebook'] },
                  topic: { type: 'string' },
                  angle: { type: 'string' },
                  pillar: { type: 'string' },
                  format: { type: 'string', enum: ['post', 'article', 'carousel', 'story'] },
                  scheduled_day: { type: 'number' },
                },
                required: ['platform', 'topic', 'angle', 'pillar', 'format', 'scheduled_day'],
              },
            },
          },
          required: ['summary', 'total_posts', 'duration_days', 'posts'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'output_strategy' },
    messages: [{ role: 'user', content: userMessage }],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Planner did not return a strategy')
  return toolUse.input as ContentStrategy
}
