# EVERYA Phase 6 — Security & Architecture Audit

**Date:** 2026-09-22  
**Scope:** Creator economy foundation (6.1–6.11)

## Authentication

- All write APIs require Better Auth session (`auth.api.getSession`).
- Checkout, membership list, subscriptions, creator dashboard/analytics: authenticated only.
- Public creator profile (`GET /api/creator/[username]`) exposes only public profile fields.

## Authorization

| Resource | Control |
|----------|---------|
| Premium document body | `checkContentEntitlement` + `assertDocumentAccessible` |
| Plan creation | Creator must own publication/repository |
| Revenue/payout | Creator owner only via session userId |
| Subscription cancel | Owner userId match |

**Follow ≠ Membership:** Social follows do not grant content access.

## Premium content protection

- `Document.accessLevel` enforced server-side on trace pages and `assertDocumentAccessible`.
- Denied users receive empty `content` + paywall UI; views not recorded for blocked reads.
- APIs using `assertDocumentAccessible` strip body when paywalled.

## Membership & subscription security

- `CreatorMembership` separate from `PublicationMember` / `*Follow`.
- Status + `endsAt` checked at entitlement time.
- Subscription activation only via server webhook handler (not client callback).

## Payment integration

| Item | Status |
|------|--------|
| Provider abstraction | `lib/payments/` |
| Stripe implementation | Stub — requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Card data storage | **None** |
| Client-trusted payment | **Rejected** — checkout returns 503 when not configured |

## Webhook validation

- `verifyWebhook` requires signature + secret before processing.
- `providerEventId` unique on `PaymentTransaction` prevents replay/duplicate revenue.

## IDOR mitigations

- Plan scope validated against owner on create.
- Subscription cancel scoped to `userId`.
- Document access uses documentId + entitlement, not slug alone on APIs.

## Secrets

- Stripe keys documented in `.env.example` only; not in source.
- Webhook route rejects missing signature.

## Financial data

- Revenue visible on creator dashboard for session owner only.
- Payout transfers not implemented (balance tracking only).

## Data integrity

- Revenue recorded in transaction with platform fee calculation.
- Membership upsert on subscription activation keeps access in sync.

## Performance

- Entitlement checks batch membership query per request (no N+1 on page).
- Analytics uses aggregate/count queries, not full table scans.

## UX / accessibility

- Paywall provides sign-in + membership links.
- Access badges on premium documents.
- Mobile APK: native hash routes for creator/memberships; demo membership without fake payment.

## Residual risks / Phase 7

1. Stripe SDK + signature verification not fully wired (blocker documented).
2. SQLite production limits for concurrent payment webhooks.
3. Manual membership grant in seed/dev — production needs admin tooling or provider only.
4. Publication-article pages should receive same entitlement pass (trace path covered).

## Verdict

Phase 6 foundation is **safe for development/demo**. Production payments require Stripe credentials + full SDK webhook verification before go-live.
