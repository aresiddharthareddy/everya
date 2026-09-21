import { cn } from "@/lib/utils";

export function Spinner({
  className,
  size = "md",
  label = "Loading",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const sizes = { sm: "h-4 w-4 border", md: "h-5 w-5 border-2", lg: "h-8 w-8 border-2" };
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block rounded-full border-border border-t-foreground animate-spin",
        sizes[size],
        className
      )}
    />
  );
}
