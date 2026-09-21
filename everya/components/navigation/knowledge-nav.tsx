import { Breadcrumbs } from "@/components/repos/breadcrumbs";

/** Trace-ready hierarchical navigation — breadcrumbs wrapper for knowledge paths */
export function KnowledgeNav({
  items,
  label = "You are here",
}: {
  items: { label: string; href?: string }[];
  label?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <p className="typo-caption mb-2">{label}</p>
      <Breadcrumbs items={items} />
    </div>
  );
}
