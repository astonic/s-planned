'use client'

import { useLayoutEffect, useState } from 'react'
import { Button, Tooltip } from '@fluentui/react-components'
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons'
import { useTheme } from '@/lib/theme-context'

export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const [actualMode, setActualMode] = useState<'light' | 'dark'>(mode)
  const isDark = actualMode === 'dark'

  useLayoutEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    if ((current === 'light' || current === 'dark') && current !== mode) {
      setMode(current)
      setActualMode(current)
      return
    }
    setActualMode(mode)
  }, [mode, setMode])

  function handleToggle() {
    const next = actualMode === 'dark' ? 'light' : 'dark'
    setActualMode(next)
    setMode(next)
  }

  return (
    <Tooltip content="Toggle theme" relationship="label">
      <Button
        key={actualMode}
        appearance="subtle"
        icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
        onClick={handleToggle}
        aria-label="Toggle theme"
      />
    </Tooltip>
  )
}
