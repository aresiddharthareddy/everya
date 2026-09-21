# EVERYA Phase 6 — Creator Economy Architecture

**Status:** Foundation audit (6.1)  
**Branch:** `cursor-branch`  
**Date:** 2026-09-22

## Product model (unchanged)

```
Person → Publication → Trace → Documents → Discussion → Knowledge
```

- **Repository** remains the DB table; **Trace** is the product alias (URLs/APIs/UI).
- Phase 5 reading/writing/collaboration foundations are not redesigned.

---

## What already exists

| Area | Current state |
|------|----------------|
| **User** | `username`, `name`, `bio`, `website`, `image` — profile at `/u/[username]` |
| **Publication** | Editorial home; `PublicationMember` = **team roles** (OWNER→CONTRIBUTOR) |
| **Trace** | `Repository` + `TraceFollow` / `TraceMember` (editor/contributor) |
| **Document** | `status`, `publicationId`, repo visibility; no paywall field yet |
| **Follow (social)** | `UserFollow`, `PublicationFollow`, `TraceFollow` |
| **Permissions** | `lib/permissions/*`, `assertDocumentAccessible`, `canViewRepo` |
| **Stats** | `getWriterStats`, `DocumentView`, `readerCount` |
| **Analytics** | `AnalyticsEvent` append-only events |
| **Dashboard** | `/dashboard` (creator eyebrow), `/stats` writer metrics |
| **Notifications** | `NotificationType.MEMBERSHIP` enum exists; no economy handlers yet |
| **Payments** | **None** — no provider env vars, no transaction tables |
| **Mobile** | Offline APK (`apk/www/`) with bundled demo data |

### Critical separation

| Concept | Model | Purpose |
|---------|-------|---------|
| **Follow** | `UserFollow`, `PublicationFollow`, `TraceFollow` | Social discovery |
| **Editorial team** | `PublicationMember`, `TraceMember` | Content permissions |
| **Membership** | `CreatorMembership` *(new)* | Paid/free audience access |
| **Subscription** | `BillingSubscription` *(new)* | Recurring billing lifecycle |

---

## Phase 6 boundaries

### Creator

- **Not a separate user system.** Creator = `User` with optional `CreatorProfile` extension.
- Profile reuses `/u/[username]`; creator stats via existing `getWriterStats` + economy tables.
- `CreatorProfile`: `tagline`, `links` (JSON), `isCreator` flag.

### Publication / Trace

- **Publication** scopes membership plans and premium content for editorial homes.
- **Trace** (repository without publication) scopes plans via `repositoryId` on plan/membership.
- Ownership: `Publication.ownerId`, `Repository.ownerId` — revenue accrues to creator user.

### Premium content

- `Document.accessLevel`: `PUBLIC` | `MEMBERS` | `PREMIUM`.
- **Server-side only** — `services/entitlements.ts` is the single gate.
- Unauthorized users see metadata + paywall; **content body never returned** from protected APIs/pages.

### Membership

- `MembershipPlan` — tier (`MEMBER` | `PREMIUM`), price, scope (creator/publication/repository).
- `CreatorMembership` — user ↔ scope, `ACTIVE` | `INACTIVE` | `CANCELLED` | `EXPIRED`, start/end.
- Distinct from `PublicationMember` (editorial) and all `*Follow` models.

### Subscription

- `BillingSubscription` lifecycle: `CREATED` → `ACTIVE` → `CANCELLED` | `EXPIRED`.
- Links to `MembershipPlan`; stores provider refs only (no card data).

### Transaction

- `PaymentTransaction` — amount, fees, status, `providerPaymentId`, `providerEventId` (idempotency).
- Created only from **webhook/server confirmation**, never from client callback alone.

### Entitlement

```
User → CreatorMembership / BillingSubscription → entitlement check → Document.accessLevel
```

- Central function: `assertContentEntitlement(document, userId?)`.
- Used by: document pages, `GET/PATCH` document APIs, search excerpts (strip body).

### Creator revenue

```
PaymentTransaction → CreatorRevenue (gross, platformFee, net) → CreatorPayoutBalance
```

- Payout transfers deferred until provider Connect is configured.
- Financial data visible only to creator owner + platform admin session.

### Payout

- `CreatorPayoutBalance`: `availableCents`, `pendingCents`, `totalPaidCents`.
- Actual bank payout = Phase 6.10 foundation only; no fake transfers.

---

## Payment provider

**Recommended:** Stripe (Checkout + Customer + Subscription + webhooks).

**Abstraction:** `lib/payments/provider.ts` interface; `lib/payments/stripe.ts` implementation.

| Concern | Boundary |
|---------|----------|
| Checkout | Server creates session; client redirects |
| Confirmation | Webhook `checkout.session.completed`, `invoice.paid` |
| Subscription | Provider subscription ID stored on `BillingSubscription` |
| Cancellation | API → provider → webhook updates status |
| Secrets | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in env only |

**Blocker if unset:** Checkout returns documented error; membership can still be granted manually (seed/admin) for dev.

---

## API additions (planned)

| Route | Purpose |
|-------|---------|
| `GET/PATCH /api/creator/profile` | Creator profile CRUD (owner) |
| `GET /api/creator/[username]` | Public creator card + stats |
| `GET/POST /api/memberships/plans` | List/create plans (creator) |
| `GET/POST /api/memberships` | User memberships |
| `GET/POST /api/subscriptions` | Subscription list/create |
| `POST /api/subscriptions/[id]/cancel` | Cancel |
| `POST /api/payments/checkout` | Start checkout |
| `POST /api/payments/webhooks/stripe` | Webhook handler |
| `GET /api/creator/dashboard` | Creator economy dashboard data |
| `GET /api/creator/analytics` | Lightweight economy analytics |

---

## Authorization rules

1. Premium body: deny without entitlement (404 or paywall shell).
2. Plan management: creator owner or publication ADMIN+ only.
3. Revenue/payout: creator owner only.
4. Webhooks: signature verification required.
5. IDOR: scope checks on `publicationId` / `repositoryId` / `creatorId`.

---

## Mobile (APK)

- Extend `apk/www/data.js` with creator profiles, access badges, membership/subscription UI.
- No fake payment success; show "Payment provider not configured" when applicable.
- Native hash routing: `#/creator`, `#/membership`, premium doc gating in `app.js`.

---

## Out of scope (Phase 6)

AI, knowledge graph, real-time collab, enterprise billing, marketplace, ads, crypto, affiliate.

---

## Implementation order

1. Schema + migration  
2. `entitlements.ts` + update `assertDocumentAccessible`  
3. Creator profile + membership + subscription services  
4. Payment abstraction (+ Stripe stub)  
5. Dashboard + analytics  
6. Revenue foundation  
7. UI + mobile APK  
8. Tests + security/verification docs
