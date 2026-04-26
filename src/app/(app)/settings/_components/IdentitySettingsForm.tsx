'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Input, Button, Select, Checkbox, Field,
  Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody,
  DialogContent, DialogActions, Spinner, Textarea,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissCircleRegular, PlugConnectedRegular } from '@fluentui/react-icons'
import { saveSamlSettings, saveOidcSettings, testSamlConnection, testOidcConnection, disableSso } from '@/lib/actions/sso-settings'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  section: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  row: { display: 'flex', gap: tokens.spacingHorizontalL },
  successBox: {
    backgroundColor: tokens.colorStatusSuccessBackground2,
    border: `1px solid ${tokens.colorStatusSuccessBorder1}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalM,
    display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'flex-start',
  },
  errorBox: {
    backgroundColor: tokens.colorStatusDangerBackground2,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalM,
    display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'flex-start',
  },
  buttonGroup: { display: 'flex', gap: tokens.spacingHorizontalM },
})

interface IdentitySettingsData {
  samlEnabled?: boolean
  samlEntryPoint?: string | null
  samlIssuer?: string | null
  oidcEnabled?: boolean
  oidcClientId?: string | null
  oidcDiscoveryUrl?: string | null
  ssoEnabled?: boolean
  ssoProtocol?: string | null
  ssoAutoProvision?: boolean
  ssoDefaultRole?: string | null
}

interface Props {
  data: IdentitySettingsData
}

export function IdentitySettingsForm({ data }: Props) {
  const styles = useStyles()
  const [protocol, setProtocol] = useState<'saml' | 'oidc'>(data.ssoProtocol === 'oidc' ? 'oidc' : 'saml')
  const [isConfigured, setIsConfigured] = useState(!!(data.samlEnabled || data.oidcEnabled))

  // SAML fields
  const [samlEntryPoint, setSamlEntryPoint] = useState(data.samlEntryPoint ?? '')
  const [samlIssuer, setSamlIssuer] = useState(data.samlIssuer ?? '')
  const [samlCertificate, setSamlCertificate] = useState('')
  const [samlPrivateKey, setSamlPrivateKey] = useState('')
  const [samlNameIdField, setSamlNameIdField] = useState('urn:oid:0.9.2342.19200300.100.1.3')
  const [samlEmailField, setSamlEmailField] = useState('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress')
  const [samlNameField, setSamlNameField] = useState('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name')

  // OIDC fields
  const [oidcClientId, setOidcClientId] = useState(data.oidcClientId ?? '')
  const [oidcClientSecret, setOidcClientSecret] = useState('')
  const [oidcDiscoveryUrl, setOidcDiscoveryUrl] = useState(data.oidcDiscoveryUrl ?? '')
  const [oidcIssuer, setOidcIssuer] = useState('')

  // Common SSO fields
  const [autoProvision, setAutoProvision] = useState(data.ssoAutoProvision ?? false)
  const [defaultRole, setDefaultRole] = useState(data.ssoDefaultRole ?? 'member')

  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [, startTransition] = useTransition()
  const [pending, setPending] = useState(false)
  const [testPending, setTestPending] = useState(false)

  function handleSaveSaml() {
    setError(null)
    setPending(true)
    startTransition(async () => {
      const res = await saveSamlSettings({
        samlEntryPoint,
        samlIssuer,
        samlCertificate,
        samlPrivateKey: samlPrivateKey || undefined,
        samlNameIdField,
        samlEmailField,
        samlNameField,
        autoProvision,
        defaultRole,
      })
      if (!res.ok) { setError(res.error); setPending(false); return }
      setIsConfigured(true)
      setPending(false)
    })
  }

  function handleSaveOidc() {
    setError(null)
    setPending(true)
    startTransition(async () => {
      const res = await saveOidcSettings({
        oidcDiscoveryUrl: oidcDiscoveryUrl || undefined,
        oidcClientId,
        oidcClientSecret,
        oidcIssuer: oidcIssuer || undefined,
        autoProvision,
        defaultRole,
      })
      if (!res.ok) { setError(res.error); setPending(false); return }
      setIsConfigured(true)
      setPending(false)
    })
  }

  function handleTestSaml() {
    setTestPending(true)
    startTransition(async () => {
      const res = await testSamlConnection(samlEntryPoint)
      if (res.ok) {
        setTestResult(res.data)
      } else {
        setTestResult({ success: false, message: res.error })
      }
      setTestPending(false)
    })
  }

  function handleTestOidc() {
    setTestPending(true)
    startTransition(async () => {
      const res = await testOidcConnection(oidcDiscoveryUrl)
      if (res.ok) {
        setTestResult(res.data)
      } else {
        setTestResult({ success: false, message: res.error })
      }
      setTestPending(false)
    })
  }

  function handleDisable() {
    setError(null)
    setPending(true)
    startTransition(async () => {
      const res = await disableSso()
      if (!res.ok) { setError(res.error); setPending(false); return }
      setIsConfigured(false)
      setPending(false)
    })
  }

  if (isConfigured) {
    return (
      <div className={styles.root}>
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalL }}>
            <div>
              <Text size={300} weight="semibold">SSO is Configured</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {data.ssoProtocol === 'saml' ? 'SAML' : 'OIDC'} • {data.ssoAutoProvision ? 'Auto-provisioning enabled' : 'Manual provisioning'}
              </Text>
            </div>
            <Dialog>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="subtle">Change</Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Disable SSO</DialogTitle>
                  <DialogContent>
                    <Text>This will disable single sign-on for your organization. Users will need to use email/password authentication.</Text>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="subtle">Cancel</Button>
                    </DialogTrigger>
                    <Button
                      appearance="primary"
                      style={{ backgroundColor: tokens.colorStatusDangerBackground3 }}
                      onClick={handleDisable}
                      disabled={pending}
                    >
                      {pending ? <Spinner size="tiny" /> : 'Disable SSO'}
                    </Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <Field label="Authentication Protocol" required>
          <Select value={protocol} onChange={(_, d) => setProtocol(d.value as 'saml' | 'oidc')}>
            <option value="saml">SAML 2.0</option>
            <option value="oidc">OpenID Connect (OIDC)</option>
          </Select>
        </Field>

        {protocol === 'saml' && (
          <div className={styles.form}>
            <Text size={300} weight="semibold" block style={{ marginTop: tokens.spacingVerticalL }}>SAML Configuration</Text>
            <Field label="IdP Entry Point (Login URL)" required>
              <Input
                value={samlEntryPoint}
                onChange={(_, d) => setSamlEntryPoint(d.value)}
                placeholder="https://idp.example.com/sso/login"
              />
            </Field>
            <Field label="SP EntityID (Issuer)" required>
              <Input
                value={samlIssuer}
                onChange={(_, d) => setSamlIssuer(d.value)}
                placeholder="https://splanned.example.com"
              />
            </Field>
            <Field label="IdP Public Certificate" required>
              <Textarea
                value={samlCertificate}
                onChange={(_, d) => setSamlCertificate(d.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIBkTCB..."
              />
            </Field>
            <Field label="SP Private Key (optional for signing)">
              <Textarea
                value={samlPrivateKey}
                onChange={(_, d) => setSamlPrivateKey(d.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIBkTCB..."
              />
            </Field>
            <div className={styles.row}>
              <Field label="Name ID Field" style={{ flex: 1 }}>
                <Input
                  value={samlNameIdField}
                  onChange={(_, d) => setSamlNameIdField(d.value)}
                  placeholder="urn:oid:0.9.2342.19200300.100.1.3"
                />
              </Field>
            </div>
            <Field label="Email Attribute">
              <Input
                value={samlEmailField}
                onChange={(_, d) => setSamlEmailField(d.value)}
                placeholder="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
              />
            </Field>
            <Field label="Name Attribute">
              <Input
                value={samlNameField}
                onChange={(_, d) => setSamlNameField(d.value)}
                placeholder="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
              />
            </Field>

            <Button
              appearance="secondary"
              icon={<PlugConnectedRegular />}
              onClick={handleTestSaml}
              disabled={testPending || !samlEntryPoint.trim()}
            >
              {testPending ? <Spinner size="tiny" /> : 'Test Connection'}
            </Button>
          </div>
        )}

        {protocol === 'oidc' && (
          <div className={styles.form}>
            <Text size={300} weight="semibold" block style={{ marginTop: tokens.spacingVerticalL }}>OIDC Configuration</Text>
            <Field label="Discovery URL" required>
              <Input
                value={oidcDiscoveryUrl}
                onChange={(_, d) => setOidcDiscoveryUrl(d.value)}
                placeholder="https://idp.example.com/.well-known/openid-configuration"
              />
            </Field>
            <Field label="Client ID" required>
              <Input
                value={oidcClientId}
                onChange={(_, d) => setOidcClientId(d.value)}
                placeholder="my-app-client-id"
              />
            </Field>
            <Field label="Client Secret" required>
              <Input
                type="password"
                value={oidcClientSecret}
                onChange={(_, d) => setOidcClientSecret(d.value)}
                placeholder="•••••••••"
              />
            </Field>
            <Field label="Issuer (optional)">
              <Input
                value={oidcIssuer}
                onChange={(_, d) => setOidcIssuer(d.value)}
                placeholder="https://idp.example.com"
              />
            </Field>

            <Button
              appearance="secondary"
              icon={<PlugConnectedRegular />}
              onClick={handleTestOidc}
              disabled={testPending || !oidcDiscoveryUrl.trim()}
            >
              {testPending ? <Spinner size="tiny" /> : 'Test Connection'}
            </Button>
          </div>
        )}

        {testResult && (
          <div style={{ marginTop: tokens.spacingVerticalM }}>
            {testResult.success ? (
              <div className={styles.successBox}>
                <CheckmarkCircleRegular style={{ color: tokens.colorStatusSuccessForeground1 }} />
                <Text size={200} style={{ color: tokens.colorStatusSuccessForeground1 }}>{testResult.message}</Text>
              </div>
            ) : (
              <div className={styles.errorBox}>
                <DismissCircleRegular style={{ color: tokens.colorStatusDangerForeground1 }} />
                <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>{testResult.message}</Text>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: tokens.spacingVerticalL, borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: tokens.spacingVerticalL }}>
          <Text size={300} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalM }}>SSO Settings</Text>
          <Checkbox
            label="Auto-provision users on first login"
            checked={autoProvision}
            onChange={(_, d) => setAutoProvision(d.checked === true)}
          />
          <Field label="Default role for auto-provisioned users" style={{ marginTop: tokens.spacingVerticalM }}>
            <Select value={defaultRole} onChange={(_, d) => setDefaultRole(d.value)}>
              <option value="admin">Admin (full access)</option>
              <option value="member">Member (create &amp; edit)</option>
              <option value="viewer">Viewer (read-only)</option>
            </Select>
          </Field>
        </div>

        {error && (
          <div className={styles.errorBox} style={{ marginTop: tokens.spacingVerticalM }}>
            <DismissCircleRegular style={{ color: tokens.colorStatusDangerForeground1 }} />
            <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>{error}</Text>
          </div>
        )}

        <Button
          appearance="primary"
          style={{ marginTop: tokens.spacingVerticalL }}
          onClick={protocol === 'saml' ? handleSaveSaml : handleSaveOidc}
          disabled={pending}
        >
          {pending ? <Spinner size="tiny" /> : `Save ${protocol.toUpperCase()} Configuration`}
        </Button>
      </div>
    </div>
  )
}
