import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Surface variant="bordered" padding="lg" className="text-center" role="alert">
      <h3 className="typo-section-title">{title}</h3>
      {message && <p className="typo-body-sm text-muted-foreground mt-2 max-w-md mx-auto">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Surface>
  );
}
