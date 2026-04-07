export interface AnalyticsData {
  platform: 'linkedin' | 'instagram' | 'facebook'
  impressions: number
  reach: number
  engagement: number // percentage
  followers: number
  followersGrowth: number // percentage vs previous period
  postsCount: number
}
