Build a new S-Planned module for: $ARGUMENTS

Follow this checklist:
1. Add Prisma schema models with organization_id (RLS column)
2. Create Prisma migration with `prisma migrate dev`
3. Create Route Handler in src/app/api/ — wrap all queries in TenantContext middleware
4. Add Zod validation schemas co-located with forms
5. Create page component in src/app/ using Fluent UI v9 components (see docs/design/design-guidelines.md)
   - Tables: use `/fluent-data-grid` skill
   - Create/edit dialogs: use `/fluent-dialog-form` skill
   - Status badges: use Fluent `Badge` with colour tokens from design guidelines §6
   - Icons: `@fluentui/react-icons` only — never Lucide or other libraries
6. Add AuditEvent creation for all mutations
7. Add sidebar nav entry in AppShell if this is a top-level page
8. Update CLAUDE.md if new patterns are introduced
