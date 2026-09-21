import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppBrand({ className, href = "/explore" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("typo-caption tracking-[0.16em] text-foreground hover:opacity-80 motion-fast", className)}>
      EVERYA
    </Link>
  );
}
