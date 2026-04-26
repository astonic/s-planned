'use client'

import { useState } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { SpTabBar } from '@/components/ui/SpTabBar'
import type { ProjectOverviewProps } from './ProjectOverview'
import { ProjectOverview } from './ProjectOverview'
import type { DecisionItem } from './DecisionLog'
import { DecisionLog } from './DecisionLog'
import { WorkspaceView } from '../workspace/_components/WorkspaceView'
import type { ProjectWorkspaceData } from '../workspace/_components/WorkspaceView'
import { RAIDLogView } from '../raid/_components/RAIDLogView'
import type { RAIDItemWithCount } from '../raid/_components/RAIDLogView'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column' },
  tabContent: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
  },
})

interface ProjectTabsProps {
  overview: ProjectOverviewProps
  projectId: string
  decisions: DecisionItem[]
  deliverablesProject: ProjectWorkspaceData
  raid: {
    items: RAIDItemWithCount[]
    stats: {
      total: number
      byType: { risk: number; assumption: number; issue: number; dependency: number }
      bySeverity: { critical: number; high: number }
      openCount: number
      closedCount: number
    }
  }
}

type ProjectTab = 'overview' | 'deliverables' | 'decisions' | 'raid'

export function ProjectTabs({ overview, projectId, decisions, deliverablesProject, raid }: ProjectTabsProps) {
  const styles = useStyles()
  const [tab, setTab] = useState<ProjectTab>('overview')

  const tabs = [
    { value: 'overview' as const, label: 'Overview' },
    { value: 'deliverables' as const, label: 'Deliverables' },
    { value: 'decisions' as const, label: 'Decisions' },
    { value: 'raid' as const, label: 'RAID' },
  ]

  return (
    <div className={styles.root}>
      <SpTabBar tabs={tabs} selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as ProjectTab)} />
      {tab === 'raid' ? (
        <RAIDLogView projectId={projectId} items={raid.items} stats={raid.stats} />
      ) : (
        <div className={styles.tabContent}>
          {tab === 'overview' && <ProjectOverview {...overview} />}
          {tab === 'deliverables' && <WorkspaceView project={deliverablesProject} />}
          {tab === 'decisions' && <DecisionLog projectId={projectId} initialDecisions={decisions} />}
        </div>
      )}
    </div>
  )
}
