# S-Planned Design Specification

**Version:** 1.1.0  
**Status:** Active  
**Last updated:** 2026-04-26  
**Application:** S-planned — plan execution, evidence capture, and checklist management  
**Design language:** Fluent Design System, Microsoft-aligned  
**Font stack:** Nunito, Segoe UI, system-ui, sans-serif  
**Platform:** Web, desktop-first workflows with responsive implementation

## Meta

```yaml
spec_format: claude-design-spec-v1
product: S-planned
version: 1.1.0
platform: Web
design_language: Fluent Design System
font_stack: Nunito, Segoe UI, system-ui, sans-serif
color_mode: light
grid: 12-column desktop, 24px gutter, 1280px max-width
```

## Brand

- Logo mark: rounded square icon, `12px` radius, layered document/checklist motif.
- Wordmark: `S-planned`, Nunito 800, `-0.5px` letter spacing.
- Tagline: `PLAN · EXECUTE · PROVE`, Nunito 700, 11px, 3px letter spacing, uppercase.
- Icon gradient: `--sp-grad-primary`.
- Icon shadow: `0 8px 24px rgba(23,87,194,0.18), 0 4px 8px rgba(23,87,194,0.10)`.

## CSS Variables

The implementation source of truth is `src/app/globals.css`.

```css
:root {
  --sp-blue-50: #EFF5FD;
  --sp-blue-100: #CCDFF8;
  --sp-blue-200: #99BFF0;
  --sp-blue-400: #3B82F6;
  --sp-blue-500: #1757C2;
  --sp-blue-600: #0F3D8C;
  --sp-blue-700: #082660;
  --sp-teal: #00B4D8;

  --sp-success: #22C55E;
  --sp-success-light: #DCFCE7;
  --sp-success-dark: #15803D;
  --sp-warning: #F59E0B;
  --sp-warning-light: #FEF9C3;
  --sp-warning-dark: #854D0E;
  --sp-danger: #EF4444;
  --sp-danger-light: #FEE2E2;
  --sp-danger-dark: #B91C1C;

  --sp-gray-50: #F8F9FC;
  --sp-gray-100: #EEF1F8;
  --sp-gray-200: #D6DCE8;
  --sp-gray-400: #8E9BAF;
  --sp-gray-600: #4A5568;
  --sp-gray-800: #1E2533;

  --sp-grad-primary: linear-gradient(135deg, #3B82F6, #1757C2);
  --sp-grad-extended: linear-gradient(135deg, #60A5FA, #3B82F6, #1757C2);
  --sp-grad-navy: linear-gradient(135deg, #1757C2, #082660);
  --sp-grad-sky: linear-gradient(135deg, #3B82F6, #00B4D8);
  --sp-grad-midnight: linear-gradient(135deg, #1E2533, #1757C2);
  --sp-grad-success: linear-gradient(90deg, #4ADE80, #22C55E);
  --sp-grad-warning: linear-gradient(90deg, #FCD34D, #F59E0B);
  --sp-grad-danger: linear-gradient(135deg, #F87171, #EF4444);

  --sp-shadow-1: 0 1px 3px rgba(23,87,194,0.08), 0 1px 2px rgba(23,87,194,0.04);
  --sp-shadow-2: 0 4px 12px rgba(23,87,194,0.10), 0 2px 4px rgba(23,87,194,0.06);
  --sp-shadow-3: 0 8px 24px rgba(23,87,194,0.14), 0 4px 8px rgba(23,87,194,0.08);
  --sp-shadow-4: 0 16px 48px rgba(23,87,194,0.18), 0 8px 16px rgba(23,87,194,0.10);
  --sp-glow-blue: 0 0 8px rgba(59,130,246,0.40);
  --sp-glow-green: 0 0 8px rgba(34,197,94,0.35);
  --sp-glow-amber: 0 0 8px rgba(245,158,11,0.35);

  --sp-radius-sm: 6px;
  --sp-radius-md: 10px;
  --sp-radius-lg: 16px;
  --sp-radius-xl: 24px;
  --sp-radius-pill: 9999px;

  --sp-space-1: 4px;
  --sp-space-2: 8px;
  --sp-space-3: 12px;
  --sp-space-4: 16px;
  --sp-space-5: 20px;
  --sp-space-6: 24px;
  --sp-space-8: 32px;
  --sp-space-10: 40px;
  --sp-space-12: 48px;
  --sp-space-16: 64px;

  --sp-dur-fast: 100ms;
  --sp-dur-normal: 150ms;
  --sp-dur-slow: 250ms;
  --sp-ease: ease;
  --sp-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Component Standards

### Button

Primary buttons use `--sp-grad-primary`, white text, `--sp-radius-pill`, and `--sp-shadow-2`. Hover raises to `--sp-shadow-3` and translates `-1px`; active scales to `0.98`.

Secondary buttons use white background, `--sp-blue-500` text, `1.5px solid --sp-blue-100`, and `--sp-shadow-1`.

### Badge

Badges are pill-shaped, Nunito 700, 11px, and always include a 6px dot before the label.

Status mapping:

| Status | Variant |
| --- | --- |
| Draft | gray |
| In Progress | blue |
| Pending | amber |
| Completed | green |
| Overdue | red |
| Cancelled | gray |

### Input

Inputs are 40px high, white, `--sp-radius-md`, `0.5px solid --sp-gray-200`, and `--sp-shadow-1`. Focus uses `--sp-blue-400` and a 3px blue alpha ring.

### Card

Standard cards use white background, `--sp-radius-lg`, `--sp-shadow-2`, and `0.5px solid --sp-blue-100`. Plan cards use `--sp-radius-xl` and `--sp-shadow-3`.

### Progress

Track: 8px, pill radius, `--sp-gray-100`. Active fill: `--sp-grad-primary` plus `--sp-glow-blue`.

### Navigation

Desktop sidebar: 220px, full labels.  
Tablet sidebar: 56px, icon-only.  
Mobile: no sidebar; bottom navigation, 56px tall, max five tabs.

## Responsive System

Use only these breakpoints:

```css
@media (max-width: 639px) {}
@media (min-width: 640px) {}
@media (min-width: 1024px) {}
```

Grid:

- Desktop: 12 columns, 24px gutter, 1280px max width.
- Tablet: 8 columns, 16px gutter, full width with 24px margins.
- Mobile: 4 columns, 12px gutter, full width with 16px margins.

Rules:

1. Write mobile-first CSS.
2. Use `minmax(0, 1fr)` in CSS grids.
3. Do not horizontally scroll pages.
4. Tables become card-per-row layouts on mobile for new table work.
5. Touch targets are at least 44px on mobile.
6. Dialogs become bottom sheets on mobile.
7. Hover-only interactions must have click/tap equivalents.

## Usage Rules

1. Always use `--sp-*` variables in new UI.
2. Never use `rgba(0,0,0,...)` shadows.
3. Never use radius values outside the radius scale.
4. Gradient surfaces must carry matching blue-tinted elevation.
5. Acrylic surfaces are contextual only, never for forms or data tables.
6. Disabled states use opacity `0.45` and `cursor: not-allowed`.
7. Font is Nunito first; never introduce Inter, Roboto, or Arial as primary.

## Version History

- `1.0.0`: Initial Fluent-aligned S-planned visual system.
- `1.1.0`: Responsive app-shell rules, bottom navigation, and mobile component patterns.
