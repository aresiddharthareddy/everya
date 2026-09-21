import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function FormField({
  id,
  label,
  description,
  error,
  success,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const describedBy = [
    description ? `${id}-description` : null,
    error ? `${id}-error` : null,
    success ? `${id}-success` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
      </Label>
      {description && (
        <p id={`${id}-description`} className="typo-meta">
          {description}
        </p>
      )}
      <div
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
      >
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className="typo-body-sm text-error" role="alert">
          {error}
        </p>
      )}
      {success && !error && (
        <p id={`${id}-success`} className="typo-body-sm text-success">
          {success}
        </p>
      )}
    </div>
  );
}
