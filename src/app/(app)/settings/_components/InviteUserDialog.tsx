'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles, tokens, Text, Input, Select, Checkbox, Button, Field, Dialog,
  DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogContent,
  DialogActions, Spinner,
} from '@fluentui/react-components'
import { PersonAddRegular } from '@fluentui/react-icons'
import { createInvite } from '@/lib/actions/invites'

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  row: { display: 'flex', gap: tokens.spacingHorizontalM },
})

interface Props {
  onInviteSent: () => void
}

export function InviteUserDialog({ onInviteSent }: Props) {
  const styles = useStyles()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [createPerson, setCreatePerson] = useState(false)
  const [personName, setPersonName] = useState('')
  const [personType, setPersonType] = useState('internal')
  const [personRole, setPersonRole] = useState('')
  const [personCompany, setPersonCompany] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    if (!email.trim()) { setError('Email is required'); return }

    startTransition(async () => {
      const res = await createInvite({
        email: email.trim(),
        role: role as 'admin' | 'member' | 'viewer',
        createPerson: createPerson && personName.trim()
          ? {
              name: personName,
              type: personType as 'internal' | 'contractor' | 'consultant',
              role: personRole || undefined,
              company: personCompany || undefined,
            }
          : undefined,
      })

      if (!res.ok) { setError(res.error); return }

      setOpen(false)
      setEmail('')
      setRole('member')
      setCreatePerson(false)
      setPersonName('')
      setPersonType('internal')
      setPersonRole('')
      setPersonCompany('')
      onInviteSent()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button icon={<PersonAddRegular />} appearance="primary">Invite User</Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Invite User</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <Field label="Email" required>
                <Input value={email} onChange={(_, d) => setEmail(d.value)} placeholder="colleague@example.com" />
              </Field>
              <Field label="Role" required>
                <Select value={role} onChange={(_, d) => setRole(d.value)}>
                  <option value="admin">Admin (full access)</option>
                  <option value="member">Member (create &amp; edit)</option>
                  <option value="viewer">Viewer (read-only)</option>
                </Select>
              </Field>

              <Checkbox
                label="Create Person record for this user"
                checked={createPerson}
                onChange={(_, d) => setCreatePerson(d.checked === true)}
              />

              {createPerson && (
                <>
                  <Field label="Name" required>
                    <Input value={personName} onChange={(_, d) => setPersonName(d.value)} placeholder="John Doe" />
                  </Field>
                  <div className={styles.row}>
                    <Field label="Type" style={{ flex: 1 }}>
                      <Select value={personType} onChange={(_, d) => setPersonType(d.value)}>
                        <option value="internal">Internal</option>
                        <option value="contractor">Contractor</option>
                        <option value="consultant">Consultant</option>
                      </Select>
                    </Field>
                    <Field label="Role (optional)" style={{ flex: 1 }}>
                      <Input value={personRole} onChange={(_, d) => setPersonRole(d.value)} placeholder="e.g. Lead Architect" />
                    </Field>
                  </div>
                  <Field label="Company (optional)">
                    <Input value={personCompany} onChange={(_, d) => setPersonCompany(d.value)} placeholder="e.g. Acme Corp" />
                  </Field>
                </>
              )}

              {error && (
                <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>{error}</Text>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="subtle" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={pending || !email.trim()}
            >
              {pending ? <Spinner size="tiny" /> : 'Send Invite'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
