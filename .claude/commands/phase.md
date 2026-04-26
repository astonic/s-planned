# .claude/commands/context.md
Load S-Planned context for Phase $ARGUMENTS.

Reference documents:
- Product PRD: docs/s-planned-PRD.md (Phase $ARGUMENTS section)
- Architecture PRD: docs/SaaS_Platform_PRD.md

Key constraints for this phase:
- All new tables need organization_id (RLS column)
- All mutations need AuditEvent creation
- Use TenantContext for every query
- Exit criteria from the Product PRD must pass before done