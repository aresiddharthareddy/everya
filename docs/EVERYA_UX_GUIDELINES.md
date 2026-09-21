# EVERYA UX Guidelines

**Phase:** 3 — Experience Transformation  
**Companion:** `EVERYA_DESIGN_SYSTEM.md`, `EVERYA_PHASE3_UX_AUDIT.md`

---

## 1. Information hierarchy

Every screen should answer:

1. What am I looking at?
2. Why does it matter?
3. What can I do here?
4. What should I do next?

**Hierarchy order (content pages):**

```
Author / Publication
  → Title
  → Metadata
  → Content
  → Engagement
  → Discussion
  → Related
```

Use `PageHeader` for app pages; `typo-article-title` for reader headlines.

---

## 2. Navigation principles

- One coherent shell (Step 4) — user always knows where they are.
- **Explore** = social discovery; **Dashboard** = creator desk (until IA unification).
- Breadcrumbs on hierarchical content (collections, folders, documents).
- Mobile: primary actions reachable without horizontal scroll.
- Do not add dead routes or fake Trace navigation.

---

## 3. Content-first design

- Content is the hero — minimize chrome in reader mode.
- Whitespace and typography carry hierarchy, not decorative cards.
- Avoid dashboard-widget aesthetics on editorial feeds.
- Images and cover art should inform cards when available (Step 5).

---

## 4. Publication-first identity

Publications are first-class social objects (Phase 2).

- Show **publication** alongside **author** on feed cards (Step 5).
- Publication pages emphasize identity: name, handle, description, follow.
- Do not rename `Repository` → Trace in UI until Phase 4.

---

## 5. Reader principles

- Optimal line length (~42rem) via `.read-container` / reader prefs.
- Preserve `.article-body` serif rhythm.
- Engagement below content — not competing with text.
- Technical content: code blocks, tables, callouts styled consistently.
- Prepare for highlights/annotations visually — do not implement Phase 5 backend.

---

## 6. Creator principles

Creator flow (target):

```
Create → Choose type → Write → Preview → Configure → Publish
```

- Always show save/draft/published state.
- Autosave feedback must be visible (Step 8).
- Do not show controls for unimplemented backend features.

**Creation types today:**

| User action | Route | Product term |
|-------------|-------|--------------|
| Write publication article | `/p/[handle]/write` | Article |
| New publication | `/publications/new` | Publication |
| New collection doc | `/r/.../new` | Document |
| New collection | `/dashboard/new` | Collection |

---

## 7. Feed principles

- Support visual weight: featured > standard > compact (Step 5).
- Cards communicate: author, **publication**, title, excerpt, type, topic, read time, engagement.
- Not every row needs identical layout.
- Avoid empty gradient thumbnails — use metadata or publication identity.

---

## 8. Empty states

Use `EmptyState` with:

1. **What** is empty
2. **Why** it might be empty
3. **What to do next** (optional action)

Never: `"No data."` alone.

---

## 9. Loading states

| Context | Pattern |
|---------|---------|
| Full page | `LoadingState` skeleton variant |
| Section | `Skeleton` matching final layout |
| Button action | `Button loading` |
| Inline | `LoadingState variant="inline"` |

Avoid layout jump and blank screens.

---

## 10. Error states

Use `ErrorState`:

- Safe user-facing message (no raw API errors)
- Whether data was saved (when relevant)
- Retry when possible

---

## 11. Mobile principles

- Touch targets ≥ 44px on primary nav and actions.
- Reader floating controls must not obscure text (Step 10 pass).
- Feed hover margin tricks disabled under reduced motion; review touch behavior in Step 10.
- Test critical flows at 375px width.

---

## 12. Accessibility principles

- Label every form field (`FormField` + `Label`).
- Keyboard focus visible on all interactives.
- `aria-label` on icon-only buttons and search.
- Respect `prefers-reduced-motion`.
- Semantic landmarks (`nav`, `main`, `header`).

---

## 13. Motion principles

- Motion communicates **state** (loading, bookmark, follow) — not decoration.
- Durations: fast 120ms, normal 200ms, slow 320ms.
- No animation without reduced-motion fallback.

---

## 14. Terminology rules

**Product language** (UI copy) — database models unchanged:

| Concept | User-facing term | Model / route |
|---------|------------------|---------------|
| Published long-form in a publication | **Article** | `Document` via `/p/` |
| Page in a collection | **Document** | `Document` via `/r/` |
| Social org / magazine | **Publication** | `Publication` `/p/[handle]` |
| Knowledge tree / repo | **Collection** | `Repository` `/r/` |
| Person who writes | **Author** / **Creator** | `User` |
| Saved content area | **Library** | `/reading-list` |
| Discovery label | **Topic** | `Tag` |
| Positive reaction | **Clap** | `DocumentLike` |
| Top-level comment | **Response** | `Comment` |
| Nested comment | **Reply** | `Comment` |

**Per-screen consistency:**

- Explore/feed: prefer **Article**
- Collection browser: prefer **Document**
- Never mix Article and Story on the same screen
- Avoid "repository" in user-facing copy — use **Collection**
- Do not use competitor names (Medium, etc.)

Constants: `lib/design-system.ts` → `productTerms`

---

## 15. Future Trace-ready UX principles

Phase 4 will introduce Trace (folders, documents, concepts, relationships).

**Phase 3 preparation only:**

- Reuse `Breadcrumbs`, `RepoTree`, `ContentTypeBadge`, extensible feed cards.
- Hierarchical navigation primitives ready.
- **No** Trace routes, APIs, labels, or database migration.
- **No** pretending Trace exists in product copy.

---

## Validation checklist (ongoing)

When shipping UX changes, verify:

- [ ] Terminology matches this document
- [ ] States use design system components
- [ ] Typography uses `typo-*` scale
- [ ] Mobile layout acceptable
- [ ] Focus and labels present
- [ ] No fake Phase 4/5 features
- [ ] Server authorization unchanged
