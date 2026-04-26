'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Button, Divider, Spinner, Switch,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons'
import { saveNotificationSettings } from '@/lib/actions/settings'

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '480px' },
  switchRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalM} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  switchLabel: { display: 'flex', flexDirection: 'column', gap: '2px' },
  feedback: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
})

interface Props {
  notifyEmail: boolean
  notifyReminders: boolean
  notifyRaid: boolean
  notifyDigest: boolean
}

export function NotificationSettingsForm({ notifyEmail, notifyReminders, notifyRaid, notifyDigest }: Props) {
  const styles = useStyles()
  const [email, setEmail] = useState(notifyEmail)
  const [reminders, setReminders] = useState(notifyReminders)
  const [raid, setRaid] = useState(notifyRaid)
  const [digest, setDigest] = useState(notifyDigest)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const items = [
    { key: 'email', label: 'Email Notifications', desc: 'Send emails for all notification types', value: email, set: setEmail },
    { key: 'reminders', label: 'Deliverable Reminders', desc: 'Notify assignees of upcoming due dates', value: reminders, set: setReminders },
    { key: 'raid', label: 'RAID Alerts', desc: 'Notify relevant people when new RAID items are created', value: raid, set: setRaid },
    { key: 'digest', label: 'Weekly Digest', desc: 'Send a weekly summary email to all members', value: digest, set: setDigest },
  ]

  function handleSave() {
    setResult(null)
    startTransition(async () => {
      const res = await saveNotificationSettings({ notifyEmail: email, notifyReminders: reminders, notifyRaid: raid, notifyDigest: digest })
      setResult(res.ok ? { ok: true, msg: 'Preferences saved.' } : { ok: false, msg: res.error })
    })
  }

  return (
    <div className={styles.form}>
      {items.map((item) => (
        <div key={item.key} className={styles.switchRow}>
          <div className={styles.switchLabel}>
            <Text size={300} weight="semibold">{item.label}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{item.desc}</Text>
          </div>
          <Switch checked={item.value} onChange={(_, d) => item.set(d.checked)} />
        </div>
      ))}
      <Divider />
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
        <Button appearance="primary" onClick={handleSave} disabled={pending}>
          {pending ? <Spinner size="tiny" /> : 'Save Preferences'}
        </Button>
        {result && (
          <div className={styles.feedback}>
            {result.ok
              ? <CheckmarkCircleRegular style={{ color: tokens.colorStatusSuccessForeground1 }} />
              : <DismissCircleRegular style={{ color: tokens.colorStatusDangerForeground1 }} />}
            <Text size={200} style={{ color: result.ok ? tokens.colorStatusSuccessForeground1 : tokens.colorStatusDangerForeground1 }}>
              {result.msg}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
