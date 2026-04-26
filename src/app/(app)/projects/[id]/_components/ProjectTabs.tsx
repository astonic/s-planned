'use client'

import { useState } from 'react'
import { makeStyles, tokens, TabList, Tab } from '@fluentui/react-components'
import type { ProjectOverviewProps } from './ProjectOverview'
import { ProjectOverview } from './ProjectOverview'
import type { DecisionItem } from './DecisionLog'
import { DecisionLog } from './DecisionLog'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column' },
  tabBar: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingLeft: tokens.spacingHorizontalXXL,
  },
  tabContent: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
  },
})

interface ProjectTabsProps {
  overview: ProjectOverviewProps
  projectId: string
  decisions: DecisionItem[]
}

export function ProjectTabs({ overview, projectId, decisions }: ProjectTabsProps) {
  const styles = useStyles()
  const [tab, setTab] = useState<'overview' | 'decisions'>('overview')

  return (
    <div className={styles.root}>
      <div className={styles.tabBar}>
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as 'overview' | 'decisions')}>
          <Tab value="overview">Overview</Tab>
          <Tab value="decisions">Decisions</Tab>
        </TabList>
      </div>
      <div className={styles.tabContent}>
        {tab === 'overview' && <ProjectOverview {...overview} />}
        {tab === 'decisions' && <DecisionLog projectId={projectId} initialDecisions={decisions} />}
      </div>
    </div>
  )
}
