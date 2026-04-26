'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAdminOrgId(): Promise<{ orgId: string; actorName: string } | null> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return null
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: session.currentOrganizationId,
      userId: session.user?.id,
      role: { in: ['owner', 'admin'] },
    },
  })
  if (!membership) return null
  return { orgId: session.currentOrganizationId, actorName: session.user?.name ?? 'Unknown' }
}

// ── Save SAML Settings ─────────────────────────────────────────────────────────

export interface SaveSamlSettingsInput {
  samlEntryPoint: string
  samlIssuer: string
  samlCertificate: string
  samlPrivateKey?: string
  samlNameIdFormat?: string
  samlNameIdField?: string
  samlEmailField?: string
  samlNameField?: string
  autoProvision?: boolean
  defaultRole?: string
}

export async function saveSamlSettings(input: SaveSamlSettingsInput): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  if (!input.samlEntryPoint?.trim()) return { ok: false, error: 'SAML Entry Point (IdP URL) is required' }
  if (!input.samlIssuer?.trim()) return { ok: false, error: 'SAML Issuer (SP EntityID) is required' }
  if (!input.samlCertificate?.trim()) return { ok: false, error: 'SAML Certificate is required' }
  if (!input.samlNameIdField?.trim()) return { ok: false, error: 'Name ID Field is required' }
  if (!input.samlEmailField?.trim()) return { ok: false, error: 'Email Field is required' }

  try {
    await prisma.organizationSettings.upsert({
      where: { organizationId: auth.orgId },
      create: {
        organizationId: auth.orgId,
        samlEnabled: true,
        samlEntryPoint: input.samlEntryPoint.trim(),
        samlIssuer: input.samlIssuer.trim(),
        samlCertificate: input.samlCertificate.trim(),
        samlPrivateKey: input.samlPrivateKey?.trim(),
        samlNameIdFormat: input.samlNameIdFormat,
        samlNameIdField: input.samlNameIdField?.trim(),
        samlEmailField: input.samlEmailField?.trim(),
        samlNameField: input.samlNameField?.trim(),
        ssoEnabled: true,
        ssoProtocol: 'saml',
        ssoAutoProvision: input.autoProvision ?? false,
        ssoDefaultRole: input.defaultRole ?? 'member',
      },
      update: {
        samlEnabled: true,
        samlEntryPoint: input.samlEntryPoint.trim(),
        samlIssuer: input.samlIssuer.trim(),
        samlCertificate: input.samlCertificate.trim(),
        samlPrivateKey: input.samlPrivateKey?.trim(),
        samlNameIdFormat: input.samlNameIdFormat,
        samlNameIdField: input.samlNameIdField?.trim(),
        samlEmailField: input.samlEmailField?.trim(),
        samlNameField: input.samlNameField?.trim(),
        ssoEnabled: true,
        ssoProtocol: 'saml',
        ssoAutoProvision: input.autoProvision ?? false,
        ssoDefaultRole: input.defaultRole ?? 'member',
      },
    })

    await prisma.auditEvent.create({
      data: {
        organizationId: auth.orgId,
        actorName: auth.actorName,
        eventType: 'sso.saml_configured',
        description: `SAML SSO configured: ${input.samlIssuer}`,
      },
    })

    return { ok: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

// ── Save OIDC Settings ─────────────────────────────────────────────────────────

export interface SaveOidcSettingsInput {
  oidcDiscoveryUrl?: string
  oidcClientId: string
  oidcClientSecret: string
  oidcIssuer?: string
  oidcAuthorizationUrl?: string
  oidcTokenUrl?: string
  oidcUserinfoUrl?: string
  oidcJwksUrl?: string
  oidcScope?: string
  autoProvision?: boolean
  defaultRole?: string
}

export async function saveOidcSettings(input: SaveOidcSettingsInput): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  if (!input.oidcClientId?.trim()) return { ok: false, error: 'OIDC Client ID is required' }
  if (!input.oidcClientSecret?.trim()) return { ok: false, error: 'OIDC Client Secret is required' }
  if (!input.oidcDiscoveryUrl?.trim() && !input.oidcAuthorizationUrl?.trim()) {
    return { ok: false, error: 'Either Discovery URL or Authorization URL is required' }
  }

  try {
    // If discovery URL provided, fetch endpoints (simplified — in production, validate)
    let discoveryUrl = input.oidcDiscoveryUrl?.trim()
    let authUrl = input.oidcAuthorizationUrl?.trim()
    let tokenUrl = input.oidcTokenUrl?.trim()
    let userinfoUrl = input.oidcUserinfoUrl?.trim()
    let jwksUrl = input.oidcJwksUrl?.trim()

    // In production: fetch from discovery URL if provided
    // For now, accept provided values

    await prisma.organizationSettings.upsert({
      where: { organizationId: auth.orgId },
      create: {
        organizationId: auth.orgId,
        oidcEnabled: true,
        oidcDiscoveryUrl: discoveryUrl,
        oidcClientId: input.oidcClientId.trim(),
        oidcClientSecret: input.oidcClientSecret.trim(),
        oidcIssuer: input.oidcIssuer?.trim(),
        oidcAuthorizationUrl: authUrl,
        oidcTokenUrl: tokenUrl,
        oidcUserinfoUrl: userinfoUrl,
        oidcJwksUrl: jwksUrl,
        oidcScope: input.oidcScope ?? 'openid profile email',
        ssoEnabled: true,
        ssoProtocol: 'oidc',
        ssoAutoProvision: input.autoProvision ?? false,
        ssoDefaultRole: input.defaultRole ?? 'member',
      },
      update: {
        oidcEnabled: true,
        oidcDiscoveryUrl: discoveryUrl,
        oidcClientId: input.oidcClientId.trim(),
        oidcClientSecret: input.oidcClientSecret.trim(),
        oidcIssuer: input.oidcIssuer?.trim(),
        oidcAuthorizationUrl: authUrl,
        oidcTokenUrl: tokenUrl,
        oidcUserinfoUrl: userinfoUrl,
        oidcJwksUrl: jwksUrl,
        oidcScope: input.oidcScope ?? 'openid profile email',
        ssoEnabled: true,
        ssoProtocol: 'oidc',
        ssoAutoProvision: input.autoProvision ?? false,
        ssoDefaultRole: input.defaultRole ?? 'member',
      },
    })

    await prisma.auditEvent.create({
      data: {
        organizationId: auth.orgId,
        actorName: auth.actorName,
        eventType: 'sso.oidc_configured',
        description: `OIDC SSO configured: ${input.oidcIssuer ?? input.oidcDiscoveryUrl}`,
      },
    })

    return { ok: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

// ── Disable SSO ────────────────────────────────────────────────────────────────

export async function disableSso(): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  try {
    await prisma.organizationSettings.upsert({
      where: { organizationId: auth.orgId },
      create: {
        organizationId: auth.orgId,
        ssoEnabled: false,
        samlEnabled: false,
        oidcEnabled: false,
      },
      update: {
        ssoEnabled: false,
        samlEnabled: false,
        oidcEnabled: false,
      },
    })

    await prisma.auditEvent.create({
      data: {
        organizationId: auth.orgId,
        actorName: auth.actorName,
        eventType: 'sso.disabled',
        description: 'SSO has been disabled',
      },
    })

    return { ok: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
}

// ── Test SAML Connection ───────────────────────────────────────────────────────

export async function testSamlConnection(samlEntryPoint: string): Promise<ActionResult<{ success: boolean; message: string }>> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  if (!samlEntryPoint?.trim()) return { ok: false, error: 'SAML Entry Point is required' }

  try {
    // Test basic reachability
    const url = new URL(samlEntryPoint)
    const res = await fetch(url.toString(), {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok && res.status !== 405 && res.status !== 302) {
      return { ok: true, data: { success: false, message: `HTTP ${res.status} from IdP endpoint` } }
    }
    return { ok: true, data: { success: true, message: 'SAML entry point is reachable' } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return { ok: true, data: { success: false, message: msg } }
  }
}

// ── Test OIDC Connection ───────────────────────────────────────────────────────

export async function testOidcConnection(discoveryUrl: string): Promise<ActionResult<{ success: boolean; message: string }>> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  if (!discoveryUrl?.trim()) return { ok: false, error: 'Discovery URL is required' }

  try {
    // Test discovery endpoint
    const res = await fetch(discoveryUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return { ok: true, data: { success: false, message: `HTTP ${res.status} from discovery endpoint` } }
    }

    const data = await res.json() as Record<string, unknown>
    const hasRequired = !!(data.authorization_endpoint && data.token_endpoint)

    if (!hasRequired) {
      return { ok: true, data: { success: false, message: 'Discovery endpoint missing required fields' } }
    }

    return { ok: true, data: { success: true, message: 'OIDC discovery endpoint is valid' } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return { ok: true, data: { success: false, message: msg } }
  }
}
