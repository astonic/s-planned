'use client'

import { Button, Tooltip } from '@fluentui/react-components'
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons'
import { useTheme } from '@/lib/theme-context'

export function ThemeToggle() {
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'

  return (
    <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'} relationship="label">
      <Button
        appearance="subtle"
        icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
        onClick={toggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
    </Tooltip>
  )
}
