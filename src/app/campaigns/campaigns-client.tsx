'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { StatusBadge, AgentRoleBadge } from '@/components/ui-custom/badge-status'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { createCampaign, deleteCampaign } from '@/app/actions/campaigns'
import {
  formatDate, formatRelativeTime, campaignStatusColor,
  agentRoleColor, agentRoleLabel, cn
} from '@/lib/utils'
import {
  Plus, ChevronDown, ChevronRight, Bot, Check,
  AlertCircle, Play, Pause, RotateCcw, Loader2,
  FileText, Copy, Trash2, Zap
} from 'lucide-react'
import type { Campaign, AgentLog, AgentRole, Post } from '@/types'

const agentSteps: AgentRole[] = ['planner', 'writer', 'reviewer', 'publisher', 'analyst']

const PILLARS = [
  { id: 'education', label: 'Educate the Shipper', color: '#8B5CF6', weight: 40 },
  { id: 'commentary', label: 'Industry Commentary', color: '#06B6D4', weight: 25 },
  { id: 'social-proof', label: 'Case Studies', color: '#22C55E', weight: 20 },
  { id: 'behind-scenes', label: 'Behind the Scenes', color: '#F59E0B', weight: 15 },
] as const

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

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
                <div className="mt-1 w-px flex-1 min-h-[12px]" style={{ background: isDone ? '#22C55E30' : 'rgba(255,255,255,0.05)' }} />
              )}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2">
                <AgentRoleBadge role={step} active={isActive} />
                {log && <span className="text-[10px] text-white/25">{formatRelativeTime(log.timestamp)}</span>}
              </div>
              {log && <p className="mt-1.5 text-xs text-white/50 leading-relaxed">{log.message}</p>}
              {log?.output && (
                <div className="mt-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                  <p className="text-[11px] text-white/35 font-mono">{log.output}</p>
                </div>
              )}
              {isPending && <p className="mt-1 text-xs text-white/20">Waiting…</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const isLong = post.content.length > 300

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(post.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <PlatformIcon platform={post.platform} size={14} />
        <span className="text-xs font-semibold text-white flex-1 truncate">{post.title}</span>
        <span className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          post.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' :
          post.status === 'scheduled' ? 'bg-cyan-500/15 text-cyan-400' :
          post.status === 'failed' ? 'bg-red-500/15 text-red-400' :
          'bg-white/5 text-white/35'
        )}>
          {post.status}
        </span>
        {post.scheduledAt && (
          <span className="shrink-0 text-[10px] text-white/25">{new Date(post.scheduledAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</span>
        )}
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-white/5 bg-white/[0.03] p-1.5 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          title="Copy content"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
        </button>
      </div>
      <div className="px-4 py-3">
        <p className={cn('text-xs text-white/60 leading-relaxed whitespace-pre-wrap', !expanded && isLong && 'line-clamp-4')}>
          {post.content}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors cursor-pointer"
          >
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        )}
      </div>
    </div>
  )
}

function PostsView({ campaignId, postsCount, isRunning }: { campaignId: string; postsCount: number; isRunning: boolean }) {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (postsCount === 0) return
    setLoading(true)
    fetch(`/api/campaigns/${campaignId}`)
      .then(r => r.json())
      .then(data => {
        setPosts((data.posts ?? []) as Post[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [campaignId, postsCount])

  if (postsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        {isRunning ? (
          <>
            <Loader2 size={20} className="text-violet-400 animate-spin mb-3" />
            <p className="text-sm text-white/40">Agents are writing your posts…</p>
            <p className="text-xs text-white/20 mt-1">Check back in a minute</p>
          </>
        ) : (
          <>
            <FileText size={20} className="text-white/15 mb-3" />
            <p className="text-sm text-white/30">No posts generated</p>
            <p className="text-xs text-white/20 mt-1">This campaign may have been created before the pipeline was fixed. Try creating a new one.</p>
          </>
        )}
      </div>
    )
  }

  if (loading || posts === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={18} className="text-violet-400 animate-spin" />
      </div>
    )
  }

  const byPlatform = posts.reduce<Record<string, Post[]>>((acc, p) => {
    if (!acc[p.platform]) acc[p.platform] = []
    acc[p.platform].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(byPlatform).map(([platform, platformPosts]) => (
        <div key={platform}>
          <div className="flex items-center gap-2 mb-3">
            <PlatformIcon platform={platform as Post['platform']} size={14} />
            <span className="text-xs font-semibold text-white/60 capitalize">{platform}</span>
            <span className="text-[10px] text-white/25 font-mono">{platformPosts.length} post{platformPosts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {platformPosts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

type CampaignTab = 'posts' | 'workflow'

function CampaignCard({ campaign: initial, onDelete }: { campaign: Campaign; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<CampaignTab>('posts')
  const [campaign, setCampaign] = useState(initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isRunning = campaign.currentStep !== null

  const poll = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaign.id}`)
    if (!res.ok) return
    const data = await res.json()
    setCampaign({ ...data, platforms: data.platforms as Campaign['platforms'] })
    return data.currentStep === null
  }, [campaign.id])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(async () => {
      const done = await poll()
      if (done) clearInterval(interval)
    }, 3000)
    return () => clearInterval(interval)
  }, [isRunning, poll])

  // Auto-expand if running or has posts
  useEffect(() => {
    if (isRunning || campaign.postsCount > 0) setExpanded(true)
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    await deleteCampaign(campaign.id)
    onDelete(campaign.id)
  }

  const color = campaignStatusColor[campaign.status]

  return (
    <div className={cn(
      'rounded-xl border bg-white/[0.02] overflow-hidden transition-all',
      isRunning ? 'border-violet-500/30' : 'border-white/5 hover:border-white/10'
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0" onClick={() => setExpanded(e => !e)}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
            {isRunning ? <Loader2 size={14} style={{ color }} className="animate-spin" /> : <Bot size={14} style={{ color }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white">{campaign.name}</h3>
              <StatusBadge status={campaign.status} type="campaign" />
              {campaign.currentStep && <AgentRoleBadge role={campaign.currentStep} active />}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                {campaign.platforms.map(p => <PlatformIcon key={p} platform={p} size={12} />)}
              </div>
              <span className="text-[11px] text-white/30">{formatRelativeTime(campaign.createdAt)}</span>
              {campaign.postsCount > 0 && (
                <span className="text-[11px] text-violet-400">{campaign.postsCount} posts drafted</span>
              )}
            </div>
          </div>
        </button>

        {/* Progress + actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${campaign.progress}%` }} />
              </div>
              <span className="text-[10px] font-mono text-white/30">{campaign.progress}%</span>
            </div>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Delete campaign"
            >
              <Trash2 size={13} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/40">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
              >
                {deleting ? '…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-2 py-1 text-[11px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                No
              </button>
            </div>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-white/20 hover:text-white/50 transition-colors cursor-pointer">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 animate-slide-in">
          <div className="flex items-center gap-1 px-4 pt-2 border-b border-white/5">
            {(['posts', 'workflow'] as CampaignTab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px capitalize',
                  tab === t ? 'border-violet-500 text-violet-300' : 'border-transparent text-white/30 hover:text-white/60'
                )}
              >
                {t === 'posts' ? `Posts${campaign.postsCount > 0 ? ` (${campaign.postsCount})` : ''}` : 'Workflow'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === 'posts' && <PostsView campaignId={campaign.id} postsCount={campaign.postsCount} isRunning={isRunning} />}
            {tab === 'workflow' && <AgentTimeline logs={campaign.agentLogs} currentStep={campaign.currentStep} />}
          </div>
        </div>
      )}
    </div>
  )
}

function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(['linkedin']))
  const [pillars, setPillars] = useState<Set<string>>(new Set(['education', 'commentary']))
  const [apifyResearch, setApifyResearch] = useState(true)
  const [humanReview, setHumanReview] = useState(true)

  const togglePlatform = (p: string) => {
    setPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(p)) { if (next.size > 1) next.delete(p) }
      else next.add(p)
      return next
    })
  }

  const togglePillar = (id: string) => {
    setPillars(prev => {
      const next = new Set(prev)
      if (next.has(id)) { if (next.size > 1) next.delete(id) }
      else next.add(id)
      return next
    })
  }

  const step1Valid = name.trim().length > 0 && description.trim().length > 0

  const handleLaunch = () => {
    startTransition(async () => {
      await createCampaign({
        name: name.trim(),
        description: description.trim(),
        platforms: Array.from(platforms),
        contentPillars: Array.from(pillars),
        apifyResearch,
        humanReview,
      })
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111118] shadow-2xl animate-slide-in overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20">
            <Bot size={16} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">New Campaign</h2>
            <p className="text-xs text-white/35">AI agents will plan, write, and publish your content</p>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1].map(i => (
              <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: step === i ? 16 : 6, background: step === i ? '#8B5CF6' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {step === 0 ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="campaign-name" className="block text-xs font-medium text-white/50 mb-1.5">
                  Campaign name <span className="text-red-400">*</span>
                </label>
                <input
                  id="campaign-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. May Freight Education Series"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="campaign-desc" className="block text-xs font-medium text-white/50 mb-1.5">
                  Goal / Brief <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="campaign-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="e.g. Educate importers about FCL vs LCL to drive freight inquiries. Target: business owners shipping from China."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none leading-relaxed"
                />
                <p className="mt-1 text-[10px] text-white/25">The Planner agent reads this to build your content strategy.</p>
              </div>
              <div>
                <p className="text-xs font-medium text-white/50 mb-2">Platforms <span className="text-white/25 font-normal">(select all that apply)</span></p>
                <div className="flex gap-2">
                  {(['linkedin', 'instagram', 'facebook'] as const).map(p => {
                    const active = platforms.has(p)
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all cursor-pointer flex-1 justify-center',
                          active ? 'border-violet-500/40 bg-violet-500/15 text-violet-300' : 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'
                        )}
                      >
                        <PlatformIcon platform={p} size={13} />
                        {PLATFORM_LABELS[p]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-white/50 mb-2">Content focus <span className="text-white/25 font-normal">(select all that apply)</span></p>
                <div className="grid grid-cols-2 gap-2">
                  {PILLARS.map(pillar => {
                    const active = pillars.has(pillar.id)
                    return (
                      <button
                        key={pillar.id}
                        onClick={() => togglePillar(pillar.id)}
                        className={cn('flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all cursor-pointer', active ? 'text-white/80' : 'border-white/8 bg-white/[0.02] text-white/35 hover:border-white/15')}
                        style={active ? { borderColor: `${pillar.color}40`, background: `${pillar.color}10` } : {}}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: active ? pillar.color : 'rgba(255,255,255,0.15)' }} />
                        <span className="font-medium leading-tight">{pillar.label}</span>
                        <span className="ml-auto text-[10px] font-mono opacity-50">{pillar.weight}%</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                {[
                  { key: 'apify', label: 'Apify pre-research', description: 'Scrape competitors & trending topics before planning', value: apifyResearch, set: setApifyResearch, icon: <Zap size={12} className="text-amber-400" /> },
                  { key: 'review', label: 'Human review before publishing', description: 'You approve posts before they go live', value: humanReview, set: setHumanReview, icon: <Bot size={12} className="text-violet-400" /> },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <div>
                        <p className="text-xs font-medium text-white/70">{opt.label}</p>
                        <p className="text-[10px] text-white/30">{opt.description}</p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={opt.value}
                      onClick={() => opt.set(v => !v)}
                      className={cn('relative h-5 w-9 rounded-full transition-all cursor-pointer shrink-0', opt.value ? 'bg-violet-600' : 'bg-white/10')}
                    >
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', opt.value ? 'left-4' : 'left-0.5')} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.04] p-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <Zap size={12} className="text-violet-400" />
                  <p className="text-xs font-semibold text-violet-300">Agent pipeline that will run</p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {(apifyResearch ? ['research' as const, ...agentSteps] : agentSteps).map((s, i, arr) => {
                    const isApify = s === 'research'
                    const color = isApify ? '#F59E0B' : agentRoleColor[s as AgentRole]
                    const label = isApify ? 'Research' : agentRoleLabel[s as AgentRole]
                    return (
                      <div key={s} className="flex items-center gap-1">
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{label}</span>
                        {i < arr.length - 1 && <ChevronRight size={10} className="text-white/15" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs text-white/40 leading-relaxed">
                Launching <span className="text-white/70 font-medium">"{name}"</span> on{' '}
                <span className="text-white/70 font-medium">{Array.from(platforms).map(p => PLATFORM_LABELS[p]).join(', ')}</span>
                {' '}with {pillars.size} content pillar{pillars.size !== 1 ? 's' : ''}.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={step === 0 ? onClose : () => setStep(0)}
            disabled={isPending}
            className="px-4 py-2 text-xs font-medium text-white/40 hover:text-white/60 transition-colors cursor-pointer disabled:opacity-40"
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step === 0 ? (
            <button
              onClick={() => setStep(1)}
              disabled={!step1Valid}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isPending ? <><Loader2 size={13} className="animate-spin" /> Launching…</> : <><Bot size={13} /> Launch Campaign</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function CampaignsClient({ campaigns: initial }: { campaigns: Campaign[] }) {
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [campaigns, setCampaigns] = useState(initial)

  const handleDelete = (id: string) => setCampaigns(prev => prev.filter(c => c.id !== id))

  const statusOrder: Record<string, number> = { active: 0, paused: 1, draft: 2, completed: 3 }
  const sorted = [...campaigns].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

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

      <div className="mb-5 flex gap-3 flex-wrap">
        {(['active', 'paused', 'draft', 'completed'] as const).map(status => {
          const count = campaigns.filter(c => c.status === status).length
          const color = campaignStatusColor[status]
          return (
            <div key={status} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-white/50 capitalize">{status}</span>
              <span className="text-xs font-semibold font-mono text-white/80">{count}</span>
            </div>
          )
        })}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
          <Bot size={32} className="text-white/15 mb-3" />
          <p className="text-sm font-medium text-white/30">No campaigns yet</p>
          <p className="text-xs text-white/20 mt-1 mb-4">Create your first campaign to start the agent workflow</p>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-2 text-xs font-semibold text-violet-400 hover:bg-violet-600/30 transition-colors cursor-pointer"
          >
            <Plus size={13} /> New Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} onDelete={handleDelete} />)}
        </div>
      )}

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
              <div key={step}>
                <div className="flex flex-col gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: `${color}18`, color }}>{i + 1}</div>
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
