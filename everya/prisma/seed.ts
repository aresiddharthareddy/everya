import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { ensureTags } from "../lib/seed-tags";

const prisma = new PrismaClient();

const USERS = [
  { username: "alex", email: "alex@everya.dev", name: "Alex Chen", bio: "Platform engineer. Building reliable systems.", password: "demo12345" },
  { username: "infraops", email: "ops@everya.dev", name: "Infra Ops", bio: "SRE · Kubernetes · Observability", password: "demo12345" },
  { username: "kernel", email: "kernel@everya.dev", name: "Kernel Team", bio: "Low-level systems research.", password: "demo12345" },
];

const DOCS = {
  gettingStarted: `# Getting Started with EVERYA

EVERYA is a **technical knowledge platform** designed for engineering teams who need structured, high-density documentation.

## Quick start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Core concepts

| Concept | Description |
|---------|-------------|
| Repository | A collection of docs, like a project wiki |
| Document | Markdown pages with metrics and comments |
| Folder | Nested organization within a repo |

## Why teams choose EVERYA

1. **Fast** — optimized for reading and writing
2. **Structured** — nested folders, breadcrumbs, TOC
3. **Measurable** — readers, ratings, reading time

> Ship documentation that engineers actually read.
`,

  apiDesign: `# API Design Guidelines

## Principles

- **Consistency** over cleverness
- **Explicit** error responses
- **Versioned** endpoints

\`\`\`typescript
interface ApiResponse<T> {
  data: T;
  meta: { requestId: string; timestamp: string };
  error?: { code: string; message: string };
}
\`\`\`

## Authentication

All write endpoints require a valid session. Use \`Authorization: Bearer <token>\` for programmatic access.

## Rate limiting

| Tier | Requests/min |
|------|-------------|
| Free | 60 |
| Pro | 600 |
| Enterprise | Custom |
`,

  k8sRunbook: `# Kubernetes Incident Runbook

## Pod crash looping

1. Check events: \`kubectl describe pod <name>\`
2. Inspect logs: \`kubectl logs <name> --previous\`
3. Verify resource limits

\`\`\`yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
\`\`\`

## Node NotReady

- Drain affected nodes
- Check kubelet logs
- Verify CNI plugin health

## Escalation

Contact **@infraops** for P1 incidents affecting production clusters.
`,

  observability: `# Observability Stack

## The three pillars

### Metrics
Prometheus + Grafana for time-series data.

### Logs
Structured JSON logs shipped to your aggregator.

### Traces
OpenTelemetry instrumentation across services.

\`\`\`go
span := tracer.Start(ctx, "processRequest")
defer span.End()
\`\`\`

## SLIs / SLOs

- **Availability**: 99.9% monthly
- **Latency p99**: < 200ms
- **Error rate**: < 0.1%
`,
};

async function main() {
  console.log("🌱 Seeding EVERYA database...");

  await prisma.commentLike.deleteMany();
  await prisma.documentLike.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.documentView.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  const users = [];
  for (const u of USERS) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        username: u.username,
        bio: u.bio,
        emailVerified: true,
        image: null,
      },
    });
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: await hashPassword(u.password),
      },
    });
    users.push(user);
  }

  const [alex, infraops, kernel] = users;

  const platformRepo = await prisma.repository.create({
    data: {
      name: "Platform Docs",
      slug: "platform-docs",
      description: "Core platform documentation and guides",
      visibility: "PUBLIC",
      ownerId: alex.id,
    },
  });

  const runbooksRepo = await prisma.repository.create({
    data: {
      name: "SRE Runbooks",
      slug: "sre-runbooks",
      description: "Operational runbooks and incident response",
      visibility: "PUBLIC",
      ownerId: infraops.id,
    },
  });

  const researchRepo = await prisma.repository.create({
    data: {
      name: "Systems Research",
      slug: "systems-research",
      description: "Internal research — enterprise visibility",
      visibility: "ENTERPRISE",
      ownerId: kernel.id,
    },
  });

  const privateRepo = await prisma.repository.create({
    data: {
      name: "Team Internal",
      slug: "team-internal",
      description: "Private team documentation",
      visibility: "PRIVATE",
      ownerId: alex.id,
    },
  });

  const guidesFolder = await prisma.folder.create({
    data: { name: "Guides", slug: "guides", repositoryId: platformRepo.id, sortOrder: 0 },
  });

  const apiFolder = await prisma.folder.create({
    data: { name: "API", slug: "api", repositoryId: platformRepo.id, parentId: guidesFolder.id, sortOrder: 1 },
  });

  const incidentsFolder = await prisma.folder.create({
    data: { name: "Incidents", slug: "incidents", repositoryId: runbooksRepo.id, sortOrder: 0 },
  });

  const docs = await Promise.all([
    prisma.document.create({
      data: {
        title: "Getting Started",
        slug: "getting-started",
        content: DOCS.gettingStarted,
        excerpt: "Learn how to use EVERYA for your team",
        readingMinutes: 4,
        readerCount: 18200,
        readingMinutesTotal: 241000,
        repositoryId: platformRepo.id,
        folderId: guidesFolder.id,
        authorId: alex.id,
      },
    }),
    prisma.document.create({
      data: {
        title: "API Design Guidelines",
        slug: "api-design",
        content: DOCS.apiDesign,
        excerpt: "Standards for building consistent APIs",
        readingMinutes: 8,
        readerCount: 9400,
        readingMinutesTotal: 112000,
        repositoryId: platformRepo.id,
        folderId: apiFolder.id,
        authorId: alex.id,
      },
    }),
    prisma.document.create({
      data: {
        title: "Kubernetes Incident Runbook",
        slug: "k8s-incident-runbook",
        content: DOCS.k8sRunbook,
        excerpt: "Step-by-step incident response for K8s",
        readingMinutes: 12,
        readerCount: 5600,
        readingMinutesTotal: 78000,
        repositoryId: runbooksRepo.id,
        folderId: incidentsFolder.id,
        authorId: infraops.id,
      },
    }),
    prisma.document.create({
      data: {
        title: "Observability Stack",
        slug: "observability",
        content: DOCS.observability,
        excerpt: "Metrics, logs, and traces for production systems",
        readingMinutes: 10,
        readerCount: 7200,
        readingMinutesTotal: 95000,
        repositoryId: runbooksRepo.id,
        authorId: infraops.id,
      },
    }),
    prisma.document.create({
      data: {
        title: "Memory Allocator Internals",
        slug: "allocator-internals",
        content: "# Memory Allocator Internals\n\nResearch notes on slab allocation and fragmentation behavior.\n\n## Findings\n\n- TLB pressure increases with large allocations\n- Per-CPU caches reduce contention\n",
        readingMinutes: 15,
        readerCount: 890,
        readingMinutesTotal: 12000,
        repositoryId: researchRepo.id,
        authorId: kernel.id,
      },
    }),
  ]);

  const [gettingStarted, apiDesign, k8sRunbook, observability] = docs;

  for (const doc of docs) {
    for (let i = 0; i < users.length; i++) {
      await prisma.rating.create({
        data: { value: 4 + (i % 2), documentId: doc.id, userId: users[i].id },
      });
    }
    for (const u of users) {
      await prisma.documentLike.create({ data: { documentId: doc.id, userId: u.id } });
    }
  }

  const c1 = await prisma.comment.create({
    data: {
      content: "Clear and concise. The quick start section saved us hours.",
      documentId: gettingStarted.id,
      authorId: infraops.id,
      likeCount: 12,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Agreed — we migrated our internal wiki last week using this guide.",
      documentId: gettingStarted.id,
      authorId: kernel.id,
      parentId: c1.id,
      likeCount: 4,
    },
  });

  await prisma.comment.create({
    data: {
      content: "The rate limiting table should reference our enterprise contract limits.",
      documentId: apiDesign.id,
      authorId: infraops.id,
      likeCount: 6,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Used this during last night's incident. The escalation path was spot on.",
      documentId: k8sRunbook.id,
      authorId: alex.id,
      likeCount: 18,
    },
  });

  await prisma.bookmark.create({ data: { documentId: gettingStarted.id, userId: alex.id } });
  await prisma.bookmark.create({ data: { documentId: k8sRunbook.id, userId: alex.id } });

  await prisma.notification.createMany({
    data: [
      { type: "COMMENT", title: "New reply", message: "@kernel replied to your comment", userId: infraops.id, actorId: kernel.id, link: `/r/alex/platform-docs/getting-started` },
      { type: "LIKE", title: "Document liked", message: "@alex liked your runbook", userId: infraops.id, actorId: alex.id, link: `/r/infraops/sre-runbooks/k8s-incident-runbook` },
      { type: "RATING", title: "New rating", message: "Your API guide received a 5★ rating", userId: alex.id, actorId: kernel.id, link: `/r/alex/platform-docs/api-design` },
    ],
  });

  await ensureTags(prisma);

  const everyaPub = await prisma.publication.create({
    data: {
      name: "EveryA Engineering",
      handle: "everya-engineering",
      description: "Publication-first stories from the EveryA platform team.",
      ownerId: alex.id,
      repositoryId: platformRepo.id,
      visibility: "PUBLIC",
    },
  });
  await prisma.publicationMember.create({
    data: { publicationId: everyaPub.id, userId: alex.id, role: "OWNER" },
  });
  await prisma.publicationMember.create({
    data: { publicationId: everyaPub.id, userId: infraops.id, role: "WRITER" },
  });
  await prisma.document.updateMany({
    where: { id: { in: [gettingStarted.id] } },
    data: { publicationId: everyaPub.id, status: "PUBLISHED", publishedAt: new Date() },
  });
  await prisma.publicationFollow.create({
    data: { publicationId: everyaPub.id, userId: kernel.id },
  });

  for (const [followerId, followingId] of [
    [infraops.id, alex.id],
    [kernel.id, alex.id],
    [alex.id, infraops.id],
  ] as const) {
    await prisma.userFollow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  console.log("✅ Seed complete!");
  console.log("   Demo accounts (password: demo12345):");
  console.log("   @alex, @infraops, @kernel");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
