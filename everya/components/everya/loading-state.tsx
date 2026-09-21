export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
