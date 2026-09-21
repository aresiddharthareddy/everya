import { TabsNav } from "@/components/ui/tabs";

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
    <TabsNav
      ariaLabel="Explore feed"
      activeId={active}
      items={tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        href: `/explore?tab=${tab.id}${q}`,
      }))}
    />
  );
}
