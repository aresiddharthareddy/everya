# EVERYA Phase 7 — Knowledge Architecture

**Status:** Audit (7.1)  
**Branch:** `cursor-branch`  
**Date:** 2026-09-22

## Principle

No separate graph database. Extend existing **DocumentLink** (Phase 4) and **Repository** (Trace) structures into an authorization-aware knowledge layer.

## What already exists

| Asset | Location | Notes |
|-------|----------|-------|
| Document → Document links | `DocumentLink` | Types: `RELATED`, `PREVIOUS`, `NEXT`, `PART_OF` |
| Link service | `services/document-links.ts` | Create/remove; same-trace only |
| Link API | `GET/POST/DELETE /api/documents/[id]/links` | No inbound links; **no auth filter on read** |
| UI panel | `DocumentRelationships` | Outbound only; trace doc pages |
| Hierarchy | `Folder` + `getTraceTree` | Tree navigation |
| Publication → Trace | `Publication.repositoryId` | 1:1 contains |
| Tags | `DocumentTag` | Discovery, not graph edges |
| Search | `services/search.ts` | Text match; no relationship context |
| Prev/next nav | `lib/document-nav.ts` | Uses `PREVIOUS`/`NEXT` links |
| Entitlements | `services/entitlements.ts` | Phase 6 premium/members |

## Knowledge node types

| Node | DB entity | Product name |
|------|-----------|--------------|
| Document | `Document` | Document |
| Trace | `Repository` (no `publicationId`) | Trace |
| Publication | `Publication` | Publication |

**Not separate nodes:** Folder (organizational), User (author), Comment (discussion).

## Relationship vocabulary (Phase 7)

### Document → Document (`DocumentLink`)

| Type | Meaning | Existing |
|------|---------|----------|
| `RELATED` | Related to | ✅ |
| `REFERENCES` | References / cites | **Add** |
| `DEPENDS_ON` | Prerequisite | **Add** |
| `PART_OF` | Part of series/collection | ✅ |
| `PREVIOUS` / `NEXT` | Reading order | ✅ (nav, not knowledge panel primary) |

### Trace → Trace (`TraceLink` — **new**)

| Type | Meaning |
|------|---------|
| `RELATED` | Related trace |

### Publication → Trace

Implicit: `Publication.repositoryId` — no duplicate edge table.

## Edge properties

| Field | DocumentLink | TraceLink |
|-------|--------------|-----------|
| source | `fromDocumentId` | `fromRepositoryId` |
| target | `toDocumentId` | `toRepositoryId` |
| type | `DocumentLinkType` | `TraceLinkType` |
| creator | `createdById` (add) | `createdById` |
| created | `createdAt` | `createdAt` |

## Ownership & visibility

- **Create document link:** trace editor+ (`canEditTraceContent`); same repository; no self-link.
- **Create trace link:** trace owner or editor on source trace; both traces must be viewable by actor.
- **Read traversal:** `services/knowledge.ts` filters targets — unauthorized users **never** see private/premium target title, URL, or existence.
- **Publication docs:** link CRUD deferred to publication editors (Phase 7: read-only panel via entitlements).

## Traversal rules

- Max depth: **1 hop** for panels (outbound + inbound); trace map loads bounded edge list (default **100**).
- Document links scoped to **same repository** (unchanged).
- Trace links: cross-trace; both endpoints must pass `assertCanViewTrace`.
- Cycles: allowed for `RELATED`/`REFERENCES`; `DEPENDS_ON` may cycle (user responsibility).
- Duplicates: `@@unique([from, to, type])` on both link tables.

## Activity

Reuse `AnalyticsEvent` via `trackEvent`: `knowledge_link_created`, `knowledge_link_removed`, `trace_link_created`, `trace_link_removed`.

## API surface (planned)

| Route | Purpose |
|-------|---------|
| `GET /api/documents/[id]/knowledge` | Auth-filtered outbound/inbound |
| `GET /api/traces/[u]/[slug]/knowledge` | Trace knowledge map |
| `POST/DELETE /api/traces/[u]/[slug]/links` | Trace relationships |
| Extend `GET /api/search` context | Related count in subtitle |

## UI (planned)

- `DocumentKnowledgePanel` — replaces/extends `DocumentRelationships` (references, referenced-by, dependencies, related)
- `/u/[username]/trace/[slug]/knowledge` — trace knowledge map (list + document selector)
- Mobile APK — knowledge section on doc view, trace knowledge list

## Out of scope

AI relationships, embeddings, semantic search, 3D graph, vector DB.

## Implementation order

1. Schema migration (`REFERENCES`, `DEPENDS_ON`, `createdById`, `TraceLink`)
2. `services/knowledge.ts` + auth filtering
3. Upgrade document-links + APIs
4. Document panel + trace knowledge page
5. Search context + activity events
6. Mobile APK + audits
