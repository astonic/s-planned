'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { makeStyles, tokens, Avatar, Text, Tooltip, Button } from '@fluentui/react-components'
import {
  GridRegular,
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

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'width 200ms ease',
    overflowX: 'hidden',
  },
  expanded: { width: '240px' },
  collapsed: { width: '48px' },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalM}`,
    minHeight: '56px',
  },
  logoText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: `0 ${tokens.spacingHorizontalXS}`,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    textDecoration: 'none',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  navLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke1,
    margin: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    overflow: 'hidden',
    minHeight: '64px',
  },
  footerText: {
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
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
    borderRadius: '50%',
    minWidth: '24px',
    height: '24px',
    padding: '0',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
})

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: GridRegular },
  { label: 'Projects', href: '/projects', icon: FolderRegular },
  { label: 'Stakeholders', href: '/stakeholders', icon: PeopleRegular },
  { label: 'Analytics', href: '/analytics', icon: DataBarVerticalRegular },
  { label: 'Reports', href: '/reports', icon: DocumentRegular },
  { label: 'Templates', href: '/templates', icon: AppsListRegular },
]

interface SidebarProps {
  userName: string
  orgName: string
  avatarUrl?: string | null
}

export function Sidebar({ userName, orgName, avatarUrl }: SidebarProps) {
  const styles = useStyles()
  const pathname = usePathname()
  const { state, toggle } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <div
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded}`}
      style={{ position: 'relative' }}
    >
      <div className={styles.logo}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1474CB', flexShrink: 0 }}>S</span>
        {!isCollapsed && <span className={styles.logoText}>S-Planned</span>}
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
              {!isCollapsed && <Text size={200} className={styles.navLabel}>{label}</Text>}
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
              {!isCollapsed && <Text size={200} className={styles.navLabel}>Settings</Text>}
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
        {!isCollapsed && (
          <div className={styles.footerText}>
            <Text size={200} weight="semibold" className={styles.userName}>{userName}</Text>
            <Text size={100} className={styles.orgName} style={{ color: tokens.colorNeutralForeground3 }}>
              {orgName}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
