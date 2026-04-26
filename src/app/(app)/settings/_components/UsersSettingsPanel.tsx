'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Badge, Button, Select,
  Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody,
  DialogContent, DialogActions, Spinner, DataGrid, DataGridHeader,
  DataGridRow, DataGridHeaderCell, DataGridBody, DataGridCell,
  createTableColumn, type TableColumnDefinition,
} from '@fluentui/react-components'
import { PersonDeleteRegular } from '@fluentui/react-icons'
import { changeMemberRole, removeMember } from '@/lib/actions/settings'
import { InviteUserDialog } from './InviteUserDialog'
import { PendingInvitesTable, type PendingInvite } from './PendingInvitesTable'
import { SpGridToolbar } from '@/components/ui/SpGridToolbar'
import { SpSectionCard } from '@/components/ui/SpSectionCard'

const ROLE_COLORS: Record<string, 'warning' | 'success' | 'informative' | 'important'> = {
  owner: 'important', admin: 'warning', member: 'success', viewer: 'informative',
}

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  roleSelect: { minWidth: '120px' },
  toolbarWrapper: { padding: `0 ${tokens.spacingHorizontalL}` },
})

export interface MemberRow {
  id: string          // membership id
  userId: string
  name: string
  email: string
  role: string
  isCurrentUser: boolean
}

interface Props {
  members: MemberRow[]
  pendingInvites: PendingInvite[]
}

export function UsersSettingsPanel({ members: initialMembers, pendingInvites: initialInvites }: Props) {
  const styles = useStyles()
  const [members, setMembers] = useState<MemberRow[]>(initialMembers)
  const [invites, setInvites] = useState<PendingInvite[]>(initialInvites)
  const [memberSearch, setMemberSearch] = useState('')
  const [rolePending, setRolePending] = useState<string | null>(null)
  const [removePending, setRemovePending] = useState<string | null>(null)
  const [, startRoleTransition] = useTransition()
  const [, startRemoveTransition] = useTransition()

  const columns: TableColumnDefinition<MemberRow>[] = [
    createTableColumn({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Name',
      renderCell: (m) => (
        <>
          <Text size={300} weight="semibold">{m.name}</Text>
          {m.isCurrentUser && <Badge appearance="tint" color="brand" size="extra-small" style={{ marginLeft: 6 }}>You</Badge>}
        </>
      ),
    }),
    createTableColumn({
      columnId: 'email',
      compare: (a, b) => a.email.localeCompare(b.email),
      renderHeaderCell: () => 'Email',
      renderCell: (m) => <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{m.email}</Text>,
    }),
    createTableColumn({
      columnId: 'role',
      compare: (a, b) => a.role.localeCompare(b.role),
      renderHeaderCell: () => 'Role',
      renderCell: (m) =>
        m.role === 'owner' ? (
          <Badge appearance="tint" color={ROLE_COLORS.owner}>Owner</Badge>
        ) : (
          <Select
            className={styles.roleSelect}
            value={m.role}
            disabled={rolePending === m.id}
            onChange={(_, d) => handleRoleChange(m.id, d.value as 'admin' | 'member' | 'viewer')}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </Select>
        ),
    }),
    createTableColumn({
      columnId: 'actions',
      compare: () => 0,
      renderHeaderCell: () => '',
      renderCell: (m) =>
        m.role !== 'owner' ? (
          <Dialog>
            <DialogTrigger disableButtonEnhancement>
              <Button
                icon={<PersonDeleteRegular />}
                size="small"
                appearance="subtle"
                disabled={removePending === m.id}
              />
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Remove Member</DialogTitle>
                <DialogContent>
                  <Text>Remove <strong>{m.name}</strong> from the organization? They will lose access immediately.</Text>
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="subtle">Cancel</Button>
                  </DialogTrigger>
                  <Button
                    appearance="primary"
                    style={{ backgroundColor: tokens.colorStatusDangerBackground3 }}
                    onClick={() => handleRemove(m.id)}
                    disabled={removePending === m.id}
                  >
                    {removePending === m.id ? <Spinner size="tiny" /> : 'Remove'}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        ) : null,
    }),
  ]

  function handleRoleChange(membershipId: string, newRole: 'admin' | 'member' | 'viewer') {
    setRolePending(membershipId)
    startRoleTransition(async () => {
      const res = await changeMemberRole(membershipId, newRole)
      if (res.ok) {
        setMembers((prev) => prev.map((m) => m.id === membershipId ? { ...m, role: newRole } : m))
      }
      setRolePending(null)
    })
  }

  function handleRemove(membershipId: string) {
    setRemovePending(membershipId)
    startRemoveTransition(async () => {
      const res = await removeMember(membershipId)
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== membershipId))
      }
      setRemovePending(null)
    })
  }

  const filteredMembers = memberSearch.trim()
    ? members.filter((m) =>
        [m.name, m.email, m.role].join(' ').toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : members

  return (
    <div className={styles.root}>
      <SpSectionCard
        title="Members"
        count={filteredMembers.length}
        countLabel="member"
        actions={<InviteUserDialog onInviteSent={() => {}} />}
      >
        <div className={styles.toolbarWrapper}>
          <SpGridToolbar
            search={memberSearch}
            onSearch={setMemberSearch}
            searchPlaceholder="Search members..."
          />
        </div>
        <DataGrid items={filteredMembers} columns={columns} sortable getRowId={(m) => m.id}>
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<MemberRow>>
            {({ item, rowId }) => (
              <DataGridRow key={rowId}>
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </SpSectionCard>

      <PendingInvitesTable invites={invites} onInviteRevoked={() => {}} />
    </div>
  )
}
