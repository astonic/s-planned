'use client'

import { useState, useTransition } from 'react'
import {
  Button,
  Divider,
  Field,
  Input,
  Select,
  Spinner,
  Switch,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissCircleRegular, PlugConnectedRegular } from '@fluentui/react-icons'
import { saveWhatsAppSettings, testWhatsAppSettings } from '@/lib/actions/settings'

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '640px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalM },
  feedback: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  testResult: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
})

interface Props {
  whatsappEnabled: boolean
  whatsappProvider?: string | null
  whatsappPhoneNumberId?: string | null
  whatsappBusinessAccountId?: string | null
  whatsappFromNumber?: string | null
}

export function WhatsAppSettingsForm({
  whatsappEnabled,
  whatsappProvider,
  whatsappPhoneNumberId,
  whatsappBusinessAccountId,
  whatsappFromNumber,
}: Props) {
  const styles = useStyles()
  const [enabled, setEnabled] = useState(whatsappEnabled)
  const [provider, setProvider] = useState(whatsappProvider ?? 'meta')
  const [phoneNumberId, setPhoneNumberId] = useState(whatsappPhoneNumberId ?? '')
  const [businessAccountId, setBusinessAccountId] = useState(whatsappBusinessAccountId ?? '')
  const [accessToken, setAccessToken] = useState('')
  const [fromNumber, setFromNumber] = useState(whatsappFromNumber ?? '')
  const [pending, startTransition] = useTransition()
  const [testing, startTest] = useTransition()
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const input = () => ({
    whatsappEnabled: enabled,
    whatsappProvider: provider,
    whatsappPhoneNumberId: phoneNumberId,
    whatsappBusinessAccountId: businessAccountId,
    whatsappAccessToken: accessToken || undefined,
    whatsappFromNumber: fromNumber,
  })

  function clearFeedback() {
    setSaveResult(null)
    setTestResult(null)
  }

  function handleSave() {
    setSaveResult(null)
    startTransition(async () => {
      const res = await saveWhatsAppSettings(input())
      setSaveResult(res.ok ? { ok: true, msg: 'Settings saved.' } : { ok: false, msg: res.error })
    })
  }

  function handleTest() {
    setTestResult(null)
    startTest(async () => {
      const res = await testWhatsAppSettings(input())
      setTestResult(res.ok ? { ok: true, msg: res.data.message } : { ok: false, msg: res.error })
    })
  }

  return (
    <div className={styles.form}>
      <Field label="Enable WhatsApp notifications">
        <Switch
          checked={enabled}
          onChange={(event) => {
            setEnabled(event.currentTarget.checked)
            clearFeedback()
          }}
          label={enabled ? 'Enabled' : 'Disabled'}
        />
      </Field>

      <div className={styles.row}>
        <Field label="Provider">
          <Select value={provider} onChange={(_, data) => { setProvider(data.value); clearFeedback() }}>
            <option value="meta">Meta WhatsApp Cloud API</option>
          </Select>
        </Field>
        <Field label="From number">
          <Input value={fromNumber} onChange={(_, data) => { setFromNumber(data.value); clearFeedback() }} placeholder="+27 11 555 0100" />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label="Phone Number ID" required={enabled}>
          <Input value={phoneNumberId} onChange={(_, data) => { setPhoneNumberId(data.value); clearFeedback() }} placeholder="Meta phone number ID" />
        </Field>
        <Field label="Business Account ID">
          <Input value={businessAccountId} onChange={(_, data) => { setBusinessAccountId(data.value); clearFeedback() }} placeholder="Meta business account ID" />
        </Field>
      </div>

      <Field label="Access Token" required={enabled}>
        <Input type="password" value={accessToken} onChange={(_, data) => { setAccessToken(data.value); clearFeedback() }} placeholder="Leave blank to keep existing" />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' }}>
        <Button appearance="primary" onClick={handleSave} disabled={pending}>
          {pending ? <Spinner size="tiny" /> : 'Save Changes'}
        </Button>
        <Button appearance="outline" icon={<PlugConnectedRegular />} onClick={handleTest} disabled={testing}>
          {testing ? <Spinner size="tiny" /> : 'Check Configuration'}
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
