/**
 * Simple in-memory rate limiter for server actions
 * Production use: replace with Redis-backed solution
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(rateLimitMap.entries())) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}, 10 * 60 * 1000)

interface RateLimitOptions {
  windowMs?: number // Time window in ms (default: 60s)
  maxRequests?: number // Max requests per window (default: 100)
  keyPrefix?: string // Custom key prefix (default: "rl")
}

/**
 * Check if action is rate-limited
 * Returns { allowed: true/false, remaining: number }
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {},
): { allowed: boolean; remaining: number } {
  const windowMs = options.windowMs ?? 60 * 1000
  const maxRequests = options.maxRequests ?? 100
  const keyPrefix = options.keyPrefix ?? 'rl'
  const key = `${keyPrefix}:${identifier}`

  const now = Date.now()
  let entry = rateLimitMap.get(key)

  // Entry expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    rateLimitMap.set(key, entry)
  }

  entry.count++
  const remaining = Math.max(0, maxRequests - entry.count)
  const allowed = entry.count <= maxRequests

  return { allowed, remaining }
}

/**
 * Public action rate limiting (more restrictive)
 * E.g., acceptInvite: 10 requests per minute per IP
 */
export function checkPublicActionRateLimit(ipAddress: string): { allowed: boolean } {
  const result = checkRateLimit(ipAddress, {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'public',
  })
  return { allowed: result.allowed }
}

/**
 * Authenticated action rate limiting (medium)
 * E.g., createProject: 50 requests per minute per user
 */
export function checkAuthActionRateLimit(userId: string): { allowed: boolean } {
  const result = checkRateLimit(userId, {
    windowMs: 60 * 1000,
    maxRequests: 50,
    keyPrefix: 'auth',
  })
  return { allowed: result.allowed }
}
