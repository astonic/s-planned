'use client'

import Link from 'next/link'
import { Button } from '@fluentui/react-components'
import { EditRegular, OpenRegular } from '@fluentui/react-icons'

export function ProjectActions({ projectId }: { projectId: string }) {
  return (
    <>
      <Link href={`/projects/${projectId}/edit`} style={{ textDecoration: 'none' }}>
        <Button appearance="secondary" icon={<EditRegular />}>Edit</Button>
      </Link>
      <Link href={`/projects/${projectId}/workspace`} style={{ textDecoration: 'none' }}>
        <Button appearance="primary" icon={<OpenRegular />}>Workspace</Button>
      </Link>
    </>
  )
}
