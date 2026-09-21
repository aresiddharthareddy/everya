import type { DocumentLinkType } from "@prisma/client";
import type { TreeNode } from "@/types";

export type DocNavItem = { title: string; href: string };

export function flattenDocTree(tree: TreeNode[], basePath: string): DocNavItem[] {
  const out: DocNavItem[] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.type === "document") out.push({ title: n.name, href: `${basePath}/${n.slug}` });
      if (n.children) walk(n.children);
    }
  };
  walk(tree);
  return out;
}

export function treeSiblingNav(tree: TreeNode[], basePath: string, currentSlug: string) {
  const flat = flattenDocTree(tree, basePath);
  const i = flat.findIndex((d) => d.href.endsWith(`/${currentSlug}`));
  return {
    previous: i > 0 ? flat[i - 1] : null,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null,
  };
}

export function resolveDocNav(
  links: { type: DocumentLinkType; href: string; document: { title: string } }[],
  tree: TreeNode[],
  basePath: string,
  currentSlug: string
) {
  const siblings = treeSiblingNav(tree, basePath, currentSlug);
  const prevLink = links.find((l) => l.type === "PREVIOUS");
  const nextLink = links.find((l) => l.type === "NEXT");
  return {
    previous: prevLink
      ? { title: prevLink.document.title, href: prevLink.href }
      : siblings.previous,
    next: nextLink ? { title: nextLink.document.title, href: nextLink.href } : siblings.next,
    traceHref: basePath,
  };
}
