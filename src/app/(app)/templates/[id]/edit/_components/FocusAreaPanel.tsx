'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Field,
  Spinner,
  Text,
  Divider,
} from '@fluentui/react-components'
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  CheckmarkRegular,
  DismissRegular,
} from '@fluentui/react-icons'
import { updateFocusArea, deleteFocusArea, addSubSection } from '@/lib/actions/templates'
import type { FocusArea } from '@/types/templates'
import { SubSectionRow } from './SubSectionRow'

const useStyles = makeStyles({
  panel: {
    padding: `0 ${tokens.spacingHorizontalL} ${tokens.spacingVerticalM}`,
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalS,
  },
  inlineForm: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-end',
    marginBottom: tokens.spacingVerticalS,
    flexWrap: 'wrap',
  },
  addRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-end',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalS,
    flexWrap: 'wrap',
  },
  subSectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalM,
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  emptyText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    display: 'block',
    marginBottom: tokens.spacingVerticalS,
  },
  confirmRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
})

interface Props {
  focusArea: FocusArea
  templateId: string
}

export function FocusAreaPanel({ focusArea, templateId }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Edit focus area
  const [editing, setEditing] = useState(false)
  const [editCode, setEditCode] = useState(focusArea.code)
  const [editName, setEditName] = useState(focusArea.name)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Add sub-section
  const [showAddSS, setShowAddSS] = useState(false)
  const [newSSCode, setNewSSCode] = useState('')
  const [newSSName, setNewSSName] = useState('')
  const [addSSError, setAddSSError] = useState<string | null>(null)

  function handleSaveEdit() {
    if (!editCode.trim() || !editName.trim()) return
    setEditError(null)
    startTransition(async () => {
      const result = await updateFocusArea(focusArea.id, {
        code: editCode.trim(),
        name: editName.trim(),
      })
      if (result.ok) {
        setEditing(false)
        router.refresh()
      } else {
        setEditError(result.error)
      }
    })
  }

  function handleDelete() {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteFocusArea(focusArea.id)
      if (result.ok) {
        router.refresh()
      } else {
        setDeleteError(result.error)
        setConfirmDelete(false)
      }
    })
  }

  function handleAddSubSection() {
    if (!newSSCode.trim() || !newSSName.trim()) return
    setAddSSError(null)
    startTransition(async () => {
      const result = await addSubSection(focusArea.id, {
        code: newSSCode.trim(),
        name: newSSName.trim(),
      })
      if (result.ok) {
        setNewSSCode('')
        setNewSSName('')
        setShowAddSS(false)
        router.refresh()
      } else {
        setAddSSError(result.error)
      }
    })
  }

  return (
    <div className={styles.panel}>
      {/* Edit / Delete controls */}
      {editing ? (
        <div className={styles.inlineForm}>
          <Field label="Code" style={{ flex: '0 0 130px' }}>
            <Input
              value={editCode}
              onChange={(_, d) => setEditCode(d.value)}
              autoFocus
            />
          </Field>
          <Field label="Name" style={{ flex: 1, minWidth: '200px' }}>
            <Input
              value={editName}
              onChange={(_, d) => setEditName(d.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
          </Field>
          <Button
            appearance="primary"
            size="small"
            icon={isPending ? <Spinner size="tiny" /> : <CheckmarkRegular />}
            onClick={handleSaveEdit}
            disabled={isPending || !editCode.trim() || !editName.trim()}
          >
            Save
          </Button>
          <Button
            appearance="subtle"
            size="small"
            icon={<DismissRegular />}
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
          {editError && <span className={styles.errorText}>{editError}</span>}
        </div>
      ) : (
        <div className={styles.controlsRow}>
          <Button
            appearance="subtle"
            size="small"
            icon={<EditRegular />}
            onClick={() => {
              setEditing(true)
              setEditCode(focusArea.code)
              setEditName(focusArea.name)
            }}
          >
            Edit
          </Button>
          {confirmDelete ? (
            <div className={styles.confirmRow}>
              <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
                Delete this focus area and all its contents?
              </Text>
              <Button
                size="small"
                appearance="primary"
                style={{ backgroundColor: tokens.colorStatusDangerBackground3 }}
                icon={isPending ? <Spinner size="tiny" /> : undefined}
                onClick={handleDelete}
                disabled={isPending}
              >
                Confirm delete
              </Button>
              <Button
                appearance="subtle"
                size="small"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              {deleteError && <span className={styles.errorText}>{deleteError}</span>}
            </div>
          ) : (
            <Button
              appearance="subtle"
              size="small"
              icon={<DeleteRegular />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      )}

      <Divider style={{ margin: `${tokens.spacingVerticalS} 0 ${tokens.spacingVerticalM}` }} />

      {/* Sub-sections list */}
      {focusArea.subSections.length === 0 ? (
        <span className={styles.emptyText}>No sub-sections yet.</span>
      ) : (
        <div className={styles.subSectionList}>
          {focusArea.subSections.map((ss) => (
            <SubSectionRow key={ss.id} subSection={ss} templateId={templateId} />
          ))}
        </div>
      )}

      {/* Add sub-section form */}
      {showAddSS ? (
        <div className={styles.addRow}>
          <Field label="Code" style={{ flex: '0 0 130px' }}>
            <Input
              value={newSSCode}
              onChange={(_, d) => setNewSSCode(d.value)}
              placeholder="e.g. SS-01"
              autoFocus
            />
          </Field>
          <Field label="Name" style={{ flex: 1, minWidth: '200px' }}>
            <Input
              value={newSSName}
              onChange={(_, d) => setNewSSName(d.value)}
              placeholder="Sub-section name"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubSection()}
            />
          </Field>
          <Button
            appearance="primary"
            size="small"
            onClick={handleAddSubSection}
            disabled={isPending || !newSSCode.trim() || !newSSName.trim()}
            icon={isPending ? <Spinner size="tiny" /> : undefined}
          >
            Add
          </Button>
          <Button
            appearance="subtle"
            size="small"
            onClick={() => {
              setShowAddSS(false)
              setAddSSError(null)
            }}
          >
            Cancel
          </Button>
          {addSSError && <span className={styles.errorText}>{addSSError}</span>}
        </div>
      ) : (
        <Button
          appearance="subtle"
          size="small"
          icon={<AddRegular />}
          onClick={() => setShowAddSS(true)}
        >
          Add Sub-Section
        </Button>
      )}
    </div>
  )
}
