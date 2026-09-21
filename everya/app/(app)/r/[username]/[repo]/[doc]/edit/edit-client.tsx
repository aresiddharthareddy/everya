"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/docs/markdown-editor";
import { Input } from "@/components/ui/input";
import { EditorChrome } from "@/components/editor/editor-chrome";
import { ErrorState } from "@/components/everya/error-state";
import { LoadingState } from "@/components/everya/loading-state";

export function EditDocumentClient() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [docId, setDocId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);

  const username = params.username as string;
  const repo = params.repo as string;
  const doc = params.doc as string;

  useEffect(() => {
    fetch(`/api/documents/by-slug?username=${username}&repo=${repo}&doc=${doc}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.document) {
          setTitle(data.document.title);
          setContent(data.document.content);
          setDocId(data.document.id);
        } else {
          setMissing(true);
        }
        setLoading(false);
      });
  }, [username, repo, doc]);

  const save = useCallback(
    async (newContent?: string) => {
      if (!docId) return;
      setSaving(true);
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: newContent ?? content }),
      });
      if (!res.ok) setError("Could not save. Try again.");
      else setError("");
      setSaving(false);
    },
    [docId, title, content]
  );

  useEffect(() => {
    if (!docId) return;
    const t = setTimeout(() => save(), 3000);
    return () => clearTimeout(t);
  }, [content, title, docId, save]);

  if (loading) return <LoadingState variant="spinner" />;
  if (missing) {
    return (
      <ErrorState
        title="Document not found"
        message="This document does not exist or you do not have permission to edit it."
      />
    );
  }

  const done = () => {
    save();
    router.push(`/r/${username}/${repo}/${doc}`);
  };

  return (
    <EditorChrome
      backHref={`/r/${username}/${repo}/${doc}`}
      backLabel="Back to document"
      statusLabel={saving ? "Saving…" : "Saved automatically"}
      error={error || undefined}
      previewHref={`/r/${username}/${repo}/${doc}`}
      primaryAction={done}
      primaryLabel="Done"
      primaryLoading={saving}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="typo-section-title border-0 px-0 focus-visible:ring-0"
        placeholder="Document title"
        aria-label="Document title"
      />
      <div className="mt-6">
        <MarkdownEditor value={content} onChange={setContent} onSave={save} />
      </div>
    </EditorChrome>
  );
}
