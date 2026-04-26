import type { DefaultSession } from 'next-auth'

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
}
