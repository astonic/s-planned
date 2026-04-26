'use client'

import { makeStyles, tokens, Input } from '@fluentui/react-components'
import { SearchRegular } from '@fluentui/react-icons'
import type { ReactNode } from 'react'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
    flexWrap: 'wrap',
  },
  search: { width: '260px', minWidth: '140px' },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    flex: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginLeft: 'auto',
  },
})

interface SpGridToolbarProps {
  search: string
  onSearch: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  actions?: ReactNode
}

export function SpGridToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search...',
  filters,
  actions,
}: SpGridToolbarProps) {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <Input
        className={styles.search}
        placeholder={searchPlaceholder}
        contentBefore={<SearchRegular />}
        value={search}
        onChange={(_, d) => onSearch(d.value)}
      />
      {filters && <div className={styles.filters}>{filters}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
