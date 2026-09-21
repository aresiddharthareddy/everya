import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentAccessLevel } from "@prisma/client";

export function PremiumPaywall({
  accessLevel,
  creatorUsername,
  signedIn,
}: {
  accessLevel: ContentAccessLevel;
  creatorUsername: string;
  signedIn: boolean;
}) {
  const label = accessLevel === "PREMIUM" ? "Premium" : "Members-only";
  return (
    <div className="my-10 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-4" strokeWidth={1.5} />
      <h2 className="font-serif text-xl mb-2">{label} content</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        {signedIn
          ? `Subscribe to @${creatorUsername} to read this document.`
          : "Sign in and become a member to access this content."}
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        {!signedIn && (
          <Link href="/login">
            <Button size="sm">Sign in</Button>
          </Link>
        )}
        <Link href={signedIn ? "/memberships" : `/u/${creatorUsername}`}>
          <Button variant="outline" size="sm">
            {signedIn ? "View memberships" : "View creator"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
