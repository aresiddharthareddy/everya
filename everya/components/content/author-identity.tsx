import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatUsername } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function AuthorIdentity({
  name,
  username,
  image,
  href,
  meta,
  size = "md",
  className,
}: {
  name?: string | null;
  username: string;
  image?: string | null;
  href?: string;
  meta?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const display = name || formatUsername(username);
  const content = (
    <>
      <Avatar src={image} name={display} size={size} />
      <div className="min-w-0">
        <p className={cn("truncate", size === "sm" ? "typo-body-sm font-medium" : "typo-nav")}>{display}</p>
        {meta && <p className="typo-meta truncate">{meta}</p>}
      </div>
    </>
  );

  const base = cn("flex items-center gap-2.5 min-w-0", className);

  if (href) {
    return (
      <Link href={href} className={cn(base, "group hover:opacity-80 motion-fast")}>
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
