'use client'

import { useState } from 'react'
import {
  makeStyles, tokens, Text,
} from '@fluentui/react-components'
import { SpTabBar } from '@/components/ui/SpTabBar'
import { GeneralSettingsForm } from './GeneralSettingsForm'
import { StorageSettingsForm } from './StorageSettingsForm'
import { SmtpSettingsForm } from './SmtpSettingsForm'
import { WhatsAppSettingsForm } from './WhatsAppSettingsForm'
import { UsersSettingsPanel, type MemberRow } from './UsersSettingsPanel'
import { type PendingInvite } from './PendingInvitesTable'
import { IdentitySettingsForm } from './IdentitySettingsForm'
import { AISettingsForm, type AISettingsProps } from './AISettingsForm'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  tabContent: {
    paddingTop: tokens.spacingVerticalL,
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
  },
})

type TabId = 'general' | 'storage' | 'email' | 'whatsapp' | 'identity' | 'users' | 'ai'

interface SettingsData {
  orgName: string
  logoUrl?: string | null
  description?: string | null
  timezone: string
  dateFormat: string
  storageProvider: string
  storageEndpoint?: string | null
  storageAccessKey?: string | null
  storageBucket?: string | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUser?: string | null
  smtpFrom?: string | null
  smtpFromName?: string | null
  smtpSecure: boolean
  whatsappEnabled: boolean
  whatsappProvider?: string | null
  whatsappPhoneNumberId?: string | null
  whatsappBusinessAccountId?: string | null
  whatsappFromNumber?: string | null
  members: MemberRow[]
  projectOptions: { id: string; name: string }[]
  pendingInvites: PendingInvite[]
  ssoEnabled?: boolean
  ssoProtocol?: string | null
  samlEnabled?: boolean
  samlEntryPoint?: string | null
  samlIssuer?: string | null
  oidcEnabled?: boolean
  oidcClientId?: string | null
  oidcDiscoveryUrl?: string | null
  ssoAutoProvision?: boolean
  ssoDefaultRole?: string | null
  ai: AISettingsProps
}

export function SettingsShell(props: SettingsData) {
  const styles = useStyles()
  const [tab, setTab] = useState<TabId>('general')

  const settingsTabs = [
    { value: 'general' as const, label: 'General' },
    { value: 'storage' as const, label: 'Storage' },
    { value: 'email' as const, label: 'Email (SMTP)' },
    { value: 'whatsapp' as const, label: 'WhatsApp' },
    { value: 'identity' as const, label: 'Identity' },
    { value: 'ai' as const, label: 'AI' },
    { value: 'users' as const, label: 'Users' },
  ]

  return (
    <div className={styles.root}>
      <SpTabBar
        tabs={settingsTabs}
        selectedValue={tab}
        onTabSelect={(_, d) => setTab(d.value as TabId)}
      />

      <div className={styles.tabContent}>
        {tab === 'general' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>General Settings</Text>
            <GeneralSettingsForm
              orgName={props.orgName}
              logoUrl={props.logoUrl}
              description={props.description}
              timezone={props.timezone}
              dateFormat={props.dateFormat}
            />
          </>
        )}
        {tab === 'storage' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>Document Storage</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Configure where uploaded files and evidence documents are stored.
            </Text>
            <StorageSettingsForm
              storageProvider={props.storageProvider}
              storageEndpoint={props.storageEndpoint}
              storageAccessKey={props.storageAccessKey}
              storageBucket={props.storageBucket}
            />
          </>
        )}
        {tab === 'email' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>Email (SMTP)</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Configure outbound email for notifications and invites.
            </Text>
            <SmtpSettingsForm
              smtpHost={props.smtpHost}
              smtpPort={props.smtpPort}
              smtpUser={props.smtpUser}
              smtpFrom={props.smtpFrom}
              smtpFromName={props.smtpFromName}
              smtpSecure={props.smtpSecure}
            />
          </>
        )}
        {tab === 'whatsapp' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>WhatsApp</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Configure WhatsApp Cloud API details used when project notifications are sent through WhatsApp.
            </Text>
            <WhatsAppSettingsForm
              whatsappEnabled={props.whatsappEnabled}
              whatsappProvider={props.whatsappProvider}
              whatsappPhoneNumberId={props.whatsappPhoneNumberId}
              whatsappBusinessAccountId={props.whatsappBusinessAccountId}
              whatsappFromNumber={props.whatsappFromNumber}
            />
          </>
        )}
        {tab === 'identity' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>Identity & SSO</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Configure single sign-on via SAML or OpenID Connect for enterprise authentication.
            </Text>
            <IdentitySettingsForm data={{
              ssoEnabled: props.ssoEnabled,
              ssoProtocol: props.ssoProtocol,
              samlEnabled: props.samlEnabled,
              samlEntryPoint: props.samlEntryPoint,
              samlIssuer: props.samlIssuer,
              oidcEnabled: props.oidcEnabled,
              oidcClientId: props.oidcClientId,
              oidcDiscoveryUrl: props.oidcDiscoveryUrl,
              ssoAutoProvision: props.ssoAutoProvision,
              ssoDefaultRole: props.ssoDefaultRole,
            }} />
          </>
        )}
        {tab === 'ai' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>AI Suggestions</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Configure the AI model used to analyse projects and surface risks, actions, and insights.
            </Text>
            <AISettingsForm {...props.ai} />
          </>
        )}
        {tab === 'users' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>Members</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Manage members and their roles. Invite colleagues by email below.
            </Text>
            <UsersSettingsPanel
              members={props.members}
              pendingInvites={props.pendingInvites}
              projectOptions={props.projectOptions}
            />
          </>
        )}
      </div>
    </div>
  )
}
