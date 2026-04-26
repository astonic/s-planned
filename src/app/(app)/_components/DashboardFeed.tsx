'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
  Select,
  Spinner,
  Divider,
  Avatar,
} from '@fluentui/react-components'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string
  actorName: string
  eventType: string
  description: string
  createdAt: Date
  projectId: string
  projectName: string
}

export interface ProjectOption {
  id: string
  name: string
}

export interface DashboardFeedProps {
  userName: string
  projects: ProjectOption[]
  initialActivity: ActivityEntry[]
  initialHasMore: boolean
  eventTypes: string[]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: tokens.spacingHorizontalXL,
    alignItems: 'start',
  },
  sidebar: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  filters: { display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' as const },
  feedItem: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  feedContent: { flex: 1 },
  feedMeta: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' as const },
  feedDesc: { color: tokens.colorNeutralForeground1, marginTop: '2px', fontSize: tokens.fontSizeBase300 },
  feedTime: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  loadMore: { display: 'flex', justifyContent: 'center', paddingTop: tokens.spacingVerticalM },
  emptyState: {
    textAlign: 'center' as const,
    padding: `${tokens.spacingVerticalXL} 0`,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold },
  welcome: { backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusMedium, padding: tokens.spacingVerticalL },
})

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

function eventTypeLabel(t: string): string {
  const map: Record<string, string> = {
    'deliverable.status_changed': 'Status Change',
    'deliverable.updated': 'Updated',
    'deliverable.created': 'Created',
    'evidence.added': 'Evidence',
    'evidence.deleted': 'Evidence Removed',
    'evidence.verified': 'Verified',
    'raid.created': 'RAID',
    'raid.updated': 'RAID',
    'raid.deleted': 'RAID',
    'note.added': 'Note',
    'decision.created': 'Decision',
    'decision.updated': 'Decision',
    'stakeholder.added': 'Stakeholder',
    'stakeholder.removed': 'Stakeholder',
  }
  return map[t] ?? t
}

function eventTypeColor(t: string): 'brand' | 'success' | 'warning' | 'danger' | 'informative' | 'important' {
  if (t.includes('evidence') || t.includes('verified')) return 'success'
  if (t.includes('raid')) return 'warning'
  if (t.includes('decision')) return 'important'
  if (t.includes('note')) return 'informative'
  if (t.includes('stakeholder')) return 'brand'
  return 'informative'
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardFeed({ userName, projects, initialActivity, initialHasMore, eventTypes }: DashboardFeedProps) {
  const styles = useStyles()
  const [activity, setActivity] = useState<ActivityEntry[]>(initialActivity)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('30')
  const [filterType, setFilterType] = useState<string>('all')
  const [cursor, setCursor] = useState<string | undefined>(initialActivity[initialActivity.length - 1]?.id)
  const [loading, startTransition] = useTransition()

  const displayName = userName.split(' ')[0] || userName

  // Filtered activity (client-side, since we fetch with period from server initially)
  const filtered = activity.filter((a) => {
    if (filterProject !== 'all' && a.projectId !== filterProject) return false
    if (filterType !== 'all' && a.eventType !== filterType) return false
    return true
  })

  function handleLoadMore() {
    if (!cursor) return
    startTransition(async () => {
      const params = new URLSearchParams({ cursor, period: filterPeriod, limit: '20' })
      if (filterProject !== 'all') params.set('projectId', filterProject)
      const res = await fetch(`/api/activity?${params.toString()}`)
      if (!res.ok) return
      const { data, hasMore: more } = await res.json() as { data: ActivityEntry[]; hasMore: boolean }
      setActivity((prev) => [...prev, ...data])
      setHasMore(more)
      setCursor(data[data.length - 1]?.id)
    })
  }

  // Project stats
  const totalProjects = projects.length

  return (
    <div className={styles.root}>
      {/* Welcome banner */}
      <div className={styles.welcome}>
        <Text size={400} weight="semibold" block>Welcome back, {displayName}</Text>
        <Text size={200} style={{ color: tokens.colorBrandForeground1 }}>
          You have access to {totalProjects} project{totalProjects !== 1 ? 's' : ''}.
        </Text>
      </div>

      <div className={styles.grid}>
        {/* Sidebar: project list */}
        <div className={styles.sidebar}>
          <div className={styles.card}>
            <Text size={300} weight="semibold">Your Projects</Text>
            <Divider />
            {projects.length === 0 && <Text className={styles.emptyState}>No projects yet.</Text>}
            {projects.map((p) => (
              <div key={p.id} className={styles.statRow}>
                <Text
                  size={200}
                  style={{
                    cursor: 'pointer',
                    color: filterProject === p.id ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground1,
                    fontWeight: filterProject === p.id ? tokens.fontWeightSemibold : tokens.fontWeightRegular,
                  }}
                  onClick={() => setFilterProject(filterProject === p.id ? 'all' : p.id)}
                >
                  {p.name}
                </Text>
                {filterProject === p.id && (
                  <Badge size="extra-small" appearance="tint" color="brand">active</Badge>
                )}
              </div>
            ))}
            {filterProject !== 'all' && (
              <Button size="small" appearance="subtle" onClick={() => setFilterProject('all')}>
                Clear filter
              </Button>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text size={400} weight="semibold">Activity Feed</Text>
            <div className={styles.filters}>
              <Select
                size="small"
                value={filterPeriod}
                onChange={(_, d) => setFilterPeriod(d.value)}
              >
                {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
              <Select
                size="small"
                value={filterType}
                onChange={(_, d) => setFilterType(d.value)}
              >
                <option value="all">All types</option>
                {eventTypes.map((t) => <option key={t} value={t}>{eventTypeLabel(t)}</option>)}
              </Select>
            </div>
          </div>

          <Divider />

          {filtered.length === 0 && (
            <Text className={styles.emptyState}>No activity in this period.</Text>
          )}

          {filtered.map((entry, i) => (
            <div key={entry.id}>
              <div className={styles.feedItem}>
                <Avatar name={entry.actorName} size={28} />
                <div className={styles.feedContent}>
                  <div className={styles.feedMeta}>
                    <Text size={200} weight="semibold">{entry.actorName}</Text>
                    <Badge appearance="tint" color={eventTypeColor(entry.eventType)} size="extra-small">
                      {eventTypeLabel(entry.eventType)}
                    </Badge>
                    <Text className={styles.feedTime}>·</Text>
                    <Text className={styles.feedTime}>{entry.projectName}</Text>
                    <Text className={styles.feedTime}>·</Text>
                    <Text className={styles.feedTime}>{timeAgo(entry.createdAt)}</Text>
                  </div>
                  <Text className={styles.feedDesc}>{entry.description}</Text>
                </div>
              </div>
              {i < filtered.length - 1 && <Divider />}
            </div>
          ))}

          {hasMore && filtered.length > 0 && (
            <div className={styles.loadMore}>
              <Button appearance="subtle" size="small" onClick={handleLoadMore} disabled={loading}>
                {loading ? <Spinner size="tiny" /> : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
