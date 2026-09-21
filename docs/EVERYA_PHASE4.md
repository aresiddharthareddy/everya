# EVERYA Phase 4 — Trace + Knowledge Platform

**Status:** IN PROGRESS  
**Prerequisite:** Phase 3 complete  
**Branch:** `cursor-branch`

## Progress

| Milestone | Task | Status |
|-----------|------|--------|
| 4.1 | Trace architecture audit | ✅ |
| 4.2 | Trace domain model | ✅ |
| 4.3 | Trace URLs | ✅ |
| 4.4 | Trace landing page | ✅ |
| 4.5 | Document tree | ✅ |
| 4.6 | Single-document feed | ✅ |
| 4.7 | Go to Trace gateway | ✅ |
| 4.8 | Markdown/Obsidian import | ✅ |
| 4.9 | Trace discovery | ✅ |
| 4.10 | Trace following | ✅ |
| 4.11 | Document relationships | ⬜ |
| 4.12 | Contributors / ownership | ⬜ |
| 4.13 | Export foundation | ⬜ |
| 4.14 | Mobile / APK | ⬜ |
| 4.15 | Security audit + verification | ⬜ |

## Key docs

- Architecture: `EVERYA_PHASE4_ARCHITECTURE.md`
- Verification: (pending) `EVERYA_PHASE4_VERIFICATION.md`
- Security audit: (pending) `EVERYA_PHASE4_SECURITY_ARCHITECTURE_AUDIT.md`

## Core decision (4.1)

**Repository stays in DB.** Trace is the product concept — UI, URLs, and new APIs alias `Repository` without renaming tables.
