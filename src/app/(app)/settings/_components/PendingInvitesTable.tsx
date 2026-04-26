'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Button, Dialog, DialogTrigger, DialogSurface,
  DialogTitle, DialogBody, DialogContent, DialogActions, Spinner,
  Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Badge,
} from '@fluentui/react-components'
import { DeleteRegular } from '@fluentui/react-icons'
import { revokeInvite } from '@/lib/actions/invites'

const ROLE_COLORS: Record<string, 'warning' | 'success' | 'informative' | 'important'> = {
  admin: 'warning', member: 'success', viewer: 'informative',
}

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  section: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  empty: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
})

export interface PendingInvite {
  id: string
  email: string
  role: string
  sentAt: Date
  expiresAt: Date
}

interface Props {
  invites: PendingInvite[]
  onInviteRevoked: () => void
}

export function PendingInvitesTable({ invites: initial, onInviteRevoked }: Props) {
  const styles = useStyles()
  const [invites, setInvites] = useState<PendingInvite[]>(initial)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleRevoke(inviteId: string) {
    setRevoking(inviteId)
    startTransition(async () => {
      const res = await revokeInvite(inviteId)
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
        onInviteRevoked()
      }
      setRevoking(null)
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text size={300} weight="semibold">Pending Invites</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginLeft: 8 }}>
            {invites.length} invite{invites.length !== 1 ? 's' : ''}
          </Text>
        </div>
        {invites.length === 0 ? (
          <div className={styles.empty}>
            <Text size={200}>No pending invites. Use the button above to invite users.</Text>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Sent</TableHeaderCell>
                <TableHeaderCell>Expires</TableHeaderCell>
                <TableHeaderCell style={{ width: 48 }}></TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell><Text size={200}>{inv.email}</Text></TableCell>
                  <TableCell><Badge appearance="tint" color={ROLE_COLORS[inv.role] ?? 'informative'}>{inv.role}</Badge></TableCell>
                  <TableCell><Text size={200}>{new Date(inv.sentAt).toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })}</Text></TableCell>
                  <TableCell><Text size={200}>{new Date(inv.expiresAt).toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })}</Text></TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger disableButtonEnhancement>
                        <Button
                          icon={<DeleteRegular />}
                          size="small"
                          appearance="subtle"
                          disabled={revoking === inv.id}
                        />
                      </DialogTrigger>
                      <DialogSurface>
                        <DialogBody>
                          <DialogTitle>Revoke Invite</DialogTitle>
                          <DialogContent>
                            <Text>Revoke the invite to <strong>{inv.email}</strong>? They will not be able to accept it.</Text>
                          </DialogContent>
                          <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                              <Button appearance="subtle">Cancel</Button>
                            </DialogTrigger>
                            <Button
                              appearance="primary"
                              style={{ backgroundColor: tokens.colorStatusDangerBackground3 }}
                              onClick={() => handleRevoke(inv.id)}
                              disabled={revoking === inv.id}
                            >
                              {revoking === inv.id ? <Spinner size="tiny" /> : 'Revoke'}
                            </Button>
                          </DialogActions>
                        </DialogBody>
                      </DialogSurface>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
