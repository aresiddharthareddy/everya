"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/docs/markdown-editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Opening editor…</div>;
  if (missing) return <div className="p-8 text-sm text-muted-foreground">Story not found, or you are not the author.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
          placeholder="Document title"
        />
        <div className="flex gap-2">
          <span className="text-xs text-muted-foreground self-center">
            {error ? error : saving ? "Saving…" : "Saved automatically"}
          </span>
          <Button
            size="sm"
            onClick={() => {
              save();
              router.push(`/r/${username}/${repo}/${doc}`);
            }}
          >
            Done
          </Button>
        </div>
      </div>
      <MarkdownEditor value={content} onChange={setContent} onSave={save} />
    </div>
  );
}
