'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CalendarDays, Megaphone, BarChart3,
  Settings, Sparkles, Zap, Bot, ExternalLink
} from 'lucide-react'

const navItems = [
  { href: '/onboarding', label: 'Workspace', icon: Bot },
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-white/5 bg-[#0A0A0F]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">Marvello</span>
        <span className="ml-auto rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">Beta</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Workspace</p>
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer',
                    active
                      ? 'bg-violet-600/20 text-violet-300'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(active ? 'text-violet-400' : 'text-white/40')}
                  />
                  {label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* AI section */}
        <p className="mb-1 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Intelligence</p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/campaigns"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-white/50 transition-colors duration-150 hover:bg-white/5 hover:text-white/80 cursor-pointer"
            >
              <Bot size={15} className="text-white/40" />
              Agent Workflows
            </Link>
          </li>
          <li>
            <button
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-white/50 transition-colors duration-150 hover:bg-white/5 hover:text-white/80 cursor-pointer"
              title="Apify MCP — web scraping & research"
            >
              <Zap size={15} className="text-white/40" />
              Apify Research
              <ExternalLink size={10} className="ml-auto text-white/25" />
            </button>
          </li>
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 px-2 py-3">
        <ul className="space-y-0.5">
          {bottomItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer',
                  pathname === href
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                )}
              >
                <Icon size={15} className={cn(pathname === href ? 'text-violet-400' : 'text-white/40')} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
        {/* User avatar area */}
        <div className="mt-3 flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-bold text-white">
            M
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white/70">My Workspace</p>
            <p className="truncate text-[10px] text-white/30">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
