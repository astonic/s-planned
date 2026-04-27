'use client'

import { useEffect, useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import {
  makeStyles, tokens, Spinner, Avatar, Text,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, MenuButton,
} from '@fluentui/react-components'
import { BuildingRegular } from '@fluentui/react-icons'
import { getUserOrganizations, switchOrganization, type UserOrganization } from '@/lib/actions/organizations'

const useStyles = makeStyles({
  trigger: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    maxWidth: '140px',
  },
  optionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  orgLabel: {
    display: 'flex',
    flexDirection: 'column',
  },
  roleBadge: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  currentDot: {
    color: tokens.colorBrandForeground1,
    marginLeft: 'auto',
  },
})

interface Props {
  currentOrgName: string
  currentOrgSlug: string
  currentOrgLogoUrl?: string | null
}

export function OrganizationSwitcher({ currentOrgName, currentOrgSlug: _currentOrgSlug, currentOrgLogoUrl: _currentOrgLogoUrl }: Props) {
  const styles = useStyles()
  const { update } = useSession()
  const [orgs, setOrgs] = useState<UserOrganization[]>([])
  const [loading, startTransition] = useTransition()

  const activeOrg = orgs.find((o) => o.isCurrentOrg)
  const displayName = activeOrg?.name ?? currentOrgName

  useEffect(() => {
    startTransition(async () => {
      const res = await getUserOrganizations()
      if (res.ok) setOrgs(res.data)
    })
  }, [])

  function handleSwitch(orgId: string) {
    if (orgs.find((o) => o.id === orgId)?.isCurrentOrg) return
    startTransition(async () => {
      const res = await switchOrganization(orgId)
      if (res.ok) {
        await update({ currentOrganizationId: res.data.orgId })
        // Hard reload so the browser sends the updated session cookie and all
        // server components re-execute with the new org context
        window.location.reload()
      }
    })
  }

  if (loading) return <Spinner size="tiny" />

  if (orgs.length <= 1) {
    return (
      <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
        {displayName}
      </Text>
    )
  }

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          appearance="subtle"
          size="small"
          icon={<BuildingRegular />}
          className={styles.trigger}
          style={{ fontSize: '12px', padding: '2px 4px' }}
        >
          {displayName}
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {orgs.map((org) => (
            <MenuItem
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              disabled={org.isCurrentOrg}
            >
              <div className={styles.optionContent}>
                {org.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2 }}
                  />
                ) : (
                  <Avatar name={org.name} size={24} color="colorful" />
                )}
                <div className={styles.orgLabel}>
                  <Text size={200}>{org.name}</Text>
                  <Text size={100} className={styles.roleBadge}>{org.role}</Text>
                </div>
                {org.isCurrentOrg && (
                  <span className={styles.currentDot}>●</span>
                )}
              </div>
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
