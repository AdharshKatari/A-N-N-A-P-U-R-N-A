# DESIGN.md — Annapurna Mobile Design System

> Canonical reference for all visual tokens, spacing, typography, color, and component patterns used across every screen in the Annapurna mobile app. Any AI agent or developer generating new screens **must** follow these values exactly.

---

## Quick Reference

| Token | Value | Usage |
|-------|-------|-------|
| Screen padding | `20px` | Horizontal margin on every screen |
| Card padding (standard) | `24px` | Most cards |
| Card padding (compact) | `20px` | Weather, crop, info cards |
| Card radius | `24px` | Standard cards |
| Button radius | `28px` (pill) | CTAs, action buttons |
| Section gap | `24px` | Between related content |
| Major section gap | `32px` | Between different sections |
| Touch target min | `44px` | All interactive elements |
| Background | `#FEF9F0` | Warm cream — every screen |
| Surface | `#FFFFFF` | White — all cards |
| Primary | `#00431D` | Deepest green — headings, CTAs |

---

## 1. Color Palette

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1A4122` | Dark green — headings, key actions |
| `primaryDark` | `#00431D` | Deepest green — header accent, active nav, primary buttons, major recommendation cards |
| `secondary` | `#2C5A33` | Medium green — icons, links, secondary accents |

### Backgrounds & Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#FEF9F0` | Warm cream — screen background (every screen) |
| `surface` | `#FFFFFF` | White — cards, sheets, modals |
| `surfaceAlt` | `#F8F3EA` | Light cream — icon circle fills, subtle backgrounds |
| `divider` | `#E7E2D9` | Warm grey — card dividers, subtle borders, neutral card borders |
| `dividerLight` | `#F2EDE4` | Lighter divider — forecast rows, metric separators |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#1D1C16` | Near-black — headings, card titles, important values |
| `textSecondary` | `#404940` | Dark grey — body text, metadata, descriptions |
| `textMuted` | `#707A6F` | Medium grey — captions, tertiary info, icons |
| `textOnPrimary` | `#FFFFFF` | White — text on dark green buttons/cards |
| `textOnDark` | `#145C2E` | Dark green — text on light green chip backgrounds |

### Status / Semantic Colors

| Token | Hex | When to use |
|-------|-----|-------------|
| `success` | `#1B7A3D` | Healthy, positive, recommended action |
| `successBg` | `#CCEAD0` | Light green chip/badge background |
| `successLight` | `#91F5A3` | Bright green — progress bars, active accents |
| `warning` | `#E8A317` | Amber — warnings, moderate risk, alerts |
| `warningBg` | `#FFF8E1` | Light amber card/badge background |
| `warningIcon` | `#FFA000` | Orange-amber — warning icons specifically |
| `error` | `#D32F2F` | Red — errors, high risk, critical warnings |
| `errorBg` | `#FFEBEE` | Light red badge background |
| `info` | `#1976D2` | Blue — informational (use sparingly) |
| `infoBg` | `#E3F2FD` | Light blue background |

### Badge / Chip Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `chipGreen` | `#B1CEB4` | "STABLE" badge background |
| `chipGreenDark` | `#334C39` | "STABLE" badge text |
| `chipGreenBright` | `#78DB8C` | "GOOD OPTION" badge |
| `chipGreenText` | `#005323` | "GOOD OPTION" badge text |
| `chipGreenLight` | `#A4C1A8` | Support button background |

### Semantic Border Rules

**This is critical.** Do not use green borders for everything.

| Content meaning | Border color | Border token |
|----------------|-------------|--------------|
| Neutral / default | `#E7E2D9` | `Colors.divider` |
| Recommended / healthy | `#1B7A3D` | `Colors.success` |
| Warning / moderate risk | `#E8A317` | `Colors.warning` |
| High risk / critical | `#D32F2F` | `Colors.error` |
| Selected state | `#00431D` | `Colors.primaryDark` |

---

## 2. Spacing Scale

8px-based grid. **Never choose random values.**

| Token | Value | Usage |
|-------|-------|-------|
| `xxs` | `4px` | Tight inline gaps (dot + label, icon + text) |
| `xs` | `8px` | Small element gaps, internal chip padding |
| `sm` | `12px` | Action card gaps, list item gaps, option features |
| `md` | `16px` | Normal card padding (small), internal content gaps |
| `lg` | `20px` | Screen horizontal padding, normal card padding |
| `xl` | `24px` | Large card padding, section gaps between related sections |
| `xxl` | `32px` | Major section gaps (different sections) |
| `xxxl` | `40px` | Reserved for major visual breaks |
| `huge` | `48px` | Rare — intentional large whitespace |

### Named Layout Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `screenPadding` | `20px` | Outer horizontal padding for ALL screens |
| `cardPadding` | `24px` | Standard card internal padding |
| `cardPaddingSm` | `20px` | Smaller card padding (weather, crop info) |
| `sectionGap` | `24px` | Gap between related content sections |
| `majorSectionGap` | `32px` | Gap between different major sections |
| `headerPadding` | `16px` | Vertical padding inside the top bar |

### Spacing Rules

- **Related things** = smaller gap (`12-16px`)
- **Different sections** = larger gap (`24-32px`)
- **Never** exceed `32px` unless creating a deliberate major section break
- **Card-to-card** gap: `20-24px`

---

## 3. Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `12px` | Small components (badges, pills, small chips) |
| `md` | `16px` | Buttons, alerts, activity cards |
| `lg` | `24px` | Standard cards (most common) |
| `xl` | `28px` | Large cards, prominent buttons, pill CTAs |
| `xxl` | `32px` | Large containers, modals |
| `full` | `9999px` | Fully rounded (avatar circles, pill shapes) |

**Do not use random values** like 14, 17, 23, 26, 31. Consistency matters more than the exact number.

---

## 4. Typography

### Font Family

```
PlusJakartaSans
├── _400Regular   → FontFamily.regular
├── _500Medium    → FontFamily.medium
├── _600SemiBold  → FontFamily.semibold
└── _700Bold      → FontFamily.bold
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 32px | 700 | 40px | App logo, hero metrics |
| `h1` | 28px | 600 | 34px | Page titles, greetings |
| `h2` | 24px | 700 | 30px | Section headings, weather temp |
| `h3` | 24px | 600 | 30px | Card titles, market section headers |
| `h4` | 21px | 600 | 26px | Header titles, card headings |
| `bodyLg` | 18px | 600 | 24px | Emphasized body, metric values |
| `body` | 16px | 400 | 24px | Standard body text, button labels |
| `bodyBold` | 16px | 600 | 22px | Button labels, action card titles |
| `bodyMd` | 15px | 400 | 22px | Secondary body, alert text |
| `bodyMdBold` | 15px | 600 | 22px | Crop titles, metric values |
| `caption` | 14px | 400 | 20px | Secondary text, descriptions |
| `captionBold` | 14px | 600 | 20px | Indicator labels, badge text |
| `small` | 13px | 400 | 18px | Metadata, location, timestamps |
| `label` | 12px | 700 | 16px | Badge text, forecast labels |
| `labelSm` | 11px | 700 | 14px | Uppercase badges (STABLE, GOOD OPTION) |

### Font Weight Hierarchy

| Weight | Usage |
|--------|-------|
| 700 (Bold) | Major headings, numbers, badge text, active nav |
| 600 (SemiBold) | Labels, buttons, card titles, section headings |
| 500 (Medium) | Emphasized secondary information |
| 400 (Regular) | Supporting information, body text |

### Example Hierarchy (Crop Card)

```
Wheat • Batch 04        → 600 (card title)
65 Days to Harvest      → 700 (badge)
● Healthy               → 400 (status)
Moisture                → 400 (label)
42%                     → 700 (metric value)
```

---

## 5. Shadows

Shadows are **subtle and restrained**. Do not add heavy box-shadows to everything.

| Token | Opacity | Blur | Elevation | Usage |
|-------|---------|------|-----------|-------|
| `card` | 6% | 20px | 3 | Standard cards |
| `header` | 6% | 20px | 3 | Top bar |
| `button` | 10% | 4px | 2 | Interactive elements |
| `banner` | 15% | 16px | 4 | Dark recommendation cards |

Shadow color: `#145C2E` (dark green) for cards/header, `#000000` for buttons.

---

## 6. Component Patterns

### Screen Header (Reusable)

Every screen with a back button uses the same layout:

```
┌─────────────────────────────────┐
│                                 │
│ ←        PAGE TITLE          👤 │
│          subtitle               │
│                                 │
└─────────────────────────────────┘
```

- Back button: 40×40px, `BorderRadius.full`
- Title: `Typography.h4` (21px/600), `Colors.primaryDark`
- Subtitle: `Typography.small` (13px/400), `Colors.textSecondary`
- Right action: 40×40px icon or avatar

**Use `ScreenHeader` component** — do not recreate headers independently.

### Bottom Tab Navigation (Reusable)

Fixed bottom tabs across ALL screens:

```
Home | Pest & Soil | Scan | Smart Move | Market
```

- Active: filled dark green pill (`#145C2E`) with white icon
- Inactive: grey icon (`#404940`)
- Tab bar height: `72px`, bottom padding: `14px`
- Label: `11px/700`, letter-spacing: `0.4`
- **Must be pixel-identical across every screen**

### Card Component

Standard card:
```typescript
<Card border="neutral">    // gray border (default)
<Card border="green">      // recommended/healthy
<Card border="amber">      // warning/moderate
<Card border="red">        // high risk/critical
<Card border="none">       // no border
<Card compact>              // 20px padding instead of 24px
```

### Badge / Pill Component

```typescript
<Badge variant="green">Recommended</Badge>   // green bg
<Badge variant="amber">Moderate</Badge>      // amber bg
<Badge variant="red">High Risk</Badge>       // red bg
<Badge variant="gray">STABLE</Badge>         // gray bg
```

### Icon System

Use **MaterialIcons** consistently across the entire app. Do not mix Lucide, Font Awesome, or custom SVGs.

Common icon mappings:
| Action | Icon |
|--------|------|
| Back | `arrow-back` |
| Notifications | `notifications` |
| Camera/Scan | `photo-camera` |
| Location | `location-on` |
| Check/Healthy | `check-circle` |
| Warning | `warning` |
| Store/Market | `storefront` |
| Settings | `settings` |

---

## 7. Screen Layout Template

Every screen follows this structure:

```
SafeAreaView (background: #FEF9F0)
├── StatusBar (dark-content, bg: #FEF9F0)
├── ScreenHeader
├── ScrollView (contentContainerStyle)
│   ├── PRIMARY CONTENT     ← 24px gap
│   ├── SECONDARY CONTENT   ← 24px gap
│   ├── ACTION              ← 24px gap
│   └── ...
└── Bottom Tab Bar (from navigation)
```

### Consistent Vertical Rhythm

```
HEADER
  ↓ 24px
PRIMARY CONTENT (hero card, weather, price)
  ↓ 24px
SECONDARY CONTENT (details, metrics, options)
  ↓ 24px
ACTION (CTA buttons)
```

Do not let each screen invent its own spacing.

---

## 8. Semantic Color Application

### Status Values

| State | Text Color | Background | Border |
|-------|-----------|------------|--------|
| Healthy / Good | `success` (#1B7A3D) | `successBg` (#CCEAD0) | `success` |
| Stable / Optimal | `textOnDark` (#145C2E) | `chipGreen` (#B1CEB4) | neutral |
| Moderate / Warning | `warning` (#E8A317) | `warningBg` (#FFF8E1) | `warning` |
| Needs Attention | `error` (#D32F2F) | `errorBg` (#FFEBEE) | `error` |
| High Risk | `error` (#D32F2F) | `errorBg` (#FFEBEE) | `error` |

### Card Border Semantics

| Card meaning | Border |
|-------------|--------|
| Neutral info card | `Colors.divider` (gray) |
| Recommended action | `Colors.success` (green) |
| Warning card | `Colors.warning` (amber) |
| High risk card | `Colors.error` (red) |
| Selected state | `Colors.primaryDark` (dark green) |

**Never** put a green border on a high-risk card. That is semantically confusing.

---

## 9. Agricultural Design Principles

1. **Calm, not alarming** — Warnings should feel like "heads up", not "DANGER!!!"
2. **Agricultural identity** — Green + cream palette, not generic SaaS blue
3. **Farmer-friendly language** — "Good for Spraying", not "Optimal Spray Conditions"
4. **Decision-focused** — Show "Sell within 2-3 days", not just "AI recommends selling"
5. **Explainable** — Always show "Why?" reasoning for AI recommendations
6. **No decorative elements** — Cream + white + subtle separation + rounded cards. No gradients, no glassmorphism, no heavy shadows.

---

## 10. Do NOT

- ❌ Use random spacing values (14, 17, 23, 26, 31)
- ❌ Mix icon families (MaterialIcons + Lucide + Font Awesome)
- ❌ Add blue/purple/red colors outside the semantic palette
- ❌ Use heavy box-shadows on everything
- ❌ Put green borders on risk/warning cards
- ❌ Recreate the bottom navigation independently on each screen
- ❌ Recreate headers independently — use `ScreenHeader`
- ❌ Make every screen's information density wildly different
- ❌ Add gradients, 3D effects, or glassmorphism
- ❌ Use `Colors.primary` (#1A4122) where `Colors.primaryDark` (#00431D) is meant
- ❌ Forget that `Colors.white` and `Colors.border` no longer exist — use `Colors.surface` and `Colors.divider`

---

## 11. File Reference

| File | Purpose |
|------|---------|
| `mobile/src/constants/theme.ts` | All tokens (Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows, CardStyle) |
| `mobile/tokens.json` | Figma-compatible design tokens — import via Tokens Studio plugin |
| `mobile/src/components/ScreenHeader.tsx` | Reusable header component |
| `mobile/src/components/Card.tsx` | Reusable Card, Badge, SectionTitle, CardDivider components |
| `mobile/src/navigation/BottomTabs.tsx` | Bottom tab navigation (single source of truth) |

### Figma Import

1. Install [Tokens Studio for Figma](https://tokens.studio/) plugin
2. Open the plugin → Settings → Import → select `mobile/tokens.json`
3. All color, spacing, typography, radius, and shadow tokens will appear as Figma variables
4. Tokens are organized into groups: `color.brand`, `color.background`, `color.text`, `color.status`, `color.chip`, `spacing`, `borderRadius`, `fontFamily`, `typography`, `shadow`

---

## 12. Adding a New Screen

1. Import tokens: `import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';`
2. Use `ScreenHeader` for the header
3. Use `Card` component for cards with appropriate `border` prop
4. Use `Badge` for status pills
5. Set `screenPadding` (20px) as horizontal margin
6. Use `sectionGap` (24px) between content sections
7. Use `BorderRadius.lg` (24px) for cards
8. Apply semantic colors: green=good, amber=warning, red=risk
9. Keep the bottom tab navigation identical
10. Run `npx tsc --noEmit` to verify
