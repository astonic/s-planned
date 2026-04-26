'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles,
  tokens,
  TabList,
  Tab,
  Select,
  Text,
  Spinner,
} from '@fluentui/react-components'
import type { ReadinessTabProps } from './ReadinessTab'
import { ReadinessTab } from './ReadinessTab'
import type { DeliverablesTabProps } from './DeliverablesTab'
import { DeliverablesTab } from './DeliverablesTab'
import type { RaidTabProps } from './RaidTab'
import { RaidTab } from './RaidTab'
import type { TeamTabProps } from './TeamTab'
import { TeamTab } from './TeamTab'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectOption { id: string; name: string }

export interface AnalyticsData {
  readiness: ReadinessTabProps
  deliverables: DeliverablesTabProps
  raid: RaidTabProps
  team: TeamTabProps
}

export interface AnalyticsTabsProps {
  projects: ProjectOption[]
  initialProjectId: string
  initialData: AnalyticsData
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
  },
  content: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
  },
  loading: { display: 'flex', justifyContent: 'center', paddingTop: tokens.spacingVerticalXXL },
  empty: { color: tokens.colorNeutralForeground3, fontStyle: 'italic', padding: tokens.spacingVerticalL },
})

type TabKey = 'readiness' | 'deliverables' | 'raid' | 'team'

export function AnalyticsTabs({ projects, initialProjectId, initialData }: AnalyticsTabsProps) {
  const styles = useStyles()
  const [tab, setTab] = useState<TabKey>('readiness')
  const [projectId, setProjectId] = useState(initialProjectId)
  const [data, setData] = useState<AnalyticsData>(initialData)
  const [loading, startTransition] = useTransition()

  function handleProjectChange(newId: string) {
    setProjectId(newId)
    startTransition(async () => {
      const res = await fetch(`/api/analytics?projectId=${encodeURIComponent(newId)}`)
      if (res.ok) {
        const json = await res.json() as AnalyticsData
        setData(json)
      }
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabKey)}>
          <Tab value="readiness">Readiness</Tab>
          <Tab value="deliverables">Deliverables</Tab>
          <Tab value="raid">RAID</Tab>
          <Tab value="team">Team</Tab>
        </TabList>

        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, paddingTop: '8px', paddingBottom: '8px' }}>
          {loading && <Spinner size="tiny" />}
          {projects.length === 0 ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>No projects</Text>
          ) : (
            <Select
              size="small"
              value={projectId}
              onChange={(_, d) => handleProjectChange(d.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {tab === 'readiness' && <ReadinessTab {...data.readiness} />}
        {tab === 'deliverables' && <DeliverablesTab {...data.deliverables} />}
        {tab === 'raid' && <RaidTab {...data.raid} />}
        {tab === 'team' && <TeamTab {...data.team} />}
      </div>
    </div>
  )
}
