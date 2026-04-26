'use client'

import { makeStyles, tokens, Text, Button } from '@fluentui/react-components'
import { NavigationRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minHeight: '56px',
    padding: `0 ${tokens.spacingHorizontalXXL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  title: { flex: 1 },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' },
})

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode
  onMenuClick?: () => void
}

export function PageHeader({ title, breadcrumb, actions, onMenuClick }: PageHeaderProps) {
  const styles = useStyles()

  return (
    <header className={styles.header}>
      {onMenuClick && (
        <Button
          appearance="subtle"
          icon={<NavigationRegular />}
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        />
      )}
      <div className={styles.title}>
        {breadcrumb && breadcrumb.length > 0 && (
          <Text size={100} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                {b.href ? <a href={b.href} style={{ color: 'inherit', textDecoration: 'none' }}>{b.label}</a> : b.label}
              </span>
            ))}
          </Text>
        )}
        <Text size={500} weight="semibold">{title}</Text>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
