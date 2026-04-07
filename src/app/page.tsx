'use client'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/ui-custom/stat-card'
import { StatusBadge } from '@/components/ui-custom/badge-status'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import {
  dashboardStats, mockPosts, mockCampaigns, mockApifyJobs
} from '@/lib/mock-data'
import { formatNumber, formatRelativeTime, formatDateTime, platformLabel } from '@/lib/utils'
import {
  Eye, Users, TrendingUp, CalendarClock,
  Bot, Zap, ChevronRight, Plus, ArrowUpRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { mockTimeSeries } from '@/lib/mock-data'
import Link from 'next/link'

const agentSteps = ['planner', 'writer', 'reviewer', 'publisher', 'analyst'] as const

function AgentPipeline({ currentStep }: { currentStep: string | null }) {
  const stepColors: Record<string, string> = {
    planner: '#8B5CF6', writer: '#06B6D4',
    reviewer: '#F59E0B', publisher: '#22C55E', analyst: '#EC4899',
  }
  const stepLabels: Record<string, string> = {
    planner: 'Plan', writer: 'Write', reviewer: 'Review', publisher: 'Publish', analyst: 'Analyse',
  }
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
            {i < agentSteps.length - 1 && (
              <ChevronRight size={10} className="text-white/15" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-[#111118] px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50">{label}</p>
      <p className="mt-0.5 font-mono font-semibold text-violet-300">{formatNumber(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const recentPosts = mockPosts.slice(0, 5)
  const activeCampaigns = mockCampaigns.filter(c => c.status === 'active')
  const chartData = mockTimeSeries.slice(-14).map(d => ({
    date: d.date.slice(5),
    value: d.value,
  }))

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
          value={formatNumber(dashboardStats.totalImpressions)}
          change={dashboardStats.impressionsGrowth}
          accent="#8B5CF6"
          icon={<Eye size={16} />}
        />
        <StatCard
          label="Avg. Engagement"
          value={`${dashboardStats.totalEngagement}%`}
          change={dashboardStats.engagementGrowth}
          accent="#06B6D4"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Total Followers"
          value={formatNumber(dashboardStats.totalFollowers)}
          change={dashboardStats.followersGrowth}
          accent="#22C55E"
          icon={<Users size={16} />}
        />
        <StatCard
          label="Scheduled Posts"
          value={dashboardStats.scheduledPosts}
          accent="#F59E0B"
          icon={<CalendarClock size={16} />}
        />
      </div>

      {/* Chart + Agent activity */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Impressions chart */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Impressions — Last 14 days</p>
              <p className="text-xs text-white/35 mt-0.5">All platforms combined</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              ▲ {dashboardStats.impressionsGrowth}%
            </span>
          </div>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatNumber}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#violetGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active agents */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={15} className="text-violet-400" />
            <p className="text-sm font-medium text-white">Active Agents</p>
            <span className="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
              {activeCampaigns.length} running
            </span>
          </div>
          <div className="space-y-3">
            {activeCampaigns.length === 0 && (
              <p className="text-sm text-white/30 text-center py-6">No active campaigns</p>
            )}
            {activeCampaigns.map(campaign => (
              <Link
                key={campaign.id}
                href="/campaigns"
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
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">{campaign.progress}%</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Apify jobs */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-amber-400" />
              <p className="text-xs font-medium text-white/50">Apify Research</p>
            </div>
            <div className="space-y-2">
              {mockApifyJobs.slice(0, 2).map(job => (
                <div key={job.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: job.status === 'done' ? '#22C55E' : job.status === 'running' ? '#8B5CF6' : '#6B7280' }}
                  />
                  <span className="truncate text-white/40">{job.query}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white">Recent Posts</p>
          <Link href="/calendar" className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
            View calendar →
          </Link>
        </div>
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
              {post.metrics && (
                <div className="hidden md:flex items-center gap-4 text-xs text-white/40 font-mono">
                  <span>{formatNumber(post.metrics.impressions)} impr.</span>
                  <span>{post.metrics.likes} likes</span>
                </div>
              )}
              <StatusBadge status={post.status} type="post" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
