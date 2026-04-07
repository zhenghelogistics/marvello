'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApifyJob } from '@/types'

const JOB_TYPE_LABELS: Record<string, string> = {
  'competitor-analysis': 'Competitor Analysis',
  'trending-topics': 'Trending Topics',
  'hashtag-research': 'Hashtag Research',
  'profile-scrape': 'Profile Scrape',
}

function JobResultBlock({ result }: { result: string }) {
  const [expanded, setExpanded] = useState(false)
  const truncated = result.length > 300 && !expanded
  const display = truncated ? result.slice(0, 300) + '…' : result

  return (
    <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[11px] text-white/40 font-mono leading-relaxed whitespace-pre-wrap break-words">
        {display}
      </p>
      {result.length > 300 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 flex items-center gap-1 text-[11px] text-amber-400/70 hover:text-amber-400 transition-colors cursor-pointer"
        >
          {expanded ? (
            <><ChevronUp size={11} /> show less</>
          ) : (
            <><ChevronDown size={11} /> show more</>
          )}
        </button>
      )}
    </div>
  )
}

function JobRow({ job }: { job: ApifyJob }) {
  const label = JOB_TYPE_LABELS[job.type] ?? job.type
  const resultText = job.result
    ? (() => {
        try {
          const parsed = JSON.parse(job.result)
          return JSON.stringify(parsed, null, 2)
        } catch {
          return job.result
        }
      })()
    : null

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-3">
        {job.status === 'running' && (
          <Loader2 size={14} className="shrink-0 animate-spin text-amber-400" />
        )}
        {job.status === 'done' && (
          <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
        )}
        {job.status === 'failed' && (
          <XCircle size={14} className="shrink-0 text-red-400" />
        )}
        {job.status === 'queued' && (
          <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white">{label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-mono',
                job.status === 'running' && 'bg-amber-500/15 text-amber-400',
                job.status === 'done' && 'bg-emerald-500/15 text-emerald-400',
                job.status === 'failed' && 'bg-red-500/15 text-red-400',
                job.status === 'queued' && 'bg-white/5 text-white/30',
              )}
            >
              {job.status}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/35 truncate">{job.query}</p>
        </div>
      </div>

      {job.status === 'done' && resultText && (
        <JobResultBlock result={resultText} />
      )}

      {job.status === 'failed' && (
        <p className="mt-2 text-[11px] text-red-400/60">Research run failed. Try refreshing or re-running the campaign.</p>
      )}
    </div>
  )
}

interface ResearchPanelProps {
  campaignId: string
}

export function ResearchPanel({ campaignId }: ResearchPanelProps) {
  const [jobs, setJobs] = useState<ApifyJob[]>([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaignId}`)
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data.apifyJobs)) {
      setJobs(data.apifyJobs)
    }
  }, [campaignId])

  const pollAndRefresh = useCallback(async () => {
    setPolling(true)
    setError(null)
    try {
      await fetch('/api/apify/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      await fetchJobs()
    } catch {
      setError('Failed to poll for updates.')
    } finally {
      setPolling(false)
    }
  }, [campaignId, fetchJobs])

  // On mount: poll then fetch
  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      try {
        await fetch('/api/apify/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId }),
        })
        if (!cancelled) await fetchJobs()
      } catch {
        if (!cancelled) setError('Failed to load research data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [campaignId, fetchJobs])

  const hasRunning = jobs.some(j => j.status === 'running' || j.status === 'queued')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-white/25">Apify Research</p>
        </div>
        <button
          onClick={pollAndRefresh}
          disabled={polling || loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-white/40 hover:bg-white/[0.05] hover:text-white/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw size={11} className={cn(polling && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-white/30">
          <Loader2 size={13} className="animate-spin text-amber-400" />
          Loading research jobs…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/10 bg-red-500/[0.04] px-3 py-2.5 text-xs text-red-400/70">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/5 px-4 py-6 text-center">
          <Zap size={20} className="mx-auto mb-2 text-white/10" />
          <p className="text-xs text-white/25">No research jobs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => <JobRow key={job.id} job={job} />)}
          {hasRunning && (
            <p className="text-center text-[10px] text-white/25 pt-1">
              Research is in progress — click Refresh to check for updates
            </p>
          )}
        </div>
      )}
    </div>
  )
}
