'use client'

import { useMemo, useState } from 'react'
import { makeStyles, tokens, Button, Input, Text } from '@fluentui/react-components'
import {
  BoardRegular,
  CalendarLtrRegular,
  ChartMultipleRegular,
  ClipboardTaskRegular,
  GridRegular,
  PeopleRegular,
  SearchRegular,
  TrophyRegular,
} from '@fluentui/react-icons'
import type { ProjectWorkspaceData } from './workspace-types'
import { flatDeliverables } from './workspace-types'
import { AddDeliverableWizard } from './AddDeliverableWizard'
import { GridView } from './GridView'
import { BoardView } from './BoardView'
import { TimelineView } from './TimelineView'
import { ChartsView } from './ChartsView'
import { PeopleView } from './PeopleView'
import { GoalsView } from './GoalsView'
import { AssignmentsView } from './AssignmentsView'

export type { ProjectWorkspaceData } from './workspace-types'

type Tab = 'grid' | 'board' | 'timeline' | 'charts' | 'people' | 'goals' | 'assignments'

const TABS: { key: Tab; label: string; icon: React.ReactElement }[] = [
  { key: 'grid',        label: 'Grid',        icon: <GridRegular /> },
  { key: 'board',       label: 'Board',       icon: <BoardRegular /> },
  { key: 'timeline',    label: 'Timeline',    icon: <CalendarLtrRegular /> },
  { key: 'charts',      label: 'Charts',      icon: <ChartMultipleRegular /> },
  { key: 'people',      label: 'People',      icon: <PeopleRegular /> },
  { key: 'goals',       label: 'Focus Areas',  icon: <TrophyRegular /> },
  { key: 'assignments', label: 'Assignments', icon: <ClipboardTaskRegular /> },
]

const useStyles = makeStyles({
  root: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: 'calc(100vh - 220px)',
    display: 'flex',
    flexDirection: 'column',
  },
  viewBar: {
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '0 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    overflowX: 'auto',
    flexShrink: 0,
  },
  viewBtn: {
    minWidth: 'auto',
    borderRadius: 0,
    borderBottom: '2px solid transparent',
    padding: '0 10px',
    height: '100%',
  },
  viewBtnActive: {
    borderBottomColor: tokens.colorBrandForeground1,
    color: tokens.colorBrandForeground1,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: '8px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  search: { width: '220px', maxWidth: '100%' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
})

export function WorkspaceView({ project }: { project: ProjectWorkspaceData }) {
  const s = useStyles()
  const [tab, setTab] = useState<Tab>('grid')
  const [query, setQuery] = useState('')

  const allDs = useMemo(() => flatDeliverables(project.focusAreaExecutions), [project.focusAreaExecutions])
  const pct = allDs.length === 0 ? 0 : Math.round(allDs.reduce((s, d) => s + d.progress, 0) / allDs.length)

  return (
    <div className={s.root}>
      <div className={s.viewBar}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            appearance="subtle"
            icon={t.icon}
            className={`${s.viewBtn} ${tab === t.key ? s.viewBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className={s.filterRow}>
        <Input
          className={s.search}
          contentBefore={<SearchRegular />}
          placeholder="Filter by keyword"
          value={query}
          onChange={(_, data) => setQuery(data.value)}
        />
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {allDs.length} deliverables · {pct}% complete
        </Text>
        <div style={{ marginLeft: 'auto' }}>
          <AddDeliverableWizard projectId={project.id} focusAreas={project.focusAreaExecutions} />
        </div>
      </div>

      <div className={s.content}>
        {tab === 'grid'        && <GridView        focusAreas={project.focusAreaExecutions} projectId={project.id} query={query} />}
        {tab === 'board'       && <BoardView       focusAreas={project.focusAreaExecutions} projectId={project.id} query={query} />}
        {tab === 'timeline'    && <TimelineView    focusAreas={project.focusAreaExecutions} projectId={project.id} query={query} />}
        {tab === 'charts'      && <ChartsView      focusAreas={project.focusAreaExecutions} />}
        {tab === 'people'      && <PeopleView      focusAreas={project.focusAreaExecutions} projectId={project.id} query={query} />}
        {tab === 'goals'       && <GoalsView       focusAreas={project.focusAreaExecutions} />}
        {tab === 'assignments' && <AssignmentsView focusAreas={project.focusAreaExecutions} />}
      </div>
    </div>
  )
}
