'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  icon?: ReactNode
  accent?: string
  className?: string
}

export function StatCard({ label, value, change, icon, accent = '#8B5CF6', className }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.05] cursor-default',
        className
      )}
    >
      {/* accent glow top-left */}
      <div
        className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full opacity-10 blur-2xl"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white font-mono">{value}</p>
          {change !== undefined && (
            <p className={cn('mt-1 text-xs font-medium', isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {isPositive ? '▲' : '▼'} {Math.abs(change)}% vs last period
            </p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${accent}22` }}
          >
            <span style={{ color: accent }}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}
