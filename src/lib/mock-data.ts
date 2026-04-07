import type {
  Post, Campaign, AgentLog, ConnectedAccount,
  AnalyticsSnapshot, TimeSeriesPoint, ApifyJob
} from '@/types'

// ── Posts ────────────────────────────────────────────────────────────────────

export const mockPosts: Post[] = [
  {
    id: 'p1',
    title: 'Q2 Product Launch Announcement',
    content: "We're thrilled to announce the launch of our next-generation platform — built for speed, scale, and your team's success. 🚀 #ProductLaunch #Innovation",
    platform: 'linkedin',
    status: 'published',
    scheduledAt: '2025-04-01T09:00:00Z',
    publishedAt: '2025-04-01T09:00:03Z',
    createdAt: '2025-03-28T14:00:00Z',
    campaignId: 'c1',
    metrics: { impressions: 14820, likes: 432, comments: 67, shares: 89, clicks: 1204, reach: 11300 },
  },
  {
    id: 'p2',
    title: 'Behind the Scenes — Team Culture',
    content: 'Great products start with great people. Here\'s a peek behind the scenes of how our team ships features every week. #TeamWork #Culture',
    platform: 'instagram',
    status: 'published',
    scheduledAt: '2025-04-02T12:00:00Z',
    publishedAt: '2025-04-02T12:00:05Z',
    createdAt: '2025-03-29T10:00:00Z',
    campaignId: 'c1',
    metrics: { impressions: 9870, likes: 891, comments: 134, shares: 45, clicks: 670, reach: 8200 },
  },
  {
    id: 'p3',
    title: 'Customer Success Story — TechCorp',
    content: 'How TechCorp scaled their marketing operations by 3× using AI-powered workflows. Read the full case study below 👇',
    platform: 'facebook',
    status: 'scheduled',
    scheduledAt: '2025-04-08T10:00:00Z',
    publishedAt: null,
    createdAt: '2025-04-05T09:00:00Z',
    campaignId: 'c2',
  },
  {
    id: 'p4',
    title: 'Weekly Industry Insights',
    content: '5 marketing trends reshaping B2B in 2025. Thread below ⬇️ #MarketingTrends #B2B',
    platform: 'linkedin',
    status: 'scheduled',
    scheduledAt: '2025-04-09T08:30:00Z',
    publishedAt: null,
    createdAt: '2025-04-05T11:00:00Z',
    campaignId: 'c2',
  },
  {
    id: 'p5',
    title: 'Product Tip Tuesday',
    content: 'Did you know you can automate your entire content pipeline in under 5 minutes? Here\'s how 👇 #ProductTip',
    platform: 'instagram',
    status: 'draft',
    scheduledAt: null,
    publishedAt: null,
    createdAt: '2025-04-06T15:00:00Z',
  },
  {
    id: 'p6',
    title: 'Webinar Promo — AI Marketing',
    content: 'Join us live on April 15th for "AI in Marketing 2025". Register now — link in bio.',
    platform: 'facebook',
    status: 'draft',
    scheduledAt: null,
    publishedAt: null,
    createdAt: '2025-04-06T16:00:00Z',
    campaignId: 'c3',
  },
  {
    id: 'p7',
    title: 'Feature Release — Smart Scheduling',
    content: 'New: Smart Scheduling is live. Let AI pick the best time to post for maximum reach. Available to all plans now.',
    platform: 'linkedin',
    status: 'failed',
    scheduledAt: '2025-03-30T09:00:00Z',
    publishedAt: null,
    createdAt: '2025-03-28T12:00:00Z',
    metrics: { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0, reach: 0 },
  },
]

// ── Agent Logs ───────────────────────────────────────────────────────────────

const c1Logs: AgentLog[] = [
  { id: 'l1', role: 'planner', status: 'done', message: 'Content strategy defined: 6 posts, 3 platforms, 2-week cadence.', timestamp: '2025-03-28T13:00:00Z', output: 'Strategy: Launch awareness → engagement → conversion funnel.' },
  { id: 'l2', role: 'writer', status: 'done', message: 'All 6 post drafts generated using brand voice guidelines.', timestamp: '2025-03-28T13:12:00Z' },
  { id: 'l3', role: 'reviewer', status: 'done', message: 'Posts reviewed. 1 revision requested for tone on post #3.', timestamp: '2025-03-28T13:25:00Z' },
  { id: 'l4', role: 'publisher', status: 'done', message: 'Posts scheduled across LinkedIn, Instagram, Facebook.', timestamp: '2025-03-28T13:30:00Z' },
  { id: 'l5', role: 'analyst', status: 'done', message: 'Post-publish analytics collected. Avg. engagement rate: 4.2%.', timestamp: '2025-04-03T09:00:00Z', output: 'Top performer: LinkedIn post with 14.8K impressions.' },
]

const c2Logs: AgentLog[] = [
  { id: 'l6', role: 'planner', status: 'done', message: 'Strategy set: case study + thought leadership, LinkedIn-first.', timestamp: '2025-04-04T10:00:00Z' },
  { id: 'l7', role: 'writer', status: 'done', message: 'Drafts generated. Awaiting review.', timestamp: '2025-04-04T10:18:00Z' },
  { id: 'l8', role: 'reviewer', status: 'running', message: 'Reviewing tone and compliance...', timestamp: '2025-04-07T08:00:00Z' },
]

const c3Logs: AgentLog[] = [
  { id: 'l9', role: 'planner', status: 'running', message: 'Analyzing audience data and competitor posts via Apify...', timestamp: '2025-04-07T09:30:00Z' },
]

// ── Campaigns ────────────────────────────────────────────────────────────────

export const mockCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Q2 Product Launch',
    description: 'Full-funnel campaign for Q2 platform launch across LinkedIn, Instagram, and Facebook.',
    status: 'completed',
    platforms: ['linkedin', 'instagram', 'facebook'],
    startDate: '2025-03-28',
    endDate: '2025-04-07',
    createdAt: '2025-03-26T10:00:00Z',
    postsCount: 6,
    agentLogs: c1Logs,
    currentStep: null,
    progress: 100,
  },
  {
    id: 'c2',
    name: 'April Thought Leadership',
    description: 'Establish brand authority through case studies and industry insights.',
    status: 'active',
    platforms: ['linkedin', 'facebook'],
    startDate: '2025-04-04',
    endDate: '2025-04-30',
    createdAt: '2025-04-03T09:00:00Z',
    postsCount: 4,
    agentLogs: c2Logs,
    currentStep: 'reviewer',
    progress: 60,
  },
  {
    id: 'c3',
    name: 'Webinar Launch — AI Marketing 2025',
    description: 'Drive webinar registrations via organic social across all platforms.',
    status: 'active',
    platforms: ['linkedin', 'instagram', 'facebook'],
    startDate: '2025-04-07',
    createdAt: '2025-04-06T12:00:00Z',
    postsCount: 0,
    agentLogs: c3Logs,
    currentStep: 'planner',
    progress: 15,
  },
  {
    id: 'c4',
    name: 'May Brand Refresh',
    description: 'New visual identity rollout with updated messaging and brand voice.',
    status: 'draft',
    platforms: ['linkedin', 'instagram'],
    startDate: '2025-05-01',
    createdAt: '2025-04-07T08:00:00Z',
    postsCount: 0,
    agentLogs: [],
    currentStep: null,
    progress: 0,
  },
]

// ── Connected Accounts ───────────────────────────────────────────────────────

export const mockAccounts: ConnectedAccount[] = [
  {
    platform: 'linkedin',
    username: 'marvello-hq',
    displayName: 'Marvello',
    followers: 12400,
    isConnected: true,
    lastSync: '2025-04-07T08:00:00Z',
  },
  {
    platform: 'instagram',
    username: 'marvello.app',
    displayName: 'Marvello App',
    followers: 8900,
    isConnected: true,
    lastSync: '2025-04-07T08:00:00Z',
  },
  {
    platform: 'facebook',
    username: 'marvellohq',
    displayName: 'Marvello HQ',
    followers: 5300,
    isConnected: false,
    lastSync: '2025-04-05T10:00:00Z',
  },
]

// ── Analytics ────────────────────────────────────────────────────────────────

export const mockAnalytics: AnalyticsSnapshot[] = [
  { platform: 'linkedin', period: '30d', impressions: 68400, reach: 52000, engagement: 4.2, followers: 12400, followersGrowth: 8.4, posts: 14 },
  { platform: 'instagram', period: '30d', impressions: 41200, reach: 34000, engagement: 6.8, followers: 8900, followersGrowth: 12.1, posts: 18 },
  { platform: 'facebook', period: '30d', impressions: 22800, reach: 19500, engagement: 2.9, followers: 5300, followersGrowth: 3.2, posts: 10 },
]

export const mockTimeSeries: TimeSeriesPoint[] = [
  { date: '2025-03-09', value: 2100 },
  { date: '2025-03-10', value: 1800 },
  { date: '2025-03-11', value: 3400 },
  { date: '2025-03-12', value: 4200 },
  { date: '2025-03-13', value: 3800 },
  { date: '2025-03-14', value: 2600 },
  { date: '2025-03-15', value: 1900 },
  { date: '2025-03-16', value: 2800 },
  { date: '2025-03-17', value: 3900 },
  { date: '2025-03-18', value: 5100 },
  { date: '2025-03-19', value: 6200 },
  { date: '2025-03-20', value: 5800 },
  { date: '2025-03-21', value: 4100 },
  { date: '2025-03-22', value: 3200 },
  { date: '2025-03-23', value: 4600 },
  { date: '2025-03-24', value: 5900 },
  { date: '2025-03-25', value: 7200 },
  { date: '2025-03-26', value: 8100 },
  { date: '2025-03-27', value: 7600 },
  { date: '2025-03-28', value: 6300 },
  { date: '2025-03-29', value: 5100 },
  { date: '2025-03-30', value: 4800 },
  { date: '2025-03-31', value: 6700 },
  { date: '2025-04-01', value: 14820 },
  { date: '2025-04-02', value: 9870 },
  { date: '2025-04-03', value: 8200 },
  { date: '2025-04-04', value: 7100 },
  { date: '2025-04-05', value: 6400 },
  { date: '2025-04-06', value: 5900 },
  { date: '2025-04-07', value: 6800 },
]

export const mockEngagementByPlatform = [
  { platform: 'LinkedIn', engagement: 4.2, posts: 14, color: '#0077B5' },
  { platform: 'Instagram', engagement: 6.8, posts: 18, color: '#E1306C' },
  { platform: 'Facebook', engagement: 2.9, posts: 10, color: '#1877F2' },
]

// ── Apify Jobs ───────────────────────────────────────────────────────────────

export const mockApifyJobs: ApifyJob[] = [
  {
    id: 'aj1',
    type: 'competitor-analysis',
    status: 'done',
    query: '@competitorco LinkedIn posts last 30 days',
    result: 'Found 42 posts. Avg engagement: 3.1%. Top topics: AI, automation, team culture.',
    createdAt: '2025-04-06T10:00:00Z',
    completedAt: '2025-04-06T10:04:22Z',
  },
  {
    id: 'aj2',
    type: 'trending-topics',
    status: 'done',
    query: 'marketing automation AI trends April 2025',
    result: 'Top trending: #AIMarketing, #AgenticAI, #ContentOps, #MarTech2025',
    createdAt: '2025-04-07T08:30:00Z',
    completedAt: '2025-04-07T08:31:15Z',
  },
  {
    id: 'aj3',
    type: 'hashtag-research',
    status: 'running',
    query: '#SaaS #B2BMarketing performance metrics',
    createdAt: '2025-04-07T09:45:00Z',
  },
]

// ── Dashboard summary helpers ─────────────────────────────────────────────────

export const dashboardStats = {
  totalImpressions: 132400,
  impressionsGrowth: 18.4,
  totalEngagement: 4.8,
  engagementGrowth: 0.6,
  scheduledPosts: mockPosts.filter(p => p.status === 'scheduled').length,
  activeCampaigns: mockCampaigns.filter(c => c.status === 'active').length,
  totalFollowers: mockAccounts.reduce((s, a) => s + a.followers, 0),
  followersGrowth: 8.2,
}
