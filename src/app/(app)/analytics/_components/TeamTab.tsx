'use client'

import { makeStyles, tokens, Text, Avatar } from '@fluentui/react-components'
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

export interface PersonTypeCount { type: string; count: number }
export interface VendorTypeCount { type: string; count: number }
export interface ActiveMember { name: string; eventCount: number }

export interface TeamTabProps {
  byPersonType: PersonTypeCount[]
  byVendorType: VendorTypeCount[]
  topPeople: ActiveMember[]
  totalPeople: number
  totalVendors: number
}

const PERSON_COLORS = ['#0078D4', '#107C10', '#FF8C00', '#605E5C', '#C50F1F', '#8764B8']
const VENDOR_COLORS = ['#0078D4', '#107C10', '#FF8C00', '#605E5C', '#C50F1F']

const PERSON_TYPE_LABELS: Record<string, string> = {
  internal: 'Internal',
  external: 'External',
  contractor: 'Contractor',
  consultant: 'Consultant',
}
const VENDOR_TYPE_LABELS: Record<string, string> = {
  contractor: 'Contractor',
  supplier: 'Supplier',
  consultant: 'Consultant',
  technology: 'Technology',
  other: 'Other',
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
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  progressBar: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    backgroundColor: tokens.colorNeutralBackground3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: '3px', backgroundColor: tokens.colorBrandBackground },
})

export function TeamTab({ byPersonType, byVendorType, topPeople, totalPeople, totalVendors }: TeamTabProps) {
  const styles = useStyles()

  const personData = byPersonType.map((r) => ({ name: PERSON_TYPE_LABELS[r.type] ?? r.type, value: r.count }))
  const vendorData = byVendorType.map((r) => ({ name: VENDOR_TYPE_LABELS[r.type] ?? r.type, value: r.count }))

  const maxActivity = topPeople[0]?.eventCount ?? 1

  return (
    <div className={styles.root}>
      {/* KPI row */}
      <div className={styles.kpiRow}>
        {[
          { label: 'People', value: totalPeople },
          { label: 'Vendors', value: totalVendors },
        ].map(({ label, value }) => (
          <div key={label} className={styles.kpiCard}>
            <Text style={{ fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, lineHeight: 1 }}>
              {value}
            </Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{label}</Text>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        {/* People by type */}
        <div className={styles.card}>
          <Text size={300} weight="semibold">People by Type</Text>
          {personData.length === 0 ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No people yet.</Text>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={personData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {personData.map((_, i) => <Cell key={i} fill={PERSON_COLORS[i % PERSON_COLORS.length]} />)}
              </Pie>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any, name: any) => [v, name] as [any, any]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Vendors by type */}
        <div className={styles.card}>
          <Text size={300} weight="semibold">Vendors by Type</Text>
          {vendorData.length === 0 ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No vendors yet.</Text>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={vendorData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {vendorData.map((_, i) => <Cell key={i} fill={VENDOR_COLORS[i % VENDOR_COLORS.length]} />)}
              </Pie>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any, name: any) => [v, name] as [any, any]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Most active members */}
      <div className={styles.card}>
        <Text size={300} weight="semibold">Most Active Members (by activity)</Text>
        {topPeople.length === 0 && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No activity data yet.</Text>
        )}
        {topPeople.map((m) => (
          <div key={m.name} className={styles.memberRow}>
            <Avatar name={m.name} size={24} />
            <Text size={200} style={{ width: 160, flexShrink: 0 }}>{m.name}</Text>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${Math.round((m.eventCount / maxActivity) * 100)}%` }} />
            </div>
            <Text size={200} style={{ flexShrink: 0, color: tokens.colorNeutralForeground3 }}>
              {m.eventCount} events
            </Text>
          </div>
        ))}
      </div>

      {/* Vendor bar chart */}
      {vendorData.length > 0 && (
        <div className={styles.card}>
          <Text size={300} weight="semibold">Vendor Distribution</Text>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vendorData} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {vendorData.map((_, i) => <Cell key={i} fill={VENDOR_COLORS[i % VENDOR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
