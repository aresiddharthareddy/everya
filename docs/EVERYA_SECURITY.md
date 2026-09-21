# EVERYA Security

## Authentication

- Better Auth email/password with scrypt password hashing
- Session expiry: 7 days
- `BETTER_AUTH_SECRET` required — must be strong in production
- Auth route rate limiting: deferred (use reverse-proxy limits in production)

## Authorization

- Repository visibility: PUBLIC / PRIVATE / ENTERPRISE (ENTERPRISE = owner-only until publication RBAC)
- Document read (SSR): `canViewRepo` → 404 when inaccessible
- Document edit: author only (`autosaveDocument`)
- Engagement APIs (Phase 2.0): `assertDocumentAccessible` on comment, like, rate, bookmark, comment-like
- Comment `parentId` must belong to the same document
- Permission helpers: `lib/permissions/` (`repository`, `document`)

## Rate limiting (in-memory, per instance)

| Endpoint | Limit |
|----------|-------|
| POST `/api/repositories` | 20/min/user |
| POST `/api/documents` | 30/min/user |
| PATCH `/api/documents/[id]` | 120/min/user |
| POST `/api/comments` | 30/min/user |
| POST `/api/comments/like` | 60/min/user |
| POST `/api/documents/[id]/like` | 60/min/user |
| POST `/api/documents/[id]/rate` | 30/min/user |
| POST `/api/documents/[id]/bookmark` | 60/min/user |
| POST `/api/upload` | 20/min/user |
| POST `/api/users/[username]/follow` | 30/min/user |
| GET `/api/search` | 60/min/IP |

Production: replace with Redis-backed limits.

## Validation

- Zod on: repository create, document create, document PATCH (autosave), comment create, profile update, comment-like, rate
- Standard errors via `lib/api-response.ts` (no stack traces to clients)

## Uploads

- Images only (JPEG, PNG, WebP, GIF)
- 8 MB max, re-encoded to WebP via Sharp
- Public serve: allowed image extensions only, `path.basename` for traversal protection

## Protected pages (server redirect)

- `/dashboard`, `/stats`, `/reading-list`, `/notifications`
- `/settings`, `/dashboard/new`, `/r/.../new`, `/r/.../edit` (Phase 2.0)

## Gaps (planned)

| Gap | Target |
|-----|--------|
| OAuth, email verify, password reset | Phase 2+ |
| Redis rate limits | Phase 2+ |
| CSP / security headers | Phase 2+ |
| Publication RBAC | Phase 2.2+ |
| Audit logging | Phase 7 |
| Content moderation | Phase 3 |

## Secrets

- Never commit `.env`
- Rotate `BETTER_AUTH_SECRET` for production
