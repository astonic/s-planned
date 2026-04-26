# S-Planned — Recommended Claude Code Skills to Add

**Date:** April 26, 2026

This document recommends skills to create in the `.claude/plugins` or `superpowers` system to accelerate S-Planned development with Fluent UI v9 and the patterns defined in `design-guidelines.md`.

---

## Skills to Create

### 1. `fluent-component` (High Priority)

**Purpose:** Generate correctly-structured Fluent UI v9 components following S-Planned patterns.

**Triggers when:** Building any new UI component — status badge, card, dialog, form, etc.

**Should enforce:**
- Imports from `@fluentui/react-components` only
- Icons from `@fluentui/react-icons` only
- `makeStyles` for any custom CSS (never inline `style={{}}`)
- `Field` wrapper on all form inputs
- Correct `appearance` and `color` props on `Badge` per the status/severity map
- `tokens.ts` semantic aliases for colours and spacing

**Skill file location:** `.claude/plugins/s-planned/skills/fluent-component.md`

---

### 2. `fluent-data-grid` (High Priority)

**Purpose:** Scaffold Fluent `DataGrid` configurations for list pages.

**Why a dedicated skill:** Fluent's `DataGrid` API is verbose and has non-obvious patterns for:
- Multi-select with bulk actions
- Inline editable cells
- Sortable + paginated server-side data
- Row actions (edit/delete buttons in last column)
- Sticky header + virtualised rows for large datasets

**Should produce:**
- Column definition array with `createTableColumn`
- `DataGrid`, `DataGridHeader`, `DataGridBody`, `DataGridRow`, `DataGridCell` structure
- `useTableFeatures` + `useTableSort` hook wiring
- Pagination controls using Fluent `Pagination` (or custom `Button` row)
- Bulk action toolbar that appears on row selection

**Skill file location:** `.claude/plugins/s-planned/skills/fluent-data-grid.md`

---

### 3. `fluent-dialog-form` (High Priority)

**Purpose:** Generate create/edit dialog forms with validation wiring.

**Why a dedicated skill:** Every RAID item, decision, stakeholder, deliverable, and template entry in S-Planned uses a dialog form. Getting the pattern right (Field + Zod + server action + optimistic update) is repetitive and error-prone.

**Should produce:**
- `Dialog` / `DialogSurface` / `DialogBody` scaffold
- `useForm` (react-hook-form) + Zod schema wiring
- `Field` with `validationMessage` wired to form errors
- Submit handler calling the appropriate server action
- Toaster feedback on success/error
- Loading state on the submit button (`pending` from `useFormStatus`)

**Skill file location:** `.claude/plugins/s-planned/skills/fluent-dialog-form.md`

---

### 4. `s-planned-module` — enhance existing `new-module` command (Medium Priority)

**Current state:** `.claude/commands/new-module.md` exists but may not include Fluent or S-Planned-specific patterns.

**Update to include:**
- Fluent component scaffolding per `design-guidelines.md`
- TenantContext middleware call in every new Route Handler
- AuditEvent creation in every mutation
- Zod schema co-located with the form component
- RLS-compliant Prisma queries (with `organization_id` filter as fallback safeguard)

---

### 5. `raid-item` (Medium Priority)

**Purpose:** Specific to the RAID log — a common, complex entity with severity/likelihood/type combos.

**Should produce:**
- Fluent `DataGrid` rows with inline severity/status editing
- RAID severity badge using the correct colour token map
- Overdue row highlight logic
- RAID item create/edit dialog with all 8 fields wired

---

### 6. `recharts-fluent` (Lower Priority — needed for Phase 8)

**Purpose:** Generate Recharts chart components that use Fluent colour tokens.

**Why:** Recharts uses its own colour strings. Without this skill, chart colours will be hardcoded hex values that don't respect the theme or high-contrast mode.

**Should produce:**
- `useThemeTokens()` hook that reads Fluent token values at runtime
- Pre-wired `BarChart`, `PieChart`, `AreaChart` components using those token values
- Axis formatting consistent with Fluent `Text` typography scale

---

## Existing Skills That Already Apply

These skills from the superpowers system apply directly to S-Planned without modification:

| Skill | When to use |
|-------|-------------|
| `superpowers:brainstorming` | Before any new feature or module |
| `superpowers:writing-plans` | After brainstorming, before implementation |
| `superpowers:test-driven-development` | Every feature implementation |
| `superpowers:systematic-debugging` | Any bug or unexpected behaviour |
| `superpowers:verification-before-completion` | Before claiming any task done |
| `db-migrate` | Any Prisma schema change |
| `new-module` | New feature module scaffold (update per #4 above) |
| `frontend-design` | Only for public/marketing pages (landing, use-cases, gallery) where Fluent restraint is relaxed |

---

## Skill Creation Priority Order

1. `fluent-component` — used in every phase from Phase 1 onward
2. `fluent-dialog-form` — used from Phase 2 (templates) onward
3. `fluent-data-grid` — used from Phase 3 (deliverables workspace) onward
4. Update `new-module` command — used from Phase 3 onward
5. `raid-item` — Phase 4
6. `recharts-fluent` — Phase 8

---

*Create skills before the phase that first needs them, not all upfront.*
