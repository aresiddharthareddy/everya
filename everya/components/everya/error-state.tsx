import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-8 text-center" role="alert">
      <h3 className="font-medium">{title}</h3>
      {message && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
