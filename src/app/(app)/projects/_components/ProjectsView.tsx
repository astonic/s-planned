'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  makeStyles,
  tokens,
  Button,
  Badge,
  Text,
  ProgressBar,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  createTableColumn,
  type TableColumnDefinition,
  ToggleButton,
} from '@fluentui/react-components'
import {
  GridRegular,
  ListRegular,
  ArrowRightRegular,
} from '@fluentui/react-icons'
import type { ProjectStatus } from '@prisma/client'
import { SpGridToolbar } from '@/components/ui/SpGridToolbar'
import { ProjectCard, type ProjectCardData } from './ProjectCard'
import { NewProjectButton } from './NewProjectButton'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  toolbarLeft: { flex: 1 },
  viewToggle: { display: 'flex', gap: tokens.spacingHorizontalXS },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
    gap: 'var(--sp-space-4)',
  },
  listWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  empty: {
    textAlign: 'center' as const,
    padding: 'var(--sp-space-16) var(--sp-space-6)',
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  ProjectStatus,
  { label: string; color: 'brand' | 'danger' | 'success' | 'subtle' }
> = {
  active: { label: 'Active', color: 'brand' },
  blocked: { label: 'Blocked', color: 'danger' },
  completed: { label: 'Completed', color: 'success' },
  archived: { label: 'Archived', color: 'subtle' },
}

function fmt(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── List columns ──────────────────────────────────────────────────────────────

const listColumns: TableColumnDefinition<ProjectCardData>[] = [
  createTableColumn({
    columnId: 'name',
    compare: (a, b) => a.name.localeCompare(b.name),
    renderHeaderCell: () => 'Project',
    renderCell: (p) => (
      <div>
        <Text size={300} weight="semibold" block>{p.name}</Text>
        {p.description && (
          <Text
            size={200}
            style={{
              color: tokens.colorNeutralForeground3,
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '320px',
            }}
          >
            {p.description}
          </Text>
        )}
      </div>
    ),
  }),
  createTableColumn({
    columnId: 'status',
    compare: (a, b) => a.status.localeCompare(b.status),
    renderHeaderCell: () => 'Status',
    renderCell: (p) => (
      <Badge appearance="tint" color={STATUS_MAP[p.status].color} size="small">
        {STATUS_MAP[p.status].label}
      </Badge>
    ),
  }),
  createTableColumn({
    columnId: 'template',
    compare: (a, b) => (a.template?.name ?? '').localeCompare(b.template?.name ?? ''),
    renderHeaderCell: () => 'Template',
    renderCell: (p) =>
      p.template ? (
        <Badge appearance="outline" color="informative" size="small">{p.template.name}</Badge>
      ) : (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
      ),
  }),
  createTableColumn({
    columnId: 'readiness',
    compare: (a, b) => {
      const ra = a.deliverableCounts.total > 0 ? a.deliverableCounts.closed / a.deliverableCounts.total : 0
      const rb = b.deliverableCounts.total > 0 ? b.deliverableCounts.closed / b.deliverableCounts.total : 0
      return ra - rb
    },
    renderHeaderCell: () => 'Readiness',
    renderCell: (p) => {
      const pct = p.deliverableCounts.total > 0
        ? Math.round((p.deliverableCounts.closed / p.deliverableCounts.total) * 100)
        : 0
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, minWidth: '120px' }}>
          <ProgressBar value={pct / 100} thickness="medium" color={pct === 100 ? 'success' : 'brand'} style={{ flex: 1 }} />
          <Text size={200} weight="semibold">{pct}%</Text>
        </div>
      )
    },
  }),
  createTableColumn({
    columnId: 'targetDate',
    compare: (a, b) => (a.targetDate?.getTime() ?? 0) - (b.targetDate?.getTime() ?? 0),
    renderHeaderCell: () => 'Target Date',
    renderCell: (p) => (
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{fmt(p.targetDate)}</Text>
    ),
  }),
  createTableColumn({
    columnId: 'actions',
    compare: () => 0,
    renderHeaderCell: () => '',
    renderCell: (p) => (
      <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
        <Button appearance="subtle" icon={<ArrowRightRegular />} size="small" aria-label="Open project" />
      </Link>
    ),
  }),
]

// ── Component ─────────────────────────────────────────────────────────────────

interface ProjectsViewProps {
  projects: ProjectCardData[]
}

export function ProjectsView({ projects }: ProjectsViewProps) {
  const styles = useStyles()
  const [view, setView] = useState<'card' | 'list'>('card')
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? projects.filter((p) =>
        [p.name, p.description ?? '', p.status, p.template?.name ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : projects

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <SpGridToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search projects..."
            actions={<NewProjectButton />}
          />
        </div>
        <div className={styles.viewToggle}>
          <ToggleButton
            size="small"
            appearance="subtle"
            icon={<GridRegular />}
            checked={view === 'card'}
            onClick={() => setView('card')}
            aria-label="Card view"
          />
          <ToggleButton
            size="small"
            appearance="subtle"
            icon={<ListRegular />}
            checked={view === 'list'}
            onClick={() => setView('list')}
            aria-label="List view"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 8 }}>
            {search ? 'No projects match your search' : 'No projects yet'}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: 24 }}>
            {search
              ? 'Try a different search term.'
              : 'Create your first project to start tracking operational readiness.'}
          </Text>
          {!search && <NewProjectButton />}
        </div>
      ) : view === 'card' ? (
        <div className={styles.cardGrid}>
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className={styles.listWrap}>
          <DataGrid
            aria-label="Projects list"
            items={filtered}
            columns={listColumns}
            sortable
            size="small"
            getRowId={(p) => p.id}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<ProjectCardData>>
              {({ item, rowId }) => (
                <DataGridRow key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </div>
      )}
    </div>
  )
}
