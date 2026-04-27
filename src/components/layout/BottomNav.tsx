'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AppsListRegular,
  DataBarVerticalRegular,
  DocumentRegular,
  FolderRegular,
  GridRegular,
} from '@fluentui/react-icons'

const ITEMS = [
  { label: 'Dashboard', href: '/', icon: GridRegular, active: (path: string) => path === '/' },
  { label: 'Plans', href: '/projects', icon: FolderRegular, active: (path: string) => path.startsWith('/projects') && !path.includes('/deliverables/') },
  { label: 'Evidence', href: '/projects', icon: DocumentRegular, active: (path: string) => path.includes('/deliverables/') },
  { label: 'Reports', href: '/reports', icon: DataBarVerticalRegular, active: (path: string) => path.startsWith('/reports') || path.startsWith('/analytics') },
  { label: 'More', href: '/templates', icon: AppsListRegular, active: (path: string) => path.startsWith('/templates') || path.startsWith('/stakeholders') || path.startsWith('/settings') },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sp-bottom-nav" aria-label="Primary mobile navigation">
      {ITEMS.map(({ label, href, icon: Icon, active: isActive }) => {
        const active = isActive(pathname)
        return (
          <Link key={label} href={href} className="sp-bottom-nav__item" data-active={active}>
            <Icon aria-hidden />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
