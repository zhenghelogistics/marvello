'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge, AgentRoleBadge } from '@/components/ui-custom/badge-status'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { mockCampaigns } from '@/lib/mock-data'
import {
  formatDate, formatRelativeTime, campaignStatusColor,
  agentRoleColor, agentRoleLabel, cn
} from '@/lib/utils'
import {
  Plus, ChevronDown, ChevronRight, Bot, Check,
  Clock, AlertCircle, Zap, Play, Pause, RotateCcw
} from 'lucide-react'
import type { Campaign, AgentLog, AgentRole } from '@/types'

const agentSteps: AgentRole[] = ['planner', 'writer', 'reviewer', 'publisher', 'analyst']

function AgentTimeline({ logs, currentStep }: { logs: AgentLog[]; currentStep: AgentRole | null }) {
  return (
    <div className="space-y-3">
      {agentSteps.map((step, i) => {
        const log = logs.find(l => l.role === step)
        const isActive = currentStep === step
        const isDone = log?.status === 'done'
        const isError = log?.status === 'error'
        const isPending = !log
        const color = agentRoleColor[step]

        return (
          <div key={step} className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                  isDone ? 'bg-emerald-500/20 text-emerald-400' :
                  isActive ? 'ring-2 ring-offset-1 ring-offset-transparent' :
                  isError ? 'bg-red-500/20 text-red-400' :
                  'bg-white/5 text-white/20'
                )}
                style={isActive ? { background: `${color}20`, color, outline: `2px solid ${color}40` } : {}}
              >
                {isDone ? <Check size={13} /> :
                 isError ? <AlertCircle size={13} /> :
                 isActive ? <span className="h-2 w-2 rounded-full agent-pulse" style={{ background: color }} /> :
                 <span className="text-[10px]">{i + 1}</span>}
              </div>
              {i < agentSteps.length - 1 && (
                <div
                  className="mt-1 w-px flex-1 min-h-[12px]"
                  style={{ background: isDone ? '#22C55E30' : 'rgba(255,255,255,0.05)' }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2">
                <AgentRoleBadge role={step} active={isActive} />
                {log && (
                  <span className="text-[10px] text-white/25">{formatRelativeTime(log.timestamp)}</span>
                )}
              </div>
              {log && (
                <p className="mt-1.5 text-xs text-white/50 leading-relaxed">{log.message}</p>
              )}
              {log?.output && (
                <div className="mt-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                  <p className="text-[11px] text-white/35 font-mono">{log.output}</p>
                </div>
              )}
              {isPending && (
                <p className="mt-1 text-xs text-white/20">Waiting…</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const [expanded, setExpanded] = useState(false)
  const color = campaignStatusColor[campaign.status]

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all hover:border-white/10">
      <button
        className="w-full text-left p-5 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${color}18` }}
          >
            <Bot size={15} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white">{campaign.name}</h3>
              <StatusBadge status={campaign.status} type="campaign" />
              {campaign.currentStep && (
                <AgentRoleBadge role={campaign.currentStep} active />
              )}
            </div>
            <p className="mt-0.5 text-xs text-white/40 line-clamp-1">{campaign.description}</p>

            <div className="mt-3 flex items-center gap-4">
              {/* Platforms */}
              <div className="flex items-center gap-1.5">
                {campaign.platforms.map(p => (
                  <PlatformIcon key={p} platform={p} size={13} />
                ))}
              </div>

              {/* Progress bar */}
              <div className="flex flex-1 items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${campaign.progress}%`, background: color }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/30">{campaign.progress}%</span>
              </div>

              {/* Dates */}
              <span className="hidden sm:block text-xs text-white/25">
                {formatDate(campaign.startDate)}
                {campaign.endDate && ` → ${formatDate(campaign.endDate)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/25">{campaign.postsCount} posts</span>
            {expanded ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 animate-slide-in">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Agent timeline */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/25">Agent Workflow</p>
              <AgentTimeline logs={campaign.agentLogs} currentStep={campaign.currentStep} />
            </div>

            {/* Stats + actions */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/25">Campaign Details</p>
              <dl className="space-y-2.5">
                {[
                  ['Status', <StatusBadge key="s" status={campaign.status} type="campaign" />],
                  ['Platforms', (
                    <div key="p" className="flex gap-1">
                      {campaign.platforms.map(p => (
                        <PlatformIcon key={p} platform={p} size={14} />
                      ))}
                    </div>
                  )],
                  ['Start Date', formatDate(campaign.startDate)],
                  campaign.endDate && ['End Date', formatDate(campaign.endDate)],
                  ['Posts', campaign.postsCount],
                  ['Created', formatRelativeTime(campaign.createdAt)],
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <dt className="text-white/35">{(item as [string, unknown])[0]}</dt>
                    <dd className="text-white/70 font-medium">{(item as [string, unknown])[1] as string}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex items-center gap-2">
                {campaign.status === 'active' && (
                  <button className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.08] transition-colors cursor-pointer">
                    <Pause size={12} />
                    Pause
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <button className="flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-600/30 transition-colors cursor-pointer">
                    <Play size={12} />
                    Resume
                  </button>
                )}
                {campaign.status === 'draft' && (
                  <button className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-colors cursor-pointer">
                    <Bot size={12} />
                    Launch Agents
                  </button>
                )}
                {campaign.status === 'completed' && (
                  <button className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.08] transition-colors cursor-pointer">
                    <RotateCcw size={12} />
                    Clone Campaign
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111118] p-6 shadow-2xl animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20">
            <Bot size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">New Campaign</h2>
            <p className="text-xs text-white/35">AI agents will plan, write, and publish your content</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="campaign-name" className="block text-xs font-medium text-white/50 mb-1.5">Campaign name</label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. May Product Launch"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div>
            <label htmlFor="campaign-desc" className="block text-xs font-medium text-white/50 mb-1.5">Goal / Description</label>
            <textarea
              id="campaign-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what you want to achieve. The AI agents will use this to plan your content strategy."
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-white/50 mb-1.5">Platforms</p>
            <div className="flex gap-2">
              {(['linkedin', 'instagram', 'facebook'] as const).map(p => (
                <button
                  key={p}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/50 transition-all hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300 cursor-pointer capitalize"
                >
                  <PlatformIcon platform={p} size={13} />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Agent pipeline preview */}
          <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.04] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-violet-400" />
              <p className="text-xs font-semibold text-violet-300">Agent Workflow</p>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {agentSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${agentRoleColor[step]}18`, color: agentRoleColor[step] }}>
                    {agentRoleLabel[step]}
                  </span>
                  {i < agentSteps.length - 1 && <ChevronRight size={10} className="text-white/15" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-white/40 hover:text-white/60 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors cursor-pointer disabled:opacity-40"
            disabled={!name.trim()}
          >
            <Bot size={13} />
            Launch Campaign
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const [showNewCampaign, setShowNewCampaign] = useState(false)

  const statusOrder: Record<string, number> = { active: 0, paused: 1, draft: 2, completed: 3 }
  const sorted = [...mockCampaigns].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return (
    <div className="p-6 max-w-5xl">
      {showNewCampaign && <NewCampaignModal onClose={() => setShowNewCampaign(false)} />}

      <PageHeader
        title="Campaigns"
        description="Multi-agent AI workflows that plan, write, review, and publish your content"
        action={
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 cursor-pointer"
          >
            <Plus size={13} />
            New Campaign
          </button>
        }
      />

      {/* Summary row */}
      <div className="mb-5 flex gap-3 flex-wrap">
        {(['active', 'paused', 'draft', 'completed'] as const).map(status => {
          const count = mockCampaigns.filter(c => c.status === status).length
          const color = campaignStatusColor[status]
          return (
            <div
              key={status}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-white/50 capitalize">{status}</span>
              <span className="text-xs font-semibold font-mono text-white/80">{count}</span>
            </div>
          )
        })}
      </div>

      <div className="space-y-3">
        {sorted.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {/* How it works */}
      <div className="mt-8 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-white">How the agent workflow works</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {agentSteps.map((step, i) => {
            const color = agentRoleColor[step]
            const descriptions: Record<AgentRole, string> = {
              planner: 'Analyzes your goal and creates a content strategy',
              writer: 'Generates post copy using Claude AI',
              reviewer: 'Checks brand voice, tone, and compliance',
              publisher: 'Schedules and publishes to social platforms',
              analyst: 'Tracks performance and surfaces insights',
            }
            return (
              <div key={step} className="relative">
                <div className="flex flex-col gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                    style={{ background: `${color}18`, color }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold" style={{ color }}>{agentRoleLabel[step]}</p>
                  <p className="text-[11px] text-white/35 leading-relaxed">{descriptions[step]}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
