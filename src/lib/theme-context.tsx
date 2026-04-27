'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const STORAGE_KEY = 'sp-theme'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode)
  document.documentElement.style.colorScheme = mode
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const current = document.documentElement.getAttribute('data-theme')
  if (isThemeMode(current)) return current
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isThemeMode(stored)) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', setMode: () => {}, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setThemeMode] = useState<ThemeMode>(getPreferredTheme)

  function setMode(next: ThemeMode) {
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    setThemeMode(next)
  }

  useLayoutEffect(() => {
    const preferred = getPreferredTheme()
    setThemeMode(preferred)
    applyTheme(preferred)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function handleSystemChange(event: MediaQueryListEvent) {
      if (isThemeMode(localStorage.getItem(STORAGE_KEY))) return
      const next: ThemeMode = event.matches ? 'dark' : 'light'
      setThemeMode(next)
      applyTheme(next)
    }

    media.addEventListener('change', handleSystemChange)
    return () => media.removeEventListener('change', handleSystemChange)
  }, [])

  function toggle() {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
      return next
    })
  }

  return <ThemeContext.Provider value={{ mode, setMode, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
