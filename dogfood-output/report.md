# S-Planned QA Report

Target URL: http://localhost:3000
Date: 2026-04-26
Tester: Codex

## Summary

Started the app locally at `http://localhost:3000`, seeded demo data, logged in as `admin@example.com`, and tested the highest-risk workflows. I also fixed blockers discovered during testing: the app could not compile on project creation, tenant RLS setup failed on mutations, Jest was crawling unrelated worktrees, and file path containment checks needed hardening.

Most project/workspace basics work after fixes, but several requested capabilities are missing or incomplete.

## Test Coverage

- Project creation from templates and selective template items
- Project creation with vendor/team assignment
- RAID linking to project items
- Decisions linked to project items
- Evidence upload
- Report snapshot creation and public URL sharing
- Search and sort on tables
- Vendor groups and members
- Tenant email provider configuration
- Project invitations and role management
- Button/layout consistency
- Storage provider configuration
- Progress tracking
- Multi-tenant isolation
- Security hardening review
- Inline table edits
- Bulk record updates
- Template import
- Template clone/edit
- Additional missed test steps

## Findings

### ISSUE-001: Project creation initially failed with a build error

Severity: High

Evidence: `dogfood-output/screenshots/issue-build-error-new-project.png`

Opening `/projects/new` failed because `src/lib/security.ts` had `'use server'` while exporting synchronous helper functions. Fixed by making it a normal server utility module.

### ISSUE-002: Tenant context SQL broke all tenant-scoped mutations

Severity: High

Creating a template failed with `syntax error at or near "$1"` from `SET LOCAL app.current_tenant_id = $1`. Fixed by using `SELECT set_config('app.current_tenant_id', ..., true)` and added UUID validation for tenant ids.

### ISSUE-003: Template project creation works, but item selection is missing

Severity: Medium

I created `QA Readiness Template`, added a focus area, sub-section, and deliverable, then created `QA Template Project` from it. The wizard has only template selection, project details, and confirmation; there is no step to select specific focus areas/sub-sections/deliverables.

### ISSUE-004: Project creation does not assign vendors or team members

Severity: Medium

The project wizard only accepts name, description, and dates. Vendors/people can be assigned later at deliverable level, but not during project creation.

### ISSUE-005: RAID linking to project items works

Severity: Pass

Created a RAID risk and linked it to the deliverable. The deliverable tab updated to `RAID 1` and showed an unlink action.

### ISSUE-006: Decisions are project-level only

Severity: Medium

Decision logging exists on the project Decisions tab, but the implementation has no deliverable/project-item link field. Requested “link decisions to project items” is not present.

### ISSUE-007: Evidence upload is not confirmed

Severity: Medium

The evidence dialog supports URL and file upload modes, but submitting a selected file wedged the browser automation session twice. I could not confirm a successful uploaded evidence record through the UI.

### ISSUE-008: Reports can snapshot and publish/share

Severity: Likely Pass

Source review confirms reports snapshot project analytics/RAID/decisions/evidence into sections and publish with `/r/{shareToken}` plus copy-link UI. I did not complete the browser flow after the evidence-upload session wedged.

### ISSUE-009: Search and sort exist on stakeholder tables

Severity: Partial Pass

People and Vendors tables have search fields and sortable Fluent DataGrid columns. RAID table has filter buttons and column headers, but not all tables in the app expose consistent search/sort controls.

### ISSUE-010: Vendor groups are missing

Severity: Medium

Stakeholders supports People and Vendors only. There is no vendor-group model or UI for adding members to vendor groups.

### ISSUE-011: Email and storage settings are configurable, but adapters are partial

Severity: Medium

Settings has SMTP and storage provider forms. Storage settings allow local, S3-compatible, and Azure values, but `storageService` currently always uses the local adapter and does not read tenant settings.

### ISSUE-012: Invites and role management exist at organization level

Severity: Partial Pass

Settings > Users supports invites and member role changes. Project-specific invites/roles are not present.

### ISSUE-013: Inline edits exist; bulk updates are missing

Severity: Medium

Deliverable status can be edited inline from the workspace. I found no bulk selection or bulk update controls.

### ISSUE-014: Template clone/edit exists; template import is missing

Severity: Medium

Template clone and edit actions exist. There is no template import UI/API beyond the built-in public gallery/static cards.

### ISSUE-015: Multi-tenancy isolation was improved

Severity: Security

Tenant mutations now set the transaction-scoped tenant id safely and reject invalid tenant ids. File download/storage path checks were hardened to prevent sibling-prefix traversal issues.

### Additional Test Steps To Add

- Verify viewer/member/admin permissions across every mutation.
- Test invite acceptance from a fresh browser session.
- Test public report URLs while logged out and after unpublishing.
- Test file download access across two tenants.
- Test audit-event creation for every create/update/delete action.
- Test empty states and validation errors on every dialog.
- Test mobile/tablet layouts for project workspace, reports, settings, and tables.
- Test external SMTP/storage validation with realistic failure modes.
- Test accessibility keyboard paths for dialogs, tabs, and table actions.
