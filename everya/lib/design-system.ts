/** EveryA design system constants — keep in sync with globals.css */

export const spacing = {
  pageX: "px-page",
  pageY: "py-page",
  section: "gap-section",
  stack: "gap-stack",
  inline: "gap-inline",
} as const;

export const typography = {
  display: "typo-display",
  pageTitle: "typo-page-title",
  sectionTitle: "typo-section-title",
  articleTitle: "typo-article-title",
  articleSubtitle: "typo-article-subtitle",
  body: "typo-body",
  bodySm: "typo-body-sm",
  meta: "typo-meta",
  nav: "typo-nav",
  label: "typo-label",
  caption: "typo-caption",
  code: "typo-code",
} as const;

export const surface = {
  flat: "surface-flat",
  bordered: "surface-bordered",
  elevated: "surface-elevated",
  featured: "surface-featured",
  interactive: "surface-interactive",
  inset: "surface-inset",
} as const;

export const motion = {
  fast: "motion-fast",
  normal: "motion-normal",
  slow: "motion-slow",
} as const;

/** Product terminology — UI copy only; DB models unchanged */
export const productTerms = {
  article: "Article",
  document: "Document",
  publication: "Publication",
  collection: "Collection",
  trace: "Trace",
  author: "Author",
  creator: "Creator",
  library: "Library",
  topic: "Topic",
  clap: "Clap",
  response: "Response",
  reply: "Reply",
} as const;
