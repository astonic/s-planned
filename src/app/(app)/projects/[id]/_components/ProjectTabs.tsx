'use client'

import { useState } from 'react'
import { makeStyles, tokens, Text } from '@fluentui/react-components'
import { SpTabBar } from '@/components/ui/SpTabBar'
import type { ProjectOverviewProps } from './ProjectOverview'
import { ProjectOverview } from './ProjectOverview'
import type { DecisionItem } from './DecisionLog'
import { DecisionLog } from './DecisionLog'
import { WorkspaceView } from '../workspace/_components/WorkspaceView'
import type { ProjectWorkspaceData } from '../workspace/_components/WorkspaceView'
import { RAIDLogView } from '../raid/_components/RAIDLogView'
import type { RAIDItemWithCount } from '../raid/_components/RAIDLogView'
import type { RAIDOwnerOption } from '../raid/_components/RAIDItemDialog'
import type { RAIDType } from '@prisma/client'
import { ProjectNotificationSettingsForm } from './ProjectNotificationSettingsForm'
import { ProjectNotificationList } from './ProjectNotificationList'
import type { ProjectNotificationSuggestion } from '@/lib/actions/project-notifications'
import { AISuggestionsTab, type AISuggestionsTabProps } from './AISuggestionsTab'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column' },
  tabContent: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
  },
  notificationTabs: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  notificationContent: {
    padding: tokens.spacingVerticalXL,
  },
})

interface ProjectTabsProps {
  overview: ProjectOverviewProps
  projectId: string
  decisions: DecisionItem[]
  deliverablesProject: ProjectWorkspaceData
  phaseOptions: string[]
  people: RAIDOwnerOption[]
  initialTab?: ProjectTab
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
  notificationSettings: {
    notifyEmail: boolean
    notifyReminders: boolean
    notifyRaid: boolean
    notifyDigest: boolean
  }
  notificationSuggestions: ProjectNotificationSuggestion[]
  aiSuggestions: Omit<AISuggestionsTabProps, 'projectId'>
}

type ProjectTab = 'overview' | 'deliverables' | 'decisions' | 'raid' | 'notifications' | 'ai'
type NotificationTab = 'list' | 'preferences'
type RaidTypeFilter = 'all' | RAIDType

export function ProjectTabs({ overview, projectId, decisions, deliverablesProject, phaseOptions, people, initialTab, raid, notificationSettings, notificationSuggestions, aiSuggestions }: ProjectTabsProps) {
  const styles = useStyles()
  const [tab, setTab] = useState<ProjectTab>(initialTab ?? 'overview')
  const [notificationTab, setNotificationTab] = useState<NotificationTab>('list')
  const [raidTypeFilter, setRaidTypeFilter] = useState<RaidTypeFilter>('all')

  const tabs = [
    { value: 'overview' as const, label: 'Overview' },
    { value: 'deliverables' as const, label: 'Deliverables' },
    { value: 'decisions' as const, label: 'Decisions' },
    { value: 'raid' as const, label: 'RAID' },
    { value: 'notifications' as const, label: 'Notifications' },
    { value: 'ai' as const, label: '✦ AI' },
  ]
  const notificationTabs = [
    { value: 'list' as const, label: 'Notification List' },
    { value: 'preferences' as const, label: 'Notification Preferences' },
  ]

  return (
    <div className={styles.root}>
      <SpTabBar
        tabs={tabs}
        selectedValue={tab}
        onTabSelect={(_, d) => {
          const nextTab = d.value as ProjectTab
          if (nextTab === 'raid') setRaidTypeFilter('all')
          setTab(nextTab)
        }}
      />
      {tab === 'raid' ? (
        <RAIDLogView projectId={projectId} items={raid.items} stats={raid.stats} people={people} initialTypeFilter={raidTypeFilter} />
      ) : (
        <div className={styles.tabContent}>
          {tab === 'overview' && (
            <ProjectOverview
              {...overview}
              onRaidTypeSelect={(type) => {
                setRaidTypeFilter(type)
                setTab('raid')
              }}
            />
          )}
          {tab === 'deliverables' && <WorkspaceView project={deliverablesProject} phaseOptions={phaseOptions} />}
          {tab === 'decisions' && <DecisionLog projectId={projectId} initialDecisions={decisions} />}
          {tab === 'ai' && <AISuggestionsTab projectId={projectId} {...aiSuggestions} />}
          {tab === 'notifications' && (
            <div className={styles.notificationTabs}>
              <SpTabBar
                tabs={notificationTabs}
                selectedValue={notificationTab}
                onTabSelect={(_, d) => setNotificationTab(d.value as NotificationTab)}
              />
              <div className={styles.notificationContent}>
                {notificationTab === 'list' && (
                  <>
                    <Text size={400} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
                      Notification List
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
                      Review notification suggestions, edit the message, or send updates to stakeholders.
                    </Text>
                    <ProjectNotificationList projectId={projectId} initialItems={notificationSuggestions} />
                  </>
                )}
                {notificationTab === 'preferences' && (
                  <>
                    <Text size={400} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
                      Notification Preferences
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
                      Control which notifications are suggested and sent for this project.
                    </Text>
                    <ProjectNotificationSettingsForm projectId={projectId} {...notificationSettings} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
