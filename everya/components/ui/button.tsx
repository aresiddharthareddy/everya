import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium motion-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90 shadow-sm",
        secondary: "bg-muted text-foreground border border-border hover:bg-muted/80",
        outline: "border border-border bg-background text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        link: "text-foreground underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2 min-w-[2.75rem]",
        sm: "h-9 rounded-md px-3 text-xs min-w-[2.5rem]",
        lg: "h-11 rounded-md px-6 text-base",
        icon: "h-10 w-10 min-w-[2.75rem]",
        "icon-sm": "h-9 w-9 min-w-[2.25rem]",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default", shape: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, loading, disabled, children, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, shape, className }))}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <Spinner
          size="sm"
          className={cn(
            "border-current/30 border-t-current",
            variant === "default" || variant === "destructive" ? "border-background/30 border-t-background" : ""
          )}
        />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
