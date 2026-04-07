'use client'

import { workspace } from '@/lib/workspace'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { platformLabel, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  CheckCircle, Target, Users, Megaphone, BookOpen,
  TrendingUp, ArrowRight, Lightbulb, AlertTriangle, Zap
} from 'lucide-react'
import type { Platform } from '@/types'

const PILLAR_COLORS = ['#8B5CF6', '#06B6D4', '#22C55E', '#F59E0B']

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-white/5 bg-white/[0.02] p-5', className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">{title}</p>
      {children}
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle size={11} />
            Workspace configured
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{workspace.business.name}</h1>
        <p className="mt-1 text-sm text-white/40">{workspace.business.tagline}</p>
        <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-2xl">{workspace.business.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">
        {/* Services */}
        <Section title="Your Services">
          <div className="space-y-2">
            {workspace.services.map(s => (
              <div key={s.id} className="flex items-start gap-2.5">
                <CheckCircle size={13} className="text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white/80">{s.label}</p>
                  <p className="text-[11px] text-white/35">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Audience */}
        <Section title="Target Audience">
          <div className="space-y-2.5">
            {workspace.audience.map(a => (
              <div key={a.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/5 text-[9px] font-bold text-white/40">
                  {a.priority}
                </span>
                <div>
                  <p className="text-xs font-medium text-white/80">{a.label}</p>
                  <p className="text-[11px] text-white/35">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Primary goal */}
        <Section title="Primary Goal">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20">
                <Target size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Lead Generation</p>
                <p className="text-xs text-white/35">Drive freight inquiries from social</p>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Every piece of content should either build the authority that makes people trust Zhenghe, or create a direct path to an inquiry.
            </p>
            <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.05] px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={11} className="text-amber-400" />
                <p className="text-[10px] font-semibold text-amber-300">Current state</p>
              </div>
              <p className="text-[11px] text-amber-400/70">&lt;500 followers — early stage. Priority is content quality and consistency over volume.</p>
            </div>
          </div>
        </Section>
      </div>

      {/* Platform Strategy */}
      <Section title="Platform Strategy" className="mb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {workspace.platforms.map((p, i) => {
            const priority = ['Primary', 'Secondary', 'Supporting']
            const priorityColor = ['#8B5CF6', '#06B6D4', '#6B7280']
            return (
              <div
                key={p.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <PlatformIcon platform={p.id as Platform} size={16} />
                  <span className="text-sm font-semibold text-white">{platformLabel[p.id as Platform]}</span>
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: `${priorityColor[i]}18`, color: priorityColor[i] }}
                  >
                    {priority[i]}
                  </span>
                </div>
                <p className="text-xs text-white/40 mb-3 leading-relaxed">{p.goal}</p>
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <TrendingUp size={11} />
                  {p.postFrequency}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* The Trusted Route */}
      <Section title="Content Series — The Trusted Route" className="mb-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-violet-400" />
              <p className="text-sm font-semibold text-white">{workspace.contentSeries.name}</p>
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                {workspace.contentSeries.cadence}
              </span>
            </div>
            <p className="text-xs text-white/45 leading-relaxed mb-4">{workspace.contentSeries.description}</p>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-2">Topic ideas in queue</p>
              {workspace.contentSeries.topics.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 text-white/20">→</span>
                  <span className="text-white/50">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-3">Brand voice</p>
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
                <p className="text-[10px] font-semibold text-emerald-400 mb-1.5">Always do</p>
                <div className="space-y-1">
                  {workspace.brandVoice.always.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-emerald-300/70">
                      <CheckCircle size={10} className="mt-0.5 shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-red-500/10 bg-red-500/[0.04] p-3">
                <p className="text-[10px] font-semibold text-red-400 mb-1.5">Avoid</p>
                <div className="space-y-1">
                  {workspace.brandVoice.avoid.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-300/70">
                      <span className="mt-0.5 shrink-0 text-red-400">×</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Content Pillars */}
      <Section title="Content Pillars" className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workspace.contentPillars.map((pillar, i) => {
            const color = PILLAR_COLORS[i]
            return (
              <div
                key={pillar.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                style={{ borderTopColor: `${color}30`, borderTopWidth: 2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color }}>{pillar.label}</p>
                  <span
                    className="text-[10px] font-mono font-bold rounded-full px-2 py-0.5"
                    style={{ background: `${color}18`, color }}
                  >
                    {pillar.weight}%
                  </span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed mb-3">{pillar.description}</p>
                <div className="space-y-1">
                  {pillar.exampleAngles.slice(0, 3).map((a, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-[11px] text-white/30">
                      <Lightbulb size={9} className="mt-0.5 shrink-0" style={{ color: `${color}80` }} />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* What to do next */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-white">Your first moves</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Launch "The Trusted Route" #1',
              detail: 'Start with "FCL vs LCL — which does your business actually need?" — highly searchable, demonstrates expertise immediately.',
              href: '/campaigns',
              cta: 'Create campaign',
            },
            {
              step: '2',
              title: 'Set up your content calendar',
              detail: 'Plan 4 LinkedIn posts + 3 Instagram posts for the next 2 weeks. Agents will draft them — you just review and approve.',
              href: '/calendar',
              cta: 'Open calendar',
            },
            {
              step: '3',
              title: 'Connect your social accounts',
              detail: 'Add your LinkedIn, Instagram, and Facebook credentials so Marvello can publish directly.',
              href: '/settings',
              cta: 'Go to settings',
            },
          ].map(item => (
            <div key={item.step} className="rounded-lg border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600/30 text-[10px] font-bold text-violet-300">
                  {item.step}
                </span>
                <p className="text-xs font-semibold text-white">{item.title}</p>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed mb-3">{item.detail}</p>
              <Link
                href={item.href}
                className="flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
              >
                {item.cta}
                <ArrowRight size={11} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
