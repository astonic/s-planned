'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Input, Button, Field, Divider, Spinner, Switch,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissCircleRegular, PlugConnectedRegular } from '@fluentui/react-icons'
import { saveSmtpSettings, testSmtpConnection } from '@/lib/actions/settings'

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '560px' },
  row: { display: 'flex', gap: tokens.spacingHorizontalM },
  feedback: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  testResult: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
})

interface Props {
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUser?: string | null
  smtpFrom?: string | null
  smtpFromName?: string | null
  smtpSecure: boolean
}

export function SmtpSettingsForm({ smtpHost, smtpPort, smtpUser, smtpFrom, smtpFromName, smtpSecure }: Props) {
  const styles = useStyles()
  const [host, setHost] = useState(smtpHost ?? '')
  const [port, setPort] = useState(String(smtpPort ?? 587))
  const [user, setUser] = useState(smtpUser ?? '')
  const [password, setPassword] = useState('')
  const [from, setFrom] = useState(smtpFrom ?? '')
  const [fromName, setFromName] = useState(smtpFromName ?? '')
  const [secure, setSecure] = useState(smtpSecure)
  const [pending, startTransition] = useTransition()
  const [testing, startTest] = useTransition()
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const getInput = () => ({
    smtpHost: host, smtpPort: port ? parseInt(port, 10) : undefined,
    smtpUser: user, smtpPassword: password || undefined,
    smtpFrom: from, smtpFromName: fromName, smtpSecure: secure,
  })

  function handleSave() {
    setSaveResult(null)
    startTransition(async () => {
      const res = await saveSmtpSettings(getInput())
      setSaveResult(res.ok ? { ok: true, msg: 'Settings saved.' } : { ok: false, msg: res.error })
    })
  }

  function handleTest() {
    setTestResult(null)
    startTest(async () => {
      const res = await testSmtpConnection(getInput())
      setTestResult(res.ok ? { ok: true, msg: res.data.message } : { ok: false, msg: res.error })
    })
  }

  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <Field label="SMTP Host" required style={{ flex: 2 }}>
          <Input value={host} onChange={(_, d) => setHost(d.value)} placeholder="smtp.example.com" />
        </Field>
        <Field label="Port" required style={{ flex: 1 }}>
          <Input type="number" value={port} onChange={(_, d) => setPort(d.value)} placeholder="587" />
        </Field>
      </div>
      <div className={styles.row}>
        <Field label="Username" style={{ flex: 1 }}>
          <Input value={user} onChange={(_, d) => setUser(d.value)} placeholder="user@example.com" />
        </Field>
        <Field label="Password" style={{ flex: 1 }}>
          <Input type="password" value={password} onChange={(_, d) => setPassword(d.value)} placeholder="Leave blank to keep existing" />
        </Field>
      </div>
      <div className={styles.row}>
        <Field label="From Address" required style={{ flex: 1 }}>
          <Input value={from} onChange={(_, d) => setFrom(d.value)} placeholder="noreply@example.com" />
        </Field>
        <Field label="From Display Name" style={{ flex: 1 }}>
          <Input value={fromName} onChange={(_, d) => setFromName(d.value)} placeholder="S-Planned" />
        </Field>
      </div>
      <Field label="Secure (TLS)">
        <Switch checked={secure} onChange={(_, d) => setSecure(d.checked)} label={secure ? 'TLS enabled' : 'TLS disabled'} />
      </Field>

      {testResult && (
        <div className={styles.testResult}>
          <div className={styles.feedback}>
            {testResult.ok
              ? <CheckmarkCircleRegular style={{ color: tokens.colorStatusSuccessForeground1 }} />
              : <DismissCircleRegular style={{ color: tokens.colorStatusDangerForeground1 }} />}
            <Text size={200}>{testResult.msg}</Text>
          </div>
        </div>
      )}

      <Divider />
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' as const }}>
        <Button appearance="primary" onClick={handleSave} disabled={pending}>
          {pending ? <Spinner size="tiny" /> : 'Save Changes'}
        </Button>
        <Button icon={<PlugConnectedRegular />} appearance="outline" onClick={handleTest} disabled={testing}>
          {testing ? <Spinner size="tiny" /> : 'Test Connection'}
        </Button>
        {saveResult && (
          <div className={styles.feedback}>
            {saveResult.ok
              ? <CheckmarkCircleRegular style={{ color: tokens.colorStatusSuccessForeground1 }} />
              : <DismissCircleRegular style={{ color: tokens.colorStatusDangerForeground1 }} />}
            <Text size={200} style={{ color: saveResult.ok ? tokens.colorStatusSuccessForeground1 : tokens.colorStatusDangerForeground1 }}>
              {saveResult.msg}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
