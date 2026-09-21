import type { RepositoryVisibility } from "@prisma/client";

export interface SearchResult {
  type: "document" | "repository" | "trace" | "publication" | "author";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export interface DocStats {
  avgRating: number;
  ratingCount: number;
  likeCount: number;
  readerCount: number;
  readingMinutesTotal: number;
  readingMinutes: number;
}

export interface TreeNode {
  id: string;
  name: string;
  slug: string;
  type: "folder" | "document";
  children?: TreeNode[];
  href?: string;
}

export interface RepositoryWithMeta {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: RepositoryVisibility;
  owner: { id: string; username: string; image: string | null };
  _count?: { documents: number };
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}
