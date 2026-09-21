# Phase 5 Verification

**Date:** 2025-09-22  
**Branch:** `cursor-branch`  
**Scope:** Reading, Writing & Collaboration (5.1–5.9)

## Quality gate

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run test` | PASS (67 tests) |
| `npx next build` | Run before release |

## Milestone completion

| Milestone | Task | Status |
|-----------|------|--------|
| 5.1 | Reading experience audit | ✅ |
| 5.2 | Advanced reading experience | ✅ |
| 5.3 | Writing experience | ✅ |
| 5.4 | Document versioning | ✅ |
| 5.5 | Drafts & writing workflow | ✅ |
| 5.6 | Collaboration foundation | ✅ |
| 5.7 | Comments & discussion upgrade | ✅ |
| 5.8 | Sharing & deep links | ✅ |
| 5.9 | Mobile APK update | ✅ |
| — | Security audit + verification | ✅ |

## Key deliverables

| Area | Paths |
|------|-------|
| Editor hook | `hooks/use-document-editor.ts` |
| Revisions | `services/document-revisions.ts`, `DocumentRevision` model |
| Drafts | `services/drafts.ts`, `/drafts`, `DELETE /api/documents/[id]` |
| Collaboration | `Document.lastEditedById`, `services/collaboration.ts` |
| Comments | `DELETE /api/comments/[id]`, upgraded `comment-section.tsx` |
| Sharing | `lib/share-url.ts`, `ShareButton`, `generateMetadata` |
| Offline APK | `apk/www/` v5.0.0, `public/EVERYA-offline.apk` |

## Manual smoke checks

- [ ] Trace doc: prev/next footer, reading progress, share copies canonical URL
- [ ] Trace editor: autosave, publish confirm, discard draft, version history
- [ ] `/drafts` lists editable drafts; delete draft works
- [ ] Document shows contributors + last-edited attribution
- [ ] Comment delete (author) and remove (moderator); report flow
- [ ] `#discussion` deep link scrolls on refresh
- [ ] Legacy `/r/...` redirects to `/u/.../trace/...`
- [ ] APK offline: drafts tab, prev/next, share, comment delete/report, `~discussion` links

## APK build

```bash
npm run build:apk
```

Output: `everya/everya/public/EVERYA-offline.apk` (requires Android SDK)
