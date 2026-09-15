"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-3xl tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The page failed to load. Try again — your draft and session are still here.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
