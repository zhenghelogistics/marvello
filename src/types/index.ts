export type Platform = 'linkedin' | 'instagram' | 'facebook'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'
export type AgentStatus = 'idle' | 'running' | 'done' | 'error'
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft'
export type AgentRole = 'planner' | 'writer' | 'reviewer' | 'publisher' | 'analyst'

export interface Post {
  id: string
  title: string
  content: string
  platform: Platform
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  imageUrl?: string
  campaignId?: string
  metrics?: PostMetrics
}

export interface PostMetrics {
  impressions: number
  likes: number
  comments: number
  shares: number
  clicks: number
  reach: number
}

export interface Campaign {
  id: string
  name: string
  description: string
  status: CampaignStatus
  platforms: Platform[]
  startDate: string
  endDate?: string
  createdAt: string
  postsCount: number
  agentLogs: AgentLog[]
  currentStep: AgentRole | null
  progress: number
  apifyResearch: boolean
  apifyJobs?: ApifyJob[]
}

export interface AgentLog {
  id: string
  role: AgentRole
  status: AgentStatus
  message: string
  timestamp: string
  output?: string
}

export interface ConnectedAccount {
  platform: Platform
  username: string
  displayName: string
  followers: number
  isConnected: boolean
  avatarUrl?: string
  lastSync: string
}

export interface AnalyticsSnapshot {
  platform: Platform
  period: string
  impressions: number
  reach: number
  engagement: number
  followers: number
  followersGrowth: number
  posts: number
  topPost?: Post
}

export interface TimeSeriesPoint {
  date: string
  value: number
  platform?: Platform
}

export interface ApifyJob {
  id: string
  type: 'competitor-analysis' | 'trending-topics' | 'hashtag-research' | 'profile-scrape'
  status: 'queued' | 'running' | 'done' | 'failed'
  query: string
  result?: string
  createdAt: string
  completedAt?: string
}
