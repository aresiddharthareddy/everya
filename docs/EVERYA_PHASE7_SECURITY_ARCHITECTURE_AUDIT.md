# EVERYA Phase 7 — Security & Architecture Audit

**Date:** 2026-09-22

## Graph authorization

- All knowledge reads flow through `services/knowledge.ts`.
- `canExposeDocumentInGraph` uses `canViewArticleContent` + Phase 6 entitlements.
- Private/premium targets are **omitted entirely** from panels and trace maps (no title/URL leak).

## Side-channel prevention

| Risk | Mitigation |
|------|------------|
| Public doc → private doc link | Target filtered before render |
| Inbound “referenced by” | Source must pass same visibility gate |
| Trace map edges | Both endpoints must be visible |
| Cross-trace links | `assertCanViewTrace` on both repositories |

## Relationship integrity

- Self-links rejected on document and trace create.
- Duplicate edges prevented by `@@unique([from, to, type])`.
- Cascade delete on document/repository removal.
- Target must be same repository (documents) or viewable trace (trace links).

## IDOR

- Document link CRUD: trace editor on source repository.
- Trace link CRUD: source owner or editor only.
- Knowledge APIs use document/trace IDs only after path resolution + access checks.

## API security

- Write endpoints require session.
- `GET /api/documents/[id]/knowledge` returns 404 if source not visible.
- Link list API passes `userId` for filtered reads.

## Performance

- `KNOWLEDGE_EDGE_LIMIT = 100` on traversals.
- Indexed `fromDocumentId`, `toDocumentId`, `type` on `DocumentLink`.
- No unbounded recursive graph walks.

## Activity

- `knowledge_link_created` / `knowledge_link_removed` via existing `AnalyticsEvent`.

## Residual risks (Phase 8)

1. Batch entitlement checks per edge (N checks on large maps) — acceptable at current limits.
2. Publication document link editing not enabled (read-only knowledge panel).
3. Search link counts are aggregate counts, not filtered per viewer.

## Verdict

Phase 7 knowledge layer is **safe for demo/production read paths**. No protected content leakage through relationship UI.
