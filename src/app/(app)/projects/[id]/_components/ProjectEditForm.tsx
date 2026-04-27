'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { DeleteRegular, SaveRegular } from '@fluentui/react-icons'
import { deleteProject, updateProject } from '@/lib/actions/projects'
import type { ProjectStatus } from '@prisma/client'

interface ProjectEditFormProps {
  project: {
    id: string
    name: string
    description: string | null
    status: ProjectStatus
    startDate: Date | null
    targetDate: Date | null
  }
}

const useStyles = makeStyles({
  form: {
    maxWidth: '720px',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  dateRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
  },
  primaryActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
})

function formatDateInput(value: Date | null) {
  if (!value) return ''
  return value.toISOString().slice(0, 10)
}

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  const styles = useStyles()
  const router = useRouter()
  const [isSaving, startSaveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [startDate, setStartDate] = useState(formatDateInput(project.startDate))
  const [targetDate, setTargetDate] = useState(formatDateInput(project.targetDate))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    startSaveTransition(async () => {
      const result = await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setSuccess(true)
      router.refresh()
    })
  }

  function handleDelete() {
    setError(null)
    startDeleteTransition(async () => {
      const result = await deleteProject(project.id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDeleteDialogOpen(false)
      router.push('/projects')
      router.refresh()
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {success && (
        <MessageBar intent="success">
          <MessageBarBody>Project updated.</MessageBarBody>
        </MessageBar>
      )}

      <Field label="Project name" required>
        <Input value={name} onChange={(_, data) => setName(data.value)} />
      </Field>

      <Field label="Description">
        <Textarea
          rows={4}
          value={description}
          onChange={(_, data) => setDescription(data.value)}
        />
      </Field>

      <Field label="Status">
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectStatus)}
        >
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>

      <div className={styles.dateRow}>
        <Field label="Start date">
          <Input
            type="date"
            value={startDate}
            onChange={(_, data) => setStartDate(data.value)}
          />
        </Field>
        <Field label="Target date">
          <Input
            type="date"
            value={targetDate}
            onChange={(_, data) => setTargetDate(data.value)}
          />
        </Field>
      </div>

      <div className={styles.actions}>
        <Button
          appearance="secondary"
          icon={<DeleteRegular />}
          disabled={isSaving || isDeleting}
          onClick={() => setDeleteDialogOpen(true)}
          type="button"
        >
          Delete project
        </Button>
        <div className={styles.primaryActions}>
          <Button appearance="secondary" type="button" onClick={() => router.push(`/projects/${project.id}`)}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={isSaving ? <Spinner size="tiny" /> : <SaveRegular />}
            disabled={isSaving || isDeleting || !name.trim()}
            type="submit"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>

      {isDeleting && <Text size={200}>Deleting project...</Text>}

      <Dialog open={deleteDialogOpen} onOpenChange={(_, data) => setDeleteDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete project</DialogTitle>
            <DialogContent>
              Delete &quot;{project.name}&quot;? This cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" disabled={isDeleting} onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" disabled={isDeleting} icon={isDeleting ? <Spinner size="tiny" /> : <DeleteRegular />} onClick={handleDelete}>
                Delete project
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </form>
  )
}
