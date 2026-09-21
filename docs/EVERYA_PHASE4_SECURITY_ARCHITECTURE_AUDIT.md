# EVERYA Phase 4 — Security & Architecture Audit

**Date:** 2025-09-22  
**Branch:** `cursor-branch`  
**Scope:** Trace platform (4.1–4.15)

## Architecture decisions (verified)

| Decision | Status | Notes |
|----------|--------|-------|
| `Repository` table retained; Trace is product alias | ✅ | No breaking DB rename |
| Publication-backed repos excluded from Trace discovery | ✅ | `publication: null` filters |
| `/r/` → `/u/.../trace/` redirects | ✅ | `next.config.ts` |
| Trace permissions server-side only | ✅ | `lib/permissions/trace.ts` |

## Authorization matrix

| Action | Rule | Enforcement |
|--------|------|-------------|
| View public trace | Anyone | `assertCanViewTrace` |
| View private trace | Owner or `TraceMember` | `assertCanViewTrace` + member lookup |
| Edit trace documents | Owner, EDITOR, CONTRIBUTOR | `getTraceRole` + `canEditTraceContent` |
| Manage trace settings | Owner, EDITOR | `canManageTraceSettings` |
| Manage members | Owner only | `canManageTraceMembers` |
| Follow trace | Signed-in user, public trace | `/api/traces/.../follow` |
| Import trace | Signed-in owner | `/api/traces/import` |
| Export trace | `canEditTraceContent` | `/api/traces/.../export` |
| Document links CRUD | `canEditTraceContent` on source doc | `/api/documents/[id]/links` |

## API security

| Control | Status |
|---------|--------|
| Session required for writes | ✅ |
| Rate limiting on follow/import/create | ✅ |
| Path traversal blocked in import | ✅ (`..`, dotfiles) |
| Import size limits | ✅ (500 files, 10MB total) |
| Member invite validates user exists | ✅ |
| Export requires edit role (not public read) | ✅ |

## Findings

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| P4-01 | Low | Private trace visibility does not yet distinguish EDITOR vs CONTRIBUTOR for settings UI | Acceptable for Phase 4; refine in Phase 5 |
| P4-02 | Low | Export returns JSON, not zip | Foundation only; add zip in production |
| P4-03 | Info | Offline APK has no server auth surface | By design until production WebView |
| P4-04 | Medium | `ENTERPRISE` visibility treated like private (owner + members) | Document for enterprise rollout; add org ACL later |

## Regression risks

- Publication flows unchanged (`/p/...`, `PublicationMember`)
- Legacy `/r/` URLs redirect correctly
- Feed `articleHref` still routes publications vs traces

## Exit criteria

- [x] All Phase 4 APIs enforce server-side auth
- [x] No client-only permission checks for trace writes
- [x] Schema additions backward-compatible
- [x] Verification doc complete
