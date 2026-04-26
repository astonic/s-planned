# Phase 1 — Foundation & Authentication
# Design Specification

**Date:** 2026-04-26  
**Status:** Approved  
**Stack:** Next.js 14+ App Router · Prisma · Postgres 16 · Fluent UI v9 · NextAuth.js  
**Companion:** docs/s-planned-PRD.md §10 Phase 1, docs/architecture_PRD.md

---

## Exit Criteria

A user can:
1. Run `docker compose up -d && npm run dev` locally with zero manual config
2. Visit `/landing` and `/use-cases` as unauthenticated pages
3. Register a new account → organisation auto-created → redirected to app shell
4. Log in with email + password
5. See the authenticated app shell: sidebar, page header, dashboard placeholder
6. Log out and be redirected to `/login`

---

## Decisions Made

| Question | Decision |
|---|---|
| OAuth providers | Email + password only in Phase 1 |
| Marketing pages | Real copy and content — not placeholder shells |
| Multi-org session | `currentOrganizationId` in session from day one; switcher UI deferred to Phase 13 |
| Deployment target | Local dev only (Docker + Postgres + `npm run dev`) |
| Component library | Fluent UI v9 (`@fluentui/react-components`); Tailwind for layout only |
| Layout architecture | Next.js App Router route groups: `(public)`, `(app)`, token-gated routes at root |

---

## 1. File Structure

```
s-planned/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx          ← FluentProvider, no sidebar
│   │   │   ├── landing/page.tsx
│   │   │   ├── use-cases/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx          ← FluentProvider + AppShell, session required
│   │   │   └── page.tsx            ← dashboard placeholder
│   │   ├── r/[token]/              ← reserved for Phase 9
│   │   ├── invite/[token]/         ← reserved for Phase 11
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── auth/register/route.ts
│   │   ├── layout.tsx              ← root: html, body, font only
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── PageHeader.tsx
│   │   └── ui/                     ← shared Fluent composites (grows per phase)
│   ├── lib/
│   │   ├── db.ts                   ← Prisma singleton
│   │   ├── tenant-context.ts       ← withTenant() — RLS middleware
│   │   ├── auth.ts                 ← NextAuth options object
│   │   ├── theme.ts                ← Fluent brand theme
│   │   └── tokens.ts               ← semantic token aliases
│   ├── types/
│   │   └── next-auth.d.ts          ← Session type augmentation
│   └── middleware.ts               ← session check + redirect
├── docker-compose.yml
├── .env.local                      ← gitignored
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Database Schema

### Models

```prisma
// NextAuth adapter tables
model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  name          String?
  avatarUrl     String?
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

// Tenant
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

enum MemberRole { owner admin member viewer }

model OrganizationMembership {
  id             String       @id @default(uuid())
  organizationId String
  userId         String
  role           MemberRole
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@unique([organizationId, userId])
  @@index([organizationId])
  @@map("organization_memberships")
}
```

### RLS (added as raw SQL in initial migration)

```sql
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON organization_memberships
  USING (organization_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE organization_memberships FORCE ROW LEVEL SECURITY;
```

---

## 3. Authentication Architecture

### NextAuth Configuration (`src/lib/auth.ts`)

- Provider: `CredentialsProvider` (email + password) only
- Password hashing: `bcrypt`, cost factor 12
- Session strategy: `database` (Prisma adapter)
- `authorize()`: verify hash, return user + currentOrganizationId
- `session` callback: enrich token with `userId`, `currentOrganizationId`, `role`

### Session Type (`src/types/next-auth.d.ts`)

```ts
declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; email: string; avatarUrl: string | null }
    currentOrganizationId: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
  }
}
```

### Registration (`POST /api/auth/register`)

1. Zod validate: `{ name, email, password }`
2. Check email uniqueness
3. Hash password (`bcrypt`)
4. Create `User` → `Organization` → `OrganizationMembership` (role: owner)
5. Call `signIn('credentials')` immediately → redirect to `/`

Slug generation: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')` with numeric suffix on collision (`acme-mining` → `acme-mining-2`)

### TenantContext (`src/lib/tenant-context.ts`)

```ts
export async function withTenant<T>(
  organizationId: string,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${organizationId}`
    return fn(tx)
  })
}
```

`SET LOCAL` scopes the variable to the transaction — safe under PgBouncer connection pooling.

### Middleware (`src/middleware.ts`)

Public paths (no session check): `/landing`, `/use-cases`, `/login`, `/register`, `/r/`, `/invite/`, `/api/auth/`

All other paths: validate session token → redirect to `/login?callbackUrl=...` if missing.

`(app)/layout.tsx` performs a second server-side session check as defence-in-depth.

---

## 4. App Shell

### Layout

```
Sidebar (240px fixed) | Main (flex-1)
                      | PageHeader (56px sticky)
                      | {children} (scrollable)
```

### Sidebar (`src/components/layout/Sidebar.tsx`)

Fluent `Nav` component. Nav items:

| Label | Route | Icon |
|---|---|---|
| Dashboard | `/` | `GridRegular` |
| Projects | `/projects` | `FolderRegular` |
| Stakeholders | `/stakeholders` | `PeopleRegular` |
| Analytics | `/analytics` | `DataBarVerticalRegular` |
| Reports | `/reports` | `DocumentRegular` |
| Templates | `/templates` | `TemplateRegular` |
| Settings | `/settings` | `SettingsRegular` |

Footer: user avatar (size 32) + name + org name + org-switcher placeholder button.

Active item: derived from `usePathname()` → `selectedValue` on `Nav`.

### PageHeader (`src/components/layout/PageHeader.tsx`)

Props: `title`, optional `breadcrumb[]`, optional `actions` slot (right-aligned).
Height: 56px. Sticky. Bottom border: `colorNeutralStroke1`.

### Responsive

| Width | Behaviour |
|---|---|
| ≥ 1024px | Full sidebar (240px) |
| 768–1023px | Icon rail (48px), labels hidden, tooltips on hover |
| < 768px | Sidebar hidden, hamburger in PageHeader opens Fluent `Drawer` |

Collapse state persisted in `localStorage` via `useSidebarState()` hook.

---

## 5. Auth Pages

Both pages: Fluent `Card` centered on page, logo above card, Spinner in submit button during pending.

### Register (`/register`)

Fields: Full name · Work email · Password · Confirm password  
Validation: Zod + react-hook-form. Errors inline via Fluent `Field` `validationMessage`.  
Server errors (email taken): Fluent `MessageBar` intent="error" above form.

### Login (`/login`)

Fields: Work email · Password  
Uses `signIn('credentials', { redirect: false })` — manual error handling.  
Invalid credentials: generic `MessageBar` (no user enumeration).  
On success: redirect to `callbackUrl` or `/`.

Both pages link to each other. Password inputs have show/hide toggle.

---

## 6. Marketing Pages

Shared `(public)/layout.tsx`: minimal header (logo + "Sign in" `Button`), no sidebar.

### `/landing`

- Hero: headline ("Plan. Track. Evidence. Operational Readiness, Simplified."), subheadline, "Get started free" CTA → `/register`
- Three feature pillars: Deliverable Management · RAID Log · Executive Reports
- Industry strip: Mining · Construction · Healthcare · Manufacturing · Aviation · Legal
- Footer: links to /use-cases, /template-gallery, /login, /register

### `/use-cases`

- Four use-case cards (Mining & Resources, Construction & Engineering, Healthcare, Manufacturing)
- Each card: industry name, brief 2-sentence description, key readiness activities, "Get started" CTA
- Shared bottom CTA banner → `/register`

---

## 7. Local Dev Setup

### `docker-compose.yml`

Postgres 16, port 5432, volume `postgres_data`. Credentials: `splanned/splanned/splanned_dev`.

### `.env.local`

```
DATABASE_URL="postgresql://splanned:splanned@localhost:5432/splanned_dev"
SUPERADMIN_DATABASE_URL="postgresql://splanned:splanned@localhost:5432/splanned_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"
ENCRYPTION_KEY="dev-encryption-key-32-chars-min!!"
STORAGE_BACKEND="local"
STORAGE_PATH="./uploads"
```

### Seed (`prisma/seed.ts`)

Idempotent (upsert). Creates:
- Platform admin: `admin@splanned.dev` / `admin123`
- Org: Acme Mining Co (slug: `acme-mining`)
- owner@acme.dev · admin@acme.dev · member@acme.dev · viewer@acme.dev (all: `password123`)

---

*End of Phase 1 Design Specification*
