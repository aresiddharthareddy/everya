"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SavePayload = { title: string; content: string; subtitle?: string };

export function useDocumentEditor({
  initialTitle,
  initialContent,
  initialSubtitle = "",
  initialStatus = "DRAFT",
  documentId,
  autosaveMs = 3000,
  onSave,
}: {
  initialTitle: string;
  initialContent: string;
  initialSubtitle?: string;
  initialStatus?: string;
  documentId: string;
  autosaveMs?: number;
  onSave: (payload: SavePayload) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const baseline = useRef({ title: initialTitle, content: initialContent, subtitle: initialSubtitle });
  const dirty =
    title !== baseline.current.title ||
    content !== baseline.current.content ||
    subtitle !== baseline.current.subtitle;

  const save = useCallback(
    async (override?: Partial<SavePayload>) => {
      if (!documentId) return false;
      const payload = {
        title: (override?.title ?? title).trim() || "Untitled",
        content: override?.content ?? content,
        subtitle: override?.subtitle ?? subtitle,
      };
      if (!payload.title.trim()) {
        setError("Title is required");
        return false;
      }
      setSaving(true);
      const ok = await onSave(payload);
      setSaving(false);
      if (ok) {
        baseline.current = { title: payload.title, content: payload.content, subtitle: payload.subtitle ?? "" };
        setLastSaved(new Date());
        setError("");
      } else {
        setError("Could not save. Try again.");
      }
      return ok;
    },
    [documentId, title, content, subtitle, onSave]
  );

  useEffect(() => {
    if (!documentId || !dirty) return;
    const t = setTimeout(() => save(), autosaveMs);
    return () => clearTimeout(t);
  }, [title, content, subtitle, documentId, dirty, autosaveMs, save]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const syncFromServer = useCallback(
    (data: { title: string; content: string; subtitle?: string; status?: string }) => {
      setTitle(data.title);
      setContent(data.content);
      if (data.subtitle !== undefined) setSubtitle(data.subtitle);
      if (data.status !== undefined) setStatus(data.status);
      baseline.current = {
        title: data.title,
        content: data.content,
        subtitle: data.subtitle ?? baseline.current.subtitle,
      };
      setLastSaved(new Date());
      setError("");
    },
    []
  );

  const statusLabel = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : status === "PUBLISHED"
        ? "Published"
        : lastSaved
          ? `Saved ${lastSaved.toLocaleTimeString()}`
          : "Draft";

  return {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    content,
    setContent,
    status,
    setStatus,
    saving,
    error,
    setError,
    lastSaved,
    dirty,
    save,
    syncFromServer,
    statusLabel,
  };
}
