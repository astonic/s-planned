'use client'

import { FormEvent, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Spinner,
  Text,
  tokens,
} from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular, DocumentTableRegular } from '@fluentui/react-icons'
import { importTemplateFromExcel } from '@/lib/actions/templates'

export function TemplateImportDialog() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError('Choose an Excel file to upload.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const result = await importTemplateFromExcel(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }

      setMessage(`Imported ${result.data.name}`)
      setOpen(false)
      router.push(`/templates/${result.data.id}/edit`)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => !isPending && setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="secondary" icon={<ArrowUploadRegular />}>
          Import Excel
        </Button>
      </DialogTrigger>

      <DialogSurface style={{ maxWidth: 540, width: '100%' }}>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>Import Template</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, marginTop: tokens.spacingVerticalM }}>
                <Button
                  as="a"
                  href="/api/templates/sample-format"
                  download
                  appearance="secondary"
                  icon={<ArrowDownloadRegular />}
                >
                  Download Sample Excel
                </Button>

                <Field label="Template Excel file" required>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx"
                    disabled={isPending}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--sp-radius-md)',
                      border: '1px solid var(--sp-gray-200)',
                      background: 'var(--sp-surface)',
                      color: 'var(--sp-page-fg)',
                    }}
                  />
                </Field>

                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Use the Template and Deliverables sheets from the sample workbook.
                </Text>

                {message && (
                  <Text size={200} style={{ color: tokens.colorStatusSuccessForeground1 }}>
                    {message}
                  </Text>
                )}
                {error && (
                  <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
                    {error}
                  </Text>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" disabled={isPending}>
                  Cancel
                </Button>
              </DialogTrigger>
              <Button
                type="submit"
                appearance="primary"
                disabled={isPending}
                icon={isPending ? <Spinner size="tiny" /> : <DocumentTableRegular />}
              >
                Create Template
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
