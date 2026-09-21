export type ContributorUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
};

export type DocumentContributor = {
  user: ContributorUser;
  roles: ("author" | "editor")[];
};

export function buildDocumentContributors(
  author: ContributorUser,
  editors: ContributorUser[],
  lastEditor?: ContributorUser | null
): DocumentContributor[] {
  const map = new Map<string, DocumentContributor>();
  map.set(author.id, { user: author, roles: ["author"] });

  for (const editor of editors) {
    const existing = map.get(editor.id);
    if (existing) {
      if (!existing.roles.includes("editor")) existing.roles.push("editor");
      continue;
    }
    map.set(editor.id, { user: editor, roles: ["editor"] });
  }

  if (lastEditor && lastEditor.id !== author.id && !map.has(lastEditor.id)) {
    map.set(lastEditor.id, { user: lastEditor, roles: ["editor"] });
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.roles.includes("author")) return -1;
    if (b.roles.includes("author")) return 1;
    return a.user.username.localeCompare(b.user.username);
  });
}
