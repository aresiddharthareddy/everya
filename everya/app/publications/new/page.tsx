import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/session";
import { NewPublicationClient } from "./new-publication-client";

export default async function NewPublicationPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/publications/new");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-lg px-6 h-14 flex items-center">
          <Link href="/" className="font-semibold text-xs tracking-[0.16em]">
            EVERYA
          </Link>
        </div>
      </header>
      <NewPublicationClient />
    </div>
  );
}
