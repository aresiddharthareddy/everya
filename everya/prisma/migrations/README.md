# Prisma Migrations

Phase 1 introduces versioned migrations alongside `db push` for local development.

## Baseline

The current schema is captured in `20250921120000_phase1_baseline`. New environments should run:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Local development

`npm run dev` still runs `prisma db push` via `scripts/ensure-db.js` for frictionless setup.

## PostgreSQL (production target)

1. Set `DATABASE_URL` to a PostgreSQL connection string.
2. Change `provider` in `schema.prisma` to `postgresql`.
3. Run `npx prisma migrate deploy` against the production database.
4. Re-run seed or migrate data from SQLite export as needed.

See `EVERYA_DATABASE.md` at the repository root for full details.
