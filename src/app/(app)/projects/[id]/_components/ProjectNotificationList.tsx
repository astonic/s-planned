'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Select,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { DeleteRegular, EditRegular, SendRegular } from '@fluentui/react-icons'
import {
  dismissProjectNotificationSuggestion,
  sendProjectNotification,
  type ProjectNotificationSuggestion,
} from '@/lib/actions/project-notifications'
import type { ProjectNotificationChannel } from '@prisma/client'

type NotificationFilter = 'suggested' | 'sent' | 'dismissed'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, marginBottom: tokens.spacingVerticalXL },
  filterBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  cardTop: { display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'flex-start', justifyContent: 'space-between' },
  titleWrap: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  meta: { color: tokens.colorNeutralForeground3 },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  empty: {
    padding: tokens.spacingVerticalL,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground3,
  },
  dialogStack: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, marginTop: tokens.spacingVerticalM },
})

function channelLabel(channel: ProjectNotificationChannel) {
  return channel === 'whatsapp' ? 'WhatsApp' : 'Email'
}

function statusLabel(status: NotificationFilter) {
  if (status === 'sent') return 'Sent'
  if (status === 'dismissed') return 'Deleted'
  return 'Pending'
}

export function ProjectNotificationList({
  projectId,
  initialItems,
}: {
  projectId: string
  initialItems: ProjectNotificationSuggestion[]
}) {
  const styles = useStyles()
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState<ProjectNotificationSuggestion | null>(null)
  const [channel, setChannel] = useState<ProjectNotificationChannel>('email')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [filter, setFilter] = useState<NotificationFilter>('suggested')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openEditor(item: ProjectNotificationSuggestion) {
    setSelected(item)
    setChannel(item.channels.includes('email') ? 'email' : item.channels[0])
    setSubject(item.subject)
    setBody(item.body)
    setError(null)
  }

  function handleDismiss(item: ProjectNotificationSuggestion) {
    setError(null)
    startTransition(async () => {
      const res = await dismissProjectNotificationSuggestion(projectId, item)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setItems((current) => current.map((entry) => (
        entry.id === item.id
          ? {
              ...entry,
              title: 'Deleted notification',
              reason: `Suggestion deleted for ${entry.recipientName}`,
              status: 'dismissed',
              createdAt: new Date().toISOString(),
            }
          : entry
      )))
      router.refresh()
    })
  }

  function handleSend() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const res = await sendProjectNotification(projectId, {
        ...selected,
        channel,
        subject,
        body,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSelected(null)
      setItems((current) => current.filter((entry) => entry.id !== selected.id))
      router.refresh()
    })
  }

  const counts = {
    suggested: items.filter((item) => item.status === 'suggested').length,
    sent: items.filter((item) => item.status === 'sent').length,
    dismissed: items.filter((item) => item.status === 'dismissed').length,
  }
  const filteredItems = items.filter((item) => item.status === filter)
  const filters: NotificationFilter[] = ['suggested', 'sent', 'dismissed']

  return (
    <div className={styles.root}>
      {error && <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>{error}</Text>}

      <div className={styles.filterBar} aria-label="Notification status filters">
        {filters.map((itemFilter) => (
          <Button
            key={itemFilter}
            appearance={filter === itemFilter ? 'primary' : 'secondary'}
            onClick={() => setFilter(itemFilter)}
          >
            {statusLabel(itemFilter)} ({counts[itemFilter]})
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.empty}>
          <Text size={200}>No {statusLabel(filter).toLowerCase()} notifications right now.</Text>
        </div>
      ) : (
        filteredItems.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.titleWrap}>
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text size={300} weight="semibold">{item.status === 'suggested' ? item.title : item.subject}</Text>
                  <Badge
                    appearance="tint"
                    color={item.status === 'sent' ? 'success' : item.status === 'dismissed' ? 'subtle' : item.kind.includes('overdue') ? 'danger' : item.kind.includes('raid') ? 'warning' : 'informative'}
                    size="small"
                  >
                    {item.status === 'suggested' ? item.kind.replaceAll('_', ' ') : statusLabel(item.status)}
                  </Badge>
                </div>
                <Text size={200} className={styles.meta}>{item.reason}</Text>
                <Text size={200}>To: {item.recipientName}</Text>
                <Text size={200} className={styles.meta}>
                  Channels: {item.channels.map(channelLabel).join(', ')}
                </Text>
              </div>
              {item.status === 'suggested' ? (
                <div className={styles.actions}>
                  <Button
                    appearance="secondary"
                    icon={<EditRegular />}
                    onClick={() => openEditor(item)}
                    disabled={pending}
                  >
                    Edit & Send
                  </Button>
                  <Button
                    appearance="subtle"
                    icon={<DeleteRegular />}
                    onClick={() => handleDismiss(item)}
                    disabled={pending}
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <Badge appearance="outline">{statusLabel(item.status)}</Badge>
              )}
            </div>
          </div>
        ))
      )}

      <Dialog open={!!selected} onOpenChange={(_, data) => !pending && !data.open && setSelected(null)}>
        <DialogSurface style={{ maxWidth: 640, width: '100%' }}>
          <DialogBody>
            <DialogTitle>Edit Notification</DialogTitle>
            <DialogContent>
              {selected && (
                <div className={styles.dialogStack}>
                  <Field label="Channel">
                    <Select value={channel} onChange={(_, data) => setChannel(data.value as ProjectNotificationChannel)}>
                      {selected.channels.map((itemChannel) => (
                        <option key={itemChannel} value={itemChannel}>{channelLabel(itemChannel)}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Recipient">
                    <Input value={selected.recipientName} readOnly />
                  </Field>
                  <Field label="Subject">
                    <Input value={subject} onChange={(_, data) => setSubject(data.value)} />
                  </Field>
                  <Field label="Message">
                    <Textarea rows={8} value={body} onChange={(_, data) => setBody(data.value)} />
                  </Field>
                  {error && <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>{error}</Text>}
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setSelected(null)} disabled={pending}>Cancel</Button>
              <Button appearance="primary" icon={pending ? <Spinner size="tiny" /> : <SendRegular />} onClick={handleSend} disabled={pending || !subject.trim() || !body.trim()}>
                Send
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
