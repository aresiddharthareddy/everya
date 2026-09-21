"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { MarkdownEditor } from "@/components/docs/markdown-editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/everya/error-state";

type InitialArticle = {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  slug: string;
  status: string;
};

export function WriteArticleClient({
  handle,
  initial,
}: {
  handle: string;
  initial?: InitialArticle | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [docId, setDocId] = useState(initial?.id ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const ensureDraft = useCallback(async () => {
    if (docId || creating) return docId;
    setCreating(true);
    setError("");
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || "Untitled",
        subtitle: subtitle.trim() || undefined,
        content,
        publicationHandle: handle,
      }),
    });
    setCreating(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not create draft");
      return "";
    }
    const article = await res.json();
    setDocId(article.id);
    setSlug(article.slug);
    setStatus(article.status);
    if (!title.trim()) setTitle(article.title);
    return article.id as string;
  }, [docId, creating, title, subtitle, content, handle]);

  const save = useCallback(
    async (newContent?: string) => {
      const id = docId || (await ensureDraft());
      if (!id) return;
      setSaving(true);
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled",
          content: newContent ?? content,
          subtitle: subtitle.trim() || null,
        }),
      });
      if (!res.ok) setError("Could not save. Try again.");
      else setError("");
      setSaving(false);
    },
    [docId, ensureDraft, title, content, subtitle]
  );

  useEffect(() => {
    if (!docId && !title && !content && !subtitle) return;
    const t = setTimeout(() => save(), 3000);
    return () => clearTimeout(t);
  }, [content, title, subtitle, docId, save]);

  const publish = async () => {
    const id = docId || (await ensureDraft());
    if (!id) return;
    setPublishing(true);
    await save();
    const res = await fetch(`/api/articles/${id}/publish`, { method: "POST" });
    setPublishing(false);
    if (!res.ok) {
      setError("Could not publish");
      return;
    }
    const article = await res.json();
    setStatus(article.status);
    setSlug(article.slug);
    router.push(`/p/${handle}/${article.slug}`);
  };

  if (initial === null) {
    return (
      <ErrorState
        title="Article not found"
        message="This draft does not exist or you do not have permission to edit it."
      />
    );
  }

  const previewHref = slug ? `/p/${handle}/${slug}` : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href={`/p/${handle}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {handle}
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {error ? error : saving || creating ? "Saving…" : status === "PUBLISHED" ? "Published" : "Saved automatically"}
          </span>
          {previewHref && (
            <Link href={previewHref} target="_blank">
              <Button variant="outline" size="sm" className="rounded-full">
                <ExternalLink className="h-3.5 w-3.5" /> Preview
              </Button>
            </Link>
          )}
          <Button size="sm" className="rounded-full" onClick={publish} disabled={publishing || creating}>
            {publishing ? "Publishing…" : status === "PUBLISHED" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-serif border-0 px-0 focus-visible:ring-0"
        placeholder="Title"
      />
      <Input
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        className="text-lg text-muted-foreground border-0 px-0 focus-visible:ring-0"
        placeholder="Subtitle (optional)"
      />
      <MarkdownEditor value={content} onChange={setContent} onSave={save} />
    </div>
  );
}
