# EVERYA Development Roadmap

**Version:** 1.0 (post Phase 0 audit)  
**Aligned with:** Master Development Instruction Phases 0–8  
**Audit reference:** `EVERYA_DEVELOPMENT_AUDIT.md`  
**Architecture reference:** `EVERYA_ARCHITECTURE.md`

---

## Current Position

| Metric | Value |
|--------|-------|
| Phase completed | **Phase 2.0** (Hardening) — Phase 2 in progress |
| Approx. master-plan progress | ~20–25% of Phase 2 |
| Production readiness | **Not production-ready** |
| Test coverage | **28+ unit tests** (lib layer) |
| Next gate | **Phase 2.1 — Identity & Profiles** |

---

## Phase Overview

```
Phase 0  AUDIT          ✅ Complete (this document set)
Phase 1  FOUNDATION     ✅ Complete (2025-09-21)
Phase 2  CORE SOCIAL     🟡 In progress (2.0 ✅ 2025-09-21)
Phase 3  PUBLICATION SN  ⬜ Not started
Phase 4  DISCOVERY       🟡 ~20% (basic explore)
Phase 5  DIFFERENTIATORS 🟡 ~25% (repos exist; no living knowledge)
Phase 6  AI              ⬜ Not started
Phase 7  CREATOR ECONOMY ⬜ Not started
Phase 8  ADVANCED        ⬜ Not started
```

---

## Phase 0 — Audit ✅

**Deliverables:**
- [x] `EVERYA_DEVELOPMENT_AUDIT.md`
- [x] `EVERYA_ARCHITECTURE.md`
- [x] `EVERYA_ROADMAP.md`

**Exit criteria:** Stakeholder review of audit findings and Phase 1 plan approval.

---

## Phase 1 — Foundation ✅

**Goal:** Stabilize architecture, fix quality gates, establish conventions — **no major new product features**.

**Completed:** 2025-09-21 — quality gate passed (`typecheck`, `lint`, `test` ×23, `build`).

### 1.1 Quality gates (blocking)

| Task | Priority |
|------|----------|
| Fix `lib/auth.ts` TypeScript error (`trustedOrigins`) | P0 |
| Fix ESLint errors (`settings/page.tsx`, unused imports) | P0 |
| Add Vitest + first API unit tests (auth, permissions) | P0 |
| Verify `npm run build` passes | P0 |
| Document `npm run typecheck` script in package.json | P1 |

### 1.2 Architecture seams

| Task | Priority |
|------|----------|
| Create `lib/permissions/` scaffold | P0 |
| Create `lib/validators/` with Zod schemas for existing POST routes | P1 |
| Standardize API error responses (helper `apiResponse`) | P1 |
| Wire or remove dead code (`right-sidebar`, `story-card`, `/api/feed`, `doc-reader-layout`) | P1 |
| Fix Prisma singleton stale-client pattern (done partially) | P0 |

### 1.3 Terminology & docs

| Task | Priority |
|------|----------|
| Create `EVERYA_TERMINOLOGY.md` (Publication, Article, Repository, etc.) | P1 |
| Update README positioning to match product vision | P2 |
| Sync README API table with actual routes | P2 |

### 1.4 Database

| Task | Priority |
|------|----------|
| Introduce `prisma/migrations/` — baseline from current schema | P1 |
| Add indexes: `Document(readerCount)`, `Document(updatedAt)`, `DocumentView(createdAt)` | P1 |
| Document PostgreSQL migration path | P2 |

### 1.5 Security baseline

| Task | Priority |
|------|----------|
| Rate limit login + write APIs (in-memory dev) | P1 |
| Restrict non-image uploads or block public serve for non-images | P1 |
| Add `GET /api/health` | P2 |

### 1.6 Design system foundation

| Task | Priority |
|------|----------|
| Document tokens in `globals.css` | P2 |
| Empty/loading/error state components | P2 |
| Accessibility pass on forms + modals | P2 |

### Phase 1 acceptance criteria

- [x] `npm run dev` starts without errors
- [x] `npm run build` succeeds
- [x] `npx tsc --noEmit` passes
- [x] `npm run lint` passes (4 warnings only — seed, avatar img, unused var in reading-progress)
- [x] Minimum 10 unit/integration tests pass (23 tests across 6 files)
- [x] No critical console errors on smoke paths (login, explore, health verified)
- [x] Existing functionality preserved (no Phase 2 features added)
- [x] No secrets in repo

**Estimated duration:** 1–2 weeks (1 developer)

---

## Phase 2 — Core Social Platform

**Goal:** User can complete full loop: sign up → create publication → write → draft → publish → follow → read → react → comment → bookmark → notification.

### 2.1 Publication model (critical)

| Task | Exists? |
|------|---------|
| `Publication` table (handle, name, logo, cover, description) | ❌ |
| `PublicationMember` + roles (OWNER, ADMIN, EDITOR, WRITER, CONTRIBUTOR, REVIEWER) | ❌ |
| Link `Repository` → `Publication` (nullable migration) | ❌ |
| Publication create/edit UI | ❌ |
| Server-side RBAC for all publication actions | ❌ |

### 2.2 Content lifecycle

| Task | Exists? |
|------|---------|
| `status`: DRAFT, PUBLISHED, SCHEDULED, ARCHIVED | ❌ |
| Draft save (unlisted) | ❌ |
| Publish action | ❌ (immediate today) |
| `publishedAt` timestamp | ❌ |
| DELETE content API | ❌ |

### 2.3 Social (extend existing)

| Task | Exists? |
|------|---------|
| Follow user | ✅ |
| Follow publication | ❌ |
| Follow topic | ❌ |
| Like/clap | ✅ (binary) |
| Comment/respond | ✅ |
| Bookmark | ✅ |
| Notifications | ✅ (partial — no follow notify) |
| @mentions | ❌ |

### 2.4 Profiles

| Task | Exists? |
|------|---------|
| Public profile page | ✅ |
| Avatar upload | ❌ |
| Expertise / topics on profile | ❌ |
| Publications list on profile | 🟡 (collections) |

### 2.5 Feed (basic)

| Task | Exists? |
|------|---------|
| Following feed | ✅ |
| Latest / Trending | ✅ |
| For You (deterministic) | ❌ |
| Home page as feed hub | ❌ (dashboard ≠ home feed) |

### 2.6 Editor

| Task | Exists? |
|------|---------|
| Markdown editor + autosave | ✅ |
| Draft mode in editor | ❌ |
| Preview before publish | 🟡 (live preview) |
| Tag picker on publish | ❌ |
| Cover image | ❌ |

### Phase 2 acceptance criteria

User journey:

```
SIGN UP → CREATE PROFILE → CREATE PUBLICATION → WRITE → SAVE DRAFT
→ PUBLISH → FOLLOW PUBLICATION → READ → REACT → COMMENT → BOOKMARK
→ RECEIVE NOTIFICATION
```

All steps must work end-to-end with tests.

**Estimated duration:** 4–6 weeks

---

## Phase 3 — Publication Social Network

| Feature | Status |
|---------|--------|
| Publication homepage (magazine layout) | ❌ |
| Publication feed | ❌ |
| Publication followers | ❌ |
| Contributors / editors UI | ❌ |
| Series | ❌ |
| Public collections / lists | ❌ |
| Newsletter (foundation) | ❌ |
| Publication analytics | ❌ |
| Featured content on publication | ❌ |
| Publication discovery | ❌ |

**Estimated duration:** 4–6 weeks

---

## Phase 4 — Discovery

| Feature | Current | Target |
|---------|---------|--------|
| Explore | ✅ basic | Full explore hub |
| For You | ❌ | Deterministic ranking |
| Authors discovery | 🟡 sidebar | Dedicated section |
| Publications discovery | 🟡 | Dedicated section |
| Topics | 🟡 filter | Topic pages |
| Communities | ❌ | Phase 4+ |
| Search | 🟡 | Multi-entity + filters |
| FTS | ❌ | PostgreSQL FTS or similar |
| Recommendations | ❌ | Signal-based |
| Pagination | ❌ | All feeds |

**Estimated duration:** 3–5 weeks

---

## Phase 5 — EVERYA Differentiators

| Feature | Current | Target |
|---------|---------|--------|
| Repositories | ✅ | Linked to publications |
| Nested folders | 🟡 schema | Full UI |
| Living document states | ❌ | CURRENT, OUTDATED, etc. |
| Knowledge relationships | ❌ | ContentConcept table |
| Knowledge graph UI | ❌ | Related concepts panel |
| Learning paths | ❌ | Ordered content + progress |
| Content relationships | ❌ | Prerequisites, see-also |
| Contributor systems | ❌ | Repo contributors |
| Expertise identity | ❌ | Profile expertise |

**Estimated duration:** 6–8 weeks

---

## Phase 6 — AI

| Capability | Priority |
|------------|----------|
| AI provider abstraction | P0 |
| Summarize article | P1 |
| Explain / simplify | P1 |
| Suggest tags | P1 |
| Related content | P1 |
| Q&A on article | P2 |
| Learning path generation | P3 |
| AI disclosure flags | P0 |

**Estimated duration:** 4–6 weeks

---

## Phase 7 — Creator Economy

| Feature | Notes |
|---------|-------|
| Memberships | Architecture only until Phase 7 |
| Paid publications / articles | |
| Premium repositories | |
| Payout integration | Stripe etc. |

**Prerequisite:** Stable ownership + RBAC + content lifecycle.

**Estimated duration:** 6+ weeks

---

## Phase 8 — Advanced Platform

- Mobile native apps (API v1)
- Public API + SDK
- Integrations
- Enterprise workspaces
- Advanced recommendations
- Full knowledge graph

**Estimated duration:** Ongoing

---

## Phase 1 Detailed Plan (Immediate Next Steps)

When approved to begin Phase 1, execute in this order:

### Week 1

| Day | Task |
|-----|------|
| 1 | Fix auth.ts TS error; run full typecheck/lint/build |
| 1 | Add `npm run typecheck` to package.json |
| 2 | Set up Vitest; test `canViewRepo`, `getWriterStats`, follow API |
| 2 | Remove or wire dead components (decision doc in PR) |
| 3 | Create `lib/api-response.ts` + migrate 3 routes as pattern |
| 3 | Create `lib/validators/` — repositories, documents POST |
| 4 | Add rate limiting helper; apply to auth + comments |
| 4 | Add `GET /api/health` |
| 5 | Prisma baseline migration + indexes |
| 5 | Regression smoke test checklist document |

### Week 2

| Day | Task |
|-----|------|
| 1–2 | Zod validation on all write APIs |
| 2–3 | Empty/loading/error components; apply to explore, dashboard |
| 3–4 | `lib/permissions/` scaffold + tests |
| 4 | `EVERYA_TERMINOLOGY.md` |
| 5 | Phase 1 quality gate run; fix all failures |
| 5 | Stakeholder sign-off for Phase 2 |

---

## Regression Smoke Checklist (run after every phase)

| # | Path | Expected |
|---|------|----------|
| 1 | `/` | Landing loads |
| 2 | `/signup` → `/dashboard` | Account creation |
| 3 | `/login` | Demo user login |
| 4 | `/explore` | Feed renders, no hydration errors |
| 5 | `/r/alex/platform-docs/getting-started` | Article + stats + comments |
| 6 | Edit document | Autosave works |
| 7 | Like / bookmark / rate | Toggles persist |
| 8 | `/reading-list` | Saved items |
| 9 | `/stats` | Writer dashboard |
| 10 | `/notifications` | List loads |
| 11 | Follow on profile | Toggle works |
| 12 | ⌘K search | Returns results |
| 13 | Dark mode toggle | Persists |
| 14 | Private repo | Non-owner 404 |

---

## Documentation Maintenance

| Document | Update when |
|----------|-------------|
| `EVERYA_DEVELOPMENT_AUDIT.md` | Major architecture change |
| `EVERYA_ARCHITECTURE.md` | ADR added |
| `EVERYA_ROADMAP.md` | Phase completion |
| `EVERYA_API.md` | API changes |
| `EVERYA_DATABASE.md` | Schema changes |
| `EVERYA_SECURITY.md` | Security controls |
| `EVERYA_TERMINOLOGY.md` | Terminology / product language |
| `MEDIUM_VS_EVERYA_COMPARISON.md` | Product positioning reviews |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Repository → Publication migration breaks URLs | High | Aliases + redirects |
| No tests → regressions | High | Phase 1 test harness |
| Scope creep (Medium clone pressure) | High | Terminology doc + vision reviews |
| SQLite in production | Medium | Postgres path Phase 1 doc |
| Solo dev bandwidth | Medium | Strict phase gates |
| Windows/OneDrive Prisma EPERM | Low | Document stop-server-before-generate |

---

## Success Metrics (by Phase 4)

| Metric | Target |
|--------|--------|
| Test coverage (services + API) | > 60% |
| Typecheck / lint / build | 100% pass in CI |
| Core user journey completion rate | Measurable |
| P95 page load (article) | < 2s local |
| Zero critical security findings | Yes |
| Publication creation → publish | < 5 min user time |

---

*Phase 1 does not begin until this audit is reviewed and approved. No application code was modified during Phase 0.*
