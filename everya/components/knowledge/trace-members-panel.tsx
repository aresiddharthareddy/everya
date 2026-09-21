"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthorIdentity } from "@/components/content/author-identity";

type Member = {
  id: string;
  role: string;
  user: { username: string; name: string | null; image: string | null };
};

export function TraceMembersPanel({
  username,
  slug,
  members,
  ownerUsername,
}: {
  username: string;
  slug: string;
  members: Member[];
  ownerUsername: string;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [role, setRole] = useState<"CONTRIBUTOR" | "EDITOR">("CONTRIBUTOR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const api = `/api/traces/${username}/${slug}/members`;

  const addMember = async () => {
    setLoading(true);
    setError("");
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: invite.replace(/^@/, ""), role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not add member");
      return;
    }
    setInvite("");
    router.refresh();
  };

  const removeMember = async (memberUsername: string) => {
    const res = await fetch(api, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: memberUsername }),
    });
    if (res.ok) router.refresh();
  };

  return (
    <section className="mt-8 pt-6 border-t border-border">
      <h2 className="typo-caption mb-3">Contributors</h2>
      <div className="surface-bordered p-4 space-y-3">
        <AuthorIdentity
          size="sm"
          name={ownerUsername}
          username={ownerUsername}
          meta="Owner"
        />
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3">
            <AuthorIdentity size="sm" name={m.user.name} username={m.user.username} image={m.user.image} meta={m.role} />
            <Button variant="ghost" size="sm" onClick={() => removeMember(m.user.username)}>
              Remove
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <Input
            placeholder="@username"
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            className="max-w-[180px]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "CONTRIBUTOR" | "EDITOR")}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="EDITOR">Editor</option>
          </select>
          <Button size="sm" onClick={addMember} disabled={loading || !invite.trim()}>
            Add
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
