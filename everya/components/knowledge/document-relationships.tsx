import Link from "next/link";
import { ArrowLeft, ArrowRight, Link2, Layers } from "lucide-react";
import type { DocumentLinkType } from "@prisma/client";
import { linkTypeLabel } from "@/services/document-links";

const icons: Partial<Record<DocumentLinkType, typeof Link2>> = {
  RELATED: Link2,
  REFERENCES: Link2,
  DEPENDS_ON: Layers,
  PREVIOUS: ArrowLeft,
  NEXT: ArrowRight,
  PART_OF: Layers,
};

export function DocumentRelationships({
  links,
}: {
  links: {
    id: string;
    type: DocumentLinkType;
    href: string;
    document: { title: string };
  }[];
}) {
  if (!links.length) return null;

  const grouped = links.reduce(
    (acc, link) => {
      (acc[link.type] ||= []).push(link);
      return acc;
    },
    {} as Record<DocumentLinkType, typeof links>
  );

  return (
    <section className="mt-10 pt-8 border-t border-border">
      <h2 className="typo-caption mb-4">Related in this trace</h2>
      <div className="space-y-4">
        {(Object.keys(grouped) as DocumentLinkType[]).map((type) => {
          const Icon = icons[type] || Link2;
          return (
            <div key={type}>
              <p className="typo-meta mb-2">{linkTypeLabel(type)}</p>
              <div className="divide-y divide-border surface-bordered overflow-hidden">
                {grouped[type].map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="flex items-center gap-2 px-4 py-3 typo-body-sm hover:bg-muted/40 motion-fast min-h-[44px]"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    {link.document.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
