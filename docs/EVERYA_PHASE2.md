# EVERYA Phase 2

Social publishing platform — implementation tracker.

## Sub-phases

| Phase | Status | Description |
|-------|--------|-------------|
| 2.0 Hardening | ✅ Complete | Security fixes from Phase 1 verification |
| 2.1 Profiles | ⬜ Pending | Creator identity |
| 2.2 Publications | ⬜ Pending | Publication entity + RBAC |
| 2.3 Publishing | ⬜ Pending | Draft/publish workflow |
| 2.4 Social graph | ⬜ Pending | Follow authors + publications |
| 2.5 Engagement | ⬜ Pending | Reactions, comments, replies |
| 2.6 Reading | ⬜ Pending | Bookmarks, continue reading |
| 2.7 Notifications | ⬜ Pending | Event-driven notifications |
| 2.8 Discovery | ⬜ Pending | For You / Following / Latest / Trending |
| 2.9 Polish | ⬜ Pending | UX, mobile, accessibility |
| 2.10 Verification | ⬜ Pending | End-to-end quality gate |

## Phase 2.0 — Hardening (completed)

### Security

- `lib/permissions/document.ts`: `assertDocumentAccessible`, `commentParentMatchesDocument`
- Wired visibility checks: comments, like, rate, bookmark, comment-like
- Comment `parentId` validated against `documentId`
- `PATCH /api/documents/[id]`: Zod `updateDocumentSchema` + rate limit (120/min)
- Extended rate limits: follow, search, engagement routes
- Server-side auth redirect: settings, new repo, new doc, edit doc

### Tests

- `tests/lib/document-access.test.ts` — visibility + parent comment rules

### Documentation

- Product docs copied to `everya/docs/`
- `EVERYA_SECURITY.md` updated to reflect actual controls

### Not in scope (deferred)

- Auth endpoint rate limiting (Better Auth handler)
- Redis-backed rate limits
- Publication model (Phase 2.2)
