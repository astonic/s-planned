'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Textarea,
  Spinner,
  Divider,
  Avatar,
} from '@fluentui/react-components'
import { addDeliverableNote, deleteDeliverableNote } from '@/lib/actions/notes-decisions'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NoteItem {
  id: string
  text: string
  authorName: string
  createdAt: Date
}

export interface NotesTabProps {
  deliverableId: string
  initialNotes: NoteItem[]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  composeBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
  },
  composeActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
  },
  notesList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  noteRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  noteBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  noteMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  noteAuthor: { fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase200 },
  noteDate: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  noteText: { fontSize: tokens.fontSizeBase300, whiteSpace: 'pre-wrap' as const },
  emptyHint: { color: tokens.colorNeutralForeground3, fontStyle: 'italic' },
  error: { color: tokens.colorStatusDangerForeground1, fontSize: tokens.fontSizeBase200 },
})

// ── Component ─────────────────────────────────────────────────────────────────

export function NotesTab({ deliverableId, initialNotes }: NotesTabProps) {
  const styles = useStyles()
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [addPending, startAddTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    if (!draft.trim()) return
    setError(null)
    startAddTransition(async () => {
      const result = await addDeliverableNote(deliverableId, draft)
      if (!result.ok) { setError(result.error); return }
      setNotes((prev) => [result.data, ...prev])
      setDraft('')
    })
  }

  function handleDelete(noteId: string) {
    startDeleteTransition(async () => {
      const result = await deleteDeliverableNote(noteId)
      if (!result.ok) { setError(result.error); return }
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    })
  }

  return (
    <div className={styles.root}>
      {/* Compose box */}
      <div className={styles.composeBox}>
        <Text size={200} weight="semibold">Add a note</Text>
        <Textarea
          value={draft}
          onChange={(_, d) => setDraft(d.value)}
          placeholder="Write a note or comment…"
          rows={3}
          resize="vertical"
        />
        {error && <Text className={styles.error}>{error}</Text>}
        <div className={styles.composeActions}>
          <Button
            appearance="subtle"
            size="small"
            onClick={() => { setDraft(''); setError(null) }}
            disabled={!draft || addPending}
          >
            Clear
          </Button>
          <Button
            appearance="primary"
            size="small"
            onClick={handleAdd}
            disabled={!draft.trim() || addPending}
            icon={addPending ? <Spinner size="tiny" /> : undefined}
          >
            Post Note
          </Button>
        </div>
      </div>

      <Divider />

      {/* Notes list */}
      {notes.length === 0 ? (
        <Text className={styles.emptyHint}>No notes yet. Add one above.</Text>
      ) : (
        <div className={styles.notesList}>
          {notes.map((note) => (
            <div key={note.id} className={styles.noteRow}>
              <Avatar name={note.authorName} size={28} />
              <div className={styles.noteBody}>
                <div className={styles.noteMeta}>
                  <Text className={styles.noteAuthor}>{note.authorName}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Text className={styles.noteDate}>
                      {new Date(note.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                    <Button
                      size="small"
                      appearance="subtle"
                      disabled={deletePending}
                      onClick={() => handleDelete(note.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <Text className={styles.noteText}>{note.text}</Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
