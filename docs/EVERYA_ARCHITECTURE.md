# EVERYA Architecture

**Version:** 0.1 (target architecture — post-audit)  
**Status:** Design document — describes target state and evolution from current codebase  
**Current implementation:** See `EVERYA_DEVELOPMENT_AUDIT.md`

---

## 1. Architectural Principles

1. **Publication-first** — Publications are the primary social object, not individual posts in isolation.
2. **Incremental evolution** — Extend the existing Next.js monolith; no rewrite unless justified.
3. **Server-side authority** — All permissions enforced in API/service layer, never UI-only.
4. **Single source of truth** — Business rules live in `services/` and `lib/permissions/`, not duplicated in components.
5. **Grow without rewrite** — Schema and module boundaries must support Web → Mobile API → SDK → Enterprise.
6. **Optional complexity** — AI, monetization, graph DB deferred until Phase 5+.
7. **EveryA identity** — Original UX, terminology, and design system; no platform cloning.

---

## 2. System Context

```
                    ┌─────────────────────────────────────────┐
                    │           EVERYA Platform              │
                    └─────────────────────────────────────────┘
         ┌──────────────┬──────────────┬──────────────┬──────────────┐
         │   Web App    │  Mobile Web  │  Mobile App  │  Public API  │
         │  (Next.js)   │  (responsive)│  (future)    │  (future)    │
         └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘
                │              │              │              │
                └──────────────┴──────────────┴──────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   Application     │
                          │   Layer (Next.js) │
                          │  Pages + API      │
                          └─────────┬─────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
      ┌───────▼───────┐    ┌────────▼────────┐   ┌───────▼───────┐
      │   Services    │    │  Authorization  │   │  Integrations │
      │   Layer       │    │  + Validation   │   │  (AI, email)  │
      └───────┬───────┘    └────────┬────────┘   └───────┬───────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
      ┌───────▼───────┐    ┌────────▼────────┐   ┌───────▼───────┐
      │  PostgreSQL   │    │  Object Storage │   │  Search Index │
      │  (Prisma)     │    │  (S3-compatible)│   │  (FTS → vec)  │
      └───────────────┘    └─────────────────┘   └───────────────┘
```

**Phase 1–3:** SQLite + local files (current) with architecture seams ready for swap.

---

## 3. Layered Architecture (Current → Target)

### 3.1 Presentation Layer

| Concern | Current | Target |
|---------|---------|--------|
| Framework | Next.js App Router | Same |
| Server state | RSC + Prisma in pages | RSC + service calls only |
| Client state | Zustand (UI, reader prefs) | + React Query for client cache (Phase 2) |
| Layouts | App shell + reader mode | Context-sensitive nav (publication workspace, reader, creator) |
| Design system | Partial Tailwind + CSS vars | Formal `EVERYA_DESIGN_SYSTEM` tokens |

**Route groups (target):**

```
app/
├── (marketing)/          # Landing, about
├── (auth)/               # login, signup, reset
├── (reader)/             # Article reading — minimal chrome
├── (platform)/           # Home, explore, library, notifications
├── (creator)/            # Dashboard, editor, stats
├── (publication)/        # Publication pages, settings, members
├── (profile)/            # User/author profiles
└── api/                  # REST + auth
```

### 3.2 API Layer

**Conventions (target):**

```typescript
// Success
{ "data": T, "meta": { "page"?, "total"? } }

// Error
{ "error": { "code": string, "message": string, "details"?: unknown } }
```

| Rule | Implementation |
|------|----------------|
| Auth | `requireSession()` helper → 401 |
| Permission | `authorize(action, resource, user)` → 403 |
| Validation | Zod schemas per route in `lib/validators/` |
| Pagination | `?page=&limit=` default limit 20, max 100 |
| Idempotency | For toggles (like, bookmark) — current pattern OK |

**API versioning:** `/api/v1/` when public API launches (Phase 8). Internal routes stay unversioned until then.

### 3.3 Service Layer

```
services/
├── publications.ts      # NEW — publication CRUD, members, roles
├── content.ts           # NEW — unified content (article, post, doc)
├── permissions.ts       # NEW — RBAC checks
├── documents.ts         # EXISTS — merge into content.ts over time
├── repositories.ts      # EXISTS — evolve to publication repos
├── social.ts            # NEW — follow, reactions (extract from routes)
├── feed.ts              # NEW — deterministic ranking
├── search.ts            # EXISTS — extend
├── stats.ts             # EXISTS — extend
├── notifications.ts     # NEW — extract from routes + notify.ts
├── media.ts             # NEW — upload abstraction
└── analytics.ts         # NEW — event recording (Phase 4+)
```

**Rule:** Route handlers are thin — parse request → authorize → call service → format response.

### 3.4 Data Layer

**ORM:** Prisma  
**Dev:** SQLite  
**Production target:** PostgreSQL 15+

**Migration strategy:** Introduce `prisma/migrations/`; stop relying on `db push` for production.

---

## 4. Core Domain Model (Target)

### 4.1 Entity Relationship (conceptual)

```
Person (User)
  ├── Profile (embedded or 1:1)
  ├── Author identity
  └── Membership in Publications

Publication
  ├── handle, name, logo, cover, description
  ├── PublicationMember (user + role)
  ├── Content[] (articles, posts, guides...)
  ├── Repository[] (knowledge repos linked to publication)
  ├── Followers (PublicationFollow)
  └── Settings, analytics

Content (base)
  ├── type: ARTICLE | POST | GUIDE | DOCUMENT | ...
  ├── status: DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
  ├── publicationId
  ├── authorId
  ├── Revision[]
  └── Engagement (likes, comments, ratings, bookmarks)

Repository (knowledge — EVERYA differentiator)
  ├── publicationId (optional link)
  ├── Folder tree
  ├── Documents (living knowledge states)
  └── Contributors

Community (Phase 3+)
  ├── members, discussions, topics

Social graph
  ├── UserFollow, PublicationFollow, TopicFollow
  └── feeds derived from graph + signals
```

### 4.2 Publication Roles & Permissions

| Role | Publish | Edit others | Manage members | Settings | Delete pub |
|------|---------|-------------|----------------|----------|------------|
| OWNER | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ❌ |
| EDITOR | ✅ | ✅ | ❌ | ❌ | ❌ |
| WRITER | ✅ own | ❌ | ❌ | ❌ | ❌ |
| CONTRIBUTOR | draft only | ❌ | ❌ | ❌ | ❌ |
| REVIEWER | comment/review | ❌ | ❌ | ❌ | ❌ |

**Implementation:** `lib/permissions/publication.ts` with `can(userId, action, publicationId)`.

### 4.3 Mapping from Current Schema

| Current | Target evolution |
|---------|------------------|
| `Repository` | → `Publication` (rename + extend) OR `Publication` owns `Repository` |
| `Document` | → `Content` with `type=DOCUMENT\|ARTICLE` |
| `UserFollow` | Keep; add `PublicationFollow` |
| `Folder` | Keep under Repository |
| `Tag` | Keep; add author assignment + `Topic` entity later |
| `DocumentLike` | → `Reaction` or keep as clap-like |
| `Bookmark` | Keep; add `ReadingList` collections later |

**Recommended Phase 1 approach:** Add `Publication` table; link existing `Repository.publicationId` nullable; migrate UI terminology before breaking URLs.

---

## 5. Authentication

| Concern | Current | Target |
|---------|---------|--------|
| Provider | Better Auth | Same |
| Methods | Email/password | + OAuth (Google, GitHub) Phase 2 |
| Sessions | DB sessions, 7-day | Configurable; refresh rotation |
| Verification | Field only | Email verify flow Phase 2 |
| Reset password | Missing | Phase 2 |
| MFA | Missing | Phase 7+ / enterprise |

**Files:** `lib/auth.ts`, `lib/session.ts`, `app/api/auth/[...all]/route.ts`

**Fix required:** Resolve `trustedOrigins` TypeScript error before Phase 1 gate.

---

## 6. Authorization

```
Request → Session? → Resource load → Permission check → Action
```

| Layer | Responsibility |
|-------|----------------|
| Route handler | Call `authorize()` |
| `lib/permissions/*` | Role + ownership rules |
| Service layer | Double-check on mutations |
| Prisma | Row-level via query filters where possible |

**No Next.js middleware initially** — explicit checks per route until patterns stabilize, then optional middleware for `/dashboard`, `/stats`, etc.

---

## 7. Content System

### 7.1 Content types (phased)

| Phase | Types |
|-------|-------|
| 2 | ARTICLE (markdown), POST (short — optional) |
| 3 | SERIES, GUIDE |
| 5 | DOCUMENTATION, TUTORIAL, LEARNING_NOTE |
| 5+ | QUESTION, ANSWER |

### 7.2 Editor architecture

```
EditorPage (client)
  → MarkdownEditor / BlockEditor (future)
  → Autosave hook (debounced)
  → PATCH /api/content/[id]
  → contentService.autosave()
  → Revision snapshot (Phase 2)
```

**Non-negotiable:** Autosave failure → user-visible error + retry; never silent loss.

### 7.3 Living knowledge states (Phase 5)

Enum on Document/Content: `CURRENT | NEEDS_REVIEW | OUTDATED | DEPRECATED | VERIFIED | COMMUNITY_REVIEWED`

---

## 8. Feed & Discovery

### 8.1 Feed architecture (deterministic first)

```
FeedService.getFeed(userId, tab, options)
  → load signals (follows, history, bookmarks)
  → query candidates (SQL)
  → score (weighted formula)
  → paginate
  → return ranked items
```

**Tabs (target):** FOR_YOU, FOLLOWING, LATEST, TRENDING, PUBLICATIONS, TOPICS, CONTINUE_READING, SAVED

**Scoring signals (initial weights — configurable):**

| Signal | Weight |
|--------|--------|
| Followed publication | High |
| Followed author | High |
| Followed topic | Medium |
| Recency | Medium |
| Popularity (views, claps) | Medium |
| Quality (rating) | Low-Medium |
| Already read | Penalize |

**ML / vector ranking:** Interface `FeedRanker` — swap implementation in Phase 6+ without changing API.

### 8.2 Search architecture

| Phase | Engine |
|-------|--------|
| 1–2 | Prisma `contains` (current) |
| 4 | SQLite FTS or PostgreSQL `tsvector` |
| 6+ | Optional vector/semantic layer behind `SearchProvider` interface |

---

## 9. Notifications

```
Event (like, comment, follow, publish...)
  → notificationService.create()
  → In-app Notification row
  → (future) email queue / push queue
```

**Preferences (Phase 3):** `NotificationPreference` per user per event type.

**Anti-spam:** Batch similar events; rate limit per actor.

---

## 10. Analytics

| Event | Storage (target) |
|-------|------------------|
| view | `AnalyticsEvent` + aggregate counters |
| read (30s+) | `AnalyticsEvent` |
| completion | scroll depth % (Phase 4) |
| follow conversion | per-content attribution |

**Privacy:** No unnecessary PII; aggregate by default; GDPR export path (Phase 7).

**Current:** `DocumentView` + `readerCount` — evolve, don't replace abruptly.

---

## 11. Media & File Storage

| Env | Storage |
|-----|---------|
| Dev | `./storage/uploads` (current) |
| Prod | S3-compatible via `MediaStorage` interface |

```
mediaService.upload(file, userId)
  → validate type/size
  → optimize (Sharp)
  → store
  → return CDN URL
```

---

## 12. AI Architecture (Phase 6 — optional)

```
lib/ai/
├── provider.ts          # interface: summarize, explain, suggestTags...
├── openai.ts            # optional implementation
├── local.ts             # optional stub
└── disclosure.ts        # AI-assisted content flags
```

**Rules:**
- AI never auto-publishes
- All AI output labeled
- Provider swappable; core works without AI

---

## 13. Knowledge Graph (Phase 5+ foundation)

**Phase 5:** Relational only

```
KnowledgeConcept
ContentConcept (contentId, conceptId, relationship)
```

**Phase 8:** Optional graph query layer — not required for MVP.

---

## 14. Moderation & Safety

| Phase | Capability |
|-------|------------|
| 3 | Report content, basic admin queue |
| 4 | Block user, hide comment |
| 7 | Audit log, enterprise moderation |

`ModerationAction` + `Report` models — add when reporting ships.

---

## 15. Monetization (Phase 7 — architecture only now)

Tables reserved for future: `Membership`, `Subscription`, `Payment` — **do not implement** until ownership model stable.

Content flag: `visibility: PUBLIC | MEMBERS | PAID` on Publication/Content.

---

## 16. Mobile Strategy

| Phase | Approach |
|-------|----------|
| 1–3 | Responsive web; bottom nav on mobile breakpoints |
| 4 | PWA considerations |
| 8 | Native apps consuming `/api/v1` |

**Not:** Compressed desktop — dedicated mobile layouts for Home, Explore, Reader, Create, Library, Profile.

---

## 17. Observability

| Concern | Phase 1 | Production target |
|---------|---------|-------------------|
| Logging | `console` + structured JSON helper | Pino/Winston |
| Errors | Next.js error boundaries | Sentry |
| Metrics | — | Prometheus / hosted APM |
| Health | — | `GET /api/health` |
| Audit | — | `AuditLog` table Phase 7 |

---

## 18. Security Architecture

| Control | Implementation |
|---------|----------------|
| Auth | Better Auth sessions |
| RBAC | Permission service |
| Input validation | Zod on all write APIs |
| Output encoding | React default + markdown sanitization policy |
| Rate limiting | `lib/rate-limit.ts` (Upstash or in-memory dev) Phase 1 |
| Upload security | Type whitelist, size cap, no SVG upload (or sanitize) |
| Headers | CSP, HSTS via reverse proxy |
| Secrets | Env only; never client-exposed |
| CSRF | Better Auth + SameSite cookies |

---

## 19. Deployment Architecture

### Development (current)
```
npm run dev → Next.js :43123 → SQLite file → local uploads
```

### Production (target)
```
CDN → Reverse proxy (nginx/Caddy, TLS)
    → Next.js (PM2/K8s)
    → PostgreSQL
    → S3 / R2
    → (optional) Redis for cache/sessions/rate limits
```

**CI/CD:** UNKNOWN — REQUIRES VERIFICATION. Target: lint → typecheck → test → build → deploy.

---

## 20. Scalability Path

| Scale | Approach |
|-------|----------|
| 0–10K users | Monolith + PostgreSQL |
| 10K–100K | Read replicas, Redis cache, CDN |
| 100K+ | Split read-heavy feed/search; job queue |
| 1M+ | Sharding publications/content; dedicated search |

**Avoid premature:** Microservices, Kafka, graph DB until metrics demand.

---

## 21. Module Boundaries (Code Organization Target)

```
everya/
├── app/                    # Routes only — thin
├── components/
│   ├── everya/             # Design system
│   ├── publication/
│   ├── content/
│   ├── feed/
│   └── ...
├── lib/
│   ├── auth/
│   ├── permissions/
│   ├── validators/
│   └── ai/                 # Phase 6
├── services/               # Business logic
├── prisma/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 22. Architecture Decision Records (Initial)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | Monolithic Next.js | Team size, speed, existing code |
| ADR-002 | Prisma ORM | Already in use; type-safe |
| ADR-003 | Publication over Repository naming | Product vision alignment |
| ADR-004 | Markdown-first editor | Technical audience; existing investment |
| ADR-005 | Deterministic feed before ML | Ship fast; swappable ranker |
| ADR-006 | SQLite dev / Postgres prod | Local-first DX |
| ADR-007 | Better Auth | Already integrated |

---

*This document defines where EVERYA is going. Implementation status is always tracked in `EVERYA_DEVELOPMENT_AUDIT.md` and `EVERYA_ROADMAP.md`.*
