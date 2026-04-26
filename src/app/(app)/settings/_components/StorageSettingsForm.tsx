'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Input, Select, Button, Field, Divider, Spinner, Badge,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissCircleRegular, PlugConnectedRegular } from '@fluentui/react-icons'
import { saveStorageSettings, testStorageConnection } from '@/lib/actions/settings'

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '560px' },
  feedback: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  testResult: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    marginTop: tokens.spacingVerticalS,
  },
})

interface Props {
  storageProvider: string
  storageEndpoint?: string | null
  storageAccessKey?: string | null
  storageBucket?: string | null
}

export function StorageSettingsForm({ storageProvider, storageEndpoint, storageAccessKey, storageBucket }: Props) {
  const styles = useStyles()
  const [provider, setProvider] = useState(storageProvider)
  const [endpoint, setEndpoint] = useState(storageEndpoint ?? '')
  const [accessKey, setAccessKey] = useState(storageAccessKey ?? '')
  const [secretKey, setSecretKey] = useState('')
  const [bucket, setBucket] = useState(storageBucket ?? '')
  const [pending, startTransition] = useTransition()
  const [testing, startTest] = useTransition()
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleSave() {
    setSaveResult(null)
    startTransition(async () => {
      const res = await saveStorageSettings({ storageProvider: provider, storageEndpoint: endpoint, storageAccessKey: accessKey, storageSecretKey: secretKey || undefined, storageBucket: bucket })
      setSaveResult(res.ok ? { ok: true, msg: 'Settings saved.' } : { ok: false, msg: res.error })
    })
  }

  function handleTest() {
    setTestResult(null)
    startTest(async () => {
      const res = await testStorageConnection({ storageProvider: provider, storageEndpoint: endpoint, storageAccessKey: accessKey, storageSecretKey: secretKey || undefined, storageBucket: bucket })
      setTestResult(res.ok ? { ok: true, msg: res.data.message } : { ok: false, msg: res.error })
    })
  }

  return (
    <div className={styles.form}>
      <Field label="Storage Provider">
        <Select value={provider} onChange={(_, d) => setProvider(d.value)}>
          <option value="local">Local (server filesystem)</option>
          <option value="s3">S3-Compatible (AWS, MinIO, etc.)</option>
          <option value="azure">Azure Blob Storage</option>
        </Select>
      </Field>
      {provider !== 'local' && (
        <>
          <Field label="Endpoint URL" required>
            <Input value={endpoint} onChange={(_, d) => setEndpoint(d.value)} placeholder="https://s3.amazonaws.com" />
          </Field>
          <Field label="Access Key" required>
            <Input value={accessKey} onChange={(_, d) => setAccessKey(d.value)} placeholder="AKIAIOSFODNN7EXAMPLE" />
          </Field>
          <Field label="Secret Key">
            <Input type="password" value={secretKey} onChange={(_, d) => setSecretKey(d.value)} placeholder="Leave blank to keep existing" />
          </Field>
          <Field label="Bucket / Container" required>
            <Input value={bucket} onChange={(_, d) => setBucket(d.value)} placeholder="my-splanned-bucket" />
          </Field>
        </>
      )}

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
        {provider !== 'local' && (
          <Button icon={<PlugConnectedRegular />} appearance="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Spinner size="tiny" /> : 'Test Connection'}
          </Button>
        )}
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
      {provider === 'local' && (
        <Badge appearance="tint" color="informative">Files are stored in the <code>./uploads</code> directory on the server.</Badge>
      )}
    </div>
  )
}
