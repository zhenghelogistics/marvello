'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { PlatformIcon } from '@/components/ui-custom/platform-icon'
import { mockAccounts } from '@/lib/mock-data'
import { formatRelativeTime, platformLabel, cn } from '@/lib/utils'
import { savePlatformCredential } from '@/app/actions/settings'
import {
  Check, Eye, EyeOff, RefreshCw, AlertCircle,
  Bot, Key, Bell, Shield, Plug, RefreshCcw
} from 'lucide-react'

const TABS = [
  { id: 'accounts', label: 'Connected Accounts', icon: Plug },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'agents', label: 'Agent Settings', icon: Bot },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const
type Tab = typeof TABS[number]['id']

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-white/35">{description}</p>}
    </div>
  )
}

type PlatformKey = 'linkedin' | 'instagram' | 'facebook'

interface ApiKeyInputProps {
  label: string
  description: string
  placeholder: string
  platform?: PlatformKey
  extraFields?: { name: 'pageId' | 'orgId'; placeholder: string; label: string }
}

function ApiKeyInput({ label, description, placeholder, platform, extraFields }: ApiKeyInputProps) {
  const [show, setShow] = useState(false)
  const [token, setToken] = useState('')
  const [extraValue, setExtraValue] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!token.trim()) return
    setSaving(true)
    setError(null)

    if (platform) {
      const data: { accessToken: string; pageId?: string; orgId?: string } = { accessToken: token }
      if (extraFields?.name === 'pageId') data.pageId = extraValue
      if (extraFields?.name === 'orgId') data.orgId = extraValue

      const result = await savePlatformCredential(platform, data)
      setSaving(false)

      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    } else {
      // Non-platform keys (Anthropic, Apify) — local only for now
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-white">{label}</p>
          <p className="text-xs text-white/35 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? 'text' : 'password'}
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 pr-9 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-mono"
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              aria-label={show ? 'Hide key' : 'Show key'}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60',
              saved
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-violet-600 text-white hover:bg-violet-500'
            )}
          >
            {saving ? 'Saving…' : saved ? <><Check size={12} /> Saved</> : 'Save'}
          </button>
        </div>
        {extraFields && (
          <input
            type="text"
            value={extraValue}
            onChange={e => setExtraValue(e.target.value)}
            placeholder={extraFields.placeholder}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-mono"
          />
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

function ToggleSetting({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
  const [enabled, setEnabled] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-xs font-medium text-white/80">{label}</p>
        <p className="text-xs text-white/30 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(e => !e)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
          enabled ? 'bg-violet-600' : 'bg-white/10'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            enabled ? 'left-4' : 'left-0.5'
          )}
        />
      </button>
    </div>
  )
}

function AccountsTab() {
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ synced: string[]; errors: { platform: string; error: string }[] } | null>(null)
  const [scrapingProfiles, setScrapingProfiles] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{ synced?: string[]; error?: string } | null>(null)

  const handleSyncAnalytics = async () => {
    setSyncing(true)
    setSyncStatus(null)
    try {
      const res = await fetch('/api/analytics/sync', { method: 'POST' })
      const json = await res.json() as { synced: string[]; errors: { platform: string; error: string }[] }
      setSyncStatus(json)
    } catch {
      setSyncStatus({ synced: [], errors: [{ platform: 'all', error: 'Network error' }] })
    } finally {
      setSyncing(false)
    }
  }

  const handleScrapeProfiles = async () => {
    setScrapingProfiles(true)
    setScrapeResult(null)
    try {
      const res = await fetch('/api/apify/sync-profiles', { method: 'POST' })
      const json = await res.json() as { synced?: string[]; error?: string }
      setScrapeResult(json)
    } catch {
      setScrapeResult({ error: 'Network error' })
    } finally {
      setScrapingProfiles(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title="Connected Social Accounts"
          description="Connect your social media accounts to enable posting and analytics"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleScrapeProfiles}
            disabled={scrapingProfiles}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/[0.08] px-3 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/[0.14] transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={12} className={scrapingProfiles ? 'animate-spin' : ''} />
            {scrapingProfiles ? 'Scraping profiles…' : 'Sync My Profiles'}
          </button>
          <button
            onClick={handleSyncAnalytics}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/50 hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCcw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Analytics'}
          </button>
        </div>
      </div>

      {scrapingProfiles && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3 text-xs text-violet-300">
          Scraping LinkedIn, Instagram & Facebook via Apify — this takes 1–2 minutes…
        </div>
      )}

      {scrapeResult && (
        <div className={cn(
          'rounded-xl border p-3 text-xs',
          scrapeResult.error
            ? 'border-red-500/20 bg-red-500/[0.05] text-red-400'
            : 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400'
        )}>
          {scrapeResult.error
            ? `Profile scrape failed: ${scrapeResult.error}`
            : `Profile data synced: ${scrapeResult.synced?.join(', ')} — Analytics page updated.`
          }
        </div>
      )}

      {syncStatus && (
        <div className={cn(
          'rounded-xl border p-3 text-xs',
          syncStatus.errors.length > 0 && syncStatus.synced.length === 0
            ? 'border-red-500/20 bg-red-500/[0.05] text-red-400'
            : 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400'
        )}>
          {syncStatus.synced.length > 0 && (
            <p>Synced: {syncStatus.synced.join(', ')}</p>
          )}
          {syncStatus.synced.length === 0 && syncStatus.errors.length === 0 && (
            <p className="text-white/40">No platforms with credentials configured. Add API keys in the API Keys tab.</p>
          )}
          {syncStatus.errors.map((e, i) => (
            <p key={i} className="text-red-400">{e.platform}: {e.error}</p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {mockAccounts.map(account => (
          <div
            key={account.platform}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10"
          >
            <PlatformIcon platform={account.platform} size={24} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{platformLabel[account.platform]}</p>
                {account.isConnected ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Connected</span>
                ) : (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">Disconnected</span>
                )}
              </div>
              {account.isConnected ? (
                <p className="text-xs text-white/35 mt-0.5">
                  @{account.username} · {(account.followers / 1000).toFixed(1)}K followers · synced {formatRelativeTime(account.lastSync)}
                </p>
              ) : (
                <p className="text-xs text-red-400/60 mt-0.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  Reconnection required
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {account.isConnected && (
                <button className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/40 hover:bg-white/[0.06] transition-colors cursor-pointer" aria-label="Refresh sync">
                  <RefreshCw size={11} />
                  Sync
                </button>
              )}
              <button
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  account.isConnected
                    ? 'border border-white/5 bg-white/[0.03] text-white/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                )}
              >
                {account.isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApiKeysTab() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="API Keys"
        description="Configure your AI and data integration keys. Keys are encrypted and never logged."
      />

      <div className="space-y-3">
        <ApiKeyInput
          label="Anthropic (Claude AI)"
          description="Powers the Planner, Writer, and Reviewer agents"
          placeholder="sk-ant-api03-..."
        />
        <ApiKeyInput
          label="Apify API Token"
          description="Web scraping for competitor analysis and trending topic research"
          placeholder="apify_api_..."
        />
        <ApiKeyInput
          label="LinkedIn Access Token"
          description="Required for LinkedIn analytics and posting. Also enter your Organisation ID below."
          placeholder="AQX..."
          platform="linkedin"
          extraFields={{ name: 'orgId', placeholder: 'Organisation ID (e.g. 12345678)', label: 'Org ID' }}
        />
        <ApiKeyInput
          label="Instagram Graph API"
          description="Required for Instagram analytics via Meta Business. Also enter your IG User ID."
          placeholder="EAAG..."
          platform="instagram"
          extraFields={{ name: 'pageId', placeholder: 'Instagram User ID (numeric)', label: 'IG User ID' }}
        />
        <ApiKeyInput
          label="Facebook Graph API"
          description="Required for Facebook Page analytics. Also enter your Page ID."
          placeholder="EAAG..."
          platform="facebook"
          extraFields={{ name: 'pageId', placeholder: 'Facebook Page ID (numeric)', label: 'Page ID' }}
        />
      </div>

      <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4 flex gap-3">
        <Shield size={15} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-300">Security notice</p>
          <p className="text-xs text-amber-400/60 mt-0.5 leading-relaxed">
            API keys are encrypted at rest using AES-256 and are only decrypted at runtime. They are never stored in logs or transmitted to third parties.
          </p>
        </div>
      </div>
    </div>
  )
}

function AgentsTab() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Agent Configuration"
        description="Customize how AI agents behave when running campaigns"
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold text-white mb-1">Default AI Model</p>
          <p className="text-xs text-white/35 mb-3">Model used for content generation and planning</p>
          <select className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50 cursor-pointer">
            <option value="claude-sonnet-4-6">claude-sonnet-4-6 (Recommended)</option>
            <option value="claude-opus-4-6">claude-opus-4-6 (Highest quality)</option>
            <option value="claude-haiku-4-5">claude-haiku-4-5 (Fastest)</option>
          </select>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold text-white mb-1">Brand Voice</p>
          <p className="text-xs text-white/35 mb-3">Describe your brand voice for the Writer agent</p>
          <textarea
            rows={4}
            placeholder="e.g. Professional but approachable. We use clear, direct language. Avoid jargon. We're enthusiastic about technology without being overwhelming. Always end LinkedIn posts with a question to drive engagement."
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
          />
          <div className="mt-2 flex justify-end">
            <button className="rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-600/30 transition-colors cursor-pointer">
              Save brand voice
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold text-white mb-3">Agent Behaviour</p>
          <div>
            <ToggleSetting
              label="Auto-approve reviewed posts"
              description="Skip manual review step if the Reviewer agent passes all checks"
              defaultChecked={false}
            />
            <ToggleSetting
              label="Apify pre-research on new campaigns"
              description="Automatically run competitor and trend research before the Planner agent starts"
              defaultChecked={true}
            />
            <ToggleSetting
              label="Human-in-the-loop for Publisher"
              description="Require manual confirmation before the Publisher agent posts to social platforms"
              defaultChecked={true}
            />
            <ToggleSetting
              label="Post-publish analytics collection"
              description="Run Analyst agent 48 hours after publishing to collect performance data"
              defaultChecked={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Notifications"
        description="Choose when and how Marvello notifies you about agent activity"
      />
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-xs font-semibold text-white mb-3">Email Notifications</p>
        <div>
          <ToggleSetting label="Campaign completed" description="Notify when all agents finish a campaign" defaultChecked={true} />
          <ToggleSetting label="Agent error" description="Alert when an agent encounters an error" defaultChecked={true} />
          <ToggleSetting label="Post published" description="Confirm when a post goes live" defaultChecked={false} />
          <ToggleSetting label="Weekly analytics digest" description="Summary of the previous week's performance" defaultChecked={true} />
          <ToggleSetting label="Follower milestones" description="Notify when you hit follower milestones" defaultChecked={false} />
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-xs font-semibold text-white mb-3">In-app Notifications</p>
        <div>
          <ToggleSetting label="Real-time agent updates" description="Show live updates as agents process your campaigns" defaultChecked={true} />
          <ToggleSetting label="Scheduled post reminders" description="Remind 1 hour before a post goes live" defaultChecked={true} />
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('accounts')

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Configure accounts, API keys, agents, and notifications"
      />

      <div className="flex gap-5">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0" aria-label="Settings sections">
          <ul className="space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setTab(id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer text-left',
                    tab === id
                      ? 'bg-violet-600/15 text-violet-300'
                      : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                  )}
                >
                  <Icon size={13} className={tab === id ? 'text-violet-400' : 'text-white/30'} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 animate-slide-in">
          {tab === 'accounts' && <AccountsTab />}
          {tab === 'api' && <ApiKeysTab />}
          {tab === 'agents' && <AgentsTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  )
}
