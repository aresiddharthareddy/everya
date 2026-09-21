import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { AuthorIdentity } from "@/components/content/author-identity";
import { FollowButton } from "@/components/social/follow-button";
import { PublicationFollowButton } from "@/components/social/publication-follow-button";

export function ReaderAuthorCard({
  author,
  bio,
  signedIn,
  isFollowing,
  isSelf,
  publicationHandle,
  publicationFollowing,
}: {
  author: { username: string; name: string | null; image: string | null; bio?: string | null };
  bio?: string | null;
  signedIn: boolean;
  isFollowing: boolean;
  isSelf: boolean;
  publicationHandle?: string;
  publicationFollowing?: boolean;
}) {
  return (
    <Surface variant="bordered" padding="md" className="my-12">
      <p className="typo-caption mb-4">About the author</p>
      <AuthorIdentity
        size="lg"
        name={author.name}
        username={author.username}
        image={author.image}
        href={`/u/${author.username}`}
      />
      {(bio || author.bio) && (
        <p className="typo-body-sm text-muted-foreground mt-4 leading-relaxed max-w-prose">{bio || author.bio}</p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <FollowButton username={author.username} initialFollowing={isFollowing} signedIn={signedIn} isSelf={isSelf} />
        {publicationHandle && (
          <PublicationFollowButton
            handle={publicationHandle}
            initialFollowing={publicationFollowing ?? false}
            signedIn={signedIn}
          />
        )}
        <Link href={`/u/${author.username}`} className="typo-body-sm text-muted-foreground hover:text-foreground motion-fast underline-offset-4 hover:underline">
          View profile
        </Link>
      </div>
    </Surface>
  );
}
