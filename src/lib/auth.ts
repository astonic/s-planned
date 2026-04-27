import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import { prisma } from './db'
import { logger } from './logger'

type UpdateSession = { currentOrganizationId?: string }

export const authOptions: NextAuthOptions = {
  // CredentialsProvider requires JWT strategy — database strategy is not supported
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn('Login attempt with missing credentials', { email: credentials?.email })
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        })

        if (!user?.passwordHash) {
          logger.warn('Login attempt for non-existent user', { email: credentials.email })
          return null
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) {
          logger.warn('Login attempt with invalid password', { userId: user.id, email: credentials.email })
          return null
        }

        const membership = user.memberships[0]
        logger.info('User login successful', {
          userId: user.id,
          email: credentials.email,
          orgId: membership?.organizationId,
        })

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? '',
          image: user.image ?? null,
          currentOrganizationId: membership?.organizationId ?? '',
          role: membership?.role ?? 'viewer',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update') {
        const update = session as UpdateSession | null
        if (update?.currentOrganizationId && token.id) {
          const membership = await prisma.organizationMembership.findFirst({
            where: { organizationId: update.currentOrganizationId, userId: token.id as string },
          })
          if (membership) {
            token.currentOrganizationId = update.currentOrganizationId
            token.role = membership.role
          }
        }
      }
      // On sign-in, persist org info into the JWT
      if (user) {
        token.id = user.id
        token.currentOrganizationId = (user as { currentOrganizationId?: string }).currentOrganizationId ?? ''
        token.role = (user as { role?: string }).role ?? 'viewer'
        token.avatarUrl = user.image ?? null
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id as string,
          name: token.name ?? '',
          email: token.email ?? '',
          avatarUrl: (token.avatarUrl as string | null) ?? null,
        },
        currentOrganizationId: (token.currentOrganizationId as string) ?? '',
        role: (token.role as 'owner' | 'admin' | 'member' | 'viewer') ?? 'viewer',
      }
    },
  },
}
