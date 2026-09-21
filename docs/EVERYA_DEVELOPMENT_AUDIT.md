# EVERYA Development Audit

**Audit date:** September 21, 2026  
**Auditor role:** Principal architect / full-stack review (read-only)  
**Repository root:** `Codex-test/everya/everya`  
**Git branch:** `cursor-branch` (last commit: `50f243c cursor development medium phase 1`)  
**Remote:** `https://github.com/aresiddharthareddy/everya.git`  
**Scope:** Phase 0 audit — no application code modified during this review.

---

## Executive Summary

EVERYA is a **monolithic Next.js 16 application** with **no separate backend service**. All API routes, auth, business logic, and UI live in one TypeScript codebase backed by **SQLite** (local dev) via Prisma. The product today is best described as an **early-stage technical publishing + structured documentation prototype** — not yet a publication-first social platform as defined in the master instruction.

**Maturity estimate:** ~15% of Phase 2 (Core Social Platform) from the master development plan. Strong foundations exist for markdown authoring, repositories, engagement, and basic discovery. **Publication entity, RBAC, drafts, tests, and production hardening are largely absent.**

---

## A. Current Architecture

| Layer | Implementation |
|-------|----------------|
| **Pattern** | Monolithic full-stack Next.js App Router |
| **Frontend** | React 19 Server + Client Components |
| **Backend** | Next.js Route Handlers (`app/api/**`) |
| **Database** | SQLite file `./db/everya.db` via Prisma 6 |
| **Auth** | Better Auth (email/password), sessions in DB |
| **File storage** | Local filesystem `./storage/uploads` |
| **Search** | Prisma `contains` queries (no FTS) |
| **Jobs / cache** | None |
| **Separate API server** | None |

```
Browser
   ↓
Next.js (pages + API routes + SSR)
   ↓
Services layer (services/*.ts)
   ↓
Prisma → SQLite
   ↓
Local file storage
```

**Architectural gap vs vision:** Master instruction requires **Publication** as first-class social object with roles (OWNER, ADMIN, EDITOR, WRITER, etc.). Current model uses **Repository** owned by a single **User** with no member/role tables.

---

## B. Current Technology Stack

| Category | Technology | Version (package.json) |
|----------|------------|------------------------|
| Framework | Next.js (App Router, Turbopack dev) | 16.2.6 |
| Language | TypeScript | ^5 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Components | Custom shadcn-style (`components/ui/*`) | — |
| Animation | Framer Motion | ^12.40.0 |
| Client state | Zustand | ^5.0.13 |
| Auth | Better Auth | ^1.6.11 |
| ORM | Prisma | ^6.19.3 |
| Database | SQLite | via `DATABASE_URL` |
| Editor | `@uiw/react-md-editor` | ^4.1.1 |
| Markdown | react-markdown, remark-gfm, rehype-highlight, rehype-slug | — |
| Images | Sharp (WebP optimization) | ^0.34.5 |
| Validation | Zod | ^4.4.3 (limited usage) |
| Themes | next-themes | ^0.4.6 |
| Lint | ESLint + eslint-config-next | ^9 |
| Tests | **None found** | — |

---

## C. Current Folder Structure

```
Codex-test/
├── MEDIUM_VS_EVERYA_COMPARISON.md     # External comparison doc
├── EVERYA_DEVELOPMENT_AUDIT.md        # This file
├── EVERYA_ARCHITECTURE.md
├── EVERYA_ROADMAP.md
└── everya/
    └── everya/                        # ← Application root
        ├── app/                       # Routes + API
        │   ├── (app)/                 # Authenticated shell routes
        │   ├── api/                   # 18 API route files
        │   ├── login/, signup/
        │   ├── u/[username]/          # Public profile (outside app shell)
        │   └── page.tsx               # Landing
        ├── components/                # 37 component files
        │   ├── ui/, layout/, docs/, comments/, feed/, reader/, social/, search/, repos/, landing/, providers/
        ├── hooks/                     # use-ui-store, use-reader-prefs
        ├── lib/                       # auth, prisma, access, notify, utils, session, app-data, seed-tags
        ├── services/                  # documents, repositories, search, stats
        ├── types/                     # Shared TS interfaces
        ├── prisma/                    # schema.prisma, seed.ts
        ├── scripts/                     # ensure-db.js, build-apk.sh, setup-nginx-ssl.sh
        ├── storage/uploads/           # Gitignored uploads
        ├── db/                        # Gitignored SQLite
        ├── apk/                       # Offline Android WebView bundle
        ├── Cursor-Skills-universal/   # Imported skills repo (content)
        ├── public/
        ├── package.json
        ├── next.config.ts
        ├── .env / .env.example
        └── README.md
```

**Note:** Nested `everya/everya/` layout is confusing; README references `eveyra/everya` on GitHub. **UNKNOWN — REQUIRES VERIFICATION** whether parent `everya/` folder has additional code.

---

## D. Current Database Structure

**Provider:** SQLite (`file:./db/everya.db`)  
**Schema file:** `prisma/schema.prisma`  
**Migrations:** Uses `prisma db push` (no `prisma/migrations/` folder observed)

### Models (17)

| Model | Purpose |
|-------|---------|
| User | Identity, username, bio, image |
| Session, Account, Verification | Better Auth |
| Repository | Collection (name, slug, visibility, owner) |
| Folder | Nested hierarchy within repository |
| Document | Markdown content, metrics, author |
| UserFollow | User-to-user follow |
| Tag, DocumentTag | Tags (seeded; no author UI) |
| Comment | Threaded comments |
| Rating | 1–5 stars per user per document |
| DocumentLike | Binary like per user per document |
| CommentLike | Like on comments |
| Bookmark | Save document |
| Notification | In-app notifications |
| DocumentView | View tracking |

### Enums

- `RepositoryVisibility`: PUBLIC, PRIVATE, ENTERPRISE
- `NotificationType`: COMMENT, LIKE, RATING, REPLY, SYSTEM

### Missing vs master instruction entities

Publication, PublicationMember, PublicationRole, Article (distinct from Document), Post, Draft, Revision, Community, LearningPath, Highlight, ReadingHistory, ReadingList (as model), Newsletter, Subscription, AnalyticsEvent, ModerationAction, KnowledgeConcept, etc. — **all absent**.

### Index / constraint notes

- Unique: `[ownerId, slug]` on Repository, `[repositoryId, slug]` on Document, `[followerId, followingId]` on UserFollow
- **No explicit `@@index` on high-query fields** (e.g. `Document.readerCount`, `Document.updatedAt`, `DocumentView.createdAt`) — performance risk at scale

---

## E. Current API Structure

**Base:** `/api/*` Next.js Route Handlers  
**Auth:** `/api/auth/[...all]` (Better Auth catch-all)

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| * | `/api/auth/[...all]` | — | Better Auth |
| GET | `/api/search?q=` | No | Docs + public repos |
| GET | `/api/feed?tab=&tag=` | Optional | **Unused by UI** |
| GET | `/api/tags` | No | List tags |
| POST | `/api/repositories` | Yes | Create only |
| POST | `/api/documents` | Yes | Create |
| GET | `/api/documents/by-slug` | Yes | Fetch for edit |
| PATCH | `/api/documents/[id]` | Yes | Autosave (author only) |
| POST | `/api/documents/[id]/like` | Yes | Toggle |
| POST | `/api/documents/[id]/rate` | Yes | 1–5 stars |
| POST | `/api/documents/[id]/bookmark` | Yes | Toggle |
| POST | `/api/comments` | Yes | Create/reply |
| POST | `/api/comments/like` | Yes | Toggle |
| POST | `/api/upload` | Yes | Image → WebP |
| GET | `/api/files/[filename]` | No | Serve uploads |
| GET/PATCH | `/api/notifications` | Yes | List / mark read |
| GET/POST | `/api/users/[username]/follow` | GET public / POST auth | Follow toggle |
| PATCH | `/api/users/profile` | Yes | Name, bio |

**Missing APIs:** DELETE document/repo, PATCH repository, folder CRUD, tag assignment, publication members, drafts, pagination metadata, consistent error envelope, rate limiting.

**Response format:** Ad-hoc JSON per route — no unified `{ data, error, meta }` convention.

---

## F. Current Authentication Flow

1. User signs up at `/signup` with email, password, username (client → Better Auth)
2. Passwords hashed via Better Auth (scrypt; seed uses `hashPassword` from `better-auth/crypto`)
3. Session stored in `Session` table; cookie-based
4. Session expiry: 7 days (`lib/auth.ts`)
5. Server routes call `auth.api.getSession({ headers })` or `getServerSession()` wrapper
6. Client uses `useSession()` from `lib/auth-client.ts`

**Gaps:** No OAuth, no email verification flow, no password reset, no MFA, no account deletion.

**Known issue:** `lib/auth.ts` line 17 — `trustedOrigins` includes a function; TypeScript reports type error (`TS2322`). App runs but typecheck fails.

---

## G. Current Authorization Flow

**Primary helper:** `lib/access.ts` → `canViewRepo(repo, userId)`

| Visibility | Rule |
|------------|------|
| PUBLIC | Anyone can view |
| PRIVATE | Owner only |
| ENTERPRISE | **Same as PRIVATE** (owner only) — enum exists without extra ACL |

**Document-level checks:**
- Edit/autosave: `authorId === session.user.id` in `autosaveDocument`
- Like/rate/bookmark/comment: requires session; no extra role checks
- Repository create: any authenticated user

**Gaps:**
- No publication roles (OWNER/ADMIN/EDITOR/WRITER)
- No server-side middleware — protection per-route only
- No Next.js `middleware.ts` for route guards
- ENTERPRISE visibility is cosmetic
- Follow API does not verify target user exists beyond lookup
- File upload auth OK; file serve is **public** (anyone with filename URL)

---

## H. Current Frontend Architecture

| Aspect | Implementation |
|--------|----------------|
| Rendering | Server Components (pages) + Client Components (interactive) |
| Layouts | Root `app/layout.tsx`; `(app)/layout.tsx` wraps AppShell |
| Profile | `app/u/[username]` — **outside** `(app)` shell |
| Article reader | Reader mode in `app-shell.tsx` (detects `/r/u/repo/doc`) — minimal top bar |
| State | Zustand: UI (sidebar, search modal), reader prefs (localStorage) |
| Data fetching | Server-side Prisma in pages; client fetch for actions |
| Design tokens | CSS variables in `app/globals.css` |

**Dead / unused components:**
- `components/layout/right-sidebar.tsx` — not wired to doc page
- `components/feed/story-card.tsx` — not imported by pages
- `components/reader/doc-reader-layout.tsx` — superseded by `article-reader.tsx`
- `GET /api/feed` — no consumer

**Terminology inconsistency:** UI uses "story", "collection", "clap", "repository", "document" interchangeably.

---

## I. Current Routing

| Route | Shell | Auth required |
|-------|-------|---------------|
| `/` | Landing | No |
| `/login`, `/signup` | Auth pages | No |
| `/explore` | App shell | No |
| `/dashboard`, `/dashboard/new` | App shell | Yes (redirect) |
| `/stats`, `/reading-list`, `/settings`, `/notifications` | App shell | Yes |
| `/r/[user]/[repo]` | App shell | View: visibility rules |
| `/r/[user]/[repo]/[doc]` | Reader mode | View: visibility rules |
| `/r/.../edit`, `/r/.../new` | App shell | Author / owner flows |
| `/u/[username]` | Standalone header | No |
| `/download` | Standalone | No |

**No routes for:** Publications (as entity), communities, learning paths, newsletters, admin, moderation.

---

## J. Current Reusable Components

| Area | Components |
|------|------------|
| UI primitives | button, input, textarea, card, badge, avatar |
| Layout | app-shell, left-sidebar, top-bar, reader-top-bar, theme-toggle, right-sidebar (unused) |
| Docs | markdown-renderer, markdown-editor, reading-progress, table-of-contents, doc-actions, doc-stats-bar, doc-stats-header, tag-pills |
| Reader | article-reader, reader-toolbar, reader-body, sticky-engagement-bar |
| Social | follow-button, share-button |
| Feed | feed-story-row, explore-tabs, story-card (unused) |
| Comments | comment-section |
| Search | search-modal |
| Repos | repo-tree, breadcrumbs |
| Landing | hero |
| Providers | app-providers, theme-provider |

**Design system:** Partial — no formal tokens doc, no Storybook, no component API standards.

---

## K. Current Pages (16)

All under `app/**/page.tsx` — listed in section I.

---

## L. Current Tests

| Type | Status |
|------|--------|
| Unit tests | **None** (`*.test.ts`, `*.spec.ts` — 0 files) |
| Integration tests | **None** |
| E2E tests | **None** |
| API tests | **None** |
| CI test pipeline | **UNKNOWN — REQUIRES VERIFICATION** (no `.github/workflows` observed in app root) |

**Quality gate:** Master instruction requires tests before feature completion — **currently unmet globally**.

---

## M. Current Build Process

| Command | Behavior |
|---------|----------|
| `npm run dev` | `ensure-db.js` → `prisma db push` + `generate` + seed if empty → `next dev -p 43123` |
| `npm run build` | Same DB setup → `next build` |
| `npm start` | Production server port 43123 |
| `npm run lint` | ESLint |
| `postinstall` | `prisma generate` |
| `npx tsc --noEmit` | **Fails** (auth.ts TS error) |

**Risk:** `ensure-db.js` runs `prisma generate` on every dev/build — can fail with `EPERM` on Windows when dev server locks Prisma engine DLL (observed in session).

---

## N. Current Deployment Process

| Item | Status |
|------|--------|
| Docker | **None** in app |
| `scripts/setup-nginx-ssl.sh` | Manual nginx + SSL helper |
| `scripts/build-apk.sh` | Offline Android WebView APK |
| Production env | Documented in README (PostgreSQL, S3 suggested) — **not implemented** |
| Health checks | **None** |
| Process manager | **UNKNOWN — REQUIRES VERIFICATION** |

---

## O. Existing Bugs

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| BUG-01 | Medium | TypeScript error in `trustedOrigins` callback | `lib/auth.ts:17` |
| BUG-02 | Medium | Stale Prisma singleton after schema change — `userFollow` undefined until client recreated | `lib/prisma.ts` (mitigated partially) |
| BUG-03 | Low | Nested `<a>` hydration error (fixed in feed-story-row) | Was `TagPills` inside `Link` |
| BUG-04 | Low | ESLint error: setState in effect | `app/(app)/settings/page.tsx` |
| BUG-05 | Low | Unused import `redirect` | `app/(app)/layout.tsx` |
| BUG-06 | Low | README API table outdated (missing follow, feed, tags, stats routes) | `README.md` |
| BUG-07 | Medium | `ENTERPRISE` visibility has no distinct behavior | `lib/access.ts` |
| BUG-08 | Low | Demo email in README (`alex@everya.dev`) vs seed may differ | Verify seed |
| BUG-09 | Medium | Prisma `generate` EPERM on Windows with running dev server | Dev workflow |
| BUG-10 | Low | `/api/feed` implemented but unused | Dead code |

---

## P. Existing Technical Debt

1. **No Publication model** — Repository ≠ Publication; blocks social vision
2. **No draft/publish lifecycle** — documents live immediately
3. **No test suite** — regression risk on every change
4. **SQLite + db push** — no versioned migrations
5. **Inconsistent terminology** — story/document/collection/repository
6. **Dead components and APIs** — right-sidebar, story-card, feed API, doc-reader-layout
7. **Coarse analytics** — view = +1 per hour; no read threshold, no unique readers
8. **Tags seed-only** — no author-facing tag UI
9. **Folders schema-only** — no folder management UI
10. **No rate limiting** on auth or write APIs
11. **No input validation layer** — most routes use ad-hoc checks, not Zod schemas
12. **No middleware** for auth/route protection
13. **Monolithic coupling** — hard to extract mobile API later without planning
14. **README positioning** — "technical documentation platform" vs master "social network for publications"
15. **Nested repo path** `everya/everya/` — onboarding friction

---

## Q. Security Risks

| Risk | Severity | Detail |
|------|----------|--------|
| Default `BETTER_AUTH_SECRET` in `.env.example` | High (if copied to prod) | Must rotate in production |
| No rate limiting | Medium | Brute force on login, spam comments |
| Public file serving | Medium | `/api/files/[filename]` — path traversal mitigated via `basename` but URLs guessable (UUID) |
| Non-image upload allowed | Medium | Non-image files written to disk without auth on read |
| No CSRF explicit config | Low | Better Auth handles; **UNKNOWN — REQUIRES VERIFICATION** |
| No Content-Security-Policy | Medium | `next.config.ts` has APK headers only |
| Authorization gaps | Medium | ENTERPRISE, no collaborator access |
| No audit logging | Medium | No security event trail |
| Secrets in `.env` | Low | Gitignored; verify not committed |
| Markdown XSS | Low-Medium | `react-markdown` default — verify raw HTML policy |
| Session fixation | Low | Better Auth defaults — verify |

---

## R. Performance Risks

| Risk | Detail |
|------|--------|
| N+1 potential | Explore page multiple parallel queries — currently batched with `Promise.all` (OK for now) |
| No pagination | Explore `take: 20`; lists unbounded on profile |
| SQLite write concurrency | Single-file DB limits parallel writes |
| No caching | Every page hit queries DB |
| No image CDN | Local file serve |
| Large markdown documents | Full content loaded in SSR |
| Prisma client regeneration on dev start | Slow startup; EPERM failures |
| Missing DB indexes | Sort/filter on `readerCount`, `updatedAt` at scale |

---

## S. Missing Functionality (vs Master Instruction)

### Critical gaps
- Publication entity with roles and permissions
- Drafts, publish workflow, revisions
- Follow publications (only follow users exists)
- Home feed sections (For You, Continue Reading, etc.) — partial explore only
- Multiple content types (Article, Post, Guide, etc.)
- Communities
- Learning paths
- Knowledge graph
- AI layer
- Monetization
- Mobile-native UX
- Comprehensive search
- Moderation / reporting
- Email notifications
- OAuth / password reset

### Partial implementations
- Social graph (user follow only)
- Stats (basic writer dashboard)
- Notifications (in-app, 4 types)
- Repositories (not publications)
- Tags (filter only)
- Bookmarks (private reading list)

---

## T. Recommended Architecture

See **`EVERYA_ARCHITECTURE.md`** for target design.

**Preserve from current codebase:**
- Next.js App Router monolith (Phase 1–3)
- Prisma ORM
- Better Auth (extend with OAuth later)
- Markdown authoring pipeline
- Services layer pattern (`services/*.ts`)
- Component folder structure
- Repository/folder/document tree (evolve into Publication + Repository hybrid)
- Engagement models (like, rating, comment, bookmark, follow)
- Reader UX tooling (toolbar, TOC, progress)

**Change:**
- Introduce `Publication` as first-class entity; migrate or alias `Repository`
- Add `PublicationMember` + role enum + permission service
- Add `Content` base model or `contentType` discriminator on Document
- Add `Draft` / `publishedAt` / `status` on content
- Versioned Prisma migrations; PostgreSQL path for production
- Unified API response + Zod validation middleware
- Test harness (Vitest + Playwright minimum)
- Terminology standardization document

---

## U. Migration Risks

| Migration | Risk | Mitigation |
|-----------|------|------------|
| Repository → Publication | High — URLs, mental model, data | Phased rename; `Publication` table + backfill from `Repository` |
| SQLite → PostgreSQL | Medium | Prisma datasource switch; test migrations |
| Add RBAC | High — breaks owner-only assumptions | Permission service; feature flags |
| Document → Article + types | Medium | Add `contentType` enum; default ARTICLE |
| URL structure change | High — `/r/user/repo/doc` bookmarks | Permanent redirects |
| Seed/demo data | Low | Update seed scripts per migration |
| Better Auth schema changes | Medium | Follow Better Auth migration guides |

---

## V. Development Roadmap

See **`EVERYA_ROADMAP.md`** for phased plan aligned with master instruction Phases 0–8.

---

## What Should Be Preserved

1. Working auth + session flow (Better Auth)
2. Markdown editor + renderer pipeline
3. Repository tree + folder schema
4. Engagement features (like, rate, comment, bookmark)
5. Explore + following feed foundation
6. Writer stats service
7. Reader experience components
8. Seed data for demos
9. Local-first dev workflow (`ensure-db.js`)
10. Existing UI primitives and theme system

---

## What Should Be Changed

1. Product model: Publication-first (new entities + RBAC)
2. Content lifecycle: draft → publish → revise
3. Terminology and navigation aligned to vision
4. Test coverage before Phase 2 features
5. Fix typecheck/lint errors
6. Remove or wire dead code
7. API consistency + validation
8. Production database and storage strategy
9. Security hardening (rate limits, CSP, audit log foundation)
10. README and docs to reflect actual vision

---

## Verification Checklist (Post-Audit)

| Item | Status |
|------|--------|
| Application starts (`npm run dev`) | Verified in prior sessions (port 43123) |
| Build passes | **UNKNOWN — REQUIRES VERIFICATION** |
| Typecheck passes | **FAIL** (auth.ts) |
| Lint passes | **FAIL** (settings page + warnings) |
| Tests pass | **N/A** (no tests) |
| Phase 1 may begin | **After audit approval only** |

---

*This audit describes the repository as inspected. Items marked UNKNOWN require explicit verification before production decisions.*
