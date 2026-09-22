# EVERYA Phase 8 — Security Architecture Audit (No-AI)

**Date:** 2026-09-22  
**Branch:** `cursor-branch`  
**Scope:** Knowledge discovery foundation without AI providers.

## Summary

Non-AI Phase 8 discovery reuses Phase 7 authorization. No external AI egress. Protected content is filtered server-side before appearing in related-knowledge panels, trace intelligence, publication knowledge, or explore hints.

## Authorization

| Surface | Gate |
|---------|------|
| Document knowledge | `getDocumentKnowledge` → `canViewArticleContent` + `canExposeDocumentInGraph` per target |
| Trace intelligence | `getTraceIntelligence` → `assertCanViewTrace` + per-document graph exposure |
| Publication knowledge | `getPublicationKnowledge` → publication visibility on page + trace intelligence gates |
| Explore hints | Public published `PUBLIC` access documents and public traces only |
| Keyword search | `publicDocumentWhere` + `accessLevel: PUBLIC` |

## Data leakage risks

| Risk | Mitigation | Status |
|------|------------|--------|
| Premium doc in related panel | `canExposeDocumentInGraph` on every target | ✅ |
| Private trace in explore | `visibility: PUBLIC` filter | ✅ |
| Member-only in global search | `accessLevel: PUBLIC` on keyword leg | ✅ |
| Protected doc in explore hints | Same public filters as search | ✅ |
| IDOR on knowledge API | Existing `/api/documents/[id]/knowledge` returns 404 when denied | ✅ |
| AI provider egress | No provider configured; `NoopAiProvider` only | ✅ N/A |

## Indexing security

- `ContentIndex.visibility` denormalized: `PROTECTED` / `PRIVATE` rows excluded from global semantic pool (semantic inactive without AI).
- Reindex API requires editor+ permission; rate limited (10/min).

## Graph integrity

- No auto-created `DocumentLink` / `TraceLink` from discovery features.
- Reading paths labeled as suggestions from explicit `NEXT` links only.

## Mobile

- Offline demo data; no network AI calls.
- Premium gating via `canAccessDoc` unchanged.
- Search route is keyword-only with explicit unavailable notice.

## Performance

- Bounded queries: `KNOWLEDGE_EDGE_LIMIT`, `DISCOVERY_DOC_LIMIT`, `TOP_DOC_LIMIT`.
- Async indexing via `scheduleDocumentIndex` — non-blocking saves.

## Known limitations

1. Semantic search infrastructure present but inactive (by design).
2. Per-user semantic search over entitled private content not implemented.
3. SQLite in-memory similarity not used without embeddings.

## Phase 9 recommendation

When AI is added post-production: enforce `intelligence-guard` on all provider calls, add audit logging, migrate to Postgres + pgvector for scale.
