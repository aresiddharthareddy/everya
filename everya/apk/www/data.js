const DATA = {
  version: "8.0.0",
  paymentConfigured: false,
  creators: [
    { username: "alex", tagline: "Building EveryA — knowledge for engineering teams.", members: 1, plans: 2 },
  ],
  membershipPlans: [
    { id: "plan-member", creator: "alex", trace: "platform-docs", name: "Platform Insider", tier: "MEMBER", priceCents: 500 },
    { id: "plan-premium", creator: "alex", trace: "platform-docs", name: "Platform Premium", tier: "PREMIUM", priceCents: 1500 },
  ],
  users: [
    { username: "alex", name: "Alex Chen", bio: "Platform engineer. Building reliable systems.", followers: 1280, following: 42, isCreator: true },
    { username: "infraops", name: "Infra Ops", bio: "SRE · Kubernetes · Observability", followers: 890, following: 31 },
    { username: "kernel", name: "Kernel Team", bio: "Low-level systems research.", followers: 412, following: 18 },
  ],
  traces: [
    {
      username: "alex", slug: "platform-docs", name: "Platform Docs",
      description: "Core platform documentation and guides",
      followers: 2400,
      contributors: [
        { username: "alex", name: "Alex Chen", role: "Owner" },
        { username: "infraops", name: "Infra Ops", role: "EDITOR" },
      ],
      docs: [
        { slug: "getting-started", title: "Getting Started", folder: "Guides", minutes: 4, readers: 18200,
          excerpt: "Learn how to use EVERYA for your team",
          author: "alex", lastEditor: "infraops",
          next: "api-design",
          links: [
            { type: "REFERENCES", target: "api-design", label: "API Design Guidelines" },
            { type: "RELATED", target: "api-design", label: "API Design Guidelines" },
          ],
          content: `# Getting Started with EVERYA\n\nEVERYA is a **technical knowledge platform** for engineering teams.\n\n## Quick start\n\n\`\`\`bash\nnpm install && npm run dev\n\`\`\`\n\n## Core concepts\n\n- **Trace** — structured knowledge collection\n- **Document** — Markdown pages with metrics\n- **Folder** — nested organization\n\n> Ship documentation that engineers actually read.` },
        { slug: "api-design", title: "API Design Guidelines", folder: "Guides / API", minutes: 8, readers: 9400,
          accessLevel: "PREMIUM",
          excerpt: "Standards for building consistent APIs",
          author: "alex", lastEditor: "alex",
          prev: "getting-started",
          related: ["getting-started"],
          links: [
            { type: "DEPENDS_ON", target: "getting-started", label: "Getting Started" },
            { type: "REFERENCES", target: "getting-started", label: "Getting Started", inbound: true },
          ],
          content: `# API Design Guidelines\n\n## Principles\n\n- **Consistency** over cleverness\n- **Explicit** error responses\n- **Versioned** endpoints\n\nAll write endpoints require a valid session.` },
      ],
      draftDocs: [
        { slug: "deploy-guide", title: "Deploy Guide (draft)", minutes: 6,
          excerpt: "Staging and production rollout checklist",
          content: `# Deploy Guide\n\n_Work in progress — draft only visible to editors._\n\n1. Run migrations\n2. Smoke test\n3. Roll out canary` },
      ],
    },
    {
      username: "infraops", slug: "sre-runbooks", name: "SRE Runbooks",
      description: "Operational runbooks and incident response",
      followers: 1100,
      contributors: [{ username: "infraops", name: "Infra Ops", role: "Owner" }],
      docs: [
        { slug: "k8s-incident-runbook", title: "Kubernetes Incident Runbook", folder: "Incidents", minutes: 12, readers: 5600,
          excerpt: "Step-by-step incident response for K8s",
          author: "infraops", lastEditor: "infraops",
          next: "observability",
          content: `# Kubernetes Incident Runbook\n\n## Pod crash looping\n\n1. Check events\n2. Inspect previous logs\n3. Verify resource limits\n\n## Escalation\n\nContact **@infraops** for P1 incidents.` },
        { slug: "observability", title: "Observability Stack", folder: "Root", minutes: 10, readers: 7200,
          excerpt: "Metrics, logs, and traces for production",
          author: "infraops", lastEditor: "kernel",
          prev: "k8s-incident-runbook",
          content: `# Observability Stack\n\n## The three pillars\n\nMetrics, logs, and traces.\n\n## SLOs\n\n- Availability 99.9%\n- Latency p99 < 200ms` },
      ],
      draftDocs: [],
    },
    {
      username: "kernel", slug: "systems-research", name: "Systems Research",
      description: "Internal research notes",
      followers: 320,
      contributors: [{ username: "kernel", name: "Kernel Team", role: "Owner" }],
      docs: [
        { slug: "allocator-internals", title: "Memory Allocator Internals", folder: "Root", minutes: 15, readers: 890,
          excerpt: "Slab allocation and fragmentation",
          author: "kernel", lastEditor: "kernel",
          content: `# Memory Allocator Internals\n\nResearch notes on slab allocation and TLB pressure.` },
      ],
      draftDocs: [],
    },
  ],
  publications: [
    {
      handle: "everya-engineering", name: "EveryA Engineering",
      description: "Publication-first stories from the platform team.",
      owner: "alex", followers: 890,
      articles: [
        { slug: "getting-started", title: "Getting Started", author: "alex", minutes: 4,
          excerpt: "Why we built EVERYA for long-form technical writing",
          content: `# Why EVERYA\n\nA publishing home for stories worth keeping — with traces for structured knowledge alongside.` },
      ],
    },
  ],
  notifications: [
    { id: "n1", type: "COMMENT", title: "New reply", message: "@kernel replied to your comment", actor: "kernel", href: "#/u/alex/trace/platform-docs/getting-started~discussion", read: false },
    { id: "n2", type: "LIKE", title: "Document liked", message: "@alex liked your runbook", actor: "alex", href: "#/u/infraops/trace/sre-runbooks/k8s-incident-runbook", read: false },
    { id: "n3", type: "TRACE", title: "Trace followed", message: "@kernel followed Platform Docs", actor: "kernel", href: "#/u/alex/trace/platform-docs", read: true },
  ],
  exploreTags: ["kubernetes", "api-design", "observability", "platform", "sre", "research"],
  traceLinks: [
    { from: "alex/platform-docs", to: "infraops/sre-runbooks", label: "SRE Runbooks" },
  ],
};

DATA.feed = DATA.traces.flatMap((t) =>
  t.docs.map((d) => ({
    id: `${t.username}/${t.slug}/${d.slug}`,
    type: "document",
    title: d.title,
    excerpt: d.excerpt,
    author: t.username,
    trace: t.name,
    traceSlug: t.slug,
    docSlug: d.slug,
    minutes: d.minutes,
    readers: d.readers,
  }))
);
