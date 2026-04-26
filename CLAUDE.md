# S-Planned — Operational Readiness Platform

## Reference Documents
- Product PRD: docs/s-planned-PRD.md
- Architecture PRD: docs/architecture_PRD.md
- Design Guidelines: docs/design/design-guidelines.md

## Stack
- Next.js 14+ App Router, TypeScript strict mode
- Prisma ORM → Postgres (local Docker port 5432)
- Fluent UI v9 (@fluentui/react-components) + Tailwind CSS (layout only), NextAuth.js

## Dev Commands
- `docker compose up -d` → start Postgres
- `npm run dev` → localhost:3000
- `npx prisma migrate dev` → apply migrations
- `npx prisma db seed` → seed dev data
- `npm run type-check && npm run lint` → must pass before commit

## Non-Negotiable Rules
- ALL tenant queries go through TenantContext middleware
- ALWAYS SET app.current_tenant_id before any Prisma query
- NEVER expose SUPERADMIN_DATABASE_URL in tenant-facing code
- StorageService adapter for all file ops — no direct lib imports
- EmailService adapter for all email — no direct nodemailer imports
- All new tables need organization_id column (RLS)
- All mutations need AuditEvent creation

## Fluent UI + Server Components
- NEVER import `@fluentui/react-components` or `@fluentui/react-icons` in server component `page.tsx` or `layout.tsx` files — they use `createContext` internally which crashes at runtime
- If a server page needs Fluent UI buttons/icons in the header actions, extract them into a thin `'use client'` component (e.g. `_components/PageActions.tsx`) and pass it as a prop
- `makeStyles`, `tokens`, `Accordion`, `Button`, `Badge`, `Dialog`, `Spinner` — all require `'use client'`
- Server components may only pass primitive props (strings, numbers, plain objects) to client components — never JSX constructed with Fluent UI

## Auth
- NextAuth uses `strategy: 'jwt'` — CredentialsProvider is incompatible with `strategy: 'database'`
- JWT callback enriches the token with `currentOrganizationId` and `role` on authorize
- Session callback reads from `token`, not `user`
- Demo accounts: `admin@example.com` / `member@example.com` / `viewer@example.com` (password: `password123`) — seeded via `npx prisma db seed`

## Key Files (once created)
- `src/lib/tenant-context.ts` — RLS middleware, critical
- `src/lib/db.ts` — Prisma singleton
- `prisma/schema.prisma` — source of truth for data model