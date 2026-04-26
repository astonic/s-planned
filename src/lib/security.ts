import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

/**
 * Security utilities for server actions
 * Enforces authorization and validates inputs
 */

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface AuthContext {
  orgId: string
  userId: string
  userEmail: string
  userName: string
  role: UserRole
}

/**
 * Get auth context and verify minimum role
 * Throws if unauthorized
 */
export async function requireAuth(minRole?: UserRole): Promise<AuthContext> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.currentOrganizationId) {
    throw new Error('Unauthorized: Not logged in')
  }

  const role = (session.role ?? 'viewer') as UserRole
  if (minRole && !hasRole(role, minRole)) {
    throw new Error(`Unauthorized: Requires ${minRole} role, got ${role}`)
  }

  return {
    orgId: session.currentOrganizationId,
    userId: session.user.id,
    userEmail: session.user.email ?? '',
    userName: session.user.name ?? 'Unknown',
    role,
  }
}

/**
 * Check if a role has at least the required permission level
 */
export function hasRole(userRole: UserRole, minRequired: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }
  return roleHierarchy[userRole] >= roleHierarchy[minRequired]
}

/**
 * Input validation helpers
 */

export function validateEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    throw new Error('Invalid email address')
  }
  return trimmed
}

export function validateUrl(url: string): string {
  const trimmed = url.trim()
  try {
    new URL(trimmed)
    return trimmed
  } catch {
    throw new Error('Invalid URL')
  }
}

export function validateDate(date: Date | string | null | undefined, fieldName = 'date'): Date | null {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid ${fieldName}`)
  }
  return d
}

export function validateString(value: unknown, fieldName: string, options?: { min?: number; max?: number }): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }
  const trimmed = value.trim()
  if (options?.min && trimmed.length < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min} characters`)
  }
  if (options?.max && trimmed.length > options.max) {
    throw new Error(`${fieldName} must be at most ${options.max} characters`)
  }
  return trimmed
}

export function validateNumber(value: unknown, fieldName: string, options?: { min?: number; max?: number }): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} must be a number`)
  }
  if (options?.min !== undefined && value < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`)
  }
  if (options?.max !== undefined && value > options.max) {
    throw new Error(`${fieldName} must be at most ${options.max}`)
  }
  return value
}

export function validateEnum<T extends string>(value: unknown, fieldName: string, allowedValues: T[]): T {
  if (!allowedValues.includes(value as T)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`)
  }
  return value as T
}
