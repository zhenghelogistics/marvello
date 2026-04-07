'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { mockEngagementByPlatform } from '@/lib/mock-data'
import { formatNumber, platformLabel, cn } from '@/lib/utils'
import type { Post } from '@/types'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown, Download } from 'lucide-react'
import type { Platform } from '@/types'
import type { AnalyticsSnapshot } from '@/types'

const PERIODS = ['7d', '14d', '30d', '90d'] as const
type Period = typeof PERIODS[number]

function MetricCard({
  label, value, growth, suffix = '', accent,
}: {
  label: string; value: number | string; growth: number; suffix?: string; accent: string
}) {
  const isUp = growth >= 0
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10">
      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-semibold font-mono" style={{ color: accent }}>
        {typeof value === 'number' ? formatNumber(value) : value}{suffix}
      </p>
      <div className={cn('mt-1 flex items-center gap-1 text-xs font-medium', isUp ? 'text-emerald-400' : 'text-red-400')}>
        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {Math.abs(growth)}% vs last period
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-[#111118] px-3 py-2.5 text-xs shadow-xl">
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono font-semibold text-violet-300">{formatNumber(p.value)}</p>
      ))}
    </div>
  )
}

function PlatformBreakdown({ analytics }: { analytics: AnalyticsSnapshot[] }) {
  const colors: Record<Platform, string> = { linkedin: '#0077B5', instagram: '#E1306C', facebook: '#1877F2' }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {analytics.map(snap => {
        const color = colors[snap.platform as Platform]
        return (
          <div
            key={snap.platform}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <PlatformIcon platform={snap.platform as Platform} size={16} />
              <span className="text-sm font-semibold text-white">{platformLabel[snap.platform as Platform]}</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Impressions', value: formatNumber(snap.impressions) },
                { label: 'Reach', value: formatNumber(snap.reach) },
                { label: 'Engagement', value: `${snap.engagement}%` },
                { label: 'Followers', value: formatNumber(snap.followers) },
                { label: 'Follower Growth', value: `+${snap.followersGrowth}%` },
                { label: 'Posts', value: snap.posts },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-white/35">{label}</span>
                  <span className="font-mono font-semibold text-white/80">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min((snap.impressions / 70000) * 100, 100)}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface AnalyticsClientProps {
  analytics: AnalyticsSnapshot[]
  isLive: boolean
  posts: Post[]
  timeSeries: { date: string; value: number }[]
}

export function AnalyticsClient({ analytics, isLive, posts, timeSeries }: AnalyticsClientProps) {
  const [period, setPeriod] = useState<Period>('30d')
  const [activeMetric, setActiveMetric] = useState<'impressions' | 'engagement'>('impressions')

  const sliceMap: Record<Period, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 30 }
  const chartData = timeSeries.slice(-sliceMap[period])

  // Build engagement bar data from real analytics if available
  const barData = analytics.length > 0
    ? analytics.map(a => ({
        platform: platformLabel[a.platform as Platform],
        engagement: a.engagement,
        posts: a.posts,
        color: ({ linkedin: '#0077B5', instagram: '#E1306C', facebook: '#1877F2' } as Record<string, string>)[a.platform] ?? '#8B5CF6',
      }))
    : mockEngagementByPlatform

  // Compute KPI totals from analytics data
  const totalImpressions = analytics.reduce((s, a) => s + a.impressions, 0)
  const totalReach = analytics.reduce((s, a) => s + a.reach, 0)
  const avgEngagement = analytics.length > 0
    ? parseFloat((analytics.reduce((s, a) => s + a.engagement, 0) / analytics.length).toFixed(1))
    : 4.8
  const totalFollowersGrowth = analytics.length > 0
    ? parseFloat((analytics.reduce((s, a) => s + a.followersGrowth, 0) / analytics.length).toFixed(1))
    : 8.2

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Analytics"
        description={
          isLive
            ? 'Live data from connected platforms'
            : 'Performance insights across all connected platforms'
        }
        action={
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
            <div className="flex rounded-lg border border-white/5 bg-white/[0.03] p-0.5">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                    period === p ? 'bg-violet-600/30 text-violet-300' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/50 hover:bg-white/[0.06] transition-colors cursor-pointer">
              <Download size={12} />
              Export
            </button>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-5">
        <MetricCard label="Total Impressions" value={isLive ? totalImpressions : 132400} growth={18.4} accent="#8B5CF6" />
        <MetricCard label="Total Reach" value={isLive ? totalReach : 105500} growth={14.2} accent="#06B6D4" />
        <MetricCard label="Avg. Engagement" value={avgEngagement.toString()} suffix="%" growth={0.6} accent="#22C55E" />
        <MetricCard label="Followers Gained" value={2140} growth={isLive ? totalFollowersGrowth : 8.2} accent="#F59E0B" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-5">
        {/* Impressions over time */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-white">Posts scheduled per day</p>
            <div className="flex gap-1">
              {(['impressions', 'engagement'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium capitalize transition-all cursor-pointer',
                    activeMetric === m ? 'bg-violet-600/30 text-violet-300' : 'text-white/30 hover:text-white/50'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#areaGradient)" dot={false} activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement by platform bar */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-sm font-medium text-white mb-4">Engagement by Platform</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="platform" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="engagement" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-white mb-3">Platform Breakdown — {period}</p>
        <PlatformBreakdown analytics={analytics} />
      </div>

      {/* Posts table */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white">Drafted Posts</p>
          <span className="text-xs text-white/30">{posts.length} total</span>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-white/30 py-6 text-center">No posts yet — create a campaign to generate content</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Post', 'Platform', 'Status', 'Scheduled'].map(h => (
                    <th key={h} className="pb-2 text-left font-medium text-white/30 pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.slice(0, 10).map(post => (
                  <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-white/70 truncate max-w-[220px]">{post.title}</p>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon platform={post.platform} size={12} />
                        <span className="text-white/40">{platformLabel[post.platform]}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        post.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' :
                        post.status === 'scheduled' ? 'bg-violet-500/15 text-violet-400' :
                        'bg-white/5 text-white/30'
                      )}>{post.status}</span>
                    </td>
                    <td className="py-2.5 font-mono text-white/40">
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
