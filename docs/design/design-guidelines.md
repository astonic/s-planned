# S-Planned Design Guidelines
# Microsoft Fluent UI Design System

**Version:** 1.0  
**Date:** April 26, 2026  
**Component Library:** @fluentui/react-components v9 (Fluent UI v9)  
**Layout Utilities:** Tailwind CSS (for spacing, grid, flex — not component styling)

---

## 1. Design Philosophy

S-Planned targets enterprise users in mining, manufacturing, construction, and healthcare — people who spend hours in the product each day on high-stakes planning work. The design must prioritise:

- **Clarity over decoration** — information density that doesn't feel cluttered
- **Trust through familiarity** — Fluent's visual language is already known by Microsoft 365 users in these industries
- **Professional restraint** — no gratuitous animation, no playful colours, no marketing aesthetics inside the app
- **Accessibility first** — WCAG 2.1 AA minimum; Fluent UI components meet this by default

---

## 2. Component Library

### Primary: Fluent UI v9

```
npm install @fluentui/react-components
```

Fluent UI v9 (`@fluentui/react-components`) is the primary source for all interactive components. It provides:
- Full accessibility (ARIA, keyboard nav, screen reader support) built in
- Consistent focus indicators and high-contrast mode support
- Coherent design tokens (spacing, typography, colour, motion) across all components
- Griffel CSS-in-JS styling engine — zero-runtime in production builds

**Do not use Fluent UI v8 (`@fluentui/react`).** v9 is the current, supported version.

### Secondary: Tailwind CSS

Tailwind is used **only** for:
- Page layout (grid, flex, responsive breakpoints)
- Spacing between Fluent components (margin/padding on wrapper elements)
- Utility classes on non-interactive elements (dividers, spacers, containers)

**Do not** use Tailwind to style Fluent components internally. Do not use `className` on Fluent components for anything beyond layout positioning.

### Data Visualisation: Recharts

For charts (dashboard, analytics, reports): Recharts, styled to match Fluent tokens.

---

## 3. Theming

### Token System

Fluent UI v9 uses a flat token system. The app defines a custom theme at the root via `FluentProvider`:

```tsx
// src/lib/theme.ts
import { createLightTheme, createDarkTheme, BrandVariants } from '@fluentui/react-components'

const sPlannedBrand: BrandVariants = {
  10:  '#020408',
  20:  '#0B1A2E',
  30:  '#0D2A4A',
  40:  '#0E3B68',
  50:  '#0F4D87',
  60:  '#1060A8',
  70:  '#1474CB',  // Primary brand — deep blue
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
export const darkTheme  = createDarkTheme(sPlannedBrand)
```

Wrap the application root:
```tsx
<FluentProvider theme={lightTheme}>
  {children}
</FluentProvider>
```

### Colour Intent Map

| Intent          | Token                            | Usage                                      |
|-----------------|----------------------------------|--------------------------------------------|
| Brand/Primary   | `colorBrandBackground`           | Primary buttons, active nav items, links   |
| Success/Green   | `colorPaletteGreenBackground2`   | `closed` deliverable status, positive %    |
| Warning/Amber   | `colorPaletteYellowBackground2`  | `delayed` status, medium severity RAID     |
| Danger/Red      | `colorPaletteRedBackground2`     | `blocked` status, critical/high RAID       |
| Neutral/Surface | `colorNeutralBackground1`        | Page backgrounds                           |
| Subtle Surface  | `colorNeutralBackground2`        | Card/panel backgrounds                     |
| Border          | `colorNeutralStroke1`            | Card borders, dividers, table borders      |
| Text Primary    | `colorNeutralForeground1`        | Body text, headings                        |
| Text Secondary  | `colorNeutralForeground2`        | Labels, metadata, helper text              |
| Text Disabled   | `colorNeutralForegroundDisabled` | Disabled inputs, read-only text            |

### Status Badge Colours (Deliverables)

| Status        | Background Token                         | Text Token                          |
|---------------|------------------------------------------|-------------------------------------|
| `planned`     | `colorNeutralBackground3`                | `colorNeutralForeground2`           |
| `in-progress` | `colorBrandBackground2`                  | `colorBrandForeground1`             |
| `delayed`     | `colorPaletteYellowBackground2`          | `colorPaletteYellowForeground2`     |
| `closed`      | `colorPaletteGreenBackground2`           | `colorPaletteGreenForeground2`      |

Use Fluent's `Badge` component for all status displays.

### RAG Status Colours (Reports)

| RAG | Hex       | Usage                                      |
|-----|-----------|------------------------------------------- |
| Red | `#C4314B` | <70% complete or critical open risks       |
| Amber | `#F7B900` | 70–89% complete or high open risks        |
| Green | `#13A10E` | ≥90% complete, no critical/high risks     |

---

## 4. Typography

Fluent UI sets `fontFamilyBase` to `'Segoe UI', 'Segoe UI Web', system-ui, sans-serif`. Do not override this.

### Type Scale

| Role               | Fluent Token           | Size  | Weight | Usage                              |
|--------------------|------------------------|-------|--------|------------------------------------|
| Display            | `fontSizeBase600`      | 40px  | 600    | Marketing pages only               |
| Page Title (H1)    | `fontSizeBase500`      | 28px  | 600    | Page headings                      |
| Section Title (H2) | `fontSizeBase400`      | 20px  | 600    | Card/panel headings, section titles|
| Subsection (H3)    | `fontSizeBase300`      | 16px  | 600    | Table section headers              |
| Body               | `fontSizeBase200`      | 14px  | 400    | Default body text                  |
| Caption            | `fontSizeBase100`      | 12px  | 400    | Labels, metadata, timestamps       |

Use Fluent's `Text` component with `size` and `weight` props rather than raw `<p>` or `<h*>` tags:

```tsx
<Text size={500} weight="semibold">Project Overview</Text>
<Text size={200}>Last updated 3 hours ago</Text>
```

---

## 5. Spacing & Layout

### Grid

Fluent uses a **4px base grid**. All spacing should be multiples of 4px. Fluent tokens map to this:

| Token                  | Value |
|------------------------|-------|
| `spacingHorizontalXS`  | 4px   |
| `spacingHorizontalS`   | 8px   |
| `spacingHorizontalM`   | 12px  |
| `spacingHorizontalL`   | 16px  |
| `spacingHorizontalXL`  | 20px  |
| `spacingHorizontalXXL` | 24px  |
| `spacingHorizontalXXXL`| 32px  |

Use Tailwind spacing utilities (`p-4`, `gap-6`, etc.) only on **layout wrapper** elements, not on Fluent components directly.

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Content Area (flex: 1)           │
│                          │  ┌─────────────────────────────┐ │
│  [Logo]                  │  │  Page Header (56px)          │ │
│  ─────                   │  │  title + breadcrumb + actions│ │
│  Nav items               │  ├─────────────────────────────┤ │
│  (icons + labels)        │  │  Page Body                  │ │
│                          │  │  (scrollable)               │ │
│  ─────                   │  │                             │ │
│  [User avatar]           │  └─────────────────────────────┘ │
│  [Org name]              │                                   │
└─────────────────────────────────────────────────────────────┘
```

- Sidebar: `240px` width, `colorNeutralBackground2` fill, `colorNeutralStroke1` right border
- Content area: `colorNeutralBackground1` fill, `padding: 24px`
- Page header: sticky, `56px` min-height, `colorNeutralBackground1`, bottom border
- On tablet (`< 1024px`): sidebar collapses to icon-only (`48px`) or off-canvas drawer

---

## 6. Core Component Patterns

### Buttons

Use Fluent's `Button` component. Follow this hierarchy:

| Variant       | When to use                               | Example                    |
|---------------|-------------------------------------------|----------------------------|
| `primary`     | One primary CTA per page/dialog           | "Create Project", "Save"   |
| `default`     | Secondary actions                         | "Cancel", "Edit"           |
| `subtle`      | Tertiary/low-emphasis actions             | "View details"             |
| `outline`     | Destructive confirmations                 | "Delete" in confirm dialog |
| `transparent` | Icon-only toolbar actions                 | Row actions in tables      |

```tsx
<Button appearance="primary" icon={<AddRegular />}>Create Project</Button>
<Button appearance="subtle">Cancel</Button>
```

### Navigation (Sidebar)

Use Fluent's `Nav` component with `NavItem` and `NavCategory`. Apply `selectedValue` based on current pathname.

- Active item: `colorBrandBackground2` background, `colorBrandForeground1` text
- Icon size: 20px (Fluent icons)
- Label: `Body` (14px, regular weight)
- Section dividers: `Divider` component

### Cards

Use Fluent's `Card` component for project cards, stat widgets, and report cards.

```tsx
<Card>
  <CardHeader
    image={<ProjectIcon />}
    header={<Text weight="semibold">Gold Mine Processing Plant</Text>}
    description={<Badge appearance="filled" color="success">Active</Badge>}
  />
  <CardPreview>...</CardPreview>
  <CardFooter>...</CardFooter>
</Card>
```

### Data Tables

Use Fluent's `DataGrid` component for all list views (deliverables, RAID items, people, vendors).

```tsx
<DataGrid
  items={items}
  columns={columns}
  sortable
  selectionMode="multiselect"
  resizableColumns
>
  <DataGridHeader>
    <DataGridRow>
      {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
    </DataGridRow>
  </DataGridHeader>
  <DataGridBody>
    {({ item, rowId }) => (
      <DataGridRow key={rowId}>
        {({ renderCell }) => <DataGridCell>{renderCell()}</DataGridCell>}
      </DataGridRow>
    )}
  </DataGridBody>
</DataGrid>
```

- Row hover: `colorNeutralBackground1Hover`
- Selected row: `colorBrandBackground2`
- Inline editable cells: use `Input` or `Select` inline within `DataGridCell`

### Forms & Dialogs

Use Fluent's `Dialog` for all create/edit operations. Never use modals from other libraries.

```tsx
<Dialog>
  <DialogTrigger disableButtonEnhancement>
    <Button appearance="primary">Create RAID Item</Button>
  </DialogTrigger>
  <DialogSurface>
    <DialogBody>
      <DialogTitle>Create RAID Item</DialogTitle>
      <DialogContent>
        <Field label="Title" required>
          <Input />
        </Field>
        <Field label="Type" required>
          <Select>...</Select>
        </Field>
      </DialogContent>
      <DialogActions>
        <DialogTrigger disableButtonEnhancement>
          <Button appearance="secondary">Cancel</Button>
        </DialogTrigger>
        <Button appearance="primary" type="submit">Create</Button>
      </DialogActions>
    </DialogBody>
  </DialogSurface>
</Dialog>
```

- Dialog width: `480px` default, `640px` for complex forms
- Always use `Field` wrapper for form inputs — it handles label, required marker, and validation message

### Toast Notifications

Use Fluent's `Toaster` + `useToastController`:

```tsx
const { dispatchToast } = useToastController()

dispatchToast(
  <Toast>
    <ToastTitle>Project created</ToastTitle>
  </Toast>,
  { intent: 'success', position: 'top-end' }
)
```

- Success: `intent="success"` — green
- Error: `intent="error"` — red
- Warning: `intent="warning"` — amber
- Info: `intent="info"` — blue

### Progress Indicators

| Component      | Usage                                                  |
|----------------|--------------------------------------------------------|
| `ProgressBar`  | Readiness % bars in focus area charts                  |
| `Spinner`      | Loading states for async data fetches                  |
| Circular ring  | Custom SVG using brand tokens (project overview card)  |

### Badges and Status Indicators

```tsx
// Deliverable status
<Badge appearance="filled" color="success">Closed</Badge>
<Badge appearance="filled" color="warning">Delayed</Badge>
<Badge appearance="filled" color="informative">In Progress</Badge>
<Badge appearance="tint" color="neutral">Planned</Badge>

// RAID severity
<Badge appearance="filled" color="danger">Critical</Badge>
<Badge appearance="filled" color="danger">High</Badge>
<Badge appearance="filled" color="warning">Medium</Badge>
<Badge appearance="tint" color="neutral">Low</Badge>
```

---

## 7. Icons

Use `@fluentui/react-icons` exclusively. Do not mix icon libraries.

```
npm install @fluentui/react-icons
```

- **Size 20** (`*Regular` suffix) for UI icons (buttons, nav, table actions)
- **Size 24** (`*Regular` or `*Filled` suffix) for feature icons (empty states, section headers)
- **Filled variants** for active/selected states

Key icons used across S-Planned:

| Element              | Icon                          |
|----------------------|-------------------------------|
| Dashboard            | `GridRegular`                 |
| Projects             | `FolderRegular`               |
| Stakeholders         | `PeopleRegular`               |
| Analytics            | `DataBarVerticalRegular`      |
| Reports              | `DocumentRegular`             |
| Templates            | `TemplateRegular`             |
| Settings             | `SettingsRegular`             |
| Add / Create         | `AddRegular`                  |
| Edit                 | `EditRegular`                 |
| Delete               | `DeleteRegular`               |
| RAID Risk            | `ShieldRegular`               |
| RAID Issue           | `ErrorCircleRegular`          |
| RAID Assumption      | `LightbulbRegular`            |
| RAID Dependency      | `ArrowSyncRegular`            |
| Evidence upload      | `AttachRegular`               |
| Share / Link         | `LinkRegular`                 |
| Status: Closed       | `CheckmarkCircleRegular`      |
| Status: Delayed      | `WarningRegular`              |
| Notification bell    | `AlertRegular` / `AlertFilled`|

---

## 8. Motion & Animation

Fluent UI provides motion tokens. Keep all animation purposeful and brief:

| Token                       | Value  | Usage                               |
|-----------------------------|--------|-------------------------------------|
| `durationUltraFast`         | 50ms   | Micro-feedback (button press)       |
| `durationFaster`            | 100ms  | Tooltip appear                      |
| `durationFast`              | 150ms  | Dropdown open, badge pulse          |
| `durationNormal`            | 200ms  | Dialog open/close, panel slide      |
| `durationSlow`              | 300ms  | Page transitions (route change)     |
| `curveEasyEase`             | —      | Standard in-out — use by default    |
| `curveDecelerateMid`        | —      | Elements entering the screen        |
| `curveAccelerateMid`        | —      | Elements leaving the screen         |

**Do not** add decorative animations. Motion communicates state change — nothing else.

---

## 9. Responsive Behaviour

| Breakpoint   | Width      | Layout Change                                          |
|--------------|------------|--------------------------------------------------------|
| Desktop      | ≥ 1280px   | Full sidebar (240px), full content area                |
| Laptop       | 1024–1279px| Full sidebar (240px), condensed content padding (16px) |
| Tablet       | 768–1023px | Sidebar collapses to icon rail (48px)                  |
| Mobile       | < 768px    | Sidebar hidden; hamburger menu opens Drawer overlay    |

Use Tailwind breakpoint prefixes (`lg:`, `md:`, `sm:`) on layout wrapper elements only.

---

## 10. Accessibility Checklist

All work must satisfy:

- [ ] All interactive elements reachable and operable by keyboard
- [ ] Focus indicators visible at all times (Fluent provides these by default — do not suppress)
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-live` regions for async updates (toast, data loading completions)
- [ ] Colour is never the sole means of conveying information (always paired with text or icon)
- [ ] Minimum contrast ratio 4.5:1 for body text, 3:1 for large text (Fluent tokens satisfy this)
- [ ] High-contrast mode tested (Windows High Contrast / Forced Colors)

---

## 11. Do / Don't Reference

| Do                                                          | Don't                                                      |
|-------------------------------------------------------------|------------------------------------------------------------|
| Use Fluent `Token` values for all colours and spacing       | Hard-code hex values or pixel values outside Fluent tokens |
| Use Fluent `DataGrid` for all tabular data                  | Use plain HTML `<table>` or third-party table libraries    |
| Use Fluent `Dialog` for all modal interactions              | Use browser `confirm()` or custom modal implementations    |
| Use Fluent `Toast` / `Toaster` for feedback                 | Use `alert()` or custom notification components            |
| Use `@fluentui/react-icons`                                | Mix in Lucide, Heroicons, or other icon sets               |
| Keep Tailwind for layout containers only                    | Apply Tailwind utility classes directly on Fluent components|
| Write `makeStyles` for any custom CSS needs                 | Use `style={{}}` inline styles on Fluent components        |
| Use `Field` wrapper for all form inputs                     | Place raw `Input` without a `Field` label wrapper          |
| Test keyboard navigation on every new component             | Ship a component that has only been tested with a mouse    |

---

## 12. File & Import Conventions

```
src/
  components/
    ui/              ← Shared Fluent-based composites (StatusBadge, ReadinessRing, etc.)
    layout/          ← AppShell, Sidebar, PageHeader
    [feature]/       ← Feature-specific components (projects/ProjectCard.tsx, etc.)
  lib/
    theme.ts         ← FluentProvider theme definition
    tokens.ts        ← Re-exported Fluent tokens + app-level semantic aliases
```

Always import Fluent components from `@fluentui/react-components`:
```tsx
import { Button, Card, DataGrid, Badge, Dialog } from '@fluentui/react-components'
import { AddRegular, EditRegular } from '@fluentui/react-icons'
```

---

*End of Design Guidelines — update this document when token usage, component patterns, or layout conventions change.*
