import { FileText, FolderGit2, Newspaper, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { productTerms } from "@/lib/design-system";

const config = {
  article: { label: productTerms.article, icon: FileText },
  document: { label: productTerms.document, icon: FileText },
  publication: { label: productTerms.publication, icon: Newspaper },
  collection: { label: productTerms.collection, icon: FolderGit2 },
  author: { label: productTerms.author, icon: User },
} as const;

export type ContentType = keyof typeof config;

export function ContentTypeBadge({ type }: { type: ContentType }) {
  const { label, icon: Icon } = config[type];
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}
