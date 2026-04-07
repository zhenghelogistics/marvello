import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Platform, AgentRole, PostStatus, CampaignStatus, AgentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export const platformColor: Record<Platform, string> = {
  linkedin: '#0077B5',
  instagram: '#E1306C',
  facebook: '#1877F2',
}

export const platformLabel: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

export const agentRoleLabel: Record<AgentRole, string> = {
  planner: 'Planner',
  writer: 'Writer',
  reviewer: 'Reviewer',
  publisher: 'Publisher',
  analyst: 'Analyst',
}

export const agentRoleColor: Record<AgentRole, string> = {
  planner: '#8B5CF6',
  writer: '#06B6D4',
  reviewer: '#F59E0B',
  publisher: '#22C55E',
  analyst: '#EC4899',
}

export const statusColor: Record<PostStatus, string> = {
  published: '#22C55E',
  scheduled: '#8B5CF6',
  draft: '#6B7280',
  failed: '#EF4444',
}

export const campaignStatusColor: Record<CampaignStatus, string> = {
  active: '#22C55E',
  paused: '#F59E0B',
  completed: '#8B5CF6',
  draft: '#6B7280',
}

export const agentStatusColor: Record<AgentStatus, string> = {
  idle: '#6B7280',
  running: '#8B5CF6',
  done: '#22C55E',
  error: '#EF4444',
}

