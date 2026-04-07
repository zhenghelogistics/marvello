'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/ui-custom/badge-status'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { formatDateTime, platformLabel, cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Post } from '@/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function getPostsForDay(posts: Post[], year: number, month: number, day: number) {
  return posts.filter(p => {
    const date = p.scheduledAt || p.publishedAt
    if (!date) return false
    const d = new Date(date)
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  })
}

const statusDot: Record<string, string> = {
  published: '#22C55E', scheduled: '#8B5CF6', draft: '#6B7280', failed: '#EF4444',
}

export function CalendarClient({ posts }: { posts: Post[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')

  const days = getCalendarDays(year, month)

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setSelectedDay(null) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setSelectedDay(null) }

  const selectedPosts = selectedDay ? getPostsForDay(posts, year, month, selectedDay) : []
  const upcomingPosts = posts
    .filter(p => p.scheduledAt || p.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt ?? a.createdAt).getTime() - new Date(b.scheduledAt ?? b.createdAt).getTime())

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Content Calendar"
        description={`${posts.length} posts scheduled`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/5 bg-white/[0.03] p-0.5">
              {(['month', 'list'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)} className={cn('rounded-md px-3 py-1 text-xs font-medium capitalize transition-all cursor-pointer', viewMode === v ? 'bg-violet-600/30 text-violet-300' : 'text-white/40 hover:text-white/60')}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Calendar grid */}
          <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"><ChevronLeft size={16} /></button>
              <h2 className="text-sm font-semibold text-white">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"><ChevronRight size={16} /></button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/25 py-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-px">
              {days.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} className="aspect-square" />
                const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
                const isSelected = selectedDay === day
                const dayPosts = getPostsForDay(posts, year, month, day)
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn('relative flex flex-col items-center rounded-lg p-1.5 transition-all cursor-pointer', isSelected ? 'bg-violet-600/20 ring-1 ring-violet-500/40' : 'hover:bg-white/[0.04]')}
                  >
                    <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium', isToday ? 'bg-violet-600 text-white' : isSelected ? 'text-violet-300' : 'text-white/60')}>
                      {day}
                    </span>
                    {dayPosts.length > 0 && (
                      <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                        {dayPosts.slice(0, 3).map(p => (
                          <span key={p.id} className="h-1 w-1 rounded-full" style={{ background: statusDot[p.status] }} />
                        ))}
                        {dayPosts.length > 3 && <span className="text-[9px] text-white/30">+{dayPosts.length - 3}</span>}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4">
              {Object.entries(statusDot).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5 text-xs text-white/30">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day panel */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            {selectedDay ? (
              <>
                <p className="text-sm font-semibold text-white mb-4">{MONTHS[month]} {selectedDay}</p>
                {selectedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-sm text-white/30">No posts scheduled</p>
                    <p className="text-xs text-white/20 mt-1">Create a campaign to generate posts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPosts.map(post => (
                      <div key={post.id} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <PlatformIcon platform={post.platform} size={13} />
                          <span className="text-xs text-white/40">{platformLabel[post.platform]}</span>
                          <StatusBadge status={post.status} type="post" className="ml-auto" />
                        </div>
                        <p className="text-xs font-medium text-white/80">{post.title}</p>
                        <p className="mt-1 text-[11px] text-white/35 line-clamp-3">{post.content}</p>
                        {post.scheduledAt && (
                          <p className="mt-2 text-[10px] text-white/25">{formatDateTime(post.scheduledAt)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <p className="text-sm text-white/30">Select a day</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-sm font-medium text-white mb-4">All Scheduled Posts ({upcomingPosts.length})</p>
          {upcomingPosts.length === 0 ? (
            <p className="text-sm text-white/30 py-8 text-center">No scheduled posts — create a campaign to generate content</p>
          ) : (
            <div className="divide-y divide-white/5">
              {upcomingPosts.map(post => (
                <div key={post.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  {post.scheduledAt && (
                    <div className="hidden sm:flex flex-col items-center w-10 shrink-0">
                      <span className="text-lg font-bold font-mono text-white/60">{new Date(post.scheduledAt).getDate()}</span>
                      <span className="text-[10px] text-white/25 uppercase">{MONTHS[new Date(post.scheduledAt).getMonth()].slice(0, 3)}</span>
                    </div>
                  )}
                  <PlatformIcon platform={post.platform} size={15} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{post.title}</p>
                    <p className="text-xs text-white/30 mt-0.5 truncate">{post.content}</p>
                  </div>
                  <div className="hidden md:block text-xs text-white/30 shrink-0">
                    {post.scheduledAt && formatDateTime(post.scheduledAt)}
                  </div>
                  <StatusBadge status={post.status} type="post" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
