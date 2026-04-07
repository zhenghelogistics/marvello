import Anthropic from '@anthropic-ai/sdk'
import { workspace } from '@/lib/workspace'
import type { DraftPost } from './writer'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ReviewedPost extends DraftPost {
  approved: boolean
  revision?: string
}

export interface ReviewResult {
  approved_count: number
  revised_count: number
  overall_feedback: string
  posts: ReviewedPost[]
}

export async function runReviewer(params: {
  drafts: DraftPost[]
  campaignName: string
}): Promise<ReviewResult> {
  const { drafts, campaignName } = params

  const systemPrompt = `You are the brand reviewer for ${workspace.business.name}.

Your job: review drafted social posts for quality, brand voice, and accuracy.

Brand voice checklist:
✓ Plain-spoken — no unnecessary jargon (or jargon is explained)
✓ Practical — includes a concrete takeaway
✓ Specific — uses real examples, not vague claims
✓ Has a clear CTA on lead-gen posts
✗ No corporate fluff (e.g. "leverage synergies", "robust solution")
✗ No unexplained acronyms (FCL, LCL, 3PL must be defined on first use)
✗ No vague promises without specifics

If a post passes all checks: approved = true
If a post needs a minor fix: approved = false, provide the revised content in the "revision" field
Output valid JSON only.`

  const userMessage = `Review these drafted posts for the "${campaignName}" campaign:

${drafts.map((p, i) => `Post ${i + 1} [${p.platform.toUpperCase()}]:
Title: ${p.title}
Content: ${p.content}
Hashtags: ${p.hashtags.join(', ')}
CTA: ${p.call_to_action}
---`).join('\n')}

Return JSON:
{
  "approved_count": <number>,
  "revised_count": <number>,
  "overall_feedback": "1-2 sentences on overall quality",
  "posts": [
    {
      "platform": "...",
      "title": "...",
      "content": "...",
      "hashtags": [...],
      "call_to_action": "...",
      "scheduled_day": <number>,
      "approved": true | false,
      "revision": "revised content if approved is false, otherwise omit"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    tools: [
      {
        name: 'output_review',
        description: 'Output the review results',
        input_schema: {
          type: 'object' as const,
          properties: {
            approved_count: { type: 'number' },
            revised_count: { type: 'number' },
            overall_feedback: { type: 'string' },
            posts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                  hashtags: { type: 'array', items: { type: 'string' } },
                  call_to_action: { type: 'string' },
                  scheduled_day: { type: 'number' },
                  approved: { type: 'boolean' },
                  revision: { type: 'string' },
                },
                required: ['platform', 'title', 'content', 'hashtags', 'call_to_action', 'scheduled_day', 'approved'],
              },
            },
          },
          required: ['approved_count', 'revised_count', 'overall_feedback', 'posts'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'output_review' },
    messages: [{ role: 'user', content: userMessage }],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Reviewer did not return results')
  const raw = toolUse.input as ReviewResult & { posts?: ReviewedPost[] }
  if (!Array.isArray(raw.posts)) raw.posts = []
  return raw
}
