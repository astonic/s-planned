'use client'

import { makeStyles, tokens, Text } from '@fluentui/react-components'
import { BuildingRegular } from '@fluentui/react-icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const useStyles = makeStyles({
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    height: '32px',
    padding: '0 var(--sp-space-4)',
    backgroundColor: tokens.colorBrandBackground2,
    borderBottom: `1px solid ${tokens.colorBrandStroke2}`,
    flexShrink: 0,
    '@media (min-width: 640px)': {
      padding: '0 var(--sp-space-5)',
    },
    '@media (min-width: 1024px)': {
      padding: '0 var(--sp-space-6)',
    },
  },
  icon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  orgName: {
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
  },
  separator: {
    color: tokens.colorNeutralForeground4,
    margin: `0 ${tokens.spacingHorizontalXS}`,
  },
  role: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'capitalize',
  },
  spacer: {
    flex: 1,
  },
})

interface Props {
  orgName: string
  orgLogoUrl?: string | null
  role: string
}

export function OrgBanner({ orgName, orgLogoUrl, role }: Props) {
  const styles = useStyles()
  return (
    <div className={styles.banner}>
      {orgLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={orgLogoUrl}
          alt=""
          style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 2 }}
        />
      ) : (
        <BuildingRegular fontSize={14} className={styles.icon} />
      )}
      <Text size={200} className={styles.orgName}>{orgName}</Text>
      <Text size={200} className={styles.separator}>·</Text>
      <Text size={200} className={styles.role}>{role}</Text>
      <div className={styles.spacer} />
      <ThemeToggle />
    </div>
  )
}
