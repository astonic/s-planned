'use client'

import Link from 'next/link'
import { Button } from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'

export function NewProjectButton() {
  return (
    <Link href="/projects/new" style={{ textDecoration: 'none' }}>
      <Button appearance="primary" icon={<AddRegular />}>New Project</Button>
    </Link>
  )
}
