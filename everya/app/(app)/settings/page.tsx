"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const user = session?.user as { name?: string; bio?: string; username?: string; email?: string } | undefined;
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.push("/login?next=/settings");
  }, [isPending, session, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio((user as { bio?: string }).bio || "");
    }
  }, [user]);

  const save = async () => {
    await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Username</label>
            <Input value={user?.username ? `@${user.username}` : ""} disabled />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
          <Button onClick={save}>{saved ? "Saved!" : "Save changes"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="rounded-full" onClick={async () => {
            await signOut();
            window.location.href = "/";
          }}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
