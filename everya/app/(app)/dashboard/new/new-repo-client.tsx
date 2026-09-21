"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NewRepositoryClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/repositories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, visibility }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create");
      return;
    }
    const repo = await res.json();
    router.push(`/r/${repo.ownerUsername}/${repo.slug}`);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New repository</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create repository"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
