# EVERYA Database

**ORM:** Prisma 6  
**Dev provider:** SQLite (`file:./db/everya.db`)  
**Production target:** PostgreSQL 15+

## Phase 1 models

User, Session, Account, Verification, Repository, Folder, Document, UserFollow, Tag, DocumentTag, Comment, Rating, DocumentLike, CommentLike, Bookmark, Notification, DocumentView

## Indexes (Phase 1)

| Model | Index |
|-------|-------|
| Document | `readerCount`, `updatedAt` |
| DocumentView | `createdAt`, `(documentId, createdAt)` |

## Migrations

- Baseline: `prisma/migrations/20250921120000_phase1_baseline/`
- Local dev: `scripts/ensure-db.js` runs `prisma db push`
- Production: `npx prisma migrate deploy`

## PostgreSQL migration path

1. Provision PostgreSQL database.
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL=postgresql://user:pass@host:5432/everya`
4. Run `npx prisma migrate deploy`
5. Export SQLite data (if needed) and import via seed scripts or ETL.
6. Point application `DATABASE_URL` at PostgreSQL; restart.

## Backup

- SQLite: copy `db/everya.db`
- Uploads: copy `storage/uploads/`

## Safety rules

- Never `db push --force-reset` on production.
- Always test migrations on a staging copy first.
- Prefer additive migrations; avoid destructive column drops without backfill.
