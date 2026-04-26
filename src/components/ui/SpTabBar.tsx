'use client'

import { makeStyles, tokens, TabList, Tab } from '@fluentui/react-components'
import type { ReactNode } from 'react'
import type { SelectTabData, SelectTabEvent } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'stretch',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingLeft: 'var(--sp-space-6)',
    paddingRight: 'var(--sp-space-6)',
    minHeight: '44px',
  },
  tabs: { flex: 1, display: 'flex', alignItems: 'stretch' },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    flexShrink: 0,
  },
})

export interface SpTabItem<T extends string = string> {
  value: T
  label: string
}

interface SpTabBarProps<T extends string = string> {
  tabs: SpTabItem<T>[]
  selectedValue: T
  onTabSelect: (e: SelectTabEvent, data: SelectTabData) => void
  right?: ReactNode
}

export function SpTabBar<T extends string = string>({
  tabs,
  selectedValue,
  onTabSelect,
  right,
}: SpTabBarProps<T>) {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <div className={styles.tabs}>
        <TabList selectedValue={selectedValue} onTabSelect={onTabSelect}>
          {tabs.map(({ value, label }) => (
            <Tab key={value} value={value}>
              {label}
            </Tab>
          ))}
        </TabList>
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </div>
  )
}
