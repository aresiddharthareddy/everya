"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Surface } from "@/components/ui/surface";
import { FormField } from "@/components/ui/form-field";
import { TabsNav } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/everya/empty-state";
import { LoadingState } from "@/components/everya/loading-state";
import { ErrorState } from "@/components/everya/error-state";
import { AuthorIdentity } from "@/components/content/author-identity";
import { PublicationIdentity } from "@/components/content/publication-identity";
import { ContentMeta } from "@/components/content/content-meta";
import { ContentTypeBadge } from "@/components/content/content-type-badge";
import { EngagementStats } from "@/components/content/engagement-stats";
import { ContentCard } from "@/components/feed/content-card";
import { PageHeader } from "@/components/navigation/page-header";
import { DocumentContext } from "@/components/content/document-context";
import { KnowledgeNav } from "@/components/navigation/knowledge-nav";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import { EditorChrome } from "@/components/editor/editor-chrome";
import { FollowButton } from "@/components/social/follow-button";
import { ShareButton } from "@/components/social/share-button";

export function DesignSystemShowcase() {
  const [tab, setTab] = useState("tokens");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="page-container py-page space-y-12">
      <PageHeader
        eyebrow="Internal reference"
        title="EveryA Design System"
        description="Phase 3 foundation — tokens, primitives, and content components."
      />

      <TabsNav
        activeId={tab}
        onSelect={setTab}
        items={[
          { id: "tokens", label: "Tokens" },
          { id: "components", label: "Components" },
          { id: "content", label: "Content" },
          { id: "reader", label: "Reader" },
          { id: "editor", label: "Editor" },
          { id: "social", label: "Social" },
          { id: "trace", label: "Trace-ready" },
          { id: "states", label: "States" },
        ]}
      />

      {tab === "tokens" && (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="typo-section-title">Typography</h2>
            <div className="space-y-3">
              <p className="typo-display">Display — editorial calm</p>
              <p className="typo-page-title">Page title</p>
              <p className="typo-section-title">Section title</p>
              <p className="typo-article-title">Article title for long-form reading</p>
              <p className="typo-article-subtitle">Subtitle and supporting context for articles.</p>
              <p className="typo-body">Body text for UI surfaces and descriptions.</p>
              <p className="typo-meta">Metadata · 8 min read · Mar 21</p>
              <p className="typo-caption">Caption label</p>
              <code className="typo-code bg-muted px-2 py-1 rounded">const everya = true;</code>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="typo-section-title">Surfaces</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Surface variant="flat" padding="md">Flat surface</Surface>
              <Surface variant="bordered" padding="md">Bordered surface</Surface>
              <Surface variant="elevated" padding="md">Elevated surface</Surface>
              <Surface variant="featured" padding="md">Featured surface</Surface>
              <Surface variant="interactive" padding="md" className="cursor-default">Interactive surface</Surface>
              <Surface variant="inset" padding="md">Inset / empty surface</Surface>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="typo-section-title">Semantic colors</h2>
            <div className="flex flex-wrap gap-2">
              <Badge>Accent</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </section>
        </div>
      )}

      {tab === "components" && (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="typo-section-title">Buttons</h2>
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button loading>Loading</Button>
              <Button shape="pill">Pill (sparingly)</Button>
            </div>
          </section>

          <section className="space-y-4 max-w-md">
            <h2 className="typo-section-title">Forms</h2>
            <FormField id="demo-title" label="Title" description="A short, clear headline." required>
              <Input id="demo-title" placeholder="Enter a title" />
            </FormField>
            <FormField id="demo-body" label="Body" error="Content is required.">
              <Textarea id="demo-body" aria-invalid={true} placeholder="Write here…" />
            </FormField>
          </section>

          <section className="space-y-4">
            <h2 className="typo-section-title">Avatars</h2>
            <div className="flex items-center gap-3">
              <Avatar name="Alex Rivera" size="sm" />
              <Avatar name="Alex Rivera" size="md" />
              <Avatar name="Alex Rivera" size="lg" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="typo-section-title">Dialog</h2>
            <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Example dialog" description="Accessible modal primitive.">
              <p className="typo-body-sm text-muted-foreground">Dialog content uses surface-elevated styling.</p>
            </Dialog>
          </section>
        </div>
      )}

      {tab === "content" && (
        <div className="space-y-10 max-w-xl">
          <AuthorIdentity name="Alex Rivera" username="alex" meta="Engineering writer" href="/u/alex" />
          <PublicationIdentity name="EveryA Engineering" handle="everya-engineering" description="Technical publishing from the EveryA team." />
          <ContentMeta items={["8 min read", "Published Mar 21", "Systems"]} />
          <div className="flex flex-wrap gap-2">
            <ContentTypeBadge type="article" />
            <ContentTypeBadge type="publication" />
            <ContentTypeBadge type="collection" />
          </div>
          <EngagementStats
            stats={{ readingMinutes: 8, readerCount: 1200, likeCount: 84, commentCount: 12, avgRating: 4.6 }}
          />
          <div className="space-y-6 pt-4 border-t border-border">
            <h2 className="typo-section-title">Feed cards</h2>
            <ContentCard
              variant="featured"
              data={{
                href: "/p/everya-engineering/example",
                title: "Designing publication-first discovery",
                subtitle: "How EveryA surfaces editorial identity in the feed",
                excerpt: "A walkthrough of the content card system and publication-aware hierarchy.",
                contentType: "article",
                author: { username: "alex", name: "Alex Rivera" },
                publication: { name: "EveryA Engineering", handle: "everya-engineering" },
                readingMinutes: 8,
                readerCount: 1200,
                likeCount: 84,
                commentCount: 12,
                avgRating: 4.6,
                tags: [{ name: "Design", slug: "design" }],
              }}
            />
            <ContentCard
              data={{
                href: "/r/alex/docs/intro",
                title: "Introduction to structured collections",
                excerpt: "Documents in collections support technical knowledge alongside publication articles.",
                contentType: "document",
                author: { username: "alex", name: "Alex Rivera" },
                collection: { name: "Engineering Docs", slug: "docs", ownerUsername: "alex" },
                readingMinutes: 5,
                readerCount: 320,
                likeCount: 24,
                commentCount: 3,
              }}
            />
          </div>
          <div className="article-body read-container">
            <p>Article body preview — serif reading rhythm preserved from Phase 1/2.</p>
            <pre><code>npm run dev</code></pre>
            <div className="callout callout-note">Note callout for technical publishing.</div>
          </div>
        </div>
      )}

      {tab === "reader" && (
        <div className="space-y-10 max-w-3xl">
          <section className="space-y-4">
            <h2 className="typo-section-title">Reader toolbar</h2>
            <ReaderToolbar />
          </section>
          <section className="space-y-4">
            <h2 className="typo-section-title">Document context</h2>
            <DocumentContext
              contentType="article"
              publication={{ name: "EveryA Engineering", handle: "everya-engineering" }}
            />
            <DocumentContext
              contentType="document"
              collection={{ name: "Engineering Docs", slug: "docs", ownerUsername: "alex" }}
            />
          </section>
          <section className="article-body read-container">
            <p>Reader body rhythm with callouts for technical publishing.</p>
            <div className="callout callout-tip">Tip callout — use for helpful guidance.</div>
            <div className="callout callout-warning">Warning callout — use for cautions.</div>
          </section>
        </div>
      )}

      {tab === "editor" && (
        <div className="max-w-3xl">
          <EditorChrome
            backHref="/create"
            backLabel="Create"
            statusLabel="Saved automatically"
            primaryAction={() => {}}
            primaryLabel="Publish"
            previewHref="/p/demo/example"
          >
            <p className="typo-page-title">Editor chrome wraps title + markdown editor surfaces.</p>
            <p className="typo-body-sm text-muted-foreground mt-2">Autosave, status badge, preview, and primary action live in the chrome bar.</p>
          </EditorChrome>
        </div>
      )}

      {tab === "social" && (
        <div className="space-y-8 max-w-xl">
          <section className="space-y-3">
            <h2 className="typo-section-title">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <FollowButton username="alex" initialFollowing={false} signedIn={true} isSelf={false} />
              <FollowButton username="alex" initialFollowing={true} signedIn={true} isSelf={false} />
              <ShareButton />
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="typo-section-title">Engagement</h2>
            <EngagementStats stats={{ readingMinutes: 8, readerCount: 1200, likeCount: 84, commentCount: 12, avgRating: 4.6 }} />
          </section>
        </div>
      )}

      {tab === "trace" && (
        <div className="space-y-8 max-w-xl">
          <p className="typo-body-sm text-muted-foreground">
            Trace-ready UI foundations — hierarchical navigation without Phase 4 backend.
          </p>
          <KnowledgeNav
            items={[
              { label: "alex", href: "/u/alex" },
              { label: "Engineering Docs", href: "/r/alex/docs" },
              { label: "Architecture overview" },
            ]}
          />
          <DocumentContext
            contentType="document"
            collection={{ name: "Engineering Docs", slug: "docs", ownerUsername: "alex" }}
          />
        </div>
      )}

      {tab === "states" && (
        <div className="space-y-10 max-w-xl">
          <EmptyState
            title="No bookmarks yet"
            description="Save articles to build your personal library."
            actionLabel="Explore"
            actionHref="/explore"
          />
          <LoadingState variant="spinner" />
          <LoadingState variant="skeleton" />
          <ErrorState message="We could not load this content. Your draft is still saved." onRetry={() => {}} />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <SkeletonText lines={3} />
          </div>
        </div>
      )}
    </div>
  );
}
