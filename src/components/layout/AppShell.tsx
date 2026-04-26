import type { Session } from 'next-auth'
import { SidebarProvider } from './SidebarContext'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  session: Session
  orgName: string
  orgSlug: string
  children: React.ReactNode
}

export function AppShell({ session, orgName, orgSlug, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          userName={session.user.name}
          orgName={orgName}
          orgSlug={orgSlug}
          avatarUrl={session.user.avatarUrl}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
