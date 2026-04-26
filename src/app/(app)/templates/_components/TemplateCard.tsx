'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardFooter,
  Button,
  Badge,
  Text,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Spinner,
} from '@fluentui/react-components'
import {
  EyeRegular,
  EditRegular,
  CopyRegular,
  DeleteRegular,
} from '@fluentui/react-icons'
import { cloneTemplate, deleteTemplate } from '@/lib/actions/templates'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '200px',
  },
  cardBody: {
    flex: 1,
    padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  badgeRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalXS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
  },
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TemplateCardData {
  id: string
  name: string
  description: string | null
  industry: string | null
  version: string
  _count: {
    focusAreas: number
  }
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteTemplate(id)
      if (result.ok) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => !isPending && setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          aria-label="Delete template"
          style={{ color: tokens.colorStatusDangerForeground1 }}
        />
      </DialogTrigger>

      <DialogSurface>
        <DialogBody>
          <DialogTitle>Delete template?</DialogTitle>
          <DialogContent>
            <Text size={300}>
              Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone
              and will remove all associated focus areas, sub-sections, and deliverables.
            </Text>
            {error && (
              <Text size={200} style={{ color: tokens.colorStatusDangerForeground1, display: 'block', marginTop: '8px' }}>
                {error}
              </Text>
            )}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={isPending}>
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              style={{ backgroundColor: tokens.colorStatusDangerBackground3, color: tokens.colorNeutralForegroundOnBrand }}
              onClick={handleDelete}
              disabled={isPending}
              icon={isPending ? <Spinner size="tiny" /> : <DeleteRegular />}
            >
              Delete
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// ── Main card component ───────────────────────────────────────────────────────

export function TemplateCard({ template }: { template: TemplateCardData }) {
  const styles = useStyles()
  const router = useRouter()
  const [isCloning, startCloneTransition] = useTransition()

  function handleClone() {
    startCloneTransition(async () => {
      const result = await cloneTemplate(template.id)
      if (result.ok) {
        router.refresh()
      }
    })
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <Text size={400} weight="semibold">
            {template.name}
          </Text>
        }
        description={
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            v{template.version}
          </Text>
        }
      />

      <div className={styles.cardBody}>
        {template.description && (
          <Text size={300} className={styles.description}>
            {template.description}
          </Text>
        )}

        <div className={styles.badgeRow}>
          {template.industry && (
            <Badge appearance="tint" color="brand" size="small">
              {template.industry}
            </Badge>
          )}
          <Badge appearance="outline" color="subtle" size="small">
            {template._count.focusAreas} focus area{template._count.focusAreas !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <CardFooter className={styles.actions}>
        <Link href={`/templates/${template.id}`} style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" icon={<EyeRegular />} size="small">
            View
          </Button>
        </Link>
        <Link href={`/templates/${template.id}/edit`} style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" icon={<EditRegular />} size="small">
            Edit
          </Button>
        </Link>
        <Button
          appearance="subtle"
          icon={isCloning ? <Spinner size="tiny" /> : <CopyRegular />}
          size="small"
          onClick={handleClone}
          disabled={isCloning}
        >
          Clone
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <DeleteDialog id={template.id} name={template.name} />
        </div>
      </CardFooter>
    </Card>
  )
}
