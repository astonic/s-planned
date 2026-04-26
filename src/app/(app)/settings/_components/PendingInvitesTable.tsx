'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Button, Dialog, DialogTrigger, DialogSurface,
  DialogTitle, DialogBody, DialogContent, DialogActions, Spinner,
  DataGrid, DataGridHeader, DataGridRow, DataGridHeaderCell, DataGridBody,
  DataGridCell, createTableColumn, type TableColumnDefinition, Badge,
} from '@fluentui/react-components'
import { DeleteRegular } from '@fluentui/react-icons'
import { revokeInvite } from '@/lib/actions/invites'
import { SpSectionCard } from '@/components/ui/SpSectionCard'
import { SpGridToolbar } from '@/components/ui/SpGridToolbar'

const ROLE_COLORS: Record<string, 'warning' | 'success' | 'informative' | 'important'> = {
  admin: 'warning', member: 'success', viewer: 'informative',
}

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  toolbarWrapper: { padding: `0 ${tokens.spacingHorizontalL}` },
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
  const [search, setSearch] = useState('')
  const [, startTransition] = useTransition()

  const columns: TableColumnDefinition<PendingInvite>[] = [
    createTableColumn({
      columnId: 'email',
      compare: (a, b) => a.email.localeCompare(b.email),
      renderHeaderCell: () => 'Email',
      renderCell: (inv) => <Text size={200}>{inv.email}</Text>,
    }),
    createTableColumn({
      columnId: 'role',
      compare: (a, b) => a.role.localeCompare(b.role),
      renderHeaderCell: () => 'Role',
      renderCell: (inv) => <Badge appearance="tint" color={ROLE_COLORS[inv.role] ?? 'informative'}>{inv.role}</Badge>,
    }),
    createTableColumn({
      columnId: 'sentAt',
      compare: (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
      renderHeaderCell: () => 'Sent',
      renderCell: (inv) => <Text size={200}>{new Date(inv.sentAt).toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })}</Text>,
    }),
    createTableColumn({
      columnId: 'expiresAt',
      compare: (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      renderHeaderCell: () => 'Expires',
      renderCell: (inv) => <Text size={200}>{new Date(inv.expiresAt).toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })}</Text>,
    }),
    createTableColumn({
      columnId: 'actions',
      compare: () => 0,
      renderHeaderCell: () => '',
      renderCell: (inv) => (
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
      ),
    }),
  ]

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

  const filtered = search.trim()
    ? invites.filter((inv) =>
        [inv.email, inv.role].join(' ').toLowerCase().includes(search.toLowerCase()),
      )
    : invites

  return (
    <div className={styles.root}>
      <SpSectionCard
        title="Pending Invites"
        count={filtered.length}
        countLabel="invite"
        isEmpty={invites.length === 0}
        emptyMessage="No pending invites. Use the Invite User button above to invite colleagues."
      >
        <div className={styles.toolbarWrapper}>
          <SpGridToolbar search={search} onSearch={setSearch} searchPlaceholder="Search invites..." />
        </div>
        <DataGrid items={filtered} columns={columns} sortable getRowId={(inv) => inv.id}>
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<PendingInvite>>
            {({ item, rowId }) => (
              <DataGridRow key={rowId}>
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </SpSectionCard>
    </div>
  )
}
