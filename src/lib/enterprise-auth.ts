'use server'

import { prisma } from './db'

/**
 * Enterprise Auth Helpers for SSO
 * Handles user lookup/creation for SAML and OIDC flows
 */

export interface SsoUserInfo {
  email: string
  name?: string
  avatar?: string
}

/**
 * Find or create user from SSO attributes
 * If ssoAutoProvision is enabled, creates user if not found
 */
export async function findOrCreateSsoUser(
  orgId: string,
  userInfo: SsoUserInfo,
): Promise<{ userId: string; isNew: boolean } | null> {
  // Find existing user
  const existing = await prisma.user.findUnique({
    where: { email: userInfo.email },
  })

  if (existing) {
    return { userId: existing.id, isNew: false }
  }

  // Check if org has auto-provisioning enabled
  const settings = await prisma.organizationSettings.findUnique({
    where: { organizationId: orgId },
  })

  if (!settings?.ssoAutoProvision) {
    return null // User not found and auto-provisioning disabled
  }

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      email: userInfo.email,
      name: userInfo.name ?? userInfo.email.split('@')[0],
      image: userInfo.avatar,
      emailVerified: new Date(), // Assume verified from IdP
    },
  })

  // Add to organization with default role
  const defaultRole = (settings.ssoDefaultRole ?? 'member') as 'admin' | 'member' | 'viewer'
  await prisma.organizationMembership.create({
    data: {
      organizationId: orgId,
      userId: newUser.id,
      role: defaultRole,
    },
  })

  // Log the auto-provisioning
  await prisma.auditEvent.create({
    data: {
      organizationId: orgId,
      actorName: 'system',
      eventType: 'user.sso_auto_provisioned',
      description: `User auto-provisioned via SSO: ${userInfo.email}`,
    },
  })

  return { userId: newUser.id, isNew: true }
}

/**
 * Get SSO configuration for an organization
 */
export async function getSsoConfig(orgId: string) {
  const settings = await prisma.organizationSettings.findUnique({
    where: { organizationId: orgId },
  })

  if (!settings?.ssoEnabled) {
    return null
  }

  return {
    protocol: settings.ssoProtocol,
    saml: settings.samlEnabled ? {
      enabled: true,
      entryPoint: settings.samlEntryPoint,
      issuer: settings.samlIssuer,
      certificate: settings.samlCertificate,
      privateKey: settings.samlPrivateKey,
      nameIdField: settings.samlNameIdField,
      emailField: settings.samlEmailField,
      nameField: settings.samlNameField,
    } : null,
    oidc: settings.oidcEnabled ? {
      enabled: true,
      clientId: settings.oidcClientId,
      clientSecret: settings.oidcClientSecret,
      discoveryUrl: settings.oidcDiscoveryUrl,
      issuer: settings.oidcIssuer,
      authorizationUrl: settings.oidcAuthorizationUrl,
      tokenUrl: settings.oidcTokenUrl,
      userinfoUrl: settings.oidcUserinfoUrl,
      jwksUrl: settings.oidcJwksUrl,
      scope: settings.oidcScope,
    } : null,
  }
}

/**
 * Get SSO config for a domain (if configured)
 * Useful for login page to auto-detect SSO
 */
export async function getSsoConfigByDomain(domain: string) {
  // This would require a domain → org mapping in the database
  // For now, return null — would be implemented as:
  // const org = await prisma.organization.findFirst({
  //   where: { customDomain: domain },
  //   include: { settings: true }
  // })
  // return org?.settings?.ssoEnabled ? getSsoConfig(org.id) : null
  return null
}
