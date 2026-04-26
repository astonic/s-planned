'use client'

import { FluentProvider, Toaster } from '@fluentui/react-components'
import { ThemeProvider, useTheme } from '@/lib/theme-context'
import { lightTheme, darkTheme } from '@/lib/theme'

function FluentProviderBridge({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme()
  return (
    <FluentProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <Toaster toasterId="global" position="top-end" />
      {children}
    </FluentProvider>
  )
}

export function FluentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FluentProviderBridge>{children}</FluentProviderBridge>
    </ThemeProvider>
  )
}
