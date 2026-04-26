import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
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
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? '',
          image: user.image ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const membership = await prisma.organizationMembership.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      })

      return {
        ...session,
        user: {
          id: user.id,
          name: user.name ?? '',
          email: user.email ?? '',
          avatarUrl: (user as { image?: string | null }).image ?? null,
        },
        currentOrganizationId: membership?.organizationId ?? '',
        role: (membership?.role ?? 'viewer') as 'owner' | 'admin' | 'member' | 'viewer',
      }
    },
  },
}
