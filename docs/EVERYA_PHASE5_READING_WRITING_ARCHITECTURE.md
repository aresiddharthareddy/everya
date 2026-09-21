# EVERYA Phase 5 — Reading & Writing Architecture Audit

**Date:** 2025-09-22  
**Milestone:** 5.1 (audit only)  
**Branch:** `cursor-branch`  
**Prerequisite:** Phase 4 complete (Trace alias over `Repository` — unchanged)

## Scope

Audit the **document reading experience** on web. Writing, versioning, collaboration, comments, deep links, and mobile are scoped for milestones 5.3–5.9; this doc records current state and gaps.

## Reading surface map

| Route | Page | Shell |
|-------|------|-------|
| `/u/[username]/trace/[slug]/[doc]` | Trace document | `ArticleReader` + `KnowledgeTree` drawer |
| `/p/[handle]/[slug]` | Publication article | `ArticleReader` (no tree) |
| `/r/...` | Legacy | Redirects to trace URLs |

### Component stack

```
ReadingProgress (sticky bar)
ArticleReader (focus mode, TOC drawer, tree drawer, ReaderToolbar)
  ReaderArticleHeader (DocumentContext, engagement, edit)
  ReaderBody → MarkdownRenderer
  DocumentRelationships (Phase 4 — RELATED/PREV/NEXT/PART_OF)
  ReaderAuthorCard
  CommentSection
StickyEngagementBar (mobile)
```

**Key files:** `components/reader/*`, `components/docs/markdown-renderer.tsx`, `components/docs/table-of-contents.tsx`, `components/docs/reading-progress.tsx`, `hooks/use-reader-prefs.ts`, `app/globals.css` (`.article-body`, `.callout-*`).

---

## Audit matrix

| Area | Status | Notes |
|------|--------|-------|
| **Typography** | ✅ Good | Source Serif body, semantic `.typo-article-*`, adjustable size via `useReaderPrefs` |
| **Headings** | ✅ | `rehype-slug` IDs; TOC parses H1–H3 |
| **Code blocks** | ✅ | `rehype-highlight` + `.hljs`; dark theme override in CSS |
| **Markdown / GFM** | ✅ | `remark-gfm` — tables, task lists, strikethrough |
| **Tables** | ✅ | Styled in `.article-body table` |
| **Callouts** | ✅ | `[!NOTE]` / `[!TIP]` / `[!WARNING]` via blockquote transform |
| **Links** | ✅ | Underline on hover; external links not auto-targeted |
| **Images** | ⚠️ Partial | Renders; no lazy-load wrapper, no caption/alt enforcement |
| **TOC** | ✅ | Right drawer; intersection-based active heading |
| **Progress** | ⚠️ Partial | Top bar exists; scroll calc can drift on nested `main` scroll |
| **Reading time** | ✅ | Shown in header from `readingMinutes` (server-computed) |
| **Trace context** | ✅ | `DocumentContext` → trace link; `KnowledgeTree` drawer |
| **Breadcrumbs** | ✅ | `KnowledgeNav` on trace docs |
| **Related docs** | ✅ | `DocumentRelationships` (seed links on Getting Started) |
| **Prev/next nav** | ❌ Missing | `DocumentLink` PREV/NEXT exist in DB but no footer nav UI |
| **Focus / reader mode** | ✅ | Toolbar: font size, width, focus toggle (persisted) |
| **Mobile reading** | ⚠️ Partial | Sticky engagement bar, 44px targets; TOC/tree are drawers; toolbar floats over content |
| **Dark mode** | ✅ | Theme tokens + `.dark .article-body` / hljs |
| **Accessibility** | ⚠️ Partial | Drawer `role="dialog"`, toolbar labels; cover `alt=""`; no skip-link in reader |

---

## Gaps → Phase 5 milestones

| Gap | Target milestone |
|-----|------------------|
| Prev/next document footer | **5.2** — use `DocumentLink` + tree order fallback |
| Progress bar accuracy | **5.2** — unify scroll container |
| "Collection" label in reader tree button | **5.2** — rename to Trace |
| Image lazy-load / alt guidance | **5.2** (light touch) |
| Editor draft → preview → publish flow | **5.3**, **5.5** |
| No `DocumentRevision` model | **5.4** — add safe revision table + restore API |
| Draft listing / unsaved guards | **5.5** |
| Contributor attribution on edits | **5.6** — extend Phase 4 `TraceMember` |
| Comment delete/moderation UX | **5.7** |
| Share URL verification | **5.8** |
| Offline APK reader parity | **5.9** |

---

## Data model (reading-relevant)

| Model | Role |
|-------|------|
| `Document` | `title`, `content`, `status`, `readingMinutes`, `publishedAt` |
| `DocumentLink` | PREVIOUS / NEXT / RELATED / PART_OF between docs in same trace |
| `DocumentView` / `ReadingProgress` | Engagement (not reader UI) |
| `Repository` | Trace backing store — **do not rename** |

**No revision history table today.** Phase 5.4 should add `DocumentRevision` (append-only snapshots) without altering live `Document` rows destructively.

---

## Constraints (unchanged from Phase 4)

- Trace = product layer over `Repository`
- Server-side auth for all writes
- No real-time collaboration (Phase 6+)
- Reuse `KnowledgeTree`, `DocumentContext`, `DocumentRelationships`

---

## 5.1 exit criteria

- [x] Reading stack mapped  
- [x] Feature audit complete  
- [x] Gaps assigned to milestones 5.2–5.9  
- [x] No code changes (audit only)

**Phase 5 complete.**

### 5.9 additions (implemented)

- Offline APK v5.0.0 — reading progress, prev/next nav, drafts tab, contributors, comment delete/report, share links, `~discussion` deep links
- `npm run build:apk` → `public/EVERYA-offline.apk`

### 5.8 additions (implemented)

- `lib/share-url.ts` + `lib/site-url.ts` — canonical paths for Person, Publication, Trace, Document
- `metadataBase` + `generateMetadata` on trace docs, traces, profiles; canonical OG tags on articles
- `ShareButton` — Web Share API + clipboard; accepts canonical `url` + `title`
- `HashScroll` — `#discussion` and other hash deep links scroll on load
- Home/dashboard links use trace/publication URLs (not legacy `/r/`)
- Trace editor login preserves `?next=` return URL

### 5.7 additions (implemented)

- `DELETE /api/comments/[id]` — author delete + document/trace/publication moderator remove
- Report comment flow wired to `/api/reports`
- `CommentSection` — delete/report actions, mobile-friendly composer, `#discussion` anchor, improved sign-in CTA
- Notification links use trace/publication URLs (not legacy `/r/`)

### 5.6 additions (implemented)

- `Document.lastEditedById` — tracks who last saved content
- `services/collaboration.ts` — document contributors from revisions + trace contributor roster
- `GET /api/documents/[id]/contributors`
- Reader: "Last edited by" line + `DocumentContributors` section
- Trace page: public `TraceContributorsStrip` (owner + TraceMembers)

### 5.5 additions (implemented)

- `services/drafts.ts` — list editable drafts, trace drafts, delete draft
- `GET /api/drafts`, `DELETE /api/documents/[id]` (draft-only)
- `/drafts` page + dashboard draft section + trace draft panel for editors
- Tree hides drafts from public viewers; editors see draft badge + edit links
- Publish confirmation + discard draft in trace and publication editors

### 5.4 additions (implemented)

- `DocumentRevision` model — append-only snapshots (`title`, `content`, `status`, `revisionNumber`)
- `services/document-revisions.ts` — record on save, list, restore (snapshots current doc before restore)
- `GET /api/documents/[id]/revisions`, `POST .../revisions/[revisionId]/restore`
- `DocumentRevisionPanel` in trace editor — view history, restore prior version
- Wired into `autosaveDocument` and `updateArticle` (deduped identical autosaves)

### 5.3 additions (implemented)

- `hooks/use-document-editor.ts` — autosave, dirty state, beforeunload guard
- Trace editor: Draft → Publish → Update flow; `POST /api/documents/[id]/publish`
- New trace docs created as `DRAFT`; drafts hidden from public readers
- `EditorChrome` — unsaved-leave confirm, Save draft button, dirty badge
- `MarkdownEditor` — dark mode sync, mobile-friendly height
