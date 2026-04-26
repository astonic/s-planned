'use client'

import { useState } from 'react'
import {
  makeStyles, tokens, Text,
  TabList, Tab,
} from '@fluentui/react-components'
import { GeneralSettingsForm } from './GeneralSettingsForm'
import { StorageSettingsForm } from './StorageSettingsForm'
import { SmtpSettingsForm } from './SmtpSettingsForm'
import { NotificationSettingsForm } from './NotificationSettingsForm'
import { UsersSettingsPanel, type MemberRow } from './UsersSettingsPanel'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  tabContent: {
    paddingTop: tokens.spacingVerticalL,
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
  },
})

type TabId = 'general' | 'storage' | 'email' | 'notifications' | 'users'

interface SettingsData {
  orgName: string
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
  notifyEmail: boolean
  notifyReminders: boolean
  notifyRaid: boolean
  notifyDigest: boolean
  members: MemberRow[]
}

export function SettingsShell(props: SettingsData) {
  const styles = useStyles()
  const [tab, setTab] = useState<TabId>('general')

  return (
    <div className={styles.root}>
      <TabList
        selectedValue={tab}
        onTabSelect={(_, d) => setTab(d.value as TabId)}
      >
        <Tab value="general">General</Tab>
        <Tab value="storage">Storage</Tab>
        <Tab value="email">Email (SMTP)</Tab>
        <Tab value="notifications">Notifications</Tab>
        <Tab value="users">Users</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {tab === 'general' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>General Settings</Text>
            <GeneralSettingsForm
              orgName={props.orgName}
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
        {tab === 'notifications' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>Notification Preferences</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Control which email notifications are sent from your organization.
            </Text>
            <NotificationSettingsForm
              notifyEmail={props.notifyEmail}
              notifyReminders={props.notifyReminders}
              notifyRaid={props.notifyRaid}
              notifyDigest={props.notifyDigest}
            />
          </>
        )}
        {tab === 'users' && (
          <>
            <Text size={400} weight="semibold" block className={styles.sectionTitle}>Members</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }} block>
              Manage members and their roles. Invite new users in Phase 11.
            </Text>
            <UsersSettingsPanel members={props.members} />
          </>
        )}
      </div>
    </div>
  )
}
