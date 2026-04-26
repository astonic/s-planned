'use client'

import Link from 'next/link'
import { Button } from '@fluentui/react-components'
import { EditRegular, CopyRegular } from '@fluentui/react-icons'

export function TemplateActions({ templateId }: { templateId: string }) {
  return (
    <>
      <Link href={`/templates/${templateId}/edit`} style={{ textDecoration: 'none' }}>
        <Button appearance="secondary" icon={<EditRegular />}>Edit</Button>
      </Link>
      <Link href={`/templates/${templateId}/clone`} style={{ textDecoration: 'none' }}>
        <Button appearance="secondary" icon={<CopyRegular />}>Clone</Button>
      </Link>
      <Link href="/templates" style={{ textDecoration: 'none' }}>
        <Button appearance="subtle">Back</Button>
      </Link>
    </>
  )
}
