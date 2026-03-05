# Design System: Travorier
**Stitch Project ID:** `7580322135798196968`
**Source:** Stitch project "Travorier" (original, Feb 2026)
**Status:** Law — do not deviate without updating this file

---

## 1. Visual Theme & Atmosphere

Travorier is a **clean, confident, trust-first logistics app**. The visual mood is:

- **Airy & Professional** — generous white space, light backgrounds, elevated cards
- **Trustworthy** — cool blue primary signals reliability, verification, and safety
- **Efficient** — compact information density without feeling cluttered
- **Accessible** — strong contrast ratios, clear hierarchy, large tap targets

The design is mobile-first, optimised for 390px width. Light mode is the default; dark mode is supported with a deep navy system.

---

## 2. Color Palette & Roles

### Primary Colors

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#136dec` | Primary actions, links, active states, key highlights |
| `primary-light` | `#2b8cee` | Hover states, secondary CTA tints, progress indicators |
| `primary-subtle` | `#e8f0fe` | Chip backgrounds, tag fills, selected state backgrounds |

### Neutral Colors

| Token | Hex | Role |
|-------|-----|------|
| `background` | `#f6f7f8` | App/page background — the "floor" of the UI |
| `surface` | `#ffffff` | Card, sheet, modal, input backgrounds |
| `border` | `#e5e7eb` | Dividers, input strokes, card outlines |
| `text-primary` | `#0f172a` | Headlines, labels, primary body text |
| `text-secondary` | `#64748b` | Subtitles, helper text, placeholders, metadata |
| `text-disabled` | `#9ca3af` | Disabled states, empty states |

### Semantic Colors

| Token | Hex | Role |
|-------|-----|------|
| `success` | `#16a34a` | Verified badges, completed status, positive values |
| `success-subtle` | `#dcfce7` | Success chip backgrounds |
| `warning` | `#d97706` | Warnings, pending states |
| `warning-subtle` | `#fef3c7` | Warning chip backgrounds |
| `error` | `#dc2626` | Errors, destructive actions, cancellation |
| `error-subtle` | `#fee2e2` | Error chip backgrounds |
| `star` | `#f59e0b` | Ratings, trust score stars |

### Dark Mode Equivalents

| Light | Dark |
|-------|------|
| `#f6f7f8` (background) | `#101922` |
| `#ffffff` (surface) | `#1a2632` |
| `#0f172a` (text-primary) | `#f1f5f9` |

---

## 3. Typography Rules

**Font Family:** Inter (primary and display), fallback to system sans-serif.
React Native: use `fontFamily: 'Inter'` once loaded via `expo-font`, or rely on system default.

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `display` | 28px | 700 Bold | 34px | Screen titles, hero numbers |
| `headline` | 22px | 700 Bold | 28px | Section headers, card titles |
| `title` | 17px | 600 SemiBold | 22px | List items, modal headers |
| `body` | 15px | 400 Regular | 22px | Paragraphs, descriptions |
| `label` | 13px | 500 Medium | 18px | Chips, tags, metadata, captions |
| `caption` | 11px | 400 Regular | 16px | Timestamps, footnotes, legal text |

**Rules:**
- Headlines and titles are always Inter Bold or SemiBold; never use a heavy weight for body
- Labels in chips/badges use Medium weight to stay legible at small sizes
- Never mix font weights in the same line unless one is a secondary label

---

## 4. Spacing & Layout

**Base grid:** 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon gaps, micro spacing |
| `space-2` | 8px | Inner chip padding, tight rows |
| `space-3` | 12px | Card internal padding (compact) |
| `space-4` | 16px | Standard screen margins, card padding |
| `space-6` | 24px | Section separation, card-to-card gap |
| `space-8` | 32px | Large vertical spacing, header padding |
| `space-12` | 48px | Hero/splash sections |

**Screen margins:** 16px horizontal on all screens
**Card-to-card gap:** 12px vertical
**Bottom safe-area:** always add `env(safe-area-inset-bottom)` padding on fixed bottom bars

---

## 5. Shape & Elevation

### Border Radius

| Name | Value | Usage |
|------|-------|-------|
| `radius-sm` | 4px | Tags, small chips |
| `radius-md` | 8px | Buttons, inputs, cards |
| `radius-lg` | 12px | Large cards, bottom sheets |
| `radius-xl` | 16px | Modals, hero cards |
| `radius-full` | 9999px | Pill buttons, avatar chips, toggle controls |

**All interactive cards use `radius-lg` (12px).**
**All buttons use `radius-md` (8px)** unless they are standalone pill FABs.

### Shadows / Elevation

React Native Paper elevation levels:
| Level | Usage |
|-------|-------|
| `elevation={0}` | Flat sections (background-colored) |
| `elevation={1}` | Subtle card lift (most cards) |
| `elevation={2}` | Header surfaces, sticky bars |
| `elevation={4}` | Bottom action bars, floating cards |
| `elevation={8}` | Modals, sheets |

---

## 6. Component Patterns

### Buttons

**Primary Button** — filled, `primary` background, white text, `radius-md`
```
backgroundColor: #136dec
color: #ffffff
borderRadius: 8px
paddingVertical: 14px
paddingHorizontal: 24px
fontWeight: 600
```

**Secondary / Outlined Button** — transparent fill, `primary` border + text, `radius-md`
```
borderColor: #136dec
color: #136dec
borderRadius: 8px
borderWidth: 1.5px
```

**Destructive Button** — outlined, error border + text OR filled error
```
borderColor: #dc2626
color: #dc2626
```

**FAB** — pill shape, `primary` fill, white icon, elevation 4
```
backgroundColor: #136dec
borderRadius: 9999px
elevation: 4
```

### Cards

Standard content card:
```
backgroundColor: #ffffff
borderRadius: 12px
elevation: 1
padding: 16px
marginBottom: 12px
```

Hero / featured card:
```
backgroundColor: #136dec  (or gradient)
borderRadius: 16px
elevation: 2
padding: 20px
```

### Input Fields (TextInput)

```
mode: "outlined"
backgroundColor: #ffffff
borderRadius: 8px
activeOutlineColor: #136dec
outlineColor: #e5e7eb
placeholderTextColor: #9ca3af
```

### Chips / Tags / Badges

```
backgroundColor: #e8f0fe  (primary-subtle) for selected
backgroundColor: #f6f7f8  (background) for default
borderRadius: 9999px  (pill shape)
paddingHorizontal: 10px
paddingVertical: 4px
fontSize: 13px
fontWeight: 500
```

Status chip colors:
- Active → background: `#dcfce7`, text: `#16a34a`
- Matched → background: `#dbeafe`, text: `#1d4ed8`
- Completed → background: `#f1f5f9`, text: `#475569`
- Cancelled → background: `#f1f5f9`, text: `#9ca3af`
- Pending → background: `#fef3c7`, text: `#d97706`

### Avatars

- Default size: 48px (list items), 80px (profile header)
- `radius-full` always
- Initials fallback: `backgroundColor: primary-subtle (#e8f0fe)`, text: `primary (#136dec)`

### Navigation (Bottom Tab Bar)

- Active tab: `primary (#136dec)` icon + label
- Inactive tab: `text-secondary (#64748b)` icon + label
- Background: `surface (#ffffff)`, `elevation={2}`

### Dividers

```
backgroundColor: #e5e7eb
height: 1px
```

---

## 7. Iconography

Use **MaterialCommunityIcons** from `@expo/vector-icons`. Icon size conventions:
- Navigation / tab icons: 24px
- List item icons: 20px
- Inline / label icons: 16px
- Hero / feature icons: 32-48px

Icon color: use contextual color (primary, text-secondary, semantic) — never hardcode `#000000`.

---

## 8. React Native Paper Theme

All screens must use the global theme from `mobile/lib/theme.ts`:

```typescript
import { MD3LightTheme } from 'react-native-paper';

export const AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#136dec',
    primaryContainer: '#e8f0fe',
    secondary: '#64748b',
    secondaryContainer: '#f1f5f9',
    surface: '#ffffff',
    surfaceVariant: '#f6f7f8',
    background: '#f6f7f8',
    error: '#dc2626',
    errorContainer: '#fee2e2',
    outline: '#e5e7eb',
    onPrimary: '#ffffff',
    onSurface: '#0f172a',
    onSurfaceVariant: '#64748b',
  },
  roundness: 2,   // react-native-paper multiplies by 4 → 8px base radius
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };
```

`<PaperProvider theme={AppTheme}>` must wrap the root in `mobile/app/_layout.tsx`.

---

## 9. Usage Rules

1. **Never invent new colors.** Every color used must map to a token above.
2. **Never hardcode hex values in component StyleSheets.** Import from `theme.ts`.
3. **Spacing must be multiples of 4px.** No values like `7px`, `11px`, `15px`.
4. **All border-radius values** must use the token scale above.
5. **Primary = blue `#136dec`.** Do not use green `#00A86B` as a primary color.
   - Green is reserved for `success` semantic meaning only (verified, completed, positive).
6. **Elevation must use the scale above.** Do not use custom `boxShadow` strings.
7. **Typography must use the type scale.** No `fontSize: 17.5` or intermediate sizes.
8. **Status chips must use the semantic palette** (active/matched/completed/cancelled).

---

## 10. Stitch Prompt Prefix

When generating new screens in Stitch, prepend this to every prompt:

> Use the Travorier design system: Inter font, primary blue #136dec, light background #f6f7f8, white surfaces, 8px base border-radius. Clean, airy, trust-focused mobile UI. Cards use subtle elevation, chips are pill-shaped with semantic colors (green for success, blue for primary actions). All spacing on 4px grid.

---

*Last updated: 2026-03-05 — synthesized from Stitch project 7580322135798196968*
