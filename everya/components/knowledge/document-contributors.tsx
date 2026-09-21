import { AuthorIdentity } from "@/components/content/author-identity";

type Contributor = {
  user: { username: string; name: string | null; image: string | null };
  roles: ("author" | "editor")[];
};

export function DocumentContributors({ contributors }: { contributors: Contributor[] }) {
  const editors = contributors.filter((c) => c.roles.includes("editor"));
  if (!editors.length) return null;

  return (
    <section className="mt-10 pt-8 border-t border-border">
      <h2 className="typo-caption mb-4">Contributors</h2>
      <div className="flex flex-wrap gap-4">
        {contributors.map((c) => (
          <AuthorIdentity
            key={c.user.username}
            size="sm"
            name={c.user.name}
            username={c.user.username}
            image={c.user.image}
            href={`/u/${c.user.username}`}
            meta={c.roles.includes("author") ? "Author" : "Editor"}
          />
        ))}
      </div>
    </section>
  );
}
