'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/page-header'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { cn, formatRelativeTime, agentRoleColor, agentRoleLabel } from '@/lib/utils'
import {
  Check, AlertCircle, Loader2, ChevronDown, ChevronRight,
  Bot, FileText, Clock
} from 'lucide-react'
import type { Campaign, AgentLog, AgentRole } from '@/types'

const AGENT_STEPS: AgentRole[] = ['planner', 'writer', 'reviewer']

const STEP_DESCRIPTIONS: Record<string, string> = {
  planner: 'Builds content strategy — platforms, topics, post schedule',
  writer: 'Drafts all posts using brand voice guidelines',
  reviewer: 'Checks drafts for quality, tone, and brand alignment — then saves posts for your review',
}

function StepNode({ step, log, isActive, isFuture }: {
  step: AgentRole
  log: AgentLog | undefined
  isActive: boolean
  isFuture: boolean
}) {
  const isDone = log?.status === 'done'
  const isError = log?.status === 'error'
  const color = agentRoleColor[step]

  return (
    <div className={cn('flex gap-3', isFuture && 'opacity-30')}>
      <div className="flex flex-col items-center gap-0">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
            isDone ? 'bg-emerald-500/20 text-emerald-400' :
            isError ? 'bg-red-500/20 text-red-400' :
            isActive ? '' :
            'bg-white/5 text-white/20'
          )}
          style={isActive ? { background: `${color}20`, color, outline: `2px solid ${color}50` } : {}}
        >
          {isDone ? <Check size={14} /> :
           isError ? <AlertCircle size={14} /> :
           isActive ? <Loader2 size={14} className="animate-spin" /> :
           <Bot size={14} />}
        </div>
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white capitalize">{agentRoleLabel[step]}</span>
          {isDone && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">Done</span>}
          {isActive && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${color}20`, color }}>Running</span>}
          {isError && <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">Error</span>}
          {log && <span className="text-[10px] text-white/25 ml-auto">{formatRelativeTime(log.timestamp)}</span>}
        </div>
        <p className="text-[11px] text-white/35 mt-0.5">{STEP_DESCRIPTIONS[step]}</p>
        {log?.message && (
          <p className="mt-1 text-[11px] text-white/50 italic">{log.message}</p>
        )}
      </div>
    </div>
  )
}

function WorkflowCard({ campaign: initial }: { campaign: Campaign }) {
  const [campaign, setCampaign] = useState(initial)
  const [expanded, setExpanded] = useState(initial.currentStep !== null)
  const [showOutput, setShowOutput] = useState<string | null>(null)

  const poll = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaign.id}`)
    if (!res.ok) return
    const data = await res.json() as Campaign & { agentLogs: AgentLog[] }
    setCampaign(prev => ({
      ...prev,
      currentStep: data.currentStep,
      progress: data.progress,
      status: data.status,
      postsCount: data.postsCount,
      agentLogs: data.agentLogs,
    }))
  }, [campaign.id])

  useEffect(() => {
    if (campaign.currentStep === null) return
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [campaign.currentStep, poll])

  const isRunning = campaign.currentStep !== null
  const completedSteps = campaign.agentLogs.filter(l => l.status === 'done').length
  const hasError = campaign.agentLogs.some(l => l.status === 'error')

  return (
    <div className={cn(
      'rounded-xl border bg-white/[0.02] transition-all',
      isRunning ? 'border-violet-500/30' : hasError ? 'border-red-500/20' : 'border-white/5'
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-3 p-4 text-left cursor-pointer"
      >
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isRunning ? 'bg-violet-500/15' : hasError ? 'bg-red-500/10' : 'bg-white/5'
        )}>
          {isRunning
            ? <Loader2 size={16} className="text-violet-400 animate-spin" />
            : hasError
              ? <AlertCircle size={16} className="text-red-400" />
              : <Check size={16} className="text-emerald-400" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{campaign.name}</p>
            {isRunning && (
              <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400 animate-pulse">
                Running — {campaign.currentStep}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-white/35">{formatRelativeTime(campaign.createdAt)}</span>
            <span className="text-[11px] text-white/25">·</span>
            <span className="text-[11px] text-white/35">{Math.min(completedSteps, AGENT_STEPS.length)}/{AGENT_STEPS.length} steps</span>
            {campaign.postsCount > 0 && (
              <>
                <span className="text-[11px] text-white/25">·</span>
                <span className="flex items-center gap-1 text-[11px] text-white/35">
                  <FileText size={10} />
                  {campaign.postsCount} posts
                </span>
              </>
            )}
            <div className="flex items-center gap-1 ml-1">
              {campaign.platforms.map(p => <PlatformIcon key={p} platform={p} size={12} />)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-24 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/30">{campaign.progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500',
                hasError ? 'bg-red-500' : isRunning ? 'bg-violet-500' : 'bg-emerald-500'
              )}
              style={{ width: `${campaign.progress}%` }}
            />
          </div>
        </div>

        <div className="ml-2 text-white/30">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>

      {/* Expanded pipeline view */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pt-4">
          <div className="relative pl-4 border-l border-white/5">
            {AGENT_STEPS.map((step, i) => {
              const log = campaign.agentLogs.find(l => l.role === step)
              const stepIdx = AGENT_STEPS.indexOf(campaign.currentStep ?? 'analyst')
              const isActive = campaign.currentStep === step
              const isFuture = !log && !isActive && i > stepIdx

              return (
                <div key={step}>
                  <StepNode step={step} log={log} isActive={isActive} isFuture={isFuture} />
                  {log?.output && (
                    <div className="mb-4 -mt-3 ml-11">
                      <button
                        onClick={() => setShowOutput(showOutput === log.id ? null : log.id)}
                        className="text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {showOutput === log.id ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        View output
                      </button>
                      {showOutput === log.id && (
                        <pre className="mt-1.5 rounded-lg bg-white/[0.03] border border-white/5 p-3 text-[10px] text-white/50 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap">
                          {log.output}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
        <Bot size={24} className="text-white/20" />
      </div>
      <p className="text-sm font-medium text-white/40">No agent runs yet</p>
      <p className="mt-1 text-xs text-white/25 max-w-xs">
        Create a campaign from the Campaigns page to kick off the agent pipeline.
      </p>
    </div>
  )
}

export function WorkflowsClient({ campaigns }: { campaigns: Campaign[] }) {
  const running = campaigns.filter(c => c.currentStep !== null)
  const completed = campaigns.filter(c => c.currentStep === null)

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Agent Workflows"
        description="AI drafts your content — you review and publish"
      />

      {campaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {running.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Running ({running.length})
                </h2>
              </div>
              <div className="space-y-3">
                {running.map(c => <WorkflowCard key={c.id} campaign={c} />)}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={12} className="text-white/25" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  History ({completed.length})
                </h2>
              </div>
              <div className="space-y-3">
                {completed.map(c => <WorkflowCard key={c.id} campaign={c} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
