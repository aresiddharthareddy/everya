"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Surface } from "@/components/ui/surface";
import { slugify } from "@/lib/utils";

export function NewPublicationClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onNameChange = (value: string) => {
    setName(value);
    if (!handleTouched) setHandle(slugify(value));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/publications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, handle, description, visibility }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create publication");
      return;
    }
    const publication = await res.json();
    router.push(`/p/${publication.handle}`);
  };

  return (
    <Surface variant="bordered" padding="md">
      <form onSubmit={submit} className="space-y-4">
        <FormField id="pub-name" label="Name" required>
          <Input id="pub-name" value={name} onChange={(e) => onNameChange(e.target.value)} required />
        </FormField>
        <FormField id="pub-handle" label="Handle" description={`everya.com/p/${handle || "your-handle"}`} required>
          <Input
            id="pub-handle"
            value={handle}
            onChange={(e) => {
              setHandleTouched(true);
              setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            required
            pattern="[a-z0-9-]+"
          />
        </FormField>
        <FormField id="pub-description" label="Description">
          <Textarea id="pub-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </FormField>
        <FormField id="pub-visibility" label="Visibility">
          <select
            id="pub-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 typo-body-sm"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </FormField>
        {error && <p className="typo-body-sm text-error" role="alert">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Create publication
        </Button>
      </form>
    </Surface>
  );
}
