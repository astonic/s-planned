'use client'

import { useState, useTransition } from 'react'
import {
  Badge,
  Button,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowClockwiseRegular,
  BotRegular,
  CheckmarkCircleRegular,
  DismissRegular,
  ErrorCircleRegular,
  InfoRegular,
  LightbulbRegular,
  MailRegular,
  NoteAddRegular,
  WarningRegular,
} from '@fluentui/react-icons'
import {
  generateProjectSuggestions,
  dismissSuggestionItem,
  executeAISuggestionAction,
  type AISuggestionRow,
  type AISuggestionItemRow,
} from '@/lib/actions/ai-suggestions'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  meta: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, marginLeft: 'auto' },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
    color: tokens.colorNeutralForeground3,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center' as const,
  },
  emptyIcon: { fontSize: '48px', opacity: 0.35 },
  list: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'opacity 0.2s',
  },
  cardDismissed: { opacity: 0.35 },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalS },
  cardIcon: { flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase300 },
  cardDesc: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200, marginTop: '2px' },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
    flexWrap: 'wrap',
  },
  riskHigh: { borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: '#C4314B' },
  riskMedium: { borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: '#F7BD0E' },
  riskLow: { borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: tokens.colorNeutralStroke1 },
  toastOk: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorStatusSuccessBackground1,
    border: `1px solid ${tokens.colorStatusSuccessBorderActive}`,
    color: tokens.colorStatusSuccessForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  toastErr: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorderActive}`,
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  limitBadge: {
    padding: `2px 8px`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
})

// ── Priority / type helpers ────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, 'danger' | 'warning' | 'informative'> = {
  high: 'danger',
  medium: 'warning',
  low: 'informative',
}

function TypeIcon({ type }: { type: string }) {
  const s = useStyles()
  if (type === 'risk') return <WarningRegular className={s.cardIcon} style={{ color: '#C4314B', fontSize: 18, marginTop: 2 }} />
  if (type === 'action') return <LightbulbRegular className={s.cardIcon} style={{ color: '#0F6CBD', fontSize: 18, marginTop: 2 }} />
  return <InfoRegular className={s.cardIcon} style={{ color: tokens.colorNeutralForeground3, fontSize: 18, marginTop: 2 }} />
}

function actionLabel(actionType: string | null): string {
  if (actionType === 'send_reminder') return 'Send Reminder'
  if (actionType === 'request_evidence') return 'Request Evidence'
  if (actionType === 'create_raid') return 'Create RAID Item'
  return 'Execute'
}

function ActionIcon({ actionType }: { actionType: string | null }) {
  if (actionType === 'send_reminder') return <MailRegular />
  if (actionType === 'request_evidence') return <NoteAddRegular />
  if (actionType === 'create_raid') return <ErrorCircleRegular />
  return <CheckmarkCircleRegular />
}

// ── SuggestionCard ────────────────────────────────────────────────────────────

function SuggestionCard({
  item,
  onDismiss,
  onExecute,
}: {
  item: AISuggestionItemRow
  onDismiss: (id: string) => void
  onExecute: (id: string) => void
}) {
  const s = useStyles()
  const borderClass = item.priority === 'high' ? s.riskHigh : item.priority === 'medium' ? s.riskMedium : s.riskLow

  return (
    <div className={`${s.card} ${borderClass} ${item.dismissed ? s.cardDismissed : ''}`}>
      <div className={s.cardHeader}>
        <TypeIcon type={item.type} />
        <div className={s.cardBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={s.cardTitle}>{item.title}</span>
            <Badge appearance="tint" color={PRIORITY_COLOR[item.priority] ?? 'informative'} size="small">
              {item.priority}
            </Badge>
            <Badge appearance="outline" size="small">{item.type}</Badge>
            {item.executedAt && (
              <Badge appearance="filled" color="success" size="small">Executed</Badge>
            )}
          </div>
          <div className={s.cardDesc}>{item.description}</div>
        </div>
      </div>

      {!item.dismissed && (
        <div className={s.cardActions}>
          {item.actionType && !item.executedAt && (
            <Button
              size="small"
              appearance="primary"
              icon={<ActionIcon actionType={item.actionType} />}
              onClick={() => onExecute(item.id)}
            >
              {actionLabel(item.actionType)}
            </Button>
          )}
          {item.executedAt && item.executedBy && (
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              Executed by {item.executedBy} · {new Date(item.executedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </Text>
          )}
          <Button
            size="small"
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => onDismiss(item.id)}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface AISuggestionsTabProps {
  projectId: string
  initialSuggestion: AISuggestionRow | null
  refreshUsed: number
  refreshMax: number
  aiEnabled: boolean
}

export function AISuggestionsTab({
  projectId,
  initialSuggestion,
  refreshUsed,
  refreshMax,
  aiEnabled,
}: AISuggestionsTabProps) {
  const s = useStyles()
  const [pending, startTransition] = useTransition()
  const [suggestion, setSuggestion] = useState<AISuggestionRow | null>(initialSuggestion)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  const [used, setUsed] = useState(refreshUsed)

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 4000)
  }

  function handleRefresh() {
    startTransition(async () => {
      const res = await generateProjectSuggestions(projectId)
      if (!res.ok) { showToast(false, res.error); return }
      setSuggestion(res.data)
      setUsed((u) => u + 1)
      showToast(true, `${res.data.items.length} suggestions generated.`)
    })
  }

  function handleDismiss(itemId: string) {
    startTransition(async () => {
      const res = await dismissSuggestionItem(itemId)
      if (!res.ok) { showToast(false, res.error); return }
      setSuggestion((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => i.id === itemId ? { ...i, dismissed: true } : i) } : prev
      )
    })
  }

  function handleExecute(itemId: string) {
    startTransition(async () => {
      const res = await executeAISuggestionAction(itemId)
      if (!res.ok) { showToast(false, res.error); return }
      setSuggestion((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === itemId ? { ...i, executedAt: new Date(), executedBy: 'You' } : i
              ),
            }
          : prev
      )
      showToast(true, res.data.message)
    })
  }

  const visibleItems = suggestion?.items.filter((i) => !i.dismissed) ?? []
  const dismissedCount = suggestion?.items.filter((i) => i.dismissed).length ?? 0

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <BotRegular style={{ fontSize: 20, color: tokens.colorBrandForeground1 }} />
        <Text weight="semibold" size={400}>AI Suggestions</Text>

        <Button
          appearance="primary"
          icon={pending ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
          onClick={handleRefresh}
          disabled={pending || !aiEnabled || used >= refreshMax}
        >
          {pending ? 'Analysing…' : 'Refresh Suggestions'}
        </Button>

        <span className={s.limitBadge}>{used}/{refreshMax} today</span>

        {suggestion && (
          <Text size={100} className={s.meta}>
            Last generated {new Date(suggestion.createdAt).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })} · {suggestion.model}
          </Text>
        )}
      </div>

      {!aiEnabled && (
        <div className={s.empty}>
          <BotRegular className={s.emptyIcon} />
          <Text weight="semibold">AI not configured</Text>
          <Text size={200}>
            Enable AI Suggestions in <strong>Settings → AI</strong> and add your Anthropic API key to get started.
          </Text>
        </div>
      )}

      {aiEnabled && !suggestion && !pending && (
        <div className={s.empty}>
          <BotRegular className={s.emptyIcon} />
          <Text weight="semibold">No suggestions yet</Text>
          <Text size={200}>Click <strong>Refresh Suggestions</strong> to analyse this project and surface risks and recommended actions.</Text>
        </div>
      )}

      {toast && (
        <div className={toast.ok ? s.toastOk : s.toastErr}>{toast.msg}</div>
      )}

      {suggestion && (
        <div className={s.list}>
          {visibleItems.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              onDismiss={handleDismiss}
              onExecute={handleExecute}
            />
          ))}
          {visibleItems.length === 0 && (
            <div className={s.empty}>
              <CheckmarkCircleRegular className={s.emptyIcon} />
              <Text weight="semibold">All items addressed</Text>
              <Text size={200}>All suggestions have been dismissed or executed. Refresh for a new analysis.</Text>
            </div>
          )}
          {dismissedCount > 0 && (
            <Text size={100} style={{ color: tokens.colorNeutralForeground3, textAlign: 'center' as const }}>
              {dismissedCount} dismissed item{dismissedCount > 1 ? 's' : ''} hidden
            </Text>
          )}
        </div>
      )}
    </div>
  )
}
