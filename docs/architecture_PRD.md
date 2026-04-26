__S\-Planned__

Technical Architecture PRD

*Version 0\.2  •  Draft  •  26 April 2026*

__Companion document to: S\-Planned Product Requirements Document \(s\-planned\-PRD\.md\)__

This document defines the technical architecture, infrastructure decisions, and

cross\-cutting implementation patterns required to build S\-Planned\. It does not

restate feature specifications — refer to the Product PRD for those details\.

# __1\. Purpose & Scope__

This document defines the technical architecture for S\-Planned, a multi\-tenant Operational Readiness Planning \(ORP\) SaaS platform\. It covers the full technology stack, data layer patterns, authentication architecture, file storage, email delivery, real\-time communication, background processing, deployment options, and security model\.

All decisions are made to prioritise low operational maintenance at launch scale \(<50 tenants, <10k users\) while keeping every major component substitutable for enterprise\-grade alternatives as the platform grows\.

# __2\. Design Principles__

- __Low maintenance — prefer hosted/managed services over self\-operated infrastructure__
- __Substitutability — every external dependency is hidden behind an interface or adapter__
	- Auth: NextAuth\.js today → Clerk or Auth0 via interface swap
	- Email: platform SMTP adapter → per\-tenant SMTP config \(pluggable EmailService\)
	- Storage: local disk adapter → S3\-compatible object storage via StorageService
	- DB: Prisma abstracts provider — swap connection string to change DB
- __Postgres\-native — use the DB engine as a platform, not just a store__
	- RLS for tenant isolation, triggers for audit logs, pg\_notify for realtime, JSONB for config
- __Security by default — RLS enforced at DB level, auth checked at every API boundary__
- __Public/private separation — unauthenticated routes are explicit and minimal__

# __3\. Confirmed Tech Stack__

__Layer__

__Choice__

__Notes__

__Frontend__

Next\.js 14\+ \(App Router\)

SSR, API routes, full\-stack in one repo

__Styling__

Fluent UI v9 \(@fluentui/react\-components\) \+ Tailwind CSS \(layout only\)

Enterprise\-grade accessible component library; Tailwind for page layout and spacing only\. Design guidelines: docs/design/design\-guidelines\.md

__API Style__

REST \(Next\.js Route Handlers\)

Standard, broad tooling, easy to document and test

__ORM / DB Layer__

Prisma

Type\-safe queries, schema\-driven migrations, DB\-agnostic

__Database__

Postgres — Neon or Dokploy local

Serverless \(Neon\) or self\-hosted — same schema and code

__Connection Pool__

PgBouncer or Neon pooler

Prevents connection exhaustion under concurrent load

__Auth__

NextAuth\.js

Pluggable — swap to Clerk / Auth0 without logic changes

__SSO__

NextAuth\.js SAML/OIDC adapters

SAML \+ OIDC per\-tenant; Azure, Okta, Google presets

__Realtime__

pg\_notify \+ SSE

Native Postgres pub/sub — no additional broker required

__Email__

Nodemailer \(per\-tenant SMTP\)

Each tenant configures own SMTP; platform fallback for invites

__File Storage__

StorageService adapter

Local disk \(dev/self\-hosted\) or S3\-compatible \(cloud\)

__Background Jobs__

node\-cron or pg\_cron

Invite expiry, due date reminders, weekly digest

__Validation__

Zod

Shared schemas between client and server

__Deployment__

Vercel \+ Neon  OR  Dokploy VPS

Same codebase — only env vars differ between options

# __4\. Data Layer Architecture__

## __4\.1 Prisma as the Abstraction Layer__

Prisma sits between Next\.js Route Handlers and Postgres, providing type\-safe query building, schema\-driven migrations, and a provider\-agnostic connection model\. Switching database provider requires only changing the provider field in schema\.prisma and updating DATABASE\_URL\.

Request data flow:

- Next\.js Route Handler  →  Tenant Middleware  →  Prisma Client  →  PgBouncer  →  Postgres

## __4\.2 Row\-Level Security \(RLS\) for Tenant Isolation__

All tenant\-scoped tables include a non\-nullable, indexed organization\_id column\. Postgres RLS policies filter every query to rows belonging to the active tenant\. Enforcement is at the database engine level — application code cannot bypass it without explicitly using the superadmin DB role\.

__CRITICAL: Prisma \+ RLS Session Variable Requirement__

Prisma does not set the Postgres session variable that RLS policies depend on\.

Without it, RLS blocks all queries or returns no rows\.

Every tenant\-scoped request must execute before any query:

    SET app\.current\_tenant\_id = '<organization\_uuid>';

Implementation — Prisma $extends middleware:

  1\. Extract organization\_id from the validated session / JWT claim

  2\. Execute SET app\.current\_tenant\_id via prisma\.$executeRaw\(\)

  3\. Run the intended Prisma query within the same connection

  4\. Wrap this in a TenantContext utility used by every Route Handler

Platform \(superadmin\) routes use a separate Postgres role that has RLS BYPASS\.

Never expose the superadmin DB role connection string to tenant\-facing code\.

## __4\.3 Postgres Features in Use__

__Feature__

__How It Is Used__

__Module\(s\)__

__Row\-Level Security__

organization\_id isolation on every tenant\-scoped table

All modules

__Triggers__

Auto\-write AuditEvent rows on INSERT / UPDATE / DELETE

Audit Log

__pg\_notify / LISTEN__

Real\-time push to SSE stream when notification row created

Notifications

__JSONB columns__

Tenant config, SSO settings, SMTP config, notification prefs

Tenant Settings

__Indexes__

Composite indexes on \(organization\_id, status\), \(organization\_id, created\_at\)

All list queries

__UUID primary keys__

All entities use UUID — safe to expose in URLs and share tokens

All entities

## __4\.4 Prisma \+ pg\_notify Boundary__

Prisma manages all CRUD operations\. The pg\_notify boundary works as follows:

- NOTIFY — use prisma\.$executeRaw\(Prisma\.sql\`SELECT pg\_notify\($\{channel\}, $\{payload\}\)\`\)
- LISTEN — use the raw pg Node\.js driver; Prisma has no LISTEN API
- Encapsulate both in a NotificationService class — no other code touches the raw driver

## __4\.5 Key Schema Patterns__

The following patterns apply consistently across all entities:

- id: UUID, default generated — used in all public URLs
- organization\_id: UUID FK, non\-nullable, indexed — RLS column on all tenant\-scoped tables
- created\_at / updated\_at: timestamptz, auto\-managed by Prisma @updatedAt
- Soft\-delete not used by default — hard delete with audit trail is sufficient
- JSONB config columns \(settings, metadata\) for schema\-free extension without migrations
- Share tokens \(e\.g\. Report\.shareToken\) are UUIDs — unguessable, revocable

# __5\. Multi\-Tenancy Model__

## __5\.1 Tenant \(Organisation\) Structure__

- Each organisation has a unique UUID \(id\) and a unique slug used in human\-readable URLs
- All tenant data is isolated via RLS using organization\_id
- A platform\-level schema \(no RLS\) holds: organisations, platform billing, superadmin users
- Users may belong to multiple organisations with independent roles per organisation
- The active organisation is stored in the session; switcher UI allows changing it

## __5\.2 User Roles — Four\-Role RBAC__

Roles are scoped per organisation\. A user can hold different roles in different organisations\.

__Role__

__Permissions__

__Constraints__

__owner__

All permissions — identical to admin plus cannot be removed or have role changed

One owner minimum per org; non\-removable

__admin__

All data access within org; manage members, settings, invites

Tenant\-scoped

__member__

Create and edit projects, deliverables, RAID items, templates, stakeholders

Tenant\-scoped

__viewer__

Read\-only access to all org data

Tenant\-scoped

__Platform Admin__

Cross\-tenant access, tenant creation, impersonation — bypasses RLS

Platform only — separate DB role

__RLS and Role Enforcement__

RLS enforces tenant boundary \(which org's data is visible\)\.

Application middleware enforces role permissions \(what the user may do within that org\)\.

Both layers are always active — RLS is never the sole security control\.

# __6\. Authentication Architecture__

## __6\.1 Primary Authentication — NextAuth\.js__

- Email \+ password credentials \(hashed with bcrypt, never stored plaintext\)
- OAuth providers \(Google, GitHub\) via NextAuth\.js built\-in adapters
- Server\-managed sessions \(not client\-side JWT alone\) stored in the database via Prisma adapter
- Session payload: user identity, current organization\_id, role within that organisation
- Switching organisations updates session context; all subsequent queries use new org RLS

## __6\.2 SSO / Identity Provider \(Per\-Tenant, Optional\)__

Each organisation can configure its own SSO provider, stored encrypted in OrganizationSettings JSONB\. This is an enterprise feature enabled per tenant\.

__Protocol__

__Supported Providers__

__Configuration Fields__

__SAML__

Azure Entra ID, Okta, Google Workspace, Custom

Entity ID, SSO URL, X\.509 Certificate

__OIDC__

Azure Entra ID, Okta, Google Workspace, Custom

Tenant ID, Client ID, Client Secret

- Auto\-provisioning toggle: create an org member account on first successful SSO login
- Test\-connection endpoint validates SSO config before saving
- SSO config stored encrypted as JSONB in OrganizationSettings — never in plaintext
- NextAuth\.js custom provider adapter handles both SAML and OIDC flows
- Fallback to email/password always available unless explicitly disabled by org admin

## __6\.3 Public Routes \(No Authentication Required\)__

The following routes are explicitly unauthenticated\. All other routes redirect to /login:

__Route__

__Purpose__

__/landing__

Public marketing page

__/use\-cases__

Public use\-case showcase

__/template\-gallery__

Public pre\-built template showcase \(acquisition tool\)

__/login__

Login page

__/register__

New user registration

__/r/\[token\]__

Shared report — token\-based public read access

__/invite/\[token\]__

Invite acceptance — public but token\-gated

__/api/auth/\[\.\.\.nextauth\]__

NextAuth\.js handler

## __6\.4 Route Protection Pattern__

- Next\.js middleware intercepts all requests and validates session before rendering
- API Route Handlers validate session and extract org context on every request
- Role checks are applied at the Route Handler level \(not only in the UI\)
- Shared report routes \(/r/\[token\]\) validate the shareToken against the Report table — no session required
- Invite routes \(/invite/\[token\]\) validate token and expiry before rendering

# __7\. Email Architecture__

## __7\.1 Two\-Tier Email Model__

Email delivery is split into two tiers to support both platform operations and per\-tenant customisation:

__Tier__

__Provider__

__Used For__

__Platform email__

Resend or Nodemailer \(env\-configured\)

Invite emails sent before tenant SMTP is configured; platform alerts

__Per\-tenant email__

Tenant's own SMTP \(stored in OrganizationSettings\)

All org\-level notifications: @\-mentions, reminders, digests, RAID alerts

## __7\.2 EmailService Adapter Pattern__

All email sending routes through an EmailService interface with two concrete implementations\. This keeps calling code identical regardless of which tier is active:

__EmailService interface:__

  send\(\{ to, subject, html, text \}\): Promise<void>

__Implementations:__

  PlatformEmailAdapter  — uses platform SMTP / Resend credentials from env vars

  TenantEmailAdapter    — uses SMTP config from OrganizationSettings JSONB

__Selection logic:__

  If org has valid SMTP config → TenantEmailAdapter

  Otherwise → PlatformEmailAdapter \(fallback\)

## __7\.3 Email Trigger Events__

__Trigger__

__Email Type__

__Admin creates an invite__

Invite link email → invitee \(platform tier\)

__Note added with @\-mention__

Mention notification → mentioned person \(tenant tier\)

__Deliverable due date approaching__

Reminder → assignee \(tenant tier, if reminders enabled\)

__New RAID item created or status changes__

RAID alert → relevant team \(tenant tier, if alerts enabled\)

__Weekly digest schedule \(cron\)__

Summary email → all org members \(tenant tier, if digest enabled\)

__Test connection \(Settings > Email tab\)__

Test email to admin \(tenant tier\)

# __8\. File Storage Architecture__

## __8\.1 StorageService Adapter Pattern__

Evidence files \(documents, images, email files\) are stored via a StorageService interface with swappable backends\. The backend is configurable per organisation in Settings > Storage\.

__Backend__

__When Used__

__Config Source__

__Local disk__

Development, self\-hosted \(Dokploy\)

STORAGE\_PATH env var

__S3\-compatible__

Cloud deployment \(Neon \+ Vercel\)

OrganizationSettings JSONB \(endpoint, key, secret, bucket\)

__StorageService interface:__

  upload\(file, path\): Promise<\{ url: string \}>

  delete\(path\): Promise<void>

  getSignedUrl\(path, expiresIn\): Promise<string>

Implementations: LocalStorageAdapter, S3StorageAdapter \(compatible with MinIO, Cloudflare R2, AWS S3\)

## __8\.2 Upload API Endpoint__

- Route: POST /api/upload
- Validates: session \(must be authenticated\), file type \(allowlist\), file size \(configurable max, default 50MB\)
- Determines storage backend from org settings, delegates to StorageService
- Returns: \{ url, name, type, size \} — stored in the Evidence table
- Email file parsing: \.eml and \.msg files are parsed server\-side to extract sender metadata
- Files are namespaced by organization\_id/project\_id/deliverable\_id/filename to prevent collisions

# __9\. Notification Architecture__

## __9\.1 Notification Channels__

__Channel__

__Phase__

__Mechanism__

__In\-app bell__

Phase 1

pg\_notify → SSE stream → React state

__Email__

Phase 1

EmailService adapter \(platform or tenant SMTP\)

__SMS / Push__

Phase 2

NotificationChannel interface — pluggable, no core changes

## __9\.2 Real\-time Delivery via pg\_notify \+ SSE__

- When a Notification row is created, a Postgres trigger fires NOTIFY on channel org:\{organization\_id\}
- A Next\.js Route Handler at /api/notifications/stream opens an SSE connection
- The handler LISTENs on the org channel using the raw pg driver \(not Prisma\)
- Frontend EventSource subscribes to /api/notifications/stream on login
- On NOTIFY event, frontend updates unread bell count and prepends to notification list
- Fallback: 30\-second polling if SSE connection drops or is unsupported

__pg\_notify channel naming convention:__

  org:\{organization\_id\}                — tenant\-level events \(notifications, settings changes\)

  project:\{project\_id\}                 — project\-level events \(deliverable updates\)

SSE connection is authenticated — session validated before LISTEN is established\.

Connection is closed and re\-opened on organization switch\.

## __9\.3 Notification Preferences \(JSONB\)__

Per\-user, per\-org preferences stored in OrganizationSettings and user\-level JSONB:

- email\_notifications \(bool\) — all email notifications on/off for the org
- deliverable\_reminders \(bool\) — due date approaching alerts
- raid\_alerts \(bool\) — new RAID item or status change alerts
- weekly\_digest \(bool\) — summary email every Monday

# __10\. Background Job Architecture__

## __10\.1 Job Runner__

S\-Planned requires lightweight scheduled jobs\. Two options are supported depending on deployment:

__Option__

__When Used__

__Notes__

__node\-cron \(in\-process\)__

Vercel \+ Neon deployment

Runs within Next\.js server process; simple, no extra infra

__pg\_cron \(Postgres\-native\)__

Dokploy / self\-hosted

Jobs defined in SQL, runs inside Postgres; survives app restarts

## __10\.2 Scheduled Jobs__

__Job__

__Schedule__

__Action__

__Invite expiry cleanup__

Daily at 02:00

Set status = expired on Invites past expiresAt

__Deliverable due date reminder__

Daily at 07:00

Email assignees of deliverables due within 48 hours

__RAID overdue check__

Daily at 07:00

Flag RAID items past due date and not closed

__Weekly digest__

Monday at 08:00

Send weekly summary email to all org members \(if enabled\)

__Report access log pruning__

Monthly

Remove ReportAccess records older than 12 months

# __11\. Audit Log Architecture__

## __11\.1 AuditEvent Table__

Every significant mutation on the platform creates an immutable AuditEvent row\. Events are written by Postgres triggers \(for DB\-level changes\) and by application code \(for higher\-level actions\)\.

- Fields: id, organization\_id, project\_id \(nullable\), deliverable\_id \(nullable\), raid\_item\_id \(nullable\)
- actor\_id \(user UUID\), actor\_name \(denormalised string for display\), action \(event type key\)
- description \(human\-readable\), metadata \(JSONB — before/after snapshots, extra context\)
- created\_at \(timestamptz, immutable — no updated\_at on this table\)

## __11\.2 Trigger vs Application Events__

__Source__

__Event Types__

__Postgres trigger \(automatic\)__

Row INSERT / UPDATE / DELETE on: DeliverableExecution, RAIDItem, Evidence, CriteriaCompletion

__Application code \(explicit\)__

User login, invite sent/accepted, role changed, report published, SSO configured, SMTP tested

## __11\.3 Audit Log Retention__

- AuditEvent rows are immutable — no UPDATE or DELETE permitted \(enforced via trigger\)
- Default retention: indefinite at launch \(revisit at scale\)
- Tenant Admins and above can query their own org's audit events via the Activity Feed and Reports
- Platform Admin can query across all orgs

# __12\. Report Sharing Architecture__

## __12\.1 Share Token Model__

- Each published Report has a shareToken \(UUID v4, generated on publish\)
- Public route /r/\[token\] validates token against Report table — no session required
- Token can be revoked by unpublishing the report \(status back to draft, token cleared\)
- Access is logged in ReportAccess: accessedAt, ipAddress, userAgent, viewer identity if available
- View count is computed from ReportAccess and surfaced on the report card

## __12\.2 Security Considerations__

- Tokens are UUID v4 — 122 bits of entropy — not guessable by enumeration
- No authentication required but rate limiting is applied to /r/\[token\] routes
- Report content is a snapshot — changing project data after publishing does not alter the shared report
- Sensitive org data \(SMTP credentials, SSO secrets\) is never included in report snapshots

# __13\. Module Architecture Reference__

Each module maps to a set of Route Handlers, Prisma schema models, and Postgres features\. This table cross\-references the Product PRD sections with their technical implementation approach\.

__Module \(Product PRD §\)__

__Key Technical Components__

__Postgres Features Used__

__Auth & SSO \(§5\)__

NextAuth\.js \+ custom SAML/OIDC adapter; encrypted JSONB config

RLS bypass for session setup; JSONB for IdP config

__Multi\-Tenancy \(§6\)__

organization\_id RLS; TenantContext middleware; org switcher in session

RLS policies; SET session variable via Prisma middleware

__Projects & Deliverables \(§7\.2–7\.4\)__

Prisma CRUD; status machine; bulk update Route Handler

RLS; triggers for AuditEvent on status change

__RAID Log \(§7\.5\)__

Prisma CRUD; M:N join to DeliverableExecution; overdue cron job

RLS; partial index on \(org\_id, status\) for open items

__Decision Log \(§7\.6\)__

Prisma CRUD; included in Report snapshot at publish time

RLS; trigger for AuditEvent

__Templates \(§7\.7–7\.8\)__

Hierarchical CRUD; clone operation \(deep copy\); public gallery route

RLS \(org templates\); null org\_id for global/shared templates

__Stakeholders \(§7\.9\)__

Prisma CRUD for Person \+ Vendor; M:N link to DeliverableExecution

RLS on Person and Vendor tables

__Evidence & Criteria \(§7\.4\)__

StorageService adapter; upload Route Handler; email parser for \.eml/\.msg

RLS; trigger for AuditEvent on evidence verify

__Notifications \(§7 \+ §9\)__

NotificationService; pg\_notify trigger; SSE stream; EmailService adapter

pg\_notify; JSONB preferences; triggers

__Analytics \(§7\.10\)__

Aggregate queries via Prisma \+ raw SQL for trend charts; org\-scoped

RLS; composite indexes for performance

__Reports \(§7\.11\)__

Snapshot builder; ReportSection JSON content; shareToken; ReportAccess log

RLS; JSONB section content; UUID share token

__Tenant Settings \(§7\.12\)__

JSONB config; SMTP test endpoint; SSO test endpoint; storage test endpoint

JSONB on OrganizationSettings; RLS

__Invite System \(§7\.13\)__

UUID token; expiry via cron; acceptance flow for new \+ existing users

RLS; token lookup without RLS \(invite acceptance is public\)

__Audit Log \(§9\)__

AuditEvent table; Postgres triggers; immutability enforced via trigger

Triggers; JSONB metadata; no UPDATE/DELETE on AuditEvent

__Platform Admin__

Separate DB role bypassing RLS; cross\-tenant queries; impersonation token

RLS BYPASS role; superadmin schema

# __14\. Deployment Options__

## __Option A — Vercel \+ Neon \(Recommended for Launch\)__

- Next\.js app deployed to Vercel — zero config, automatic preview deployments per PR
- Postgres on Neon — serverless, scale\-to\-zero, database branching for feature/staging environments
- Neon's built\-in connection pooler replaces PgBouncer
- File storage: S3\-compatible service \(Cloudflare R2 recommended — no egress fees\)
- Background jobs: node\-cron running in the Next\.js process
- No infrastructure to manage — ideal for <50 tenant launch scale

## __Option B — Dokploy VPS \+ Local Postgres__

- Next\.js app containerised, deployed via Dokploy on a VPS \(Hetzner, DigitalOcean, Contabo\)
- Postgres as a Docker container managed by Dokploy on the same VPS
- PgBouncer as a sidecar container for connection pooling
- Traefik handles SSL termination automatically via Dokploy
- pg\_cron extension for background jobs \(runs inside Postgres\)
- File storage: local disk volume mounted in Docker \(or MinIO sidecar for S3\-compatible API\)
- Team responsibility: Postgres backups, version upgrades, uptime monitoring

__Switching between Option A and Option B:__

  1\. Update DATABASE\_URL environment variable

  2\. Update STORAGE\_\* environment variables \(local path or S3 credentials\)

  3\. No application code changes required

Recommendation: Neon free tier for dev and staging \(DB branching per feature branch\)\.

Evaluate Dokploy only if data residency, cost, or compliance requires self\-hosting\.

# __15\. Security Model__

## __15\.1 Defence in Depth__

__Layer__

__Control__

__Database \(RLS\)__

Tenant isolation enforced at DB engine level — cannot be bypassed by app code

__Application middleware__

Session validated on every request; org context verified before any query

__Role enforcement__

Permission checks at Route Handler level \(not only in UI\)

__Input validation__

Zod schemas applied on both client and server for all inputs

__File uploads__

Type allowlist, size limit, org\-namespaced paths, virus scan hook \(Phase 2\)

__Secrets__

SSO credentials and SMTP passwords stored encrypted in JSONB — never plaintext

__Share tokens__

UUID v4 \(122 bits entropy\); rate\-limited public routes

__Invite tokens__

UUID v4; expiry enforced at acceptance and by cron cleanup

__Superadmin DB role__

Separate Postgres role with RLS BYPASS; connection string never in tenant code paths

## __15\.2 Environment Variables \(Required\)__

__Variable__

__Purpose__

__DATABASE\_URL__

Prisma connection string \(Neon or local Postgres\)

__NEXTAUTH\_SECRET__

NextAuth\.js session signing key

__NEXTAUTH\_URL__

Application base URL

__PLATFORM\_EMAIL\_\*__

Platform\-tier SMTP or Resend credentials for invite emails

__STORAGE\_BACKEND__

local or s3

__STORAGE\_PATH__

Local disk path \(Option B only\)

__S3\_ENDPOINT / S3\_KEY / S3\_SECRET / S3\_BUCKET__

S3\-compatible storage credentials \(Option A\)

__SUPERADMIN\_DATABASE\_URL__

Postgres connection using RLS\-bypass role \(platform admin only\)

__ENCRYPTION\_KEY__

AES key for encrypting SSO and SMTP credentials at rest

# __16\. Local Development Environment__

## __16\.1 Overview__

All developers run a full Postgres instance locally via Docker Compose\. This keeps development fast, fully offline\-capable, and behaviourally identical to staging and production — the only difference between environments is the DATABASE\_URL\.

## __16\.2 Docker Compose Setup__

A docker\-compose\.yml at the repository root defines the local dev stack:

\# docker\-compose\.yml

services:

  postgres:

    image: postgres:16

    environment:

      POSTGRES\_USER: splanned

      POSTGRES\_PASSWORD: splanned

      POSTGRES\_DB: splanned\_dev

    ports:

      \- "5432:5432"

    volumes:

      \- postgres\_data:/var/lib/postgresql/data

volumes:

  postgres\_data:

Local \.env\.local connection string:

DATABASE\_URL="postgresql://splanned:splanned@localhost:5432/splanned\_dev"

SUPERADMIN\_DATABASE\_URL="postgresql://splanned:splanned@localhost:5432/splanned\_dev"

STORAGE\_BACKEND=local

STORAGE\_PATH=\./uploads

NEXTAUTH\_URL=http://localhost:3000

NEXTAUTH\_SECRET=dev\-secret\-change\-in\-production

ENCRYPTION\_KEY=dev\-encryption\-key\-32\-chars\-min\!\!

## __16\.3 Developer Workflow__

- docker compose up \-d  — start Postgres in the background
- npx prisma migrate dev  — apply all migrations and generate Prisma client
- npx prisma db seed  — populate dev DB with test org, users, and sample project
- npm run dev  — start Next\.js development server on localhost:3000
- docker compose down  — stop Postgres \(data persists in Docker volume\)
- docker compose down \-v  — stop and wipe all data \(full reset\)

## __16\.4 Seed Strategy__

A seed script at prisma/seed\.ts creates a consistent starting state for every developer:

__Seed Entity__

__Details__

__Platform Admin user__

admin@splanned\.dev / password: admin123

__Test Organisation__

Acme Mining Co — slug: acme\-mining

__Owner user__

owner@acme\.dev / password: password123 — role: owner

__Admin user__

admin@acme\.dev / password: password123 — role: admin

__Member user__

member@acme\.dev / password: password123 — role: member

__Viewer user__

viewer@acme\.dev / password: password123 — role: viewer

__Sample Template__

Mining Commissioning Template — 3 focus areas, 12 deliverables

__Sample Project__

Gold Processing Plant 2026 — created from seed template, mix of statuses

__Sample RAID Items__

2 risks, 1 issue, 1 dependency — various severities

__Sample People & Vendors__

3 people, 2 vendors linked to deliverables

The seed script is idempotent — running it multiple times produces the same state \(uses upsert, not insert\)\.

## __16\.5 Local Postgres Feature Parity__

The following Postgres features used in production behave identically on local Postgres 16:

- Row\-Level Security \(RLS\) — policies applied and enforced locally
- Triggers — AuditEvent triggers fire on local mutations
- pg\_notify / LISTEN — works in local Postgres; SSE stream functions correctly with next dev
- JSONB — full support including GIN indexes
- UUID generation — gen\_random\_uuid\(\) available in Postgres 16 natively

## __16\.6 SSE / pg\_notify — Local vs Vercel Behaviour__

__Important: SSE behaviour differs between local dev and Vercel production__

Local \(next dev\):     Node\.js long\-lived process — SSE stays open indefinitely\.

                      pg\_notify \+ LISTEN works exactly as intended\.

Vercel \(production\):  Serverless functions have a max execution timeout \(300s on Pro\)\.

                      SSE streams are supported but connections close and must reconnect\.

                      EventSource API reconnects automatically — client fetches missed

                      notifications via REST on reconnect\. 30s polling as final fallback\.

Dokploy \(Option B\):   Long\-lived container — identical to local dev behaviour\.

## __16\.7 Optional Dev Tools__

- Prisma Studio — npx prisma studio; browser UI for browsing and editing local data
- TablePlus / DBeaver — desktop DB client; connect to localhost:5432 with seed credentials
- Mailpit — local SMTP catcher; captures outbound emails without sending \(docker compose override\)
- pgAdmin — browser\-based DB GUI; optional docker compose override service

\# docker\-compose\.override\.yml  \(optional local tools\)

services:

  mailpit:

    image: axllent/mailpit

    ports:

      \- "1025:1025"   \# SMTP — set PLATFORM\_EMAIL\_HOST=localhost, PORT=1025

      \- "8025:8025"   \# Web UI at http://localhost:8025

  pgadmin:

    image: dpage/pgadmin4

    environment:

      PGADMIN\_DEFAULT\_EMAIL: admin@local\.dev

      PGADMIN\_DEFAULT\_PASSWORD: admin

    ports:

      \- "5050:80"     \# pgAdmin UI at http://localhost:5050

# __17\. Open Technical Decisions__

- __Billing / subscription management — Stripe integration or manual invoicing?__
- __Full\-text search — Postgres tsvector \(free, in\-DB\) or Typesense/Algolia \(hosted\)?__
- __Rate limiting — Vercel Edge middleware \(Option A\) or custom Redis/in\-memory \(Option B\)?__
- __Audit log retention policy — indefinite or rolling window \(e\.g\. 2 years\)?__
- __Virus scanning for uploaded evidence files — ClamAV sidecar or cloud API?__
- __Organisation logo storage — same StorageService or Vercel Blob separately?__
- __node\-cron vs Vercel Cron \(serverless\) for Option A background jobs?__

*Living document — update after each architecture decision session\. Cross\-reference: s\-planned\-PRD\.md*

