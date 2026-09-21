# EVERYA Phase 4 — Trace Architecture Audit

**Date:** 2025-09-21  
**Milestone:** 4.1 (audit only — no schema changes)  
**Branch:** `cursor-branch`

## Executive summary

EveryA already has a **Repository → Folder → Document** hierarchy that maps cleanly to **Trace → nested folders → Documents**. Phase 4 should **evolve the product layer** (terminology, URLs, UI, APIs, mobile) around the existing `Repository` table — **not rename or replace it in the database**.

Publications remain a separate editorial layer (1:1 with a backing `Repository` for articles). Traces are the knowledge/collection layer.

---

## Current data model

### Repository (`Repository`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | cuid | Primary key |
| `name` | string | Display title |
| `slug` | string | Unique per owner (`@@unique([ownerId, slug])`) |
| `description` | string? | |
| `visibility` | `PUBLIC \| PRIVATE \| ENTERPRISE` | |
| `ownerId` | → User | Single owner; **no member table today** |
| `publication` | 1:1 optional | `Publication.repositoryId` unique |

**Relations:** `folders[]`, `documents[]`, optional `publication`.

### Folder (`Folder`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | cuid | |
| `name`, `slug` | string | `@@unique([repositoryId, parentId, slug])` |
| `repositoryId` | → Repository | |
| `parentId` | → Folder? | Self-referential tree |
| `sortOrder` | int | Ordering within parent |

**Relations:** `children[]`, `documents[]`.

### Document (`Document`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | cuid | |
| `title`, `subtitle`, `slug`, `content`, `excerpt`, `coverImage` | | Shared by articles + collection docs |
| `status` | `DRAFT \| PUBLISHED \| ARCHIVED` | |
| `repositoryId` | → Repository | **Required** — every doc lives in a repo |
| `publicationId` | → Publication? | When set → article (`/p/...`) |
| `folderId` | → Folder? | Nested placement |
| `authorId` | → User | |
| Engagement | `readerCount`, likes, comments, ratings, bookmarks, views, readingProgress | |

**Unique:** `@@unique([repositoryId, slug])` — slugs scoped to repository, not folder.

### Publication (related, not Trace)

- `Publication` 1:1 `Repository` — every publication owns a backing repo.
- Publication articles are `Document` rows with `publicationId` set; URLs use `/p/[handle]/[slug]`.
- Publication has `PublicationMember` (OWNER/ADMIN/EDITOR/WRITER/CONTRIBUTOR) and `PublicationFollow`.

### What does NOT exist yet

| Concept | Status |
|---------|--------|
| `Trace` table | ❌ |
| `RepositoryFollow` / Trace follow | ❌ |
| `RepositoryMember` / Trace contributors | ❌ |
| `DocumentRelationship` (prev/next/related) | ❌ |
| Folder CRUD API | ❌ (folders created via seed/import scripts only) |
| Repository GET/detail API | ❌ (only `POST /api/repositories`) |

---

## Current URLs

| Route | Purpose |
|-------|---------|
| `/r/[username]/[repo]` | Repository landing (tree + doc list) |
| `/r/[username]/[repo]/[doc]` | Collection document reader |
| `/r/[username]/[repo]/[doc]/edit` | Document editor |
| `/r/[username]/[repo]/new` | New document |
| `/p/[handle]` | Publication landing |
| `/p/[handle]/[slug]` | Publication article reader |
| `/p/[handle]/write` | Article writer |

**Path resolution:** `getRepositoryByPath(ownerUsername, repoSlug)` in `services/repositories.ts`.

**Document href logic:** `articleHref()` in `services/feed.ts` — publication docs → `/p/...`, else → `/r/...`.

---

## Current APIs

| Endpoint | Methods | Scope |
|----------|---------|-------|
| `/api/repositories` | POST | Create repo (owner only) |
| `/api/documents` | POST | Create doc in repo (`repoSlug`) |
| `/api/documents/[id]` | PATCH | Update doc |
| `/api/documents/by-slug` | GET | Resolve by username/repo/doc |
| `/api/documents/[id]/like, bookmark, rate` | POST | Engagement |
| `/api/feed` | GET | Document discovery (not repo list) |
| `/api/search` | GET | Documents, publications, authors — **repos as `repository` type in UI only** |

**No dedicated folder or repository read/update/delete APIs.**

---

## Authorization (today)

| Resource | Rule | Location |
|----------|------|----------|
| Repository view | `PUBLIC` or owner | `lib/access.ts` → `canViewRepo` |
| Repository write | Owner only (implicit) | Document create checks `ownerId` |
| Publication | Role-based | `lib/permissions/publication.ts` |
| Document | Author + publication/repo visibility | `lib/document-access.ts` |

**Gap:** No multi-user Trace contributors; owner-only for repositories.

---

## Web UI (Phase 3 foundations to reuse)

| Component | Path | Trace role |
|-----------|------|------------|
| `RepoTree` | `components/repos/repo-tree.tsx` | Document tree (client, expand/collapse, active slug) |
| `Breadcrumbs` | `components/repos/breadcrumbs.tsx` | Hierarchy display |
| `KnowledgeNav` | `components/navigation/knowledge-nav.tsx` | Trace-ready breadcrumb wrapper |
| `DocumentContext` | `components/content/document-context.tsx` | Shows collection link (`/r/...`) — rename to Trace |
| `ContentCard` / `FeedDocumentCard` | `components/feed/*` | Feed discovery unit = document |
| `PageHeader`, design tokens | Phase 3 system | Trace landing |

**Tree building:** `getRepositoryTree(repositoryId)` — loads all folders + docs, builds in-memory tree. Works for moderate sizes; no pagination.

**Reader:** `ArticleReader` embeds `RepoTree` in drawer on collection doc pages.

**Terminology (UI):** Phase 3 uses **Collection** for Repository (`productTerms.collection`, `ContentTypeBadge`). Phase 4 UI → **Trace**; DB stays `Repository`.

---

## Feed & discovery (today)

- Feed returns **individual documents** (correct for Phase 4.6).
- `FeedDocumentCard` shows publication OR collection context.
- Search returns documents with repo subtitle; repositories searchable as type `repository` in modal but **not in `searchAll` server** for standalone repo search.
- No Trace-level explore tab; repos listed on dashboard sidebar + profile.

---

## Import (existing)

`scripts/import-cursor-skills-repo.ts` — walks filesystem, creates folders + documents. **Prototype for 4.8** (Markdown/Obsidian import). No API endpoint yet.

---

## Mobile / APK (Phase 4.14)

| Item | Detail |
|------|--------|
| Framework | Android native shell (`apk/android/`) |
| UI | WebView → `file:///android_asset/www/index.html` |
| Data | Bundled dummy seed catalog in `apk/www/` (`data.js`, `app.js`) |
| Backend | **None** — fully offline until production deploy |
| Features | Feed, explore, traces, publications, library, notifications, local drafts |
| Build | `npm run build:apk` → `public/EVERYA-offline.apk` |

Production switch (later): point WebView at hosted URL or ship TWA.

---

## Proposed Trace evolution

### Recommended approach: **Product alias over Repository (no table rename)**

```
Repository (DB)  ←→  Trace (product/API/UI)
Folder (DB)      ←→  Trace folder / section
Document (DB)    unchanged
```

**Why not rename `Repository` → `Trace` in Prisma:**

- `repositoryId` on 10+ relations (Document, Folder, Publication)
- Existing data, seeds, migrations, tests reference `Repository`
- Publication 1:1 link uses `repositoryId`
- Risk of breaking Phase 1–3 with no user benefit

**Instead:**

1. Add `services/traces.ts` — thin wrapper over `services/repositories.ts`
2. Add `lib/terminology.ts` or extend `design-system.ts` — `trace` UI term
3. New URLs under `/[username]/trace/[slug]` with redirects from `/r/...`
4. New Prisma models only for **new capabilities** (see below)

### New schema (Phase 4.2+ — not in 4.1)

| Model | Purpose |
|-------|---------|
| `TraceFollow` | `repositoryId` + `userId` (mirror `PublicationFollow`) |
| `TraceMember` | `repositoryId` + `userId` + `role` (mirror `PublicationMember` roles subset) |
| `DocumentLink` | `fromDocumentId`, `toDocumentId`, `type` (RELATED, PREVIOUS, NEXT, PART_OF) |

Optional later: `Repository` add `coverImage`, `featuredDocumentId` — no rename.

**Exclude publication-backed repos from Trace discovery** where `publication != null` (they are Publications, not standalone Traces).

---

## URL strategy (4.3 target)

| New | Legacy (redirect) |
|-----|-------------------|
| `/u/[username]/trace/[slug]` | `/r/[username]/[slug]` → 301/rewrite |
| `/u/[username]/trace/[slug]/[doc]` | `/r/[username]/[slug]/[doc]` |
| `/u/[username]/trace/[slug]/[doc]/edit` | `/r/.../edit` |

Use `/u/[username]/trace/...` (not `/[username]/trace/...` at root) to stay inside existing `(app)` shell and match profile namespace.

Nested folders: **not in URL** today (flat doc slug per repo). Keep flat doc URLs; folder context via tree + breadcrumbs. Folder-in-URL is a Phase 5+ consideration.

---

## Migration strategy

1. **4.1** — This document ✅  
2. **4.2** — Add `TraceFollow`, `TraceMember`, `DocumentLink` migrations; no rename  
3. **4.3** — Next.js parallel routes or rewrites: `/u/[username]/trace/[slug]` → reuse `r/[username]/[repo]` page components  
4. **4.4–4.5** — Trace landing + enhanced `KnowledgeTree` (extend `RepoTree`)  
5. **4.6–4.7** — Feed card Trace context + “Go to Trace” menu  
6. **4.8** — `POST /api/traces/import` reusing import script logic  
7. **4.9–4.10** — Search/explore Trace discovery + follow APIs  
8. **4.11–4.13** — Document links, contributors auth, export stub  

**Data preservation:** All existing `Repository`, `Folder`, `Document` rows unchanged. Redirects preserve `/r/` links.

---

## Backward compatibility

| Requirement | Approach |
|-------------|----------|
| `/r/` URLs | Permanent redirects to `/u/.../trace/...` |
| `repositoryId` in APIs | Keep; add `traceId` alias in JSON responses (= `repositoryId`) |
| Publication repos | Filter from Trace browse; still accessible via Publication |
| `articleHref()` | Add `traceHref(repo)` helper; publication path unchanged |
| Search `repository` type | Rename UI label to Trace; href → new URL |
| Mobile offline bundle | Update separately; web-first for live API |

---

## Dependencies map

```
Prisma Repository
  ├── services/repositories.ts (tree, byPath)
  ├── app/(app)/r/[username]/[repo]/* (pages)
  ├── components/repos/repo-tree.tsx
  ├── services/feed.ts (articleHref, feedInclude.repository)
  ├── services/search.ts
  ├── components/content/document-context.tsx
  ├── components/feed/content-card.tsx (collection field)
  ├── lib/navigation.ts (isCollectionActive)
  ├── app/api/repositories/route.ts
  ├── app/api/documents/route.ts
  ├── prisma/seed.ts, scripts/import-cursor-skills-repo.ts
  └── apk/www/* (offline, decoupled)
```

---

## Performance notes

- `getRepositoryTree` loads **all** folders + documents per request — acceptable for <500 nodes; add lazy-load API if needed later.
- RepoTree renders full tree client-side — virtualize only if profiling shows need.
- Avoid N+1 on Trace landing: single tree query + featured docs query.

---

## Phase 4.1 exit criteria

- [x] Current models documented  
- [x] URLs, APIs, dependencies mapped  
- [x] Evolution strategy chosen (alias, not rename)  
- [x] Migration + compatibility plan defined  
- [x] Mobile baseline identified  
- [ ] No database changes (confirmed)

**Next:** 4.2 Trace domain model — add `TraceFollow`, `TraceMember`, `DocumentLink` + service layer.
