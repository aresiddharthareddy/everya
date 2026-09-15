"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/docs/markdown-editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("# New Document\n\nStart writing...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        repoSlug: params.repo,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const doc = await res.json();
      router.push(`/r/${params.username}/${params.repo}/${doc.slug}/edit`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create the story");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-xl font-semibold"
        placeholder="Document title"
      />
      <MarkdownEditor value={content} onChange={setContent} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={loading || !title}>
        {loading ? "Creating..." : "Create document"}
      </Button>
    </div>
  );
}
