'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Badge, Button, Select,
  Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody,
  DialogContent, DialogActions, Spinner, Table, TableHeader,
  TableRow, TableHeaderCell, TableBody, TableCell,
} from '@fluentui/react-components'
import { PersonDeleteRegular } from '@fluentui/react-icons'
import { changeMemberRole, removeMember } from '@/lib/actions/settings'
import { InviteUserDialog } from './InviteUserDialog'
import { PendingInvitesTable, type PendingInvite } from './PendingInvitesTable'

const ROLE_COLORS: Record<string, 'warning' | 'success' | 'informative' | 'important'> = {
  owner: 'important', admin: 'warning', member: 'success', viewer: 'informative',
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
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalL,
  },
  roleSelect: { minWidth: '120px' },
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
  const [rolePending, setRolePending] = useState<string | null>(null)
  const [removePending, setRemovePending] = useState<string | null>(null)
  const [, startRoleTransition] = useTransition()
  const [, startRemoveTransition] = useTransition()

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

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Text size={300} weight="semibold">Members</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginLeft: 0 }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
          </div>
          <InviteUserDialog onInviteSent={() => {}} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell style={{ width: 48 }}></TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Text size={300} weight="semibold">{m.name}</Text>
                  {m.isCurrentUser && <Badge appearance="tint" color="brand" size="extra-small" style={{ marginLeft: 6 }}>You</Badge>}
                </TableCell>
                <TableCell><Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{m.email}</Text></TableCell>
                <TableCell>
                  {m.role === 'owner' ? (
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
                  )}
                </TableCell>
                <TableCell>
                  {m.role !== 'owner' && (
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
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PendingInvitesTable invites={invites} onInviteRevoked={() => {}} />
    </div>
  )
}
