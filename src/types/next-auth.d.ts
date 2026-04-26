import type { DefaultSession, DefaultUser } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    } & DefaultSession['user']
    currentOrganizationId: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
  }

  interface User extends DefaultUser {
    currentOrganizationId?: string
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    currentOrganizationId?: string
    role?: string
    avatarUrl?: string | null
  }
}
