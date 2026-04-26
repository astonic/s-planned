'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type SidebarState = 'expanded' | 'collapsed' | 'drawer'

interface SidebarContextValue {
  state: SidebarState
  toggle: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  state: 'expanded',
  toggle: () => {},
  openDrawer: () => {},
  closeDrawer: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SidebarState>('expanded')

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-state') as SidebarState | null
    if (saved === 'expanded' || saved === 'collapsed') setState(saved)

    const handleResize = () => {
      if (window.innerWidth < 768) setState('drawer')
      else if (window.innerWidth < 1024) setState('collapsed')
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function toggle() {
    setState((prev) => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded'
      localStorage.setItem('sidebar-state', next)
      return next
    })
  }

  return (
    <SidebarContext.Provider
      value={{
        state,
        toggle,
        openDrawer: () => setState('drawer'),
        closeDrawer: () => setState(window.innerWidth >= 1024 ? 'expanded' : 'collapsed'),
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
