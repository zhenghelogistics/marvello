'use client'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/ui-custom/stat-card'
import { StatusBadge } from '@/components/ui-custom/badge-status'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { formatNumber, formatRelativeTime, formatDateTime, platformLabel } from '@/lib/utils'
import {
  Eye, Users, TrendingUp, CalendarClock,
  Bot, ChevronRight, Plus, ArrowUpRight, FileText
} from 'lucide-react'
import Link from 'next/link'
import type { Campaign, Post } from '@/types'

const agentSteps = ['planner', 'writer', 'reviewer', 'publisher', 'analyst'] as const
const stepColors: Record<string, string> = {
  planner: '#8B5CF6', writer: '#06B6D4',
  reviewer: '#F59E0B', publisher: '#22C55E', analyst: '#EC4899',
}
const stepLabels: Record<string, string> = {
  planner: 'Plan', writer: 'Write', reviewer: 'Review', publisher: 'Publish', analyst: 'Analyse',
}

function AgentPipeline({ currentStep }: { currentStep: string | null }) {
  const currentIdx = currentStep ? agentSteps.indexOf(currentStep as typeof agentSteps[number]) : -1
  return (
    <div className="flex items-center gap-1">
      {agentSteps.map((step, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        const color = stepColors[step]
        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className="flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium transition-all"
              style={{
                background: isActive ? `${color}25` : isDone ? `${color}12` : 'rgba(255,255,255,0.04)',
                color: isActive ? color : isDone ? `${color}80` : 'rgba(255,255,255,0.25)',
                border: isActive ? `1px solid ${color}40` : '1px solid transparent',
              }}
            >
              {isActive && <span className="h-1 w-1 rounded-full agent-pulse" style={{ background: color }} />}
              {stepLabels[step]}
            </div>
            {i < agentSteps.length - 1 && <ChevronRight size={10} className="text-white/15" />}
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  campaigns: Campaign[]
  recentPosts: Post[]
  stats: {
    totalFollowers: number
    totalImpressions: number
    avgEngagement: number
    scheduledPosts: number
  }
}

export function DashboardClient({ campaigns, recentPosts, stats }: Props) {
  const activeCampaigns = campaigns.filter(c => c.currentStep !== null || c.status === 'active')

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Dashboard"
        description="Your marketing command center"
        action={
          <Link
            href="/campaigns"
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 cursor-pointer"
          >
            <Plus size={13} />
            New Campaign
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Impressions"
          value={stats.totalImpressions > 0 ? formatNumber(stats.totalImpressions) : '—'}
          accent="#8B5CF6"
          icon={<Eye size={16} />}
        />
        <StatCard
          label="Avg. Engagement"
          value={stats.avgEngagement > 0 ? `${stats.avgEngagement}%` : '—'}
          accent="#06B6D4"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Total Followers"
          value={stats.totalFollowers > 0 ? formatNumber(stats.totalFollowers) : '—'}
          accent="#22C55E"
          icon={<Users size={16} />}
        />
        <StatCard
          label="Scheduled Posts"
          value={stats.scheduledPosts}
          accent="#F59E0B"
          icon={<CalendarClock size={16} />}
        />
      </div>

      {/* Active agents + recent posts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Active agent runs */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={15} className="text-violet-400" />
            <p className="text-sm font-medium text-white">Active Agents</p>
            <span className="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
              {activeCampaigns.length} running
            </span>
          </div>
          <div className="space-y-3">
            {activeCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot size={22} className="text-white/10 mb-2" />
                <p className="text-xs text-white/25">No active campaigns</p>
                <Link href="/campaigns" className="mt-2 text-xs text-violet-400/60 hover:text-violet-400 transition-colors">
                  Create one →
                </Link>
              </div>
            ) : (
              activeCampaigns.map(campaign => (
                <Link
                  key={campaign.id}
                  href="/workflows"
                  className="block rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-violet-500/20 hover:bg-white/[0.04] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-white/80 leading-tight">{campaign.name}</p>
                    <ArrowUpRight size={11} className="text-white/25 shrink-0 mt-0.5" />
                  </div>
                  <div className="mt-2">
                    <AgentPipeline currentStep={campaign.currentStep} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${campaign.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-white/30 font-mono">{campaign.progress}%</span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-4 border-t border-white/5 pt-3">
            <Link href="/campaigns" className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors flex items-center gap-1">
              All campaigns <ChevronRight size={11} />
            </Link>
          </div>
        </div>

        {/* Recent posts — 2/3 width */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-white/40" />
              <p className="text-sm font-medium text-white">Recent Posts</p>
            </div>
            <Link href="/campaigns" className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors">
              View all →
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={22} className="text-white/10 mb-2" />
              <p className="text-xs text-white/25">No posts yet</p>
              <p className="text-[11px] text-white/15 mt-1">Create a campaign and let the agents write your content</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <PlatformIcon platform={post.platform} size={15} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{post.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {platformLabel[post.platform]} · {post.scheduledAt
                        ? formatDateTime(post.scheduledAt)
                        : formatRelativeTime(post.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={post.status} type="post" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Setup prompt if no real data yet */}
      {recentPosts.length === 0 && activeCampaigns.length === 0 && (
        <div className="mt-4 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={15} className="text-violet-400" />
            <p className="text-sm font-semibold text-white">Get started</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/40">
            <div className="rounded-lg border border-white/5 p-3">
              <p className="font-semibold text-white/60 mb-1">1. Add API keys</p>
              <p>Go to Settings → API Keys and add your Anthropic + Apify tokens</p>
            </div>
            <div className="rounded-lg border border-white/5 p-3">
              <p className="font-semibold text-white/60 mb-1">2. Create a campaign</p>
              <p>Click "New Campaign", describe your goal, and launch the agent pipeline</p>
            </div>
            <div className="rounded-lg border border-white/5 p-3">
              <p className="font-semibold text-white/60 mb-1">3. Review your content</p>
              <p>Open the campaign, click the Posts tab to read and copy AI-drafted posts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
