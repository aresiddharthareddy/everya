import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfaceVariants = cva("", {
  variants: {
    variant: {
      flat: "surface-flat",
      bordered: "surface-bordered",
      elevated: "surface-elevated",
      featured: "surface-featured",
      interactive: "surface-interactive",
      inset: "surface-inset",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-8",
    },
  },
  defaultVariants: { variant: "bordered", padding: "none" },
});

export function Surface({
  className,
  variant,
  padding,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof surfaceVariants> & { as?: "div" | "section" | "article" }) {
  return <Tag className={cn(surfaceVariants({ variant, padding }), className)} {...props} />;
}

export { surfaceVariants };
