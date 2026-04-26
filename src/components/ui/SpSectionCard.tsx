'use client'

import { makeStyles, tokens, Text } from '@fluentui/react-components'
import type { ReactNode } from 'react'

const useStyles = makeStyles({
  root: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    gap: tokens.spacingHorizontalL,
    minHeight: '48px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  count: { color: tokens.colorNeutralForeground3 },
  empty: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalL}`,
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
})

interface SpSectionCardProps {
  title: string
  count?: number
  countLabel?: string
  actions?: ReactNode
  emptyMessage?: string
  children?: ReactNode
  isEmpty?: boolean
}

export function SpSectionCard({
  title,
  count,
  countLabel,
  actions,
  emptyMessage,
  children,
  isEmpty = false,
}: SpSectionCardProps) {
  const styles = useStyles()
  const label =
    count !== undefined
      ? countLabel
        ? `${count} ${countLabel}${count !== 1 ? 's' : ''}`
        : `${count}`
      : undefined

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Text size={300} weight="semibold">
            {title}
          </Text>
          {label !== undefined && (
            <Text size={200} className={styles.count}>
              {label}
            </Text>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {isEmpty && emptyMessage ? (
        <div className={styles.empty}>
          <Text size={200}>{emptyMessage}</Text>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
