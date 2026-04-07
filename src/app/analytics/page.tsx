'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { mockAnalytics, mockTimeSeries, mockEngagementByPlatform } from '@/lib/mock-data'
import { formatNumber, platformLabel, cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown, Download } from 'lucide-react'
import type { Platform } from '@/types'

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

function PlatformBreakdown() {
  const colors = { linkedin: '#0077B5', instagram: '#E1306C', facebook: '#1877F2' }
  const data = mockAnalytics.map(a => ({
    name: platformLabel[a.platform],
    impressions: a.impressions,
    reach: a.reach,
    engagement: a.engagement,
    color: colors[a.platform],
  }))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {mockAnalytics.map(snap => {
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
                style={{ width: `${(snap.impressions / 70000) * 100}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [activeMetric, setActiveMetric] = useState<'impressions' | 'engagement'>('impressions')

  const sliceMap: Record<Period, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 30 }
  const chartData = mockTimeSeries.slice(-sliceMap[period]).map(d => ({
    date: d.date.slice(5),
    value: d.value,
  }))

  const barData = mockEngagementByPlatform

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Performance insights across all connected platforms"
        action={
          <div className="flex items-center gap-2">
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
        <MetricCard label="Total Impressions" value={132400} growth={18.4} accent="#8B5CF6" />
        <MetricCard label="Total Reach" value={105500} growth={14.2} accent="#06B6D4" />
        <MetricCard label="Avg. Engagement" value="4.8" suffix="%" growth={0.6} accent="#22C55E" />
        <MetricCard label="Followers Gained" value={2140} growth={8.2} accent="#F59E0B" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-5">
        {/* Impressions over time */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-white">Impressions over time</p>
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
        <PlatformBreakdown />
      </div>

      {/* Top posts table */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <p className="text-sm font-medium text-white mb-4">Top Performing Posts</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {['Post', 'Platform', 'Impressions', 'Likes', 'Comments', 'Shares', 'Eng. Rate'].map(h => (
                  <th key={h} className="pb-2 text-left font-medium text-white/30 pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { title: 'Q2 Product Launch Announcement', platform: 'linkedin' as Platform, metrics: { impressions: 14820, likes: 432, comments: 67, shares: 89, clicks: 1204, reach: 11300 } },
                { title: 'Behind the Scenes — Team Culture', platform: 'instagram' as Platform, metrics: { impressions: 9870, likes: 891, comments: 134, shares: 45, clicks: 670, reach: 8200 } },
              ].map((post, i) => {
                const engRate = post.metrics ? ((post.metrics.likes + post.metrics.comments + post.metrics.shares) / post.metrics.impressions * 100).toFixed(1) : '—'
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-white/70 truncate max-w-[180px]">{post.title}</p>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon platform={post.platform} size={12} />
                        <span className="text-white/40">{platformLabel[post.platform]}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-white/60">{formatNumber(post.metrics.impressions)}</td>
                    <td className="py-2.5 pr-4 font-mono text-white/60">{post.metrics.likes}</td>
                    <td className="py-2.5 pr-4 font-mono text-white/60">{post.metrics.comments}</td>
                    <td className="py-2.5 pr-4 font-mono text-white/60">{post.metrics.shares}</td>
                    <td className="py-2.5 font-mono text-emerald-400">{engRate}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
