"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/docs/markdown-editor";
import { Input } from "@/components/ui/input";
import { EditorChrome } from "@/components/editor/editor-chrome";
import { ErrorState } from "@/components/everya/error-state";
import { LoadingState } from "@/components/everya/loading-state";
import { useDocumentEditor } from "@/hooks/use-document-editor";
import { DocumentRevisionPanel } from "@/components/editor/document-revision-panel";

type Boot = { id: string; title: string; content: string; status: string };

function TraceDocumentEditorForm({
  boot,
  username,
  slug,
  doc,
}: {
  boot: Boot;
  username: string;
  slug: string;
  doc: string;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const tracePath = `/u/${username}/trace/${slug}`;
  const docPath = `${tracePath}/${doc}`;

  const onSave = useCallback(
    async (payload: { title: string; content: string }) => {
      const res = await fetch(`/api/documents/${boot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    },
    [boot.id]
  );

  const editor = useDocumentEditor({
    documentId: boot.id,
    initialTitle: boot.title,
    initialContent: boot.content,
    initialStatus: boot.status,
    onSave,
  });

  const discard = async () => {
    if (
      !window.confirm(
        "Delete this draft permanently? This cannot be undone."
      )
    ) {
      return;
    }
    setDiscarding(true);
    const res = await fetch(`/api/documents/${boot.id}`, { method: "DELETE" });
    setDiscarding(false);
    if (!res.ok) {
      editor.setError("Could not discard draft");
      return;
    }
    router.push(tracePath);
  };

  const finish = async () => {
    if (
      editor.status === "DRAFT" &&
      !window.confirm(
        "Publish this document? It will become visible to everyone who can view this trace."
      )
    ) {
      return;
    }
    setPublishing(true);
    const saved = await editor.save();
    if (!saved) {
      setPublishing(false);
      return;
    }
    if (editor.status === "DRAFT") {
      const res = await fetch(`/api/documents/${boot.id}/publish`, { method: "POST" });
      if (!res.ok) {
        editor.setError("Could not publish");
        setPublishing(false);
        return;
      }
      const updated = await res.json();
      editor.setStatus(updated.status);
    }
    setPublishing(false);
    router.push(docPath);
  };

  return (
    <EditorChrome
      backHref={docPath}
      backLabel="Back to document"
      statusLabel={editor.statusLabel}
      statusVariant={editor.status === "PUBLISHED" ? "success" : "secondary"}
      error={editor.error || undefined}
      dirty={editor.dirty}
      previewHref={editor.status === "PUBLISHED" ? docPath : null}
      primaryAction={finish}
      primaryLabel={
        publishing
          ? "Saving…"
          : editor.status === "PUBLISHED"
            ? "Save & view"
            : "Publish"
      }
      primaryLoading={publishing || editor.saving}
      secondaryAction={() => editor.save()}
      secondaryLabel="Save draft"
      discardAction={editor.status === "DRAFT" ? discard : undefined}
      discardLoading={discarding}
    >
      <Input
        value={editor.title}
        onChange={(e) => editor.setTitle(e.target.value)}
        className="typo-section-title border-0 px-0 focus-visible:ring-0"
        placeholder="Document title"
        aria-label="Document title"
        required
      />
      <div className="mt-6">
        <MarkdownEditor value={editor.content} onChange={editor.setContent} onSave={() => editor.save()} />
      </div>
      <DocumentRevisionPanel
        documentId={boot.id}
        onRestore={(doc) => editor.syncFromServer(doc)}
      />
    </EditorChrome>
  );
}

export function EditTraceDocumentClient() {
  const params = useParams();
  const [boot, setBoot] = useState<Boot | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const username = params.username as string;
  const slug = params.slug as string;
  const doc = params.doc as string;

  useEffect(() => {
    fetch(`/api/documents/by-slug?username=${username}&repo=${slug}&doc=${doc}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.document) {
          setBoot({
            id: data.document.id,
            title: data.document.title,
            content: data.document.content,
            status: data.document.status,
          });
        } else {
          setMissing(true);
        }
        setLoading(false);
      });
  }, [username, slug, doc]);

  if (loading) return <LoadingState variant="spinner" />;
  if (missing || !boot) {
    return (
      <ErrorState
        title="Document not found"
        message="This document does not exist or you do not have permission to edit it."
      />
    );
  }

  return <TraceDocumentEditorForm boot={boot} username={username} slug={slug} doc={doc} />;
}
