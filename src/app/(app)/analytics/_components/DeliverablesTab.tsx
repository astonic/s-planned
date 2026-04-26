'use client'

import {
  makeStyles,
  tokens,
  Text,
  Badge,
} from '@fluentui/react-components'
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
  LineChart,
  Line,
} from 'recharts'

export interface StatusBreakdown {
  status: string
  count: number
}

export interface FocusAreaDeliverables {
  name: string
  code: string
  planned: number
  in_progress: number
  delayed: number
  closed: number
}

export interface TrendPoint {
  date: string
  closed: number
  total: number
}

export interface DeliverablesTabProps {
  byStatus: StatusBreakdown[]
  byFocusArea: FocusAreaDeliverables[]
  trend: TrendPoint[]
  totalOverdue: number
  totalDelayed: number
}

const STATUS_COLORS: Record<string, string> = {
  planned: '#605E5C',
  in_progress: '#0078D4',
  delayed: '#C50F1F',
  closed: '#107C10',
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  delayed: 'Delayed',
  closed: 'Closed',
}

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXL },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalXL },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  kpiRow: { display: 'flex', gap: tokens.spacingHorizontalL, flexWrap: 'wrap' as const },
  kpiCard: {
    flex: 1,
    minWidth: '120px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
  kpiValue: { fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, lineHeight: 1 },
})

export function DeliverablesTab({ byStatus, byFocusArea, trend, totalOverdue, totalDelayed }: DeliverablesTabProps) {
  const styles = useStyles()

  const totalAll = byStatus.reduce((s, r) => s + r.count, 0)
  const totalClosed = byStatus.find((r) => r.status === 'closed')?.count ?? 0
  const totalInProgress = byStatus.find((r) => r.status === 'in_progress')?.count ?? 0

  const pieData = byStatus.map((r) => ({
    name: STATUS_LABELS[r.status] ?? r.status,
    value: r.count,
    color: STATUS_COLORS[r.status] ?? '#888',
  }))

  return (
    <div className={styles.root}>
      {/* KPI row */}
      <div className={styles.kpiRow}>
        {[
          { label: 'Total', value: totalAll, color: tokens.colorNeutralForeground1 },
          { label: 'Closed', value: totalClosed, color: '#107C10' },
          { label: 'In Progress', value: totalInProgress, color: '#0078D4' },
          { label: 'Delayed', value: totalDelayed, color: '#C50F1F' },
          { label: 'Overdue', value: totalOverdue, color: '#C50F1F' },
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
        {/* Pie chart */}
        <div className={styles.card}>
          <Text size={300} weight="semibold">Status Distribution</Text>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any, name: any) => [v, name] as [any, any]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trend line */}
        <div className={styles.card}>
          <Text size={300} weight="semibold">Closure Trend</Text>
          {trend.length < 2 ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
              Not enough data to show trend yet.
            </Text>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="closed" stroke="#107C10" strokeWidth={2} dot={false} name="Closed" />
                <Line type="monotone" dataKey="total" stroke="#0078D4" strokeWidth={2} dot={false} name="Total" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Focus area stacked bar */}
      <div className={styles.card}>
        <Text size={300} weight="semibold">Deliverables by Focus Area</Text>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={byFocusArea.map(({ name, code, ...rest }) => ({ name: code || name.slice(0, 12), ...rest }))}
            margin={{ top: 4, right: 16, left: -20, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="closed" stackId="a" fill={STATUS_COLORS.closed} name="Closed" />
            <Bar dataKey="in_progress" stackId="a" fill={STATUS_COLORS.in_progress} name="In Progress" />
            <Bar dataKey="delayed" stackId="a" fill={STATUS_COLORS.delayed} name="Delayed" />
            <Bar dataKey="planned" stackId="a" fill={STATUS_COLORS.planned} name="Planned" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
