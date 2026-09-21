import { AuthorIdentity } from "@/components/content/author-identity";

type RosterUser = {
  username: string;
  name: string | null;
  image: string | null;
  role: string;
};

export function TraceContributorsStrip({
  owner,
  members,
}: {
  owner: RosterUser;
  members: RosterUser[];
}) {
  if (!members.length) return null;

  return (
    <section className="mt-8 pt-6 border-t border-border">
      <h2 className="typo-caption mb-3">Contributors</h2>
      <div className="flex flex-wrap gap-4">
        <AuthorIdentity
          size="sm"
          name={owner.name}
          username={owner.username}
          image={owner.image}
          href={`/u/${owner.username}`}
          meta="Owner"
        />
        {members.map((m) => (
          <AuthorIdentity
            key={m.username}
            size="sm"
            name={m.name}
            username={m.username}
            image={m.image}
            href={`/u/${m.username}`}
            meta={m.role}
          />
        ))}
      </div>
    </section>
  );
}
