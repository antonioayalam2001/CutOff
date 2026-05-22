# CutOff UI Standards

This document defines the visual and interaction standard for CutOff so all screens feel like one product.

## 1. Design Intent

- Register: product UI.
- Priority: clarity, speed, and financial comprehension.
- Personality: modern, minimalist, confident, not loud.
- Rule: data first, chrome second.

## 2. Global Tokens

## 2.1 Color

- Use tokenized colors only, no one-off hex values in components.
- Never use pure `#000` or `#fff`.
- Interactive accent: teal family.
- Attention accent: amber family.
- Destructive accent: red family.

Core references:

- Teal: `primary-400/500/600`
- Amber: `accent-400/500/600`
- Neutrals: `base-50` to `base-950`
- Glass: `--glass-bg`, `--glass-border`, `--glass-strong-bg`, `--glass-nav-bg`

Usage limits:

- Teal appears mostly in interaction points: buttons, links, focus rings, selected states.
- Amber appears only for pending/warning semantics.
- Red appears only for destructive and errors.

## 2.2 Typography

- Primary family: Sora.
- Numeric dense values: JetBrains Mono where useful.
- Body line length for long text: 65-75ch.

Hierarchy:

- Page title: `text-2xl` to `text-3xl`, `font-semibold` or `font-bold`.
- Section title: `text-lg`, `font-semibold`.
- Body text: `text-sm`.
- Metadata labels and table headers: `text-xs`, medium weight, tracked.

## 2.3 Spacing and Radius

Use only this spacing scale:

- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

Use only this radius scale:

- `sm`: 6px
- `md`: 8px
- `lg`: 12px
- `xl`: 16px

## 2.4 Motion

Use transform and opacity transitions only for frequent UI interactions.

Durations:

- Press feedback: 120-160ms
- Small popovers/dropdowns: 140-200ms
- Panels/dialog content: 220-300ms

Easing:

- Enter/feedback: strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`).
- On-screen movement: strong ease-in-out (`cubic-bezier(0.77, 0, 0.175, 1)`).
- Avoid `ease-in` for interactive UI.

Reduced motion:

- Honor `prefers-reduced-motion`.
- Remove spatial movement and keep minimal opacity transitions.

## 3. Components

## 3.1 Buttons

Variants allowed:

- `primary`
- `secondary`
- `danger`
- `ghost`

Anatomy:

- Default radius: `lg`.
- Consistent heights and paddings by size token.
- One primary action per section.

States:

- Hover: subtle lift/brightness.
- Active: tactile `scale(0.97)`.
- Focus-visible: clear ring.
- Disabled: reduced opacity, no interactive motion.

## 3.2 Icon Buttons and Icons

- One icon style family only.
- Sizes:
  - 16px for dense action areas.
  - 20px for default controls.
  - 24px for hero/empty states.
- Icon + label spacing is fixed and consistent.
- Destructive icon color is semantic, never decorative.

## 3.3 Inputs, Selects, Checkboxes, Toggles

Shared rules:

- Same field height family and radius.
- Label position and style are consistent.
- Same focus ring language across all controls.
- Validation language is consistent.

Input:

- Rest: neutral border.
- Hover: slight border emphasis.
- Focus: teal ring + border emphasis.
- Error: red border + helper text.

Select:

- Trigger matches input style.
- Option spacing and selected-row style are consistent.
- Open/close animations are short and responsive.

Checkbox/Toggle:

- Instant feedback on press.
- Selected state clearly visible in dark and light modes.
- Keyboard state always visible.

## 3.4 Cards and Surfaces

- Cards exist only when grouping improves comprehension.
- No decorative nested-card pattern.
- Standard card:
  - subtle surface tint,
  - 1px border,
  - `rounded-xl`,
  - spacing from token scale.

Glass rule:

- Use glass where layering provides UX value (nav, overlays, depth context).
- Avoid heavy blur for decorative-only blocks.

## 3.5 Table System

- Header style is standardized: `text-xs`, tracked, muted tone.
- Row spacing and divider thickness are fixed.
- Selected rows use a subtle semantic tint.

Insertion/removal animations:

- Insert: short staggered entrance with scale and fade.
- Remove: fast fade/scale-out.
- Never block interactions while animations play.

States:

- Loading: standard skeleton style.
- Empty: standard empty state block.
- Error: standard error state with clear message.

## 3.6 Dialogs and Confirmations

- Dialog style uses same spacing/radius/border tokens as cards.
- Overlay opacity and content animation are standardized.
- Confirm dialogs are used for destructive actions.
- Inline alternatives should be preferred before using modal flows.

## 3.7 Navigation

- Sticky top navigation is the default app shell pattern.
- Active route is always visually obvious.
- Nav actions use shared button/icon button rules.
- Mobile behavior prioritizes reachability and clarity.

## 4. Visual State Language

Every reusable component must define:

- `default`
- `hover`
- `active`
- `focus-visible`
- `disabled`
- `loading`
- `error`
- `success` (when applicable)

State transitions must feel consistent in timing and easing.

## 5. Reusable Component Contract

Each shared component must include:

- Purpose.
- Allowed variants.
- Prop API.
- State behavior map.
- Accessibility rules.
- Motion behavior.
- Do/Don't examples.

Minimum shared catalog:

- Button
- IconButton
- Input
- Select
- Checkbox
- Toggle
- Badge
- Tabs
- Modal/Dialog
- Toast
- DataTable
- EmptyState
- ConfirmDialog
- FilterChip
- Pagination

## 6. Accessibility and UX Requirements

- WCAG AA contrast baseline.
- Full keyboard navigation for interactive controls.
- Visible focus styles always enabled.
- Reduced-motion mode respected globally.
- Touch targets appropriate for mobile use.
- Feedback messages are concise and actionable.

## 7. Absolute Prohibitions

- Side-stripe accents with thick left/right borders.
- Gradient text for headings or labels.
- Decorative glassmorphism as default pattern.
- Hero-metric SaaS template blocks.
- Endless identical icon cards.
- Purely decorative motion that slows frequent tasks.

## 8. Page-Level Consistency Checklist

Apply this checklist on every screen before shipping:

1. Typography hierarchy matches tokens.
2. Spacing and radius values map to system scale.
3. Buttons and form controls use canonical variants.
4. Interactive states are present and consistent.
5. Data tables use shared row/header/state patterns.
6. Destructive flows use confirm pattern consistently.
7. Mobile layout remains clear and fast.
8. Reduced-motion behavior is verified.

## 9. Implementation Notes for Current Codebase

- Keep design logic in shared UI components under `frontend/src/shared/ui` and `frontend/src/shared/components`.
- Avoid repeating visual classes in pages, prefer reusable variants and utility classes.
- Any new component should be added to the shared catalog before direct page usage.
- If a page needs a visual exception, document why in the component or feature folder.
