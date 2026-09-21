"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type SettingsUser = {
  name?: string | null;
  bio?: string | null;
  username?: string | null;
  email?: string | null;
};

function ProfileForm({
  username,
  email,
  initialName,
  initialBio,
}: {
  username: string;
  email: string;
  initialName: string;
  initialBio: string;
}) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not save profile");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your public profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="username">Username</label>
          <Input id="username" value={`@${username}`} disabled aria-readonly="true" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="email">Email</label>
          <Input id="email" value={email} disabled aria-readonly="true" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="display-name">Display name</label>
          <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="bio">Bio</label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button onClick={save}>{saved ? "Saved!" : "Save changes"}</Button>
      </CardContent>
    </Card>
  );
}

export function SettingsClient({ user }: { user: SettingsUser }) {
  const username = user.username || "";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <ProfileForm
        key={username}
        username={username}
        email={user.email || ""}
        initialName={user.name || ""}
        initialBio={user.bio || ""}
      />

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
          <Button
            variant="outline"
            className="rounded-full"
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
