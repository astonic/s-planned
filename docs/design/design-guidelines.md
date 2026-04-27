# S-Planned Design Guidelines

**Version:** 1.1.0  
**Status:** Active  
**Last updated:** 2026-04-26  
**Design language:** Fluent Design System, Microsoft-aligned  
**Primary implementation:** `@fluentui/react-components` v9 plus S-planned CSS variables

This document is the working guide for building S-planned UI. The full token reference is maintained in [s-planned-design-spec.md](./s-planned-design-spec.md).

## Design Principles

- Build quiet, operational software: dense enough for repeated work, calm enough for high-stakes planning.
- Use Fluent UI components first, then style with S-planned `--sp-*` variables.
- Use blue-tinted elevation, rounded Fluent surfaces, and Nunito typography throughout the product.
- Design desktop-first workflows, but implement mobile-first CSS.
- Avoid decorative UI that competes with planning, evidence, reports, and checklist work.

## Implementation Rules

1. Use `--sp-*` CSS variables for color, radius, spacing, shadows, and animation.
2. Do not hardcode brand hex values in new UI.
3. Do not use black neutral shadows such as `rgba(0,0,0,...)`; use `--sp-shadow-*`.
4. Primary CTAs use `--sp-grad-primary` and at least `--sp-shadow-2`.
5. All interactive elements need `transition: all var(--sp-dur-normal) var(--sp-ease)`.
6. Status badges include a visible dot and use semantic color families.
7. Data-heavy pages use cards and tables sparingly; do not put cards inside cards.
8. Tables become card-per-row layouts on mobile for new table work.
9. Mobile uses bottom navigation; tablet uses an icon sidebar; desktop uses full sidebar.
10. Touch targets on mobile must be at least 44px.

## Core Tokens

Use the tokens defined in `src/app/globals.css`:

- Brand: `--sp-blue-50` through `--sp-blue-700`, `--sp-teal`
- Neutrals: `--sp-gray-50`, `--sp-gray-100`, `--sp-gray-200`, `--sp-gray-400`, `--sp-gray-600`, `--sp-gray-800`
- Semantic: `--sp-success`, `--sp-warning`, `--sp-danger` plus light/dark variants
- Gradients: `--sp-grad-primary`, `--sp-grad-extended`, `--sp-grad-sky`, `--sp-grad-success`, `--sp-grad-warning`, `--sp-grad-danger`
- Shadows: `--sp-shadow-1` through `--sp-shadow-4`, `--sp-glow-blue`, `--sp-glow-green`, `--sp-glow-amber`
- Radius: `--sp-radius-sm`, `--sp-radius-md`, `--sp-radius-lg`, `--sp-radius-xl`, `--sp-radius-pill`

## Typography

Primary font is Nunito, with `"Segoe UI", system-ui, -apple-system, sans-serif` as fallback.

| Role | Size | Weight | Usage |
| --- | ---: | ---: | --- |
| Display | 32px | 800 | Hero or large dashboard title |
| Heading 1 | 24px | 700 | Page title |
| Heading 2 | 18px | 700 | Section title |
| Heading 3 | 16px | 600 | Panel/table title |
| Body | 14px | 400 | Default text |
| Caption | 12px | 600 | Metadata |
| Overline | 11px | 700 | Uppercase labels, 3px tracking |

## Layout

Use mobile-first breakpoints only:

- Mobile: `max-width: 639px`
- Tablet: `min-width: 640px`
- Desktop: `min-width: 1024px`

App shell behavior:

- Mobile: no sidebar, fixed bottom nav, 16px content padding.
- Tablet: 56px icon-only sidebar, no bottom nav, 20px content padding.
- Desktop: 220px full sidebar, 24px content padding.

## Components

### Buttons

- Primary: gradient blue, white text, pill radius, blue shadow.
- Secondary/outline: white background, blue text, blue-tint border.
- Ghost/subtle: low-emphasis, blue foreground.
- Danger: red gradient and red-tinted elevation.

### Cards

Cards use white background, `--sp-radius-lg`, `--sp-shadow-2`, and a `0.5px` blue-tint border. Hover lifts one elevation level.

Plan cards use `--sp-radius-xl`, `--sp-shadow-3`, and include a gradient icon, status badge, progress bar, and footer action row.

### Inputs

Inputs are 40px high with `--sp-radius-md`, white fill, `--sp-shadow-1`, and a blue focus ring.

### Badges

Badges are pill-shaped, 11px Nunito 700, with a 6px dot before the label.

### Progress

Progress tracks are 8px, pill radius, gray fill. Active progress uses a gradient fill plus matching glow.

## Responsive Patterns

- Toolbar on mobile: full-width search row, horizontal filter pill row, sort/view in overflow.
- Dialogs on mobile become bottom sheets with 20px top radius.
- Tables on mobile become row cards for new work.
- Breadcrumbs collapse to page title only on mobile.
- Primary actions on mobile are full width or FABs when the toolbar would crowd.

## Current App Integration

The design system is implemented through:

- `src/app/globals.css` for `--sp-*` variables, global Fluent overrides, responsive shell utilities, and mobile bottom nav.
- `src/lib/theme.ts` for Fluent theme mapping to S-planned brand colors, font family, radius, and shadows.
- `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, and `PageHeader.tsx` for responsive navigation and page chrome.

New components should use those foundations rather than defining local brand colors or custom shadow systems.
