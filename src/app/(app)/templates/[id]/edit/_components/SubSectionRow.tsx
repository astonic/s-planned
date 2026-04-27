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
  Badge,
} from '@fluentui/react-components'
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  CheckmarkRegular,
  DismissRegular,
  DocumentRegular,
  ChevronDownRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons'
import {
  updateSubSection,
  deleteSubSection,
  addDeliverableTemplate,
  deleteDeliverableTemplate,
} from '@/lib/actions/templates'
import type { SubSection, DeliverableTemplate } from '@/types/templates'
import { DeliverableTemplateDrawer } from './DeliverableTemplateDrawer'

const useStyles = makeStyles({
  row: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
  },
  codeLabel: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
  },
  nameLabel: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXXS,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  inlineForm: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-end',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    flexWrap: 'wrap',
  },
  panel: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    paddingLeft: tokens.spacingHorizontalXL,
  },
  deliverableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalS,
  },
  deliverableItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusSmall,
  },
  deliverableCode: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  deliverableName: {
    flex: 1,
    minWidth: 0,
  },
  deliverableActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXXS,
    flexShrink: 0,
  },
  addRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-end',
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    flexWrap: 'wrap',
  },
  confirmRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  emptyText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    display: 'block',
    marginBottom: tokens.spacingVerticalXS,
  },
})

interface Props {
  subSection: SubSection
  templateId: string
}

export function SubSectionRow({ subSection, templateId }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [expanded, setExpanded] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editCode, setEditCode] = useState(subSection.code)
  const [editName, setEditName] = useState(subSection.name)
  const [editError, setEditError] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [showAddDT, setShowAddDT] = useState(false)
  const [newDTCode, setNewDTCode] = useState('')
  const [newDTName, setNewDTName] = useState('')
  const [addDTError, setAddDTError] = useState<string | null>(null)

  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableTemplate | null>(null)

  function handleSaveEdit() {
    if (!editCode.trim() || !editName.trim()) return
    setEditError(null)
    startTransition(async () => {
      const result = await updateSubSection(subSection.id, {
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
      const result = await deleteSubSection(subSection.id)
      if (result.ok) {
        router.refresh()
      } else {
        setDeleteError(result.error)
        setConfirmDelete(false)
      }
    })
  }

  function handleShowAddDT() {
    const nextNum = String(subSection.deliverables.length + 1).padStart(3, '0')
    setNewDTCode(`${subSection.code}-${nextNum}`)
    setShowAddDT(true)
  }

  function handleAddDeliverable() {
    if (!newDTCode.trim() || !newDTName.trim()) return
    setAddDTError(null)
    startTransition(async () => {
      const result = await addDeliverableTemplate(subSection.id, {
        code: newDTCode.trim(),
        name: newDTName.trim(),
      })
      if (result.ok) {
        setNewDTCode('')
        setNewDTName('')
        setShowAddDT(false)
        router.refresh()
      } else {
        setAddDTError(result.error)
      }
    })
  }

  function handleDeleteDeliverable(deliverableId: string) {
    startTransition(async () => {
      await deleteDeliverableTemplate(deliverableId)
      router.refresh()
    })
  }

  return (
    <>
      <div className={styles.row}>
        {editing ? (
          <div className={styles.inlineForm}>
            <Field label="Code" style={{ flex: '0 0 130px' }}>
              <Input
                value={editCode}
                onChange={(_, d) => setEditCode(d.value)}
                size="small"
                autoFocus
              />
            </Field>
            <Field label="Name" style={{ flex: 1, minWidth: '180px' }}>
              <Input
                value={editName}
                onChange={(_, d) => setEditName(d.value)}
                size="small"
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
          <div className={styles.header}>
            <Button
              appearance="transparent"
              size="small"
              icon={expanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            />
            <span className={styles.codeLabel}>{subSection.code}</span>
            <Text size={200} weight="medium" className={styles.nameLabel}>
              {subSection.name}
            </Text>
            <Badge appearance="outline" size="small" color="subtle">
              {subSection.deliverables.length}
            </Badge>
            <div className={styles.headerActions}>
              {confirmDelete ? (
                <div className={styles.confirmRow}>
                  <Text size={100} style={{ color: tokens.colorStatusDangerForeground1 }}>
                    Delete?
                  </Text>
                  <Button
                    size="small"
                    appearance="primary"
                    style={{ backgroundColor: tokens.colorStatusDangerBackground3 }}
                    icon={isPending ? <Spinner size="tiny" /> : undefined}
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    Yes
                  </Button>
                  <Button appearance="subtle" size="small" onClick={() => setConfirmDelete(false)}>
                    No
                  </Button>
                  {deleteError && <span className={styles.errorText}>{deleteError}</span>}
                </div>
              ) : (
                <>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<EditRegular />}
                    onClick={() => {
                      setEditing(true)
                      setEditCode(subSection.code)
                      setEditName(subSection.name)
                    }}
                    aria-label="Edit sub-section"
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete sub-section"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {expanded && (
          <div className={styles.panel}>
            {subSection.deliverables.length === 0 ? (
              <span className={styles.emptyText}>No deliverable templates yet.</span>
            ) : (
              <div className={styles.deliverableList}>
                {subSection.deliverables.map((dt) => (
                  <div key={dt.id} className={styles.deliverableItem}>
                    <DocumentRegular
                      fontSize={14}
                      style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}
                    />
                    <span className={styles.deliverableCode}>{dt.code}</span>
                    <Text size={100} className={styles.deliverableName}>
                      {dt.name}
                    </Text>
                    <div className={styles.deliverableActions}>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<EditRegular />}
                        onClick={() => setSelectedDeliverable(dt)}
                        aria-label="Edit deliverable"
                      />
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={isPending ? <Spinner size="tiny" /> : <DeleteRegular />}
                        onClick={() => handleDeleteDeliverable(dt.id)}
                        disabled={isPending}
                        aria-label="Delete deliverable"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddDT ? (
              <div className={styles.addRow}>
                <Field label="Code" style={{ flex: '0 0 120px' }}>
                  <Input
                    value={newDTCode}
                    onChange={(_, d) => setNewDTCode(d.value)}
                    placeholder="e.g. DT-01"
                    size="small"
                    autoFocus
                  />
                </Field>
                <Field label="Name" style={{ flex: 1, minWidth: '160px' }}>
                  <Input
                    value={newDTName}
                    onChange={(_, d) => setNewDTName(d.value)}
                    placeholder="Deliverable name"
                    size="small"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDeliverable()}
                  />
                </Field>
                <Button
                  appearance="primary"
                  size="small"
                  onClick={handleAddDeliverable}
                  disabled={isPending || !newDTCode.trim() || !newDTName.trim()}
                  icon={isPending ? <Spinner size="tiny" /> : undefined}
                >
                  Add
                </Button>
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => {
                    setShowAddDT(false)
                    setAddDTError(null)
                  }}
                >
                  Cancel
                </Button>
                {addDTError && <span className={styles.errorText}>{addDTError}</span>}
              </div>
            ) : (
              <Button
                appearance="subtle"
                size="small"
                icon={<AddRegular />}
                onClick={handleShowAddDT}
              >
                Add Deliverable
              </Button>
            )}
          </div>
        )}
      </div>

      {selectedDeliverable && (
        <DeliverableTemplateDrawer
          deliverable={selectedDeliverable}
          templateId={templateId}
          subSectionCode={subSection.code}
          deliverableCount={subSection.deliverables.length}
          open={true}
          onClose={() => setSelectedDeliverable(null)}
        />
      )}
    </>
  )
}
