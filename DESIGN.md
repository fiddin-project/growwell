---
name: GrowWell
colors:
  surface: '#f7fffe'
  surface-dim: '#c4cec9'
  surface-bright: '#f7fffe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f8f7'
  surface-container: '#ebf2f1'
  surface-container-high: '#e5eceb'
  surface-container-highest: '#dfe7e5'
  on-surface: '#171d1c'
  on-surface-variant: '#3f4947'
  inverse-surface: '#2b3231'
  inverse-on-surface: '#ecf2f0'
  outline: '#6f7977'
  outline-variant: '#bfc9c7'
  surface-tint: '#00696e'
  primary: '#004d50'
  on-primary: '#ffffff'
  primary-container: '#00696e'
  on-primary-container: '#70f7ff'
  inverse-primary: '#008489'
  secondary: '#4a6363'
  on-secondary: '#ffffff'
  secondary-container: '#6d8b8b'
  on-secondary-container: '#ffffff'
  tertiary: '#4b607b'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e84a0'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a1f0f7'
  primary-fixed-dim: '#34e4ed'
  on-primary-fixed: '#001f22'
  on-primary-fixed-variant: '#00373a'
  secondary-fixed: '#a1f0f7'
  secondary-fixed-dim: '#90d4d4'
  on-secondary-fixed: '#051f1f'
  on-secondary-fixed-variant: '#324b4b'
  tertiary-fixed: '#b5caea'
  tertiary-fixed-dim: '#96afcf'
  on-tertiary-fixed: '#061d36'
  on-tertiary-fixed-variant: '#354c66'
  background: '#f7fffe'
  on-background: '#171d1c'
  surface-variant: '#dae5e3'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2.5rem
  xl: 4rem
  gutter: 24px
  margin: 32px
  container-max: 1440px
---

## Brand & Style
GrowWell is a child health monitoring platform designed for healthcare professionals and caregivers. The design system establishes a calm, trustworthy, and clinical-yet-empathetic environment. It prioritizes clarity, data legibility, and professional reliability while maintaining a warm, supportive tone appropriate for pediatric wellness contexts.

The visual style is **Corporate / Modern** with modular components. It emphasizes spacious layouts, soft geometry, and systematic data visualization. The emotional response is calm assurance — healthcare providers trust that data is organized and the platform is supportive.

## Colors
The palette is rooted in a **Deep Teal** (`#004d50`) as the primary brand color, chosen for its association with health, stability, calm, and professional maturity. The entire system uses a **teal-only gradient family** at 135 degrees for depth and emphasis.

- **Primary (Deep Teal):** Used for key actions, navigation states, and brand identifiers.
- **Primary Container:** `#00696e` for filled backgrounds on buttons, badges, and stat cards.
- **Surface (Mint Tint):** A very soft neutral-green background (`#f7fffe`) to reduce eye strain during long administrative sessions.
- **Neutral Surface:** Cards and containers use `#ffffff` with subtle teal-tinted borders (`rgba(0,67,73,0.08)`).
- **Functional Grays:** A cool-toned scale for text and borders to maintain high accessibility and professional distance.

### Gradient System
A **subtle, minimal gradient** (135deg, teal family only) is applied to high-impact surfaces:
- **Page Headers:** `linear-gradient(135deg, #e0f5f5 0%, #ccf0ed 50%, #b8ebe8 100%)` — subtle background wash.
- **Primary Buttons:** `linear-gradient(135deg, #00696e, #00555a)` — very subtle darkening for depth.
- **Stat Cards:** Left accent border `rgba(0,67,73,0.12)` with teal-tinted background.
- **Sidebar:** `linear-gradient(180deg, #004d50 0%, #003a3d 100%)` — deep teal foundation.
- **Login Page:** Full-page `linear-gradient(135deg, #004d50 0%, #003a3d 50%, #00282b 100%)`.
- **Pagination:** Active page uses primary teal fill.

Gradients are **not** applied to tables, modals, inputs, or low-emphasis surfaces.

## Typography
This design system utilizes **Plus Jakarta Sans** across all levels. It was selected for its modern geometric foundation paired with soft, humanist curves that feel approachable yet precise.

For data-heavy admin screens, the scale prioritizes legibility. Labels use slightly increased letter spacing and semi-bold weights for clear categorization of child health metrics. Body text defaults to 16px for comfortable readability during multi-tasking.

- **Headings (600-700 weight):** Used for page titles, section headers, and card headings.
- **Body (400 weight):** Default for descriptions, table content, and form labels.
- **Labels (600 weight):** Used for badges, status chips, navigation items, and interactive element labels.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy within a maximum container width to maintain information density without overwhelming the user.

- **Desktop:** A 12-column grid with 24px gutters. The sidebar is fixed at 280px (collapsible to 64px icon-only mode) for a consistent navigation anchor.
- **Tablet:** Transitions to an 8-column grid. The sidebar collapses to a hamburger menu.
- **Mobile:** A single-column flow with 16px margins.

The spacing rhythm is built on a 4px baseline, defaulting to generous 24px (md) padding for containers to reinforce the spacious and clean brand personality.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. The system avoids harsh borders in favor of soft differentiation.

1. **Base Layer:** The light mint-tinted background (`#f7fffe`).
2. **Content Layer:** White cards (`#FFFFFF`) with:
   - Border: `1px solid rgba(0,67,73,0.08)` (subtle teal tint)
   - Shadow: `0 1px 3px rgba(0,67,73,0.04), 0 1px 2px rgba(0,67,73,0.06)`
   - Radius: `0.75rem` (lg) for standard cards, `1rem` (xl) for modals
3. **Interactive Layer:** Active components use a more pronounced shadow and a 1px teal stroke to denote focus. Hover states use `translateY(-1px)` with increased shadow for lift effect.
4. **Modals:** Stacked modals track overflow via `document.body.dataset.modalCount` — body scroll restores only when the last modal closes.

## Shapes
The shape language uses **Rounded** geometry to soften the clinical nature of the data.

- **Standard Components:** Buttons, inputs, and selects use `radius-lg` (1rem).
- **Containers:** Cards, modals, and data panels use `radius-xl` (1.5rem).
- **Badges & Status Chips:** Fully circular (`radius-full`) for pill-shaped indicators.
- **Action Buttons:** Small icon buttons use `radius-md` (0.75rem).

## Components

### Buttons
- **Primary:** Deep teal fill with white text. Subtle 135deg gradient for depth. Hover darkens and lifts. `transition: all 200ms ease`.
- **Secondary:** Teal outline with teal text. Fill on hover.
- **Danger:** Coral-red fill for destructive actions (reset defaults, delete).
- **Ghost:** Reserved for tertiary actions like Cancel or Go Back. Text-only.
- **Small variant:** Used in table action columns. Compact padding, consistent styling.

### Input Fields
Fields feature a teal-tinted border (`rgba(0,67,73,0.2)`) that becomes primary teal on focus. Labels are positioned above the field using `label-md` for clarity. Error states use a soft coral-red with a 300ms shake animation. All fields use `radius-lg` (1rem) for consistency.

### Cards
Cards are the primary organizational unit. They use:
- White background
- `1rem` (lg) corner radius
- Subtle teal-tinted border (`rgba(0,67,73,0.08)`)
- Soft ambient shadow
- **Stat Cards:** Left accent border, icon circle, hover lift effect
- **Chart Containers:** Consistent with card styling, padded header area

### Status Chips / Badges
Badges use utility CSS classes for consistent theming:
- **Success (`badge-success`):** Teal-tinted background for normal/positive states.
- **Neutral (`badge-neutral`):** Light gray for informational states.
- **Info (`badge-info`):** Blue-tinted for pending/processing states.
- **Error (`badge-error`):** Red-tinted for warning/critical states.

All badges use `role="status"` for accessibility.

### Data Tables
Row-based lists feature:
- Hover state: `rgba(0,67,73,0.04)` background for tracking across wide screens
- Subtle row borders using `rgba(0,67,73,0.06)`
- Sorting indicators on column headers
- Page reset on data change
- Numeric-aware sorting
- `aria-busy` during loading states
- Screen-reader-only `<caption>` elements

### Modals
- Centered overlay with backdrop blur
- `radius-xl` (1.5rem) corners
- Stacked modal support via body dataset tracking
- Focus trap that re-queries dynamic elements
- Close on Escape key, backdrop click, or close button

### Navigation (Sidebar)
- Deep teal gradient background (`180deg, #004d50 → #003a3d`)
- White text, icon + label layout
- Collapsible to icon-only mode (64px)
- Hover state: subtle white overlay
- Logout button at footer (no settings menu)
- Brand logo/name at top

### Pagination
- Teal-themed active page indicator
- Subtle border styling consistent with card system
- Hover state for interactive feedback
