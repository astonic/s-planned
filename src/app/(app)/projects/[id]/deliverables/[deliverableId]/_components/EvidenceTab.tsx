'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Field,
  Input,
  Select,
  Spinner,
  Divider,
} from '@fluentui/react-components'
import { DeleteRegular, CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons'
import {
  addEvidenceLink,
  addEvidenceFile,
  deleteEvidence,
  setEvidenceVerified,
  toggleCriteriaCompletion,
} from '@/lib/actions/evidence'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EvidenceRequirementItem {
  id: string
  name: string
  description: string | null
  type: string | null
  required: boolean
}

export interface EvidenceItem {
  id: string
  name: string
  type: string
  url: string
  fileSize: number | null
  uploadedBy: string
  uploadedAt: Date
  verified: boolean
  verifiedAt: Date | null
  verifiedBy: string | null
  evidenceRequirementId: string | null
}

export interface CriteriaItem {
  id: string
  description: string
  verificationMethod: string | null
  completion: {
    completed: boolean
    completedAt: Date | null
    completedBy: string | null
  } | null
}

export interface EvidenceTabProps {
  deliverableId: string
  evidenceRequirements: EvidenceRequirementItem[]
  evidenceItems: EvidenceItem[]
  criteria: CriteriaItem[]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXL },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  criteriaRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  criteriaCompleted: {
    border: `1px solid ${tokens.colorStatusSuccessBorderActive}`,
    backgroundColor: tokens.colorStatusSuccessBackground1,
  },
  criteriaText: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  criteriaMeta: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  requirementSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  requirementHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'space-between',
  },
  evidenceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  evidenceVerified: {
    border: `1px solid ${tokens.colorStatusSuccessBorderActive}`,
    backgroundColor: tokens.colorStatusSuccessBackground1,
  },
  evidenceName: { flex: 1, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold },
  evidenceMeta: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  emptyHint: { color: tokens.colorNeutralForeground3, fontStyle: 'italic', fontSize: tokens.fontSizeBase200 },
  dropZone: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
  },
  dropZoneActive: {
    border: `2px dashed ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  fileInput: { display: 'none' },
})

// ── Sub-component: EvidenceRow ────────────────────────────────────────────────

function EvidenceRow({ item, onDelete, onVerify }: {
  item: EvidenceItem
  onDelete: (id: string) => void
  onVerify: (id: string, verified: boolean) => void
}) {
  const styles = useStyles()
  const TYPE_COLORS: Record<string, 'informative' | 'brand' | 'success' | 'warning'> = {
    document: 'informative', image: 'brand', link: 'warning', sign_off: 'success',
  }
  const TYPE_LABELS: Record<string, string> = {
    document: 'Document', image: 'Image', link: 'Link', sign_off: 'Sign-off',
  }

  return (
    <div className={`${styles.evidenceRow} ${item.verified ? styles.evidenceVerified : ''}`}>
      <Badge appearance="tint" color={TYPE_COLORS[item.type] ?? 'informative'} size="small">
        {TYPE_LABELS[item.type] ?? item.type}
      </Badge>
      <div className={styles.evidenceName}>
        {item.url.startsWith('/api/files/') ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            {item.name}
          </a>
        ) : (
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            {item.name}
          </a>
        )}
      </div>
      <Text className={styles.evidenceMeta}>
        {item.uploadedBy} · {new Date(item.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </Text>
      {item.verified && (
        <Badge appearance="filled" color="success" size="small">Verified</Badge>
      )}
      {!item.verified && (
        <Button
          size="small"
          appearance="subtle"
          icon={<CheckmarkCircleRegular />}
          onClick={() => onVerify(item.id, true)}
          aria-label="Verify evidence"
        />
      )}
      {item.verified && (
        <Button
          size="small"
          appearance="subtle"
          icon={<DismissCircleRegular />}
          onClick={() => onVerify(item.id, false)}
          aria-label="Unverify evidence"
        />
      )}
      <Button
        size="small"
        appearance="subtle"
        icon={<DeleteRegular />}
        onClick={() => onDelete(item.id)}
        aria-label="Remove evidence"
      />
    </div>
  )
}

// ── Sub-component: AddEvidenceDialog ─────────────────────────────────────────

function AddEvidenceDialog({
  deliverableId,
  requirementId,
  requirementName,
  onAdded,
}: {
  deliverableId: string
  requirementId?: string
  requirementName?: string
  onAdded: () => void
}) {
  const styles = useStyles()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'link' | 'file'>('link')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function reset() {
    setName('')
    setUrl('')
    setError(null)
    setSelectedFile(null)
    setMode('link')
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file)
    if (!name) setName(file.name)
  }

  async function handleSubmit() {
    setError(null)
    if (!name.trim()) { setError('Name is required'); return }

    if (mode === 'link') {
      if (!url.trim()) { setError('URL is required'); return }
      startTransition(async () => {
        const result = await addEvidenceLink(deliverableId, {
          name,
          url,
          evidenceRequirementId: requirementId,
        })
        if (!result.ok) { setError(result.error); return }
        setOpen(false)
        reset()
        onAdded()
      })
    } else {
      if (!selectedFile) { setError('Please select a file'); return }
      // Upload via API first
      startTransition(async () => {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('deliverableId', deliverableId)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error ?? 'Upload failed')
          return
        }
        const uploaded = await res.json()
        const result = await addEvidenceFile(deliverableId, {
          name,
          url: uploaded.url,
          type: uploaded.type,
          fileSize: uploaded.fileSize,
          evidenceRequirementId: requirementId,
        })
        if (!result.ok) { setError(result.error); return }
        setOpen(false)
        reset()
        onAdded()
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => { setOpen(d.open); if (!d.open) reset() }}>
      <DialogTrigger disableButtonEnhancement>
        <Button size="small" appearance="subtle">+ Add evidence</Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            Add Evidence{requirementName ? ` — ${requirementName}` : ''}
          </DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              <Field label="Type">
                <Select value={mode} onChange={(_, d) => setMode(d.value as 'link' | 'file')}>
                  <option value="link">Link (URL)</option>
                  <option value="file">File upload</option>
                </Select>
              </Field>
              <Field label="Name" required>
                <Input value={name} onChange={(_, d) => setName(d.value)} placeholder="e.g. Test completion report" />
              </Field>
              {mode === 'link' && (
                <Field label="URL" required>
                  <Input value={url} onChange={(_, d) => setUrl(d.value)} placeholder="https://..." type="url" />
                </Field>
              )}
              {mode === 'file' && (
                <Field label="File">
                  <div
                    className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragActive(false)
                      const f = e.dataTransfer.files[0]
                      if (f) handleFileSelect(f)
                    }}
                  >
                    {selectedFile ? (
                      <Text size={200}>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</Text>
                    ) : (
                      <Text size={200}>Drop file here or click to browse</Text>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      className={styles.fileInput}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                    />
                  </div>
                </Field>
              )}
              {error && <Text style={{ color: tokens.colorStatusDangerForeground1 }} size={200}>{error}</Text>}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="subtle" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={pending}>
              {pending ? <Spinner size="tiny" /> : 'Add Evidence'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// ── Main EvidenceTab ──────────────────────────────────────────────────────────

export function EvidenceTab({
  deliverableId,
  evidenceRequirements,
  evidenceItems: initialItems,
  criteria: initialCriteria,
}: EvidenceTabProps) {
  const styles = useStyles()
  const router = useRouter()
  const [evidenceItems, setEvidenceItems] = useState(initialItems)
  const [criteria, setCriteria] = useState(initialCriteria)
  const [pending, startTransition] = useTransition()

  function refresh() {
    router.refresh()
  }

  function handleDelete(evidenceId: string) {
    startTransition(async () => {
      await deleteEvidence(evidenceId)
      setEvidenceItems((prev) => prev.filter((e) => e.id !== evidenceId))
    })
  }

  function handleVerify(evidenceId: string, verified: boolean) {
    startTransition(async () => {
      await setEvidenceVerified(evidenceId, verified)
      setEvidenceItems((prev) =>
        prev.map((e) =>
          e.id === evidenceId
            ? { ...e, verified, verifiedAt: verified ? new Date() : null, verifiedBy: verified ? 'You' : null }
            : e
        )
      )
    })
  }

  function handleCriteriaToggle(criteriaId: string, completed: boolean) {
    startTransition(async () => {
      await toggleCriteriaCompletion(deliverableId, criteriaId, completed)
      setCriteria((prev) =>
        prev.map((c) =>
          c.id === criteriaId
            ? { ...c, completion: completed ? { completed: true, completedAt: new Date(), completedBy: 'You' } : null }
            : c
        )
      )
    })
  }

  const adHocItems = evidenceItems.filter((e) => !e.evidenceRequirementId)
  const completedCriteria = criteria.filter((c) => c.completion?.completed).length

  return (
    <div className={styles.root}>
      {/* ── Acceptance Criteria ────────────────────────────────────────────── */}
      {criteria.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size={300} weight="semibold">Acceptance Criteria</Text>
            <Badge appearance="tint" color={completedCriteria === criteria.length ? 'success' : 'informative'} size="small">
              {completedCriteria} / {criteria.length} complete
            </Badge>
          </div>
          <Divider />
          {criteria.map((c) => {
            const done = c.completion?.completed ?? false
            return (
              <div key={c.id} className={`${styles.criteriaRow} ${done ? styles.criteriaCompleted : ''}`}>
                <Checkbox
                  checked={done}
                  disabled={pending}
                  onChange={(_, d) => handleCriteriaToggle(c.id, !!d.checked)}
                />
                <div className={styles.criteriaText}>
                  <Text size={200} style={{ textDecoration: done ? 'line-through' : undefined }}>
                    {c.description}
                  </Text>
                  {c.verificationMethod && (
                    <Text className={styles.criteriaMeta}>Verification: {c.verificationMethod}</Text>
                  )}
                  {done && c.completion?.completedBy && (
                    <Text className={styles.criteriaMeta}>
                      Completed by {c.completion.completedBy}
                      {c.completion.completedAt
                        ? ` on ${new Date(c.completion.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : ''}
                    </Text>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Evidence Requirements ──────────────────────────────────────────── */}
      {evidenceRequirements.length > 0 && (
        <div className={styles.section}>
          <Text size={300} weight="semibold">Evidence Requirements</Text>
          <Divider />
          {evidenceRequirements.map((req) => {
            const reqItems = evidenceItems.filter((e) => e.evidenceRequirementId === req.id)
            const hasEvidence = reqItems.length > 0
            return (
              <div key={req.id} className={styles.requirementSection}>
                <div className={styles.requirementHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Text size={200} weight="semibold">{req.name}</Text>
                    <Badge
                      appearance="tint"
                      color={req.required ? 'danger' : 'informative'}
                      size="small"
                    >
                      {req.required ? 'Required' : 'Optional'}
                    </Badge>
                    {hasEvidence && <Badge appearance="filled" color="success" size="small">Evidenced</Badge>}
                  </div>
                  <AddEvidenceDialog
                    deliverableId={deliverableId}
                    requirementId={req.id}
                    requirementName={req.name}
                    onAdded={refresh}
                  />
                </div>
                {req.description && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{req.description}</Text>
                )}
                {reqItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS }}>
                    {reqItems.map((item) => (
                      <EvidenceRow
                        key={item.id}
                        item={item}
                        onDelete={handleDelete}
                        onVerify={handleVerify}
                      />
                    ))}
                  </div>
                )}
                {reqItems.length === 0 && (
                  <Text className={styles.emptyHint}>No evidence uploaded yet.</Text>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Ad-hoc Evidence ────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text size={300} weight="semibold">Additional Evidence</Text>
          <AddEvidenceDialog deliverableId={deliverableId} onAdded={refresh} />
        </div>
        <Divider />
        {adHocItems.length === 0 && (
          <Text className={styles.emptyHint}>No additional evidence added.</Text>
        )}
        {adHocItems.map((item) => (
          <EvidenceRow
            key={item.id}
            item={item}
            onDelete={handleDelete}
            onVerify={handleVerify}
          />
        ))}
      </div>
    </div>
  )
}
