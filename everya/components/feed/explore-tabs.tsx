import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
  { id: "latest", label: "Latest" },
  { id: "trending", label: "Trending" },
] as const;

export type ExploreTab = (typeof tabs)[number]["id"];

export function ExploreTabs({ active, tag }: { active: ExploreTab; tag?: string }) {
  const q = tag ? `&tag=${tag}` : "";
  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/explore?tab=${tab.id}${q}`}
          className={cn(
            "px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px",
            active === tab.id
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
