'use client'

import { makeStyles, tokens, Text, Button } from '@fluentui/react-components'
import { NavigationRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minHeight: '64px',
    padding: '0 var(--sp-space-4)',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: 'var(--sp-shadow-1)',
    position: 'sticky',
    top: 'calc(var(--sp-space-4) * -1)',
    zIndex: 100,
    borderRadius: 'var(--sp-radius-lg)',
    '@media (min-width: 640px)': {
      padding: '0 var(--sp-space-5)',
      top: 'calc(var(--sp-space-5) * -1)',
    },
    '@media (min-width: 1024px)': {
      padding: '0 var(--sp-space-6)',
      top: 'calc(var(--sp-space-6) * -1)',
    },
  },
  title: { flex: 1 },
  titleText: {
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: 1.2,
    color: tokens.colorNeutralForeground1,
    '@media (min-width: 640px)': {
      fontSize: '20px',
    },
    '@media (min-width: 1024px)': {
      fontSize: '24px',
    },
  },
  breadcrumb: {
    display: 'none',
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    '@media (min-width: 640px)': {
      display: 'block',
    },
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
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
          <Text className={styles.breadcrumb}>
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                {b.href ? <a href={b.href} style={{ color: 'inherit', textDecoration: 'none' }}>{b.label}</a> : b.label}
              </span>
            ))}
          </Text>
        )}
        <Text className={styles.titleText}>{title}</Text>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
