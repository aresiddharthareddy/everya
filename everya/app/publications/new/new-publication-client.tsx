"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="p-6 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New publication</CardTitle>
          <CardDescription>Create a home for your articles on EVERYA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="pub-name">
                Name
              </label>
              <Input
                id="pub-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="pub-handle">
                Handle
              </label>
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
              <p className="text-xs text-muted-foreground mt-1">everya.com/p/{handle || "your-handle"}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="pub-description">
                Description
              </label>
              <Textarea
                id="pub-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="pub-visibility">
                Visibility
              </label>
              <select
                id="pub-visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-full">
              {loading ? "Creating…" : "Create publication"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
