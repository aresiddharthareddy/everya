# EVERYA Phase 2 — Core Social Publishing Platform

## Status: COMPLETE (2.0–2.10)

| Sub-phase | Status |
|-----------|--------|
| 2.0 Hardening | ✅ |
| 2.1 Profiles | ✅ |
| 2.2 Publications | ✅ |
| 2.3 Publishing | ✅ |
| 2.4 Social Graph | ✅ |
| 2.5 Engagement | ✅ |
| 2.6 Reading | ✅ |
| 2.7 Notifications | ✅ |
| 2.8 Discovery | ✅ |
| 2.9 Polish | ✅ |
| 2.10 Verification | ✅ |

## What shipped

### Identity & profiles (2.1)
- Public profile `/u/[username]` with Articles | Publications | About tabs
- Website + avatar on profile settings
- Follower/following counts, published articles only for public view

### Publications (2.2)
- `Publication`, `PublicationMember`, `PublicationFollow` models
- RBAC: OWNER, ADMIN, EDITOR, WRITER, CONTRIBUTOR (`lib/permissions/publication.ts`)
- Create publication `/publications/new`, landing `/p/[handle]`
- Member management API, publication settings PATCH
- Publication follow

### Publishing (2.3)
- Article fields on `Document`: subtitle, status, publishedAt, coverImage, publicationId
- Draft → publish → archive workflow
- Write editor `/p/[handle]/write` with autosave + publish
- Article reader `/p/[handle]/[slug]` with SEO metadata

### Social graph (2.4)
- User follow (existing, + FOLLOW notifications)
- Publication follow (new)

### Engagement (2.5)
- Comments, replies, likes, ratings, bookmarks (visibility-enforced from 2.0)

### Reading (2.6)
- Reading progress API + continue reading on `/reading-list`
- Bookmarks (existing)

### Notifications (2.7)
- FOLLOW, publication follow, comment/reply/like/rating (existing + extended types)

### Discovery (2.8)
- Feed API `/api/feed?tab=for-you|following|latest|trending`
- Explore tabs updated with For You + published-only filter

### Search
- Articles, authors, publications with `?type=` filter

### Foundations
- `AnalyticsEvent` model + `trackEvent()` service
- `ContentReport` model + `/api/reports`
- `ReadingProgress` model

## Database migration

`prisma/migrations/20260921130829_phase2_social_platform/`

Dev: `npx prisma db push` (existing DBs) or `prisma migrate deploy` (clean)

## Deferred (not Phase 2)

- Better Auth endpoint rate limiting
- Redis-backed rate limits
- ML recommendations
- Payments / creator economy
- Advanced moderation UI
- Elasticsearch / Kafka / microservices

## Phase 3 prerequisites

- Major platform security audit (see master plan)
- Publication isolation review at scale
- Knowledge graph / communities expansion
