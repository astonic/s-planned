'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { makeStyles, tokens, Button, Text } from '@fluentui/react-components'
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalM} 0`,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  info: {
    color: tokens.colorNeutralForeground3,
  },
})

interface Props {
  page: number
  pageSize: number
  total: number
}

export function PaginationBar({ page, pageSize, total }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = Math.min((page - 1) * pageSize + 1, total)
  const end = Math.min(page * pageSize, total)

  function navigate(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (total <= pageSize) return null

  return (
    <div className={styles.root}>
      <Text size={200} className={styles.info}>
        {total === 0 ? 'No results' : `Showing ${start}–${end} of ${total}`}
      </Text>
      <div className={styles.controls}>
        <Button
          size="small"
          appearance="subtle"
          icon={<ChevronLeftRegular />}
          disabled={page <= 1}
          onClick={() => navigate(page - 1)}
          aria-label="Previous page"
        />
        <Text size={200}>
          Page {page} of {totalPages}
        </Text>
        <Button
          size="small"
          appearance="subtle"
          icon={<ChevronRightRegular />}
          disabled={page >= totalPages}
          onClick={() => navigate(page + 1)}
          aria-label="Next page"
        />
      </div>
    </div>
  )
}
