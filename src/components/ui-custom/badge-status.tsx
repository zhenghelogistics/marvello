import { cn } from '@/lib/utils'
import type { PostStatus, CampaignStatus, AgentStatus, AgentRole } from '@/types'
import { statusColor, campaignStatusColor, agentStatusColor, agentRoleColor, agentRoleLabel } from '@/lib/utils'

interface StatusBadgeProps {
  status: PostStatus | CampaignStatus | AgentStatus
  type?: 'post' | 'campaign' | 'agent'
  className?: string
}

export function StatusBadge({ status, type = 'post', className }: StatusBadgeProps) {
  const colorMap = type === 'campaign' ? campaignStatusColor : type === 'agent' ? agentStatusColor : statusColor
  const color = (colorMap as Record<string, string>)[status] ?? '#6B7280'
  const isRunning = status === 'running'

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', className)}
      style={{ background: `${color}18`, color }}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', isRunning && 'agent-pulse')}
        style={{ background: color }}
      />
      {status}
    </span>
  )
}

interface AgentRoleBadgeProps {
  role: AgentRole
  active?: boolean
  className?: string
}

export function AgentRoleBadge({ role, active, className }: AgentRoleBadgeProps) {
  const color = agentRoleColor[role]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', className)}
      style={{
        background: active ? `${color}25` : `${color}10`,
        color,
        border: active ? `1px solid ${color}40` : '1px solid transparent',
      }}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full agent-pulse" style={{ background: color }} />}
      {agentRoleLabel[role]}
    </span>
  )
}
