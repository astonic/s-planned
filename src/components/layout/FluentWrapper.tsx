'use client'

import { FluentProvider, Toaster } from '@fluentui/react-components'
import { lightTheme } from '@/lib/theme'

export function FluentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FluentProvider theme={lightTheme}>
      <Toaster toasterId="global" position="top-end" />
      {children}
    </FluentProvider>
  )
}
