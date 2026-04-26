import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PREFIXES = [
  '/landing',
  '/use-cases',
  '/template-gallery',
  '/login',
  '/register',
  '/r/',
  '/invite/',
  '/api/auth/',
  '/_next/',
]

// Only redirect to these paths after login — everything else falls back to /
const VALID_CALLBACK_PREFIXES = ['/', '/projects', '/templates', '/stakeholders', '/analytics', '/reports', '/settings']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (isPublic) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    // Only set callbackUrl for real app routes, not static files
    const isAppRoute = VALID_CALLBACK_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (isAppRoute) loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Exclude static files, images, and all common asset extensions
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf|eot|css|js)$).*)'],
}
