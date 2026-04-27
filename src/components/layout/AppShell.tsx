import type { Session } from 'next-auth'
import { SidebarProvider } from './SidebarContext'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { OrgBanner } from './OrgBanner'

interface AppShellProps {
  session: Session
  orgName: string
  orgSlug: string
  orgLogoUrl?: string | null
  children: React.ReactNode
}

export function AppShell({ session, orgName, orgSlug, orgLogoUrl, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="sp-app-shell">
        <Sidebar
          userName={session.user.name}
          orgName={orgName}
          orgSlug={orgSlug}
          orgLogoUrl={orgLogoUrl}
          avatarUrl={session.user.avatarUrl}
        />
        <div className="sp-app-content">
          <OrgBanner orgName={orgName} orgLogoUrl={orgLogoUrl} role={session.role} />
          {children}
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  )
}
