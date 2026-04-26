'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Input, Textarea, Select, Button, Field, Divider, Spinner,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons'
import { saveGeneralSettings } from '@/lib/actions/settings'

const TIMEZONES = [
  'UTC', 'Africa/Johannesburg', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney',
]

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: '26/04/2026 (DD/MM/YYYY)' },
  { value: 'MM/DD/YYYY', label: '04/26/2026 (MM/DD/YYYY)' },
  { value: 'YYYY-MM-DD', label: '2026-04-26 (YYYY-MM-DD)' },
]

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '560px' },
  row: { display: 'flex', gap: tokens.spacingHorizontalM },
  feedback: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
})

interface Props {
  orgName: string
  description?: string | null
  timezone: string
  dateFormat: string
}

export function GeneralSettingsForm({ orgName, description, timezone, dateFormat }: Props) {
  const styles = useStyles()
  const [name, setName] = useState(orgName)
  const [desc, setDesc] = useState(description ?? '')
  const [tz, setTz] = useState(timezone)
  const [fmt, setFmt] = useState(dateFormat)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleSave() {
    setResult(null)
    startTransition(async () => {
      const res = await saveGeneralSettings({ name, description: desc, timezone: tz, dateFormat: fmt })
      setResult(res.ok ? { ok: true, msg: 'Settings saved.' } : { ok: false, msg: res.error })
    })
  }

  return (
    <div className={styles.form}>
      <Field label="Organization Name" required>
        <Input value={name} onChange={(_, d) => setName(d.value)} />
      </Field>
      <Field label="Description">
        <Textarea value={desc} onChange={(_, d) => setDesc(d.value)} rows={3} resize="vertical" />
      </Field>
      <div className={styles.row}>
        <Field label="Timezone" style={{ flex: 1 }}>
          <Select value={tz} onChange={(_, d) => setTz(d.value)}>
            {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Date Format" style={{ flex: 1 }}>
          <Select value={fmt} onChange={(_, d) => setFmt(d.value)}>
            {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </Field>
      </div>
      <Divider />
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
        <Button appearance="primary" onClick={handleSave} disabled={pending || !name.trim()}>
          {pending ? <Spinner size="tiny" /> : 'Save Changes'}
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
