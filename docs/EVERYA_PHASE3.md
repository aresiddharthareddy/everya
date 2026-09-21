# EVERYA Phase 3 — Experience Transformation

**Status:** ✅ COMPLETE  
**Prerequisite:** Phase 2 complete through 2.10  
**Next phase:** Phase 4 — Trace + Knowledge Platform (not started)

## Roadmap position

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Architecture | ✅ Complete |
| 2 | Core Social Publishing Platform | ✅ Complete (2.0–2.10) |
| **3** | **Experience Transformation** | **✅ Complete** |
| 4 | Trace + Knowledge Platform | Future |
| 5–9 | Reading/collab, economy, intelligence, scale, launch | Future |

## Phase 3 objective

Transform EveryA from a functional application into a **coherent, distinctive, premium product experience** — frontend/UI/UX focused. Preserve all Phase 2 backend behavior.

## Progress

| Step | Task | Status |
|------|------|--------|
| 1 | Repository + UI audit | ✅ |
| 2 | `EVERYA_PHASE3_UX_AUDIT.md` | ✅ |
| 3 | Design system definition | ✅ |
| 4 | Global layout / navigation | ✅ |
| 5 | Home / feed / discovery | ✅ |
| 6 | Reader / technical content | ✅ |
| 7 | Profiles / publications | ✅ |
| 8 | Creator / editor / publishing | ✅ |
| 9 | Social / discussion / library / search / notifications | ✅ |
| 10 | Mobile + accessibility + motion | ✅ |
| 11 | Trace-ready UI foundations (no backend) | ✅ |
| 12 | Design showcase | ✅ |
| 13 | Testing + regression | ✅ |
| 14 | Final validation + report | ✅ |

## Constraints

- No Phase 4 Trace backend
- No fake features
- No destructive backend rewrites
- Server-side auth unchanged

See `EVERYA_PHASE3_UX_AUDIT.md` for audit findings and `EVERYA_PHASE3_VERIFICATION.md` for validation results.

## Step 3 deliverables

| Deliverable | Path |
|-------------|------|
| Design system doc | `docs/EVERYA_DESIGN_SYSTEM.md` |
| UX guidelines | `docs/EVERYA_UX_GUIDELINES.md` |
| CSS tokens & utilities | `everya/app/globals.css` |
| TS constants | `everya/lib/design-system.ts` |
| UI primitives | `everya/components/ui/*` |
| Navigation primitives | `everya/components/navigation/*` |
| Content primitives | `everya/components/content/*` |
| State components | `everya/components/everya/*` |
| Design showcase | `/design-system` |

## Step 4 deliverables

| Deliverable | Path / route |
|-------------|--------------|
| Navigation config | `everya/lib/navigation.ts` |
| Shared header actions | `everya/components/navigation/header-actions.tsx` |
| Unified app shell | `everya/components/layout/app-shell.tsx` |
| Publications browse | `/publications` |
| Create chooser | `/create` |
| Profile in shell | `/u/[username]` → `(app)` group |
| Publication pages in shell | `everya/app/p/layout.tsx` |

### IA decisions

- **Home** → `/explore` (social discovery)
- **Desk** → `/dashboard` (creator workspace)
- **Publications** → `/publications` (browse; create at `/publications/new`)
- **Library** → `/reading-list`
- **Create** → `/create` (unified entry for article / publication / collection)

## Step 5 deliverables

| Deliverable | Path |
|-------------|------|
| Content card system | `components/feed/content-card.tsx` |
| Feed document adapter | `components/feed/feed-document-card.tsx` |
| Explore sidebar | `components/feed/explore-sidebar.tsx` |
| Feed loading skeleton | `components/feed/feed-skeleton.tsx`, `explore/loading.tsx` |
| Publication-aware feed | `app/(app)/explore/page.tsx` |

## Step 6 deliverables

| Deliverable | Path |
|-------------|------|
| Document context | `components/content/document-context.tsx` |
| Reader header + author card | `components/reader/reader-article-header.tsx`, `reader-author-card.tsx` |
| Knowledge nav | `components/navigation/knowledge-nav.tsx` |
| Markdown callouts | `components/docs/markdown-renderer.tsx` |
| Reader polish | `components/reader/article-reader.tsx`, `reader-toolbar.tsx`, `sticky-engagement-bar.tsx` |

## Step 7 deliverables

| Deliverable | Path |
|-------------|------|
| Profile feed cards | `app/(app)/u/[username]/page.tsx` |
| Publication landing | `app/p/[handle]/page.tsx` |

## Step 8 deliverables

| Deliverable | Path |
|-------------|------|
| Editor chrome | `components/editor/editor-chrome.tsx` |
| Article / doc editors | `write-article-client.tsx`, `edit-client.tsx`, `new-doc-client.tsx` |

## Step 9 deliverables

| Deliverable | Path |
|-------------|------|
| Comments | `components/comments/comment-section.tsx` |
| Search | `components/search/search-modal.tsx` |
| Notifications | `components/notifications/notifications-list.tsx`, `app/(app)/notifications/page.tsx` |
| Library | `app/(app)/reading-list/page.tsx` |
| Social buttons | `components/social/*` |

## Steps 10–14

- **10:** Touch targets, ARIA, motion tokens across reader/editor/nav
- **11:** `KnowledgeNav` + `DocumentContext` (UI only)
- **12:** Expanded `/design-system` showcase (Reader, Editor, Social, Trace tabs)
- **13:** typecheck, lint, test, build — all pass
- **14:** `EVERYA_PHASE3_VERIFICATION.md`
