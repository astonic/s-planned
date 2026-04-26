'use client'

import { makeStyles, tokens, Text, Badge, Divider } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  kpiRow: { display: 'flex', gap: tokens.spacingHorizontalL, flexWrap: 'wrap' as const },
  kpiCard: {
    flex: 1,
    minWidth: '140px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    textAlign: 'left' as const,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase300,
    verticalAlign: 'top' as const,
  },
  progressBar: {
    height: '8px', borderRadius: '4px',
    backgroundColor: tokens.colorNeutralBackground3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: '4px', backgroundColor: tokens.colorBrandBackground },
  faBlock: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginBottom: tokens.spacingVerticalM,
  },
  faHeader: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM,
  },
})

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative'> = {
  planned: 'informative', in_progress: 'warning', delayed: 'danger', closed: 'success',
}
const RAID_SEV_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative' | 'important'> = {
  critical: 'danger', high: 'important', medium: 'warning', low: 'informative',
}
const RAID_STATUS_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative'> = {
  open: 'danger', in_progress: 'warning', closed: 'success',
}
const DECISION_STATUS_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative'> = {
  pending: 'warning', approved: 'success', rejected: 'danger', deferred: 'informative',
}

function fmtDate(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtPct(n: number) { return `${n}%` }

// ── Section renderers ─────────────────────────────────────────────────────────

export function SectionRenderer({ type, content }: { type: string; content: unknown }) {
  const styles = useStyles()
  const data = content as Record<string, unknown>

  if (type === 'executive_overview' || type === 'project_status') {
    const readinessPct = data.readinessPct as number
    return (
      <div className={styles.root}>
        <div className={styles.kpiRow}>
          {([
            { label: 'Readiness', value: `${readinessPct}%`, color: readinessPct >= 80 ? '#107C10' : readinessPct >= 50 ? '#FF8C00' : '#C50F1F' },
            { label: 'Total Deliverables', value: String(data.totalDeliverables ?? 0) },
            { label: 'Closed', value: String(data.closedDeliverables ?? 0), color: '#107C10' },
            { label: 'Open Risks', value: String(data.openRisks ?? 0), color: (data.openRisks as number) > 0 ? '#C50F1F' : undefined },
          ] as { label: string; value: string; color?: string }[]).map(({ label, value, color }) => (
            <div key={label} className={styles.kpiCard}>
              <Text style={{ fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, lineHeight: 1, color }}>{value}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{label}</Text>
            </div>
          ))}
        </div>
        <div>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Period: {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)}
          </Text>
        </div>
        {!!data.projectStatus && (
          <div>
            <Badge appearance="tint" color="informative">{String(data.projectStatus).replace('_', ' ')}</Badge>
            {!!data.templateName && <Text size={200} style={{ marginLeft: 8, color: tokens.colorNeutralForeground3 }}>Template: {String(data.templateName)}</Text>}
          </div>
        )}
      </div>
    )
  }

  if (type === 'readiness_summary') {
    const byFA = (data.byFocusArea as Array<{ name: string; pct: number; closed: number; total: number }>) ?? []
    return (
      <div className={styles.root}>
        <Text size={300} weight="semibold">Overall: {fmtPct(data.overallPct as number)}</Text>
        {byFA.map((fa) => (
          <div key={fa.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text size={200} style={{ width: 180, flexShrink: 0 }}>{fa.name}</Text>
            <div className={styles.progressBar} style={{ flex: 1 }}>
              <div className={styles.progressFill} style={{ width: `${fa.pct}%` }} />
            </div>
            <Text size={200} style={{ width: 36, textAlign: 'right', flexShrink: 0, fontWeight: tokens.fontWeightSemibold }}>{fmtPct(fa.pct)}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>{fa.closed}/{fa.total}</Text>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'key_risks' || type === 'raid_detail') {
    const items = (data.items as Array<Record<string, unknown>>) ?? []
    return (
      <div>
        {items.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No items.</Text>}
        {items.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Title</th>
                <th className={styles.th}>Severity</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Owner</th>
                <th className={styles.th}>Due</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i}>
                  <td className={styles.td}><Text size={200}>{String(r.type ?? '').toUpperCase().slice(0, 4)}</Text></td>
                  <td className={styles.td}><Text size={200}>{String(r.title ?? '')}</Text></td>
                  <td className={styles.td}><Badge appearance="tint" color={RAID_SEV_COLORS[String(r.severity)] ?? 'informative'} size="small">{String(r.severity ?? '')}</Badge></td>
                  <td className={styles.td}><Badge appearance="tint" color={RAID_STATUS_COLORS[String(r.status)] ?? 'informative'} size="small">{String(r.status ?? '').replace('_', ' ')}</Badge></td>
                  <td className={styles.td}><Text size={200}>{String(r.owner ?? '—')}</Text></td>
                  <td className={styles.td}><Text size={200}>{fmtDate(r.dueDate)}</Text></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  if (type === 'decisions' || type === 'decisions_detail') {
    const decisions = (data.decisions as Array<Record<string, unknown>>) ?? []
    return (
      <div>
        {decisions.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No decisions recorded.</Text>}
        {decisions.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Decision</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d, i) => (
                <tr key={i}>
                  <td className={styles.td}>
                    <Text size={200} weight="semibold">{String(d.description ?? '')}</Text>
                    {!!d.impact && <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>Impact: {String(d.impact)}</Text>}
                  </td>
                  <td className={styles.td}><Badge appearance="tint" color={DECISION_STATUS_COLORS[String(d.status)] ?? 'informative'} size="small">{String(d.status ?? '')}</Badge></td>
                  <td className={styles.td}><Text size={200}>{fmtDate(d.loggedDate)}</Text></td>
                  <td className={styles.td}><Text size={200}>{String(d.loggedBy ?? '—')}</Text></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  if (type === 'evidence_summary') {
    const recent = (data.recentItems as Array<Record<string, unknown>>) ?? []
    return (
      <div className={styles.root}>
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <Text style={{ fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold, lineHeight: 1 }}>{String(data.totalEvidence ?? 0)}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Total Evidence</Text>
          </div>
          <div className={styles.kpiCard}>
            <Text style={{ fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold, lineHeight: 1, color: '#107C10' }}>{String(data.verifiedEvidence ?? 0)}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Verified</Text>
          </div>
        </div>
        {recent.length > 0 && (
          <>
            <Divider />
            <Text size={200} weight="semibold">Recent Evidence</Text>
            {recent.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                <Badge appearance="outline" size="small">{String(e.type ?? '')}</Badge>
                <Text size={200}>{String(e.name ?? '')}</Text>
                {!!e.verified && <Badge appearance="tint" color="success" size="extra-small">Verified</Badge>}
                <Text size={200} style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>{fmtDate(e.uploadedAt)}</Text>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  if (type === 'evidence_detail') {
    const items = (data.items as Array<Record<string, unknown>>) ?? []
    return (
      <div>
        {items.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No evidence items.</Text>}
        {items.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Uploaded By</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e, i) => (
                <tr key={i}>
                  <td className={styles.td}><Text size={200}>{String(e.name ?? '')}</Text></td>
                  <td className={styles.td}><Badge appearance="outline" size="small">{String(e.type ?? '')}</Badge></td>
                  <td className={styles.td}><Text size={200}>{String(e.uploadedBy ?? '—')}</Text></td>
                  <td className={styles.td}><Text size={200}>{fmtDate(e.uploadedAt)}</Text></td>
                  <td className={styles.td}>{!!e.verified ? <Badge appearance="tint" color="success" size="small">Yes</Badge> : <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>No</Text>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  if (type === 'deliverables_detail') {
    const byFA = (data.byFocusArea as Array<{ name: string; code: string; subSections: Array<{ name: string; deliverables: Array<Record<string, unknown>> }> }>) ?? []
    return (
      <div className={styles.root}>
        {byFA.map((fa) => (
          <div key={fa.code} className={styles.faBlock}>
            <div className={styles.faHeader}>
              <Badge appearance="tint" color="brand" size="small">{fa.code}</Badge>
              <Text size={300} weight="semibold">{fa.name}</Text>
            </div>
            {fa.subSections.map((ss) => (
              <div key={ss.name}>
                <div style={{ padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`, backgroundColor: tokens.colorNeutralBackground1 }}>
                  <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>{ss.name}</Text>
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Code</th>
                      <th className={styles.th}>Name</th>
                      <th className={styles.th}>Phase</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ss.deliverables.map((d, i) => (
                      <tr key={i}>
                        <td className={styles.td}><Text size={200} style={{ color: tokens.colorNeutralForeground3, fontFamily: 'monospace' }}>{String(d.code ?? '')}</Text></td>
                        <td className={styles.td}><Text size={200}>{String(d.name ?? '')}</Text></td>
                        <td className={styles.td}><Text size={200}>{String(d.phase ?? '—').replace('_', ' ')}</Text></td>
                        <td className={styles.td}><Badge appearance="tint" color={STATUS_COLORS[String(d.status)] ?? 'informative'} size="small">{String(d.status ?? '').replace('_', ' ')}</Badge></td>
                        <td className={styles.td}><Text size={200}>{fmtDate(d.targetDate)}</Text></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'activity_log') {
    const events = (data.events as Array<Record<string, unknown>>) ?? []
    return (
      <div>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalM }} block>
          Period: {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)} · {events.length} events
        </Text>
        {events.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No activity in period.</Text>}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Actor</th>
              <th className={styles.th}>Event</th>
              <th className={styles.th}>Description</th>
              <th className={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td className={styles.td}><Text size={200}>{String(e.actorName ?? '')}</Text></td>
                <td className={styles.td}><Badge appearance="outline" size="small">{String(e.eventType ?? '')}</Badge></td>
                <td className={styles.td}><Text size={200}>{String(e.description ?? '')}</Text></td>
                <td className={styles.td}><Text size={200}>{fmtDate(e.createdAt)}</Text></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Fallback
  return <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>Section: {type}</Text>
}
