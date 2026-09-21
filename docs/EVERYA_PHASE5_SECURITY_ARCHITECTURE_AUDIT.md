# EVERYA Phase 5 — Security & Architecture Audit

**Date:** 2025-09-22  
**Branch:** `cursor-branch`  
**Scope:** Reading, writing, collaboration (5.1–5.9)

## Architecture decisions (verified)

| Decision | Status | Notes |
|----------|--------|-------|
| `Repository` retained; Trace is product alias | ✅ | Unchanged from Phase 4 |
| Append-only `DocumentRevision` | ✅ | No destructive overwrite of history |
| `lastEditedById` attribution | ✅ | Set on all content saves |
| Canonical share URLs | ✅ | Trace/publication paths; `/r/` redirects |
| Offline APK remains local-only | ✅ | No server credentials in bundle |

## Authorization matrix (new in Phase 5)

| Action | Rule | Enforcement |
|--------|------|-------------|
| List/delete drafts | `canUserEditDocument` | `services/drafts.ts` |
| List/restore revisions | Document editor | `services/document-revisions.ts` |
| View contributors | Document viewers | `GET /api/documents/[id]/contributors` |
| Delete comment | Author or document/trace/pub moderator | `services/comments.ts` |
| Report content | Signed-in user | `POST /api/reports` (rate limited) |
| Share metadata | Public pages only | `generateMetadata` + access checks on drafts |

## API security

| Control | Status |
|---------|--------|
| Revision restore requires edit permission | ✅ |
| Draft delete rejects non-DRAFT documents | ✅ |
| Contributor API blocks draft docs from public | ✅ |
| Comment delete server-side role check | ✅ |
| Publish/delete confirm in UI (client guard) | ✅ |

## Findings

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| P5-01 | Low | Revision table can grow unbounded | Add retention policy in Phase 6 |
| P5-02 | Low | Report flow uses `prompt()` — no server-side dedup | Acceptable for MVP; add admin queue later |
| P5-03 | Info | Offline APK comment/report is local simulation | By design until hosted WebView |
| P5-04 | Low | `ENTERPRISE` visibility unchanged | Same as Phase 4; org ACL in enterprise phase |

## Regression risks

- Phase 4 trace permissions unchanged
- Publication flows unchanged
- Legacy `/r/` redirects still active in `next.config.ts`

## Exit criteria

- [x] All Phase 5 write APIs enforce server-side auth
- [x] Draft/revision/comment deletes permission-checked
- [x] Schema additions backward-compatible
- [x] Verification doc complete
