"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/docs/markdown-editor";
import { Input } from "@/components/ui/input";
import { EditorChrome } from "@/components/editor/editor-chrome";

export function NewDocumentClient() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("# New Document\n\nStart writing...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const username = params.username as string;
  const repo = params.repo as string;

  const submit = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, repoSlug: repo }),
    });
    setLoading(false);
    if (res.ok) {
      const doc = await res.json();
      router.push(`/r/${username}/${repo}/${doc.slug}/edit`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create the document");
    }
  };

  return (
    <EditorChrome
      backHref={`/r/${username}/${repo}`}
      backLabel="Back to collection"
      statusLabel="New document"
      error={error || undefined}
      primaryAction={submit}
      primaryLabel={loading ? "Creating…" : "Create document"}
      primaryLoading={loading}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="typo-section-title"
        placeholder="Document title"
        aria-label="Document title"
        required
      />
      <div className="mt-6">
        <MarkdownEditor value={content} onChange={setContent} />
      </div>
    </EditorChrome>
  );
}
