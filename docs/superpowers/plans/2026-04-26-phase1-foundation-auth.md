# Phase 1 — Foundation & Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js 14 app shell with email/password authentication, Postgres + Prisma with RLS, Fluent UI v9, and real marketing pages so a user can register, log in, see the authenticated sidebar, and log out.

**Architecture:** Next.js App Router route groups `(public)` / `(app)` for layout isolation. NextAuth v4 with CredentialsProvider + Prisma adapter for database-backed sessions. `withTenant()` wraps all tenant-scoped Prisma queries with `SET LOCAL app.current_tenant_id`. Session callback enriches every request with `currentOrganizationId` + `role` from the user's membership.

**Tech Stack:** Next.js 14 · TypeScript 5 (strict) · Fluent UI v9 (`@fluentui/react-components`) · Tailwind CSS (layout only) · NextAuth v4 + `@next-auth/prisma-adapter` · Prisma 5 · Postgres 16 (Docker) · bcryptjs · Zod · react-hook-form

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `package.json` | Create | All dependencies |
| `tsconfig.json` | Create | TypeScript strict config |
| `next.config.js` | Create | transpilePackages for Fluent UI |
| `tailwind.config.ts` | Create | Tailwind setup |
| `postcss.config.js` | Create | PostCSS |
| `.eslintrc.json` | Create | ESLint config |
| `.gitignore` | Create | Standard Next.js ignores + .env.local |
| `jest.config.js` | Create | Jest for unit tests |
| `jest.setup.ts` | Create | jest-dom setup |
| `docker-compose.yml` | Create | Postgres 16 service |
| `.env.local` | Create | Local dev env vars |
| `prisma/schema.prisma` | Create | All Phase 1 models |
| `prisma/seed.ts` | Create | Idempotent dev seed |
| `src/lib/db.ts` | Create | Prisma singleton |
| `src/lib/slugify.ts` | Create | Slug generation utility |
| `src/lib/tenant-context.ts` | Create | withTenant() RLS wrapper |
| `src/lib/theme.ts` | Create | Fluent brand theme |
| `src/lib/tokens.ts` | Create | Semantic token aliases |
| `src/lib/auth.ts` | Create | NextAuth options |
| `src/types/next-auth.d.ts` | Create | Session type augmentation |
| `src/middleware.ts` | Create | Session check + redirect |
| `src/app/api/auth/[...nextauth]/route.ts` | Create | NextAuth handler |
| `src/app/api/auth/register/route.ts` | Create | Registration endpoint |
| `src/app/layout.tsx` | Create | Root layout (html, body, font) |
| `src/app/globals.css` | Create | Global styles |
| `src/app/(public)/layout.tsx` | Create | Public layout + FluentProvider |
| `src/app/(app)/layout.tsx` | Create | Authenticated layout + AppShell |
| `src/app/(app)/page.tsx` | Create | Dashboard placeholder |
| `src/app/(public)/login/page.tsx` | Create | Login form page |
| `src/app/(public)/register/page.tsx` | Create | Register form page |
| `src/app/(public)/landing/page.tsx` | Create | Marketing landing page |
| `src/app/(public)/use-cases/page.tsx` | Create | Use-cases page |
| `src/components/layout/FluentWrapper.tsx` | Create | Client FluentProvider wrapper |
| `src/components/layout/AppShell.tsx` | Create | Sidebar + main layout |
| `src/components/layout/Sidebar.tsx` | Create | Fluent nav (client component) |
| `src/components/layout/PageHeader.tsx` | Create | Sticky page header |
| `src/components/layout/SidebarContext.tsx` | Create | Collapse state context |
| `src/lib/__tests__/slugify.test.ts` | Create | Slug unit tests |
| `src/lib/__tests__/tenant-context.test.ts` | Create | TenantContext unit tests |

---

## Task 1: Git Init + Project Config Files

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.eslintrc.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialise git**

```bash
cd /Users/astonmotsau/dev/s-planned
git init
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "s-planned",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@fluentui/react-components": "^9.54.0",
    "@fluentui/react-icons": "^2.0.245",
    "@hookform/resolvers": "^3.9.0",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "next": "14.2.15",
    "next-auth": "^4.24.10",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.2",
    "@testing-library/react": "^16.0.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.16.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.15",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.47",
    "prisma": "^5.22.0",
    "tailwindcss": "^3.4.13",
    "ts-jest": "^29.2.5",
    "tsx": "^4.19.1",
    "typescript": "^5.6.2"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@fluentui/react-components',
    '@fluentui/react-icons',
    '@griffel/react',
  ],
}

module.exports = nextConfig
```

- [ ] **Step 5: Create `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Create `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create `.eslintrc.json`**

```json
{
  "extends": ["next/core-web-vitals"]
}
```

- [ ] **Step 8: Create `.gitignore`**

```
# Dependencies
/node_modules
/.pnp
.pnp.js

# Next.js
/.next/
/out/

# Production
/build

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Prisma
/prisma/migrations/*/migration_lock.toml

# Uploads
/uploads/

# Misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.vercel
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json next.config.js tailwind.config.ts postcss.config.js .eslintrc.json .gitignore
git commit -m "chore: initialise project config files"
```

---

## Task 2: Install Dependencies

**Files:** none (modifies node_modules)

- [ ] **Step 1: Install all dependencies**

```bash
npm install
```

Expected: installs ~400 packages, no peer dep errors. Takes 30-60 seconds.

- [ ] **Step 2: Verify Next.js binary works**

```bash
npx next --version
```

Expected output: `14.x.x`

---

## Task 3: Docker Compose + Environment Files

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.local`
- Create: `uploads/.gitkeep`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: splanned
      POSTGRES_PASSWORD: splanned
      POSTGRES_DB: splanned_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U splanned -d splanned_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 2: Create `.env.local`**

```bash
DATABASE_URL="postgresql://splanned:splanned@localhost:5432/splanned_dev"
SUPERADMIN_DATABASE_URL="postgresql://splanned:splanned@localhost:5432/splanned_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"
ENCRYPTION_KEY="dev-encryption-key-32-chars-min!!"
STORAGE_BACKEND="local"
STORAGE_PATH="./uploads"
```

- [ ] **Step 3: Create uploads directory placeholder**

```bash
mkdir -p uploads && touch uploads/.gitkeep
```

- [ ] **Step 4: Start Postgres and verify connection**

```bash
docker compose up -d
sleep 3
docker compose ps
```

Expected: `postgres` container status is `healthy` or `running`.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml uploads/.gitkeep
git commit -m "chore: add docker-compose and local env setup"
```

Note: `.env.local` is gitignored — do not commit it.

---

## Task 4: Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialise Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: creates `prisma/schema.prisma` and adds `DATABASE_URL` placeholder to `.env`.
Delete the generated `.env` file — we use `.env.local`.

```bash
rm -f .env
```

- [ ] **Step 2: Replace `prisma/schema.prisma` with the full Phase 1 schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── NextAuth adapter tables ───────────────────────────────────────────────────

model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  name          String?
  image         String?
  emailVerified DateTime?
  passwordHash  String?

  accounts      Account[]
  sessions      Session[]
  memberships   OrganizationMembership[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id                    String   @id @default(uuid())
  sessionToken          String   @unique
  userId                String
  expires               DateTime
  currentOrganizationId String?

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ── Tenant ────────────────────────────────────────────────────────────────────

model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  logoUrl     String?

  memberships OrganizationMembership[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("organizations")
}

enum MemberRole {
  owner
  admin
  member
  viewer
}

model OrganizationMembership {
  id             String       @id @default(uuid())
  organizationId String
  userId         String
  role           MemberRole

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@map("organization_memberships")
}
```

Note: `User.image` (not `avatarUrl`) is required by the `@next-auth/prisma-adapter`. It is exposed as `avatarUrl` in the session callback.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add prisma schema for Phase 1 (users, sessions, organizations, memberships)"
```

---

## Task 5: Database Migration + RLS

**Files:**
- Create: `prisma/migrations/[timestamp]_init/migration.sql` (generated, then appended)

- [ ] **Step 1: Generate migration (create-only — don't apply yet)**

```bash
npx prisma migrate dev --name init --create-only
```

Expected: creates `prisma/migrations/[timestamp]_init/migration.sql`. Do NOT apply yet.

- [ ] **Step 2: Append RLS SQL to the migration file**

Open `prisma/migrations/[timestamp]_init/migration.sql` and append these lines at the very end:

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE "organization_memberships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "organization_memberships"
  USING (
    organization_id::text = current_setting('app.current_tenant_id', true)
  );

ALTER TABLE "organization_memberships" FORCE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Apply the migration**

```bash
npx prisma migrate dev
```

Expected output: `✔ Generated Prisma Client` and migration applied successfully.

- [ ] **Step 4: Verify tables exist**

```bash
npx prisma studio
```

Open `http://localhost:5555` and confirm these tables appear: `users`, `accounts`, `sessions`, `verification_tokens`, `organizations`, `organization_memberships`. Then stop Prisma Studio with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: apply initial migration with RLS on organization_memberships"
```

---

## Task 6: Jest Setup

**Files:**
- Create: `jest.config.js`
- Create: `jest.setup.ts`
- Create: `src/lib/__tests__/` (directory)

- [ ] **Step 1: Create `jest.config.js`**

```js
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathPattern: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
}

module.exports = createJestConfig(customJestConfig)
```

- [ ] **Step 2: Create `jest.setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Create test directory**

```bash
mkdir -p src/lib/__tests__
```

- [ ] **Step 4: Verify Jest runs**

```bash
npm test -- --passWithNoTests
```

Expected: `Test Suites: 0 passed` (no tests yet, no errors).

- [ ] **Step 5: Commit**

```bash
git add jest.config.js jest.setup.ts
git commit -m "chore: add jest configuration"
```

---

## Task 7: Slugify Utility (TDD)

**Files:**
- Create: `src/lib/slugify.ts`
- Create: `src/lib/__tests__/slugify.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/slugify.test.ts`:

```ts
import { generateSlug } from '../slugify'

describe('generateSlug', () => {
  it('lowercases and hyphenates a simple name', () => {
    expect(generateSlug('Acme Mining Co')).toBe('acme-mining-co')
  })

  it('removes special characters', () => {
    expect(generateSlug('Smith & Sons Ltd.')).toBe('smith-sons-ltd')
  })

  it('collapses multiple spaces and hyphens', () => {
    expect(generateSlug('Alpha  --  Beta')).toBe('alpha-beta')
  })

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('  -Leading-')).toBe('leading')
  })

  it('appends numeric suffix when existingSlugs contains the base slug', () => {
    expect(generateSlug('Acme Mining', ['acme-mining'])).toBe('acme-mining-2')
  })

  it('increments suffix until unique', () => {
    expect(generateSlug('Acme Mining', ['acme-mining', 'acme-mining-2'])).toBe('acme-mining-3')
  })

  it('handles names that are only special characters', () => {
    const slug = generateSlug('---')
    expect(slug).toMatch(/^org-\d+$/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- slugify.test.ts
```

Expected: `FAIL` with `Cannot find module '../slugify'`

- [ ] **Step 3: Implement `src/lib/slugify.ts`**

```ts
export function generateSlug(name: string, existingSlugs: string[] = []): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `org-${Date.now()}`

  if (!existingSlugs.includes(base)) return base

  let suffix = 2
  while (existingSlugs.includes(`${base}-${suffix}`)) {
    suffix++
  }
  return `${base}-${suffix}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- slugify.test.ts
```

Expected: `PASS  src/lib/__tests__/slugify.test.ts` — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/slugify.ts src/lib/__tests__/slugify.test.ts
git commit -m "feat: add slug generation utility with collision handling"
```

---

## Task 8: Prisma Singleton

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Create `src/lib/db.ts`**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run type-check
```

Expected: no errors related to `db.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add prisma singleton"
```

---

## Task 9: TenantContext (TDD)

**Files:**
- Create: `src/lib/tenant-context.ts`
- Create: `src/lib/__tests__/tenant-context.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/tenant-context.test.ts`:

```ts
import { withTenant } from '../tenant-context'

// Mock the prisma singleton
const mockExecuteRaw = jest.fn().mockResolvedValue(undefined)
const mockTransaction = jest.fn()

jest.mock('../db', () => ({
  prisma: {
    $transaction: (fn: Function) => mockTransaction(fn),
  },
}))

describe('withTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.mockImplementation((fn: Function) => {
      const fakeTx = { $executeRaw: mockExecuteRaw }
      return fn(fakeTx)
    })
  })

  it('calls SET LOCAL app.current_tenant_id before running the callback', async () => {
    const orgId = 'test-org-uuid'
    const callback = jest.fn().mockResolvedValue('result')

    await withTenant(orgId, callback)

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1)
    const [templateStrings] = mockExecuteRaw.mock.calls[0]
    expect(templateStrings.join('')).toContain('SET LOCAL app.current_tenant_id')
  })

  it('passes the transaction client to the callback', async () => {
    const orgId = 'test-org-uuid'
    const callback = jest.fn().mockResolvedValue('result')

    await withTenant(orgId, callback)

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ $executeRaw: mockExecuteRaw })
    )
  })

  it('returns the value from the callback', async () => {
    const callback = jest.fn().mockResolvedValue('expected-value')

    const result = await withTenant('org-id', callback)

    expect(result).toBe('expected-value')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tenant-context.test.ts
```

Expected: `FAIL` with `Cannot find module '../tenant-context'`

- [ ] **Step 3: Implement `src/lib/tenant-context.ts`**

```ts
import { PrismaClient } from '@prisma/client'
import { prisma } from './db'

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

export async function withTenant<T>(
  organizationId: string,
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${organizationId}`
    return fn(tx)
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tenant-context.test.ts
```

Expected: `PASS  src/lib/__tests__/tenant-context.test.ts` — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tenant-context.ts src/lib/__tests__/tenant-context.test.ts
git commit -m "feat: add withTenant RLS middleware"
```

---

## Task 10: Fluent Theme + Tokens

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/lib/tokens.ts`

- [ ] **Step 1: Create `src/lib/theme.ts`**

```ts
import { createLightTheme, type BrandVariants } from '@fluentui/react-components'

const sPlannedBrand: BrandVariants = {
  10:  '#020408',
  20:  '#0B1A2E',
  30:  '#0D2A4A',
  40:  '#0E3B68',
  50:  '#0F4D87',
  60:  '#1060A8',
  70:  '#1474CB',
  80:  '#2B8AE5',
  90:  '#4FA3F5',
  100: '#79BCFF',
  110: '#A3D2FF',
  120: '#C4E3FF',
  130: '#DDF0FF',
  140: '#EEF7FF',
  150: '#F5FAFF',
  160: '#FAFCFF',
}

export const lightTheme = createLightTheme(sPlannedBrand)
```

- [ ] **Step 2: Create `src/lib/tokens.ts`**

```ts
import { tokens } from '@fluentui/react-components'

// Re-export semantic aliases used throughout the app.
// Import from here instead of directly from @fluentui/react-components
// so token usage is grep-able and can be updated in one place.
export const appTokens = {
  // Status colours — deliverables
  statusPlannedBg:      tokens.colorNeutralBackground3,
  statusPlannedFg:      tokens.colorNeutralForeground2,
  statusInProgressBg:   tokens.colorBrandBackground2,
  statusInProgressFg:   tokens.colorBrandForeground1,
  statusDelayedBg:      tokens.colorPaletteYellowBackground2,
  statusDelayedFg:      tokens.colorPaletteYellowForeground2,
  statusClosedBg:       tokens.colorPaletteGreenBackground2,
  statusClosedFg:       tokens.colorPaletteGreenForeground2,

  // Severity colours — RAID
  severityCriticalBg:   tokens.colorPaletteRedBackground2,
  severityCriticalFg:   tokens.colorPaletteRedForeground2,
  severityHighBg:       tokens.colorPaletteRedBackground1,
  severityHighFg:       tokens.colorPaletteRedForeground1,
  severityMediumBg:     tokens.colorPaletteYellowBackground2,
  severityMediumFg:     tokens.colorPaletteYellowForeground2,
  severityLowBg:        tokens.colorNeutralBackground3,
  severityLowFg:        tokens.colorNeutralForeground2,

  // RAG status
  ragRed:    '#C4314B',
  ragAmber:  '#F7B900',
  ragGreen:  '#13A10E',
} as const
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/theme.ts src/lib/tokens.ts
git commit -m "feat: add Fluent UI brand theme and semantic tokens"
```

---

## Task 11: NextAuth Config + Session Types

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/types/next-auth.d.ts`

- [ ] **Step 1: Create `src/types/next-auth.d.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/lib/auth.ts`**

```ts
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
      // Look up the user's primary org membership
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
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts
git commit -m "feat: add NextAuth config with CredentialsProvider and session enrichment"
```

---

## Task 12: Registration API Route (TDD)

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/register/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create directory and test file:

```bash
mkdir -p src/app/api/auth/register/__tests__
```

Create `src/app/api/auth/register/__tests__/route.test.ts`:

```ts
import { POST } from '../route'
import { NextRequest } from 'next/server'

const mockFindUnique = jest.fn()
const mockCreate = jest.fn()
const mockFindMany = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
    organization: { create: (...a: unknown[]) => mockCreate(...a) },
    organizationMembership: { findMany: (...a: unknown[]) => mockFindMany(...a) },
    $transaction: jest.fn((fn: Function) => fn({
      user: { create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test', image: null }) },
      organization: { create: jest.fn().mockResolvedValue({ id: 'org-1', slug: 'test-org', name: 'Test Org' }) },
      organizationMembership: { create: jest.fn().mockResolvedValue({}) },
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    })),
  },
}))

jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed-password') }))

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindUnique.mockResolvedValue(null) // email not taken by default
    mockFindMany.mockResolvedValue([]) // no existing slugs
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'password123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is invalid', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'not-an-email', password: 'password123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', password: 'short' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when email is already registered', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-user' })
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', password: 'password123' }))
    expect(res.status).toBe(409)
  })

  it('returns 201 on successful registration', async () => {
    const res = await POST(makeRequest({ name: 'Test User', email: 'new@test.com', password: 'password123' }))
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- route.test.ts
```

Expected: `FAIL` with `Cannot find module '../route'`

- [ ] **Step 3: Create `src/app/api/auth/register/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { generateSlug } from '@/lib/slugify'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Determine a unique slug for the new org
  const existingOrgs = await prisma.organization.findMany({ select: { slug: true } })
  const existingSlugs = existingOrgs.map((o) => o.slug)
  const orgName = `${name}'s Organization`
  const slug = generateSlug(orgName, existingSlugs)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    })

    const org = await tx.organization.create({
      data: { name: orgName, slug },
    })

    await tx.organizationMembership.create({
      data: { userId: user.id, organizationId: org.id, role: 'owner' },
    })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- route.test.ts
```

Expected: `PASS` — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/register/
git commit -m "feat: add registration API route with validation and org creation"
```

---

## Task 13: NextAuth Route Handler

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create directory and route file**

```bash
mkdir -p "src/app/api/auth/[...nextauth]"
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/auth/[...nextauth]/route.ts"
git commit -m "feat: add NextAuth route handler"
```

---

## Task 14: Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PREFIXES = [
  '/landing',
  '/use-cases',
  '/login',
  '/register',
  '/r/',
  '/invite/',
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (isPublic) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Next.js middleware for session-based route protection"
```

---

## Task 15: Root Layout + Global CSS

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create `src/app/globals.css`**

```css
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  height: 100%;
  overflow-x: hidden;
}

/* Fluent UI focus visible — never suppress */
:focus-visible {
  outline-offset: 2px;
}
```

- [ ] **Step 2: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'S-Planned — Operational Readiness Platform',
  description: 'Plan, track, and evidence operational readiness activities.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: '100%' }}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add root layout and global CSS"
```

---

## Task 16: FluentWrapper + Public Layout

**Files:**
- Create: `src/components/layout/FluentWrapper.tsx`
- Create: `src/app/(public)/layout.tsx`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/components/layout
mkdir -p "src/app/(public)"
mkdir -p src/components/ui
```

- [ ] **Step 2: Create `src/components/layout/FluentWrapper.tsx`**

```tsx
'use client'

import { FluentProvider, Toaster } from '@fluentui/react-components'
import { lightTheme } from '@/lib/theme'

export function FluentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FluentProvider theme={lightTheme}>
      <Toaster toasterId="global" position="top-end" />
      {children}
    </FluentProvider>
  )
}
```

- [ ] **Step 3: Create `src/app/(public)/layout.tsx`**

```tsx
import Link from 'next/link'
import { FluentWrapper } from '@/components/layout/FluentWrapper'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <FluentWrapper>
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
          <Link href="/landing" className="flex items-center gap-2 no-underline">
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1474CB', letterSpacing: '-0.5px' }}>
              S-Planned
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </FluentWrapper>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/FluentWrapper.tsx "src/app/(public)/layout.tsx"
git commit -m "feat: add FluentWrapper and public layout"
```

---

## Task 17: Sidebar Context + AppShell + Sidebar + PageHeader

**Files:**
- Create: `src/components/layout/SidebarContext.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/PageHeader.tsx`
- Create: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create `src/components/layout/SidebarContext.tsx`**

```tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type SidebarState = 'expanded' | 'collapsed' | 'drawer'

interface SidebarContextValue {
  state: SidebarState
  toggle: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  state: 'expanded',
  toggle: () => {},
  openDrawer: () => {},
  closeDrawer: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SidebarState>('expanded')

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-state') as SidebarState | null
    if (saved === 'expanded' || saved === 'collapsed') setState(saved)

    const handleResize = () => {
      if (window.innerWidth < 768) setState('drawer')
      else if (window.innerWidth < 1024) setState('collapsed')
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function toggle() {
    setState((prev) => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded'
      localStorage.setItem('sidebar-state', next)
      return next
    })
  }

  return (
    <SidebarContext.Provider
      value={{
        state,
        toggle,
        openDrawer: () => setState('drawer'),
        closeDrawer: () => setState(window.innerWidth >= 1024 ? 'expanded' : 'collapsed'),
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
```

- [ ] **Step 2: Create `src/components/layout/Sidebar.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { makeStyles, tokens, Avatar, Text, Tooltip, Button } from '@fluentui/react-components'
import {
  GridRegular,
  FolderRegular,
  PeopleRegular,
  DataBarVerticalRegular,
  DocumentRegular,
  TemplateRegular,
  SettingsRegular,
  ChevronDoubleLeftRegular,
  ChevronDoubleRightRegular,
} from '@fluentui/react-icons'
import { useSidebar } from './SidebarContext'

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'width 200ms ease',
    overflowX: 'hidden',
  },
  expanded: { width: '240px' },
  collapsed: { width: '48px' },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalM}`,
    minHeight: '56px',
  },
  logoText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: `0 ${tokens.spacingHorizontalXS}`,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    textDecoration: 'none',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  navLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke1,
    margin: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    overflow: 'hidden',
    minHeight: '64px',
  },
  footerText: {
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
  },
  userName: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  orgName: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  collapseBtn: {
    position: 'absolute',
    bottom: '80px',
    right: '-12px',
    zIndex: 10,
    borderRadius: '50%',
    minWidth: '24px',
    height: '24px',
    padding: '0',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
})

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: GridRegular },
  { label: 'Projects', href: '/projects', icon: FolderRegular },
  { label: 'Stakeholders', href: '/stakeholders', icon: PeopleRegular },
  { label: 'Analytics', href: '/analytics', icon: DataBarVerticalRegular },
  { label: 'Reports', href: '/reports', icon: DocumentRegular },
  { label: 'Templates', href: '/templates', icon: TemplateRegular },
]

interface SidebarProps {
  userName: string
  orgName: string
  avatarUrl?: string | null
}

export function Sidebar({ userName, orgName, avatarUrl }: SidebarProps) {
  const styles = useStyles()
  const pathname = usePathname()
  const { state, toggle } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <div
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded}`}
      style={{ position: 'relative' }}
    >
      {/* Logo */}
      <div className={styles.logo}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1474CB', flexShrink: 0 }}>S</span>
        {!isCollapsed && <span className={styles.logoText}>S-Planned</span>}
      </div>

      {/* Nav items */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const item = (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <Icon style={{ flexShrink: 0, fontSize: 20 }} />
              {!isCollapsed && <Text size={200} className={styles.navLabel}>{label}</Text>}
            </Link>
          )
          return isCollapsed ? (
            <Tooltip key={href} content={label} relationship="label" positioning="after">
              {item}
            </Tooltip>
          ) : item
        })}

        <div className={styles.divider} />

        {/* Settings */}
        {(() => {
          const isActive = pathname.startsWith('/settings')
          const item = (
            <Link
              href="/settings"
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <SettingsRegular style={{ flexShrink: 0, fontSize: 20 }} />
              {!isCollapsed && <Text size={200} className={styles.navLabel}>Settings</Text>}
            </Link>
          )
          return isCollapsed ? (
            <Tooltip content="Settings" relationship="label" positioning="after">
              {item}
            </Tooltip>
          ) : item
        })()}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <Button
        className={styles.collapseBtn}
        size="small"
        appearance="subtle"
        icon={isCollapsed ? <ChevronDoubleRightRegular /> : <ChevronDoubleLeftRegular />}
        onClick={toggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      />

      {/* Footer */}
      <div className={styles.footer}>
        <Avatar
          name={userName}
          image={avatarUrl ? { src: avatarUrl } : undefined}
          size={32}
          style={{ flexShrink: 0 }}
        />
        {!isCollapsed && (
          <div className={styles.footerText}>
            <Text size={200} weight="semibold" className={styles.userName}>{userName}</Text>
            <Text size={100} className={styles.orgName} style={{ color: tokens.colorNeutralForeground3 }}>
              {orgName}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/layout/PageHeader.tsx`**

```tsx
import { makeStyles, tokens, Text, Button } from '@fluentui/react-components'
import { NavigationRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minHeight: '56px',
    padding: `0 ${tokens.spacingHorizontalXXL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  title: { flex: 1 },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' },
})

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode
  onMenuClick?: () => void
}

export function PageHeader({ title, breadcrumb, actions, onMenuClick }: PageHeaderProps) {
  const styles = useStyles()

  return (
    <header className={styles.header}>
      {onMenuClick && (
        <Button
          appearance="subtle"
          icon={<NavigationRegular />}
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        />
      )}
      <div className={styles.title}>
        {breadcrumb && breadcrumb.length > 0 && (
          <Text size={100} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                {b.href ? <a href={b.href} style={{ color: 'inherit', textDecoration: 'none' }}>{b.label}</a> : b.label}
              </span>
            ))}
          </Text>
        )}
        <Text size={500} weight="semibold">{title}</Text>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
```

- [ ] **Step 4: Create `src/components/layout/AppShell.tsx`**

```tsx
import type { Session } from 'next-auth'
import { SidebarProvider } from './SidebarContext'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  session: Session
  children: React.ReactNode
}

export function AppShell({ session, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          userName={session.user.name}
          orgName={session.currentOrganizationId}
          avatarUrl={session.user.avatarUrl}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
```

Note: `orgName` shows the org ID for now. In Task 19 (App Layout), we fetch the org name from the DB.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add AppShell, Sidebar, PageHeader, and SidebarContext"
```

---

## Task 18: App Layout (Authenticated)

**Files:**
- Create: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/app/(app)"
```

- [ ] **Step 2: Create `src/app/(app)/layout.tsx`**

```tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FluentWrapper } from '@/components/layout/FluentWrapper'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Fetch org name for sidebar display
  const org = session.currentOrganizationId
    ? await prisma.organization.findUnique({
        where: { id: session.currentOrganizationId },
        select: { name: true },
      })
    : null

  const enrichedSession = {
    ...session,
    orgName: org?.name ?? 'My Organization',
  }

  return (
    <FluentWrapper>
      <AppShell session={enrichedSession} orgName={enrichedSession.orgName}>
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </main>
      </AppShell>
    </FluentWrapper>
  )
}
```

- [ ] **Step 3: Update `AppShell.tsx` to accept `orgName` prop**

Update `src/components/layout/AppShell.tsx`:

```tsx
import type { Session } from 'next-auth'
import { SidebarProvider } from './SidebarContext'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  session: Session
  orgName: string
  children: React.ReactNode
}

export function AppShell({ session, orgName, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          userName={session.user.name}
          orgName={orgName}
          avatarUrl={session.user.avatarUrl}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
```

- [ ] **Step 4: Verify TypeScript is happy**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/layout.tsx" src/components/layout/AppShell.tsx
git commit -m "feat: add authenticated app layout with session guard and org name fetch"
```

---

## Task 19: Login Page

**Files:**
- Create: `src/app/(public)/login/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/app/(public)/login"
```

- [ ] **Step 2: Create `src/app/(public)/login/page.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import {
  Card,
  Field,
  Input,
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 56px)',
    padding: tokens.spacingHorizontalXXL,
  },
  logo: {
    fontSize: '28px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXXL,
  },
  card: { width: '100%', maxWidth: '400px' },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
  },
  footer: {
    textAlign: 'center',
    marginTop: tokens.spacingVerticalM,
  },
})

export default function LoginPage() {
  const styles = useStyles()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: LoginValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError('Incorrect email or password. Please try again.')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    })
  }

  return (
    <div className={styles.page}>
      <Text className={styles.logo}>S-Planned</Text>

      <Card className={styles.card}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <Text size={500} weight="semibold">Welcome back</Text>

          {serverError && (
            <MessageBar intent="error">
              <MessageBarBody>{serverError}</MessageBarBody>
            </MessageBar>
          )}

          <Field
            label="Work email"
            required
            validationMessage={form.formState.errors.email?.message}
            validationState={form.formState.errors.email ? 'error' : 'none'}
          >
            <Input
              type="email"
              placeholder="you@company.com"
              {...form.register('email')}
            />
          </Field>

          <Field
            label="Password"
            required
            validationMessage={form.formState.errors.password?.message}
            validationState={form.formState.errors.password ? 'error' : 'none'}
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              contentAfter={
                <Button
                  appearance="transparent"
                  icon={showPassword ? <EyeOffRegular /> : <EyeRegular />}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  size="small"
                />
              }
              {...form.register('password')}
            />
          </Field>

          <Button
            appearance="primary"
            type="submit"
            disabled={isPending}
            icon={isPending ? <Spinner size="tiny" /> : undefined}
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>

      <Text size={200} className={styles.footer} style={{ marginTop: '16px' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: tokens.colorBrandForeground1 }}>
          Create one
        </Link>
      </Text>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/login/"
git commit -m "feat: add login page with credentials form"
```

---

## Task 20: Register Page

**Files:**
- Create: `src/app/(public)/register/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/app/(public)/register"
```

- [ ] **Step 2: Create `src/app/(public)/register/page.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import {
  Card,
  Field,
  Input,
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterValues = z.infer<typeof registerSchema>

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 56px)',
    padding: tokens.spacingHorizontalXXL,
  },
  logo: {
    fontSize: '28px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXXL,
  },
  card: { width: '100%', maxWidth: '420px' },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
  },
})

export default function RegisterPage() {
  const styles = useStyles()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  function onSubmit(values: RegisterValues) {
    setServerError(null)
    startTransition(async () => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
      })

      if (res.status === 409) {
        form.setError('email', { message: 'This email is already registered' })
        return
      }

      if (!res.ok) {
        setServerError('Registration failed. Please try again.')
        return
      }

      await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      router.push('/')
      router.refresh()
    })
  }

  return (
    <div className={styles.page}>
      <Text className={styles.logo}>S-Planned</Text>

      <Card className={styles.card}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <Text size={500} weight="semibold">Create your account</Text>

          {serverError && (
            <MessageBar intent="error">
              <MessageBarBody>{serverError}</MessageBarBody>
            </MessageBar>
          )}

          <Field
            label="Full name"
            required
            validationMessage={form.formState.errors.name?.message}
            validationState={form.formState.errors.name ? 'error' : 'none'}
          >
            <Input placeholder="Jane Smith" {...form.register('name')} />
          </Field>

          <Field
            label="Work email"
            required
            validationMessage={form.formState.errors.email?.message}
            validationState={form.formState.errors.email ? 'error' : 'none'}
          >
            <Input type="email" placeholder="you@company.com" {...form.register('email')} />
          </Field>

          <Field
            label="Password"
            required
            validationMessage={form.formState.errors.password?.message}
            validationState={form.formState.errors.password ? 'error' : 'none'}
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              contentAfter={
                <Button
                  appearance="transparent"
                  icon={showPassword ? <EyeOffRegular /> : <EyeRegular />}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  size="small"
                />
              }
              {...form.register('password')}
            />
          </Field>

          <Field
            label="Confirm password"
            required
            validationMessage={form.formState.errors.confirmPassword?.message}
            validationState={form.formState.errors.confirmPassword ? 'error' : 'none'}
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              {...form.register('confirmPassword')}
            />
          </Field>

          <Button
            appearance="primary"
            type="submit"
            disabled={isPending}
            icon={isPending ? <Spinner size="tiny" /> : undefined}
          >
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Card>

      <Text size={200} style={{ marginTop: '16px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: tokens.colorBrandForeground1 }}>
          Sign in
        </Link>
      </Text>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/register/"
git commit -m "feat: add registration page with full validation and auto sign-in"
```

---

## Task 21: Dashboard Placeholder

**Files:**
- Create: `src/app/(app)/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/page.tsx`**

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Text } from '@fluentui/react-components'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      <PageHeader title="Dashboard" />
      <div style={{ padding: '24px' }}>
        <Text size={300}>
          Welcome back, {session?.user.name}. Dashboard coming in Phase 7.
        </Text>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(app)/page.tsx"
git commit -m "feat: add dashboard placeholder page"
```

---

## Task 22: Landing Page

**Files:**
- Create: `src/app/(public)/landing/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/app/(public)/landing"
```

- [ ] **Step 2: Create `src/app/(public)/landing/page.tsx`**

```tsx
import Link from 'next/link'
import {
  Button,
  Text,
  Card,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  CheckmarkCircleRegular,
  ShieldRegular,
  DocumentRegular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `80px ${tokens.spacingHorizontalXXL} 64px`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  heroHeadline: {
    fontSize: '42px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    maxWidth: '680px',
    lineHeight: '1.2',
    marginBottom: tokens.spacingVerticalL,
  },
  heroSub: {
    maxWidth: '560px',
    marginBottom: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground2,
  },
  pillars: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalXXL,
    padding: `64px ${tokens.spacingHorizontalXXL}`,
    maxWidth: '1100px',
    margin: '0 auto',
  },
  pillarCard: {
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  industries: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: `48px ${tokens.spacingHorizontalXXL}`,
    textAlign: 'center',
  },
  industryGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    gap: tokens.spacingHorizontalXXL,
    marginTop: tokens.spacingVerticalXL,
  },
  footer: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: `32px ${tokens.spacingHorizontalXXL}`,
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  footerLinks: {
    display: 'flex',
    gap: tokens.spacingHorizontalXL,
  },
})

const PILLARS = [
  {
    icon: CheckmarkCircleRegular,
    title: 'Deliverable Management',
    description:
      'Structure your readiness program with focus areas, sub-sections, and individual deliverables. Track status, evidence, and team ownership — all in one place.',
  },
  {
    icon: ShieldRegular,
    title: 'RAID Log',
    description:
      'Capture and track Risks, Assumptions, Issues, and Dependencies with severity ratings, owners, and due dates. Link RAID items directly to the deliverables they affect.',
  },
  {
    icon: DocumentRegular,
    title: 'Executive Reports',
    description:
      'Generate detailed activity reports or slide-style executive summaries with RAG status, Gantt timelines, and key decisions. Publish with a shareable public link.',
  },
]

const INDUSTRIES = [
  'Mining & Resources',
  'Construction & Engineering',
  'Healthcare',
  'Manufacturing',
  'Aviation',
  'Legal & Fiduciary',
]

export default function LandingPage() {
  const styles = useStyles()

  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <Text className={styles.heroHeadline}>
          Plan. Track. Evidence.{' '}
          <span style={{ color: tokens.colorBrandForeground1 }}>
            Operational Readiness, Simplified.
          </span>
        </Text>
        <Text size={400} className={styles.heroSub}>
          S-Planned gives project teams in mining, construction, healthcare, and
          manufacturing a structured, evidence-based system for proving operational
          readiness before go-live.
        </Text>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/register">
            <Button appearance="primary" size="large">
              Get started free
            </Button>
          </Link>
          <Link href="/use-cases">
            <Button appearance="secondary" size="large">
              See use cases
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Pillars */}
      <section>
        <div style={{ textAlign: 'center', padding: '48px 32px 0' }}>
          <Text size={500} weight="semibold">
            Everything you need for operational readiness
          </Text>
        </div>
        <div className={styles.pillars}>
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <Card key={title} className={styles.pillarCard}>
              <Icon style={{ fontSize: 32, color: tokens.colorBrandForeground1 }} />
              <Text size={400} weight="semibold">{title}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                {description}
              </Text>
            </Card>
          ))}
        </div>
      </section>

      {/* Industry Strip */}
      <section className={styles.industries}>
        <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
          BUILT FOR REGULATED, PROJECT-INTENSIVE INDUSTRIES
        </Text>
        <div className={styles.industryGrid}>
          {INDUSTRIES.map((industry) => (
            <Text key={industry} size={300} weight="semibold">
              {industry}
            </Text>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          © 2026 S-Planned. Operational Readiness Platform.
        </Text>
        <div className={styles.footerLinks}>
          {[
            { label: 'Use Cases', href: '/use-cases' },
            { label: 'Template Gallery', href: '/template-gallery' },
            { label: 'Sign In', href: '/login' },
            { label: 'Register', href: '/register' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{ color: tokens.colorNeutralForeground2, fontSize: '14px', textDecoration: 'none' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/landing/"
git commit -m "feat: add landing page with hero, feature pillars, industry strip"
```

---

## Task 23: Use-Cases Page

**Files:**
- Create: `src/app/(public)/use-cases/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/app/(public)/use-cases"
```

- [ ] **Step 2: Create `src/app/(public)/use-cases/page.tsx`**

```tsx
import Link from 'next/link'
import { Button, Text, Card, Badge, makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: `48px ${tokens.spacingHorizontalXXL}`,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
    gap: tokens.spacingHorizontalXXL,
    marginTop: tokens.spacingVerticalXXL,
  },
  card: {
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  activities: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
  },
  cta: {
    textAlign: 'center',
    padding: `64px ${tokens.spacingHorizontalXXL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    marginTop: tokens.spacingVerticalXXXL,
    borderRadius: tokens.borderRadiusXLarge,
  },
})

const USE_CASES = [
  {
    industry: 'Mining & Resources',
    description:
      'Commissioning a new processing plant or mine shaft involves dozens of interdependent systems. S-Planned provides the structure to track pre-commissioning checks, safety sign-offs, and handover evidence across mechanical, electrical, and process teams.',
    activities: [
      'Pre-commissioning checklists',
      'Safety case evidence',
      'Equipment handover sign-offs',
      'Regulatory compliance packages',
      'Maintenance readiness verification',
    ],
  },
  {
    industry: 'Construction & Engineering',
    description:
      'Major infrastructure projects require coordinated readiness across civil, structural, and services trades. S-Planned keeps all parties aligned on what evidence is needed, who owns it, and what remains before practical completion.',
    activities: [
      'Practical completion checklists',
      'Defects register management',
      'Statutory inspection evidence',
      'Operations and maintenance manual collection',
      'Handover to building management',
    ],
  },
  {
    industry: 'Healthcare',
    description:
      'Hospital and clinic openings require meticulous preparation across clinical, facilities, and IT domains. S-Planned ensures every accreditation requirement, staff training record, and equipment certification is tracked and evidenced.',
    activities: [
      'Accreditation readiness tracking',
      'Clinical equipment commissioning',
      'Staff competency records',
      'IT and clinical systems go-live',
      'Emergency preparedness validation',
    ],
  },
  {
    industry: 'Manufacturing',
    description:
      'Factory fit-outs and production line commissioning demand precise coordination of OEM requirements, safety approvals, and quality system readiness. S-Planned gives operations teams a single source of truth before first production run.',
    activities: [
      'Production line commissioning',
      'Quality management system readiness',
      'OEM sign-off collection',
      'Environmental compliance evidence',
      'Operator training certification',
    ],
  },
]

export default function UseCasesPage() {
  const styles = useStyles()

  return (
    <div className={styles.page}>
      <Text size={500} weight="semibold" block>
        S-Planned in action
      </Text>
      <Text size={300} style={{ color: tokens.colorNeutralForeground2, marginTop: '8px' }} block>
        How teams in high-stakes industries use operational readiness planning to ensure
        safe, compliant, and successful go-lives.
      </Text>

      <div className={styles.grid}>
        {USE_CASES.map(({ industry, description, activities }) => (
          <Card key={industry} className={styles.card}>
            <Text size={400} weight="semibold">{industry}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              {description}
            </Text>
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>
              KEY READINESS ACTIVITIES
            </Text>
            <div className={styles.activities}>
              {activities.map((a) => (
                <Badge key={a} appearance="tint" color="informative" size="medium">
                  {a}
                </Badge>
              ))}
            </div>
            <div style={{ marginTop: tokens.spacingVerticalM }}>
              <Link href="/register">
                <Button appearance="primary" size="small">
                  Get started
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className={styles.cta}>
        <Text size={500} weight="semibold" block>
          Ready to bring structure to your readiness program?
        </Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground2, margin: '12px 0 24px' }} block>
          Join teams across mining, construction, healthcare, and manufacturing who use
          S-Planned to plan, track, and evidence operational readiness.
        </Text>
        <Link href="/register">
          <Button appearance="primary" size="large">
            Start for free
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/use-cases/"
git commit -m "feat: add use-cases page with four industry cards"
```

---

## Task 24: Dev Seed Script

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create `prisma/seed.ts`**

```ts
import { PrismaClient, MemberRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Platform admin user ────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@splanned.dev' },
    update: {},
    create: {
      email: 'admin@splanned.dev',
      name: 'Platform Admin',
      passwordHash: adminHash,
    },
  })

  // ── Test organisation ──────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-mining' },
    update: {},
    create: { name: 'Acme Mining Co', slug: 'acme-mining' },
  })

  // ── Seed users with roles ──────────────────────────────────────────────────
  const SEED_USERS: { email: string; name: string; role: MemberRole }[] = [
    { email: 'owner@acme.dev',  name: 'Alex Owner',   role: 'owner'  },
    { email: 'admin@acme.dev',  name: 'Sam Admin',    role: 'admin'  },
    { email: 'member@acme.dev', name: 'Morgan Member', role: 'member' },
    { email: 'viewer@acme.dev', name: 'Taylor Viewer', role: 'viewer' },
  ]

  const password123 = await bcrypt.hash('password123', 12)

  for (const { email, name, role } of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, passwordHash: password123 },
    })

    await prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: {},
      create: { organizationId: org.id, userId: user.id, role },
    })
  }

  console.log('✅ Seed complete')
  console.log(`   Org: ${org.name} (slug: ${org.slug})`)
  console.log(`   Users: ${SEED_USERS.map((u) => u.email).join(', ')}`)
  console.log('   All passwords: password123 (except admin@splanned.dev: admin123)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Run the seed**

```bash
npx prisma db seed
```

Expected output:
```
✅ Seed complete
   Org: Acme Mining Co (slug: acme-mining)
   Users: owner@acme.dev, admin@acme.dev, member@acme.dev, viewer@acme.dev
   All passwords: password123 (except admin@splanned.dev: admin123)
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add idempotent dev seed (org, users, memberships)"
```

---

## Task 25: End-to-End Smoke Test

Verify all Phase 1 exit criteria manually.

- [ ] **Step 1: Start Postgres (if not running)**

```bash
docker compose up -d
```

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: `▶ Local: http://localhost:3000`

- [ ] **Step 3: Verify public routes are accessible without a session**

Visit these URLs in a browser — none should redirect to login:
- `http://localhost:3000/landing` — landing page with hero, pillars, industry strip
- `http://localhost:3000/use-cases` — four industry use-case cards
- `http://localhost:3000/login` — login form
- `http://localhost:3000/register` — registration form

- [ ] **Step 4: Verify protected routes redirect to login**

Visit `http://localhost:3000/` without being logged in.
Expected: redirected to `http://localhost:3000/login?callbackUrl=%2F`

- [ ] **Step 5: Register a new account**

1. Go to `http://localhost:3000/register`
2. Fill in: Name = "Test User", Email = "test@example.com", Password = "password123"
3. Click "Create account"
Expected: redirected to `http://localhost:3000/` (dashboard placeholder)
Expected: sidebar visible with nav items, user name in sidebar footer

- [ ] **Step 6: Verify sidebar renders correctly**

Check the authenticated app:
- Sidebar shows all 7 nav items (Dashboard active)
- User name "Test User" in sidebar footer
- Org name in sidebar footer (e.g., "Test User's Organization")
- Collapsing the sidebar narrows it to icon-only

- [ ] **Step 7: Log out**

In browser console run: `await fetch('/api/auth/signout', { method: 'POST' })` then refresh.
Or navigate to `http://localhost:3000/api/auth/signout`.
Expected: redirected to `/login`.

- [ ] **Step 8: Log in with seed user**

1. Go to `http://localhost:3000/login`
2. Email = `owner@acme.dev`, Password = `password123`
3. Click "Sign in"
Expected: redirected to `/`, sidebar shows "Alex Owner" and "Acme Mining Co"

- [ ] **Step 9: Verify wrong credentials shows error**

1. Go to `http://localhost:3000/login`
2. Email = `owner@acme.dev`, Password = `wrongpassword`
Expected: red MessageBar "Incorrect email or password" — no redirect

- [ ] **Step 10: Run type-check and lint**

```bash
npm run type-check && npm run lint
```

Expected: no errors, no warnings.

- [ ] **Step 11: Run all tests**

```bash
npm test
```

Expected: all tests pass — `slugify.test.ts` (7), `tenant-context.test.ts` (3), `route.test.ts` (5).

- [ ] **Step 12: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — foundation, auth, app shell, marketing pages"
```

---

## Self-Review Notes

- **Spec coverage:** All 6 exit criteria are covered: ✅ docker+dev ✅ public routes ✅ register+org ✅ login ✅ app shell ✅ logout
- **Type consistency:** `withTenant<T>` signature is consistent across Tasks 9 and 18. `authOptions` export used in Tasks 11, 13, 18, 21. `AppShell` `orgName` prop added in Task 18 is consistent with Task 17's update.
- **RLS note:** The `organization_memberships` table has RLS enabled. Task 18's `prisma.organization.findUnique` runs outside `withTenant()` — this is intentional since `organizations` table does NOT have RLS (it is the tenant, not a tenant-scoped table). Only tables with `organization_id` get RLS.
- **NextAuth adapter note:** The `User.image` field (not `avatarUrl`) is required by `@next-auth/prisma-adapter`. The `session` callback maps `user.image` → `session.user.avatarUrl`. This is noted in Task 11.
- **SidebarContext mobile:** The resize listener in `SidebarContext` sets state to `'drawer'` on mobile but the `Sidebar` component doesn't render a Fluent `Drawer` — it just hides. A hamburger trigger in `PageHeader` is wired via `onMenuClick` prop but the Drawer overlay is not yet implemented. This is acceptable for Phase 1 (desktop + tablet focus) and can be added as a follow-up.
