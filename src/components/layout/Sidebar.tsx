'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { makeStyles, tokens, Avatar, Text, Tooltip, Button } from '@fluentui/react-components'
import {
  FolderRegular,
  PeopleRegular,
  DataBarVerticalRegular,
  DocumentRegular,
  AppsListRegular,
  SettingsRegular,
  ChevronDoubleLeftRegular,
  ChevronDoubleRightRegular,
} from '@fluentui/react-icons'
import { useSidebar } from './SidebarContext'
import { OrganizationSwitcher } from './OrganizationSwitcher'
import { BrandLockup } from '@/components/ui/BrandLockup'

const useStyles = makeStyles({
  sidebar: {
    display: 'none',
    flexDirection: 'column',
    minHeight: '100dvh',
    backgroundColor: '#0F1E3D',
    borderRight: '0.5px solid rgba(59,130,246,0.18)',
    boxShadow: 'var(--sp-shadow-2)',
    transition: 'width var(--sp-dur-slow) var(--sp-ease)',
    overflowX: 'hidden',
    '@media (min-width: 640px)': {
      display: 'flex',
    },
  },
  expanded: {
    width: '56px',
    '@media (min-width: 1024px)': {
      width: '220px',
    },
  },
  collapsed: { width: '56px' },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: '12px 14px',
    minHeight: '64px',
    justifyContent: 'center',
    '@media (min-width: 1024px)': {
      justifyContent: 'flex-start',
    },
  },
  logoImageChip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--sp-radius-md)',
    padding: '5px 9px',
    boxShadow: '0 8px 24px rgba(23,87,194,0.18), 0 4px 8px rgba(23,87,194,0.10)',
    flexShrink: 0,
  },
  logoIconChip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--sp-radius-md)',
    boxShadow: '0 8px 24px rgba(23,87,194,0.18), 0 4px 8px rgba(23,87,194,0.10)',
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: '0 8px',
    overflowY: 'auto',
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    minHeight: '44px',
    padding: '9px 12px',
    borderRadius: 'var(--sp-radius-md)',
    textDecoration: 'none',
    color: '#8E9BAF',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    ':hover': {
      backgroundColor: 'rgba(239,245,253,0.10)',
      color: '#CCDFF8',
      transform: 'translateY(-1px)',
    },
    '@media (min-width: 1024px)': {
      justifyContent: 'flex-start',
      padding: '9px 14px',
    },
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(239,245,253,0.16), rgba(239,245,253,0.08))',
    color: '#FFFFFF',
    boxShadow: 'var(--sp-shadow-1)',
    ':hover': {
      background: 'linear-gradient(135deg, rgba(239,245,253,0.20), rgba(239,245,253,0.10))',
    },
    '::before': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: 'var(--sp-radius-pill)',
      background: 'var(--sp-grad-primary)',
      boxShadow: 'var(--sp-glow-blue)',
      position: 'absolute',
      left: '6px',
      '@media (min-width: 1024px)': {
        position: 'static',
      },
    },
  },
  navLabel: {
    display: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media (min-width: 1024px)': {
      display: 'inline',
    },
  },
  divider: {
    height: '0.5px',
    backgroundColor: 'rgba(214,220,232,0.22)',
    margin: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
    padding: tokens.spacingHorizontalM,
    borderTop: '0.5px solid rgba(214,220,232,0.18)',
    overflow: 'hidden',
    minHeight: '64px',
    '@media (min-width: 1024px)': {
      justifyContent: 'flex-start',
    },
  },
  footerText: {
    display: 'none',
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
    '@media (min-width: 1024px)': {
      display: 'block',
    },
  },
  userName: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  orgName: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  collapseBtn: {
    position: 'absolute',
    bottom: '80px',
    right: '-12px',
    zIndex: 10,
    borderRadius: 'var(--sp-radius-pill)',
    minWidth: '24px',
    height: '24px',
    padding: '0',
    border: '1.5px solid var(--sp-blue-100)',
    backgroundColor: 'var(--sp-surface)',
    boxShadow: 'var(--sp-shadow-2)',
    display: 'none',
    '@media (min-width: 1024px)': {
      display: 'inline-flex',
    },
  },
})

const NAV_ITEMS = [
  { label: 'Projects', href: '/projects', icon: FolderRegular },
  { label: 'Stakeholders', href: '/stakeholders', icon: PeopleRegular },
  { label: 'Analytics', href: '/analytics', icon: DataBarVerticalRegular },
  { label: 'Reports', href: '/reports', icon: DocumentRegular },
  { label: 'Templates', href: '/templates', icon: AppsListRegular },
]

interface SidebarProps {
  userName: string
  orgName: string
  orgSlug: string
  orgLogoUrl?: string | null
  avatarUrl?: string | null
}

export function Sidebar({ userName, orgName, orgSlug, orgLogoUrl, avatarUrl }: SidebarProps) {
  const styles = useStyles()
  const pathname = usePathname()
  const { state, toggle } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const showExpandedLabels = !isCollapsed

  return (
    <div
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded}`}
      style={{ position: 'relative' }}
    >
      <div className={styles.logo}>
        {showExpandedLabels ? (
          <Link href="/" className={styles.logoImageChip} aria-label="S-Planned dashboard">
            <BrandLockup markSize={38} priority />
          </Link>
        ) : (
          <Link href="/" className={styles.logoIconChip} aria-label="S-Planned dashboard">
            <Image src="/files/s-planned-favicon-32.svg" alt="S-Planned" width={32} height={32} priority />
          </Link>
        )}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const item = (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <Icon style={{ flexShrink: 0, fontSize: 20 }} />
              {showExpandedLabels && <Text size={200} className={styles.navLabel}>{label}</Text>}
            </Link>
          )
          return isCollapsed ? (
            <Tooltip key={href} content={label} relationship="label" positioning="after">
              {item}
            </Tooltip>
          ) : item
        })}

        <div className={styles.divider} />

        {(() => {
          const isActive = pathname.startsWith('/settings')
          const item = (
            <Link
              href="/settings"
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <SettingsRegular style={{ flexShrink: 0, fontSize: 20 }} />
              {showExpandedLabels && <Text size={200} className={styles.navLabel}>Settings</Text>}
            </Link>
          )
          return isCollapsed ? (
            <Tooltip content="Settings" relationship="label" positioning="after">
              {item}
            </Tooltip>
          ) : item
        })()}

      </nav>

      <Button
        className={styles.collapseBtn}
        size="small"
        appearance="subtle"
        icon={isCollapsed ? <ChevronDoubleRightRegular /> : <ChevronDoubleLeftRegular />}
        onClick={toggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      />

      <div className={styles.footer}>
        <Avatar
          name={userName}
          image={avatarUrl ? { src: avatarUrl } : undefined}
          size={32}
          style={{ flexShrink: 0 }}
        />
        {showExpandedLabels && (
          <div className={styles.footerText}>
            <Text size={200} weight="semibold" className={styles.userName}>{userName}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, marginTop: '4px' }}>
              {orgLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={orgLogoUrl}
                  alt={orgName}
                  style={{ width: 16, height: 16, objectFit: 'contain' }}
                />
              )}
              <OrganizationSwitcher currentOrgName={orgName} currentOrgSlug={orgSlug} currentOrgLogoUrl={orgLogoUrl} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
