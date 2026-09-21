"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { validateImportFiles, type ImportPreviewNode } from "@/lib/trace-import";

export function ImportTraceClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [preview, setPreview] = useState<ImportPreviewNode[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    const next: { path: string; content: string }[] = [];
    for (const file of Array.from(list)) {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      if (!/\.(md|mdc|markdown)$/i.test(rel)) continue;
      next.push({ path: rel, content: await file.text() });
    }
    setFiles(next);
    const v = validateImportFiles(next);
    setPreview(v.tree);
    setErrors(v.errors);
    if (!name && next[0]) {
      const root = next[0].path.split("/")[0];
      if (root && !root.includes(".")) setName(root.replace(/[-_]/g, " "));
    }
  };

  const submit = async () => {
    setLoading(true);
    setErrors([]);
    const res = await fetch("/api/traces/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, files }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors([data.error || "Import failed"]);
      return;
    }
    router.push(data.href || data.data?.href);
  };

  return (
    <div className="space-y-6">
      <FormField id="trace-name" label="Trace name" required>
        <Input id="trace-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kubernetes Networking" />
      </FormField>
      <FormField id="trace-desc" label="Description">
        <Textarea id="trace-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </FormField>

      <div className="surface-bordered p-6 text-center">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="typo-body-sm text-muted-foreground mb-4">Drop a Markdown folder or select files (.md, .mdc)</p>
        <input
          type="file"
          multiple
          // @ts-expect-error webkitdirectory for folder upload
          webkitdirectory=""
          className="text-sm"
          onChange={(e) => onFiles(e.target.files)}
        />
        {files.length > 0 && <p className="typo-meta mt-3">{files.length} Markdown files selected</p>}
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      {preview.length > 0 && (
        <div className="surface-bordered p-4">
          <h3 className="typo-caption mb-3">Preview structure</h3>
          <PreviewTree nodes={preview} />
        </div>
      )}

      <Button onClick={submit} disabled={loading || !name || files.length === 0 || errors.length > 0} loading={loading}>
        Create trace
      </Button>
    </div>
  );
}

function PreviewTree({ nodes, depth = 0 }: { nodes: ImportPreviewNode[]; depth?: number }) {
  return (
    <ul className="space-y-1" style={{ paddingLeft: depth * 12 }}>
      {nodes.map((n, i) => (
        <li key={`${depth}-${i}-${n.name}`} className="typo-body-sm">
          {n.type === "folder" ? `📁 ${n.name}` : `📄 ${n.name}`}
          {n.children && <PreviewTree nodes={n.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}
