'use client'

import { useRef, useState, useTransition } from 'react'
import { makeStyles, tokens, Button, Avatar, Spinner, Text } from '@fluentui/react-components'
import { ArrowUploadRegular, DeleteRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  success: {
    color: tokens.colorStatusSuccessForeground1,
    fontSize: tokens.fontSizeBase200,
  },
})

interface Props {
  orgName: string
  currentLogoUrl?: string | null
}

export function OrgLogoUpload({ orgName, currentLogoUrl }: Props) {
  const styles = useStyles()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl ?? null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [uploading, startUpload] = useTransition()
  const [removing, startRemove] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ ok: false, text: 'Image must be under 2 MB' })
      return
    }
    if (!file.type.startsWith('image/')) {
      setMessage({ ok: false, text: 'Only image files allowed' })
      return
    }

    // Local preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setMessage(null)

    startUpload(async () => {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/upload/logo', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) {
        setPreviewUrl(currentLogoUrl ?? null)
        setMessage({ ok: false, text: json.error ?? 'Upload failed' })
      } else {
        setPreviewUrl(json.url)
        setMessage({ ok: true, text: 'Logo updated.' })
      }
    })
  }

  function handleRemove() {
    setMessage(null)
    startRemove(async () => {
      const res = await fetch('/api/upload/logo', { method: 'DELETE' })
      if (res.ok) {
        setPreviewUrl(null)
        setMessage({ ok: true, text: 'Logo removed.' })
        if (inputRef.current) inputRef.current.value = ''
      } else {
        const json = await res.json()
        setMessage({ ok: false, text: json.error ?? 'Failed to remove logo' })
      }
    })
  }

  return (
    <div className={styles.root}>
      <Text weight="semibold" size={300}>Organization Logo</Text>
      <div className={styles.row}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${orgName} logo`}
            style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8, border: `1px solid ${tokens.colorNeutralStroke1}` }}
          />
        ) : (
          <Avatar name={orgName} size={72} color="colorful" />
        )}
        <div className={styles.actions}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            aria-label="Upload logo"
          />
          <Button
            appearance="outline"
            icon={uploading ? <Spinner size="tiny" /> : <ArrowUploadRegular />}
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
            size="small"
          >
            {uploading ? 'Uploading…' : 'Upload Logo'}
          </Button>
          {previewUrl && (
            <Button
              appearance="subtle"
              icon={removing ? <Spinner size="tiny" /> : <DeleteRegular />}
              disabled={uploading || removing}
              onClick={handleRemove}
              size="small"
            >
              Remove
            </Button>
          )}
          <Text className={styles.hint}>JPEG, PNG, WebP or GIF · max 2 MB</Text>
        </div>
      </div>
      {message && (
        <Text className={message.ok ? styles.success : styles.error}>{message.text}</Text>
      )}
    </div>
  )
}
