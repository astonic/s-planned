Build a Fluent UI v9 component for S-Planned: $ARGUMENTS

Follow the design guidelines in docs/design/design-guidelines.md exactly.

## Checklist

1. **Determine component type** from $ARGUMENTS:
   - Status badge → use `Badge` with colour tokens from the status/severity map in guidelines §6
   - Form dialog → invoke `/fluent-dialog-form` skill instead
   - Data table → invoke `/fluent-data-grid` skill instead
   - Card → use Fluent `Card`, `CardHeader`, `CardPreview`, `CardFooter`
   - Nav item → use Fluent `Nav`, `NavItem`, `NavCategory`
   - Standalone interactive → use appropriate Fluent primitive

2. **Imports** — always from these packages only:
   ```tsx
   import { ComponentName } from '@fluentui/react-components'
   import { IconName } from '@fluentui/react-icons'
   ```
   Never import from shadcn/ui, Radix, Lucide, or any other component/icon library.

3. **Custom styles** — use `makeStyles` from `@fluentui/react-components` only:
   ```tsx
   import { makeStyles, tokens } from '@fluentui/react-components'
   const useStyles = makeStyles({ root: { padding: tokens.spacingHorizontalL } })
   ```
   Never use `style={{}}` inline styles on Fluent components.
   Never use Tailwind classes directly on Fluent component props.
   Tailwind is allowed only on outer layout wrapper `<div>` elements.

4. **Colour and spacing** — use Fluent `tokens.*` values, never hardcoded hex or px values:
   ```tsx
   import { tokens } from '@fluentui/react-components'
   // tokens.colorBrandBackground, tokens.spacingHorizontalL, etc.
   ```

5. **Icons** — size 20 for UI icons, size 24 for feature/empty state icons. Use `*Regular` suffix
   for default state, `*Filled` suffix for active/selected state.

6. **Accessibility**:
   - Icon-only buttons must have `aria-label`
   - Dynamic content updates need `aria-live` region
   - Never suppress Fluent's built-in focus indicators (no `outline: none` without replacement)

7. **File location**: `src/components/ui/` for shared composites, `src/components/[feature]/` for
   feature-specific components.

8. **Naming**: PascalCase filename matching the component name (e.g., `StatusBadge.tsx`).

9. **Props interface**: Export a typed props interface alongside the component.

10. **Verify** the component against the Do/Don't table in design-guidelines.md §11 before
    declaring it done.
