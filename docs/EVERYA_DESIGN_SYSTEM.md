# EVERYA Design System

**Phase:** 3 — Experience Transformation (Step 3)  
**Status:** Implemented foundation  
**Live reference:** `/design-system` (authenticated app shell)

---

## 1. Design principles

EveryA’s visual language combines **editorial calm**, **technical credibility**, **publication identity**, and **social discovery**.

| Principle | Meaning |
|-----------|---------|
| Content-first | Typography and whitespace serve reading; UI chrome stays quiet |
| Editorial + technical | Serif for long-form; sans for UI; mono for code |
| Coherent surfaces | Six surface types — not every block is a card |
| Intentional interaction | Visible focus, touch targets ≥ 44px on nav, motion communicates state |
| Original identity | Learn from excellent products; do not copy Medium/Substack/Notion wholesale |
| Extensible | Content primitives prepare for publication-aware feed and future Trace UI |

---

## 2. Typography

**Fonts** (unchanged from Phase 1/2):

- **UI:** Geist Sans (`--font-geist-sans`)
- **Editorial:** Source Serif 4 (`--font-source-serif`)
- **Code:** Geist Mono (`--font-geist-mono`)

### Semantic scale (CSS classes)

| Class | Use |
|-------|-----|
| `.typo-display` | Landing hero, major marketing moments |
| `.typo-page-title` | Page H1 (Explore, Dashboard, Settings) |
| `.typo-section-title` | Section H2, card titles |
| `.typo-article-title` | Article/reader headlines |
| `.typo-article-subtitle` | Article dek, page descriptions |
| `.typo-body` | Default UI body (15px) |
| `.typo-body-sm` | Secondary UI text (14px) |
| `.typo-meta` | Timestamps, counts, breadcrumbs |
| `.typo-nav` | Navigation links, button labels |
| `.typo-label` | Form labels |
| `.typo-caption` | Uppercase section eyebrows |
| `.typo-code` | Inline code in UI |

**Article body:** `.article-body` in `globals.css` — preserved for reader; do not override in app chrome.

**TypeScript helpers:** `lib/design-system.ts` → `typography.*`

---

## 3. Colors

Semantic tokens in `:root` / `.dark` and Tailwind `@theme`:

| Token | Purpose |
|-------|---------|
| `background` | Page canvas |
| `surface` | Subtle page sections |
| `elevated` | Raised panels |
| `card` | Component surfaces |
| `foreground` | Primary text |
| `muted` / `muted-foreground` | Fills and secondary text |
| `border` / `ring` | Dividers and focus |
| `accent` / `accent-foreground` | Primary actions |
| `destructive` | Destructive actions |
| `success` | Confirmations |
| `warning` | Caution |
| `error` | Errors (aligned with destructive tone) |
| `info` | Informational |

Palette is **warm-neutral** and content-first — not excessively colorful.

---

## 4. Spacing

CSS variables:

| Token | Value | Use |
|-------|-------|-----|
| `--page-padding-x` | 1.25rem | Mobile horizontal page padding |
| `--page-padding-x-lg` | 2rem | Desktop horizontal page padding |
| `--page-padding-y` | 1.5rem | Vertical page padding |
| `--section-gap` | 2rem | Between major sections |
| `--stack-gap` | 0.75rem | Vertical stacks |
| `--inline-gap` | 0.5rem | Inline groups |

Utility classes: `.px-page`, `.py-page`, `.page-container`, `.gap-section`, `.gap-stack`, `.gap-inline`

**Rule:** Prefer page utilities over ad-hoc `px-5` / `px-6` / `sm:px-8` on new work.

---

## 5. Surfaces

| Variant | Class / component | When to use |
|---------|-------------------|-------------|
| Flat | `surface-flat` | Full-bleed content areas |
| Bordered | `surface-bordered` | Default panels |
| Elevated | `surface-elevated` | Cards, stats (replaces ad-hoc `.stat-card` over time) |
| Featured | `surface-featured` | Hero feed items |
| Interactive | `surface-interactive` | Hoverable rows |
| Inset | `surface-inset` | Empty states, dashed placeholders |

**React:** `<Surface variant="…" padding="sm|md|lg" />`  
**Legacy:** `.stat-card`, `.feed-hero` remain as aliases during migration.

**Do not** wrap every list item in elevated cards — feeds should feel editorial.

---

## 6. Buttons

Component: `components/ui/button.tsx`

| Variant | Use |
|---------|-----|
| `default` | Primary action |
| `secondary` | Secondary action |
| `outline` | Tertiary / cancel |
| `ghost` | Toolbar, icon contexts |
| `destructive` | Delete, irreversible |
| `link` | Inline text actions |

| Size | Height |
|------|--------|
| `default` | 40px (h-10) |
| `sm` | 36px |
| `lg` | 44px |
| `icon` | 40×40px |
| `icon-sm` | 36×36px |

| Shape | Use |
|-------|-----|
| `default` | **Preferred** — `rounded-md` |
| `pill` | Sparingly — marketing CTAs only |

**States:** `loading` prop shows spinner + `aria-busy`; focus ring via `ring-2 ring-ring ring-offset-2`.

---

## 7. Forms

| Component | Path |
|-----------|------|
| `Input` | `components/ui/input.tsx` |
| `Textarea` | `components/ui/textarea.tsx` |
| `Label` | `components/ui/label.tsx` |
| `FormField` | `components/ui/form-field.tsx` |

**States:** `aria-invalid` on input → error border; `FormField` renders description, error, success messages.

**Height:** Inputs use h-10 for touch-friendly targets.

---

## 8. Navigation primitives

| Component | Path | Status |
|-----------|------|--------|
| `NavLink` | `components/navigation/nav-link.tsx` | Ready for Step 4 |
| `PageHeader` | `components/navigation/page-header.tsx` | Ready |
| `TabsNav` | `components/ui/tabs.tsx` | Used by Explore tabs |
| `Breadcrumbs` | `components/repos/breadcrumbs.tsx` | Enhanced a11y |

Full navigation/IA redesign is **Step 4** — primitives only in Step 3.

---

## 9. Content primitives

| Component | Purpose |
|-----------|---------|
| `AuthorIdentity` | Avatar + name + meta |
| `PublicationIdentity` | Publication block |
| `ContentMeta` | Reading time, dates, topics |
| `ContentTypeBadge` | Article / document / publication / collection |
| `EngagementStats` | Views, claps, responses, rating, read time |

Used in design showcase; feed/reader migration in Steps 5–7.

---

## 10. State components

| Component | Variants |
|-----------|----------|
| `EmptyState` | title, description, optional action |
| `LoadingState` | `spinner` (default), `skeleton`, `inline` |
| `ErrorState` | title, message, retry |
| `Skeleton` / `SkeletonText` | Placeholder shapes |
| `Spinner` | Inline/button loading |

---

## 11. Interaction states

All interactive primitives support:

- **Default** — resting
- **Hover** — `motion-fast` background/opacity
- **Focus** — visible `ring-2` (global `:focus-visible` + component rings)
- **Active** — opacity on primary buttons
- **Disabled** — `opacity-50`, `pointer-events-none`
- **Loading** — Button `loading`, Spinner `aria-label`
- **Error** — Form `aria-invalid`, error text `role="alert"`

---

## 12. Accessibility

- Semantic HTML (`nav`, `label`, `dialog`, `role="status"`, `role="alert"`)
- Breadcrumb `aria-label`
- Search input `aria-label`
- Touch targets: nav links `min-h-[44px]`, buttons h-10 default
- `prefers-reduced-motion` disables animations and feed hover transforms
- Screen-reader labels on engagement stats (`sr-only`)

WCAG compliance not claimed without audit tooling.

---

## 13. Motion

| Token | Duration |
|-------|----------|
| `--duration-fast` | 120ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 320ms |

Classes: `.motion-fast`, `.motion-normal`, `.motion-slow`  
Easing: `--ease-standard`

**Reduced motion:** global override in `globals.css`.

---

## 14. Responsive behavior

- `.page-container` — max-width 72rem, responsive horizontal padding
- `.read-container` — max-width 42rem for article measure
- Components use fluid typography (`clamp` on display/article titles)
- Mobile-first spacing tokens

---

## 15. Component usage rules

1. **Reuse** `Button`, `Surface`, `FormField`, content primitives before creating variants.
2. **Prefer** `typo-*` classes over one-off `text-2xl font-semibold`.
3. **Use** `PageHeader` for new page titles.
4. **Use** `EmptyState` / `LoadingState` / `ErrorState` instead of plain `<p>`.
5. **Avoid** `rounded-full` on every CTA — default button shape is `rounded-md`.
6. **Do not** add new color hex values in components — use semantic tokens.
7. **Preserve** `.article-body` for rendered markdown.
8. **Technical callouts:** `.callout`, `.callout-note`, `.callout-warning`, `.callout-tip` for reader (Phase 5 rendering TBD).

---

## File reference

| Area | Path |
|------|------|
| Tokens & utilities | `app/globals.css` |
| TS constants | `lib/design-system.ts` |
| UI primitives | `components/ui/*` |
| States | `components/everya/*` |
| Navigation | `components/navigation/*` |
| Content | `components/content/*` |
| Showcase | `app/(app)/design-system/page.tsx` |
