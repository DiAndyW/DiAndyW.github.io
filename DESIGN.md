# Portfolio Design Reference

> AI-optimized design document. When making UI changes, reference this file first.
> Stack: React + TypeScript + Vite + TailwindCSS v4 + Inter font.

---

## Color Palette

### Semantic Roles
| Role | Value | Usage |
|---|---|---|
| Background (base) | `bg-gray-900` / `#111827` | Page background, sticky header |
| Surface (card) | `#2d4a57` at `/20` opacity | Card backgrounds, FAB button |
| Surface hover | `#7bb3d1` at `/20` opacity | Card/button hover state |
| Accent (primary) | `#5d97b3` | Active nav, org titles, links, timeline dots, bullet points |
| Accent (light/hover) | `#7bb3d1` | Link hover, active FAB, bullet points in detail views |
| Border | `white/30` | All card and badge borders |
| Text primary | `text-white` | Headings, card titles, body |
| Text secondary | `text-gray-300` | Descriptions, bullet detail text, dates |
| Text tertiary | `text-gray-400` | Expand/collapse indicators, minor labels |

### Rules
- Never use pure `#000000` or `#FFFFFF` — the off-white/dark-gray approach is intentional.
- Accent `#5d97b3` is the only hue used for interactive meaning. Do not introduce new hues without purpose.
- Borders are always semi-transparent (`white/30` or `border-[#7bb3d1]` on hover) — never solid opaque borders.
- On hover, border upgrades to `border-[#7bb3d1]` paired with the `/20` surface change.
- All backgrounds are dark; this is a dark-mode-first design.

---

## Typography

### Font
- **Family:** Inter (loaded via `@theme` in `index.css`)
- **Fallback chain:** `ui-sans-serif, system-ui, sans-serif`

### Type Scale
| Role | Classes | Notes |
|---|---|---|
| Section heading (h1) | `text-3xl sm:text-4xl lg:text-5xl` | Used in every section |
| Card title | `text-lg sm:text-xl` (desktop), `text-base` (mobile) | Project/experience card titles |
| Organization subtitle | `text-sm sm:text-base` in `text-[#5d97b3]` | Bold, accent color |
| Body / description | `text-sm sm:text-base` or `text-l` (≈ text-lg) | `leading-relaxed` always |
| Detail bullet points | `text-xs sm:text-sm` | Shown only in expanded state |
| Labels / tech badges | `text-xs sm:text-sm` | Inside `rounded-full` badges |
| Footer / meta | `text-sm sm:text-base` | |

### Rules
- `font-normal` is the default weight — the page uses weight sparingly.
- `font-bold` for card titles and section headings only.
- `font-medium` for nav items, time labels, FAB nav items.
- `leading-relaxed` on all body/description text.
- Never set font sizes with arbitrary pixel values — use the Tailwind scale above.

---

## Spacing

### Container / Layout
- Page max-width: `max-w-7xl` (content column uses `max-w-4xl` inside ExperienceSection)
- Page horizontal padding: `px-2 sm:px-4`
- Section top margin: `mt-8` (consistent across all sections)
- Section heading padding: `p-2 sm:p-4`

### Cards
- Desktop card padding: `p-3 sm:p-4`
- Between desktop cards: `my-4 sm:my-6 lg:my-8`
- Between mobile cards: `space-y-3`
- Expanded detail area padding: `pt-3 sm:pt-4 mt-3 sm:mt-4` (after a border-top divider)

### Badges (tech tags)
- Padding: `px-2 py-1` (mobile/small), `px-2 sm:px-3 py-1` (responsive)
- Gap between badges: `gap-1` (mobile), `gap-1.5 sm:gap-2` (desktop)

### Header
- Header internal: `px-6 py-4`
- Icon buttons in header: `p-2` with `hover:bg-white/10 rounded-lg`

---

## Borders & Radius

### Border Style
- All cards: `border border-2 border-white/30` (2px, semi-transparent)
- Hover upgrade: `hover:border-[#7bb3d1]`
- Expanded section divider: `border-t border-white/20` (1px, more transparent)
- FAB nav panel: `border border-[#7bb3d1]`

### Border Radius
| Element | Class |
|---|---|
| Cards / panels | `rounded-lg` |
| Tech badges | `rounded-full` |
| Profile image | `rounded-full` |
| FAB button | `rounded-full` |
| Icon buttons (header) | `rounded-lg` |
| Flip cards (Misc) | `rounded-lg` |

**Rule:** Children always use equal or smaller radius than parent. Never a larger radius inside a card.

---

## Interactive Patterns

### Card Accordion (Projects + Experience)
- Click card → expand bullet points + link
- Expansion uses `max-h` + `opacity` transition (NOT `height`) — GPU-friendly
- `transition-all duration-300 ease-in-out`
- Collapsed: `max-h-0 opacity-0`
- Expanded: `max-h-96 opacity-100`
- On desktop: entire card is clickable; links inside use `e.stopPropagation()`

### Hover States (Cards)
```
default:  bg-[#2d4a57]/20  border-white/30  shadow-sm
hover:    bg-[#7bb3d1]/20  border-[#7bb3d1] shadow-md
```
- `transition-all duration-300` on all card transitions

### Links
- Color: `text-[#5d97b3]`
- Hover: `text-[#7bb3d1]`
- Style: `underline` + `transition-colors duration-200`
- External links: always `target="_blank" rel="noopener noreferrer"`

### Buttons / FAB
- Scale on hover: `hover:scale-110`
- Scale on press: `active:scale-95`
- FAB background: `bg-[#2d4a57]/80` → `hover:bg-[#5d97b3]/80`
- Focus ring: `focus:ring-2 focus:ring-[#7bb3d1]`

---

## Layout System

### Desktop (md+)
- 3-column flex layout inside `max-w-7xl`:
  - **Left col** (sticky sidebar nav): `w-16 sm:w-20 md:w-24 lg:w-1/7`, `sticky top-24`
  - **Center col** (main content): `flex-1`
  - **Right col** (empty spacer): `w-12 lg:w-1/6`
- Header: `sticky top-0 z-50 bg-gray-900`, content `w-7/10`
- Top fade overlay: `linear-gradient` from `gray-900` → transparent, `height: 150px`, `z-40 pointer-events-none`

### Mobile (< md)
- Single column, no sidebar
- FAB navigation: `fixed top-6 left-6 z-50`, expands into a dropdown panel
- FAB items animate in with `50ms` stagger delay per item

### Responsive Breakpoints (Tailwind defaults)
| Prefix | Width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

---

## Component Inventory

### Header
- Sticky, full-width, `bg-gray-900`
- Name as scroll-to-top button (no underline, color-change hover)
- Icon links (GitHub, LinkedIn, Resume, Email) — `w-8/w-9` SVG/PNG icons

### Sidebar Nav (Desktop only)
- Vertical list of section anchors
- Active: `font-bold text-[#5d97b3]`
- Inactive hover: `hover:text-[#5d97b3]`

### FAB Nav (Mobile only)
- Circular button (hamburger ↔ X icon animated)
- Expands into `bg-gray-800 border border-[#7bb3d1] rounded-lg` panel
- Each nav item: `rounded-full`, active state gets `bg-[#5d97b3] ring-2 ring-[#7bb3d1]`

### Content Cards (Experience + Projects)
- `bg-[#2d4a57]/20 hover:bg-[#7bb3d1]/20`
- `border-2 border-white/30 rounded-lg`
- Header: title (bold white) + org name (bold `#5d97b3`) + description
- Tech badges: `rounded-full border-2 border-white/30`
- Expandable bullet list + optional "View Project" link

### Flip Cards (Misc section)
- Fixed size: `w-64 h-80`
- CSS 3D flip: `perspective: 1000px`, `transformStyle: preserve-3d`, `rotateY(180deg)`
- Trigger: `onMouseEnter` / `onTouchStart`
- Both faces: `bg-[#2d4a57]/20 backdrop-blur-sm border-2 border-white/30 rounded-lg`

### Experience Timeline (Desktop)
- Vertical line: `w-0.5 bg-gradient-to-b from-gray-300 via-gray-300 to-transparent`
- Dots: `w-3 h-3 bg-[#7bb3d1] rounded-full border-2 border-white`
- 2-column grid inside: time label (col-span-2) + card (col-span-4)

### Tech Badges
- `border border-2 border-white/30 rounded-full`
- `text-xs sm:text-sm px-2 sm:px-3 py-1`
- Text color: `text-white`

### Footer
- Simple centered text, `text-sm sm:text-base`
- Padding scales: `py-8 sm:py-12 md:py-16 lg:py-20`

---

## Animation & Motion

- **Accordion expand/collapse:** `max-h` + `opacity`, `duration-300 ease-in-out`
- **Card hover:** `transition-all duration-300` (bg + border + shadow)
- **FAB menu:** `opacity` + `translateY`, `duration-300`, stagger via inline `transitionDelay`
- **FAB icon:** hamburger ↔ X via `opacity` + `rotate`, `duration-300`
- **Scale interactions:** `hover:scale-110 active:scale-95`, `duration-300`
- **Links:** `transition-colors duration-200`
- **Flip cards:** CSS transform `rotateY(180deg)`, `duration-800` (custom via inline style)

**Rules:**
- Only animate `transform` and `opacity` — never `width`, `height`, `top`, `left`
- Avoid `linear` easing; use `ease-in-out` for repositioning, `ease-in-out` for accordions
- Motion is subtle and purposeful — this is a professional portfolio, not a showcase of animation

---

## Design Personality & Voice

- **Aesthetic:** Dark, clean, developer-focused. Restrained use of color — the steel-blue accent earns attention by being used sparingly.
- **Tone:** Personal but professional. Friendly prose in bio sections, structured data in cards.
- **Principle:** Content-first. Typography and whitespace do the heavy lifting; decoration is minimal.
- **Closest design inspiration:** Linear-style restraint (monochrome + one accent, everything earns its place) applied through a warm personal voice.

---

## What to Avoid

- Do NOT introduce new accent colors. The `#5d97b3` / `#7bb3d1` pair is the only hue.
- Do NOT use solid white/gray borders — keep them semi-transparent (`/30`, `/20`).
- Do NOT add shadows beyond `shadow-sm` / `shadow-md` — this palette doesn't need them.
- Do NOT use `font-semibold` between `font-medium` and `font-bold` — the current scale uses only those two.
- Do NOT animate `max-height` with values tighter than `max-h-96` for content that might grow.
- Do NOT break the mobile/desktop layout split — mobile always uses accordion, desktop uses its richer layout.
