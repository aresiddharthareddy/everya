import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">404</p>
      <h1 className="font-serif text-4xl tracking-tight">This page drifted off the shelf.</h1>
      <p className="mt-3 text-muted-foreground max-w-md">
        The story or workspace you wanted isn’t here. It may be private, unpublished, or moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/explore" className="h-10 px-5 inline-flex items-center rounded-full bg-foreground text-background text-sm font-medium">
          Explore stories
        </Link>
        <Link href="/" className="h-10 px-5 inline-flex items-center rounded-full border border-border text-sm font-medium">
          Home
        </Link>
      </div>
    </div>
  );
}
