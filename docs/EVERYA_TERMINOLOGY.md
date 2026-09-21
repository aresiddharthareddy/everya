# EVERYA Terminology

Consistent product language for code, UI, and documentation.

| Term | Definition | Code model (Phase 1) |
|------|------------|----------------------|
| **Person / User** | Authenticated account | `User` |
| **Author** | Person who publishes content | `User` (authorId on Document) |
| **Publication** | First-class social org (target) | *Phase 2* — today: **Collection** via `Repository` |
| **Collection** | Group of content under one owner | `Repository` |
| **Article / Story** | Long-form readable content | `Document` (UI may say "story") |
| **Repository** | Structured knowledge tree with folders | `Repository` + `Folder` |
| **Document** | Markdown page in a repository | `Document` |
| **Response** | Top-level comment on content | `Comment` (parentId null) |
| **Reply** | Nested comment | `Comment` (parentId set) |
| **Clap** | Positive reaction (UI label) | `DocumentLike` (binary, one per user) |
| **Rating** | 1–5 star quality signal | `Rating` |
| **Topic / Tag** | Discovery label | `Tag` + `DocumentTag` |
| **Library** | Saved content for later | Bookmarks → `/reading-list` |
| **Follow** | Subscribe to an author's activity | `UserFollow` |

## UI naming rules

- Prefer **Publication** over "blog" or "channel" when referring to the future social entity.
- Prefer **Collection** for current `Repository` in user-facing copy until Publication ships (Phase 2).
- Prefer **Article** or **Story** for `Document` — pick one per screen; avoid mixing on the same page.
- Use **Clap** in reader stats; API/model remains `like`.

## Deprecated / avoid

| Avoid | Use instead |
|-------|-------------|
| Blog | Publication / Collection |
| Wiki (user-facing) | Repository / Knowledge base |
| Medium | *(never in product copy)* |
