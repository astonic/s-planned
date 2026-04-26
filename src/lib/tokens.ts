import { tokens } from '@fluentui/react-components'

export const appTokens = {
  // Status colours — deliverables
  statusPlannedBg:      tokens.colorNeutralBackground3,
  statusPlannedFg:      tokens.colorNeutralForeground2,
  statusInProgressBg:   tokens.colorBrandBackground2,
  statusInProgressFg:   tokens.colorBrandForeground1,
  statusDelayedBg:      tokens.colorPaletteYellowBackground2,
  statusDelayedFg:      tokens.colorPaletteYellowForeground2,
  statusClosedBg:       tokens.colorPaletteGreenBackground2,
  statusClosedFg:       tokens.colorPaletteGreenForeground2,

  // Severity colours — RAID
  severityCriticalBg:   tokens.colorPaletteRedBackground2,
  severityCriticalFg:   tokens.colorPaletteRedForeground2,
  severityHighBg:       tokens.colorPaletteRedBackground1,
  severityHighFg:       tokens.colorPaletteRedForeground1,
  severityMediumBg:     tokens.colorPaletteYellowBackground2,
  severityMediumFg:     tokens.colorPaletteYellowForeground2,
  severityLowBg:        tokens.colorNeutralBackground3,
  severityLowFg:        tokens.colorNeutralForeground2,

  // RAG status
  ragRed:    '#C4314B',
  ragAmber:  '#F7B900',
  ragGreen:  '#13A10E',
} as const
