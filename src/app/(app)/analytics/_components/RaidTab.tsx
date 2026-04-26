'use client'

import { makeStyles, tokens, Text } from '@fluentui/react-components'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

export interface RaidTypeCount { type: string; count: number }
export interface RaidSeverityCount { severity: string; count: number }
export interface RaidStatusCount { status: string; count: number }

export interface RaidTabProps {
  byType: RaidTypeCount[]
  bySeverity: RaidSeverityCount[]
  byStatus: RaidStatusCount[]
  openCount: number
  criticalOpenCount: number
  overdueCount: number
}

const TYPE_COLORS: Record<string, string> = {
  risk: '#C50F1F',
  assumption: '#0078D4',
  issue: '#FF8C00',
  dependency: '#605E5C',
}
const SEV_COLORS: Record<string, string> = {
  critical: '#C50F1F',
  high: '#FF8C00',
  medium: '#F7B900',
  low: '#107C10',
}
const STATUS_COLORS: Record<string, string> = {
  open: '#C50F1F',
  in_progress: '#0078D4',
  resolved: '#107C10',
  closed: '#605E5C',
  deferred: '#FF8C00',
}

const TYPE_LABELS: Record<string, string> = { risk: 'Risk', assumption: 'Assumption', issue: 'Issue', dependency: 'Dependency' }
const SEV_LABELS: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }
const STATUS_LABELS: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed', deferred: 'Deferred' }

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXL },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalXL },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: tokens.spacingHorizontalL },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  kpiCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
})

export function RaidTab({ byType, bySeverity, byStatus, openCount, criticalOpenCount, overdueCount }: RaidTabProps) {
  const styles = useStyles()

  const typeData = byType.map((r) => ({ name: TYPE_LABELS[r.type] ?? r.type, value: r.count, color: TYPE_COLORS[r.type] ?? '#888' }))
  const sevData = bySeverity.map((r) => ({ name: SEV_LABELS[r.severity] ?? r.severity, value: r.count, color: SEV_COLORS[r.severity] ?? '#888' }))
  const statusData = byStatus.map((r) => ({ name: STATUS_LABELS[r.status] ?? r.status, value: r.count, color: STATUS_COLORS[r.status] ?? '#888' }))

  return (
    <div className={styles.root}>
      {/* KPI row */}
      <div className={styles.grid3}>
        {[
          { label: 'Open Items', value: openCount, color: '#C50F1F' },
          { label: 'Critical Open', value: criticalOpenCount, color: '#C50F1F' },
          { label: 'Overdue', value: overdueCount, color: '#FF8C00' },
        ].map(({ label, value, color }) => (
          <div key={label} className={styles.kpiCard}>
            <Text style={{ fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, color, lineHeight: 1 }}>
              {value}
            </Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{label}</Text>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        {/* By type */}
        <div className={styles.card}>
          <Text size={300} weight="semibold">Items by Type</Text>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any, name: any) => [v, name] as [any, any]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By severity */}
        <div className={styles.card}>
          <Text size={300} weight="semibold">Open Items by Severity</Text>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {sevData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By status */}
      <div className={styles.card}>
        <Text size={300} weight="semibold">Items by Status</Text>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusData} layout="vertical" margin={{ top: 4, right: 16, left: 60, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
              {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
