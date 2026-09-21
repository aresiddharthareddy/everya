# EVERYA Phase 3 — UX Audit

**Date:** 2025-09-21  
**Branch audited:** `cursor-branch` @ `6c55932`  
**Scope:** Frontend product experience (Phase 2 complete; Phase 3 not started)  
**Method:** Static review of `everya/everya` app routes, layouts, components, `globals.css`, and key user flows. No UI changes made during this audit.

---

## Executive summary

EveryA is **functionally rich** after Phase 2 (auth, profiles, publications, publishing, social graph, engagement, reading, notifications, discovery APIs). The backend and route surface are credible.

The **product experience gap** is real: the UI reads as a capable but **generic publishing CRUD app** with Medium-adjacent feed patterns, inconsistent shells, and under-used state components. Phase 3 should unify navigation, establish a distinctive EveryA design language, and propagate it systematically — without touching Phase 4 Trace backend work.

---

## 1. Current UX strengths

| Area | Evidence |
|------|----------|
| **Typography foundation** | `Source Serif 4` for article body, `Geist` for UI (`app/layout.tsx`); `.article-body` rules in `globals.css` (line length, headings, blockquote, code, tables) |
| **Reader mode** | `AppShell` switches to `ReaderTopBar` for `/p/[handle]/[slug]` and `/r/.../.../...` (`components/layout/app-shell.tsx`) |
| **Reader tools** | `ArticleReader`: TOC drawer, collection tree drawer, `ReaderToolbar`, width/focus prefs (`hooks/use-reader-prefs.ts`) |
| **Discovery tabs** | Explore supports For You / Following / Latest / Trending (`components/feed/explore-tabs.tsx`, `app/(app)/explore/page.tsx`) |
| **Feed hierarchy** | `FeedStoryRow` featured variant + standard rows (`components/feed/feed-story-row.tsx`) |
| **Publication identity** | `/p/[handle]` landing with metadata, follow, members, articles (`app/p/[handle]/page.tsx`) |
| **Profile depth** | `/u/[username]` tabs: Articles, Publications, About (`app/u/[username]/page.tsx`) |
| **Search affordance** | Global ⌘K modal (`components/search/search-modal.tsx`) |
| **Dark mode** | CSS variables + `next-themes` (`globals.css`, `theme-toggle.tsx`) |
| **State primitives** | `EmptyState`, `LoadingState`, `ErrorState` (`components/everya/`) — exist but rarely used |
| **Repository navigation** | `RepoTree`, `Breadcrumbs` — strong Phase 4 Trace UI seed |
| **SEO** | `generateMetadata` on publication/article routes |

---

## 2. Current UX weaknesses

| Weakness | Impact |
|----------|--------|
| **Dual “home” concept** | Sidebar “Home” → `/dashboard` (creator desk); social discovery → `/explore`. New users lack a single mental model of where the product starts. |
| **Fragmented app shells** | Authenticated app uses `AppShell`; profiles (`/u/`) and landing (`/`) use bespoke headers. Breaks continuity. |
| **Generic feed aesthetic** | `FeedStoryRow` closely follows Medium patterns (avatar-left, serif headline, engagement stats). Does not express publication-first or knowledge identity. |
| **Placeholder visuals** | `feed-thumb` is an empty gradient block (`feed-story-row.tsx` L84) — decorative, not informative. |
| **Terminology drift** | UI mixes *stories*, *articles*, *documents*, *collections*, *repositories*, *publications* without a consistent map. |
| **Creator path fragmentation** | Create flows: `/publications/new`, `/p/[handle]/write`, `/dashboard/new`, `/r/.../new`, top-bar “Write” → collection not article. |
| **Thin state UX** | Most empty/loading paths are plain `<p>` strings; skeletons almost absent. |
| **Notifications UX** | Flat list; all marked read on page open; no grouping (`app/(app)/notifications/page.tsx`). |
| **Search UX lag** | API supports authors/publications; modal UI still “docs, repositories” copy and limited type differentiation (`search-modal.tsx`). |
| **Publication invisible in feed** | `FeedStoryRow` shows author, not publication — undermines Phase 2 publication model. |

---

## 3. Visual inconsistencies

| Issue | Locations |
|-------|-----------|
| Page title styles | `font-serif text-3xl` (explore, dashboard) vs `text-2xl font-semibold` (repo, notifications) vs profile standalone header |
| Card patterns | `.stat-card`, `Card` component, `feed-hero`, dashed `EmptyState` — four surface treatments |
| Button shape | Ubiquitous `rounded-full` vs default `rounded-md` on some forms |
| Header height | `h-12` top bar vs `h-14` landing/profile headers |
| Spacing scale | `px-5 sm:px-8` vs `px-6` vs `p-6` without documented rhythm |
| Engagement presentation | `DocStatsBar`, `FeedStats`, `sticky-engagement-bar` — overlapping purposes |

---

## 4. Navigation problems

```
Current primary nav (LeftSidebar):
  Home → /dashboard
  Explore → /explore
  Publications → /publications/new   ← create, not browse
  Library → /reading-list
  Stats → /stats
  Settings → /settings
```

| Problem | Detail |
|---------|--------|
| No publications directory | Users cannot browse publications from nav — only create. |
| Profile not in nav | Reachable via avatar in top bar only. |
| Notifications not in sidebar | Top bar bell only. |
| `/u/` outside shell | Profile feels like a separate site. |
| Reader back links | `ReaderTopBar` handles `/p/` and `/r/` — good, but inconsistent with explore entry. |

**Recommendation for Phase 3:** Define one IA map (reader vs creator vs identity) before redesigning nav.

---

## 5. Information hierarchy problems

| Screen | Issue |
|--------|-------|
| **Landing `/`** | Duplicates explore’s trending role; value prop then immediately “database stats + story list.” |
| **Dashboard** | Writer stats + collections dominate; not a reader’s home. |
| **Explore** | Strongest social feed, but sidebar “Collections” competes with main feed for attention. |
| **Repository `/r/...`** | File-tree first; publication/social identity secondary. |
| **Publication `/p/...`** | Better hierarchy; still list-heavy without featured/editorial layout. |
| **Article reader** | Content is strong; author/publication block competes with floating control cluster (bottom-right). |

---

## 6. Mobile problems

| Issue | File / area |
|-------|-------------|
| Repository tree hidden below `md` | `app/(app)/r/[username]/[repo]/page.tsx` — tree duplicated in body, still cramped |
| Feed row hover margin shift | `.feed-row:hover` negative margins (`globals.css`) — awkward on touch |
| Reader floating controls | Bottom-right stack may obscure text on small screens (`article-reader.tsx`) |
| Profile page | No bottom nav; standalone header only |
| Sidebar drawer | Mobile nav via `setMobileNavOpen` — functional but not polished |
| Touch targets | Some icon buttons `h-8 w-8` — borderline 44px guideline |

---

## 7. Accessibility problems

| Issue | Severity |
|-------|----------|
| Search modal input has no `aria-label` | Medium |
| Empty `feed-thumb` decorative block | Low |
| Comment textarea — label association unclear | Medium |
| No `prefers-reduced-motion` for `feed-hero` transform/animation | Medium |
| Focus visibility relies on default ring — not audited across all interactives | Medium |
| Notification links with `href="#"` fallback | Low |
| Color contrast on `muted-foreground` — likely OK but not verified with tooling | Low |

---

## 8. Interaction problems

| Interaction | Issue |
|-------------|-------|
| Follow / publication follow | Works; no loading indicator on button (busy state exists but minimal feedback) |
| Bookmark / like | API wired; reader engagement spread across multiple bars |
| Comment submit | No inline error state on failure |
| Autosave (write editor) | Text-only “Saving…” — easy to miss |
| Search | No keyboard navigation between results |
| Notifications | Opening page clears unread — surprising if user wanted to skim |

---

## 9. Loading / empty / error states

| Component | Usage today |
|-----------|-------------|
| `EmptyState` | Explore For You only |
| `LoadingState` | Write editor error path only (removed loading effect) |
| `ErrorState` | Write editor missing article |
| `app/loading.tsx` | Root loading — generic |
| `app/error.tsx` | Root error boundary — exists |
| Skeletons | **None** in feed, profile, notifications, reading list |

**Common pattern to replace:** `text-sm text-muted-foreground` one-liners (notifications, explore empty following, profile empty lists).

---

## 10. Content readability

**Strengths:** `.article-body` is the best-designed surface in the app — serif body, clear heading scale, code/table/blockquote rules.

**Gaps:**

- No max-width token applied consistently (reader uses `use-reader-prefs` width classes — good)
- Subtitle field exists in model but under-displayed in reader headers
- Cover images not prominently used in reader layout
- Inline code and pre blocks lack “technical callout” variants (note/warning/tip)
- No image caption styling

---

## 11. Creator workflow problems

| Step | Current UX |
|------|------------|
| Choose what to create | **Unclear** — Write → collection; Publications nav → new publication; no chooser |
| Write article | `/p/[handle]/write` — good once user knows handle |
| Autosave | 3s debounce; status text easy to miss |
| Preview | Link opens new tab — good |
| Publish | Single button; no confirmation of visibility/audience |
| Edit repo doc | Separate `/r/.../edit` path — parallel universe to publication articles |

**Risk:** Technical users may use repositories; social users publications — UI does not explain the relationship.

---

## 12. Discovery problems

| Issue | Detail |
|-------|--------|
| Landing vs Explore overlap | Both surface trending public documents |
| For You cold start | `EmptyState` exists — good — but only on explore tab |
| Publication content under-signaled | Feed cards author-centric |
| Topics sidebar | Tag pills work; not integrated into card hierarchy |
| No “discover publications” browse page | API `GET /api/publications` exists; no dedicated UI |

---

## 13. Social interaction problems

| Area | Issue |
|------|-------|
| Reactions | Like + rating coexist — UI may confuse (clap vs stars) |
| Comments | Flat “Discussion” section; reply nesting shallow visually |
| Share | `ShareButton` exists — not prominent in reader hierarchy |
| Follow | Works; follower counts on profile — no dedicated followers list UI |
| Engagement counts | Shown in feed; less cohesive in reader |

---

## 14. Generic / “not EveryA” areas

| Area | Why it feels generic |
|------|---------------------|
| Feed rows | Medium-like layout and metadata row |
| Neutral monochrome palette | Could be any SaaS/blog |
| `stat-card` everywhere | Dashboard-widget aesthetic |
| “Stories for you” headline | Medium copy tone |
| Empty gradient thumbnails | Placeholder blog pattern |
| Rounded-full CTAs | Substack/Medium trope |

**Distinctive opportunity:** Visual language that combines **editorial calm + technical credibility + publication identity + social graph** — not yet expressed.

---

## 15. Areas that should become distinctive EveryA experiences

| Experience | Direction (Phase 3) |
|------------|---------------------|
| **Explore / For You** | Publication-aware cards, content-type badges, editorial featured slot |
| **Publication page `/p/`** | Media-organization identity — cover, logo, contributor strip, featured article |
| **Reader** | Content-first chrome; publication + author ribbon; reading progress; discussion entry |
| **Profile** | Expertise identity — topics, publications, activity strip — inside unified shell |
| **Library** | Personal knowledge space — continue reading + bookmarks + history |
| **Create flow** | Single “Create” entry: article / publication / collection (no fake Trace) |
| **Repository browser** | Lean into hierarchy — breadcrumb + tree as knowledge navigation preview |
| **Search** | Typed results (people · publications · articles · topics) with filters |

---

## 16. Trace-ready foundations (already present — do not rename)

| Asset | Path | Phase 4 relevance |
|-------|------|-------------------|
| `RepoTree` | `components/repos/repo-tree.tsx` | Folder/document hierarchy |
| `Breadcrumbs` | `components/repos/breadcrumbs.tsx` | Trace path |
| Repository layout | `/r/[username]/[repo]` | Collection/knowledge home |
| `articleHref()` | `services/feed.ts` | Dual URL strategy (`/p/` vs `/r/`) |

**Phase 3 rule:** Extend components (hierarchical nav, content context, extensible cards) — **no Trace model, routes, or APIs.**

---

## 17. Component inventory (reuse vs refactor)

| Reuse | Refactor / extend |
|-------|-------------------|
| `Button`, `Input`, `Textarea`, `Badge`, `Avatar`, `Card` | `FeedStoryRow` → content card system |
| `ArticleReader`, `MarkdownRenderer`, `.article-body` | `AppShell`, nav, headers |
| `ExploreTabs` | `LeftSidebar`, `TopBar`, `ReaderTopBar` |
| `FollowButton`, `PublicationFollowButton` | `CommentSection` |
| `SearchModal` | `EmptyState` / loading skeletons |
| `TagPills` | Notifications list |
| `RepoTree`, `Breadcrumbs` | Profile shell integration |

---

## 18. Route / layout map

| Route group | Layout | In AppShell? |
|-------------|--------|--------------|
| `/` | Standalone landing | No |
| `/login`, `/signup` | Auth | No |
| `/explore`, `/dashboard`, … | `(app)` → `AppShell` | Yes |
| `/u/[username]` | Standalone | No |
| `/p/[handle]`, `/p/.../write` | Mixed (`write` outside reader) | Partial |
| `/p/[handle]/[slug]` | Reader shell | Yes (reader mode) |
| `/r/.../.../...` | Reader shell | Yes (reader mode) |
| `/publications/new` | `(app)` | Yes |

---

## 19. Priority matrix for Phase 3 implementation

| Priority | Workstream |
|----------|--------------|
| **P0** | Design system tokens + typography scale (`EVERYA_DESIGN_SYSTEM.md`) |
| **P0** | Unified navigation / IA (single shell, consistent headers) |
| **P0** | Content card system + publication-aware feed |
| **P1** | Reader transformation (hierarchy, technical blocks, engagement) |
| **P1** | Profile + publication page identity |
| **P1** | Creator flow unification |
| **P1** | Empty/loading/error/skeleton system-wide |
| **P2** | Search + notifications UX |
| **P2** | Mobile pass + accessibility pass |
| **P2** | Motion system + design showcase route |
| **P3** | Trace-ready component extensions (no backend) |

---

## 20. What Phase 3 must NOT do

- Migrate Repository → Trace (Phase 4)
- Add fake Trace routes, APIs, or UI labels implying Trace exists
- Rewrite backend or Prisma models for UX alone
- Copy Medium/Substack/Notion visual patterns wholesale
- Add monetization, collaboration, knowledge graph, or AI features
- Remove or weaken server-side authorization

---

## 21. Suggested Phase 3 documentation deliverables (next steps)

| Document | Status |
|----------|--------|
| `EVERYA_PHASE3_UX_AUDIT.md` | ✅ This file |
| `EVERYA_DESIGN_SYSTEM.md` | ⬜ Next |
| `EVERYA_UX_GUIDELINES.md` | ⬜ Next |
| `EVERYA_PHASE3.md` | ⬜ During implementation |

---

## 22. Audit conclusion

EveryA has **strong engineering and feature coverage** from Phases 1–2. The product is ready for a **systematic experience transformation**, not a rewrite.

The highest-leverage Phase 3 work is:

1. **Coherent design system** applied everywhere  
2. **Unified navigation** and shell  
3. **Publication-first discovery** (feed + cards + search)  
4. **Reader and creator excellence**  
5. **Consistent states** (empty/loading/error)  
6. **Mobile + a11y** as first-class constraints  

Proceed to design system definition (Phase 3 Step 3) before large-scale component changes.
