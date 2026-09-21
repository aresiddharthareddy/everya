# EVERYA API Reference (Phase 1)

Base URL: `http://localhost:43123` (dev)  
Auth: Session cookie via Better Auth (`/api/auth/*`)

## Conventions (Phase 1)

- **Errors:** `{ "error": string, "code"?: string, "details"?: unknown }`
- **Success:** Route-specific JSON (migration to `{ data }` envelope in later phases)
- **401:** Unauthorized — `{ "error": "Unauthorized", "code": "UNAUTHORIZED" }`
- **429:** Rate limited — `{ "error": "Too many requests", "code": "RATE_LIMITED" }`

Validated routes use Zod schemas in `lib/validators/`.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check + DB connectivity |
| * | `/api/auth/[...all]` | — | Better Auth (sign-in, sign-up, session) |
| GET | `/api/search?q=` | No | Search public documents & repositories |
| GET | `/api/tags` | No | List tags with document counts |
| POST | `/api/repositories` | Yes | Create collection (validated, rate limited) |
| POST | `/api/documents` | Yes | Create document (validated, rate limited) |
| GET | `/api/documents/by-slug` | Yes | Fetch document for editor |
| PATCH | `/api/documents/[id]` | Yes | Autosave (author only) |
| POST | `/api/documents/[id]/like` | Yes | Toggle like |
| POST | `/api/documents/[id]/rate` | Yes | Rate 1–5 |
| POST | `/api/documents/[id]/bookmark` | Yes | Toggle bookmark |
| POST | `/api/comments` | Yes | Create comment/reply (validated, rate limited) |
| POST | `/api/comments/like` | Yes | Toggle comment like |
| POST | `/api/upload` | Yes | Image upload only → WebP (rate limited) |
| GET | `/api/files/[filename]` | No | Serve image (allowed extensions only) |
| GET | `/api/notifications` | Yes | List notifications + unread count |
| PATCH | `/api/notifications` | Yes | Mark all read |
| GET | `/api/users/[username]/follow` | Optional | Follow state + follower count |
| POST | `/api/users/[username]/follow` | Yes | Toggle follow |
| PATCH | `/api/users/profile` | Yes | Update name, bio (validated) |

## Rate limits (in-memory, per instance)

| Endpoint | Limit |
|----------|-------|
| POST `/api/repositories` | 20 / min / user |
| POST `/api/documents` | 30 / min / user |
| PATCH `/api/documents/[id]` | 120 / min / user |
| POST `/api/comments` | 30 / min / user |
| POST `/api/comments/like` | 60 / min / user |
| POST `/api/documents/[id]/like` | 60 / min / user |
| POST `/api/documents/[id]/rate` | 30 / min / user |
| POST `/api/documents/[id]/bookmark` | 60 / min / user |
| POST `/api/upload` | 20 / min / user |
| POST `/api/users/[username]/follow` | 30 / min / user |
| GET `/api/search` | 60 / min / IP |

Production should replace with Redis-backed limits.

## Document access (Phase 2.0)

Engagement routes call `assertDocumentAccessible(documentId, userId)` before mutating. Inaccessible or missing documents return **404** (anti-enumeration).
