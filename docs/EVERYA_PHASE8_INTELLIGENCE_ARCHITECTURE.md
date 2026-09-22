# EVERYA Phase 8 — Intelligence Architecture

**Status:** Audit (8.1)  
**Branch:** `cursor-branch`  
**Date:** 2026-09-22

## Principle

AI is an **enhancement layer**. Authoritative knowledge remains:

`Document` + `Repository` (Trace) + `DocumentLink` + `TraceLink` + `Tag` + `Publication` + `Comment`

AI must never silently replace, overwrite, or auto-create graph relationships.

---

## What already exists (inspected)

| Area | Location | Notes |
|------|----------|-------|
| Keyword search | `services/search.ts`, `GET /api/search` | Prisma `contains` on title/subtitle/content/excerpt; **public-only** documents/traces/publications |
| Search UI | `components/search/search-modal.tsx` | Debounced fetch; no semantic mode |
| Knowledge graph | `services/knowledge.ts` | Auth-filtered 1-hop traversal; `KNOWLEDGE_EDGE_LIMIT = 100` |
| Document links | `services/document-links.ts`, `DocumentLink` | Author-created; same-trace CRUD |
| Trace links | `TraceLink`, trace link APIs | Cross-trace `RELATED` |
| Entitlements | `services/entitlements.ts` | PUBLIC / MEMBERS / PREMIUM gating |
| Document visibility | `lib/permissions/document.ts`, `lib/access.ts` | Publication role + trace editor checks |
| Tags | `Tag`, `DocumentTag` | User-managed; explore tag filter |
| Analytics | `services/analytics.ts` | `AnalyticsEvent` table; knowledge link events |
| Rate limiting | `lib/rate-limit.ts` | In-memory sliding window; used on search, comments, etc. |
| Provider pattern | `lib/payments/` | `PaymentProvider` interface + graceful `NOT_CONFIGURED` |
| Publication page | `app/p/[handle]/page.tsx` | Articles list; **no knowledge panel** (Phase 7 gap) |
| Mobile | `apk/www/app.js`, `data.js` | Hash routing; Phase 7 knowledge sections; local demo store |
| Database | `prisma/schema.prisma` | **SQLite** (`provider = "sqlite"`) |
| Background jobs | — | **None** (no queue, worker, or cron) |
| AI / LLM code | — | **None implemented** (`lib/ai/` planned in `EVERYA_ARCHITECTURE.md` only) |
| Embeddings / vectors | — | **None** |

Phase 7 explicitly scoped out: AI relationships, embeddings, semantic search, vector DB.

---

## Intelligence architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UI surfaces (search, document, trace, publication, explore) │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Intelligence services (NEW — Phase 8)                       │
│  services/intelligence.ts   — orchestration, fallbacks       │
│  services/search.ts         — extend (keyword + semantic)    │
│  services/knowledge.ts      — extend (related + suggestions) │
│  services/indexing.ts       — content index lifecycle        │
└───────────┬─────────────────────────────┬─────────────────────┘
            │                             │
┌───────────▼──────────┐      ┌───────────▼───────────────────┐
│  Authoritative data   │      │  lib/ai/ (NEW)                  │
│  Prisma + SQLite      │      │  provider abstraction           │
│  DocumentLink, etc.   │      │  summarize / suggestTags /     │
└───────────────────────┘      │  generateEmbedding              │
                               └───────────┬───────────────────┘
                                           │
                               ┌───────────▼───────────────────┐
                               │  External or local provider      │
                               │  (env-configured, optional)      │
                               └─────────────────────────────────┘
```

**No separate graph DB.** Semantic data is auxiliary metadata indexed from authoritative sources.

---

## Semantic search approach

### Current behavior (keep)

`searchAll()` returns keyword matches across documents, traces, publications, authors. Documents restricted to:

- `status: PUBLISHED`
- `publication.visibility: PUBLIC` OR `repository.visibility: PUBLIC`

Members-only and premium documents are **excluded** from global search today.

### Phase 8 extension (hybrid)

1. Run existing keyword search (unchanged).
2. If AI provider configured **and** query embedding available:
   - Retrieve candidate documents from **pre-authorized index pool** only.
   - Rank by cosine similarity to query embedding.
   - Merge/dedupe with keyword results; label semantic hits (`matchType: "semantic"`).
3. If provider unavailable: return keyword results only; UI shows semantic unavailable (no fake matches).

### Ranking

| Signal | Weight (initial) |
|--------|------------------|
| Exact keyword title match | Highest |
| Keyword body match | High |
| Semantic similarity | Medium (only when configured) |
| `readerCount`, recency | Tie-breaker |

Bounded: default `limit = 20` total results.

### Infrastructure decision — no vector DB in 8.1–8.3

| Option | Verdict |
|--------|---------|
| Pinecone / dedicated vector DB | ❌ Not now — unnecessary for current scale |
| PostgreSQL + pgvector | ⚠️ Production path; requires DB migration off SQLite |
| SQLite + stored embeddings + in-app cosine | ✅ **Smallest fit for dev/MVP** |

SQLite has no native vector index. Acceptable for bounded corpora (seed + demo): store embeddings as JSON (`Float32[]` serialized) in a new index table; compute similarity in application code over a **pre-filtered candidate set** (keyword hits + same-tag docs + public published docs capped at ~500).

**Production note:** migrate to Postgres + `pgvector` when corpus exceeds in-memory similarity budget. Document this limitation; do not fake semantic results.

---

## Embedding strategy

### New table (8.2): `ContentIndex`

Minimal fields:

| Field | Purpose |
|-------|---------|
| `entityType` | `document` (extend later: `trace`, `publication`) |
| `entityId` | FK to source row |
| `contentHash` | SHA-256 of indexed text; skip re-embed if unchanged |
| `embedding` | JSON array of floats (nullable until generated) |
| `indexedAt` | Last index time |
| `visibility` | Denormalized access snapshot for filter-before-search |

**Indexed text (documents):** `title + subtitle + excerpt + tags + first N chars of body` (cap ~8k chars).

**When to index:**

| Trigger | Mechanism |
|---------|-----------|
| Document publish/update | Hook in document save path → enqueue index job |
| Manual regenerate | `POST /api/intelligence/reindex` (editor+) |
| No background worker | **Fire-and-forget async** in API handler or lazy on first semantic search for that doc |

Do **not** block page render on embedding generation.

**Visibility rules:**

- Only index documents the indexing actor can read.
- Global semantic pool = same filter as keyword search (`PUBLIC` published docs).
- Per-user semantic search over private/member content: **out of scope for 8.3** unless user-scoped index partition is added; document as limitation.

---

## AI provider boundary

Mirror `lib/payments/`:

```
lib/ai/
├── index.ts           # getAiProvider(), isAiConfigured()
├── types.ts           # AiProvider interface
├── noop-provider.ts   # NOT_CONFIGURED — all methods return graceful errors
└── openai-provider.ts # optional; env: AI_PROVIDER, OPENAI_API_KEY, AI_MODEL_*
```

```typescript
interface AiProvider {
  name: string;
  isConfigured(): boolean;
  summarize(input: { text: string; maxPoints?: number }): Promise<AiResult<string>>;
  suggestTags(input: { title: string; text: string; existing: string[] }): Promise<AiResult<string[]>>;
  generateEmbedding(input: { text: string }): Promise<AiResult<number[]>>;
}
```

`AiResult<T> = { ok: true; data: T } | { ok: false; code: "NOT_CONFIGURED" | "RATE_LIMITED" | "ERROR"; message: string }`

Env vars (proposed):

```
AI_PROVIDER=openai|none
OPENAI_API_KEY=
AI_MODEL_CHAT=gpt-4o-mini
AI_MODEL_EMBEDDING=text-embedding-3-small
```

No provider configured → all AI features show unavailable state; core app unaffected.

---

## Summary generation (8.5)

### Storage: `DocumentAiSummary` (optional persistence)

| Field | Purpose |
|-------|---------|
| `documentId` | unique |
| `summary`, `keyPoints` (JSON), `topics` (JSON) | generated output |
| `model`, `generatedAt` | provenance |
| `contentHash` | invalidate when source changes |

### Flow

1. User clicks **Generate summary** on document page (on-demand).
2. Server verifies `checkContentEntitlement` + `canViewArticleContent`.
3. If `contentHash` matches cached summary → return cache.
4. Else call `ai.summarize()` with document text.
5. Render in labeled panel: **"AI-generated summary"** — never inline in article body.

Regenerate = bust cache. Provider failure = inline error in panel only.

---

## AI-assisted tagging (8.6)

### Flow

1. Editor opens tag suggestions on document edit.
2. `POST /api/documents/[id]/ai/tag-suggestions` → `suggestTags()`.
3. Response: `{ suggestions: string[], existing: string[] }` — **no DB write**.
4. User accepts → existing tag attach API (`DocumentTag`).

### Storage

Suggestions are ephemeral (API response only). Accepted tags use existing `Tag` / `DocumentTag` architecture.

UI: suggested tags styled distinctly from confirmed tags.

---

## Related-content discovery (8.4)

Extend `getDocumentKnowledge()` return shape:

```typescript
{
  // existing — AUTHOR-CREATED
  references, referencedBy, dependencies, related, ...

  // new — clearly labeled
  semanticSuggestions?: {
    documents: { id, title, href, score }[];
    traces: { id, name, href, score }[];
    source: "semantic";
    disclaimer: "AI similarity — not an author relationship";
  }
}
```

**Order of precedence:**

1. Explicit `DocumentLink` / `TraceLink` (always first).
2. Shared tags (deterministic, not AI).
3. Semantic similarity (supplement only; never persisted as links).

Never write AI suggestions to `DocumentLink` or `TraceLink` without explicit user action.

---

## Trace intelligence (8.7)

Derive from real data in `getTraceKnowledge()` + lightweight aggregates:

| Feature | Source |
|---------|--------|
| Document list / map | Existing trace knowledge |
| Important docs | `readerCount`, link count, `DEPENDS_ON` inbound |
| Related traces | `TraceLink` |
| Topic clusters | Shared `DocumentTag` groups |
| Suggested reading order | `DEPENDS_ON` + `PREVIOUS`/`NEXT` links — labeled **"Suggested"** |
| Trace overview summary | Optional AI on concatenated public doc titles/excerpts (on-demand) |

No invented facts. AI overview clearly labeled.

---

## Discovery surfaces (8.8)

| Surface | Intelligence addition |
|---------|----------------------|
| Search modal | Semantic results section + badge |
| Document page | AI summary panel; related knowledge (existing + semantic) |
| Trace page / knowledge map | Trace intelligence sidebar |
| Publication page | Knowledge context (8.9) — traces, key docs, connections |
| Explore | Optional "similar to what you read" (signed-in, bounded) |
| Profile | No AI dashboard — keep minimal |

Rule: contextual sections only; no page-wide AI takeover.

---

## Publication knowledge (8.9)

Reuse `services/knowledge.ts`:

- Publication's trace via `Publication.repositoryId`
- `getTraceKnowledge(repositoryId, userId)`
- Publication-scoped document links where both ends are in publication trace
- Related traces via `TraceLink` on publication trace

New component: `PublicationKnowledgePanel` on `app/p/[handle]/page.tsx`.

---

## Indexing

| Content | Indexed for search | Notes |
|---------|-------------------|-------|
| Document title/body/tags | ✅ | Primary |
| Trace name/description | ✅ | Metadata only |
| Publication name/description | ✅ | Metadata only |
| DocumentLink / TraceLink | ❌ as embeddings | Used directly in knowledge service |
| Comments | ❌ initially | Privacy + noise risk |
| Private / premium docs | ❌ in global index | Per-user index deferred |

**Deletion:** cascade delete `ContentIndex` / `DocumentAiSummary` on document delete (FK `onDelete: Cascade`).

---

## Privacy & security boundaries (8.11 preview)

| Rule | Enforcement point |
|------|-------------------|
| No AI without read entitlement | All AI API routes call `checkContentEntitlement` / `canViewArticleContent` first |
| No protected content in global search | Filter in `searchAll` + index `visibility` column |
| No secrets to provider | Strip env patterns; cap input length |
| Prompt injection | System prompt isolates instructions; treat doc body as untrusted user content |
| No AI auth decisions | Entitlements remain in `services/entitlements.ts` only |
| Provider secrets | Env only; never client-exposed |

Content sent to external AI: only after server-side authorization; log `entityId` + `userId`, not full body, in analytics.

---

## Rate limiting & abuse (8.12)

Reuse `lib/rate-limit.ts`:

| Endpoint | Suggested limit |
|----------|-----------------|
| `GET /api/search` (semantic) | 60/min (existing) |
| `POST .../ai/summary` | 10/min per user |
| `POST .../ai/tag-suggestions` | 20/min per user |
| `POST /api/intelligence/reindex` | 5/min per user |
| Embedding batch | 30/min per user |

Add authenticated user ID to rate-limit key when session present.

---

## Failure & fallback behavior

| Condition | Behavior |
|-----------|----------|
| `AI_PROVIDER=none` or missing API key | AI panels: "Intelligence unavailable"; keyword search works |
| Embedding generation fails | Skip semantic leg; keyword results only |
| Summary fails | Panel error; document body unaffected |
| Tag suggestions fail | Empty suggestions + message |
| Index stale | Re-index on next edit or manual regenerate |
| SQLite similarity slow | Cap candidates; log warning; recommend Postgres migration |

Never return placeholder/fake AI text.

---

## Mobile architecture (8.13)

APK remains offline-first demo with hosted API passthrough when online.

| Feature | Mobile approach |
|---------|-----------------|
| Search | Extend search view; call `/api/search?semantic=1` when online |
| Summary | Document detail section; fetch on tap |
| Related knowledge | Reuse knowledge API responses |
| Tag suggestions | Edit flow modal |
| Trace intelligence | Extend `#/u/.../trace/.../knowledge` |
| Publication knowledge | New `#/p/{handle}` section |
| Fallback | Same copy as web when `aiConfigured: false` in health/config |

Bump APK to **v8.0.0** after implementation.

---

## Implementation order (milestones 8.2+)

1. **8.2** — `ContentIndex` schema + `services/indexing.ts` + reindex hook
2. **8.10** — `lib/ai/` provider abstraction + noop provider
3. **8.11** — Authorization wrapper `services/intelligence-guard.ts`
4. **8.3** — Extend `searchAll` with semantic leg + UI badges
5. **8.4** — Semantic suggestions in knowledge service (labeled)
6. **8.5** — Summary API + document panel
7. **8.6** — Tag suggestion API + edit UI
8. **8.7** — Trace intelligence aggregates
9. **8.8–8.9** — Surface integration + publication panel
10. **8.12** — Rate limits on new routes
11. **8.13–8.14** — Mobile + APK build
12. **8.16–8.17** — Tests + security/verification docs

---

## Out of scope (Phase 8)

- Autonomous agents, auto-publishing, auto-moderation
- AI-created `DocumentLink` / `TraceLink` without user confirm
- Vector database as required dependency
- Real-time collaboration / CRDT
- Enterprise AI platform
- Per-user private semantic index (defer; document limitation)
- Comment/discussion embedding

---

## Key constraints from current stack

1. **SQLite** — semantic search is app-level similarity, not indexed ANN.
2. **No job queue** — use async fire-and-forget or lazy indexing.
3. **No existing AI code** — build `lib/ai/` from scratch following payments pattern.
4. **Phase 7 graph is authoritative** — extend, do not replace.

---

## Phase 9 recommendation (preview)

- Migrate production DB to PostgreSQL + `pgvector`
- Background worker for batch reindexing
- Per-user scoped semantic search over entitled content
- Configurable AI provider (Anthropic, local Ollama)
- Stripe + AI billing metering
