"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Scope = { publicationId: string; label: string } | { repositoryId: string; label: string };

export function PlanCreateForm({ scopes }: { scopes: Scope[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"MEMBER" | "PREMIUM">("MEMBER");
  const [priceCents, setPriceCents] = useState(500);
  const [scopeKey, setScopeKey] = useState(scopes[0] ? JSON.stringify(scopes[0]) : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!name.trim() || !scopeKey) return setError("Name and scope required");
    const scope = JSON.parse(scopeKey) as Scope;
    setLoading(true);
    try {
      const res = await fetch("/api/memberships/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          tier,
          priceCents,
          publicationId: "publicationId" in scope ? scope.publicationId : undefined,
          repositoryId: "repositoryId" in scope ? scope.repositoryId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.message || "Failed to create plan");
      setName("");
      setDescription("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  if (!scopes.length) {
    return <p className="text-sm text-muted-foreground">Create a publication or trace before adding plans.</p>;
  }

  return (
    <div className="stat-card p-5 space-y-4">
      <h2 className="font-medium">New membership plan</h2>
      <input className="input w-full border rounded-lg px-3 py-2 text-sm" placeholder="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className="input w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex flex-wrap gap-3">
        <select className="border rounded-lg px-3 py-2 text-sm" value={tier} onChange={(e) => setTier(e.target.value as "MEMBER" | "PREMIUM")}>
          <option value="MEMBER">Member tier</option>
          <option value="PREMIUM">Premium tier</option>
        </select>
        <input type="number" min={0} className="border rounded-lg px-3 py-2 text-sm w-28" value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))} />
        <span className="text-sm text-muted-foreground self-center">cents / month</span>
      </div>
      <select className="w-full border rounded-lg px-3 py-2 text-sm" value={scopeKey} onChange={(e) => setScopeKey(e.target.value)}>
        {scopes.map((s) => (
          <option key={JSON.stringify(s)} value={JSON.stringify(s)}>{s.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button size="sm" onClick={submit} disabled={loading}>{loading ? "Creating…" : "Create plan"}</Button>
    </div>
  );
}
