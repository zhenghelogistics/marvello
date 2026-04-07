import {
  pgTable, text, integer, real, boolean,
  timestamp, pgEnum
} from 'drizzle-orm/pg-core'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const platformEnum = pgEnum('platform', ['linkedin', 'instagram', 'facebook'])
export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'published', 'failed'])
export const campaignStatusEnum = pgEnum('campaign_status', ['active', 'paused', 'completed', 'draft'])
export const agentStatusEnum = pgEnum('agent_status', ['idle', 'running', 'done', 'error'])
export const agentRoleEnum = pgEnum('agent_role', ['planner', 'writer', 'reviewer', 'publisher', 'analyst'])
export const apifyJobTypeEnum = pgEnum('apify_job_type', ['competitor-analysis', 'trending-topics', 'hashtag-research', 'profile-scrape'])
export const apifyJobStatusEnum = pgEnum('apify_job_status', ['queued', 'running', 'done', 'failed'])

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  platforms: text('platforms').array().notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  postsCount: integer('posts_count').notNull().default(0),
  currentStep: agentRoleEnum('current_step'),
  progress: integer('progress').notNull().default(0),
  apifyResearch: boolean('apify_research').notNull().default(true),
  humanReview: boolean('human_review').notNull().default(true),
  contentPillars: text('content_pillars').array().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ── Agent Logs ────────────────────────────────────────────────────────────────

export const agentLogs = pgTable('agent_logs', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  role: agentRoleEnum('role').notNull(),
  status: agentStatusEnum('status').notNull(),
  message: text('message').notNull(),
  output: text('output'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ── Posts ─────────────────────────────────────────────────────────────────────

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  platform: platformEnum('platform').notNull(),
  status: postStatusEnum('status').notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  imageUrl: text('image_url'),
  impressions: integer('impressions'),
  likes: integer('likes'),
  comments: integer('comments'),
  shares: integer('shares'),
  clicks: integer('clicks'),
  reach: integer('reach'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ── Apify Jobs ────────────────────────────────────────────────────────────────

export const apifyJobs = pgTable('apify_jobs', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  type: apifyJobTypeEnum('type').notNull(),
  status: apifyJobStatusEnum('status').notNull().default('queued'),
  query: text('query').notNull(),
  result: text('result'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})
