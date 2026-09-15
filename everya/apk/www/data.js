const STORIES = [
  {
    id: "getting-started",
    title: "Getting Started",
    author: "@alex",
    collection: "Platform Docs",
    minutes: 4,
    excerpt: "Learn how to use EVERYA for teams who need structured, high-density documentation.",
    content: `# Getting Started with EVERYA

EVERYA is a **technical knowledge platform** designed for engineering teams who need structured, high-density documentation.

## Quick start

npm install && npm run dev

## Core concepts

Repository — a collection of docs, like a project wiki.
Document — Markdown pages with metrics and comments.
Folder — nested organization within a repo.

> Ship documentation that engineers actually read.`
  },
  {
    id: "api-design",
    title: "API Design Guidelines",
    author: "@alex",
    collection: "Platform Docs",
    minutes: 8,
    excerpt: "Consistency over cleverness. Explicit errors. Versioned endpoints.",
    content: `# API Design Guidelines

## Principles

- **Consistency** over cleverness
- **Explicit** error responses
- **Versioned** endpoints

All write endpoints require a valid session.`
  },
  {
    id: "k8s",
    title: "Kubernetes Incident Runbook",
    author: "@infraops",
    collection: "SRE Runbooks",
    minutes: 12,
    excerpt: "Crash loops, NotReady nodes, and how to escalate a P1.",
    content: `# Kubernetes Incident Runbook

## Pod crash looping

1. Check events
2. Inspect previous logs
3. Verify resource limits

## Escalation

Contact **@infraops** for P1 incidents.`
  },
  {
    id: "observability",
    title: "Observability Stack",
    author: "@infraops",
    collection: "SRE Runbooks",
    minutes: 10,
    excerpt: "Metrics, logs, traces, and the SLOs that keep production honest.",
    content: `# Observability Stack

## The three pillars

Metrics, logs, and traces.

## SLOs

Availability 99.9%. Latency p99 under 200ms. Error rate under 0.1%.`
  }
];
