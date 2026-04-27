'use client'

import {
  makeStyles,
  tokens,
  Text,
  Badge,
} from '@fluentui/react-components'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from 'recharts'

export interface FocusAreaReadiness {
  name: string
  code: string
  total: number
  closed: number
  pct: number
}

export interface PhaseReadiness {
  phase: string
  label: string
  total: number
  closed: number
  pct: number
}

export interface ReadinessTabProps {
  overallPct: number
  totalDeliverables: number
  closedDeliverables: number
  byFocusArea: FocusAreaReadiness[]
  byPhase: PhaseReadiness[]
}

const PHASE_LABELS: Record<string, string> = {
  pre_commissioning: 'Pre-Comm',
  commissioning: 'Commissioning',
  ramp_up: 'Ramp Up',
  handover: 'Handover',
}

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXL },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalXL,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  bigPct: {
    fontSize: '64px',
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1,
    color: tokens.colorBrandForeground1,
    textAlign: 'center' as const,
  },
  subLabel: { textAlign: 'center' as const, color: tokens.colorNeutralForeground3 },
  gaugeWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gaugeLabel: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, paddingBottom: tokens.spacingVerticalS },
  progressBar: {
    flex: 1,
    height: '8px',
    borderRadius: 'var(--sp-radius-pill)',
    backgroundColor: 'var(--sp-gray-100)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 'var(--sp-radius-pill)',
    background: 'var(--sp-grad-primary)',
    boxShadow: 'var(--sp-glow-blue)',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalXS} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
})

function getReadinessColor(pct: number) {
  if (pct >= 80) return 'var(--sp-success)'
  if (pct >= 50) return 'var(--sp-warning)'
  return 'var(--sp-danger)'
}

export function ReadinessTab({
  overallPct,
  totalDeliverables,
  closedDeliverables,
  byFocusArea,
  byPhase,
}: ReadinessTabProps) {
  const styles = useStyles()

  const gaugeData = [
    { name: 'Readiness', value: overallPct, fill: getReadinessColor(overallPct) },
    { name: 'Remaining', value: 100 - overallPct, fill: tokens.colorNeutralBackground3 },
  ]

  const focusAreaChartData = byFocusArea.map((fa) => ({
    name: fa.code || fa.name.slice(0, 12),
    pct: fa.pct,
    closed: fa.closed,
    total: fa.total,
  }))

  const phaseChartData = byPhase.map((p) => ({
    name: PHASE_LABELS[p.phase] ?? p.phase,
    closed: p.closed,
    open: p.total - p.closed,
    pct: p.pct,
  }))

  return (
    <div className={styles.root}>
      {/* KPI row */}
      <div className={styles.grid2}>
        {/* Gauge card */}
        <div className={styles.card} style={{ alignItems: 'center' }}>
          <Text size={300} weight="semibold">Overall Readiness</Text>
          <div className={styles.gaugeWrap} style={{ height: 200 }}>
            <ResponsiveContainer width={200} height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                startAngle={225}
                endAngle={-45}
                data={gaugeData}
                barSize={14}
              >
                <RadialBar dataKey="value" cornerRadius={7} background={{ fill: tokens.colorNeutralBackground3 }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className={styles.gaugeLabel}>
              <Text className={styles.bigPct} style={{ fontSize: '36px', color: getReadinessColor(overallPct) }}>
                {overallPct}%
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Ready</Text>
            </div>
          </div>
          <Text className={styles.subLabel} size={200}>
            {closedDeliverables} of {totalDeliverables} deliverables closed
          </Text>
          <Badge
            appearance="tint"
            color={overallPct >= 80 ? 'success' : overallPct >= 50 ? 'warning' : 'danger'}
            size="medium"
          >
            {overallPct >= 80 ? 'On Track' : overallPct >= 50 ? 'In Progress' : 'At Risk'}
          </Badge>
        </div>

        {/* Phase breakdown */}
        <div className={styles.card}>
          <Text size={300} weight="semibold">Readiness by Phase</Text>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={phaseChartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                formatter={(v: any, name: any) => [v, name === 'closed' ? 'Closed' : 'Open'] as [any, any]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="closed" stackId="a" fill="#107C10" name="Closed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="open" stackId="a" fill={tokens.colorNeutralBackground4} name="Open" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Focus area breakdown */}
      <div className={styles.card}>
        <Text size={300} weight="semibold">Readiness by Focus Area</Text>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={focusAreaChartData} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            formatter={(v: any) => [`${v}%`, 'Readiness'] as [any, any]}
            />
            <Bar dataKey="pct" name="Readiness %" radius={[4, 4, 0, 0]}>
              {focusAreaChartData.map((entry, index) => (
                <Cell key={index} fill={getReadinessColor(entry.pct)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table detail */}
      <div className={styles.card}>
        <Text size={300} weight="semibold">Focus Area Detail</Text>
        {byFocusArea.map((fa) => (
          <div key={fa.code} className={styles.tableRow}>
            <Text size={200} style={{ width: 160, flexShrink: 0 }}>{fa.name}</Text>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${fa.pct}%`, backgroundColor: getReadinessColor(fa.pct) }} />
            </div>
            <Text size={200} style={{ width: 40, textAlign: 'right' as const, flexShrink: 0, color: getReadinessColor(fa.pct), fontWeight: tokens.fontWeightSemibold }}>
              {fa.pct}%
            </Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>
              {fa.closed}/{fa.total}
            </Text>
          </div>
        ))}
        {byFocusArea.length === 0 && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No data yet.</Text>
        )}
      </div>
    </div>
  )
}
